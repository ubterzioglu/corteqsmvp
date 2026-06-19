-- Relocation Engine — çekirdek şema (Faz 1a).
-- docs/plans/relocation-engine/relocation-engine-e2e.md §3 ve schemas/*.json sözleşmeleri.
-- Yazma yolu: kullanıcı-facing mutasyonlar yalnızca security-definer RPC'ler üzerinden
-- (20260619102000_relocation_recommendations.sql). Referans içerik tabloları (locations/
-- services/bureaucratic_steps/emergency_contacts) public read; ingestion worker service_role
-- ile yazar (Faz 2). RLS politikaları 20260619101000_relocation_rls.sql'de.

-- ---------------------------------------------------------------------------
-- 1) Kaynak kayıt defteri (sır YOK — secret_ref yalnızca worker env değişken adıdır)
-- ---------------------------------------------------------------------------
create table if not exists public.relocation_source_registry (
  id uuid primary key default gen_random_uuid(),
  source_key text not null unique,
  provider_name text not null,
  authority_level text not null
    check (authority_level in ('official', 'official_city', 'regulator', 'licensed_commercial', 'verified_community', 'user_generated')),
  category text,
  license_type text,
  api_terms_summary text,
  refresh_sla_hours integer not null default 168,
  secret_ref text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.relocation_source_registry is
  'Relocation veri kaynakları + güvenilirlik. secret_ref = worker env değişken adı; ham anahtar DB''de tutulmaz. Detay: docs/plans/relocation-engine/source-registry.md';

-- authority_level → varsayılan trust_score (0..1). Kaynak yoksa 0.30.
create or replace function public.relocation_authority_trust(p_level text)
returns numeric
language sql
immutable
set search_path = public
as $$
  select case coalesce(p_level, '')
    when 'official' then 1.00
    when 'official_city' then 0.98
    when 'regulator' then 0.95
    when 'licensed_commercial' then 0.80
    when 'verified_community' then 0.55
    when 'user_generated' then 0.30
    else 0.30
  end::numeric;
$$;

-- ---------------------------------------------------------------------------
-- 2) Lokasyonlar (geo_countries/geo_cities tek kaynak; burada relocation metrikleri)
-- ---------------------------------------------------------------------------
create table if not exists public.relocation_locations (
  id uuid primary key default gen_random_uuid(),
  country_code text not null,                       -- ISO 3166-1 alpha-2
  city_code text not null,                          -- ör. BERLIN
  city_name text not null,
  district text,
  lat double precision,
  lon double precision,
  -- Skorlama girdileri (0..1 normalize; null = bilinmiyor, sert filtre değil)
  cost_index numeric(6,3),                          -- yaşam maliyeti (düşük = ucuz)
  safety_index numeric(6,3),
  housing_availability numeric(6,3),
  healthcare_access numeric(6,3),
  gsm_coverage numeric(6,3),
  community_density numeric(6,3),                   -- Türk topluluğu yoğunluğu
  flight_access numeric(6,3),
  bureaucracy_complexity numeric(6,3),              -- yüksek = zor (skorda ceza)
  language_availability text[] not null default '{}'::text[],
  source_id uuid references public.relocation_source_registry(id) on delete set null,
  freshness_at timestamptz,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (country_code, city_code)
);

create index if not exists relocation_locations_country_idx
  on public.relocation_locations (country_code) where is_active;

-- ---------------------------------------------------------------------------
-- 3) Servisler (housing/airline/gsm/doctor/community tek tabloda normalize)
-- ---------------------------------------------------------------------------
create table if not exists public.relocation_services (
  id uuid primary key default gen_random_uuid(),
  category text not null
    check (category in ('housing', 'airline', 'gsm_operator', 'doctor', 'community_hub')),
  provider_name text not null,
  location_id uuid references public.relocation_locations(id) on delete set null,
  country_code text not null,
  city_code text,
  district text,
  plan_name text,
  price_min numeric(12,2),
  price_max numeric(12,2),
  currency text,
  contract_months integer,
  coverage_score numeric(4,3),
  languages text[] not null default '{}'::text[],
  website_url text,
  appointment_url text,
  source_id uuid references public.relocation_source_registry(id) on delete set null,
  trust_score numeric(4,3) not null default 0.300,
  freshness_at timestamptz,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists relocation_services_lookup_idx
  on public.relocation_services (country_code, city_code, category) where is_active;

-- ---------------------------------------------------------------------------
-- 4) Bürokratik adımlar (ülke/şehir parametrik — görev üretiminin omurgası)
-- ---------------------------------------------------------------------------
create table if not exists public.relocation_bureaucratic_steps (
  id uuid primary key default gen_random_uuid(),
  country_code text not null,
  city_code text,
  name text not null,
  description text,
  trigger text not null
    check (trigger in ('before_departure', 'after_arrival', 'ongoing')),
  deadline_rule text,                               -- ör. within_14_days
  sort_order integer not null default 100,
  required_documents text[] not null default '{}'::text[],
  output_artifacts text[] not null default '{}'::text[],
  official_url_label text,
  official_url text,
  source_id uuid references public.relocation_source_registry(id) on delete set null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists relocation_steps_lookup_idx
  on public.relocation_bureaucratic_steps (country_code, city_code) where is_active;

-- ---------------------------------------------------------------------------
-- 5) Acil iletişim (112, polis, konsolosluk vb.)
-- ---------------------------------------------------------------------------
create table if not exists public.relocation_emergency_contacts (
  id uuid primary key default gen_random_uuid(),
  country_code text not null,
  city_code text,
  type text not null,                               -- emergency / police / poison / consulate / fire / medical
  label text not null,
  phone text,
  url text,
  source_id uuid references public.relocation_source_registry(id) on delete set null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists relocation_emergency_lookup_idx
  on public.relocation_emergency_contacts (country_code, city_code) where is_active;

-- ---------------------------------------------------------------------------
-- 6) Taşınma dosyaları (aggregate root — kullanıcıya ait)
-- ---------------------------------------------------------------------------
create table if not exists public.relocation_moves (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  status text not null default 'draft'
    check (status in ('draft', 'active', 'archived')),
  origin_country_code text,
  origin_city_code text,
  target_country_codes text[] not null default '{}'::text[],
  move_window_start date,
  move_window_end date,
  budget_monthly numeric(12,2),
  setup_budget_max numeric(12,2),
  currency text not null default 'EUR',
  -- Hane: coarse-grained; accessibility_needs etiket listesi (teşhis/sağlık verisi DEĞİL — GDPR min.)
  household jsonb not null default '{}'::jsonb,
  must_haves text[] not null default '{}'::text[],
  nice_to_haves text[] not null default '{}'::text[],
  wizard_answers jsonb not null default '{}'::jsonb,
  preferred_language text not null default 'tr-TR',
  allow_personalization boolean not null default true,
  allow_partner_referrals boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists relocation_moves_user_idx
  on public.relocation_moves (user_id, created_at desc);

-- ---------------------------------------------------------------------------
-- 7) Öneriler (skor bileşenleri saklanır — açıklanabilirlik + denetim)
-- ---------------------------------------------------------------------------
create table if not exists public.relocation_recommendations (
  id uuid primary key default gen_random_uuid(),
  move_id uuid not null references public.relocation_moves(id) on delete cascade,
  entity_type text not null check (entity_type in ('location', 'service', 'bureaucratic_step')),
  entity_id uuid not null,
  hard_filter_pass boolean not null default true,
  rule_score numeric(6,4),
  ml_score numeric(6,4),
  final_score numeric(6,4),
  score_breakdown jsonb not null default '{}'::jsonb,
  explanations jsonb not null default '[]'::jsonb,   -- Türkçe "why" cümleleri
  rank_position integer,
  model_version text,
  policy_version text,
  created_at timestamptz not null default now()
);

create index if not exists relocation_recommendations_move_idx
  on public.relocation_recommendations (move_id, entity_type, rank_position);

-- ---------------------------------------------------------------------------
-- 8) Etkileşimler (eğitim veri havuzu — anonimize user ref + context)
-- ---------------------------------------------------------------------------
create table if not exists public.relocation_interactions (
  id bigint generated always as identity primary key,
  user_id uuid not null default auth.uid(),
  move_id uuid references public.relocation_moves(id) on delete set null,
  entity_type text,
  entity_id uuid,
  event_type text not null
    check (event_type in ('impression', 'click', 'save', 'dismiss', 'compare', 'click_out', 'checklist_complete', 'move_success')),
  rank_position integer,
  context jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists relocation_interactions_move_idx
  on public.relocation_interactions (move_id, event_type, created_at desc);
