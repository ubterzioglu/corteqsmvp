begin;

-- ─── Trigger'ları kaldır ──────────────────────────────────────────────────────

-- user_profiles üzerindeki sync trigger (artık tablo kalkıyor)
drop trigger if exists trg_sync_user_role_assignment_from_profile_type on public.user_profiles;

-- user_role_assignments üzerindeki sync trigger (user_profiles kalktıktan sonra işlevsiz)
drop trigger if exists trg_sync_profile_type_from_user_role_assignment on public.user_role_assignments;

-- feature_catalog üzerindeki role_feature_defaults sync trigger (migration 3'te drop edildi, güvence olarak tekrar)
drop trigger if exists trg_sync_role_feature_default_on_catalog_insert on public.feature_catalog;

-- auth.users üzerindeki profile creation trigger'ları
drop trigger if exists on_auth_user_created_profile on auth.users;
drop trigger if exists on_auth_user_created_user_profile_v2 on auth.users;
drop trigger if exists on_auth_user_created on auth.users;

-- ─── Fonksiyonları kaldır ─────────────────────────────────────────────────────

drop function if exists public.sync_user_role_assignment_from_profile_type() cascade;
drop function if exists public.sync_profile_type_from_user_role_assignment() cascade;
drop function if exists public.sync_role_feature_default_on_catalog_insert() cascade;
drop function if exists public.handle_auth_user_profile() cascade;
drop function if exists public.handle_auth_user_profile_v2() cascade;
drop function if exists public.handle_new_user() cascade;

-- ─── user_profiles'a bağlı SQL stored procedure'leri güncelle ────────────────
-- get_current_user_profile: user_profiles yerine user_role_assignments + auth.users

create or replace function public.get_current_user_profile()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_role_key text;
  v_role_id uuid;
  v_role_label text;
  v_role_description text;
  v_role_slug text;
  v_full_name text;
  v_email text;
  v_features jsonb;
  v_attributes jsonb;
  v_pending jsonb;
  v_completion_total integer;
  v_completion_completed integer;
begin
  if v_user_id is null then
    return '{}'::jsonb;
  end if;

  -- auth.users'tan email al
  select au.email
  into v_email
  from auth.users au
  where au.id = v_user_id;

  -- full_name attribute'tan al
  select upa.value_text
  into v_full_name
  from public.user_profile_attributes upa
  join public.attribute_catalog ac on ac.id = upa.attribute_id
  where upa.user_id = v_user_id
    and ac.key = 'full_name'
  limit 1;

  -- Rolü user_role_assignments'tan al
  select r.id, r.key, r.label, r.description
  into v_role_id, v_role_key, v_role_label, v_role_description
  from public.user_role_assignments ura
  join public.roles r on r.id = ura.role_id
  where ura.user_id = v_user_id
  limit 1;

  if v_role_key is null then
    return jsonb_build_object(
      'user_id', v_user_id,
      'email', v_email,
      'full_name', v_full_name,
      'profile_type', null,
      'role_key', null,
      'features', '[]'::jsonb,
      'attributes', '[]'::jsonb,
      'pending_requests', '[]'::jsonb,
      'profile_completion', jsonb_build_object('required_total', 0, 'required_completed', 0, 'percentage', 100)
    );
  end if;

  v_role_slug := case v_role_key
    when 'bireysel' then 'individual'
    when 'danisman' then 'consultant'
    when 'isletme' then 'business'
    when 'kurulus-dernek' then 'organization'
    when 'blogger-vlogger-youtuber' then 'influencer'
    when 'sehir-elcisi' then 'ambassador'
    else v_role_key
  end;

  select coalesce(jsonb_agg(jsonb_build_object(
    'key', feature_key,
    'is_enabled', is_enabled,
    'source', source
  ) order by feature_key), '[]'::jsonb)
  into v_features
  from public.get_current_user_features();

  select coalesce(jsonb_agg(jsonb_build_object(
    'attribute_key', ac.key,
    'label', ac.label,
    'description', ac.description,
    'data_type', ac.data_type,
    'is_system', ac.is_system,
    'sort_order', rar.sort_order,
    'is_required', rar.is_required,
    'is_public_default', rar.is_public_default,
    'user_can_edit', rar.user_can_edit,
    'user_can_hide', rar.user_can_hide,
    'requires_admin_approval_on_change', rar.requires_admin_approval_on_change,
    'visibility', coalesce(
      upa.visibility,
      case when rar.is_public_default then 'public' else 'private' end
    ),
    'approval_status', coalesce(upa.approval_status, 'approved'),
    'value_text', coalesce(upa.value_text, case when ac.key = 'full_name' then v_full_name else null end),
    'value_json', upa.value_json,
    'display_value', case
      when ac.key = 'full_name' then to_jsonb(coalesce(v_full_name, ''))
      when upa.value_json is not null then upa.value_json
      else to_jsonb(coalesce(upa.value_text, ''))
    end
  ) order by rar.sort_order, ac.label), '[]'::jsonb)
  into v_attributes
  from public.role_attribute_rules rar
  join public.attribute_catalog ac on ac.id = rar.attribute_id and ac.is_active = true
  join public.roles r on r.id = rar.role_id
  left join public.user_profile_attributes upa
    on upa.user_id = v_user_id
   and upa.attribute_id = ac.id
  where r.key = v_role_key
    and rar.is_enabled = true;

  select count(*) filter (where rar.is_required),
         count(*) filter (where rar.is_required and (
           (ac.key = 'full_name' and coalesce(v_full_name, '') <> '')
           or upa.value_text is not null
           or upa.value_json is not null
         ))
  into v_completion_total, v_completion_completed
  from public.role_attribute_rules rar
  join public.attribute_catalog ac on ac.id = rar.attribute_id and ac.is_active = true
  join public.roles r on r.id = rar.role_id
  left join public.user_profile_attributes upa
    on upa.user_id = v_user_id
   and upa.attribute_id = ac.id
   and upa.approval_status = 'approved'
  where r.key = v_role_key
    and rar.is_enabled = true;

  select coalesce(jsonb_agg(jsonb_build_object(
    'id', ar.id,
    'request_type', ar.request_type,
    'status', ar.status,
    'target_role_key', ar.target_role_key,
    'target_feature_key', ar.target_feature_key,
    'target_entity_type', ar.target_entity_type,
    'created_at', ar.created_at,
    'admin_note', ar.admin_note,
    'payload', ar.payload
  ) order by ar.created_at desc), '[]'::jsonb)
  into v_pending
  from public.approval_requests ar
  where ar.user_id = v_user_id
    and ar.status = 'pending';

  return jsonb_build_object(
    'user_id', v_user_id,
    'email', v_email,
    'full_name', coalesce(v_full_name, ''),
    'profile_type', v_role_key,
    'role_key', v_role_key,
    'role_label', coalesce(v_role_label, v_role_key),
    'role_description', v_role_description,
    'role_slug', v_role_slug,
    'features', coalesce(v_features, '[]'::jsonb),
    'attributes', coalesce(v_attributes, '[]'::jsonb),
    'pending_requests', coalesce(v_pending, '[]'::jsonb),
    'profile_completion', jsonb_build_object(
      'required_total', coalesce(v_completion_total, 0),
      'required_completed', coalesce(v_completion_completed, 0),
      'percentage', case
        when coalesce(v_completion_total, 0) = 0 then 100
        else floor((coalesce(v_completion_completed, 0)::numeric / v_completion_total::numeric) * 100)
      end
    )
  );
end;
$$;

-- submit_role_change_request: user_profiles kontrolünü kaldır, direkt insert
create or replace function public.submit_role_change_request(target_role_key text, note text default null)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_request_id uuid;
  v_current_role_key text;
begin
  if auth.uid() is null then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  if target_role_key is null or btrim(target_role_key) = '' then
    raise exception 'target role key is required' using errcode = '22023';
  end if;

  if not exists (select 1 from public.roles r where r.key = target_role_key and r.is_active = true) then
    raise exception 'invalid role key' using errcode = '22023';
  end if;

  select r.key into v_current_role_key
  from public.user_role_assignments ura
  join public.roles r on r.id = ura.role_id
  where ura.user_id = auth.uid();

  if v_current_role_key = target_role_key then
    raise exception 'user already has this role' using errcode = '22023';
  end if;

  insert into public.approval_requests (
    request_type, user_id, target_role_key,
    target_entity_type, payload, status
  ) values (
    'role_change', auth.uid(), target_role_key,
    'profile', jsonb_build_object('note', note), 'pending'
  )
  returning id into v_request_id;

  return v_request_id;
end;
$$;

-- submit_feature_request: user_profiles scope check'i kaldır
create or replace function public.submit_feature_request(feature_key text, payload jsonb default '{}'::jsonb)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_request_id uuid;
  v_scope_role text;
  v_user_role_key text;
  v_request_type text;
begin
  if auth.uid() is null then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  select fc.scope_role into v_scope_role
  from public.feature_catalog fc
  where fc.key = feature_key;

  if v_scope_role is null then
    raise exception 'invalid feature key' using errcode = '22023';
  end if;

  -- scope_role = '*' ise herkese açık, değilse kullanıcının rolüyle eşleşmeli
  if v_scope_role <> '*' then
    select r.key into v_user_role_key
    from public.user_role_assignments ura
    join public.roles r on r.id = ura.role_id
    where ura.user_id = auth.uid();

    if v_user_role_key is null or v_user_role_key <> v_scope_role then
      raise exception 'invalid feature key for current role' using errcode = '22023';
    end if;
  end if;

  v_request_type := public.resolve_approval_request_type(feature_key);

  insert into public.approval_requests (
    request_type, user_id, target_feature_key,
    target_entity_type, payload, status
  ) values (
    v_request_type, auth.uid(), feature_key,
    'feature', coalesce(payload, '{}'::jsonb), 'pending'
  )
  returning id into v_request_id;

  return v_request_id;
end;
$$;

-- admin_set_user_role: user_profiles varlık kontrolünü kaldır
create or replace function public.admin_set_user_role(
  target_user_id uuid,
  role_key text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role_id uuid;
  v_before_role text;
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  if target_user_id is null then
    raise exception 'target user is required' using errcode = '22023';
  end if;

  if role_key is null or btrim(role_key) = '' then
    raise exception 'role key is required' using errcode = '22023';
  end if;

  select r.key into v_before_role
  from public.user_role_assignments ura
  join public.roles r on r.id = ura.role_id
  where ura.user_id = target_user_id;

  if not exists (select 1 from auth.users where id = target_user_id) then
    raise exception 'user not found' using errcode = 'P0002';
  end if;

  select r.id into v_role_id
  from public.roles r
  where r.key = admin_set_user_role.role_key and r.is_active = true
  limit 1;

  if v_role_id is null then
    raise exception 'invalid role key' using errcode = '22023';
  end if;

  insert into public.user_role_assignments (user_id, role_id, updated_by)
  values (target_user_id, v_role_id, auth.uid())
  on conflict (user_id) do update
  set role_id = excluded.role_id,
      updated_by = excluded.updated_by,
      updated_at = now();

  perform public.write_admin_audit_log(
    case when v_before_role is null then 'role.assigned' else 'role.changed' end,
    target_user_id, 'user_role_assignment', target_user_id,
    jsonb_build_object('role_key', v_before_role),
    jsonb_build_object('role_key', role_key)
  );
end;
$$;

-- admin_set_user_feature_override_detailed: user_profiles scope check kaldır
create or replace function public.admin_set_user_feature_override_detailed(
  target_user_id uuid,
  feature_key text,
  is_enabled boolean,
  reason text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_scope_role text;
  v_before public.user_feature_overrides%rowtype;
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  if target_user_id is null then
    raise exception 'target user is required' using errcode = '22023';
  end if;

  if feature_key is null or btrim(feature_key) = '' then
    raise exception 'feature key is required' using errcode = '22023';
  end if;

  select fc.scope_role into v_scope_role
  from public.feature_catalog fc
  where fc.key = feature_key;

  if v_scope_role is null then
    raise exception 'invalid feature key' using errcode = '22023';
  end if;

  -- scope_role = '*' ise herkese uygulanabilir, değilse rol kontrolü
  if v_scope_role <> '*' then
    if not exists (
      select 1 from public.user_role_assignments ura
      join public.roles r on r.id = ura.role_id
      where ura.user_id = target_user_id and r.key = v_scope_role
    ) then
      raise exception 'user profile not found for feature scope' using errcode = 'P0002';
    end if;
  end if;

  select * into v_before
  from public.user_feature_overrides
  where user_id = target_user_id and feature_key = admin_set_user_feature_override_detailed.feature_key;

  insert into public.user_feature_overrides (user_id, feature_key, is_enabled, updated_by, updated_at, reason)
  values (target_user_id, feature_key, is_enabled, auth.uid(), now(), reason)
  on conflict (user_id, feature_key) do update
  set is_enabled = excluded.is_enabled,
      updated_by = excluded.updated_by,
      updated_at = now(),
      reason = excluded.reason;

  perform public.write_admin_audit_log(
    'feature.override_set', target_user_id, 'user_feature_override', target_user_id,
    case when v_before.user_id is null then null else to_jsonb(v_before) end,
    jsonb_build_object('feature_key', feature_key, 'is_enabled', is_enabled, 'reason', reason)
  );
end;
$$;

-- update_profile_attribute: user_profiles kontrolünü kaldır
create or replace function public.update_profile_attribute(
  attribute_key text,
  attribute_value jsonb,
  visibility text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_role_key text;
  v_role_id uuid;
  v_attribute public.attribute_catalog%rowtype;
  v_rule public.role_attribute_rules%rowtype;
  v_visibility text;
  v_value_text text;
  v_request_id uuid;
begin
  if v_user_id is null then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  select r.key, r.id into v_role_key, v_role_id
  from public.user_role_assignments ura
  join public.roles r on r.id = ura.role_id
  where ura.user_id = v_user_id
  limit 1;

  if v_role_key is null then
    raise exception 'user role not found' using errcode = 'P0002';
  end if;

  select * into v_attribute from public.attribute_catalog where key = attribute_key and is_active = true limit 1;
  if v_attribute.id is null then
    raise exception 'invalid attribute key' using errcode = '22023';
  end if;

  select rar.* into v_rule
  from public.role_attribute_rules rar
  where rar.role_id = v_role_id
    and rar.attribute_id = v_attribute.id
    and rar.is_enabled = true
  limit 1;

  if v_rule.id is null then
    raise exception 'attribute is not enabled for current role' using errcode = '42501';
  end if;

  if not v_rule.user_can_edit then
    raise exception 'attribute is not editable' using errcode = '42501';
  end if;

  v_visibility := coalesce(visibility, case when v_rule.is_public_default then 'public' else 'private' end);
  if v_visibility not in ('public', 'private', 'admin_only') then
    raise exception 'invalid visibility' using errcode = '22023';
  end if;

  if not v_rule.user_can_hide and v_visibility <> 'public' then
    raise exception 'attribute visibility cannot be changed' using errcode = '42501';
  end if;

  if v_attribute.data_type in ('text','textarea','select','url','phone') then
    v_value_text := nullif(btrim(coalesce(attribute_value #>> '{}', '')), '');
  end if;

  if v_rule.requires_admin_approval_on_change then
    insert into public.approval_requests (
      request_type, user_id, target_entity_type, payload, status
    ) values (
      'attribute_change', v_user_id, 'attribute',
      jsonb_build_object('attribute_key', attribute_key, 'attribute_value', attribute_value, 'visibility', v_visibility),
      'pending'
    ) returning id into v_request_id;

    return jsonb_build_object('status', 'pending', 'request_id', v_request_id, 'attribute_key', attribute_key);
  end if;

  insert into public.user_profile_attributes (
    user_id, attribute_id, value_text, value_json,
    visibility, approval_status, approved_by, approved_at, updated_at
  ) values (
    v_user_id, v_attribute.id,
    case when v_attribute.data_type in ('text','textarea','select','url','phone') then v_value_text else null end,
    case when v_attribute.data_type in ('multi_select','boolean','json') then attribute_value else null end,
    v_visibility, 'approved', v_user_id, now(), now()
  )
  on conflict (user_id, attribute_id) do update
  set value_text = excluded.value_text,
      value_json = excluded.value_json,
      visibility = excluded.visibility,
      approval_status = 'approved',
      approved_by = excluded.approved_by,
      approved_at = excluded.approved_at,
      updated_at = now();

  return jsonb_build_object('status', 'approved', 'attribute_key', attribute_key, 'visibility', v_visibility);
end;
$$;

-- ─── list_public_directory_profiles: user_profiles bağımlılığını kaldır ──────
create or replace function public.list_public_directory_profiles(
  search_text text default null,
  role_filter text default null,
  country_filter text default null,
  city_filter text default null,
  featured_only boolean default false,
  verified_only boolean default false
)
returns table (
  user_id uuid,
  role_key text,
  role_label text,
  role_slug text,
  display_name text,
  short_bio text,
  country text,
  city text,
  profile_image_url text,
  special_attribute_key text,
  special_attribute_label text,
  special_attribute_value text,
  is_featured boolean,
  is_verified boolean,
  whatsapp text,
  linkedin_url text,
  website_url text
)
language sql
security definer
set search_path = public
as $$
  with user_roles as (
    select ura.user_id, r.key as role_key, r.id as role_id, r.label as role_label
    from public.user_role_assignments ura
    join public.roles r on r.id = ura.role_id
  ),
  feature_state as (
    select
      ur.user_id,
      ur.role_key,
      coalesce(dir_override.is_enabled, dir_role.is_enabled, false) and coalesce(dir_catalog.is_active_globally, false) as directory_visible,
      coalesce(featured_override.is_enabled, featured_role.is_enabled, false) and coalesce(featured_catalog.is_active_globally, false) as directory_featured
    from user_roles ur
    left join public.feature_catalog dir_catalog on dir_catalog.key = 'directory.visible'
    left join public.feature_catalog featured_catalog on featured_catalog.key = 'directory.featured'
    left join public.role_feature_flags dir_role on dir_role.role_id = ur.role_id and dir_role.feature_key = 'directory.visible'
    left join public.role_feature_flags featured_role on featured_role.role_id = ur.role_id and featured_role.feature_key = 'directory.featured'
    left join public.user_feature_overrides dir_override on dir_override.user_id = ur.user_id and dir_override.feature_key = 'directory.visible'
    left join public.user_feature_overrides featured_override on featured_override.user_id = ur.user_id and featured_override.feature_key = 'directory.featured'
  ),
  resolved_attributes as (
    select
      ura.user_id,
      max(case when ac.key = 'full_name' and upa.approval_status = 'approved' then upa.value_text end) as display_name,
      max(case when ac.key = 'bio_short' and upa.visibility = 'public' and upa.approval_status = 'approved' then upa.value_text end) as short_bio,
      max(case when ac.key = 'country' and upa.visibility = 'public' and upa.approval_status = 'approved' then upa.value_text end) as country,
      max(case when ac.key = 'city' and upa.visibility = 'public' and upa.approval_status = 'approved' then upa.value_text end) as city,
      max(case when ac.key = 'profile_photo_url' and upa.visibility = 'public' and upa.approval_status = 'approved' then upa.value_text end) as profile_image_url,
      max(case when ac.key = 'main_platform' and upa.visibility = 'public' and upa.approval_status = 'approved' then upa.value_text end) as main_platform,
      max(case when ac.key = 'interests' and upa.visibility = 'public' and upa.approval_status = 'approved' then upa.value_text end) as interests,
      max(case when ac.key = 'expertise_area' and upa.visibility = 'public' and upa.approval_status = 'approved' then upa.value_text end) as expertise_area,
      max(case when ac.key = 'business_category' and upa.visibility = 'public' and upa.approval_status = 'approved' then upa.value_text end) as business_category,
      max(case when ac.key = 'organization_type' and upa.visibility = 'public' and upa.approval_status = 'approved' then upa.value_text end) as organization_type,
      max(case when ac.key = 'ambassador_city' and upa.visibility = 'public' and upa.approval_status = 'approved' then upa.value_text end) as ambassador_city
    from public.user_role_assignments ura
    left join public.user_profile_attributes upa on upa.user_id = ura.user_id
    left join public.attribute_catalog ac on ac.id = upa.attribute_id
    group by ura.user_id
  )
  select
    ur.user_id,
    ur.role_key,
    ur.role_label,
    case ur.role_key
      when 'bireysel' then 'individual'
      when 'danisman' then 'consultant'
      when 'isletme' then 'business'
      when 'kurulus-dernek' then 'organization'
      when 'blogger-vlogger-youtuber' then 'influencer'
      when 'sehir-elcisi' then 'ambassador'
      else ur.role_key
    end as role_slug,
    coalesce(nullif(ra.display_name, ''), 'CorteQS Uyesi') as display_name,
    ra.short_bio,
    ra.country,
    coalesce(ra.city, ra.ambassador_city) as city,
    ra.profile_image_url,
    case ur.role_key
      when 'bireysel' then 'interests'
      when 'danisman' then 'expertise_area'
      when 'isletme' then 'business_category'
      when 'kurulus-dernek' then 'organization_type'
      when 'blogger-vlogger-youtuber' then 'main_platform'
      when 'sehir-elcisi' then 'ambassador_city'
      else null
    end as special_attribute_key,
    case ur.role_key
      when 'bireysel' then 'Ilgi Alanlari'
      when 'danisman' then 'Uzmanlik Alani'
      when 'isletme' then 'Isletme Kategorisi'
      when 'kurulus-dernek' then 'Kurulus Turu'
      when 'blogger-vlogger-youtuber' then 'Ana Platform'
      when 'sehir-elcisi' then 'Sorumlu Sehir'
      else null
    end as special_attribute_label,
    case ur.role_key
      when 'bireysel' then ra.interests
      when 'danisman' then ra.expertise_area
      when 'isletme' then ra.business_category
      when 'kurulus-dernek' then ra.organization_type
      when 'blogger-vlogger-youtuber' then ra.main_platform
      when 'sehir-elcisi' then ra.ambassador_city
      else null
    end as special_attribute_value,
    fs.directory_featured as is_featured,
    fs.directory_visible as is_verified,
    null::text as whatsapp,
    null::text as linkedin_url,
    null::text as website_url
  from user_roles ur
  join feature_state fs on fs.user_id = ur.user_id
  left join resolved_attributes ra on ra.user_id = ur.user_id
  where fs.directory_visible = true
    and (role_filter is null or ur.role_key = role_filter)
    and (country_filter is null or ra.country = country_filter)
    and (city_filter is null or coalesce(ra.city, ra.ambassador_city) = city_filter)
    and (not featured_only or fs.directory_featured = true)
    and (not verified_only or fs.directory_visible = true)
    and (
      search_text is null
      or coalesce(ra.display_name, '') ilike '%' || search_text || '%'
      or coalesce(ra.short_bio, '') ilike '%' || search_text || '%'
      or coalesce(
        case ur.role_key
          when 'bireysel' then ra.interests
          when 'danisman' then ra.expertise_area
          when 'isletme' then ra.business_category
          when 'kurulus-dernek' then ra.organization_type
          when 'blogger-vlogger-youtuber' then ra.main_platform
          when 'sehir-elcisi' then ra.ambassador_city
          else ''
        end, ''
      ) ilike '%' || search_text || '%'
    )
  order by fs.directory_featured desc, coalesce(ra.display_name, '') asc;
$$;

-- ─── Legacy tabloları DROP et ─────────────────────────────────────────────────
-- Sıra önemli: önce bağımlı tablo, sonra referans edilen tablo

-- role_feature_defaults (feature_catalog'a FK var, başka tablolar buna bağlı değil)
drop table if exists public.role_feature_defaults cascade;

-- profiles (auth.users.id = profiles.id, başka tablolar buna bağlı değil)
drop table if exists public.profiles cascade;

-- admin_users (sadece user_id; whatsapp_landing_editors.granted_by migration 3'te taşındı)
drop table if exists public.admin_users cascade;

-- user_profiles (tüm FK'lar migration 3'te auth.users'a taşındı)
drop table if exists public.user_profiles cascade;

commit;
