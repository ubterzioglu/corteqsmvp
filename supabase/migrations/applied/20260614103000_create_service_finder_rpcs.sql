-- Service Finder RPC katmanı (scrapper_plan.md §RLS and RPC model).
-- admin_*  : SECURITY DEFINER, is_admin(auth.uid()) zorunlu, authenticated'a grant.
-- worker_* : yalnızca service_role'e grant — worker SUPABASE_SERVICE_ROLE_KEY ile bağlanır.
-- Hata kodları cadde deseni gibi çıplak snake_case'tir ('sf_*') ve
-- src/lib/service-finder-format.ts içindeki Türkçe mesaj haritasına eklenir.

-- ---------------------------------------------------------------------------
-- Yardımcılar
-- ---------------------------------------------------------------------------
create or replace function public.service_finder_require_admin()
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'sf_auth_required';
  end if;
  if not public.is_admin(v_uid) then
    raise exception 'sf_admin_required';
  end if;
  return v_uid;
end;
$$;

-- Importer'daki slugify'ın SQL aynası (scripts/catalog-role-importer.mjs:3).
create or replace function public.service_finder_slugify(p_value text)
returns text
language sql
immutable
set search_path = public
as $$
  select left(
    regexp_replace(
      regexp_replace(
        lower(translate(
          coalesce(p_value, ''),
          'ıİğĞüÜşŞöÖçÇäÄßéèêáàâúùûíìî',
          'iigguussooccaasseeeaaauuuiii'
        )),
        '[^a-z0-9]+', '-', 'g'
      ),
      '(^-+|-+$)', '', 'g'
    ),
    96
  );
$$;

create or replace function public.service_finder_text_array(p_value jsonb)
returns text[]
language sql
immutable
set search_path = public
as $$
  select case
    when p_value is null or jsonb_typeof(p_value) <> 'array' then '{}'::text[]
    else coalesce(array(select jsonb_array_elements_text(p_value)), '{}'::text[])
  end;
$$;

-- ---------------------------------------------------------------------------
-- 1) admin_create_service_finder_job
-- ---------------------------------------------------------------------------
create or replace function public.admin_create_service_finder_job(p_payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := public.service_finder_require_admin();
  v_template public.service_finder_profession_templates%rowtype;
  v_role_key text;
  v_item_type text;
  v_category_slug text;
  v_title text := nullif(trim(coalesce(p_payload ->> 'title', '')), '');
  v_location_label text := nullif(trim(coalesce(p_payload ->> 'location_label', '')), '');
  v_soft numeric(12,4) := coalesce((p_payload ->> 'soft_cap_usd')::numeric, 3.0000);
  v_hard numeric(12,4) := coalesce((p_payload ->> 'hard_cap_usd')::numeric, 5.0000);
  v_search_provider uuid;
  v_extract_provider uuid;
  v_classifier_provider uuid;
  v_job_id uuid;
begin
  if v_title is null then
    raise exception 'sf_title_required';
  end if;
  if v_location_label is null then
    raise exception 'sf_location_required';
  end if;
  if v_soft <= 0 or v_hard <= 0 or v_hard < v_soft then
    raise exception 'sf_invalid_budget';
  end if;

  if p_payload ->> 'template_id' is not null then
    select * into v_template
    from public.service_finder_profession_templates
    where id = (p_payload ->> 'template_id')::uuid and is_active = true;
    if not found then
      raise exception 'sf_template_not_found';
    end if;
  end if;

  v_role_key := coalesce(nullif(p_payload ->> 'role_key', ''), v_template.role_key);
  v_item_type := coalesce(nullif(p_payload ->> 'item_type', ''), v_template.item_type);
  v_category_slug := coalesce(nullif(p_payload ->> 'category_slug', ''), v_template.category_slug);

  if v_role_key is null or v_item_type is null then
    raise exception 'sf_role_required';
  end if;
  if not exists (select 1 from public.roles where key = v_role_key and is_active = true) then
    raise exception 'sf_invalid_role';
  end if;

  -- Sağlayıcı çözümlemesi: payload > etkin + en düşük priority
  v_search_provider := coalesce(
    (p_payload ->> 'search_provider_id')::uuid,
    (select id from public.service_finder_provider_configs
      where provider_kind = 'search' and is_enabled = true
      order by priority asc limit 1)
  );
  v_extract_provider := coalesce(
    (p_payload ->> 'extract_provider_id')::uuid,
    (select id from public.service_finder_provider_configs
      where provider_key = 'tavily' and is_enabled = true limit 1)
  );
  v_classifier_provider := coalesce(
    (p_payload ->> 'classifier_provider_id')::uuid,
    (select id from public.service_finder_provider_configs
      where provider_kind = 'classify' and is_enabled = true
      order by priority asc limit 1)
  );
  if v_search_provider is null or v_classifier_provider is null then
    raise exception 'sf_no_enabled_provider';
  end if;

  insert into public.service_finder_jobs (
    title, created_by_user_id, template_id,
    search_provider_id, extract_provider_id, classifier_provider_id,
    role_key, item_type, category_slug,
    location_label, country_code, region, city, language_code, freeform_topic,
    must_include_terms, must_exclude_terms, seed_queries,
    max_queries, max_source_urls, max_extract_urls, max_candidates,
    soft_cap_usd, hard_cap_usd, catalog_publish_mode, priority
  )
  values (
    v_title, v_uid, v_template.id,
    v_search_provider, v_extract_provider, v_classifier_provider,
    v_role_key, v_item_type, v_category_slug,
    v_location_label,
    nullif(p_payload ->> 'country_code', ''),
    nullif(p_payload ->> 'region', ''),
    nullif(p_payload ->> 'city', ''),
    coalesce(nullif(p_payload ->> 'language_code', ''), 'tr'),
    nullif(p_payload ->> 'freeform_topic', ''),
    case when p_payload ? 'must_include_terms'
         then public.service_finder_text_array(p_payload -> 'must_include_terms')
         else coalesce(v_template.must_include_terms, '{}'::text[]) end,
    case when p_payload ? 'must_exclude_terms'
         then public.service_finder_text_array(p_payload -> 'must_exclude_terms')
         else coalesce(v_template.must_exclude_terms, '{}'::text[]) end,
    coalesce(p_payload -> 'seed_queries', '[]'::jsonb),
    coalesce((p_payload ->> 'max_queries')::int, v_template.default_max_queries, 12),
    coalesce((p_payload ->> 'max_source_urls')::int, v_template.default_max_source_urls, 40),
    coalesce((p_payload ->> 'max_extract_urls')::int, v_template.default_max_extract_urls, 25),
    coalesce((p_payload ->> 'max_candidates')::int, 100),
    v_soft, v_hard,
    coalesce(nullif(p_payload ->> 'catalog_publish_mode', ''), 'manual_review'),
    coalesce((p_payload ->> 'priority')::int, 100)
  )
  returning id into v_job_id;

  insert into public.service_finder_job_events (job_id, event_type, message, event_payload)
  values (v_job_id, 'job_created', 'İş kuyruğa alındı.', jsonb_build_object('created_by', v_uid));

  return jsonb_build_object(
    'job_id', v_job_id,
    'status', 'queued',
    'soft_cap_usd', v_soft,
    'hard_cap_usd', v_hard
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- 2) admin_cancel_service_finder_job
-- ---------------------------------------------------------------------------
create or replace function public.admin_cancel_service_finder_job(p_job_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := public.service_finder_require_admin();
  v_status text;
begin
  select status into v_status from public.service_finder_jobs where id = p_job_id for update;
  if not found then
    raise exception 'sf_job_not_found';
  end if;
  if v_status not in ('queued', 'running') then
    raise exception 'sf_job_not_cancellable';
  end if;

  update public.service_finder_jobs
  set status = 'cancelled', cancelled_at = now(), finished_at = now(),
      locked_by = null, lease_expires_at = null, updated_at = now()
  where id = p_job_id;

  insert into public.service_finder_job_events (job_id, event_type, message, event_payload)
  values (p_job_id, 'job_cancelled', 'İş admin tarafından iptal edildi.', jsonb_build_object('cancelled_by', v_uid));

  return jsonb_build_object('job_id', p_job_id, 'status', 'cancelled');
end;
$$;

-- ---------------------------------------------------------------------------
-- 3) admin_retry_service_finder_job
-- ---------------------------------------------------------------------------
create or replace function public.admin_retry_service_finder_job(p_job_id uuid, p_patch jsonb default '{}'::jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := public.service_finder_require_admin();
  v_status text;
begin
  select status into v_status from public.service_finder_jobs where id = p_job_id for update;
  if not found then
    raise exception 'sf_job_not_found';
  end if;
  if v_status not in ('failed', 'cancelled', 'budget_stopped') then
    raise exception 'sf_job_not_retryable';
  end if;

  update public.service_finder_jobs
  set status = 'queued',
      run_after = now(),
      locked_by = null,
      lease_expires_at = null,
      finished_at = null,
      cancelled_at = null,
      last_error_code = null,
      last_error_message = null,
      soft_cap_usd = coalesce((p_patch ->> 'soft_cap_usd')::numeric, soft_cap_usd),
      hard_cap_usd = coalesce((p_patch ->> 'hard_cap_usd')::numeric, hard_cap_usd),
      updated_at = now()
  where id = p_job_id;

  insert into public.service_finder_job_events (job_id, event_type, message, event_payload)
  values (p_job_id, 'job_retried', 'İş yeniden kuyruğa alındı.', jsonb_build_object('retried_by', v_uid, 'patch', p_patch));

  return jsonb_build_object('job_id', p_job_id, 'status', 'queued');
end;
$$;

-- ---------------------------------------------------------------------------
-- 4) admin_get_service_finder_job — detay JSON (sekmeler tek çağrıda)
-- ---------------------------------------------------------------------------
create or replace function public.admin_get_service_finder_job(p_job_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := public.service_finder_require_admin();
  v_job jsonb;
begin
  select to_jsonb(j) into v_job from public.service_finder_jobs j where j.id = p_job_id;
  if v_job is null then
    raise exception 'sf_job_not_found';
  end if;

  return jsonb_build_object(
    'job', v_job,
    'queries', coalesce((
      select jsonb_agg(to_jsonb(q) order by q.created_at)
      from public.service_finder_job_queries q where q.job_id = p_job_id
    ), '[]'::jsonb),
    'sources', coalesce((
      select jsonb_agg(to_jsonb(s) - 'extracted_text' - 'extracted_markdown' order by s.created_at)
      from (
        select * from public.service_finder_job_sources
        where job_id = p_job_id order by created_at limit 300
      ) s
    ), '[]'::jsonb),
    'candidates', coalesce((
      select jsonb_agg(to_jsonb(c) order by c.confidence_score desc)
      from public.service_finder_candidates c where c.job_id = p_job_id
    ), '[]'::jsonb),
    'costs', coalesce((
      select jsonb_agg(to_jsonb(l) order by l.created_at desc)
      from (
        select * from public.service_finder_cost_ledger
        where job_id = p_job_id order by created_at desc limit 500
      ) l
    ), '[]'::jsonb),
    'events', coalesce((
      select jsonb_agg(to_jsonb(e) order by e.created_at desc)
      from (
        select * from public.service_finder_job_events
        where job_id = p_job_id order by created_at desc limit 300
      ) e
    ), '[]'::jsonb)
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- 5) admin_list_service_finder_jobs
-- ---------------------------------------------------------------------------
create or replace function public.admin_list_service_finder_jobs(
  p_status text default null,
  p_limit int default 25,
  p_offset int default 0
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := public.service_finder_require_admin();
  v_total bigint;
  v_rows jsonb;
begin
  select count(*) into v_total
  from public.service_finder_jobs
  where p_status is null or status = p_status;

  select coalesce(jsonb_agg(to_jsonb(j) order by j.created_at desc), '[]'::jsonb)
  into v_rows
  from (
    select id, title, status, role_key, item_type, location_label, city, country_code,
           language_code, soft_cap_usd, hard_cap_usd, cost_total_usd,
           search_requests, extract_requests, classify_requests,
           progress, last_error_code, created_at, started_at, finished_at
    from public.service_finder_jobs
    where p_status is null or status = p_status
    order by created_at desc
    limit greatest(1, least(coalesce(p_limit, 25), 100))
    offset greatest(0, coalesce(p_offset, 0))
  ) j;

  return jsonb_build_object('total', v_total, 'jobs', v_rows);
end;
$$;

-- ---------------------------------------------------------------------------
-- 6) admin_upsert_service_finder_provider — yalnız sır-olmayan alanlar
-- ---------------------------------------------------------------------------
create or replace function public.admin_upsert_service_finder_provider(
  p_provider_id uuid,
  p_patch jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := public.service_finder_require_admin();
  v_id uuid := p_provider_id;
begin
  if v_id is not null then
    update public.service_finder_provider_configs
    set display_name = coalesce(nullif(p_patch ->> 'display_name', ''), display_name),
        is_enabled = coalesce((p_patch ->> 'is_enabled')::boolean, is_enabled),
        priority = coalesce((p_patch ->> 'priority')::int, priority),
        default_model = case when p_patch ? 'default_model' then nullif(p_patch ->> 'default_model', '') else default_model end,
        base_url = case when p_patch ? 'base_url' then nullif(p_patch ->> 'base_url', '') else base_url end,
        request_defaults = coalesce(p_patch -> 'request_defaults', request_defaults),
        rate_limit_per_min = case when p_patch ? 'rate_limit_per_min' then (p_patch ->> 'rate_limit_per_min')::int else rate_limit_per_min end,
        default_soft_cap_usd = case when p_patch ? 'default_soft_cap_usd' then (p_patch ->> 'default_soft_cap_usd')::numeric else default_soft_cap_usd end,
        default_hard_cap_usd = case when p_patch ? 'default_hard_cap_usd' then (p_patch ->> 'default_hard_cap_usd')::numeric else default_hard_cap_usd end,
        daily_cap_usd = case when p_patch ? 'daily_cap_usd' then (p_patch ->> 'daily_cap_usd')::numeric else daily_cap_usd end,
        monthly_cap_usd = case when p_patch ? 'monthly_cap_usd' then (p_patch ->> 'monthly_cap_usd')::numeric else monthly_cap_usd end,
        secret_ref = coalesce(nullif(p_patch ->> 'secret_ref', ''), secret_ref),
        updated_at = now(),
        updated_by_user_id = v_uid
    where id = v_id;
    if not found then
      raise exception 'sf_provider_not_found';
    end if;
  else
    if nullif(p_patch ->> 'provider_key', '') is null
       or nullif(p_patch ->> 'provider_kind', '') is null
       or nullif(p_patch ->> 'display_name', '') is null
       or nullif(p_patch ->> 'secret_ref', '') is null then
      raise exception 'sf_provider_fields_required';
    end if;
    insert into public.service_finder_provider_configs
      (provider_key, provider_kind, display_name, is_enabled, priority, default_model,
       base_url, request_defaults, rate_limit_per_min, default_soft_cap_usd,
       default_hard_cap_usd, daily_cap_usd, monthly_cap_usd, secret_ref, updated_by_user_id)
    values
      (p_patch ->> 'provider_key',
       p_patch ->> 'provider_kind',
       p_patch ->> 'display_name',
       coalesce((p_patch ->> 'is_enabled')::boolean, true),
       coalesce((p_patch ->> 'priority')::int, 100),
       nullif(p_patch ->> 'default_model', ''),
       nullif(p_patch ->> 'base_url', ''),
       coalesce(p_patch -> 'request_defaults', '{}'::jsonb),
       (p_patch ->> 'rate_limit_per_min')::int,
       (p_patch ->> 'default_soft_cap_usd')::numeric,
       (p_patch ->> 'default_hard_cap_usd')::numeric,
       (p_patch ->> 'daily_cap_usd')::numeric,
       (p_patch ->> 'monthly_cap_usd')::numeric,
       p_patch ->> 'secret_ref',
       v_uid)
    returning id into v_id;
  end if;

  return jsonb_build_object('provider_id', v_id);
end;
$$;

-- ---------------------------------------------------------------------------
-- 7) admin_upsert_service_finder_template
-- ---------------------------------------------------------------------------
create or replace function public.admin_upsert_service_finder_template(
  p_template_id uuid,
  p_patch jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := public.service_finder_require_admin();
  v_id uuid := p_template_id;
begin
  if (p_patch ? 'role_key') and not exists (
    select 1 from public.roles where key = p_patch ->> 'role_key' and is_active = true
  ) then
    raise exception 'sf_invalid_role';
  end if;

  if v_id is not null then
    update public.service_finder_profession_templates
    set label = coalesce(nullif(p_patch ->> 'label', ''), label),
        role_key = coalesce(nullif(p_patch ->> 'role_key', ''), role_key),
        item_type = coalesce(nullif(p_patch ->> 'item_type', ''), item_type),
        category_slug = case when p_patch ? 'category_slug' then nullif(p_patch ->> 'category_slug', '') else category_slug end,
        language_terms = case when p_patch ? 'language_terms' then public.service_finder_text_array(p_patch -> 'language_terms') else language_terms end,
        location_terms = case when p_patch ? 'location_terms' then public.service_finder_text_array(p_patch -> 'location_terms') else location_terms end,
        must_include_terms = case when p_patch ? 'must_include_terms' then public.service_finder_text_array(p_patch -> 'must_include_terms') else must_include_terms end,
        must_exclude_terms = case when p_patch ? 'must_exclude_terms' then public.service_finder_text_array(p_patch -> 'must_exclude_terms') else must_exclude_terms end,
        query_templates = coalesce(p_patch -> 'query_templates', query_templates),
        extraction_hints = coalesce(p_patch -> 'extraction_hints', extraction_hints),
        default_max_queries = coalesce((p_patch ->> 'default_max_queries')::int, default_max_queries),
        default_max_source_urls = coalesce((p_patch ->> 'default_max_source_urls')::int, default_max_source_urls),
        default_max_extract_urls = coalesce((p_patch ->> 'default_max_extract_urls')::int, default_max_extract_urls),
        is_active = coalesce((p_patch ->> 'is_active')::boolean, is_active),
        updated_at = now()
    where id = v_id;
    if not found then
      raise exception 'sf_template_not_found';
    end if;
  else
    if nullif(p_patch ->> 'template_key', '') is null
       or nullif(p_patch ->> 'label', '') is null
       or nullif(p_patch ->> 'role_key', '') is null
       or nullif(p_patch ->> 'item_type', '') is null then
      raise exception 'sf_template_fields_required';
    end if;
    insert into public.service_finder_profession_templates
      (template_key, label, role_key, item_type, category_slug,
       language_terms, location_terms, must_include_terms, must_exclude_terms,
       query_templates, extraction_hints,
       default_max_queries, default_max_source_urls, default_max_extract_urls, is_active)
    values
      (p_patch ->> 'template_key',
       p_patch ->> 'label',
       p_patch ->> 'role_key',
       p_patch ->> 'item_type',
       nullif(p_patch ->> 'category_slug', ''),
       coalesce(public.service_finder_text_array(p_patch -> 'language_terms'),
                array['Türk', 'Türkçe', 'Turkish speaking', 'Türkisch']),
       public.service_finder_text_array(p_patch -> 'location_terms'),
       public.service_finder_text_array(p_patch -> 'must_include_terms'),
       public.service_finder_text_array(p_patch -> 'must_exclude_terms'),
       coalesce(p_patch -> 'query_templates', '[]'::jsonb),
       coalesce(p_patch -> 'extraction_hints', '{}'::jsonb),
       coalesce((p_patch ->> 'default_max_queries')::int, 12),
       coalesce((p_patch ->> 'default_max_source_urls')::int, 40),
       coalesce((p_patch ->> 'default_max_extract_urls')::int, 25),
       coalesce((p_patch ->> 'is_active')::boolean, true))
    returning id into v_id;
  end if;

  return jsonb_build_object('template_id', v_id);
end;
$$;

-- ---------------------------------------------------------------------------
-- 8) admin_review_service_finder_candidate — onay/ret/düzenleme
-- ---------------------------------------------------------------------------
create or replace function public.admin_review_service_finder_candidate(
  p_candidate_id uuid,
  p_action text,
  p_patch jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := public.service_finder_require_admin();
  v_status text;
begin
  if p_action not in ('approved', 'rejected', 'needs_edit', 'pending') then
    raise exception 'sf_invalid_review_action';
  end if;

  select review_status into v_status
  from public.service_finder_candidates where id = p_candidate_id for update;
  if not found then
    raise exception 'sf_candidate_not_found';
  end if;
  if v_status = 'published' then
    raise exception 'sf_candidate_already_published';
  end if;

  update public.service_finder_candidates
  set review_status = p_action,
      review_notes = case when p_patch ? 'review_notes' then nullif(p_patch ->> 'review_notes', '') else review_notes end,
      canonical_name = coalesce(nullif(p_patch ->> 'canonical_name', ''), canonical_name),
      profession_label = case when p_patch ? 'profession_label' then nullif(p_patch ->> 'profession_label', '') else profession_label end,
      organization_name = case when p_patch ? 'organization_name' then nullif(p_patch ->> 'organization_name', '') else organization_name end,
      category_slug = case when p_patch ? 'category_slug' then nullif(p_patch ->> 'category_slug', '') else category_slug end,
      country_code = case when p_patch ? 'country_code' then nullif(p_patch ->> 'country_code', '') else country_code end,
      region = case when p_patch ? 'region' then nullif(p_patch ->> 'region', '') else region end,
      city = case when p_patch ? 'city' then nullif(p_patch ->> 'city', '') else city end,
      address_line = case when p_patch ? 'address_line' then nullif(p_patch ->> 'address_line', '') else address_line end,
      languages = case when p_patch ? 'languages' then public.service_finder_text_array(p_patch -> 'languages') else languages end,
      services = case when p_patch ? 'services' then public.service_finder_text_array(p_patch -> 'services') else services end,
      contacts = coalesce(p_patch -> 'contacts', contacts),
      website_url = case when p_patch ? 'website_url' then nullif(p_patch ->> 'website_url', '') else website_url end,
      appointment_url = case when p_patch ? 'appointment_url' then nullif(p_patch ->> 'appointment_url', '') else appointment_url end,
      reviewed_by_user_id = v_uid,
      reviewed_at = now(),
      updated_at = now()
  where id = p_candidate_id;

  return jsonb_build_object('candidate_id', p_candidate_id, 'review_status', p_action);
end;
$$;

-- ---------------------------------------------------------------------------
-- 9) admin_publish_service_finder_candidate — kanonik katalog yayını.
-- scripts/catalog-role-importer.mjs:upsertImportRecord akışının SQL aynası:
-- catalog_upsert_source_item → catalog_reset_item_projection → uydu tablolar
-- → item_type'a göre advisor/business/organization_details.
-- ---------------------------------------------------------------------------
create or replace function public.admin_publish_service_finder_candidate(
  p_candidate_id uuid,
  p_patch jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := public.service_finder_require_admin();
  v_c public.service_finder_candidates%rowtype;
  v_job public.service_finder_jobs%rowtype;
  v_category_slug text;
  v_category_id uuid;
  v_slug text;
  v_item_id uuid;
  v_headline text;
  v_description text;
  v_contact jsonb;
  v_idx int := 0;
  v_lang text;
  v_service text;
  v_tag text;
  v_tags text[];
  v_appointment text;
  v_source_url text;
begin
  -- Onaylı adayı kilitle
  select * into v_c from public.service_finder_candidates where id = p_candidate_id for update;
  if not found then
    raise exception 'sf_candidate_not_found';
  end if;
  if v_c.review_status = 'published' then
    raise exception 'sf_candidate_already_published';
  end if;

  -- Yayın öncesi son düzenlemeler (review ile aynı alanlar)
  if p_patch <> '{}'::jsonb then
    perform public.admin_review_service_finder_candidate(p_candidate_id, 'approved', p_patch);
    select * into v_c from public.service_finder_candidates where id = p_candidate_id;
  end if;

  if v_c.review_status <> 'approved' then
    raise exception 'sf_candidate_not_approved';
  end if;

  select * into v_job from public.service_finder_jobs where id = v_c.job_id;

  -- Kategori çözümle (importer: ensureCatalogCategory)
  v_category_slug := coalesce(v_c.category_slug, v_job.category_slug);
  if v_category_slug is null then
    raise exception 'sf_category_required';
  end if;

  select id into v_category_id from public.catalog_categories where slug = v_category_slug;
  if v_category_id is null then
    insert into public.catalog_categories (module, slug, name, description, is_active, sort_order)
    values (
      v_c.item_type,
      v_category_slug,
      coalesce(v_c.profession_label, v_category_slug),
      coalesce(v_c.profession_label, v_category_slug) || ' category for ' || v_c.item_type,
      true,
      1000
    )
    returning id into v_category_id;
  end if;

  -- Slug: importer deseni [city, roleLabel, title]
  v_slug := public.service_finder_slugify(
    concat_ws(' ', v_c.city, coalesce(v_c.profession_label, v_c.role_key), v_c.canonical_name)
  );
  if v_slug is null or v_slug = '' then
    raise exception 'sf_slug_generation_failed';
  end if;

  v_headline := coalesce(
    nullif(array_to_string(v_c.services, ', '), ''),
    v_c.profession_label,
    v_c.role_key
  );
  v_description := concat_ws(' ',
    v_c.canonical_name,
    case when v_c.city is not null then v_c.city || ' lokasyonunda' end,
    v_c.profession_label,
    case when array_length(v_c.services, 1) > 0 then '(' || array_to_string(v_c.services, ', ') || ')' end
  );
  v_source_url := coalesce(
    v_c.website_url,
    (select s.source_url from public.service_finder_job_sources s where s.id = v_c.primary_source_id)
  );

  -- Kanonik upsert
  v_item_id := public.catalog_upsert_source_item(
    p_source_type => 'service_finder',
    p_external_id => v_c.id::text,
    p_item_type => v_c.item_type,
    p_slug => v_slug,
    p_title => v_c.canonical_name,
    p_headline => v_headline,
    p_short_description => v_description,
    p_long_description => v_description || ' Service Finder taraması ile bulunmuş, admin onayı sonrası yayınlanmıştır.',
    p_status => 'published',
    p_visibility => 'public',
    p_verification_status => 'unverified',
    p_created_by_user_id => v_uid,
    p_published_at => now(),
    p_attributes => jsonb_build_object(
      'import_source', 'service_finder',
      'source_label', 'Service Finder',
      'platform_role_label', coalesce(v_c.profession_label, v_c.role_key),
      'service_finder_job_id', v_c.job_id,
      'service_finder_candidate_id', v_c.id,
      'confidence_score', v_c.confidence_score
    ),
    p_source_url => v_source_url,
    p_raw_snapshot => v_c.normalized_payload,
    p_platform_role_key => v_c.role_key
  );

  perform public.catalog_reset_item_projection(v_item_id);

  -- Uydu tablolar (importer sırası ve alan değerleriyle birebir)
  insert into public.catalog_item_categories (item_id, category_id, is_primary)
  values (v_item_id, v_category_id, true)
  on conflict (item_id, category_id) do update set is_primary = excluded.is_primary;

  for v_contact in select value from jsonb_array_elements(coalesce(v_c.contacts, '[]'::jsonb))
  loop
    if nullif(v_contact ->> 'value', '') is not null then
      insert into public.catalog_item_contacts
        (item_id, contact_type, contact_value, label, is_primary, is_public, sort_order)
      values
        (v_item_id,
         coalesce(nullif(v_contact ->> 'type', ''), 'website'),
         v_contact ->> 'value',
         nullif(v_contact ->> 'label', ''),
         coalesce((v_contact ->> 'is_primary')::boolean, v_idx = 0),
         true,
         v_idx * 10);
      v_idx := v_idx + 1;
    end if;
  end loop;

  insert into public.catalog_item_locations
    (item_id, country_code, region, city, address_line, postal_code, latitude, longitude, is_primary)
  values
    (v_item_id, v_c.country_code, v_c.region, v_c.city, v_c.address_line, null, null, null, true);

  v_idx := 0;
  foreach v_lang in array coalesce(v_c.languages, '{}'::text[])
  loop
    insert into public.catalog_item_languages (item_id, language_code, proficiency, is_primary)
    values (v_item_id, v_lang, case when v_idx = 0 then 'native_or_fluent' else 'professional' end, v_idx = 0)
    on conflict (item_id, language_code) do nothing;
    v_idx := v_idx + 1;
  end loop;

  v_idx := 0;
  foreach v_service in array coalesce(v_c.services, '{}'::text[])
  loop
    insert into public.catalog_item_services
      (item_id, service_slug, service_name, description, is_public, sort_order)
    values
      (v_item_id, public.service_finder_slugify(v_service), v_service, null, true, v_idx * 10)
    on conflict (item_id, service_slug) do nothing;
    v_idx := v_idx + 1;
  end loop;

  select coalesce(array_agg(t), '{}'::text[]) into v_tags
  from unnest(array[
    coalesce(v_c.profession_label, v_c.role_key), v_c.city, v_c.country_code
  ]) as t where t is not null and t <> '';

  foreach v_tag in array v_tags
  loop
    insert into public.catalog_item_tags (item_id, tag_slug, tag_label)
    values (v_item_id, public.service_finder_slugify(v_tag), v_tag)
    on conflict (item_id, tag_slug) do nothing;
  end loop;

  -- item_type'a göre uzantı tablosu (importer: upsertExtensionRecord)
  v_appointment := coalesce(
    v_c.appointment_url,
    (select c ->> 'value' from jsonb_array_elements(coalesce(v_c.contacts, '[]'::jsonb)) c
      where c ->> 'type' = 'appointment_url' limit 1)
  );

  if v_c.item_type = 'advisor' then
    insert into public.advisor_details
      (item_id, consultation_modes, languages, supports_online_consultation, appointment_url)
    values
      (v_item_id, array['in_person'], v_c.languages, false, v_appointment)
    on conflict (item_id) do update
      set languages = excluded.languages, appointment_url = excluded.appointment_url;
  elsif v_c.item_type = 'business' then
    insert into public.business_details (item_id, supports_online_booking, appointment_url)
    values (v_item_id, false, v_appointment)
    on conflict (item_id) do update set appointment_url = excluded.appointment_url;
  elsif v_c.item_type = 'organization' then
    insert into public.organization_details (item_id, organization_kind, metadata)
    values (v_item_id, coalesce(v_c.profession_label, v_c.role_key), v_c.normalized_payload)
    on conflict (item_id) do update
      set organization_kind = excluded.organization_kind, metadata = excluded.metadata;
  end if;

  -- Aday durumunu yayınlandı yap
  update public.service_finder_candidates
  set review_status = 'published',
      catalog_item_id = v_item_id,
      published_at = now(),
      reviewed_by_user_id = v_uid,
      reviewed_at = now(),
      updated_at = now()
  where id = p_candidate_id;

  insert into public.service_finder_job_events (job_id, candidate_id, event_type, message, event_payload)
  values (v_c.job_id, p_candidate_id, 'candidate_published',
          'Aday kataloğa yayınlandı.',
          jsonb_build_object('catalog_item_id', v_item_id, 'published_by', v_uid));

  return jsonb_build_object(
    'candidate_id', p_candidate_id,
    'catalog_item_id', v_item_id,
    'review_status', 'published'
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- 10) worker_claim_service_finder_jobs — FOR UPDATE SKIP LOCKED kuyruğu.
-- Süresi dolmuş lease'li running işler de yeniden claim edilir.
-- ---------------------------------------------------------------------------
create or replace function public.worker_claim_service_finder_jobs(
  p_worker_id text,
  p_limit int default 1
)
returns setof public.service_finder_jobs
language plpgsql
security definer
set search_path = public
as $$
begin
  if nullif(trim(coalesce(p_worker_id, '')), '') is null then
    raise exception 'sf_worker_id_required';
  end if;

  return query
  with claimable as (
    select id
    from public.service_finder_jobs
    where (status = 'queued' and run_after <= now())
       or (status = 'running' and lease_expires_at is not null and lease_expires_at < now())
    order by priority desc, created_at asc
    limit greatest(1, least(coalesce(p_limit, 1), 10))
    for update skip locked
  )
  update public.service_finder_jobs j
  set status = 'running',
      locked_by = p_worker_id,
      lease_expires_at = now() + interval '5 minutes',
      started_at = coalesce(j.started_at, now()),
      attempts = j.attempts + 1,
      updated_at = now()
  from claimable
  where j.id = claimable.id
  returning j.*;
end;
$$;

-- ---------------------------------------------------------------------------
-- 11) worker_heartbeat_service_finder_job — false dönerse lease kaybedilmiştir
-- ---------------------------------------------------------------------------
create or replace function public.worker_heartbeat_service_finder_job(
  p_job_id uuid,
  p_worker_id text,
  p_progress jsonb default null
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_updated int;
begin
  update public.service_finder_jobs
  set lease_expires_at = now() + interval '5 minutes',
      progress = coalesce(p_progress, progress),
      updated_at = now()
  where id = p_job_id
    and locked_by = p_worker_id
    and status = 'running';
  get diagnostics v_updated = row_count;
  return v_updated = 1;
end;
$$;

-- ---------------------------------------------------------------------------
-- 12) worker_append_service_finder_event
-- ---------------------------------------------------------------------------
create or replace function public.worker_append_service_finder_event(
  p_job_id uuid,
  p_event_type text,
  p_message text,
  p_event_level text default 'info',
  p_candidate_id uuid default null,
  p_event_payload jsonb default '{}'::jsonb
)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id bigint;
begin
  insert into public.service_finder_job_events
    (job_id, candidate_id, event_type, event_level, message, event_payload)
  values
    (p_job_id, p_candidate_id, p_event_type, coalesce(p_event_level, 'info'),
     p_message, coalesce(p_event_payload, '{}'::jsonb))
  returning id into v_id;
  return v_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- 13) worker_record_service_finder_cost — defter satırı + iş toplamları atomik.
-- Dönüş worker'ın ekstra sorgu olmadan hard-stop kararı vermesini sağlar.
-- ---------------------------------------------------------------------------
create or replace function public.worker_record_service_finder_cost(p_payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_job_id uuid := (p_payload ->> 'job_id')::uuid;
  v_event_type text := p_payload ->> 'event_type';
  v_amount numeric(12,4) := coalesce((p_payload ->> 'amount_usd')::numeric, 0);
  v_candidate_id uuid := (p_payload ->> 'candidate_id')::uuid;
  v_total numeric(12,4);
  v_soft numeric(12,4);
  v_hard numeric(12,4);
begin
  if v_job_id is null or v_event_type is null then
    raise exception 'sf_cost_payload_invalid';
  end if;

  insert into public.service_finder_cost_ledger
    (job_id, query_id, source_id, candidate_id, provider_config_id, provider_key,
     event_type, billing_unit, quantity, unit_cost_usd, amount_usd, currency,
     model_name, request_meta)
  values
    (v_job_id,
     (p_payload ->> 'query_id')::uuid,
     (p_payload ->> 'source_id')::uuid,
     v_candidate_id,
     (p_payload ->> 'provider_config_id')::uuid,
     coalesce(p_payload ->> 'provider_key', 'unknown'),
     v_event_type,
     coalesce(p_payload ->> 'billing_unit', 'unit'),
     coalesce((p_payload ->> 'quantity')::numeric, 1),
     coalesce((p_payload ->> 'unit_cost_usd')::numeric, 0),
     v_amount,
     coalesce(p_payload ->> 'currency', 'USD'),
     nullif(p_payload ->> 'model_name', ''),
     coalesce(p_payload -> 'request_meta', '{}'::jsonb));

  update public.service_finder_jobs
  set cost_total_usd = cost_total_usd + v_amount,
      search_requests = search_requests + (case when v_event_type = 'search' then 1 else 0 end),
      extract_requests = extract_requests + (case when v_event_type = 'extract' then 1 else 0 end),
      classify_requests = classify_requests + (case when v_event_type = 'classify' then 1 else 0 end),
      updated_at = now()
  where id = v_job_id
  returning cost_total_usd, soft_cap_usd, hard_cap_usd into v_total, v_soft, v_hard;

  if v_total is null then
    raise exception 'sf_job_not_found';
  end if;

  if v_candidate_id is not null then
    update public.service_finder_candidates
    set cost_total_usd = cost_total_usd + v_amount, updated_at = now()
    where id = v_candidate_id;
  end if;

  return jsonb_build_object(
    'cost_total_usd', v_total,
    'soft_cap_usd', v_soft,
    'hard_cap_usd', v_hard,
    'soft_cap_exceeded', v_total >= v_soft,
    'hard_cap_exceeded', v_total >= v_hard
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- 14) worker_complete_service_finder_job
-- ---------------------------------------------------------------------------
create or replace function public.worker_complete_service_finder_job(
  p_job_id uuid,
  p_worker_id text,
  p_status text default 'review',
  p_result_summary jsonb default '{}'::jsonb
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_updated int;
begin
  if p_status not in ('review', 'completed', 'budget_stopped') then
    raise exception 'sf_invalid_final_status';
  end if;

  update public.service_finder_jobs
  set status = p_status,
      result_summary = coalesce(p_result_summary, '{}'::jsonb),
      finished_at = now(),
      locked_by = null,
      lease_expires_at = null,
      updated_at = now()
  where id = p_job_id
    and locked_by = p_worker_id
    and status = 'running';
  get diagnostics v_updated = row_count;
  return v_updated = 1;
end;
$$;

-- ---------------------------------------------------------------------------
-- 15) worker_fail_service_finder_job — retryable ise backoff ile requeue
-- ---------------------------------------------------------------------------
create or replace function public.worker_fail_service_finder_job(
  p_job_id uuid,
  p_worker_id text,
  p_error_code text,
  p_error_message text,
  p_retryable boolean default false,
  p_retry_delay_seconds int default 60
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_attempts int;
  v_updated int;
begin
  select attempts into v_attempts
  from public.service_finder_jobs
  where id = p_job_id and locked_by = p_worker_id and status = 'running'
  for update;
  if not found then
    return false;
  end if;

  if p_retryable and v_attempts < 5 then
    update public.service_finder_jobs
    set status = 'queued',
        run_after = now() + make_interval(secs => greatest(coalesce(p_retry_delay_seconds, 60), 5)),
        locked_by = null,
        lease_expires_at = null,
        last_error_code = p_error_code,
        last_error_message = left(coalesce(p_error_message, ''), 2000),
        updated_at = now()
    where id = p_job_id;
  else
    update public.service_finder_jobs
    set status = 'failed',
        finished_at = now(),
        locked_by = null,
        lease_expires_at = null,
        last_error_code = p_error_code,
        last_error_message = left(coalesce(p_error_message, ''), 2000),
        updated_at = now()
    where id = p_job_id;
  end if;
  get diagnostics v_updated = row_count;

  insert into public.service_finder_job_events (job_id, event_type, event_level, message, event_payload)
  values (p_job_id, 'job_failed', 'error',
          coalesce(p_error_message, p_error_code, 'unknown'),
          jsonb_build_object('error_code', p_error_code, 'retryable', p_retryable, 'attempts', v_attempts));

  return v_updated = 1;
end;
$$;

-- ---------------------------------------------------------------------------
-- Yetkiler
-- ---------------------------------------------------------------------------
revoke all on function public.service_finder_require_admin() from public, anon;
grant execute on function public.service_finder_require_admin() to authenticated;

grant execute on function public.service_finder_slugify(text) to authenticated, service_role;
grant execute on function public.service_finder_text_array(jsonb) to authenticated, service_role;

revoke all on function public.admin_create_service_finder_job(jsonb) from public, anon;
revoke all on function public.admin_cancel_service_finder_job(uuid) from public, anon;
revoke all on function public.admin_retry_service_finder_job(uuid, jsonb) from public, anon;
revoke all on function public.admin_get_service_finder_job(uuid) from public, anon;
revoke all on function public.admin_list_service_finder_jobs(text, int, int) from public, anon;
revoke all on function public.admin_upsert_service_finder_provider(uuid, jsonb) from public, anon;
revoke all on function public.admin_upsert_service_finder_template(uuid, jsonb) from public, anon;
revoke all on function public.admin_review_service_finder_candidate(uuid, text, jsonb) from public, anon;
revoke all on function public.admin_publish_service_finder_candidate(uuid, jsonb) from public, anon;

grant execute on function public.admin_create_service_finder_job(jsonb) to authenticated;
grant execute on function public.admin_cancel_service_finder_job(uuid) to authenticated;
grant execute on function public.admin_retry_service_finder_job(uuid, jsonb) to authenticated;
grant execute on function public.admin_get_service_finder_job(uuid) to authenticated;
grant execute on function public.admin_list_service_finder_jobs(text, int, int) to authenticated;
grant execute on function public.admin_upsert_service_finder_provider(uuid, jsonb) to authenticated;
grant execute on function public.admin_upsert_service_finder_template(uuid, jsonb) to authenticated;
grant execute on function public.admin_review_service_finder_candidate(uuid, text, jsonb) to authenticated;
grant execute on function public.admin_publish_service_finder_candidate(uuid, jsonb) to authenticated;

revoke all on function public.worker_claim_service_finder_jobs(text, int) from public, anon, authenticated;
revoke all on function public.worker_heartbeat_service_finder_job(uuid, text, jsonb) from public, anon, authenticated;
revoke all on function public.worker_append_service_finder_event(uuid, text, text, text, uuid, jsonb) from public, anon, authenticated;
revoke all on function public.worker_record_service_finder_cost(jsonb) from public, anon, authenticated;
revoke all on function public.worker_complete_service_finder_job(uuid, text, text, jsonb) from public, anon, authenticated;
revoke all on function public.worker_fail_service_finder_job(uuid, text, text, text, boolean, int) from public, anon, authenticated;

grant execute on function public.worker_claim_service_finder_jobs(text, int) to service_role;
grant execute on function public.worker_heartbeat_service_finder_job(uuid, text, jsonb) to service_role;
grant execute on function public.worker_append_service_finder_event(uuid, text, text, text, uuid, jsonb) to service_role;
grant execute on function public.worker_record_service_finder_cost(jsonb) to service_role;
grant execute on function public.worker_complete_service_finder_job(uuid, text, text, jsonb) to service_role;
grant execute on function public.worker_fail_service_finder_job(uuid, text, text, text, boolean, int) to service_role;
