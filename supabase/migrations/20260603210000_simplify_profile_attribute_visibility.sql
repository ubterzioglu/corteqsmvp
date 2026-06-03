begin;

update public.user_profile_attributes
set visibility = 'private'
where visibility = 'admin_only';

alter table public.user_profile_attributes
  drop constraint if exists user_profile_attributes_visibility_check;

alter table public.user_profile_attributes
  add constraint user_profile_attributes_visibility_check
  check (visibility in ('public', 'private'));

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
  v_user public.user_profiles%rowtype;
  v_role_key text;
  v_attribute public.attribute_catalog%rowtype;
  v_rule public.role_attribute_rules%rowtype;
  v_visibility text;
  v_value_text text;
  v_request_id uuid;
begin
  if v_user_id is null then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  select * into v_user from public.user_profiles where user_id = v_user_id limit 1;
  if v_user.user_id is null then
    raise exception 'user profile not found' using errcode = 'P0002';
  end if;

  v_role_key := v_user.profile_type;

  select * into v_attribute from public.attribute_catalog where key = attribute_key and is_active = true limit 1;
  if v_attribute.id is null then
    raise exception 'invalid attribute key' using errcode = '22023';
  end if;

  select rar.* into v_rule
  from public.role_attribute_rules rar
  join public.roles r on r.id = rar.role_id
  where r.key = v_role_key
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
  if v_visibility not in ('public', 'private') then
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
      request_type,
      user_id,
      target_entity_type,
      payload,
      status
    ) values (
      'attribute_change',
      v_user_id,
      'attribute',
      jsonb_build_object(
        'attribute_key', attribute_key,
        'attribute_value', attribute_value,
        'visibility', v_visibility
      ),
      'pending'
    ) returning id into v_request_id;

    insert into public.user_profile_attributes (
      user_id,
      attribute_id,
      value_text,
      value_json,
      visibility,
      approval_status,
      updated_at
    ) values (
      v_user_id,
      v_attribute.id,
      case when v_attribute.data_type in ('text','textarea','select','url','phone') then v_value_text else null end,
      case when v_attribute.data_type in ('multi_select','boolean','json') then attribute_value else null end,
      v_visibility,
      'pending',
      now()
    )
    on conflict (user_id, attribute_id) do update
    set
      value_text = excluded.value_text,
      value_json = excluded.value_json,
      visibility = excluded.visibility,
      approval_status = 'pending',
      updated_at = now();

    return jsonb_build_object(
      'attribute_key', attribute_key,
      'status', 'pending',
      'request_id', v_request_id
    );
  end if;

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
    v_user_id,
    v_attribute.id,
    case when v_attribute.data_type in ('text','textarea','select','url','phone') then v_value_text else null end,
    case when v_attribute.data_type in ('multi_select','boolean','json') then attribute_value else null end,
    v_visibility,
    'approved',
    v_user_id,
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

  return jsonb_build_object(
    'attribute_key', attribute_key,
    'status', 'approved'
  );
end;
$$;

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
  if v_visibility not in ('public', 'private') then
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

grant execute on function public.update_profile_attribute(text, jsonb, text) to authenticated;
grant execute on function public.admin_update_user_profile_attribute(uuid, text, jsonb, text) to authenticated;

commit;
