begin;

create or replace function public.get_catalog_item_profile(p_item_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_item public.catalog_items%rowtype;
  v_attributes jsonb := '[]'::jsonb;
  v_features jsonb := '[]'::jsonb;
begin
  select *
  into v_item
  from public.catalog_items
  where id = p_item_id
  limit 1;

  if v_item.id is null then
    return '{}'::jsonb;
  end if;

  if not (
    public.catalog_item_is_publicly_visible(v_item.id)
    or v_item.linked_user_id = auth.uid()
    or public.catalog_user_can_edit_item(auth.uid(), v_item.id)
    or public.is_admin(auth.uid())
  ) then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'attribute_key', ac.key,
        'label', ac.label,
        'data_type', ac.data_type,
        'is_system', ac.is_system,
        'sort_order', itar.sort_order,
        'is_required', itar.is_required,
        'is_public_default', itar.is_public_default,
        'editor_can_edit', itar.editor_can_edit,
        'editor_can_hide', itar.editor_can_hide,
        'requires_admin_approval_on_change', itar.requires_admin_approval_on_change,
        'visibility', coalesce(cia.visibility, case when itar.is_public_default then 'public' else 'private' end),
        'approval_status', coalesce(cia.approval_status, 'approved'),
        'value_text', case when ac.key = 'full_name' then v_item.title else cia.value_text end,
        'value_json', cia.value_json
      )
      order by itar.sort_order, ac.label
    ),
    '[]'::jsonb
  )
  into v_attributes
  from public.item_type_attribute_rules itar
  join public.attribute_catalog ac
    on ac.id = itar.attribute_id
   and ac.is_active = true
  left join public.catalog_item_attributes cia
    on cia.item_id = v_item.id
   and cia.attribute_id = ac.id
  where itar.item_type = v_item.item_type
    and itar.is_enabled = true;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'feature_key', itfd.feature_key,
        'is_enabled', coalesce(cifo.is_enabled, itfd.is_enabled),
        'source', case when cifo.id is not null then 'override' else 'type_default' end,
        'reason', cifo.reason
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

  return jsonb_build_object(
    'id', v_item.id,
    'item_type', v_item.item_type,
    'slug', v_item.slug,
    'title', v_item.title,
    'status', v_item.status,
    'visibility', v_item.visibility,
    'linked_user_id', v_item.linked_user_id,
    'attributes', v_attributes,
    'features', v_features
  );
end;
$$;

create or replace function public.update_catalog_item_attribute(
  p_item_id uuid,
  p_attribute_key text,
  p_value jsonb,
  p_visibility text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_item public.catalog_items%rowtype;
  v_attribute public.attribute_catalog%rowtype;
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
  from public.attribute_catalog
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

  insert into public.catalog_item_attributes (
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
$$;

create or replace function public.admin_set_catalog_item_attribute(
  p_item_id uuid,
  p_attribute_key text,
  p_value jsonb,
  p_visibility text default 'public'
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_attribute public.attribute_catalog%rowtype;
  v_value_text text;
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  select *
  into v_attribute
  from public.attribute_catalog
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

  insert into public.catalog_item_attributes (
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
$$;

create or replace function public.admin_set_catalog_item_feature_override(
  p_item_id uuid,
  p_feature_key text,
  p_is_enabled boolean,
  p_reason text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  if not exists (
    select 1
    from public.feature_definitions fd
    where fd.key = p_feature_key
  ) then
    raise exception 'invalid feature key' using errcode = '22023';
  end if;

  insert into public.catalog_item_feature_overrides (
    item_id,
    feature_key,
    is_enabled,
    updated_by,
    reason,
    updated_at
  )
  values (
    p_item_id,
    p_feature_key,
    p_is_enabled,
    auth.uid(),
    nullif(btrim(coalesce(p_reason, '')), ''),
    now()
  )
  on conflict (item_id, feature_key) do update
  set
    is_enabled = excluded.is_enabled,
    updated_by = excluded.updated_by,
    reason = excluded.reason,
    updated_at = now();

  perform public.write_admin_audit_log(
    'catalog.feature_override_set',
    null,
    'catalog_item',
    p_item_id,
    null,
    jsonb_build_object(
      'feature_key', p_feature_key,
      'is_enabled', p_is_enabled,
      'reason', p_reason
    )
  );
end;
$$;

create or replace function public.admin_set_catalog_item_editor(
  p_item_id uuid,
  p_user_id uuid,
  p_role text default 'editor'
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  if p_role not in ('owner', 'manager', 'editor', 'contributor', 'viewer') then
    raise exception 'invalid role' using errcode = '22023';
  end if;

  insert into public.catalog_item_memberships (item_id, user_id, role, status)
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
$$;

create or replace function public.admin_remove_catalog_item_editor(
  p_item_id uuid,
  p_user_id uuid,
  p_role text default 'editor'
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  update public.catalog_item_memberships
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
$$;

revoke all on function public.get_catalog_item_profile(uuid) from public;
revoke all on function public.update_catalog_item_attribute(uuid, text, jsonb, text) from public;
revoke all on function public.admin_set_catalog_item_attribute(uuid, text, jsonb, text) from public;
revoke all on function public.admin_set_catalog_item_feature_override(uuid, text, boolean, text) from public;
revoke all on function public.admin_set_catalog_item_editor(uuid, uuid, text) from public;
revoke all on function public.admin_remove_catalog_item_editor(uuid, uuid, text) from public;

grant execute on function public.get_catalog_item_profile(uuid) to authenticated;
grant execute on function public.update_catalog_item_attribute(uuid, text, jsonb, text) to authenticated;
grant execute on function public.admin_set_catalog_item_attribute(uuid, text, jsonb, text) to authenticated;
grant execute on function public.admin_set_catalog_item_feature_override(uuid, text, boolean, text) to authenticated;
grant execute on function public.admin_set_catalog_item_editor(uuid, uuid, text) to authenticated;
grant execute on function public.admin_remove_catalog_item_editor(uuid, uuid, text) to authenticated;

commit;
