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
  attribute_base as (
    select
      ac.key,
      ac.label,
      ac.data_type,
      case when rar.is_public_default then 'public' else 'private' end as visibility,
      rar.is_required,
      rar.sort_order as display_order
    from item_role ir
    join public.role_attribute_rules rar
      on rar.role_id = ir.role_id
     and rar.is_enabled = true
    join public.attribute_catalog ac
      on ac.id = rar.attribute_id
     and ac.is_active = true
  ),
  attribute_overrides as (
    select
      ciao.attribute_key as key,
      ciao.is_enabled,
      ciao.display_order,
      ciao.override_label
    from item_role ir
    join public.catalog_item_attribute_overrides ciao
      on ciao.item_id = ir.item_id
  ),
  attribute_combined as (
    select
      coalesce(ao.key, ab.key) as key,
      coalesce(ao.override_label, ab.label, ac.label) as label,
      coalesce(ab.data_type, ac.data_type, 'text') as data_type,
      coalesce(ab.visibility, 'public') as visibility,
      coalesce(ab.is_required, false) as is_required,
      coalesce(ao.display_order, ab.display_order, ac.sort_order, 0) as display_order,
      coalesce(ao.is_enabled, true) as is_enabled,
      (ao.key is not null) as is_override
    from attribute_base ab
    full outer join attribute_overrides ao on ao.key = ab.key
    left join public.attribute_catalog ac
      on ac.key = coalesce(ao.key, ab.key)
     and ac.is_active = true
  ),
  feature_base as (
    select
      fc.key,
      fc.label,
      rff.is_enabled
    from item_role ir
    join public.role_feature_flags rff
      on rff.role_id = ir.role_id
     and rff.is_enabled = true
    join public.feature_catalog fc
      on fc.key = rff.feature_key
     and fc.is_active_globally = true
  ),
  feature_overrides as (
    select
      cifo.feature_key as key,
      cifo.is_enabled
    from item_role ir
    join public.catalog_item_feature_overrides cifo
      on cifo.item_id = ir.item_id
  ),
  feature_combined as (
    select
      coalesce(fo.key, fb.key) as key,
      coalesce(fb.label, fc.label) as label,
      coalesce(fo.is_enabled, fb.is_enabled, false) as is_enabled,
      (fo.key is not null) as is_override,
      coalesce(fc.sort_order, 0) as sort_order
    from feature_base fb
    full outer join feature_overrides fo on fo.key = fb.key
    left join public.feature_catalog fc
      on fc.key = coalesce(fo.key, fb.key)
     and fc.is_active_globally = true
  ),
  section_base as (
    select
      psc.key,
      psc.label,
      rpsr.is_enabled as is_visible,
      rpsr.sort_order as display_order
    from item_role ir
    join public.role_profile_section_rules rpsr
      on rpsr.role_id = ir.role_id
     and rpsr.is_enabled = true
    join public.profile_section_catalog psc
      on psc.id = rpsr.section_id
     and psc.is_active = true
  ),
  section_overrides as (
    select
      ciso.section_key as key,
      ciso.is_visible,
      ciso.display_order
    from item_role ir
    join public.catalog_item_section_overrides ciso
      on ciso.item_id = ir.item_id
  ),
  section_combined as (
    select
      coalesce(so.key, sb.key) as key,
      coalesce(sb.label, psc.label) as label,
      coalesce(so.is_visible, sb.is_visible, false) as is_visible,
      coalesce(so.display_order, sb.display_order, psc.sort_order, 0) as display_order,
      (so.key is not null) as is_override
    from section_base sb
    full outer join section_overrides so on so.key = sb.key
    left join public.profile_section_catalog psc
      on psc.key = coalesce(so.key, sb.key)
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
            'isOverride', is_override,
            'isEnabled', is_enabled
          )
          order by display_order, label
        )
        from attribute_combined
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
            'isOverride', is_override
          )
          order by sort_order, label
        )
        from feature_combined
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
            'isOverride', is_override
          )
          order by display_order, label
        )
        from section_combined
      ),
      '[]'::jsonb
    ),
    'overrides', jsonb_build_object(
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
              'isOverride', true,
              'isEnabled', is_enabled
            )
            order by display_order, label
          )
          from attribute_combined
          where is_override
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
              'isOverride', true
            )
            order by sort_order, label
          )
          from feature_combined
          where is_override
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
              'isOverride', true
            )
            order by display_order, label
          )
          from section_combined
          where is_override
        ),
        '[]'::jsonb
      )
    )
  )
  where exists (select 1 from item_role);
$$;

create or replace function public.admin_upsert_catalog_item_attribute_override(
  p_item_id uuid,
  p_attribute_key text,
  p_is_enabled boolean default true,
  p_display_order integer default null,
  p_override_label text default null
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

  if not exists (select 1 from public.catalog_items where id = p_item_id) then
    raise exception 'catalog item not found' using errcode = 'P0002';
  end if;

  if not exists (select 1 from public.attribute_catalog where key = p_attribute_key and is_active = true) then
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
$$;

create or replace function public.admin_delete_catalog_item_attribute_override(
  p_item_id uuid,
  p_attribute_key text
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

  delete from public.catalog_item_attribute_overrides
  where item_id = p_item_id
    and attribute_key = p_attribute_key;
end;
$$;

create or replace function public.admin_upsert_catalog_item_feature_override(
  p_item_id uuid,
  p_feature_key text,
  p_is_enabled boolean default true
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

  if not exists (select 1 from public.catalog_items where id = p_item_id) then
    raise exception 'catalog item not found' using errcode = 'P0002';
  end if;

  if not exists (select 1 from public.feature_catalog where key = p_feature_key and is_active_globally = true) then
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
$$;

create or replace function public.admin_delete_catalog_item_feature_override(
  p_item_id uuid,
  p_feature_key text
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

  delete from public.catalog_item_feature_overrides
  where item_id = p_item_id
    and feature_key = p_feature_key;
end;
$$;

create or replace function public.admin_upsert_catalog_item_section_override(
  p_item_id uuid,
  p_section_key text,
  p_is_visible boolean default true,
  p_display_order integer default null
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

  if not exists (select 1 from public.catalog_items where id = p_item_id) then
    raise exception 'catalog item not found' using errcode = 'P0002';
  end if;

  if not exists (select 1 from public.profile_section_catalog where key = p_section_key and is_active = true) then
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
$$;

create or replace function public.admin_delete_catalog_item_section_override(
  p_item_id uuid,
  p_section_key text
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

  delete from public.catalog_item_section_overrides
  where item_id = p_item_id
    and section_key = p_section_key;
end;
$$;

revoke all on function public.admin_upsert_catalog_item_attribute_override(uuid, text, boolean, integer, text) from public;
revoke all on function public.admin_delete_catalog_item_attribute_override(uuid, text) from public;
revoke all on function public.admin_upsert_catalog_item_feature_override(uuid, text, boolean) from public;
revoke all on function public.admin_delete_catalog_item_feature_override(uuid, text) from public;
revoke all on function public.admin_upsert_catalog_item_section_override(uuid, text, boolean, integer) from public;
revoke all on function public.admin_delete_catalog_item_section_override(uuid, text) from public;

grant execute on function public.admin_upsert_catalog_item_attribute_override(uuid, text, boolean, integer, text) to authenticated;
grant execute on function public.admin_delete_catalog_item_attribute_override(uuid, text) to authenticated;
grant execute on function public.admin_upsert_catalog_item_feature_override(uuid, text, boolean) to authenticated;
grant execute on function public.admin_delete_catalog_item_feature_override(uuid, text) to authenticated;
grant execute on function public.admin_upsert_catalog_item_section_override(uuid, text, boolean, integer) to authenticated;
grant execute on function public.admin_delete_catalog_item_section_override(uuid, text) to authenticated;

commit;
