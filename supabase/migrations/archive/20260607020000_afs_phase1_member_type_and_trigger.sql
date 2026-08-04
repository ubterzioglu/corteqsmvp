begin;

insert into public.catalog_item_types (key, label, description)
values ('member', 'Member', 'Registered authenticated member bridge record')
on conflict (key) do update
set
  label = excluded.label,
  description = excluded.description,
  is_active = true,
  updated_at = now();

insert into public.feature_definitions (key, name, description)
values
  ('directory.visible', 'Directory Visibility', 'Controls whether the member profile is publicly listed'),
  ('profile.edit_own', 'Self Edit', 'Allows the member to edit their own catalog profile'),
  ('contact.receive', 'Contact Receive', 'Allows the member to receive contact requests')
on conflict (key) do update
set
  name = excluded.name,
  description = excluded.description,
  updated_at = now();

insert into public.feature_catalog (key, label, description, scope_role, is_active_globally)
values
  ('favorites', 'Favorites', 'Saved items for signed-in users', '*', true),
  ('external_links', 'External Links', 'Public website and social links', '*', true),
  ('media_gallery', 'Media Gallery', 'Public media attachments', '*', true),
  ('verification_badge', 'Verification Badge', 'Verified or official source markers', '*', true)
on conflict (key) do update
set
  label = excluded.label,
  description = excluded.description,
  scope_role = excluded.scope_role,
  is_active_globally = excluded.is_active_globally,
  updated_at = now();

insert into public.item_type_feature_defaults (item_type, feature_key, is_enabled)
values
  ('member', 'directory.visible', false),
  ('member', 'profile.edit_own', true),
  ('member', 'contact.receive', true),
  ('member', 'favorites', true),
  ('member', 'external_links', true),
  ('member', 'media_gallery', false),
  ('member', 'verification_badge', false)
on conflict (item_type, feature_key) do update
set
  is_enabled = excluded.is_enabled,
  updated_at = now();

insert into public.item_type_attribute_rules (
  item_type,
  attribute_id,
  is_enabled,
  is_required,
  is_public_default,
  editor_can_edit,
  editor_can_hide,
  requires_admin_approval_on_change,
  sort_order
)
select
  'member',
  ac.id,
  true,
  ac.key = 'full_name',
  ac.key in ('full_name', 'bio_short', 'profile_photo_url', 'country', 'city'),
  true,
  ac.key <> 'full_name',
  false,
  ac.sort_order
from public.attribute_catalog ac
where ac.key in (
  'full_name',
  'country',
  'city',
  'profile_photo_url',
  'bio_short',
  'interests',
  'expertise_area',
  'business_category',
  'organization_type',
  'main_platform',
  'ambassador_city'
)
  and ac.is_active = true
on conflict (item_type, attribute_id) do update
set
  is_enabled = excluded.is_enabled,
  is_required = excluded.is_required,
  is_public_default = excluded.is_public_default,
  editor_can_edit = excluded.editor_can_edit,
  editor_can_hide = excluded.editor_can_hide,
  requires_admin_approval_on_change = excluded.requires_admin_approval_on_change,
  sort_order = excluded.sort_order,
  updated_at = now();

create or replace function public.upsert_profile_from_auth_identity(
  p_user_id uuid,
  p_email text,
  p_raw_user_meta_data jsonb default '{}'::jsonb,
  p_raw_app_meta_data jsonb default '{}'::jsonb
)
returns public.profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  v_display_name text;
  v_avatar_url text;
  v_country_code text;
  v_profile public.profiles%rowtype;
  v_item_id uuid;
  v_existing_item_id uuid;
  v_slug text;
  v_title text;
begin
  if p_user_id is null then
    raise exception 'user id is required' using errcode = '22023';
  end if;

  v_display_name := nullif(
    btrim(
      coalesce(
        p_raw_user_meta_data ->> 'display_name',
        p_raw_user_meta_data ->> 'full_name',
        p_raw_user_meta_data ->> 'name',
        split_part(coalesce(p_email, 'corteqs-uye'), '@', 1)
      )
    ),
    ''
  );

  v_avatar_url := nullif(
    btrim(
      coalesce(
        p_raw_user_meta_data ->> 'avatar_url',
        p_raw_user_meta_data ->> 'picture'
      )
    ),
    ''
  );

  v_country_code := nullif(
    btrim(
      coalesce(
        p_raw_user_meta_data ->> 'country_code',
        p_raw_app_meta_data ->> 'country_code'
      )
    ),
    ''
  );

  insert into public.profiles (
    id,
    email,
    full_name,
    display_name,
    avatar_url,
    country_code,
    platform_role,
    directory_opt_in
  )
  values (
    p_user_id,
    p_email,
    v_display_name,
    v_display_name,
    v_avatar_url,
    v_country_code,
    'user',
    false
  )
  on conflict (id) do update
  set
    email = coalesce(excluded.email, public.profiles.email),
    full_name = coalesce(nullif(excluded.full_name, ''), public.profiles.full_name),
    display_name = coalesce(nullif(excluded.display_name, ''), public.profiles.display_name, public.profiles.full_name),
    avatar_url = coalesce(nullif(excluded.avatar_url, ''), public.profiles.avatar_url),
    country_code = coalesce(nullif(excluded.country_code, ''), public.profiles.country_code),
    updated_at = now()
  returning * into v_profile;

  if to_regclass('public.user_profiles') is not null then
    insert into public.user_profiles (
      user_id,
      email,
      full_name,
      profile_type,
      auth_provider,
      avatar_url
    )
    values (
      p_user_id,
      p_email,
      v_profile.display_name,
      'bireysel',
      coalesce(nullif(p_raw_app_meta_data ->> 'provider', ''), 'unknown'),
      v_profile.avatar_url
    )
    on conflict (user_id) do update
    set
      email = coalesce(excluded.email, public.user_profiles.email),
      full_name = coalesce(nullif(excluded.full_name, ''), public.user_profiles.full_name),
      auth_provider = coalesce(nullif(excluded.auth_provider, ''), public.user_profiles.auth_provider),
      avatar_url = coalesce(nullif(excluded.avatar_url, ''), public.user_profiles.avatar_url),
      updated_at = now();
  end if;

  if to_regclass('public.catalog_items') is not null then
    select ci.id
    into v_existing_item_id
    from public.catalog_items ci
    where ci.linked_user_id = p_user_id
      and ci.item_type = 'member'
    order by ci.created_at asc
    limit 1;

    v_slug := 'member-' || substr(replace(p_user_id::text, '-', ''), 1, 16);
    v_title := coalesce(v_display_name, split_part(coalesce(p_email, 'corteqs-uye'), '@', 1));

    if v_existing_item_id is null then
      if exists (
        select 1
        from public.catalog_items ci
        where ci.slug = v_slug
          and ci.linked_user_id is distinct from p_user_id
      ) then
        v_slug := v_slug || '-' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 4);
      end if;

      insert into public.catalog_items (
        item_type,
        slug,
        title,
        status,
        visibility,
        verification_status,
        linked_user_id,
        created_by_user_id,
        attributes
      )
      values (
        'member',
        v_slug,
        v_title,
        'published',
        'private',
        'claimed',
        p_user_id,
        p_user_id,
        jsonb_build_object('bridge_source', 'afs_member')
      )
      on conflict (slug) do nothing
      returning id into v_item_id;

      if v_item_id is null then
        select ci.id
        into v_item_id
        from public.catalog_items ci
        where ci.linked_user_id = p_user_id
          and ci.item_type = 'member'
        order by ci.created_at asc
        limit 1;
      end if;
    else
      update public.catalog_items
      set
        title = coalesce(v_title, title),
        linked_user_id = p_user_id,
        created_by_user_id = coalesce(created_by_user_id, p_user_id),
        updated_at = now()
      where id = v_existing_item_id;

      v_item_id := v_existing_item_id;
    end if;

    if v_item_id is not null then
      insert into public.catalog_item_memberships (item_id, user_id, role, status)
      values (v_item_id, p_user_id, 'owner', 'active')
      on conflict (item_id, user_id, role) do update
      set
        status = 'active',
        updated_at = now();
    end if;
  end if;

  select *
  into v_profile
  from public.profiles
  where id = p_user_id;

  return v_profile;
end;
$$;

comment on function public.upsert_profile_from_auth_identity(uuid, text, jsonb, jsonb) is
  'AFS bridge helper: keeps profiles and user_profiles intact while also ensuring a member catalog item exists.';

do $$
declare
  r record;
  v_slug text;
  v_item_id uuid;
begin
  for r in
    select
      p.id,
      p.email,
      coalesce(nullif(p.display_name, ''), nullif(p.full_name, ''), split_part(coalesce(p.email, 'corteqs-uye'), '@', 1)) as resolved_title
    from public.profiles p
    where not exists (
      select 1
      from public.catalog_items ci
      where ci.linked_user_id = p.id
        and ci.item_type = 'member'
    )
  loop
    v_slug := 'member-' || substr(replace(r.id::text, '-', ''), 1, 16);

    if exists (
      select 1
      from public.catalog_items ci
      where ci.slug = v_slug
        and ci.linked_user_id is distinct from r.id
    ) then
      v_slug := v_slug || '-' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 4);
    end if;

    insert into public.catalog_items (
      item_type,
      slug,
      title,
      status,
      visibility,
      verification_status,
      linked_user_id,
      created_by_user_id,
      attributes
    )
    values (
      'member',
      v_slug,
      r.resolved_title,
      'published',
      'private',
      'claimed',
      r.id,
      r.id,
      jsonb_build_object('bridge_source', 'afs_member_backfill')
    )
    on conflict (slug) do nothing
    returning id into v_item_id;

    if v_item_id is null then
      select ci.id
      into v_item_id
      from public.catalog_items ci
      where ci.linked_user_id = r.id
        and ci.item_type = 'member'
      order by ci.created_at asc
      limit 1;
    end if;

    if v_item_id is not null then
      insert into public.catalog_item_memberships (item_id, user_id, role, status)
      values (v_item_id, r.id, 'owner', 'active')
      on conflict (item_id, user_id, role) do update
      set
        status = 'active',
        updated_at = now();
    end if;
  end loop;
end
$$;

commit;
