begin;

create or replace function public.admin_set_role_feature_flag(
  role_key text,
  feature_key text,
  is_enabled boolean
)
returns void
language plpgsql
security definer
set search_path = public
as $$
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
    from public.feature_catalog fc
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
  from public.role_feature_flags rff
  where rff.role_id = v_role_id
    and rff.feature_key = admin_set_role_feature_flag.feature_key;

  insert into public.role_feature_flags (role_id, feature_key, is_enabled, updated_by)
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
$$;

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

  select fc.scope_role
  into v_scope_role
  from public.feature_catalog fc
  where fc.key = admin_set_user_feature_override_detailed.feature_key;

  if v_scope_role is null then
    raise exception 'invalid feature key'
      using errcode = '22023';
  end if;

  if not exists (
    select 1
    from public.user_profiles up
    where up.user_id = target_user_id
      and (v_scope_role = '*' or up.profile_type = v_scope_role)
  ) then
    raise exception 'user profile not found for feature scope'
      using errcode = 'P0002';
  end if;

  select * into v_before
  from public.user_feature_overrides
  where user_id = target_user_id
    and feature_key = admin_set_user_feature_override_detailed.feature_key;

  insert into public.user_feature_overrides (user_id, feature_key, is_enabled, updated_by, updated_at, reason)
  values (
    target_user_id,
    admin_set_user_feature_override_detailed.feature_key,
    admin_set_user_feature_override_detailed.is_enabled,
    auth.uid(),
    now(),
    admin_set_user_feature_override_detailed.reason
  )
  on conflict on constraint user_feature_overrides_pkey do update
  set
    is_enabled = excluded.is_enabled,
    updated_by = excluded.updated_by,
    updated_at = now(),
    reason = excluded.reason;

  perform public.write_admin_audit_log(
    'feature.override_set',
    target_user_id,
    'user_feature_override',
    target_user_id,
    case when v_before.user_id is null then null else to_jsonb(v_before) end,
    jsonb_build_object('feature_key', feature_key, 'is_enabled', is_enabled, 'reason', reason)
  );
end;
$$;

create or replace function public.admin_clear_user_feature_override(
  target_user_id uuid,
  feature_key text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
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
    from public.feature_catalog fc
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
$$;

grant execute on function public.admin_set_role_feature_flag(text, text, boolean) to authenticated;
grant execute on function public.admin_set_user_feature_override_detailed(uuid, text, boolean, text) to authenticated;
grant execute on function public.admin_clear_user_feature_override(uuid, text) to authenticated;

commit;
