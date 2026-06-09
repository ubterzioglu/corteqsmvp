-- Catalog/Flat-Role/AFS Rebuild — Migration 010: public/owner/admin RPCs
--
-- New whitelist RPCs per design §6. These return ONLY allowed columns (no
-- select *), never leak requester_email / claim details / manager list /
-- admin notes / referral_code / phone_verified / private docs.
--
-- These supplement (do not yet replace) existing RPCs; the existing catalog RPCs
-- are rewired/dropped in Phase 4 / migration 016.
-- Idempotent (create or replace).

begin;

-- get_flat_roles(): the 76 active flat roles for selection UIs.
create or replace function public.get_flat_roles()
returns table (key text, label text, description text, sort_order integer)
language sql
stable
security definer
set search_path = public
as $$
  select r.key, r.label, r.description, r.sort_order
  from public.roles r
  where r.is_active = true
    and r.deleted_at is null
  order by r.sort_order nulls last, r.label;
$$;

-- get_role_form_schema(role_key): explicit attributes + features + sections for a role.
create or replace function public.get_role_form_schema(p_role_key text)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_role_id uuid;
  v_result jsonb;
begin
  select id into v_role_id from public.roles
   where key = p_role_key and is_active = true and deleted_at is null;
  if v_role_id is null then
    return jsonb_build_object('error', 'role_not_found');
  end if;

  select jsonb_build_object(
    'role_key', p_role_key,
    'attributes', coalesce((
      select jsonb_agg(jsonb_build_object(
        'key', a.key, 'label', a.label, 'data_type', a.data_type,
        'is_required', ra.is_required, 'is_public', ra.is_public,
        'owner_can_edit', ra.owner_can_edit, 'sort_order', ra.sort_order
      ) order by ra.sort_order)
      from public.role_attributes ra
      join public.afs_attributes a on a.id = ra.attribute_id
      where ra.role_id = v_role_id
    ), '[]'::jsonb),
    'features', coalesce((
      select jsonb_agg(jsonb_build_object('key', rf.feature_key, 'is_enabled', rf.is_enabled))
      from public.role_features rf
      where rf.role_id = v_role_id and rf.is_enabled = true
    ), '[]'::jsonb),
    'sections', coalesce((
      select jsonb_agg(jsonb_build_object(
        'key', s.key, 'label', s.label, 'section_area', s.section_area,
        'component_key', s.component_key, 'sort_order', rs.sort_order
      ) order by rs.sort_order)
      from public.role_sections rs
      join public.afs_sections s on s.id = rs.section_id
      where rs.role_id = v_role_id and rs.is_enabled = true
    ), '[]'::jsonb)
  ) into v_result;

  return v_result;
end;
$$;

-- get_public_catalog_item_profile(slug): whitelist public view of an item.
create or replace function public.get_public_catalog_item_profile(p_slug text)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_item public.catalog_items%rowtype;
  v_result jsonb;
begin
  select * into v_item from public.catalog_items
   where slug = p_slug and status = 'published' and visibility = 'public' and deleted_at is null;
  if v_item.id is null then
    return null;
  end if;

  select jsonb_build_object(
    'slug', v_item.slug,
    'display_name', v_item.display_name,
    'short_description', v_item.short_description,
    'country_code', v_item.country_code,
    'city', v_item.city,
    'is_verified', v_item.is_verified,
    'is_placeholder', v_item.is_placeholder,
    'primary_role', (
      select jsonb_build_object('key', r.key, 'label', r.label)
      from public.catalog_item_roles cir
      join public.roles r on r.id = cir.role_id
      where cir.catalog_item_id = v_item.id and cir.is_primary
      limit 1
    ),
    'public_attributes', coalesce((
      select jsonb_object_agg(a.key, v.value_text)
      from public.catalog_item_attribute_values v
      join public.afs_attributes a on a.id = v.attribute_id
      join public.catalog_item_roles cir on cir.catalog_item_id = v_item.id and cir.is_primary
      join public.role_attributes ra on ra.role_id = cir.role_id and ra.attribute_id = a.id
      where v.item_id = v_item.id and ra.is_public = true
    ), '{}'::jsonb)
  ) into v_result;

  return v_result;
end;
$$;

grant execute on function public.get_flat_roles() to anon, authenticated;
grant execute on function public.get_role_form_schema(text) to anon, authenticated;
grant execute on function public.get_public_catalog_item_profile(text) to anon, authenticated;

comment on function public.get_flat_roles() is 'Rebuild 2026-06-09: 76 active flat roles for selection.';
comment on function public.get_role_form_schema(text) is 'Rebuild 2026-06-09: explicit AFS schema for a role (no inheritance).';
comment on function public.get_public_catalog_item_profile(text) is 'Rebuild 2026-06-09: whitelist public item profile. No sensitive fields.';

commit;
