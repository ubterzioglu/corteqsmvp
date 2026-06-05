begin;

create or replace function public.get_catalog_item_rules(p_item_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
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
      )
  ),
  inherited_attributes as (
    select jsonb_agg(
      jsonb_build_object(
        'key', ac.key,
        'label', ac.label,
        'dataType', ac.data_type,
        'visibility', case when rar.is_public_default then 'public' else 'private' end,
        'isRequired', rar.is_required,
        'displayOrder', rar.sort_order,
        'isOverride', false,
        'isEnabled', rar.is_enabled
      )
      order by rar.sort_order, ac.label
    ) as rows
    from item_role ir
    join public.role_attribute_rules rar on rar.role_id = ir.role_id and rar.is_enabled = true
    join public.attribute_catalog ac on ac.id = rar.attribute_id and ac.is_active = true
  ),
  override_attributes as (
    select jsonb_agg(
      jsonb_build_object(
        'key', ac.key,
        'label', coalesce(ciao.override_label, ac.label),
        'dataType', ac.data_type,
        'visibility', 'public',
        'isRequired', false,
        'displayOrder', coalesce(ciao.display_order, ac.sort_order),
        'isOverride', true,
        'isEnabled', ciao.is_enabled
      )
      order by coalesce(ciao.display_order, ac.sort_order), ac.label
    ) as rows
    from item_role ir
    join public.catalog_item_attribute_overrides ciao on ciao.item_id = ir.item_id and ciao.is_enabled = true
    join public.attribute_catalog ac on ac.key = ciao.attribute_key and ac.is_active = true
  ),
  inherited_features as (
    select jsonb_agg(
      jsonb_build_object(
        'key', fc.key,
        'label', fc.label,
        'isEnabled', rff.is_enabled,
        'isOverride', false
      )
      order by fc.sort_order, fc.label
    ) as rows
    from item_role ir
    join public.role_feature_flags rff on rff.role_id = ir.role_id and rff.is_enabled = true
    join public.feature_catalog fc on fc.key = rff.feature_key and fc.is_active_globally = true
  ),
  override_features as (
    select jsonb_agg(
      jsonb_build_object(
        'key', fc.key,
        'label', fc.label,
        'isEnabled', cifo.is_enabled,
        'isOverride', true
      )
      order by fc.sort_order, fc.label
    ) as rows
    from item_role ir
    join public.catalog_item_feature_overrides cifo on cifo.item_id = ir.item_id and cifo.is_enabled = true
    join public.feature_catalog fc on fc.key = cifo.feature_key and fc.is_active_globally = true
  ),
  inherited_sections as (
    select jsonb_agg(
      jsonb_build_object(
        'key', psc.key,
        'label', psc.label,
        'isVisible', rpsr.is_enabled,
        'displayOrder', rpsr.sort_order,
        'isOverride', false
      )
      order by rpsr.sort_order, psc.label
    ) as rows
    from item_role ir
    join public.role_profile_section_rules rpsr on rpsr.role_id = ir.role_id and rpsr.is_enabled = true
    join public.profile_section_catalog psc on psc.id = rpsr.section_id and psc.is_active = true
  ),
  override_sections as (
    select jsonb_agg(
      jsonb_build_object(
        'key', psc.key,
        'label', psc.label,
        'isVisible', ciso.is_visible,
        'displayOrder', coalesce(ciso.display_order, psc.sort_order),
        'isOverride', true
      )
      order by coalesce(ciso.display_order, psc.sort_order), psc.label
    ) as rows
    from item_role ir
    join public.catalog_item_section_overrides ciso on ciso.item_id = ir.item_id and ciso.is_visible = true
    join public.profile_section_catalog psc on psc.key = ciso.section_key and psc.is_active = true
  )
  select jsonb_build_object(
    'platformRoleKey', (select platform_role_key from item_role),
    'attributes', coalesce((select rows from inherited_attributes), '[]'::jsonb) || coalesce((select rows from override_attributes), '[]'::jsonb),
    'features', coalesce((select rows from inherited_features), '[]'::jsonb) || coalesce((select rows from override_features), '[]'::jsonb),
    'sections', coalesce((select rows from inherited_sections), '[]'::jsonb) || coalesce((select rows from override_sections), '[]'::jsonb),
    'overrides', jsonb_build_object(
      'attributes', coalesce((select rows from override_attributes), '[]'::jsonb),
      'features', coalesce((select rows from override_features), '[]'::jsonb),
      'sections', coalesce((select rows from override_sections), '[]'::jsonb)
    )
  )
  where exists (select 1 from item_role);
$$;

create or replace function public.admin_set_catalog_item_role(
  p_item_id uuid,
  p_role_key text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor_id uuid := auth.uid();
begin
  if v_actor_id is null or not public.is_moderator(v_actor_id) then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  if p_role_key is not null and not exists (
    select 1 from public.roles where key = p_role_key and is_active = true
  ) then
    raise exception 'invalid role' using errcode = '22023';
  end if;

  update public.catalog_items
  set platform_role_key = p_role_key,
      attributes = coalesce(attributes, '{}'::jsonb) ||
        case
          when p_role_key is null then '{}'::jsonb
          else jsonb_build_object('platform_role_key', p_role_key)
        end,
      updated_at = now()
  where id = p_item_id;

  if not found then
    raise exception 'catalog item not found' using errcode = 'P0002';
  end if;
end;
$$;

drop function if exists public.catalog_upsert_source_item(
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  uuid,
  timestamptz,
  jsonb,
  text,
  jsonb
);

create or replace function public.catalog_upsert_source_item(
  p_source_type text,
  p_external_id text,
  p_item_type text,
  p_slug text,
  p_title text,
  p_headline text,
  p_short_description text,
  p_long_description text,
  p_status text,
  p_visibility text,
  p_verification_status text,
  p_created_by_user_id uuid,
  p_published_at timestamptz,
  p_attributes jsonb default '{}'::jsonb,
  p_source_url text default null,
  p_raw_snapshot jsonb default '{}'::jsonb,
  p_platform_role_key text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_item_id uuid;
  v_platform_role_key text := nullif(coalesce(p_platform_role_key, p_attributes ->> 'platform_role_key'), '');
begin
  if v_platform_role_key is not null and not exists (
    select 1 from public.roles where key = v_platform_role_key and is_active = true
  ) then
    raise exception 'invalid catalog item role' using errcode = '22023';
  end if;

  select sr.item_id
  into v_item_id
  from public.source_records sr
  where sr.source_type = p_source_type
    and sr.external_id = p_external_id
  limit 1;

  if v_item_id is null then
    insert into public.catalog_items (
      item_type,
      slug,
      title,
      headline,
      short_description,
      long_description,
      status,
      visibility,
      verification_status,
      created_by_user_id,
      published_at,
      attributes,
      platform_role_key
    )
    values (
      p_item_type,
      p_slug,
      p_title,
      p_headline,
      p_short_description,
      p_long_description,
      p_status,
      p_visibility,
      p_verification_status,
      p_created_by_user_id,
      p_published_at,
      coalesce(p_attributes, '{}'::jsonb),
      v_platform_role_key
    )
    on conflict (slug) do update
    set
      item_type = excluded.item_type,
      title = excluded.title,
      headline = excluded.headline,
      short_description = excluded.short_description,
      long_description = excluded.long_description,
      status = excluded.status,
      visibility = excluded.visibility,
      verification_status = excluded.verification_status,
      created_by_user_id = coalesce(excluded.created_by_user_id, public.catalog_items.created_by_user_id),
      published_at = excluded.published_at,
      attributes = coalesce(public.catalog_items.attributes, '{}'::jsonb) || excluded.attributes,
      platform_role_key = coalesce(excluded.platform_role_key, public.catalog_items.platform_role_key),
      updated_at = now()
    returning id into v_item_id;
  else
    update public.catalog_items
    set
      item_type = p_item_type,
      slug = p_slug,
      title = p_title,
      headline = p_headline,
      short_description = p_short_description,
      long_description = p_long_description,
      status = p_status,
      visibility = p_visibility,
      verification_status = p_verification_status,
      created_by_user_id = coalesce(p_created_by_user_id, created_by_user_id),
      published_at = p_published_at,
      attributes = coalesce(attributes, '{}'::jsonb) || coalesce(p_attributes, '{}'::jsonb),
      platform_role_key = coalesce(v_platform_role_key, platform_role_key),
      updated_at = now()
    where id = v_item_id;
  end if;

  insert into public.source_records (
    item_id,
    source_type,
    external_id,
    source_url,
    raw_snapshot,
    imported_at,
    last_seen_at
  )
  values (
    v_item_id,
    p_source_type,
    p_external_id,
    p_source_url,
    coalesce(p_raw_snapshot, '{}'::jsonb),
    now(),
    now()
  )
  on conflict (source_type, external_id) do update
  set
    item_id = excluded.item_id,
    source_url = excluded.source_url,
    raw_snapshot = excluded.raw_snapshot,
    last_seen_at = now(),
    updated_at = now();

  return v_item_id;
end;
$$;

revoke all on function public.get_catalog_item_rules(uuid) from public;
revoke all on function public.admin_set_catalog_item_role(uuid, text) from public;
revoke all on function public.catalog_upsert_source_item(text, text, text, text, text, text, text, text, text, text, text, uuid, timestamptz, jsonb, text, jsonb, text) from public;

grant execute on function public.get_catalog_item_rules(uuid) to anon, authenticated;
grant execute on function public.admin_set_catalog_item_role(uuid, text) to authenticated;
grant execute on function public.catalog_upsert_source_item(text, text, text, text, text, text, text, text, text, text, text, uuid, timestamptz, jsonb, text, jsonb, text) to authenticated, service_role;

commit;
