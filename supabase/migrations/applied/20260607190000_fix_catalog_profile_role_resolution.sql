begin;

-- Fix get_catalog_item_profile role resolution.
--
-- Previously: item_type → catalog_item_types.linked_role_key → role_id
-- Problem: a "Healthcare_Doctor" catalog item has item_type = 'advisor',
--          so it resolved to the 'danisman' role instead of 'Healthcare_Doctor'.
--
-- Fix: prefer catalog_items.platform_role_key when present; fall back to
--      item_type → linked_role_key only when platform_role_key is null/empty.

create or replace function public.get_catalog_item_profile(p_item_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
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
    -- ── UNIFIED PATH: rules come from role_attribute_rules ──────────────────

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
    from public.role_attribute_rules rar
    join public.attribute_catalog ac
      on ac.id = rar.attribute_id
     and ac.is_active = true
    left join public.catalog_item_attributes cia
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
    from public.role_feature_flags rff
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
$$;

grant execute on function public.get_catalog_item_profile(uuid) to authenticated;

commit;
