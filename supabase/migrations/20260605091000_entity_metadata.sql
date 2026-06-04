begin;

-- Central description store for all three catalog types.
-- Attribute/feature/profile-section catalogs keep their own key+label.
-- Descriptions are read from here first; components fall back to catalog.description.

create table if not exists public.entity_metadata (
  id            uuid        primary key default gen_random_uuid(),
  entity_type   text        not null
                            check (entity_type in ('attribute', 'feature', 'profile_section')),
  entity_key    text        not null,
  description   text,
  admin_note    text,
  metadata      jsonb       not null default '{}'::jsonb,
  updated_by    uuid,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (entity_type, entity_key)
);

create index if not exists idx_entity_metadata_type_key
  on public.entity_metadata (entity_type, entity_key);

-- Backfill from attribute_catalog
insert into public.entity_metadata (entity_type, entity_key, description)
select 'attribute', key, description
from public.attribute_catalog
where description is not null
on conflict (entity_type, entity_key) do nothing;

-- Backfill from feature_catalog
insert into public.entity_metadata (entity_type, entity_key, description)
select 'feature', key, description
from public.feature_catalog
where description is not null
on conflict (entity_type, entity_key) do nothing;

-- Backfill from profile_section_catalog
insert into public.entity_metadata (entity_type, entity_key, description)
select 'profile_section', key, description
from public.profile_section_catalog
where description is not null
on conflict (entity_type, entity_key) do nothing;

-- RLS
alter table public.entity_metadata enable row level security;

drop policy if exists "entity_metadata_select_authenticated" on public.entity_metadata;
create policy "entity_metadata_select_authenticated"
  on public.entity_metadata
  for select
  to authenticated
  using (true);

drop policy if exists "entity_metadata_admin_all" on public.entity_metadata;
create policy "entity_metadata_admin_all"
  on public.entity_metadata
  for all
  to authenticated
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

-- RPC: admin upsert description/note for any entity
create or replace function public.admin_upsert_entity_metadata(
  p_entity_type text,
  p_entity_key  text,
  p_description text default null,
  p_admin_note  text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'forbidden'
      using errcode = '42501';
  end if;

  if p_entity_type is null or p_entity_type not in ('attribute', 'feature', 'profile_section') then
    raise exception 'invalid entity_type'
      using errcode = '22023';
  end if;

  if p_entity_key is null or btrim(p_entity_key) = '' then
    raise exception 'entity_key is required'
      using errcode = '22023';
  end if;

  insert into public.entity_metadata (entity_type, entity_key, description, admin_note, updated_by)
  values (p_entity_type, p_entity_key, p_description, p_admin_note, auth.uid())
  on conflict (entity_type, entity_key) do update
  set
    description = coalesce(excluded.description, public.entity_metadata.description),
    admin_note  = coalesce(excluded.admin_note,  public.entity_metadata.admin_note),
    updated_by  = excluded.updated_by,
    updated_at  = now();

  perform public.write_admin_audit_log(
    'entity_metadata.upserted',
    null,
    'entity_metadata',
    null,
    null,
    jsonb_build_object('entity_type', p_entity_type, 'entity_key', p_entity_key)
  );
end;
$$;

-- RPC: load everything for one role in a single round-trip.
-- Returns:
--   role         : {id, key, label}
--   attributes   : [{key, label, description, admin_note, rule: {...}}]
--   features     : [{key, label, description, admin_note, is_active_globally, is_enabled}]
--   sections     : [{key, label, description, admin_note, section_area, rule: {...}}]
create or replace function public.get_role_management_bundle(p_role_key text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role_id   uuid;
  v_role_label text;
  v_result    jsonb;
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'forbidden'
      using errcode = '42501';
  end if;

  select id, label
  into v_role_id, v_role_label
  from public.roles
  where key = p_role_key and is_active = true
  limit 1;

  if v_role_id is null then
    raise exception 'role not found: %', p_role_key
      using errcode = 'P0002';
  end if;

  -- Attributes
  with attr_rows as (
    select
      ac.key,
      ac.label,
      coalesce(em.description, ac.description) as description,
      em.admin_note,
      jsonb_build_object(
        'is_enabled',                           coalesce(rar.is_enabled, false),
        'is_required',                          coalesce(rar.is_required, false),
        'is_public_default',                    coalesce(rar.is_public_default, false),
        'user_can_edit',                        coalesce(rar.user_can_edit, true),
        'user_can_hide',                        coalesce(rar.user_can_hide, true),
        'requires_admin_approval_on_change',    coalesce(rar.requires_admin_approval_on_change, false),
        'sort_order',                           coalesce(rar.sort_order, ac.sort_order)
      ) as rule
    from public.attribute_catalog ac
    left join public.role_attribute_rules rar
      on rar.attribute_id = ac.id and rar.role_id = v_role_id
    left join public.entity_metadata em
      on em.entity_type = 'attribute' and em.entity_key = ac.key
    where ac.is_active = true
    order by coalesce(rar.sort_order, ac.sort_order), ac.key
  ),
  -- Features
  feat_rows as (
    select
      fc.key,
      fc.label,
      coalesce(em.description, fc.description) as description,
      em.admin_note,
      fc.is_active_globally,
      coalesce(rff.is_enabled, false) as is_enabled
    from public.feature_catalog fc
    left join public.role_feature_flags rff
      on rff.role_id = v_role_id and rff.feature_key = fc.key
    left join public.entity_metadata em
      on em.entity_type = 'feature' and em.entity_key = fc.key
    order by fc.key
  ),
  -- Profile sections
  sect_rows as (
    select
      psc.key,
      psc.label,
      coalesce(em.description, psc.description) as description,
      em.admin_note,
      psc.section_area,
      jsonb_build_object(
        'is_enabled',          coalesce(rpsr.is_enabled, false),
        'requires_approval',   coalesce(rpsr.requires_approval, false),
        'sort_order',          coalesce(rpsr.sort_order, psc.sort_order)
      ) as rule
    from public.profile_section_catalog psc
    left join public.role_profile_section_rules rpsr
      on rpsr.role_id = v_role_id and rpsr.section_id = psc.id
    left join public.entity_metadata em
      on em.entity_type = 'profile_section' and em.entity_key = psc.key
    where psc.is_active = true
    order by coalesce(rpsr.sort_order, psc.sort_order), psc.key
  )
  select jsonb_build_object(
    'role',       jsonb_build_object('id', v_role_id, 'key', p_role_key, 'label', v_role_label),
    'attributes', coalesce((select jsonb_agg(to_jsonb(r)) from attr_rows r), '[]'::jsonb),
    'features',   coalesce((select jsonb_agg(to_jsonb(r)) from feat_rows r), '[]'::jsonb),
    'sections',   coalesce((select jsonb_agg(to_jsonb(r)) from sect_rows r), '[]'::jsonb)
  )
  into v_result;

  return v_result;
end;
$$;

grant execute on function public.admin_upsert_entity_metadata(text, text, text, text) to authenticated;
grant execute on function public.get_role_management_bundle(text) to authenticated;

commit;
