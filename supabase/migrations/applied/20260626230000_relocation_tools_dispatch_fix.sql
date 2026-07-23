-- ---------------------------------------------------------------------------
-- relocation_tool_complete_session — skor RPC dispatch DÜZELTMESİ
-- ---------------------------------------------------------------------------
-- Sorun: önceki sürüm skor fonksiyonunu 'relocation_score_' || tool_key || '_v1'
-- şeklinde TÜRETİYORDU. Ancak docs/10tool/00 (tek doğru kaynak) skor RPC adlarını
-- KISALTILMIŞ olarak tanımlıyor; 5 araçta türetilen ad ile gerçek fonksiyon adı
-- uyuşmuyordu, bu yüzden bu araçlar tamamlandığında nötr "skor modeli tanımlı değil"
-- sonucu yazılıyordu:
--   relocation_readiness        -> relocation_score_readiness_v1   (türetme: ..._relocation_readiness_v1)
--   top_relocation_challenge    -> relocation_score_top_challenge_v1
--   career_path_abroad          -> relocation_score_career_path_v1
--   first_90_days_planner       -> relocation_score_first_90_days_v1
--   job_finding_probability     -> relocation_score_job_probability_v1
--
-- Çözüm: tool_key -> fonksiyon adı AÇIK haritası (docs/00 sözleşmesi ile birebir).
-- Haritada olmayan araçlar için 'relocation_score_' || tool_key || '_v1' yedeği
-- korunur (zaten uyumlu 5 araç + ileride sözleşmeye uyacak yeni araçlar çalışır).
-- create or replace — idempotent; sadece dispatcher'ı değiştirir, skor mantığına dokunmaz.

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

  -- tool_key -> skor RPC adı (docs/10tool/00 sözleşmesi ile birebir).
  v_score_fn := case v_session.tool_key
    when 'relocation_readiness'      then 'relocation_score_readiness_v1'
    when 'top_relocation_challenge'  then 'relocation_score_top_challenge_v1'
    when 'career_path_abroad'        then 'relocation_score_career_path_v1'
    when 'first_90_days_planner'     then 'relocation_score_first_90_days_v1'
    when 'job_finding_probability'   then 'relocation_score_job_probability_v1'
    -- Sözleşmeye uyan araçlar (city_match, country_match, diaspora_matchmaker,
    -- expat_lifestyle_persona, profession_salary) + ileride eklenecek araçlar:
    else 'relocation_score_' || v_session.tool_key || '_v1'
  end;

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

  -- Skor RPC'si yoksa: boş/nötr sonuç yaz.
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

grant execute on function public.relocation_tool_complete_session(uuid) to authenticated;
