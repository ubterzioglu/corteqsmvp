-- Service Finder modülü — çekirdek şema (scrapper_plan.md §Schema).
-- Admin-yönetimli AI tarama hattı: iş kuyruğu, sağlayıcı ayarları, meslek
-- şablonları, kaynak/aday kayıtları, maliyet defteri ve olay günlüğü.
-- Yazma yolu: yalnızca security-definer RPC'ler (20260614103000) — tarayıcıdan
-- doğrudan INSERT/UPDATE yok. Worker service_role ile bağlanır (RLS bypass).

-- ---------------------------------------------------------------------------
-- 1) Sağlayıcı ayarları (sır YOK — secret_ref yalnızca env değişken adıdır)
-- ---------------------------------------------------------------------------
create table if not exists public.service_finder_provider_configs (
  id uuid primary key default gen_random_uuid(),
  provider_key text not null unique,
  provider_kind text not null check (provider_kind in ('search', 'extract', 'classify')),
  display_name text not null,
  is_enabled boolean not null default true,
  priority integer not null default 100,
  default_model text,
  base_url text,
  request_defaults jsonb not null default '{}'::jsonb,
  rate_limit_per_min integer,
  default_soft_cap_usd numeric(12,4),
  default_hard_cap_usd numeric(12,4),
  daily_cap_usd numeric(12,4),
  monthly_cap_usd numeric(12,4),
  secret_ref text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by_user_id uuid
);

comment on table public.service_finder_provider_configs is
  'Service Finder dış sağlayıcı ayarları. secret_ref = worker ortamındaki env değişken adı; ham API anahtarı asla DB''de tutulmaz.';

-- ---------------------------------------------------------------------------
-- 2) Meslek şablonları (sorgu üretim girdileri)
-- ---------------------------------------------------------------------------
create table if not exists public.service_finder_profession_templates (
  id uuid primary key default gen_random_uuid(),
  template_key text not null unique,
  label text not null,
  role_key text not null,
  item_type text not null,
  category_slug text,
  language_terms text[] not null default array['Türk', 'Türkçe', 'Turkish speaking', 'Türkisch'],
  location_terms text[] not null default '{}'::text[],
  must_include_terms text[] not null default '{}'::text[],
  must_exclude_terms text[] not null default '{}'::text[],
  query_templates jsonb not null default '[]'::jsonb,
  extraction_hints jsonb not null default '{}'::jsonb,
  default_max_queries integer not null default 12,
  default_max_source_urls integer not null default 40,
  default_max_extract_urls integer not null default 25,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 3) İşler — queue-in-table (FOR UPDATE SKIP LOCKED ile claim edilir)
-- ---------------------------------------------------------------------------
create table if not exists public.service_finder_jobs (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  status text not null default 'queued'
    check (status in ('queued', 'running', 'review', 'completed', 'failed', 'cancelled', 'budget_stopped')),
  priority integer not null default 100,
  created_by_user_id uuid not null,
  template_id uuid references public.service_finder_profession_templates(id) on delete set null,
  search_provider_id uuid references public.service_finder_provider_configs(id) on delete set null,
  extract_provider_id uuid references public.service_finder_provider_configs(id) on delete set null,
  classifier_provider_id uuid references public.service_finder_provider_configs(id) on delete set null,
  role_key text not null,
  item_type text not null,
  category_slug text,
  location_label text not null,
  country_code text,
  region text,
  city text,
  language_code text not null default 'tr',
  freeform_topic text,
  must_include_terms text[] not null default '{}'::text[],
  must_exclude_terms text[] not null default '{}'::text[],
  seed_queries jsonb not null default '[]'::jsonb,
  max_queries integer not null default 12,
  max_source_urls integer not null default 40,
  max_extract_urls integer not null default 25,
  max_candidates integer not null default 100,
  soft_cap_usd numeric(12,4) not null default 3.0000,
  hard_cap_usd numeric(12,4) not null default 5.0000,
  cost_total_usd numeric(12,4) not null default 0.0000,
  search_requests integer not null default 0,
  extract_requests integer not null default 0,
  classify_requests integer not null default 0,
  catalog_publish_mode text not null default 'manual_review'
    check (catalog_publish_mode in ('manual_review', 'approve_then_publish', 'direct_publish_disabled')),
  result_summary jsonb not null default '{}'::jsonb,
  progress jsonb not null default '{}'::jsonb,
  attempts integer not null default 0,
  last_error_code text,
  last_error_message text,
  run_after timestamptz not null default now(),
  locked_by text,
  lease_expires_at timestamptz,
  started_at timestamptz,
  finished_at timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 4) Çalıştırılan arama sorguları
-- ---------------------------------------------------------------------------
create table if not exists public.service_finder_job_queries (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.service_finder_jobs(id) on delete cascade,
  stage text not null check (stage in ('seed', 'expansion', 'retry')),
  provider_key text not null,
  query_text text not null,
  request_payload jsonb not null default '{}'::jsonb,
  response_payload jsonb not null default '{}'::jsonb,
  external_request_id text,
  usage_units numeric(12,4) not null default 0,
  estimated_cost_usd numeric(12,4) not null default 0.0000,
  result_count integer not null default 0,
  status text not null default 'pending'
    check (status in ('pending', 'succeeded', 'failed', 'skipped')),
  created_at timestamptz not null default now(),
  executed_at timestamptz,
  unique (job_id, stage, query_text)
);

-- ---------------------------------------------------------------------------
-- 5) Keşfedilen kaynak URL'leri (robots kararı + ekstraksiyon durumu dahil)
-- ---------------------------------------------------------------------------
create table if not exists public.service_finder_job_sources (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.service_finder_jobs(id) on delete cascade,
  discovery_query_id uuid references public.service_finder_job_queries(id) on delete set null,
  provider_key text not null,
  source_url text not null,
  normalized_url text not null,
  source_domain text not null,
  source_title text,
  source_snippet text,
  source_language text,
  crawl_allowed boolean,
  robots_evaluated_at timestamptz,
  fetch_status text not null default 'discovered'
    check (fetch_status in ('discovered', 'queued', 'fetched', 'blocked_robots', 'failed', 'duplicate', 'irrelevant')),
  http_status integer,
  content_hash text,
  extracted_text text,
  extracted_markdown text,
  raw_metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  fetched_at timestamptz,
  unique (job_id, normalized_url)
);

-- ---------------------------------------------------------------------------
-- 6) Adaylar (sınıflandırıcı çıktısı + inceleme/yayınlama durumu)
-- ---------------------------------------------------------------------------
create table if not exists public.service_finder_candidates (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.service_finder_jobs(id) on delete cascade,
  primary_source_id uuid references public.service_finder_job_sources(id) on delete set null,
  canonical_name text not null,
  profession_label text,
  organization_name text,
  role_key text not null,
  item_type text not null,
  category_slug text,
  country_code text,
  region text,
  city text,
  address_line text,
  languages text[] not null default '{}'::text[],
  services text[] not null default '{}'::text[],
  contacts jsonb not null default '[]'::jsonb,
  website_url text,
  appointment_url text,
  source_urls jsonb not null default '[]'::jsonb,
  evidence jsonb not null default '[]'::jsonb,
  normalized_payload jsonb not null default '{}'::jsonb,
  catalog_projection jsonb not null default '{}'::jsonb,
  duplicate_key text not null,
  confidence_score numeric(5,2) not null default 0.00,
  classifier_model text,
  review_status text not null default 'pending'
    check (review_status in ('pending', 'approved', 'rejected', 'needs_edit', 'published')),
  review_notes text,
  reviewed_by_user_id uuid,
  reviewed_at timestamptz,
  catalog_item_id uuid,
  published_at timestamptz,
  cost_total_usd numeric(12,4) not null default 0.0000,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (job_id, duplicate_key)
);

-- ---------------------------------------------------------------------------
-- 7) Olay günlüğü
-- ---------------------------------------------------------------------------
create table if not exists public.service_finder_job_events (
  id bigserial primary key,
  job_id uuid not null references public.service_finder_jobs(id) on delete cascade,
  candidate_id uuid references public.service_finder_candidates(id) on delete cascade,
  event_type text not null,
  event_level text not null default 'info'
    check (event_level in ('debug', 'info', 'warn', 'error')),
  message text not null,
  event_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 8) Maliyet defteri — her sağlayıcı çağrısı bir satır
-- ---------------------------------------------------------------------------
create table if not exists public.service_finder_cost_ledger (
  id bigserial primary key,
  job_id uuid not null references public.service_finder_jobs(id) on delete cascade,
  query_id uuid references public.service_finder_job_queries(id) on delete set null,
  source_id uuid references public.service_finder_job_sources(id) on delete set null,
  candidate_id uuid references public.service_finder_candidates(id) on delete set null,
  provider_config_id uuid references public.service_finder_provider_configs(id) on delete set null,
  provider_key text not null,
  event_type text not null
    check (event_type in ('search', 'extract', 'classify', 'grounding', 'manual_adjustment')),
  billing_unit text not null,
  quantity numeric(12,4) not null,
  unit_cost_usd numeric(12,6) not null,
  amount_usd numeric(12,4) not null,
  currency text not null default 'USD',
  model_name text,
  request_meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- İndeksler
-- ---------------------------------------------------------------------------
create index if not exists idx_sf_jobs_queue
  on public.service_finder_jobs (status, run_after, lease_expires_at, priority desc);

create index if not exists idx_sf_jobs_created_at
  on public.service_finder_jobs (created_at desc);

create index if not exists idx_sf_sources_job_fetch
  on public.service_finder_job_sources (job_id, fetch_status, source_domain);

create index if not exists idx_sf_candidates_job_review
  on public.service_finder_candidates (job_id, review_status, confidence_score desc);

create index if not exists idx_sf_cost_ledger_job_created
  on public.service_finder_cost_ledger (job_id, created_at desc);

create index if not exists idx_sf_events_job_created
  on public.service_finder_job_events (job_id, created_at desc);

-- ---------------------------------------------------------------------------
-- RLS: admin SELECT; yazma yalnızca RPC (security definer) ve service_role
-- ---------------------------------------------------------------------------
alter table public.service_finder_provider_configs enable row level security;
alter table public.service_finder_profession_templates enable row level security;
alter table public.service_finder_jobs enable row level security;
alter table public.service_finder_job_queries enable row level security;
alter table public.service_finder_job_sources enable row level security;
alter table public.service_finder_candidates enable row level security;
alter table public.service_finder_job_events enable row level security;
alter table public.service_finder_cost_ledger enable row level security;

revoke all on table public.service_finder_provider_configs from anon, authenticated;
revoke all on table public.service_finder_profession_templates from anon, authenticated;
revoke all on table public.service_finder_jobs from anon, authenticated;
revoke all on table public.service_finder_job_queries from anon, authenticated;
revoke all on table public.service_finder_job_sources from anon, authenticated;
revoke all on table public.service_finder_candidates from anon, authenticated;
revoke all on table public.service_finder_job_events from anon, authenticated;
revoke all on table public.service_finder_cost_ledger from anon, authenticated;

-- Admin UI listeleri React Query ile doğrudan SELECT yapar (muhasebe deseni).
grant select on table public.service_finder_provider_configs to authenticated;
grant select on table public.service_finder_profession_templates to authenticated;
grant select on table public.service_finder_jobs to authenticated;
grant select on table public.service_finder_job_queries to authenticated;
grant select on table public.service_finder_job_sources to authenticated;
grant select on table public.service_finder_candidates to authenticated;
grant select on table public.service_finder_job_events to authenticated;
grant select on table public.service_finder_cost_ledger to authenticated;

drop policy if exists "admins_select_sf_provider_configs" on public.service_finder_provider_configs;
create policy "admins_select_sf_provider_configs"
  on public.service_finder_provider_configs for select
  to authenticated
  using (public.is_admin(auth.uid()));

drop policy if exists "admins_select_sf_templates" on public.service_finder_profession_templates;
create policy "admins_select_sf_templates"
  on public.service_finder_profession_templates for select
  to authenticated
  using (public.is_admin(auth.uid()));

drop policy if exists "admins_select_sf_jobs" on public.service_finder_jobs;
create policy "admins_select_sf_jobs"
  on public.service_finder_jobs for select
  to authenticated
  using (public.is_admin(auth.uid()));

drop policy if exists "admins_select_sf_job_queries" on public.service_finder_job_queries;
create policy "admins_select_sf_job_queries"
  on public.service_finder_job_queries for select
  to authenticated
  using (public.is_admin(auth.uid()));

drop policy if exists "admins_select_sf_job_sources" on public.service_finder_job_sources;
create policy "admins_select_sf_job_sources"
  on public.service_finder_job_sources for select
  to authenticated
  using (public.is_admin(auth.uid()));

drop policy if exists "admins_select_sf_candidates" on public.service_finder_candidates;
create policy "admins_select_sf_candidates"
  on public.service_finder_candidates for select
  to authenticated
  using (public.is_admin(auth.uid()));

drop policy if exists "admins_select_sf_job_events" on public.service_finder_job_events;
create policy "admins_select_sf_job_events"
  on public.service_finder_job_events for select
  to authenticated
  using (public.is_admin(auth.uid()));

drop policy if exists "admins_select_sf_cost_ledger" on public.service_finder_cost_ledger;
create policy "admins_select_sf_cost_ledger"
  on public.service_finder_cost_ledger for select
  to authenticated
  using (public.is_admin(auth.uid()));

-- ---------------------------------------------------------------------------
-- Seed: sağlayıcı ayarları (anahtarlar env'de — secret_ref yalnız referans)
-- ---------------------------------------------------------------------------
insert into public.service_finder_provider_configs
  (provider_key, provider_kind, display_name, is_enabled, priority, default_model, base_url, request_defaults, monthly_cap_usd, secret_ref)
values
  (
    'tavily', 'search', 'Tavily Search + Extract', true, 10,
    null, 'https://api.tavily.com',
    '{"search_depth": "basic", "max_results": 8, "extract_depth": "basic"}'::jsonb,
    100.0000, 'TAVILY_API_KEY'
  ),
  (
    'serpapi', 'search', 'SerpAPI Google Search', true, 20,
    null, 'https://serpapi.com',
    '{"gl": "de", "hl": "de", "google_domain": "google.de", "num": 10}'::jsonb,
    75.0000, 'SERPAPI_API_KEY'
  ),
  (
    'gemini', 'classify', 'Gemini Classifier', true, 10,
    'gemini-2.5-flash-lite', 'https://generativelanguage.googleapis.com',
    '{"temperature": 0.1, "fallback_model": "gemini-2.5-flash"}'::jsonb,
    50.0000, 'GEMINI_API_KEY'
  )
on conflict (provider_key) do nothing;

-- ---------------------------------------------------------------------------
-- Seed: Healthcare_Doctor şablonu (Dortmund doktor CSV baseline semantiği —
-- scripts/catalog-role-import-map.json ile uyumlu)
-- ---------------------------------------------------------------------------
insert into public.service_finder_profession_templates
  (template_key, label, role_key, item_type, category_slug,
   language_terms, must_exclude_terms, query_templates, default_max_queries,
   default_max_source_urls, default_max_extract_urls)
values
  (
    'healthcare-doctor', 'Doktor', 'Healthcare_Doctor', 'advisor', 'advisor-healthcare-doctor',
    array['Türk', 'Türkçe', 'Turkish speaking', 'Türkisch', 'türkische'],
    array['forum', 'reddit', 'job', 'stellenangebot', 'wikipedia'],
    '[
      "türkischer Arzt {{city}}",
      "Türkçe konuşan doktor {{city}}",
      "{{city}} Türk doktor",
      "turkish speaking doctor {{city}}",
      "türkische Ärzte {{city}} Praxis",
      "Türkçe doktor randevu {{city}}"
    ]'::jsonb,
    12, 40, 25
  )
on conflict (template_key) do nothing;
