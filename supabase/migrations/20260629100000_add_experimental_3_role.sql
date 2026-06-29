-- Add Experimental_3 role cloned from Experimental_2
--
-- User request (2026-06-29): create "Experimental 3" as an exact copy of the
-- existing Experimental_2 premium-pilot role. The frontend already binds
-- Experimental_3 to the premium presentation
-- (src/lib/profile-presentation.ts -> supportedRoleKeys includes "Experimental_3"),
-- so this migration just materializes the DB role behind that placeholder.
-- AFS config (role_attributes / role_features / role_sections) is cloned 1:1
-- from Experimental_2 (which itself is a User_DiasporaMember clone).
--
-- Idempotent: role upsert on key; AFS rows are delete-then-insert for the target.

do $$
declare
  v_src uuid;
  v_role uuid;
begin
  select id into v_src from public.roles where key = 'Experimental_2';
  if v_src is null then
    raise exception 'source role Experimental_2 not found';
  end if;

  insert into public.roles (key, label, description, sort_order,
                            is_active, is_assignable, is_directory_visible, is_system)
  select 'Experimental_3', 'Experimental 3',
         'Deneysel rol — Experimental_2 kopyası (2026-06-29)', 9003,
         s.is_active, s.is_assignable, s.is_directory_visible, false
  from public.roles s
  where s.id = v_src
  on conflict (key) do nothing;

  select id into v_role from public.roles where key = 'Experimental_3';

  -- role_attributes
  delete from public.role_attributes where role_id = v_role;
  insert into public.role_attributes (
    id, role_id, attribute_id, is_enabled, is_required, is_public_default,
    user_can_edit, user_can_hide, requires_admin_approval_on_change, sort_order,
    is_public, owner_can_edit, admin_can_edit, visibility
  )
  select
    gen_random_uuid(), v_role, s.attribute_id, s.is_enabled, s.is_required, s.is_public_default,
    s.user_can_edit, s.user_can_hide, s.requires_admin_approval_on_change, s.sort_order,
    s.is_public, s.owner_can_edit, s.admin_can_edit, s.visibility
  from public.role_attributes s
  where s.role_id = v_src;

  -- role_features
  delete from public.role_features where role_id = v_role;
  insert into public.role_features (role_id, feature_key, is_enabled, visibility)
  select v_role, s.feature_key, s.is_enabled, s.visibility
  from public.role_features s
  where s.role_id = v_src;

  -- role_sections
  delete from public.role_sections where role_id = v_role;
  insert into public.role_sections (id, role_id, section_id, is_enabled, requires_approval, sort_order, visibility)
  select gen_random_uuid(), v_role, s.section_id, s.is_enabled, s.requires_approval, s.sort_order, s.visibility
  from public.role_sections s
  where s.role_id = v_src;
end $$;
