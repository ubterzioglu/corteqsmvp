begin;

create or replace function public.admin_update_user_profile_attribute(
  target_user_id uuid,
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
  v_attribute public.attribute_catalog%rowtype;
  v_visibility text;
  v_value_text text;
  v_before public.user_profile_attributes%rowtype;
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  if target_user_id is null then
    raise exception 'target user is required' using errcode = '22023';
  end if;

  if attribute_key is null or btrim(attribute_key) = '' then
    raise exception 'attribute key is required' using errcode = '22023';
  end if;

  if attribute_key = 'full_name' then
    update public.user_profiles
    set
      full_name = nullif(btrim(coalesce(attribute_value #>> '{}', '')), ''),
      updated_at = now()
    where user_id = target_user_id;

    if not found then
      raise exception 'user profile not found' using errcode = 'P0002';
    end if;

    perform public.write_admin_audit_log(
      'admin.user_profile_attribute_updated',
      target_user_id,
      'user_profile',
      target_user_id,
      null,
      jsonb_build_object(
        'attribute_key', attribute_key,
        'value', attribute_value,
        'visibility', 'public'
      )
    );

    return jsonb_build_object(
      'attribute_key', attribute_key,
      'status', 'approved'
    );
  end if;

  select * into v_attribute
  from public.attribute_catalog
  where key = attribute_key
    and is_active = true
  limit 1;

  if v_attribute.id is null then
    raise exception 'invalid attribute key' using errcode = '22023';
  end if;

  v_visibility := coalesce(visibility, 'private');
  if v_visibility not in ('public', 'private', 'admin_only') then
    raise exception 'invalid visibility' using errcode = '22023';
  end if;

  if v_attribute.data_type in ('text','textarea','select','url','phone') then
    v_value_text := nullif(btrim(coalesce(attribute_value #>> '{}', '')), '');
  end if;

  select * into v_before
  from public.user_profile_attributes
  where user_id = target_user_id
    and attribute_id = v_attribute.id
  limit 1;

  insert into public.user_profile_attributes (
    user_id,
    attribute_id,
    value_text,
    value_json,
    visibility,
    approval_status,
    approved_by,
    approved_at,
    updated_at
  ) values (
    target_user_id,
    v_attribute.id,
    case when v_attribute.data_type in ('text','textarea','select','url','phone') then v_value_text else null end,
    case when v_attribute.data_type in ('multi_select','boolean','json') then attribute_value else null end,
    v_visibility,
    'approved',
    auth.uid(),
    now(),
    now()
  )
  on conflict (user_id, attribute_id) do update
  set
    value_text = excluded.value_text,
    value_json = excluded.value_json,
    visibility = excluded.visibility,
    approval_status = 'approved',
    approved_by = excluded.approved_by,
    approved_at = excluded.approved_at,
    updated_at = now();

  perform public.write_admin_audit_log(
    'admin.user_profile_attribute_updated',
    target_user_id,
    'user_profile_attribute',
    target_user_id,
    case when v_before.id is null then null else to_jsonb(v_before) end,
    jsonb_build_object(
      'attribute_key', attribute_key,
      'value', attribute_value,
      'visibility', v_visibility
    )
  );

  return jsonb_build_object(
    'attribute_key', attribute_key,
    'status', 'approved'
  );
end;
$$;

create or replace function public.admin_update_user_taxonomy_selection(
  target_user_id uuid,
  group_key text,
  option_keys text[]
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user public.user_profiles%rowtype;
  v_group public.taxonomy_groups%rowtype;
  v_rule public.role_taxonomy_rules%rowtype;
  v_role public.roles%rowtype;
  v_selected_count integer;
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  select * into v_user from public.user_profiles where user_id = target_user_id limit 1;
  select * into v_group from public.taxonomy_groups where key = group_key and is_active = true limit 1;
  select * into v_role from public.roles where key = v_user.profile_type limit 1;

  if v_user.user_id is null or v_group.id is null or v_role.id is null then
    raise exception 'invalid taxonomy update context' using errcode = '22023';
  end if;

  select * into v_rule
  from public.role_taxonomy_rules
  where role_id = v_role.id and group_id = v_group.id and is_enabled = true
  limit 1;

  if v_rule.id is null then
    raise exception 'taxonomy group is not enabled for current role' using errcode = '42501';
  end if;

  select count(*)
  into v_selected_count
  from public.taxonomy_options
  where group_id = v_group.id
    and is_active = true
    and key = any(coalesce(option_keys, array[]::text[]));

  if v_selected_count <> coalesce(array_length(option_keys, 1), 0) then
    raise exception 'one or more taxonomy options are invalid' using errcode = '22023';
  end if;

  if v_rule.selection_mode = 'single' and coalesce(array_length(option_keys, 1), 0) > 1 then
    raise exception 'single selection group cannot accept multiple options' using errcode = '22023';
  end if;

  if v_rule.is_required and coalesce(array_length(option_keys, 1), 0) = 0 then
    raise exception 'at least one taxonomy option is required' using errcode = '22023';
  end if;

  delete from public.user_taxonomy_selections
  where user_id = target_user_id
    and group_id = v_group.id;

  insert into public.user_taxonomy_selections (user_id, group_id, option_id)
  select target_user_id, v_group.id, t.id
  from public.taxonomy_options t
  where t.group_id = v_group.id
    and t.key = any(coalesce(option_keys, array[]::text[]));

  perform public.write_admin_audit_log(
    'admin.user_taxonomy_selection_updated',
    target_user_id,
    'user_taxonomy_selection',
    target_user_id,
    null,
    jsonb_build_object(
      'group_key', group_key,
      'option_keys', coalesce(option_keys, array[]::text[])
    )
  );

  return jsonb_build_object(
    'group_key', group_key,
    'selection_count', coalesce(array_length(option_keys, 1), 0),
    'status', 'approved'
  );
end;
$$;

grant execute on function public.admin_update_user_profile_attribute(uuid, text, jsonb, text) to authenticated;
grant execute on function public.admin_update_user_taxonomy_selection(uuid, text, text[]) to authenticated;

commit;
