-- Repair catalog editor RPCs after the AFS rebuild.
--
-- Live problem (verified 2026-06-10): update_catalog_item_attribute and the
-- legacy fallback branch of get_catalog_item_profile still reference
-- item_type_attribute_rules / catalog_item_types / item_type_feature_defaults,
-- all DROPPED by the 2026-06-09 rebuild. Every save through the catalog editor
-- fails with "relation does not exist"; profile reads fail for items without a
-- valid platform_role_key.
--
-- Rewrite both functions on the canonical flat-role AFS path:
--   role := primary catalog_item_roles -> fallback platform_role_key
--   attribute rules := role_attributes, feature flags := role_features
--
-- update_catalog_item_attribute additionally mirrors member-item writes back to
-- user_profile_attributes (the /profile editor's store) so both editors stay
-- consistent; the upa->item trigger from 20260610171000 covers the opposite
-- direction.
--
-- Idempotent (create or replace only).

begin;

-- ─── get_catalog_item_profile ────────────────────────────────────────────────

create or replace function public.get_catalog_item_profile(p_item_id uuid)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_item       public.catalog_items%rowtype;
  v_role_id    uuid;
  v_attributes jsonb := '[]'::jsonb;
  v_features   jsonb := '[]'::jsonb;
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

  -- Primary flat role; fallback to platform_role_key.
  select cir.role_id
  into v_role_id
  from public.catalog_item_roles cir
  join public.roles r on r.id = cir.role_id and r.is_active = true and r.deleted_at is null
  where cir.catalog_item_id = v_item.id
    and cir.is_primary
  limit 1;

  if v_role_id is null and v_item.platform_role_key is not null then
    select r.id
    into v_role_id
    from public.roles r
    where r.key = v_item.platform_role_key
      and r.is_active = true
      and r.deleted_at is null
    limit 1;
  end if;

  if v_role_id is not null then
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
          'value_text',   case when ac.key = 'full_name' then coalesce(cia.value_text, v_item.title) else cia.value_text end,
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
$$;

comment on function public.get_catalog_item_profile(uuid) is
  'Owner/editor/admin profile payload for a catalog item. Attribute and feature '
  'rules resolve via the flat-role AFS tables (role_attributes / role_features).';

-- ─── update_catalog_item_attribute ───────────────────────────────────────────

create or replace function public.update_catalog_item_attribute(
  p_item_id uuid,
  p_attribute_key text,
  p_value jsonb,
  p_visibility text default null::text
)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_item       public.catalog_items%rowtype;
  v_attribute  public.afs_attributes%rowtype;
  v_rule       public.role_attributes%rowtype;
  v_role_id    uuid;
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

  -- Primary flat role; fallback to platform_role_key.
  select cir.role_id
  into v_role_id
  from public.catalog_item_roles cir
  join public.roles r on r.id = cir.role_id and r.is_active = true and r.deleted_at is null
  where cir.catalog_item_id = v_item.id
    and cir.is_primary
  limit 1;

  if v_role_id is null and v_item.platform_role_key is not null then
    select r.id
    into v_role_id
    from public.roles r
    where r.key = v_item.platform_role_key
      and r.is_active = true
      and r.deleted_at is null
    limit 1;
  end if;

  if v_role_id is null then
    raise exception 'item has no active role' using errcode = '42501';
  end if;

  select *
  into v_rule
  from public.role_attributes
  where role_id = v_role_id
    and attribute_id = v_attribute.id
    and is_enabled = true
  limit 1;

  if v_rule.id is null then
    raise exception 'attribute is not enabled for current role' using errcode = '42501';
  end if;

  if not public.is_admin(auth.uid()) and not coalesce(v_rule.user_can_edit, false) then
    raise exception 'attribute not editable' using errcode = '42501';
  end if;

  v_visibility := coalesce(
    nullif(btrim(coalesce(p_visibility, '')), ''),
    case when coalesce(v_rule.is_public_default, false) then 'public' else 'private' end
  );

  if v_visibility not in ('public', 'private', 'admin_only') then
    raise exception 'invalid visibility' using errcode = '22023';
  end if;

  if not public.is_admin(auth.uid())
     and not coalesce(v_rule.user_can_hide, true)
     and v_visibility <> 'public' then
    raise exception 'attribute visibility cannot be changed' using errcode = '42501';
  end if;

  if v_attribute.data_type in ('text', 'textarea', 'select', 'url', 'phone') then
    v_value_text := nullif(btrim(coalesce(p_value #>> '{}', '')), '');
  end if;

  if coalesce(v_rule.requires_admin_approval_on_change, false) and not public.is_admin(auth.uid()) then
    insert into public.approval_requests (
      request_type, user_id, target_entity_type, target_entity_id, payload, status
    )
    values (
      'attribute_change', auth.uid(), 'catalog_item', p_item_id,
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
    set title = coalesce(v_value_text, title), updated_at = now()
    where id = p_item_id;
  end if;

  insert into public.catalog_item_attribute_values (
    item_id, attribute_id, value_text, value_json,
    visibility, approval_status, approved_by, approved_at, updated_at
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

  -- Member items: mirror to the user-scoped store so /profile stays in sync.
  if v_item.item_type = 'member' and v_item.linked_user_id is not null then
    insert into public.user_profile_attributes (
      user_id, attribute_id, value_text, value_json,
      visibility, approval_status, approved_by, approved_at, updated_at
    )
    values (
      v_item.linked_user_id,
      v_attribute.id,
      case when v_attribute.data_type in ('text', 'textarea', 'select', 'url', 'phone') then v_value_text else null end,
      case when v_attribute.data_type in ('multi_select', 'boolean', 'json') then p_value else null end,
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
  end if;

  return jsonb_build_object(
    'status', 'approved',
    'attribute_key', p_attribute_key,
    'visibility', v_visibility
  );
end;
$$;

comment on function public.update_catalog_item_attribute(uuid, text, jsonb, text) is
  'Owner/editor/admin attribute write for a catalog item, gated by the flat-role '
  'AFS rules (role_attributes). Member items mirror writes to user_profile_attributes.';

commit;
