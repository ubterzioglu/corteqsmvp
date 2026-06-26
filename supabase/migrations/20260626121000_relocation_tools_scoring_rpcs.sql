-- Relocation Tools — generic session RPC'leri + ortak skorlama yardımcıları.
-- Sözleşme: docs/10tool/00 §"RLS ve RPC sözleşmesi" + §"Ortak RPC isimleri".
-- security definer; kullanıcı-facing. Hata kodları çıplak snake_case ('rl_*' — relocation ailesi).
--
-- AYNA SÖZLEŞMESİ: rl_tool_weighted_score + rl_tool_clamp_neutral mantığı
-- src/lib/relocation-tools-ranking.ts ile birebir (relocation-tools-ranking.test.ts kilitler).
-- Araca özel relocation_score_<tool>_v1 RPC'leri her araç fazında ayrı migration ile gelir;
-- relocation_tool_complete_session içindeki dispatcher onları tool_key'e göre çağırır.

-- ---------------------------------------------------------------------------
-- Yardımcılar
-- ---------------------------------------------------------------------------
create or replace function public.rl_tool_require_user()
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'rl_auth_required';
  end if;
  return v_uid;
end;
$$;

-- null/bilinmiyor → nötr 0.5; aralık dışı → kırp (relocation-tools-ranking.ts clamp01OrNeutral aynası).
create or replace function public.rl_tool_clamp_neutral(p_value numeric)
returns numeric
language sql
immutable
set search_path = public
as $$
  select case
    when p_value is null then 0.5
    when p_value < 0 then 0
    when p_value > 1 then 1
    else p_value
  end::numeric;
$$;

-- Ağırlıklı skor (0..1): sum(breakdown[k] * weights[k]) / sum(weights). Eksik anahtar nötr 0.5.
-- relocation-tools-ranking.ts computeWeightedScore ile birebir.
create or replace function public.rl_tool_weighted_score(p_breakdown jsonb, p_weights jsonb)
returns numeric
language sql
immutable
set search_path = public
as $$
  with w as (
    select key as dim, value::numeric as weight
    from jsonb_each_text(coalesce(p_weights, '{}'::jsonb))
  )
  select case
    when coalesce(sum(w.weight), 0) = 0 then 0
    else round(
      sum(public.rl_tool_clamp_neutral((p_breakdown ->> w.dim)::numeric) * w.weight) / sum(w.weight),
      4
    )
  end
  from w;
$$;

-- Oturum sahipliği doğrula + satırı döndür.
create or replace function public.rl_tool_owned_session(p_session_id uuid)
returns public.relocation_tool_sessions
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := public.rl_tool_require_user();
  v_session public.relocation_tool_sessions%rowtype;
begin
  select * into v_session from public.relocation_tool_sessions where id = p_session_id;
  if not found then
    raise exception 'rl_session_not_found';
  end if;
  if v_session.user_id <> v_uid then
    raise exception 'rl_forbidden';
  end if;
  return v_session;
end;
$$;

-- Bir oturumun cevaplarını { question_key: answer } jsonb olarak toplar (skor RPC'leri kullanır).
create or replace function public.rl_tool_answers_json(p_session_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(jsonb_object_agg(question_key, answer), '{}'::jsonb)
  from public.relocation_tool_answers
  where session_id = p_session_id;
$$;

-- Skor RPC'lerinin sonuç yazmak için çağırdığı ortak yazıcı.
create or replace function public.rl_tool_write_result(
  p_session_id uuid,
  p_result_kind text,
  p_total_score numeric,
  p_score_bucket text,
  p_primary_result jsonb,
  p_sub_scores jsonb,
  p_recommendations jsonb,
  p_explanations jsonb,
  p_ctas jsonb,
  p_source_quality jsonb default '{}'::jsonb,
  p_model_version text default 'rule-v1'
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_session public.relocation_tool_sessions%rowtype;
  v_result_id uuid;
begin
  select * into v_session from public.relocation_tool_sessions where id = p_session_id;

  delete from public.relocation_tool_results where session_id = p_session_id;

  insert into public.relocation_tool_results (
    session_id, user_id, tool_key, result_kind, total_score, score_bucket,
    primary_result, sub_scores, recommendations, explanations, ctas, source_quality, model_version
  ) values (
    p_session_id, v_session.user_id, v_session.tool_key, p_result_kind, p_total_score, p_score_bucket,
    coalesce(p_primary_result, '{}'::jsonb), coalesce(p_sub_scores, '{}'::jsonb),
    coalesce(p_recommendations, '[]'::jsonb), coalesce(p_explanations, '[]'::jsonb),
    coalesce(p_ctas, '[]'::jsonb), coalesce(p_source_quality, '{}'::jsonb), p_model_version
  )
  returning id into v_result_id;

  update public.relocation_tool_sessions
    set status = 'completed', completed_at = now()
    where id = p_session_id;

  return jsonb_build_object(
    'result_id', v_result_id,
    'tool_key', v_session.tool_key,
    'result_kind', p_result_kind,
    'total_score', p_total_score,
    'score_bucket', p_score_bucket,
    'primary_result', coalesce(p_primary_result, '{}'::jsonb),
    'sub_scores', coalesce(p_sub_scores, '{}'::jsonb),
    'recommendations', coalesce(p_recommendations, '[]'::jsonb),
    'explanations', coalesce(p_explanations, '[]'::jsonb),
    'ctas', coalesce(p_ctas, '[]'::jsonb)
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- 1) relocation_tool_start_session
-- ---------------------------------------------------------------------------
create or replace function public.relocation_tool_start_session(
  p_tool_key text,
  p_mode text,
  p_source_move_id uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := public.rl_tool_require_user();
  v_tool public.relocation_tools%rowtype;
  v_session_id uuid;
begin
  select * into v_tool from public.relocation_tools where key = p_tool_key and is_active;
  if not found then
    raise exception 'rl_tool_not_found';
  end if;
  if p_mode not in ('quick','detailed') then
    raise exception 'rl_invalid_mode';
  end if;

  insert into public.relocation_tool_sessions (user_id, tool_key, mode, status, source_move_id)
  values (v_uid, p_tool_key, p_mode, 'in_progress', p_source_move_id)
  returning id into v_session_id;

  insert into public.relocation_tool_events (user_id, session_id, tool_key, event_type, context)
  values (v_uid, v_session_id, p_tool_key, 'start', jsonb_build_object('mode', p_mode));

  return jsonb_build_object('session_id', v_session_id, 'tool_key', p_tool_key, 'mode', p_mode);
end;
$$;

-- ---------------------------------------------------------------------------
-- 2) relocation_tool_save_answer (idempotent upsert)
-- ---------------------------------------------------------------------------
create or replace function public.relocation_tool_save_answer(
  p_session_id uuid,
  p_question_key text,
  p_answer jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_session public.relocation_tool_sessions%rowtype := public.rl_tool_owned_session(p_session_id);
begin
  if p_question_key is null or p_question_key = '' then
    raise exception 'rl_question_key_required';
  end if;

  insert into public.relocation_tool_answers (session_id, question_key, answer)
  values (p_session_id, p_question_key, coalesce(p_answer, 'null'::jsonb))
  on conflict (session_id, question_key)
  do update set answer = excluded.answer, answered_at = now();
end;
$$;

-- ---------------------------------------------------------------------------
-- 3) relocation_tool_complete_session — tool_key'e göre skor RPC'si dispatch eder
-- ---------------------------------------------------------------------------
create or replace function public.relocation_tool_complete_session(p_session_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_session public.relocation_tool_sessions%rowtype := public.rl_tool_owned_session(p_session_id);
  v_tool public.relocation_tools%rowtype;
  v_score_fn text;
  v_exists boolean;
  v_result jsonb;
begin
  select * into v_tool from public.relocation_tools where key = v_session.tool_key;

  -- Araç başına skor RPC adı: relocation_score_<tool_key>_v1(uuid).
  v_score_fn := 'relocation_score_' || v_session.tool_key || '_v1';

  select exists (
    select 1 from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = v_score_fn
  ) into v_exists;

  if v_exists then
    -- Skor RPC'si sonucu rl_tool_write_result ile yazar ve döner.
    execute format('select public.%I($1)', v_score_fn) into v_result using p_session_id;
    insert into public.relocation_tool_events (user_id, session_id, tool_key, event_type)
    values (v_session.user_id, p_session_id, v_session.tool_key, 'complete');
    return v_result;
  end if;

  -- Skor RPC'si henüz yoksa (engine kuruldu, araç eklenmedi): boş/nötr sonuç yaz.
  v_result := public.rl_tool_write_result(
    p_session_id, coalesce(v_tool.result_kind, 'score'),
    null, null, '{}'::jsonb, '{}'::jsonb, '[]'::jsonb,
    jsonb_build_array('Bu araç için skor modeli henüz tanımlı değil.'),
    '[]'::jsonb, '{}'::jsonb, 'rule-v1'
  );
  insert into public.relocation_tool_events (user_id, session_id, tool_key, event_type)
  values (v_session.user_id, p_session_id, v_session.tool_key, 'complete');
  return v_result;
end;
$$;

-- ---------------------------------------------------------------------------
-- 4) relocation_tool_record_event
-- ---------------------------------------------------------------------------
create or replace function public.relocation_tool_record_event(
  p_session_id uuid,
  p_event_type text,
  p_context jsonb default '{}'::jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := public.rl_tool_require_user();
  v_tool_key text;
begin
  if p_session_id is not null then
    select tool_key into v_tool_key from public.relocation_tool_sessions
    where id = p_session_id and user_id = v_uid;
    if v_tool_key is null then
      raise exception 'rl_forbidden';
    end if;
  end if;

  insert into public.relocation_tool_events (user_id, session_id, tool_key, event_type, context)
  values (v_uid, p_session_id, coalesce(v_tool_key, (p_context ->> 'tool_key')),
          p_event_type, coalesce(p_context, '{}'::jsonb));
end;
$$;

-- ---------------------------------------------------------------------------
-- Grants — authenticated kullanıcıya (RLS + security definer ile korunur)
-- ---------------------------------------------------------------------------
grant execute on function public.relocation_tool_start_session(text, text, uuid) to authenticated;
grant execute on function public.relocation_tool_save_answer(uuid, text, jsonb) to authenticated;
grant execute on function public.relocation_tool_complete_session(uuid) to authenticated;
grant execute on function public.relocation_tool_record_event(uuid, text, jsonb) to authenticated;
-- Ortak skorlama yardımcıları (araç skor RPC'leri içinden çağrılır):
grant execute on function public.rl_tool_weighted_score(jsonb, jsonb) to authenticated;
grant execute on function public.rl_tool_clamp_neutral(numeric) to authenticated;
grant execute on function public.rl_tool_answers_json(uuid) to authenticated;
