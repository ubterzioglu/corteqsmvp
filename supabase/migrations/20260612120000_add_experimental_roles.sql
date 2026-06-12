-- Add two experimental roles cloned from User_DiasporaMember
--
-- User request (2026-06-12): create "Experimental 1" and "Experimental 2"
-- roles as exact copies of the Bireysel (User_DiasporaMember) role so role
-- customizations can be trialled without touching production roles.
-- AFS config (role_attributes / role_features / role_sections) is cloned
-- 1:1 from the source role (24 attrs / 44 features / 7 sections as of today).
--
-- Idempotent: roles upsert on key; AFS rows are delete-then-insert per role.

do $$
declare
  v_src uuid;
  v_role uuid;
  v_key text;
  v_label text;
  v_sort integer;
begin
  select id into v_src from public.roles where key = 'User_DiasporaMember';
  if v_src is null then
    raise exception 'source role User_DiasporaMember not found';
  end if;

  for v_key, v_label, v_sort in
    values ('Experimental_1', 'Experimental 1', 9001),
           ('Experimental_2', 'Experimental 2', 9002)
  loop
    insert into public.roles (key, label, description, sort_order,
                              is_active, is_assignable, is_directory_visible, is_system)
    select v_key, v_label,
           'Deneysel rol — User_DiasporaMember kopyası (2026-06-12)', v_sort,
           s.is_active, s.is_assignable, s.is_directory_visible, false
    from public.roles s
    where s.id = v_src
    on conflict (key) do nothing;

    select id into v_role from public.roles where key = v_key;

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
  end loop;
end $$;
