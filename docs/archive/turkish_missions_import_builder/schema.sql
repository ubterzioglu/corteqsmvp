-- Turkish overseas missions database schema
-- Target: PostgreSQL / Supabase
-- Source-of-truth records are scraped from official MFA pages.
-- Run this file once before importing the generated output/turkish_missions_import.sql.

create extension if not exists pgcrypto;

create table if not exists public.turkish_missions (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  country text,
  country_code text,
  city text,
  city_normalized text,
  mission_name text not null,
  mission_name_normalized text,
  mission_type text not null check (
    mission_type in (
      'embassy',
      'consulate_general',
      'consulate',
      'consular_office',
      'honorary_consulate_general',
      'honorary_consulate',
      'permanent_mission',
      'other_mission'
    )
  ),
  parent_mission_slug text,
  address text,
  phones jsonb not null default '[]'::jsonb,
  emails jsonb not null default '[]'::jsonb,
  faxes jsonb not null default '[]'::jsonb,
  emergency_phones jsonb not null default '[]'::jsonb,
  website_url text,
  appointment_url text default 'https://www.konsolosluk.gov.tr/',
  jurisdiction text,
  working_hours text,
  office_hours_structured jsonb not null default '{}'::jsonb,
  consular_call_center text,
  parser_confidence integer not null default 0 check (parser_confidence between 0 and 100),
  data_completeness_score integer not null default 0 check (data_completeness_score between 0 and 100),
  status text not null default 'active' check (status in ('active', 'inactive', 'needs_review')),
  verification_status text not null default 'official_source_scraped',
  source_hash text,
  source_url text not null unique,
  scraped_at timestamptz not null default now(),
  last_verified_at timestamptz not null default now(),
  contact_fields jsonb not null default '{}'::jsonb,
  raw_snapshot jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists turkish_missions_country_idx
  on public.turkish_missions(country);
create index if not exists turkish_missions_country_code_idx
  on public.turkish_missions(country_code);
create index if not exists turkish_missions_city_idx
  on public.turkish_missions(city);
create index if not exists turkish_missions_city_normalized_idx
  on public.turkish_missions(city_normalized);
create index if not exists turkish_missions_type_idx
  on public.turkish_missions(mission_type);
create index if not exists turkish_missions_name_normalized_idx
  on public.turkish_missions(mission_name_normalized);
create index if not exists turkish_missions_parent_idx
  on public.turkish_missions(parent_mission_slug);

create table if not exists public.turkish_mission_units (
  id uuid primary key default gen_random_uuid(),
  source_key text not null unique,
  mission_slug text not null references public.turkish_missions(slug)
    on update cascade on delete cascade,
  unit_name text not null,
  unit_type text not null default 'attached_unit',
  address text,
  phones jsonb not null default '[]'::jsonb,
  emails jsonb not null default '[]'::jsonb,
  faxes jsonb not null default '[]'::jsonb,
  websites jsonb not null default '[]'::jsonb,
  jurisdiction text,
  source_url text not null,
  scraped_at timestamptz not null default now(),
  raw_snapshot jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists turkish_mission_units_mission_idx
  on public.turkish_mission_units(mission_slug);
create index if not exists turkish_mission_units_type_idx
  on public.turkish_mission_units(unit_type);

create table if not exists public.turkish_mission_relations (
  id uuid primary key default gen_random_uuid(),
  source_key text not null unique,
  parent_mission_slug text not null references public.turkish_missions(slug)
    on update cascade on delete cascade,
  child_mission_slug text not null references public.turkish_missions(slug)
    on update cascade on delete cascade,
  relation_type text not null default 'connected_mission',
  source_url text not null,
  scraped_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists turkish_mission_relations_parent_idx
  on public.turkish_mission_relations(parent_mission_slug);
create index if not exists turkish_mission_relations_child_idx
  on public.turkish_mission_relations(child_mission_slug);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_turkish_missions_updated_at on public.turkish_missions;
create trigger set_turkish_missions_updated_at
before update on public.turkish_missions
for each row execute function public.set_updated_at();

drop trigger if exists set_turkish_mission_units_updated_at on public.turkish_mission_units;
create trigger set_turkish_mission_units_updated_at
before update on public.turkish_mission_units
for each row execute function public.set_updated_at();

drop trigger if exists set_turkish_mission_relations_updated_at on public.turkish_mission_relations;
create trigger set_turkish_mission_relations_updated_at
before update on public.turkish_mission_relations
for each row execute function public.set_updated_at();

comment on table public.turkish_missions is
  'Official Turkish overseas missions. Unstructured official-page content is retained in raw_snapshot.';
comment on table public.turkish_mission_units is
  'Attached offices such as labour, education, trade, military, religious and press units.';
comment on table public.turkish_mission_relations is
  'Parent-child links between official Turkish missions, including embassy-connected consulates.';
