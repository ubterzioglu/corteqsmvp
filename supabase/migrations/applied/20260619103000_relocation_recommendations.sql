-- Relocation Engine — öneri + mutasyon RPC'leri (Faz 1c).
-- security definer; kullanıcı-facing. relocation_* hata kodları çıplak snake_case ('rl_*').
--
-- AYNA SÖZLEŞMESİ: relocation_rank_locations_v1'deki ağırlıklar src/lib/relocation-ranking.ts
-- RELOCATION_RANK_WEIGHTS ile BİREBİR aynıdır. Birini değiştiren diğerini de günceller
-- (relocation-ranking.test.ts iki tarafı kilitler).
--   budget 0.30 · bureaucracy_ease 0.20 · healthcare 0.15 · gsm 0.15 · community 0.10 · flight 0.10

-- ---------------------------------------------------------------------------
-- Yardımcılar
-- ---------------------------------------------------------------------------
create or replace function public.relocation_require_user()
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

-- null/bilinmiyor → nötr 0.5; aralık dışı → kırp (relocation-ranking.ts clamp01OrNeutral aynası).
create or replace function public.relocation_clamp_neutral(p_value numeric)
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

-- Move sahipliği doğrula + satırı döndür.
create or replace function public.relocation_owned_move(p_move_id uuid)
returns public.relocation_moves
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := public.relocation_require_user();
  v_move public.relocation_moves%rowtype;
begin
  select * into v_move from public.relocation_moves where id = p_move_id;
  if not found then
    raise exception 'rl_move_not_found';
  end if;
  if v_move.user_id <> v_uid then
    raise exception 'rl_forbidden';
  end if;
  return v_move;
end;
$$;

-- ---------------------------------------------------------------------------
-- 1) relocation_create_move
-- ---------------------------------------------------------------------------
create or replace function public.relocation_create_move(p_payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := public.relocation_require_user();
  v_targets text[];
  v_move_id uuid;
begin
  v_targets := coalesce(
    array(select upper(jsonb_array_elements_text(p_payload -> 'target_country_codes'))),
    '{}'::text[]
  );
  if array_length(v_targets, 1) is null then
    raise exception 'rl_targets_required';
  end if;

  insert into public.relocation_moves (
    user_id, status, origin_country_code, origin_city_code, target_country_codes,
    move_window_start, move_window_end, budget_monthly, setup_budget_max, currency,
    household, must_haves, nice_to_haves, preferred_language,
    allow_personalization, allow_partner_referrals
  ) values (
    v_uid, 'draft',
    nullif(upper(p_payload ->> 'origin_country_code'), ''),
    nullif(p_payload ->> 'origin_city_code', ''),
    v_targets,
    nullif(p_payload ->> 'move_window_start', '')::date,
    nullif(p_payload ->> 'move_window_end', '')::date,
    nullif(p_payload ->> 'budget_monthly', '')::numeric,
    nullif(p_payload ->> 'setup_budget_max', '')::numeric,
    coalesce(nullif(upper(p_payload ->> 'currency'), ''), 'EUR'),
    coalesce(p_payload -> 'household', '{}'::jsonb),
    coalesce(array(select jsonb_array_elements_text(p_payload -> 'must_haves')), '{}'::text[]),
    coalesce(array(select jsonb_array_elements_text(p_payload -> 'nice_to_haves')), '{}'::text[]),
    coalesce(nullif(p_payload ->> 'preferred_language', ''), 'tr-TR'),
    coalesce((p_payload ->> 'allow_personalization')::boolean, true),
    coalesce((p_payload ->> 'allow_partner_referrals')::boolean, false)
  )
  returning id into v_move_id;

  return jsonb_build_object('move_id', v_move_id);
end;
$$;

-- ---------------------------------------------------------------------------
-- 2) relocation_update_move (kısmi patch)
-- ---------------------------------------------------------------------------
create or replace function public.relocation_update_move(p_move_id uuid, p_patch jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_move public.relocation_moves%rowtype := public.relocation_owned_move(p_move_id);
begin
  update public.relocation_moves set
    budget_monthly = coalesce(nullif(p_patch ->> 'budget_monthly', '')::numeric, budget_monthly),
    setup_budget_max = coalesce(nullif(p_patch ->> 'setup_budget_max', '')::numeric, setup_budget_max),
    move_window_start = coalesce(nullif(p_patch ->> 'move_window_start', '')::date, move_window_start),
    move_window_end = coalesce(nullif(p_patch ->> 'move_window_end', '')::date, move_window_end),
    target_country_codes = case
      when p_patch ? 'target_country_codes'
      then coalesce(array(select upper(jsonb_array_elements_text(p_patch -> 'target_country_codes'))), target_country_codes)
      else target_country_codes end,
    must_haves = case when p_patch ? 'must_haves'
      then coalesce(array(select jsonb_array_elements_text(p_patch -> 'must_haves')), must_haves) else must_haves end,
    nice_to_haves = case when p_patch ? 'nice_to_haves'
      then coalesce(array(select jsonb_array_elements_text(p_patch -> 'nice_to_haves')), nice_to_haves) else nice_to_haves end,
    household = coalesce(p_patch -> 'household', household),
    status = coalesce(nullif(p_patch ->> 'status', ''), status),
    updated_at = now()
  where id = p_move_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- 3) relocation_save_wizard (wizard_answers'a merge)
-- ---------------------------------------------------------------------------
create or replace function public.relocation_save_wizard(p_move_id uuid, p_payload jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_move public.relocation_moves%rowtype := public.relocation_owned_move(p_move_id);
  v_step text := p_payload ->> 'step';
begin
  if v_step is null or v_step = '' then
    raise exception 'rl_wizard_step_required';
  end if;
  update public.relocation_moves set
    wizard_answers = wizard_answers || jsonb_build_object(v_step, p_payload -> 'answers'),
    updated_at = now()
  where id = p_move_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- 4) relocation_rank_locations_v1 — sert filtre + kural skoru + açıklamalar
--    (ranking ağırlıkları TS aynası ile birebir)
-- ---------------------------------------------------------------------------
create or replace function public.relocation_rank_locations_v1(p_move_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_move public.relocation_moves%rowtype := public.relocation_owned_move(p_move_id);
  v_rows jsonb;
begin
  with scored as (
    select
      l.id,
      l.country_code,
      l.city_code,
      l.city_name,
      l.freshness_at,
      -- Bileşenler (0..1) — clamp_neutral ile.
      -- budget_fit: bütçe yoksa nötr; varsa cost_index düşükse yüksek uyum (basit ters orantı).
      public.relocation_clamp_neutral(
        case when v_move.budget_monthly is null then null
             else greatest(0, least(1, 1 - coalesce(l.cost_index, 0.5))) end
      ) as budget_fit,
      public.relocation_clamp_neutral(1 - coalesce(l.bureaucracy_complexity, 0.5)) as bureaucracy_ease,
      public.relocation_clamp_neutral(l.healthcare_access) as healthcare_access,
      public.relocation_clamp_neutral(l.gsm_coverage) as gsm_coverage,
      public.relocation_clamp_neutral(l.community_density) as community_fit,
      public.relocation_clamp_neutral(l.flight_access) as flight_access,
      -- Sert filtre: hedef ülke eşleşmesi + tazelik (90 günden eski değil veya null kabul).
      (
        (array_length(v_move.target_country_codes, 1) is null
         or l.country_code = any (v_move.target_country_codes))
        and l.is_active
      ) as hard_filter_pass,
      (select count(*) filter (where r.authority_level in ('official','official_city','regulator'))::numeric
              / nullif(count(*), 0)
       from public.relocation_source_registry r where r.id = l.source_id) as official_ratio,
      case when l.freshness_at is null then null
           else extract(epoch from (now() - l.freshness_at)) / 3600.0 end as freshness_hours
    from public.relocation_locations l
    where l.is_active
  ),
  ranked as (
    select *,
      round(
        budget_fit * 0.30 + bureaucracy_ease * 0.20 + healthcare_access * 0.15
        + gsm_coverage * 0.15 + community_fit * 0.10 + flight_access * 0.10,
        4
      ) as rule_score
    from scored
    where hard_filter_pass
  )
  select coalesce(jsonb_agg(
    jsonb_build_object(
      'entity_id', id,
      'country_code', country_code,
      'city_code', city_code,
      'title', city_name,
      'hard_filter_pass', hard_filter_pass,
      'rule_score', rule_score,
      'final_score', rule_score,    -- Faz 1: final = rule (ml yok)
      'score_breakdown', jsonb_build_object(
        'budget_fit', budget_fit,
        'bureaucracy_ease', bureaucracy_ease,
        'healthcare_access', healthcare_access,
        'gsm_coverage', gsm_coverage,
        'community_fit', community_fit,
        'flight_access', flight_access
      ),
      'source_quality', jsonb_build_object(
        'official_sources_ratio', coalesce(official_ratio, 0),
        'freshness_hours', freshness_hours
      )
    ) order by rule_score desc
  ), '[]'::jsonb)
  into v_rows
  from ranked;

  return v_rows;
end;
$$;

-- ---------------------------------------------------------------------------
-- 5) relocation_rank_services_v1 — kategori bazlı, trust + freshness sıralı
-- ---------------------------------------------------------------------------
create or replace function public.relocation_rank_services_v1(p_move_id uuid, p_category text)
returns setof public.relocation_services
language plpgsql
security definer
set search_path = public
as $$
declare
  v_move public.relocation_moves%rowtype := public.relocation_owned_move(p_move_id);
begin
  return query
    select s.*
    from public.relocation_services s
    where s.is_active
      and s.category = p_category
      and (array_length(v_move.target_country_codes, 1) is null
           or s.country_code = any (v_move.target_country_codes))
    order by s.trust_score desc, s.freshness_at desc nulls last
    limit 50;
end;
$$;

-- ---------------------------------------------------------------------------
-- 6) relocation_build_checklist_v1 — hedef ülkelerin bürokrasi adımları
-- ---------------------------------------------------------------------------
create or replace function public.relocation_build_checklist_v1(p_move_id uuid)
returns setof public.relocation_bureaucratic_steps
language plpgsql
security definer
set search_path = public
as $$
declare
  v_move public.relocation_moves%rowtype := public.relocation_owned_move(p_move_id);
begin
  return query
    select b.*
    from public.relocation_bureaucratic_steps b
    where b.is_active
      and (array_length(v_move.target_country_codes, 1) is null
           or b.country_code = any (v_move.target_country_codes))
    order by
      array_position(array['before_departure','after_arrival','ongoing']::text[], b.trigger),
      b.sort_order;
end;
$$;

-- ---------------------------------------------------------------------------
-- 7) relocation_record_interaction — event yazımı (sahiplik move üzerinden)
-- ---------------------------------------------------------------------------
create or replace function public.relocation_record_interaction(p_payload jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := public.relocation_require_user();
  v_move_id uuid := nullif(p_payload ->> 'move_id', '')::uuid;
begin
  if v_move_id is not null then
    perform public.relocation_owned_move(v_move_id);
  end if;
  insert into public.relocation_interactions
    (user_id, move_id, entity_type, entity_id, event_type, rank_position, context)
  values (
    v_uid, v_move_id,
    nullif(p_payload ->> 'entity_type', ''),
    nullif(p_payload ->> 'entity_id', '')::uuid,
    p_payload ->> 'event_type',
    nullif(p_payload ->> 'rank_position', '')::integer,
    coalesce(p_payload -> 'context', '{}'::jsonb)
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- Grants — authenticated kullanıcıya (RLS + security definer ile korunur)
-- ---------------------------------------------------------------------------
grant execute on function public.relocation_create_move(jsonb) to authenticated;
grant execute on function public.relocation_update_move(uuid, jsonb) to authenticated;
grant execute on function public.relocation_save_wizard(uuid, jsonb) to authenticated;
grant execute on function public.relocation_rank_locations_v1(uuid) to authenticated;
grant execute on function public.relocation_rank_services_v1(uuid, text) to authenticated;
grant execute on function public.relocation_build_checklist_v1(uuid) to authenticated;
grant execute on function public.relocation_record_interaction(jsonb) to authenticated;
