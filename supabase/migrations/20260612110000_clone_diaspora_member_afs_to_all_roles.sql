-- Clone User_DiasporaMember AFS config to ALL roles
--
-- User decision (2026-06-11): every role must expose the same profile editor
-- as the Bireysel (User_DiasporaMember) profile — 24 role_attributes,
-- 44 role_features, 7 role_sections. Previous per-role configs are replaced
-- wholesale; a pre-change snapshot is kept in the afs_backup schema.
--
-- Source of truth: roles.key = 'User_DiasporaMember'.

-- 0) Snapshot current state (restore path if the unification is rolled back)
create schema if not exists afs_backup;
create table afs_backup.role_attributes_20260611 as table public.role_attributes;
create table afs_backup.role_features_20260611  as table public.role_features;
create table afs_backup.role_sections_20260611  as table public.role_sections;

do $$
declare
  v_src uuid;
begin
  select id into v_src from public.roles where key = 'User_DiasporaMember';
  if v_src is null then
    raise exception 'source role User_DiasporaMember not found';
  end if;

  -- 1) role_attributes
  delete from public.role_attributes where role_id <> v_src;
  insert into public.role_attributes (
    id, role_id, attribute_id, is_enabled, is_required, is_public_default,
    user_can_edit, user_can_hide, requires_admin_approval_on_change, sort_order,
    is_public, owner_can_edit, admin_can_edit, visibility
  )
  select
    gen_random_uuid(), r.id, s.attribute_id, s.is_enabled, s.is_required, s.is_public_default,
    s.user_can_edit, s.user_can_hide, s.requires_admin_approval_on_change, s.sort_order,
    s.is_public, s.owner_can_edit, s.admin_can_edit, s.visibility
  from public.role_attributes s
  cross join public.roles r
  where s.role_id = v_src
    and r.id <> v_src;

  -- 2) role_features
  delete from public.role_features where role_id <> v_src;
  insert into public.role_features (role_id, feature_key, is_enabled, visibility)
  select r.id, s.feature_key, s.is_enabled, s.visibility
  from public.role_features s
  cross join public.roles r
  where s.role_id = v_src
    and r.id <> v_src;

  -- 3) role_sections
  delete from public.role_sections where role_id <> v_src;
  insert into public.role_sections (id, role_id, section_id, is_enabled, requires_approval, sort_order, visibility)
  select gen_random_uuid(), r.id, s.section_id, s.is_enabled, s.requires_approval, s.sort_order, s.visibility
  from public.role_sections s
  cross join public.roles r
  where s.role_id = v_src
    and r.id <> v_src;
end $$;
