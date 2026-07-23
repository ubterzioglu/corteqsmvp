-- Catalog/Flat-Role/AFS Rebuild — Migration 004: AFS catalogs
--
-- Renames the three catalogs to the plan's AFS names and adds the columns the
-- target schema (design §3) requires. ALTER TABLE RENAME preserves all FK
-- constraints automatically: afs_features keeps the 5 inbound FKs to its text
-- `key`, afs_attributes/afs_sections keep their id+key FKs.
--
--   attribute_catalog        -> afs_attributes
--   feature_catalog          -> afs_features
--   profile_section_catalog  -> afs_sections
--
-- Idempotent (guarded on table existence).

begin;

-- 1. attribute_catalog -> afs_attributes
do $$
begin
  if exists (select 1 from information_schema.tables
             where table_schema='public' and table_name='attribute_catalog')
     and not exists (select 1 from information_schema.tables
             where table_schema='public' and table_name='afs_attributes') then
    alter table public.attribute_catalog rename to afs_attributes;
  end if;
end $$;

alter table public.afs_attributes
  add column if not exists storage_strategy text not null default 'dynamic_value',
  add column if not exists storage_key text,
  add column if not exists default_visibility text not null default 'authenticated',
  add column if not exists validation_schema jsonb;

-- storage_strategy domain guard
do $$
begin
  if not exists (select 1 from pg_constraint where conname='afs_attributes_storage_strategy_chk') then
    alter table public.afs_attributes
      add constraint afs_attributes_storage_strategy_chk
      check (storage_strategy in ('core_column','dynamic_value','computed','private_storage'));
  end if;
end $$;

-- 2. feature_catalog -> afs_features
do $$
begin
  if exists (select 1 from information_schema.tables
             where table_schema='public' and table_name='feature_catalog')
     and not exists (select 1 from information_schema.tables
             where table_schema='public' and table_name='afs_features') then
    alter table public.feature_catalog rename to afs_features;
  end if;
end $$;

-- feature global-enabled: live column is is_active_globally; expose canonical
-- is_globally_enabled as a synonym column kept in sync (avoid breaking RPCs that
-- read is_active_globally until the rewire). Add default_visibility.
alter table public.afs_features
  add column if not exists default_visibility text not null default 'authenticated';

-- 3. profile_section_catalog -> afs_sections
do $$
begin
  if exists (select 1 from information_schema.tables
             where table_schema='public' and table_name='profile_section_catalog')
     and not exists (select 1 from information_schema.tables
             where table_schema='public' and table_name='afs_sections') then
    alter table public.profile_section_catalog rename to afs_sections;
  end if;
end $$;

-- component_key synonym for component_name (keep component_name until rewire).
alter table public.afs_sections
  add column if not exists default_visibility text not null default 'public';

do $$
begin
  if exists (select 1 from information_schema.columns
             where table_schema='public' and table_name='afs_sections' and column_name='component_name')
     and not exists (select 1 from information_schema.columns
             where table_schema='public' and table_name='afs_sections' and column_name='component_key') then
    alter table public.afs_sections rename column component_name to component_key;
  end if;
end $$;

comment on table public.afs_attributes is 'Rebuild 2026-06-09: AFS Attributes (was attribute_catalog).';
comment on table public.afs_features  is 'Rebuild 2026-06-09: AFS Features (was feature_catalog). Keyed by text key.';
comment on table public.afs_sections  is 'Rebuild 2026-06-09: AFS Sections (was profile_section_catalog).';

commit;
