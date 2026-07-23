-- Catalog/Flat-Role/AFS Rebuild — Migration 005: role <-> AFS relations
--
-- Renames the three relation tables to the plan's names. RENAME preserves the
-- role_id / attribute_id / section_id / feature_key FKs automatically.
--
--   role_attribute_rules        -> role_attributes
--   role_feature_flags          -> role_features        (keeps feature_key text FK
--                                  per Checkpoint-1 decision: consistent with the
--                                  other 4 feature-referencing tables)
--   role_profile_section_rules  -> role_sections
--
-- Adds the rule columns the target schema (design §3) expects where missing, and
-- ensures the unique constraints (role_id, X) exist.
--
-- Idempotent.

begin;

-- 1. role_attribute_rules -> role_attributes
do $$
begin
  if exists (select 1 from information_schema.tables
             where table_schema='public' and table_name='role_attribute_rules')
     and not exists (select 1 from information_schema.tables
             where table_schema='public' and table_name='role_attributes') then
    alter table public.role_attribute_rules rename to role_attributes;
  end if;
end $$;

alter table public.role_attributes
  add column if not exists is_required boolean not null default false,
  add column if not exists is_public boolean not null default true,
  add column if not exists owner_can_edit boolean not null default true,
  add column if not exists admin_can_edit boolean not null default true,
  add column if not exists visibility text not null default 'public',
  add column if not exists sort_order integer not null default 0;

do $$
begin
  if not exists (select 1 from pg_constraint where conname='role_attributes_role_attr_uniq') then
    -- only add if no equivalent unique already exists on (role_id, attribute_id)
    if not exists (
      select 1 from pg_indexes where schemaname='public' and tablename='role_attributes'
      and indexdef ilike '%unique%role_id%attribute_id%') then
      alter table public.role_attributes
        add constraint role_attributes_role_attr_uniq unique (role_id, attribute_id);
    end if;
  end if;
end $$;

-- 2. role_feature_flags -> role_features (keep feature_key)
do $$
begin
  if exists (select 1 from information_schema.tables
             where table_schema='public' and table_name='role_feature_flags')
     and not exists (select 1 from information_schema.tables
             where table_schema='public' and table_name='role_features') then
    alter table public.role_feature_flags rename to role_features;
  end if;
end $$;

alter table public.role_features
  add column if not exists visibility text not null default 'authenticated';

do $$
begin
  if not exists (
    select 1 from pg_indexes where schemaname='public' and tablename='role_features'
    and indexdef ilike '%unique%role_id%feature_key%') then
    alter table public.role_features
      add constraint role_features_role_feat_uniq unique (role_id, feature_key);
  end if;
end $$;

-- 3. role_profile_section_rules -> role_sections
do $$
begin
  if exists (select 1 from information_schema.tables
             where table_schema='public' and table_name='role_profile_section_rules')
     and not exists (select 1 from information_schema.tables
             where table_schema='public' and table_name='role_sections') then
    alter table public.role_profile_section_rules rename to role_sections;
  end if;
end $$;

alter table public.role_sections
  add column if not exists is_enabled boolean not null default true,
  add column if not exists visibility text not null default 'public',
  add column if not exists sort_order integer not null default 0;

do $$
begin
  if not exists (
    select 1 from pg_indexes where schemaname='public' and tablename='role_sections'
    and indexdef ilike '%unique%role_id%section_id%') then
    alter table public.role_sections
      add constraint role_sections_role_sec_uniq unique (role_id, section_id);
  end if;
end $$;

comment on table public.role_attributes is 'Rebuild 2026-06-09: explicit role->attribute rows (was role_attribute_rules). No inheritance.';
comment on table public.role_features   is 'Rebuild 2026-06-09: explicit role->feature rows (was role_feature_flags). Keyed by feature_key.';
comment on table public.role_sections   is 'Rebuild 2026-06-09: explicit role->section rows (was role_profile_section_rules). No inheritance.';

commit;
