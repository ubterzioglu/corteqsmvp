-- Catalog/Flat-Role/AFS Rebuild — Migration 010c: programmatic backend rewire
--
-- Auto-generated (docs/catalog-role-afs-rebuild/_phase4_rewire.py) from local DB
-- pg_get_functiondef + SAFE word-boundary table-name substitution ONLY:
--   attribute_catalog->afs_attributes, feature_catalog->afs_features,
--   profile_section_catalog->afs_sections, role_attribute_rules->role_attributes,
--   role_feature_flags->role_features, role_profile_section_rules->role_sections,
--   catalog_item_attributes->catalog_item_attribute_values,
--   catalog_claim_requests->catalog_item_claims,
--   catalog_item_memberships->catalog_item_managers
--
-- NO column renames: catalog_items.title and catalog_item_managers.role are kept
-- (rename reverted at Checkpoint to avoid brittle column rewire), so these 44
-- function bodies need ONLY table-name substitution. Each is create-or-replace.
-- Idempotent.

-- admin_clear_user_feature_override: feature_catalog->afs_features(1)
CREATE OR REPLACE FUNCTION public.admin_clear_user_feature_override(target_user_id uuid, feature_key text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_before public.user_feature_overrides%rowtype;
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'forbidden'
      using errcode = '42501';
  end if;

  if target_user_id is null then
    raise exception 'target user is required'
      using errcode = '22023';
  end if;

  if feature_key is null or btrim(feature_key) = '' then
    raise exception 'feature key is required'
      using errcode = '22023';
  end if;

  if not exists (
    select 1
    from public.afs_features fc
    where fc.key = admin_clear_user_feature_override.feature_key
  ) then
    raise exception 'invalid feature key'
      using errcode = '22023';
  end if;

  select * into v_before
  from public.user_feature_overrides ufo
  where ufo.user_id = target_user_id
    and ufo.feature_key = admin_clear_user_feature_override.feature_key;

  delete from public.user_feature_overrides ufo
  where ufo.user_id = target_user_id
    and ufo.feature_key = admin_clear_user_feature_override.feature_key;

  perform public.write_admin_audit_log(
    'feature.override_cleared',
    target_user_id,
    'user_feature_override',
    target_user_id,
    case when v_before.user_id is null then null else to_jsonb(v_before) end,
    jsonb_build_object('feature_key', feature_key)
  );
end;
$function$;

-- admin_grant_catalog_editor: catalog_item_memberships->catalog_item_managers(1)
CREATE OR REPLACE FUNCTION public.admin_grant_catalog_editor(p_item_id uuid, p_target_user_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_actor_id uuid := auth.uid();
begin
  if v_actor_id is null or not public.is_moderator(v_actor_id) then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  if not exists (select 1 from public.catalog_items where id = p_item_id) then
    raise exception 'catalog item not found' using errcode = 'P0002';
  end if;

  if not exists (select 1 from auth.users where id = p_target_user_id) then
    raise exception 'target user not found' using errcode = 'P0002';
  end if;

  insert into public.catalog_item_managers (item_id, user_id, role, status)
  values (p_item_id, p_target_user_id, 'editor', 'active')
  on conflict (item_id, user_id, role) do update
  set status = 'active',
      updated_at = now();
end;
$function$;

-- admin_grant_catalog_item_access: catalog_item_memberships->catalog_item_managers(1)
CREATE OR REPLACE FUNCTION public.admin_grant_catalog_item_access(p_item_id uuid, p_user_id uuid, p_access_level text, p_is_primary_owner boolean DEFAULT false)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if auth.uid() is null or not public.is_moderator(auth.uid()) then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  if p_access_level not in ('owner', 'manager', 'editor', 'viewer') then
    raise exception 'invalid access level' using errcode = '22023';
  end if;

  insert into public.catalog_item_managers (item_id, user_id, role, status)
  values (p_item_id, p_user_id, p_access_level, 'active')
  on conflict (item_id, user_id, role) do update
  set
    status = 'active',
    updated_at = now();

  if p_is_primary_owner and p_access_level = 'owner' then
    update public.catalog_items
    set linked_user_id = p_user_id,
        updated_at = now()
    where id = p_item_id;
  end if;

  perform public.write_admin_audit_log(
    'catalog_item.access_granted',
    p_user_id,
    'catalog_item',
    p_item_id,
    null,
    jsonb_build_object('access_level', p_access_level, 'is_primary_owner', p_is_primary_owner)
  );
end;
$function$;

-- admin_list_catalog_claims: attribute_catalog->afs_attributes(2), catalog_claim_requests->catalog_item_claims(1)
CREATE OR REPLACE FUNCTION public.admin_list_catalog_claims(p_item_id uuid DEFAULT NULL::uuid, p_status text DEFAULT NULL::text)
 RETURNS TABLE(id uuid, item_id uuid, item_title text, requested_by_user_id uuid, requester_full_name text, requester_email text, claim_type text, note text, status text, created_at timestamp with time zone, reviewed_at timestamp with time zone, reviewed_by_user_id uuid, reviewer_full_name text)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_actor_id uuid := auth.uid();
begin
  if v_actor_id is null or not public.is_moderator(v_actor_id) then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  return query
  select
    ccr.id,
    ccr.item_id,
    ci.title as item_title,
    ccr.requested_by_user_id,
    coalesce(
      (select upa.value_text from public.user_profile_attributes upa
       join public.afs_attributes ac on ac.id = upa.attribute_id
       where upa.user_id = ccr.requested_by_user_id and ac.key = 'full_name' limit 1),
      split_part(coalesce(req_email.email, 'corteqs-uye'), '@', 1)
    ) as requester_full_name,
    req_email.email as requester_email,
    ccr.claim_type,
    ccr.note,
    ccr.status,
    ccr.created_at,
    ccr.reviewed_at,
    ccr.reviewed_by_user_id,
    coalesce(
      (select upa.value_text from public.user_profile_attributes upa
       join public.afs_attributes ac on ac.id = upa.attribute_id
       where upa.user_id = ccr.reviewed_by_user_id and ac.key = 'full_name' limit 1),
      'İsimsiz kullanıcı'
    ) as reviewer_full_name
  from public.catalog_item_claims ccr
  join public.catalog_items ci on ci.id = ccr.item_id
  left join auth.users req_email on req_email.id = ccr.requested_by_user_id
  where (p_item_id is null or ccr.item_id = p_item_id)
    and (p_status is null or btrim(p_status) = '' or ccr.status = p_status)
  order by
    case when ccr.status = 'pending' then 0 else 1 end,
    ccr.created_at desc;
end;
$function$;

-- admin_list_catalog_item_access: attribute_catalog->afs_attributes(1), catalog_item_memberships->catalog_item_managers(1)
CREATE OR REPLACE FUNCTION public.admin_list_catalog_item_access(p_item_id uuid)
 RETURNS TABLE(user_id uuid, full_name text, email text, access_level text, status text, created_at timestamp with time zone)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select
    cim.user_id,
    coalesce(
      (select upa.value_text from public.user_profile_attributes upa
       join public.afs_attributes ac on ac.id = upa.attribute_id
       where upa.user_id = cim.user_id and ac.key = 'full_name' limit 1),
      split_part(coalesce(au.email, 'corteqs-user'), '@', 1)
    ) as full_name,
    au.email,
    cim.role as access_level,
    cim.status,
    cim.created_at
  from public.catalog_item_managers cim
  left join auth.users au on au.id = cim.user_id
  where public.is_moderator(auth.uid())
    and cim.item_id = p_item_id
  order by
    case when cim.role = 'owner' then 0 when cim.role = 'manager' then 1 when cim.role = 'editor' then 2 else 3 end,
    cim.created_at asc;
$function$;

-- admin_list_catalog_profiles: catalog_item_memberships->catalog_item_managers(2)
CREATE OR REPLACE FUNCTION public.admin_list_catalog_profiles(p_query text DEFAULT NULL::text, p_item_type text DEFAULT NULL::text, p_role_key text DEFAULT NULL::text, p_city text DEFAULT NULL::text, p_country_code text DEFAULT NULL::text, p_access_role text DEFAULT NULL::text)
 RETURNS TABLE(item_id uuid, slug text, title text, item_type text, platform_role_key text, role_label text, status text, visibility text, verification_status text, primary_city text, primary_country_code text, owner_count bigint, editor_count bigint, created_at timestamp with time zone)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_actor_id uuid := auth.uid();
  v_query text := nullif(btrim(coalesce(p_query, '')), '');
  v_item_type text := nullif(btrim(coalesce(p_item_type, '')), '');
  v_role_key text := nullif(btrim(coalesce(p_role_key, '')), '');
  v_city text := nullif(btrim(coalesce(p_city, '')), '');
  v_country_code text := upper(nullif(btrim(coalesce(p_country_code, '')), ''));
  v_access_role text := nullif(btrim(coalesce(p_access_role, '')), '');
begin
  if v_actor_id is null or not public.is_moderator(v_actor_id) then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  return query
  with primary_locations as (
    select distinct on (cil.item_id)
      cil.item_id,
      cil.city,
      cil.country_code
    from public.catalog_item_locations cil
    order by cil.item_id, cil.is_primary desc, cil.created_at asc
  ),
  access_summary as (
    select
      cim.item_id,
      count(*) filter (where cim.status = 'active' and cim.role = 'owner') as owner_count,
      count(*) filter (where cim.status = 'active' and cim.role in ('manager', 'editor')) as editor_count
    from public.catalog_item_managers cim
    group by cim.item_id
  )
  select
    ci.id as item_id,
    ci.slug,
    ci.title,
    ci.item_type,
    ci.platform_role_key,
    coalesce(r.label, ci.platform_role_key, ci.item_type) as role_label,
    ci.status,
    ci.visibility,
    ci.verification_status,
    pl.city as primary_city,
    pl.country_code as primary_country_code,
    coalesce(acc.owner_count, 0) as owner_count,
    coalesce(acc.editor_count, 0) as editor_count,
    ci.created_at
  from public.catalog_items ci
  left join public.roles r on r.key = ci.platform_role_key
  left join primary_locations pl on pl.item_id = ci.id
  left join access_summary acc on acc.item_id = ci.id
  where (v_item_type is null or ci.item_type = v_item_type)
    and (v_role_key is null or ci.platform_role_key = v_role_key)
    and (v_city is null or lower(coalesce(pl.city, '')) = lower(v_city))
    and (v_country_code is null or upper(coalesce(pl.country_code, '')) = v_country_code)
    and (
      v_access_role is null
      or exists (
        select 1
        from public.catalog_item_managers cim
        where cim.item_id = ci.id
          and cim.status = 'active'
          and cim.role = v_access_role
      )
    )
    and (
      v_query is null
      or ci.title ilike '%' || v_query || '%'
      or ci.slug ilike '%' || v_query || '%'
      or coalesce(ci.platform_role_key, '') ilike '%' || v_query || '%'
    )
  order by ci.updated_at desc, ci.title asc;
end;
$function$;

-- admin_remove_catalog_item_editor: catalog_item_memberships->catalog_item_managers(1)
CREATE OR REPLACE FUNCTION public.admin_remove_catalog_item_editor(p_item_id uuid, p_user_id uuid, p_role text DEFAULT 'editor'::text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  update public.catalog_item_managers
  set
    status = 'revoked',
    updated_at = now()
  where item_id = p_item_id
    and user_id = p_user_id
    and role = p_role;

  perform public.write_admin_audit_log(
    'catalog.editor_removed',
    p_user_id,
    'catalog_item',
    p_item_id,
    null,
    jsonb_build_object('role', p_role)
  );
end;
$function$;

-- admin_review_approval_request: moved to 20260609100901_rebuild_010d (referenced dropped public.user_profiles)

-- admin_revoke_catalog_editor: catalog_item_memberships->catalog_item_managers(1)
CREATE OR REPLACE FUNCTION public.admin_revoke_catalog_editor(p_item_id uuid, p_target_user_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_actor_id uuid := auth.uid();
begin
  if v_actor_id is null or not public.is_moderator(v_actor_id) then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  update public.catalog_item_managers
  set status = 'revoked',
      updated_at = now()
  where item_id = p_item_id
    and user_id = p_target_user_id
    and role = 'editor';
end;
$function$;

-- admin_revoke_catalog_item_access: catalog_item_memberships->catalog_item_managers(1)
CREATE OR REPLACE FUNCTION public.admin_revoke_catalog_item_access(p_item_id uuid, p_user_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if auth.uid() is null or not public.is_moderator(auth.uid()) then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  update public.catalog_item_managers
  set status = 'revoked',
      updated_at = now()
  where item_id = p_item_id
    and user_id = p_user_id
    and status = 'active';

  perform public.write_admin_audit_log(
    'catalog_item.access_revoked',
    p_user_id,
    'catalog_item',
    p_item_id,
    null,
    null
  );
end;
$function$;

-- admin_search_profiles: attribute_catalog->afs_attributes(2)
CREATE OR REPLACE FUNCTION public.admin_search_profiles(p_query text, p_limit integer DEFAULT 10)
 RETURNS TABLE(id uuid, full_name text, email text)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_actor_id uuid := auth.uid();
  v_limit integer := greatest(least(coalesce(p_limit, 10), 25), 1);
  v_query text := nullif(btrim(coalesce(p_query, '')), '');
begin
  if v_actor_id is null or not public.is_moderator(v_actor_id) then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  return query
  select
    au.id,
    coalesce(
      (select upa.value_text from public.user_profile_attributes upa
       join public.afs_attributes ac on ac.id = upa.attribute_id
       where upa.user_id = au.id and ac.key = 'full_name' limit 1),
      split_part(coalesce(au.email, 'corteqs-uye'), '@', 1)
    ) as full_name,
    au.email
  from auth.users au
  where v_query is not null
    and (
      coalesce(au.email, '') ilike '%' || v_query || '%'
      or exists (
        select 1 from public.user_profile_attributes upa
        join public.afs_attributes ac on ac.id = upa.attribute_id
        where upa.user_id = au.id
          and ac.key = 'full_name'
          and upa.value_text ilike '%' || v_query || '%'
      )
    )
  order by
    case
      when coalesce(au.email, '') ilike v_query || '%' then 0
      else 1
    end,
    au.updated_at desc
  limit v_limit;
end;
$function$;

-- admin_set_attribute_rule: attribute_catalog->afs_attributes(2), role_attribute_rules->role_attributes(3)
CREATE OR REPLACE FUNCTION public.admin_set_attribute_rule(role_key text, attribute_key text, rule_payload jsonb)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_role public.roles%rowtype;
  v_attribute public.afs_attributes%rowtype;
  v_existing public.role_attributes%rowtype;
  v_rule_id uuid;
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  select * into v_role from public.roles where key = role_key and is_active = true limit 1;
  if v_role.id is null then
    raise exception 'invalid role key' using errcode = '22023';
  end if;

  select * into v_attribute from public.afs_attributes where key = attribute_key limit 1;
  if v_attribute.id is null then
    raise exception 'invalid attribute key' using errcode = '22023';
  end if;

  select * into v_existing
  from public.role_attributes
  where role_id = v_role.id
    and attribute_id = v_attribute.id
  limit 1;

  insert into public.role_attributes (
    role_id,
    attribute_id,
    is_enabled,
    is_required,
    is_public_default,
    user_can_edit,
    user_can_hide,
    requires_admin_approval_on_change,
    sort_order
  ) values (
    v_role.id,
    v_attribute.id,
    coalesce((rule_payload ->> 'is_enabled')::boolean, coalesce(v_existing.is_enabled, true)),
    coalesce((rule_payload ->> 'is_required')::boolean, coalesce(v_existing.is_required, false)),
    coalesce((rule_payload ->> 'is_public_default')::boolean, coalesce(v_existing.is_public_default, false)),
    coalesce((rule_payload ->> 'user_can_edit')::boolean, coalesce(v_existing.user_can_edit, true)),
    coalesce((rule_payload ->> 'user_can_hide')::boolean, coalesce(v_existing.user_can_hide, true)),
    coalesce((rule_payload ->> 'requires_admin_approval_on_change')::boolean, coalesce(v_existing.requires_admin_approval_on_change, false)),
    coalesce((rule_payload ->> 'sort_order')::integer, coalesce(v_existing.sort_order, v_attribute.sort_order))
  ) on conflict (role_id, attribute_id) do update
  set
    is_enabled = excluded.is_enabled,
    is_required = excluded.is_required,
    is_public_default = excluded.is_public_default,
    user_can_edit = excluded.user_can_edit,
    user_can_hide = excluded.user_can_hide,
    requires_admin_approval_on_change = excluded.requires_admin_approval_on_change,
    sort_order = excluded.sort_order,
    updated_at = now()
  returning id into v_rule_id;

  perform public.write_admin_audit_log(
    'attribute.rule_updated',
    null,
    'role_attribute_rule',
    v_rule_id,
    case when v_existing.id is null then null else to_jsonb(v_existing) end,
    rule_payload
  );
end;
$function$;

-- admin_set_catalog_item_attribute: attribute_catalog->afs_attributes(2), catalog_item_attributes->catalog_item_attribute_values(1)
CREATE OR REPLACE FUNCTION public.admin_set_catalog_item_attribute(p_item_id uuid, p_attribute_key text, p_value jsonb, p_visibility text DEFAULT 'public'::text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_attribute public.afs_attributes%rowtype;
  v_value_text text;
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  select *
  into v_attribute
  from public.afs_attributes
  where key = p_attribute_key
    and is_active = true
  limit 1;

  if v_attribute.id is null then
    raise exception 'invalid attribute key' using errcode = '22023';
  end if;

  if v_attribute.data_type in ('text', 'textarea', 'select', 'url', 'phone') then
    v_value_text := nullif(btrim(coalesce(p_value #>> '{}', '')), '');
  end if;

  if p_attribute_key = 'full_name' then
    update public.catalog_items
    set
      title = coalesce(v_value_text, title),
      updated_at = now()
    where id = p_item_id;
  end if;

  insert into public.catalog_item_attribute_values (
    item_id,
    attribute_id,
    value_text,
    value_json,
    visibility,
    approval_status,
    approved_by,
    approved_at,
    updated_at
  )
  values (
    p_item_id,
    v_attribute.id,
    case when v_attribute.data_type in ('text', 'textarea', 'select', 'url', 'phone') then v_value_text else null end,
    case when v_attribute.data_type in ('multi_select', 'boolean', 'json') then p_value else null end,
    coalesce(nullif(btrim(coalesce(p_visibility, '')), ''), 'public'),
    'approved',
    auth.uid(),
    now(),
    now()
  )
  on conflict (item_id, attribute_id) do update
  set
    value_text = excluded.value_text,
    value_json = excluded.value_json,
    visibility = excluded.visibility,
    approval_status = 'approved',
    approved_by = excluded.approved_by,
    approved_at = excluded.approved_at,
    updated_at = now();

  perform public.write_admin_audit_log(
    'catalog.attribute_set',
    null,
    'catalog_item',
    p_item_id,
    null,
    jsonb_build_object('attribute_key', p_attribute_key, 'value', p_value)
  );
end;
$function$;

-- admin_set_catalog_item_editor: catalog_item_memberships->catalog_item_managers(1)
CREATE OR REPLACE FUNCTION public.admin_set_catalog_item_editor(p_item_id uuid, p_user_id uuid, p_role text DEFAULT 'editor'::text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  if p_role not in ('owner', 'manager', 'editor', 'contributor', 'viewer') then
    raise exception 'invalid role' using errcode = '22023';
  end if;

  insert into public.catalog_item_managers (item_id, user_id, role, status)
  values (p_item_id, p_user_id, p_role, 'active')
  on conflict (item_id, user_id, role) do update
  set
    status = 'active',
    updated_at = now();

  perform public.write_admin_audit_log(
    'catalog.editor_set',
    p_user_id,
    'catalog_item',
    p_item_id,
    null,
    jsonb_build_object('role', p_role)
  );
end;
$function$;

-- admin_set_feature_global_state: feature_catalog->afs_features(4)
CREATE OR REPLACE FUNCTION public.admin_set_feature_global_state(feature_key text, is_active_globally boolean)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_before public.afs_features%rowtype;
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  select * into v_before from public.afs_features where key = feature_key limit 1;
  if v_before.key is null then
    raise exception 'invalid feature key' using errcode = '22023';
  end if;

  update public.afs_features
  set is_active_globally = admin_set_feature_global_state.is_active_globally,
      updated_at = now()
  where key = feature_key;

  perform public.write_admin_audit_log(
    case when is_active_globally then 'feature.enabled' else 'feature.disabled' end,
    null,
    'afs_features',
    null,
    to_jsonb(v_before),
    jsonb_build_object('feature_key', feature_key, 'is_active_globally', is_active_globally)
  );
end;
$function$;

-- admin_set_role_feature_flag: feature_catalog->afs_features(1), role_feature_flags->role_features(2)
CREATE OR REPLACE FUNCTION public.admin_set_role_feature_flag(role_key text, feature_key text, is_enabled boolean)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_role_id uuid;
  v_before boolean;
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'forbidden'
      using errcode = '42501';
  end if;

  if role_key is null or btrim(role_key) = '' then
    raise exception 'role key is required'
      using errcode = '22023';
  end if;

  if feature_key is null or btrim(feature_key) = '' then
    raise exception 'feature key is required'
      using errcode = '22023';
  end if;

  if not exists (
    select 1
    from public.afs_features fc
    where fc.key = admin_set_role_feature_flag.feature_key
  ) then
    raise exception 'invalid feature key'
      using errcode = '22023';
  end if;

  select r.id
  into v_role_id
  from public.roles r
  where r.key = admin_set_role_feature_flag.role_key
    and r.is_active = true
  limit 1;

  if v_role_id is null then
    raise exception 'invalid role key'
      using errcode = '22023';
  end if;

  select rff.is_enabled into v_before
  from public.role_features rff
  where rff.role_id = v_role_id
    and rff.feature_key = admin_set_role_feature_flag.feature_key;

  insert into public.role_features (role_id, feature_key, is_enabled, updated_by)
  values (
    v_role_id,
    admin_set_role_feature_flag.feature_key,
    admin_set_role_feature_flag.is_enabled,
    auth.uid()
  )
  on conflict on constraint role_feature_flags_pkey do update
  set
    is_enabled = excluded.is_enabled,
    updated_by = excluded.updated_by,
    updated_at = now();

  perform public.write_admin_audit_log(
    case when is_enabled then 'feature.enabled' else 'feature.disabled' end,
    null,
    'role_feature_flag',
    null,
    jsonb_build_object('role_key', role_key, 'feature_key', feature_key, 'is_enabled', v_before),
    jsonb_build_object('role_key', role_key, 'feature_key', feature_key, 'is_enabled', is_enabled)
  );
end;
$function$;

-- admin_set_user_feature_override_detailed: feature_catalog->afs_features(1)
CREATE OR REPLACE FUNCTION public.admin_set_user_feature_override_detailed(target_user_id uuid, feature_key text, is_enabled boolean, reason text DEFAULT NULL::text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
  from public.afs_features fc
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
$function$;

-- admin_update_catalog_item_access: catalog_item_memberships->catalog_item_managers(3)
CREATE OR REPLACE FUNCTION public.admin_update_catalog_item_access(p_item_id uuid, p_user_id uuid, p_access_level text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_existing_role text;
begin
  if auth.uid() is null or not public.is_moderator(auth.uid()) then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  if p_access_level not in ('owner', 'manager', 'editor', 'viewer') then
    raise exception 'invalid access level' using errcode = '22023';
  end if;

  select cim.role
  into v_existing_role
  from public.catalog_item_managers cim
  where cim.item_id = p_item_id
    and cim.user_id = p_user_id
    and cim.status = 'active'
  order by cim.created_at asc
  limit 1;

  if v_existing_role is null then
    raise exception 'access row not found' using errcode = 'P0002';
  end if;

  if v_existing_role = p_access_level then
    return;
  end if;

  update public.catalog_item_managers
  set status = 'revoked',
      updated_at = now()
  where item_id = p_item_id
    and user_id = p_user_id
    and status = 'active';

  insert into public.catalog_item_managers (item_id, user_id, role, status)
  values (p_item_id, p_user_id, p_access_level, 'active')
  on conflict (item_id, user_id, role) do update
  set
    status = 'active',
    updated_at = now();

  perform public.write_admin_audit_log(
    'catalog_item.access_updated',
    p_user_id,
    'catalog_item',
    p_item_id,
    null,
    jsonb_build_object('old_access_level', v_existing_role, 'new_access_level', p_access_level)
  );
end;
$function$;

-- admin_update_user_profile_attribute: moved to 20260609100901_rebuild_010d (referenced dropped public.user_profiles)

-- admin_upsert_catalog_item_attribute_override: attribute_catalog->afs_attributes(1)
CREATE OR REPLACE FUNCTION public.admin_upsert_catalog_item_attribute_override(p_item_id uuid, p_attribute_key text, p_is_enabled boolean DEFAULT true, p_display_order integer DEFAULT NULL::integer, p_override_label text DEFAULT NULL::text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_actor_id uuid := auth.uid();
begin
  if v_actor_id is null or not public.is_moderator(v_actor_id) then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  if not exists (select 1 from public.catalog_items where id = p_item_id) then
    raise exception 'catalog item not found' using errcode = 'P0002';
  end if;

  if not exists (select 1 from public.afs_attributes where key = p_attribute_key and is_active = true) then
    raise exception 'attribute not found' using errcode = 'P0002';
  end if;

  insert into public.catalog_item_attribute_overrides (
    item_id,
    attribute_key,
    is_enabled,
    display_order,
    override_label
  )
  values (
    p_item_id,
    p_attribute_key,
    coalesce(p_is_enabled, true),
    p_display_order,
    nullif(btrim(coalesce(p_override_label, '')), '')
  )
  on conflict (item_id, attribute_key) do update
  set
    is_enabled = excluded.is_enabled,
    display_order = excluded.display_order,
    override_label = excluded.override_label,
    updated_at = now();
end;
$function$;

-- admin_upsert_catalog_item_feature_override: feature_catalog->afs_features(1)
CREATE OR REPLACE FUNCTION public.admin_upsert_catalog_item_feature_override(p_item_id uuid, p_feature_key text, p_is_enabled boolean DEFAULT true)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_actor_id uuid := auth.uid();
begin
  if v_actor_id is null or not public.is_moderator(v_actor_id) then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  if not exists (select 1 from public.catalog_items where id = p_item_id) then
    raise exception 'catalog item not found' using errcode = 'P0002';
  end if;

  if not exists (select 1 from public.afs_features where key = p_feature_key and is_active_globally = true) then
    raise exception 'feature not found' using errcode = 'P0002';
  end if;

  insert into public.catalog_item_feature_overrides (
    item_id,
    feature_key,
    is_enabled
  )
  values (
    p_item_id,
    p_feature_key,
    coalesce(p_is_enabled, true)
  )
  on conflict (item_id, feature_key) do update
  set
    is_enabled = excluded.is_enabled,
    updated_at = now();
end;
$function$;

-- admin_upsert_catalog_item_section_override: profile_section_catalog->afs_sections(1)
CREATE OR REPLACE FUNCTION public.admin_upsert_catalog_item_section_override(p_item_id uuid, p_section_key text, p_is_visible boolean DEFAULT true, p_display_order integer DEFAULT NULL::integer)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_actor_id uuid := auth.uid();
begin
  if v_actor_id is null or not public.is_moderator(v_actor_id) then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  if not exists (select 1 from public.catalog_items where id = p_item_id) then
    raise exception 'catalog item not found' using errcode = 'P0002';
  end if;

  if not exists (select 1 from public.afs_sections where key = p_section_key and is_active = true) then
    raise exception 'section not found' using errcode = 'P0002';
  end if;

  insert into public.catalog_item_section_overrides (
    item_id,
    section_key,
    is_visible,
    display_order
  )
  values (
    p_item_id,
    p_section_key,
    coalesce(p_is_visible, true),
    p_display_order
  )
  on conflict (item_id, section_key) do update
  set
    is_visible = excluded.is_visible,
    display_order = excluded.display_order,
    updated_at = now();
end;
$function$;

-- admin_upsert_role_profile_section_rule: profile_section_catalog->afs_sections(2), role_profile_section_rules->role_sections(3)
CREATE OR REPLACE FUNCTION public.admin_upsert_role_profile_section_rule(role_key text, section_key text, is_enabled boolean, requires_approval boolean DEFAULT false, sort_order integer DEFAULT 100)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_role public.roles%rowtype;
  v_section public.afs_sections%rowtype;
  v_before public.role_sections%rowtype;
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  select * into v_role from public.roles where key = role_key and is_active = true limit 1;
  select * into v_section from public.afs_sections where key = section_key limit 1;

  if v_role.id is null or v_section.id is null then
    raise exception 'invalid role or section key' using errcode = '22023';
  end if;

  select * into v_before
  from public.role_sections
  where role_id = v_role.id and section_id = v_section.id
  limit 1;

  insert into public.role_sections (role_id, section_id, is_enabled, requires_approval, sort_order)
  values (v_role.id, v_section.id, is_enabled, requires_approval, coalesce(sort_order, v_section.sort_order))
  on conflict (role_id, section_id) do update
  set
    is_enabled = excluded.is_enabled,
    requires_approval = excluded.requires_approval,
    sort_order = excluded.sort_order,
    updated_at = now();

  perform public.write_admin_audit_log(
    'profile_section.rule_upserted',
    null,
    'role_profile_section_rule',
    null,
    case when v_before.id is null then null else to_jsonb(v_before) end,
    jsonb_build_object(
      'role_key', role_key,
      'section_key', section_key,
      'is_enabled', is_enabled,
      'requires_approval', requires_approval,
      'sort_order', sort_order
    )
  );
end;
$function$;

-- can_manage_catalog_item_editors: catalog_item_memberships->catalog_item_managers(1)
CREATE OR REPLACE FUNCTION public.can_manage_catalog_item_editors(p_item_id uuid, p_user_id uuid DEFAULT auth.uid())
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select coalesce(
    public.is_moderator(p_user_id)
    or exists (
      select 1
      from public.catalog_item_managers cim
      where cim.item_id = p_item_id
        and cim.user_id = p_user_id
        and cim.status = 'active'
        and cim.role in ('owner', 'manager')
    ),
    false
  );
$function$;

-- catalog_upsert_owner_membership: catalog_item_memberships->catalog_item_managers(1)
CREATE OR REPLACE FUNCTION public.catalog_upsert_owner_membership(p_item_id uuid, p_user_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if p_item_id is null or p_user_id is null then
    return;
  end if;

  -- public.profiles was dropped (legacy); existence check moved to auth.users.
  if not exists (select 1 from auth.users u where u.id = p_user_id) then
    return;
  end if;

  insert into public.catalog_item_managers (item_id, user_id, role, status)
  values (p_item_id, p_user_id, 'owner', 'active')
  on conflict (item_id, user_id, role) do update
  set
    status = 'active',
    updated_at = now();
end;
$function$;

-- catalog_user_can_manage_item: catalog_item_memberships->catalog_item_managers(1)
CREATE OR REPLACE FUNCTION public.catalog_user_can_manage_item(p_user_id uuid, p_item_id uuid, p_allowed_roles text[] DEFAULT ARRAY['owner'::text, 'manager'::text])
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select
    public.is_moderator(p_user_id)
    or exists (
      select 1
      from public.catalog_item_managers cim
      where cim.item_id = p_item_id
        and cim.user_id = p_user_id
        and cim.status = 'active'
        and cim.role = any (p_allowed_roles)
    );
$function$;

-- get_catalog_item_profile: attribute_catalog->afs_attributes(2), role_attribute_rules->role_attributes(2), role_feature_flags->role_features(1), catalog_item_attributes->catalog_item_attribute_values(2)
CREATE OR REPLACE FUNCTION public.get_catalog_item_profile(p_item_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_item       public.catalog_items%rowtype;
  v_role_id    uuid;
  v_attributes jsonb := '[]'::jsonb;
  v_features   jsonb := '[]'::jsonb;
begin
  -- Load item
  select *
  into v_item
  from public.catalog_items
  where id = p_item_id
  limit 1;

  if v_item.id is null then
    return '{}'::jsonb;
  end if;

  -- Access check
  if not (
    public.catalog_item_is_publicly_visible(v_item.id)
    or v_item.linked_user_id = auth.uid()
    or public.catalog_user_can_edit_item(auth.uid(), v_item.id)
    or public.is_admin(auth.uid())
  ) then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  -- Resolve role: prefer platform_role_key on the item itself, then fall back
  -- to item_type → catalog_item_types.linked_role_key.
  select r.id
  into v_role_id
  from public.roles r
  where r.key = v_item.platform_role_key
    and r.is_active = true
  limit 1;

  if v_role_id is null then
    select r.id
    into v_role_id
    from public.catalog_item_types cit
    join public.roles r
      on r.key = cit.linked_role_key
     and r.is_active = true
    where cit.key = v_item.item_type
    limit 1;
  end if;

  if v_role_id is not null then
    -- ── UNIFIED PATH: rules come from role_attributes ──────────────────

    select coalesce(
      jsonb_agg(
        jsonb_build_object(
          'attribute_key',                        ac.key,
          'label',                                ac.label,
          'data_type',                            ac.data_type,
          'is_system',                            ac.is_system,
          'sort_order',                           coalesce(rar.sort_order, ac.sort_order),
          'is_required',                          coalesce(rar.is_required, false),
          'is_public_default',                    coalesce(rar.is_public_default, false),
          'editor_can_edit',                      coalesce(rar.user_can_edit, true),
          'editor_can_hide',                      coalesce(rar.user_can_hide, true),
          'requires_admin_approval_on_change',    coalesce(rar.requires_admin_approval_on_change, false),
          'visibility',   coalesce(
                            cia.visibility,
                            case when coalesce(rar.is_public_default, false) then 'public' else 'private' end
                          ),
          'approval_status',   coalesce(cia.approval_status, 'approved'),
          'value_text',   case when ac.key = 'full_name' then v_item.title else cia.value_text end,
          'value_json',   cia.value_json
        )
        order by coalesce(rar.sort_order, ac.sort_order), ac.label
      ),
      '[]'::jsonb
    )
    into v_attributes
    from public.role_attributes rar
    join public.afs_attributes ac
      on ac.id = rar.attribute_id
     and ac.is_active = true
    left join public.catalog_item_attribute_values cia
      on cia.item_id = v_item.id
     and cia.attribute_id = ac.id
    where rar.role_id = v_role_id
      and rar.is_enabled = true;

    select coalesce(
      jsonb_agg(
        jsonb_build_object(
          'feature_key',  rff.feature_key,
          'is_enabled',   coalesce(cifo.is_enabled, rff.is_enabled),
          'source',       case when cifo.id is not null then 'override' else 'role_default' end,
          'reason',       cifo.reason
        )
        order by rff.feature_key
      ),
      '[]'::jsonb
    )
    into v_features
    from public.role_features rff
    left join public.catalog_item_feature_overrides cifo
      on cifo.item_id = v_item.id
     and cifo.feature_key = rff.feature_key
    where rff.role_id = v_role_id
      and rff.is_enabled = true;

  else
    -- ── LEGACY FALLBACK: item_type_attribute_rules / item_type_feature_defaults ─

    select coalesce(
      jsonb_agg(
        jsonb_build_object(
          'attribute_key',                        ac.key,
          'label',                                ac.label,
          'data_type',                            ac.data_type,
          'is_system',                            ac.is_system,
          'sort_order',                           itar.sort_order,
          'is_required',                          itar.is_required,
          'is_public_default',                    itar.is_public_default,
          'editor_can_edit',                      itar.editor_can_edit,
          'editor_can_hide',                      itar.editor_can_hide,
          'requires_admin_approval_on_change',    itar.requires_admin_approval_on_change,
          'visibility',   coalesce(
                            cia.visibility,
                            case when itar.is_public_default then 'public' else 'private' end
                          ),
          'approval_status',   coalesce(cia.approval_status, 'approved'),
          'value_text',   case when ac.key = 'full_name' then v_item.title else cia.value_text end,
          'value_json',   cia.value_json
        )
        order by itar.sort_order, ac.label
      ),
      '[]'::jsonb
    )
    into v_attributes
    from public.item_type_attribute_rules itar
    join public.afs_attributes ac
      on ac.id = itar.attribute_id
     and ac.is_active = true
    left join public.catalog_item_attribute_values cia
      on cia.item_id = v_item.id
     and cia.attribute_id = ac.id
    where itar.item_type = v_item.item_type
      and itar.is_enabled = true;

    select coalesce(
      jsonb_agg(
        jsonb_build_object(
          'feature_key',  itfd.feature_key,
          'is_enabled',   coalesce(cifo.is_enabled, itfd.is_enabled),
          'source',       case when cifo.id is not null then 'override' else 'type_default' end,
          'reason',       cifo.reason
        )
        order by itfd.feature_key
      ),
      '[]'::jsonb
    )
    into v_features
    from public.item_type_feature_defaults itfd
    left join public.catalog_item_feature_overrides cifo
      on cifo.item_id = v_item.id
     and cifo.feature_key = itfd.feature_key
    where itfd.item_type = v_item.item_type;

  end if;

  return jsonb_build_object(
    'id',           v_item.id,
    'item_type',    v_item.item_type,
    'slug',         v_item.slug,
    'title',        v_item.title,
    'status',       v_item.status,
    'visibility',   v_item.visibility,
    'linked_user_id', v_item.linked_user_id,
    'attributes',   v_attributes,
    'features',     v_features
  );
end;
$function$;

-- get_catalog_item_rules: attribute_catalog->afs_attributes(1), feature_catalog->afs_features(1), profile_section_catalog->afs_sections(1), role_attribute_rules->role_attributes(1), role_feature_flags->role_features(1), role_profile_section_rules->role_sections(1)
CREATE OR REPLACE FUNCTION public.get_catalog_item_rules(p_item_id uuid)
 RETURNS jsonb
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  with item_role as (
    select
      ci.id as item_id,
      ci.platform_role_key,
      r.id as role_id
    from public.catalog_items ci
    left join public.roles r on r.key = ci.platform_role_key and r.is_active = true
    where ci.id = p_item_id
      and (
        public.catalog_item_is_publicly_visible(ci.id)
        or public.catalog_user_can_edit_item(auth.uid(), ci.id)
        or public.is_admin(auth.uid())
      )
  ),
  attribute_base as (
    select
      ac.key,
      ac.label,
      ac.data_type,
      case when rar.is_public_default then 'public' else 'private' end as visibility,
      rar.is_required,
      rar.sort_order as display_order
    from item_role ir
    join public.role_attributes rar
      on rar.role_id = ir.role_id
     and rar.is_enabled = true
    join public.afs_attributes ac
      on ac.id = rar.attribute_id
     and ac.is_active = true
  ),
  feature_base as (
    select
      fc.key,
      fc.label,
      rff.is_enabled,
      coalesce(fc.sort_order, 0) as sort_order
    from item_role ir
    join public.role_features rff
      on rff.role_id = ir.role_id
     and rff.is_enabled = true
    join public.afs_features fc
      on fc.key = rff.feature_key
     and fc.is_active_globally = true
  ),
  section_base as (
    select
      psc.key,
      psc.label,
      rpsr.is_enabled as is_visible,
      rpsr.sort_order as display_order
    from item_role ir
    join public.role_sections rpsr
      on rpsr.role_id = ir.role_id
     and rpsr.is_enabled = true
    join public.afs_sections psc
      on psc.id = rpsr.section_id
     and psc.is_active = true
  )
  select jsonb_build_object(
    'platformRoleKey', (select platform_role_key from item_role),
    'attributes', coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'key', key,
            'label', label,
            'dataType', data_type,
            'visibility', visibility,
            'isRequired', is_required,
            'displayOrder', display_order,
            'isOverride', false,
            'isEnabled', true
          )
          order by display_order, label
        )
        from attribute_base
      ),
      '[]'::jsonb
    ),
    'features', coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'key', key,
            'label', label,
            'isEnabled', is_enabled,
            'isOverride', false
          )
          order by sort_order, label
        )
        from feature_base
      ),
      '[]'::jsonb
    ),
    'sections', coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'key', key,
            'label', label,
            'isVisible', is_visible,
            'displayOrder', display_order,
            'isOverride', false
          )
          order by display_order, label
        )
        from section_base
      ),
      '[]'::jsonb
    ),
    'overrides', jsonb_build_object(
      'attributes', '[]'::jsonb,
      'features', '[]'::jsonb,
      'sections', '[]'::jsonb
    )
  )
  where exists (select 1 from item_role);
$function$;

-- get_current_user_dashboard: feature_catalog->afs_features(1)
CREATE OR REPLACE FUNCTION public.get_current_user_dashboard()
 RETURNS TABLE(feature_key text, label text, description text, scope text, feature_type text, is_enabled boolean, source text, sort_order integer)
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select
    fc.key as feature_key,
    fc.label,
    fc.description,
    fc.scope,
    fc.feature_type,
    guf.is_enabled,
    guf.source,
    fc.sort_order
  from public.get_current_user_features() guf
  join public.afs_features fc on fc.key = guf.feature_key
  where fc.key like 'dashboard.%'
  order by fc.sort_order, fc.key;
$function$;

-- get_current_user_features: feature_catalog->afs_features(1), role_feature_flags->role_features(1)
CREATE OR REPLACE FUNCTION public.get_current_user_features()
 RETURNS TABLE(feature_key text, is_enabled boolean, source text)
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  with effective_role as (
    select r.id as role_id, r.key as role_key
    from public.user_role_assignments ura
    join public.roles r on r.id = ura.role_id
    where ura.user_id = auth.uid()
    limit 1
  )
  select
    fc.key as feature_key,
    (
      fc.is_active_globally
      and coalesce(ufo.is_enabled, rff.is_enabled, false)
    ) as is_enabled,
    case
      when ufo.user_id is not null then 'override'
      when rff.role_id is not null then 'role_default'
      else 'fallback'
    end as source
  from public.afs_features fc
  join effective_role er
    on fc.scope_role = '*'
    or fc.scope_role = er.role_key
  left join public.role_features rff
    on rff.role_id = er.role_id
   and rff.feature_key = fc.key
  left join public.user_feature_overrides ufo
    on ufo.user_id = auth.uid()
   and ufo.feature_key = fc.key
  order by fc.key;
$function$;

-- get_current_user_profile: attribute_catalog->afs_attributes(3), role_attribute_rules->role_attributes(2)
CREATE OR REPLACE FUNCTION public.get_current_user_profile()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
  join public.afs_attributes ac on ac.id = upa.attribute_id
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
  from public.role_attributes rar
  join public.afs_attributes ac on ac.id = rar.attribute_id and ac.is_active = true
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
  from public.role_attributes rar
  join public.afs_attributes ac on ac.id = rar.attribute_id and ac.is_active = true
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
$function$;

-- get_my_editable_catalog_items: catalog_item_memberships->catalog_item_managers(1)
CREATE OR REPLACE FUNCTION public.get_my_editable_catalog_items()
 RETURNS TABLE(item_id uuid, slug text, title text, item_type text, platform_role_key text, access_level text, is_primary_owner boolean, created_at timestamp with time zone)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select
    ci.id as item_id,
    ci.slug,
    ci.title,
    ci.item_type,
    ci.platform_role_key,
    cim.role as access_level,
    (cim.role = 'owner') as is_primary_owner,
    ci.created_at
  from public.catalog_item_managers cim
  join public.catalog_items ci on ci.id = cim.item_id
  where cim.user_id = auth.uid()
    and cim.status = 'active'
    and cim.role in ('owner', 'manager', 'editor')
  order by
    case when cim.role = 'owner' then 0 when cim.role = 'manager' then 1 else 2 end,
    ci.created_at asc;
$function$;

-- get_public_profile_sections: moved to 20260609100901_rebuild_010d (referenced dropped public.user_profiles + role_feature_defaults)

-- get_role_management_bundle: attribute_catalog->afs_attributes(1), feature_catalog->afs_features(1), profile_section_catalog->afs_sections(1), role_attribute_rules->role_attributes(1), role_feature_flags->role_features(1), role_profile_section_rules->role_sections(1)
CREATE OR REPLACE FUNCTION public.get_role_management_bundle(p_role_key text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
    from public.afs_attributes ac
    left join public.role_attributes rar
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
    from public.afs_features fc
    left join public.role_features rff
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
    from public.afs_sections psc
    left join public.role_sections rpsr
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
$function$;

-- list_public_directory_profiles: attribute_catalog->afs_attributes(1), feature_catalog->afs_features(2), role_feature_flags->role_features(2)
CREATE OR REPLACE FUNCTION public.list_public_directory_profiles(search_text text DEFAULT NULL::text, role_filter text DEFAULT NULL::text, country_filter text DEFAULT NULL::text, city_filter text DEFAULT NULL::text, featured_only boolean DEFAULT false, verified_only boolean DEFAULT false)
 RETURNS TABLE(user_id uuid, role_key text, role_label text, role_slug text, display_name text, short_bio text, country text, city text, profile_image_url text, special_attribute_key text, special_attribute_label text, special_attribute_value text, is_featured boolean, is_verified boolean, whatsapp text, linkedin_url text, website_url text)
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
    left join public.afs_features dir_catalog on dir_catalog.key = 'directory.visible'
    left join public.afs_features featured_catalog on featured_catalog.key = 'directory.featured'
    left join public.role_features dir_role on dir_role.role_id = ur.role_id and dir_role.feature_key = 'directory.visible'
    left join public.role_features featured_role on featured_role.role_id = ur.role_id and featured_role.feature_key = 'directory.featured'
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
    left join public.afs_attributes ac on ac.id = upa.attribute_id
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
$function$;

-- review_catalog_claim_request: catalog_claim_requests->catalog_item_claims(3), catalog_item_memberships->catalog_item_managers(1)
CREATE OR REPLACE FUNCTION public.review_catalog_claim_request(target_claim_request_id uuid, decision text, review_note text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_actor_id uuid := auth.uid();
  v_claim public.catalog_item_claims%rowtype;
  v_before_item public.catalog_items%rowtype;
begin
  if v_actor_id is null or not public.is_moderator(v_actor_id) then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  if decision not in ('approved', 'rejected', 'cancelled') then
    raise exception 'invalid decision' using errcode = '22023';
  end if;

  select *
  into v_claim
  from public.catalog_item_claims
  where id = target_claim_request_id
  for update;

  if v_claim.id is null then
    raise exception 'claim request not found' using errcode = 'P0002';
  end if;

  if v_claim.status <> 'pending' then
    raise exception 'claim request already reviewed' using errcode = '22023';
  end if;

  select *
  into v_before_item
  from public.catalog_items
  where id = v_claim.item_id
  for update;

  update public.catalog_item_claims
  set
    status = decision,
    note = coalesce(review_note, note),
    reviewed_by_user_id = v_actor_id,
    reviewed_at = now(),
    updated_at = now()
  where id = v_claim.id;

  if decision = 'approved' then
    insert into public.catalog_item_managers (
      item_id,
      user_id,
      role,
      status
    )
    values (
      v_claim.item_id,
      v_claim.requested_by_user_id,
      'editor',
      'active'
    )
    on conflict (item_id, user_id, role) do update
    set
      status = 'active',
      updated_at = now();

    update public.catalog_items
    set
      verification_status = case
        when verification_status = 'unverified' then 'claimed'
        else verification_status
      end,
      updated_at = now()
    where id = v_claim.item_id;
  end if;

  insert into public.catalog_audit_logs (
    item_id,
    actor_user_id,
    action,
    details,
    before_data,
    after_data
  )
  values (
    v_claim.item_id,
    v_actor_id,
    'catalog_claim_request_reviewed',
    jsonb_build_object(
      'claim_request_id', v_claim.id,
      'decision', decision,
      'review_note', review_note,
      'granted_membership_role', case when decision = 'approved' then 'editor' else null end
    ),
    to_jsonb(v_before_item),
    (
      select to_jsonb(ci)
      from public.catalog_items ci
      where ci.id = v_claim.item_id
    )
  );

  return jsonb_build_object(
    'claim_request_id', v_claim.id,
    'item_id', v_claim.item_id,
    'decision', decision,
    'granted_membership_role', case when decision = 'approved' then 'editor' else null end,
    'reviewed_by_user_id', v_actor_id
  );
end;
$function$;

-- search_directory_catalog: attribute_catalog->afs_attributes(1), catalog_claim_requests->catalog_item_claims(1)
CREATE OR REPLACE FUNCTION public.search_directory_catalog(p_search_text text DEFAULT NULL::text, p_role_key text DEFAULT NULL::text, p_country_code text DEFAULT NULL::text, p_city text DEFAULT NULL::text, p_featured_only boolean DEFAULT false)
 RETURNS TABLE(item_id uuid, item_type text, slug text, title text, role_key text, role_label text, description text, city text, country text, image_url text, special_label text, special_value text, is_featured boolean, is_verified boolean, is_claimable boolean)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_user_id     uuid    := auth.uid();
  v_search_text text    := nullif(btrim(coalesce(p_search_text, '')), '');
  v_role_key    text    := nullif(btrim(coalesce(p_role_key, '')), '');
  v_country_code text   := upper(nullif(btrim(coalesce(p_country_code, '')), ''));
  v_city        text    := nullif(btrim(coalesce(p_city, '')), '');
  v_words       text[]  := '{}';
begin
  if v_user_id is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;

  -- Split search text into individual words for AND-semantics multi-word search.
  if v_search_text is not null then
    select array_agg(w)
    into v_words
    from (
      select unnest(regexp_split_to_array(btrim(v_search_text), '\s+')) as w
    ) t
    where btrim(t.w) <> '';
  end if;

  return query
  -- Branch 1: catalog items
  with primary_locations as (
    select distinct on (cil.item_id)
      cil.item_id,
      cil.city,
      cil.country_code
    from public.catalog_item_locations cil
    order by cil.item_id, cil.is_primary desc, cil.created_at asc
  ),
  primary_media as (
    select distinct on (cim.item_id)
      cim.item_id,
      coalesce(cim.thumbnail_url, cim.url) as image_url
    from public.catalog_item_media cim
    where cim.is_public = true
    order by cim.item_id, cim.is_primary desc, cim.created_at asc
  ),
  claim_status as (
    select
      ccr.item_id,
      bool_or(ccr.status = 'pending') as has_pending_claim
    from public.catalog_item_claims ccr
    group by ccr.item_id
  )
  select
    ci.id as item_id,
    ci.item_type,
    ci.slug,
    ci.title,
    coalesce(ci.platform_role_key, r.key, ci.item_type) as role_key,
    coalesce(r.label, ci.platform_role_key, ci.item_type) as role_label,
    coalesce(ci.short_description, ci.headline, left(ci.long_description, 220)) as description,
    pl.city,
    pl.country_code as country,
    pm.image_url,
    case
      when coalesce(ci.attributes ->> 'specialty_summary', '') <> '' then 'Uzmanlık / Kategori'
      when coalesce(ci.headline, '') <> '' then 'Başlık'
      else null
    end as special_label,
    nullif(coalesce(ci.attributes ->> 'specialty_summary', ci.headline), '') as special_value,
    coalesce((ci.attributes ->> 'is_featured')::boolean, false) as is_featured,
    (ci.verification_status in ('verified', 'official_source', 'claimed')) as is_verified,
    (
      ci.verification_status <> 'claimed'
      and not coalesce(cs.has_pending_claim, false)
    ) as is_claimable
  from public.catalog_items ci
  left join public.roles r
    on r.key = ci.platform_role_key
  left join primary_locations pl
    on pl.item_id = ci.id
  left join primary_media pm
    on pm.item_id = ci.id
  left join claim_status cs
    on cs.item_id = ci.id
  where ci.status = 'published'
    and ci.visibility in ('public', 'unlisted')
    and coalesce(r.is_directory_visible, true)
    and (v_role_key is null or ci.platform_role_key = v_role_key)
    and (v_country_code is null or upper(coalesce(pl.country_code, '')) = v_country_code)
    and (v_city is null or lower(coalesce(pl.city, '')) = lower(v_city))
    and (
      not p_featured_only
      or coalesce((ci.attributes ->> 'is_featured')::boolean, false)
    )
    -- Multi-word AND search: every word must appear in at least one field.
    and (
      v_search_text is null
      or (
        select bool_and(
          ci.title ilike '%' || word || '%'
          or coalesce(r.label, '') ilike '%' || word || '%'
          or coalesce(ci.headline, '') ilike '%' || word || '%'
          or coalesce(ci.short_description, '') ilike '%' || word || '%'
          or coalesce(ci.long_description, '') ilike '%' || word || '%'
          or coalesce(pl.city, '') ilike '%' || word || '%'
          or coalesce(pl.country_code, '') ilike '%' || word || '%'
          or coalesce(ci.platform_role_key, '') ilike '%' || word || '%'
        )
        from unnest(v_words) as word
      )
    )

  union all

  -- Branch 2: individual users (AFS system via individual_profile_details).
  -- Display name now resolved from user_profile_attributes (key 'full_name'),
  -- replacing the dropped public.profiles join.
  select
    ipd.user_id as item_id,
    'member' as item_type,
    ipd.user_id::text as slug,
    coalesce(member_name.full_name, 'CorteQS Üyesi') as title,
    'bireysel' as role_key,
    'Bireysel Kullanıcı' as role_label,
    ipd.tagline as description,
    ipd.active_city as city,
    gc.code as country,
    (ipd.front_card ->> 'profile_image_url') as image_url,
    null::text as special_label,
    null::text as special_value,
    false as is_featured,
    false as is_verified,
    false as is_claimable
  from public.individual_profile_details ipd
  left join lateral (
    select upa.value_text as full_name
    from public.user_profile_attributes upa
    join public.afs_attributes ac on ac.id = upa.attribute_id
    where upa.user_id = ipd.user_id
      and ac.key = 'full_name'
      and upa.approval_status = 'approved'
    limit 1
  ) member_name on true
  left join public.geo_countries gc
    on gc.is_active = true
    and (
      gc.name = ipd.active_country
      or gc.code = upper(ipd.active_country)
    )
  where ipd.visibility_status = 'open'
    and not p_featured_only
    and (v_role_key is null or v_role_key = 'bireysel')
    and (v_country_code is null or upper(coalesce(gc.code, '')) = v_country_code)
    and (v_city is null or lower(coalesce(ipd.active_city, '')) = lower(v_city))
    -- Multi-word AND search for individual profiles.
    and (
      v_search_text is null
      or (
        select bool_and(
          coalesce(member_name.full_name, '') ilike '%' || word || '%'
          or coalesce(ipd.tagline, '') ilike '%' || word || '%'
          or coalesce(ipd.active_city, '') ilike '%' || word || '%'
          or coalesce(ipd.active_country, '') ilike '%' || word || '%'
          or 'Bireysel Kullanıcı' ilike '%' || word || '%'
        )
        from unnest(v_words) as word
      )
    )

  order by
    is_featured desc,
    is_verified desc,
    title asc;
end;
$function$;

-- submit_catalog_claim_request: catalog_claim_requests->catalog_item_claims(2), catalog_item_memberships->catalog_item_managers(1)
CREATE OR REPLACE FUNCTION public.submit_catalog_claim_request(target_item_id uuid, claim_type text DEFAULT 'ownership'::text, evidence jsonb DEFAULT '{}'::jsonb, note text DEFAULT NULL::text)
 RETURNS catalog_item_claims
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_user_id uuid := auth.uid();
  v_claim public.catalog_item_claims%rowtype;
begin
  if v_user_id is null then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  if target_item_id is null then
    raise exception 'item_id is required' using errcode = '22023';
  end if;

  if not exists (
    select 1
    from public.catalog_items ci
    where ci.id = target_item_id
  ) then
    raise exception 'catalog item not found' using errcode = 'P0002';
  end if;

  -- Only block if the user has an explicit owner membership row.
  -- Moderators can still submit claims on behalf of others (they don't "own" items just by being moderators).
  if exists (
    select 1
    from public.catalog_item_managers
    where item_id = target_item_id
      and user_id = v_user_id
      and role = 'owner'
      and status = 'active'
  ) then
    raise exception 'item already owned by current user' using errcode = '23505';
  end if;

  insert into public.catalog_item_claims (
    item_id,
    requested_by_user_id,
    claim_type,
    evidence,
    note,
    status
  )
  values (
    target_item_id,
    v_user_id,
    coalesce(nullif(btrim(claim_type), ''), 'ownership'),
    coalesce(evidence, '{}'::jsonb),
    note,
    'pending'
  )
  returning * into v_claim;

  insert into public.catalog_audit_logs (
    item_id,
    actor_user_id,
    action,
    details,
    after_data
  )
  values (
    target_item_id,
    v_user_id,
    'catalog_claim_request_submitted',
    jsonb_build_object('claim_request_id', v_claim.id),
    to_jsonb(v_claim)
  );

  return v_claim;
end;
$function$;

-- submit_feature_request: feature_catalog->afs_features(1)
CREATE OR REPLACE FUNCTION public.submit_feature_request(feature_key text, payload jsonb DEFAULT '{}'::jsonb)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
  from public.afs_features fc
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
$function$;

-- sync_individual_public_profile_settings_from_attribute: attribute_catalog->afs_attributes(2)
CREATE OR REPLACE FUNCTION public.sync_individual_public_profile_settings_from_attribute()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_attribute_key text;
  v_user_id uuid;
  v_profile_settings jsonb;
  v_value_text text;
  v_visibility text;
  v_approval_status text;
begin
  if tg_op = 'DELETE' then
    v_user_id := old.user_id;
    v_visibility := 'private';
    v_approval_status := 'rejected';
    select key into v_attribute_key from public.afs_attributes where id = old.attribute_id limit 1;
    v_value_text := null;
  else
    v_user_id := new.user_id;
    v_visibility := new.visibility;
    v_approval_status := new.approval_status;
    select key into v_attribute_key from public.afs_attributes where id = new.attribute_id limit 1;
    v_value_text := nullif(btrim(coalesce(new.value_text, new.value_json #>> '{}', '')), '');
  end if;

  if v_attribute_key not in ('business_or_organization', 'interest_focus', 'referral_code', 'referral_source') then
    if tg_op = 'DELETE' then
      return old;
    end if;
    return new;
  end if;

  insert into public.individual_profile_details (user_id, profile_settings)
  values (v_user_id, '{}'::jsonb)
  on conflict (user_id) do nothing;

  select coalesce(profile_settings, '{}'::jsonb)
  into v_profile_settings
  from public.individual_profile_details
  where user_id = v_user_id
  for update;

  if v_attribute_key in ('business_or_organization', 'interest_focus')
     and v_visibility = 'public'
     and v_approval_status = 'approved'
     and v_value_text is not null then
    v_profile_settings := jsonb_set(
      coalesce(v_profile_settings, '{}'::jsonb),
      array[v_attribute_key],
      to_jsonb(v_value_text),
      true
    );
  else
    v_profile_settings := coalesce(v_profile_settings, '{}'::jsonb) - v_attribute_key;
  end if;

  v_profile_settings := v_profile_settings - 'referral_code' - 'referral_source';

  update public.individual_profile_details
  set
    profile_settings = v_profile_settings,
    updated_at = now()
  where user_id = v_user_id;

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$function$;

-- sync_member_catalog_role_for_user: catalog_item_memberships->catalog_item_managers(2)
CREATE OR REPLACE FUNCTION public.sync_member_catalog_role_for_user(p_user_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_role_key   text;
  v_email      text;
  v_title      text;
  v_slug       text;
  v_item_id    uuid;
begin
  if p_user_id is null then
    return;
  end if;

  -- Resolve the user's role from the role-assignment system (single source).
  select r.key
  into v_role_key
  from public.user_role_assignments ura
  join public.roles r on r.id = ura.role_id
  where ura.user_id = p_user_id
  limit 1;

  -- Every authenticated user defaults to 'bireysel' when no explicit role yet.
  v_role_key := coalesce(v_role_key, 'bireysel');

  -- Guard: platform_role_key has a FK to roles(key); skip role if it vanished.
  if not exists (select 1 from public.roles where key = v_role_key) then
    v_role_key := null;
  end if;

  -- Existing bridge?
  select ci.id
  into v_item_id
  from public.catalog_items ci
  where ci.linked_user_id = p_user_id
    and ci.item_type = 'member'
  order by ci.created_at asc
  limit 1;

  if v_item_id is not null then
    -- Keep the existing member row's role in sync (original behaviour).
    update public.catalog_items ci
    set
      platform_role_key = v_role_key,
      attributes = coalesce(ci.attributes, '{}'::jsonb)
                   || jsonb_build_object('platform_role_key', v_role_key),
      updated_at = now()
    where ci.id = v_item_id
      and (
        ci.platform_role_key is distinct from v_role_key
        or coalesce(ci.attributes ->> 'platform_role_key', '') is distinct from coalesce(v_role_key, '')
      );

    -- Ensure an owner membership exists.
    insert into public.catalog_item_managers (item_id, user_id, role, status)
    values (v_item_id, p_user_id, 'owner', 'active')
    on conflict (item_id, user_id, role) do update
    set status = 'active', updated_at = now();

    return;
  end if;

  -- No bridge yet → create one. Title falls back to the email local-part.
  select au.email into v_email from auth.users au where au.id = p_user_id;
  v_title := coalesce(
    nullif(btrim(split_part(coalesce(v_email, ''), '@', 1)), ''),
    'CorteQS Üyesi'
  );

  v_slug := 'member-' || substr(replace(p_user_id::text, '-', ''), 1, 16);
  if exists (
    select 1 from public.catalog_items ci
    where ci.slug = v_slug and ci.linked_user_id is distinct from p_user_id
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
    platform_role_key,
    attributes,
    published_at
  )
  values (
    'member',
    v_slug,
    v_title,
    'published',
    'public',
    'claimed',
    p_user_id,
    p_user_id,
    v_role_key,
    jsonb_build_object('bridge_source', 'auth_member_sync', 'platform_role_key', v_role_key),
    now()
  )
  on conflict (slug) do nothing
  returning id into v_item_id;

  -- Race / pre-existing slug fallback.
  if v_item_id is null then
    select ci.id into v_item_id
    from public.catalog_items ci
    where ci.linked_user_id = p_user_id and ci.item_type = 'member'
    order by ci.created_at asc
    limit 1;
  end if;

  if v_item_id is not null then
    insert into public.catalog_item_managers (item_id, user_id, role, status)
    values (v_item_id, p_user_id, 'owner', 'active')
    on conflict (item_id, user_id, role) do update
    set status = 'active', updated_at = now();
  end if;
end;
$function$;

-- update_catalog_item_attribute: attribute_catalog->afs_attributes(2), catalog_item_attributes->catalog_item_attribute_values(1)
CREATE OR REPLACE FUNCTION public.update_catalog_item_attribute(p_item_id uuid, p_attribute_key text, p_value jsonb, p_visibility text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_item public.catalog_items%rowtype;
  v_attribute public.afs_attributes%rowtype;
  v_rule public.item_type_attribute_rules%rowtype;
  v_visibility text;
  v_value_text text;
  v_request_id uuid;
begin
  if auth.uid() is null then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  select *
  into v_item
  from public.catalog_items
  where id = p_item_id
  limit 1;

  if v_item.id is null then
    raise exception 'item not found' using errcode = 'P0002';
  end if;

  if not (
    v_item.linked_user_id = auth.uid()
    or public.catalog_user_can_edit_item(auth.uid(), p_item_id)
    or public.is_admin(auth.uid())
  ) then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  select *
  into v_attribute
  from public.afs_attributes
  where key = p_attribute_key
    and is_active = true
  limit 1;

  if v_attribute.id is null then
    raise exception 'invalid attribute key' using errcode = '22023';
  end if;

  select *
  into v_rule
  from public.item_type_attribute_rules
  where item_type = v_item.item_type
    and attribute_id = v_attribute.id
    and is_enabled = true
  limit 1;

  if v_rule.id is null then
    raise exception 'attribute not enabled for this item type' using errcode = '42501';
  end if;

  if not public.is_admin(auth.uid()) and not v_rule.editor_can_edit then
    raise exception 'attribute not editable' using errcode = '42501';
  end if;

  v_visibility := coalesce(
    nullif(btrim(coalesce(p_visibility, '')), ''),
    case when v_rule.is_public_default then 'public' else 'private' end
  );

  if v_visibility not in ('public', 'private', 'admin_only') then
    raise exception 'invalid visibility' using errcode = '22023';
  end if;

  if v_attribute.data_type in ('text', 'textarea', 'select', 'url', 'phone') then
    v_value_text := nullif(btrim(coalesce(p_value #>> '{}', '')), '');
  end if;

  if v_rule.requires_admin_approval_on_change and not public.is_admin(auth.uid()) then
    insert into public.approval_requests (
      request_type,
      user_id,
      target_entity_type,
      target_entity_id,
      payload,
      status
    )
    values (
      'attribute_change',
      auth.uid(),
      'catalog_item',
      p_item_id,
      jsonb_build_object(
        'item_id', p_item_id,
        'attribute_key', p_attribute_key,
        'attribute_value', p_value,
        'visibility', v_visibility
      ),
      'pending'
    )
    returning id into v_request_id;

    return jsonb_build_object(
      'status', 'pending',
      'request_id', v_request_id,
      'attribute_key', p_attribute_key
    );
  end if;

  if p_attribute_key = 'full_name' then
    update public.catalog_items
    set
      title = coalesce(v_value_text, title),
      updated_at = now()
    where id = p_item_id;
  end if;

  insert into public.catalog_item_attribute_values (
    item_id,
    attribute_id,
    value_text,
    value_json,
    visibility,
    approval_status,
    approved_by,
    approved_at,
    updated_at
  )
  values (
    p_item_id,
    v_attribute.id,
    case when v_attribute.data_type in ('text', 'textarea', 'select', 'url', 'phone') then v_value_text else null end,
    case when v_attribute.data_type in ('multi_select', 'boolean', 'json') then p_value else null end,
    v_visibility,
    'approved',
    auth.uid(),
    now(),
    now()
  )
  on conflict (item_id, attribute_id) do update
  set
    value_text = excluded.value_text,
    value_json = excluded.value_json,
    visibility = excluded.visibility,
    approval_status = 'approved',
    approved_by = excluded.approved_by,
    approved_at = excluded.approved_at,
    updated_at = now();

  return jsonb_build_object(
    'status', 'approved',
    'attribute_key', p_attribute_key,
    'visibility', v_visibility
  );
end;
$function$;

-- update_profile_attribute: attribute_catalog->afs_attributes(2), role_attribute_rules->role_attributes(2)
CREATE OR REPLACE FUNCTION public.update_profile_attribute(attribute_key text, attribute_value jsonb, visibility text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_user_id uuid := auth.uid();
  v_role_key text;
  v_role_id uuid;
  v_attribute public.afs_attributes%rowtype;
  v_rule public.role_attributes%rowtype;
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

  select * into v_attribute from public.afs_attributes where key = attribute_key and is_active = true limit 1;
  if v_attribute.id is null then
    raise exception 'invalid attribute key' using errcode = '22023';
  end if;

  select rar.* into v_rule
  from public.role_attributes rar
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
$function$;

-- update_profile_avatar: moved to 20260609100901_rebuild_010d (referenced dropped public.profiles + public.user_profiles)

