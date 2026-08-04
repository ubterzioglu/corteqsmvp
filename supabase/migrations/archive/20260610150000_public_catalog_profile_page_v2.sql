-- Public Catalog Profile Page V2
--
-- Single public-safe RPC that powers /directory/catalog/:slug end to end:
--   get_catalog_item_public_page_v2(p_slug text) -> jsonb (camelCase keys)
--
-- Replaces the page's previous two-call flow (get_catalog_item_public_profile +
-- get_catalog_item_profile). Both old RPCs are kept untouched for backwards
-- compatibility.
--
-- Security contract (whitelist only):
--   * only published + public + not-deleted items; otherwise returns NULL
--     (no existence leak: missing, private and unpublished all return NULL)
--   * sections resolved via primary flat role -> role_sections -> afs_sections,
--     only is_enabled + public visibility, ordered by sort_order
--   * attribute values: storage_strategy <> 'private_storage', role rule
--     is_public, effective visibility 'public', approval_status 'approved'
--   * contacts/links/services/media: is_public = true only
--   * media: document type rows are never returned
--   * no raw row dumps — every field is explicitly selected
--
-- Idempotent (create or replace). Additive only.

begin;

create or replace function public.get_catalog_item_public_page_v2(p_slug text)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_item public.catalog_items%rowtype;
  v_role_id uuid;
  v_role_key text;
  v_role_label text;
  v_avatar_url text;
  v_cover_url text;
  v_country_code text;
  v_country_label text;
  v_city text;
  v_address_line text;
  v_categories jsonb := '[]'::jsonb;
  v_sections jsonb := '[]'::jsonb;
  v_attributes jsonb := '[]'::jsonb;
  v_contacts jsonb := '[]'::jsonb;
  v_links jsonb := '[]'::jsonb;
  v_services jsonb := '[]'::jsonb;
  v_languages jsonb := '[]'::jsonb;
  v_media jsonb := '[]'::jsonb;
begin
  if p_slug is null or btrim(p_slug) = '' then
    return null;
  end if;

  select * into v_item
  from public.catalog_items ci
  where ci.slug = p_slug
    and ci.status = 'published'
    and ci.visibility = 'public'
    and ci.deleted_at is null
  limit 1;

  if v_item.id is null then
    return null;
  end if;

  -- Primary flat role; fallback to platform_role_key for legacy rows.
  select r.id, r.key, r.label
    into v_role_id, v_role_key, v_role_label
  from public.catalog_item_roles cir
  join public.roles r on r.id = cir.role_id
  where cir.catalog_item_id = v_item.id
    and cir.is_primary
    and r.is_active = true
    and r.deleted_at is null
  limit 1;

  if v_role_id is null and v_item.platform_role_key is not null then
    select r.id, r.key, r.label
      into v_role_id, v_role_key, v_role_label
    from public.roles r
    where r.key = v_item.platform_role_key
      and r.is_active = true
      and r.deleted_at is null
    limit 1;
  end if;

  -- Primary location + country label from geo_countries (no hardcoded dictionary).
  select cil.country_code, cil.city, cil.address_line
    into v_country_code, v_city, v_address_line
  from public.catalog_item_locations cil
  where cil.item_id = v_item.id
  order by cil.is_primary desc, cil.created_at asc
  limit 1;

  v_country_code := coalesce(v_country_code, v_item.country_code);
  v_city := coalesce(v_city, v_item.city);

  if v_country_code is not null then
    select gc.name into v_country_label
    from public.geo_countries gc
    where upper(gc.code) = upper(v_country_code)
      and gc.is_active = true
    limit 1;
  end if;

  -- Avatar: primary public logo/image media -> profile_photo_url/avatar_url attribute.
  select cim.url into v_avatar_url
  from public.catalog_item_media cim
  where cim.item_id = v_item.id
    and cim.is_public = true
    and cim.media_type in ('logo', 'image')
    and cim.url is not null
  order by (cim.media_type = 'logo') desc, cim.is_primary desc, cim.sort_order asc, cim.created_at asc
  limit 1;

  if v_avatar_url is null then
    select v.value_text into v_avatar_url
    from public.catalog_item_attribute_values v
    join public.afs_attributes a on a.id = v.attribute_id
    where v.item_id = v_item.id
      and a.key in ('profile_photo_url', 'avatar_url')
      and a.storage_strategy <> 'private_storage'
      and coalesce(nullif(v.visibility_override, ''), v.visibility) = 'public'
      and coalesce(v.approval_status, 'approved') = 'approved'
      and v.value_text is not null
      and btrim(v.value_text) <> ''
    order by (a.key = 'profile_photo_url') desc
    limit 1;
  end if;

  select cim.url into v_cover_url
  from public.catalog_item_media cim
  where cim.item_id = v_item.id
    and cim.is_public = true
    and cim.media_type = 'cover'
    and cim.url is not null
  order by cim.is_primary desc, cim.sort_order asc
  limit 1;

  -- Categories.
  select coalesce(jsonb_agg(
    jsonb_build_object('slug', cc.slug, 'name', cc.name, 'isPrimary', cicat.is_primary)
    order by cicat.is_primary desc, cc.name asc
  ), '[]'::jsonb)
  into v_categories
  from public.catalog_item_categories cicat
  join public.catalog_categories cc on cc.id = cicat.category_id and cc.is_active = true
  where cicat.item_id = v_item.id;

  -- Public, approved, non-private attribute values gated by the role rule.
  if v_role_id is not null then
    select coalesce(jsonb_agg(
      jsonb_build_object(
        'key', a.key,
        'label', a.label,
        'dataType', a.data_type,
        'sortOrder', ra.sort_order,
        'valueText', v.value_text,
        'valueJson', v.value_json
      ) order by ra.sort_order, a.label
    ), '[]'::jsonb)
    into v_attributes
    from public.catalog_item_attribute_values v
    join public.afs_attributes a on a.id = v.attribute_id
    join public.role_attributes ra on ra.role_id = v_role_id and ra.attribute_id = a.id
    where v.item_id = v_item.id
      and a.is_active = true
      and a.storage_strategy <> 'private_storage'
      and ra.is_public = true
      and coalesce(nullif(v.visibility_override, ''), v.visibility) = 'public'
      and coalesce(v.approval_status, 'approved') = 'approved'
      and (
        (v.value_text is not null and btrim(v.value_text) <> '')
        or v.value_json is not null
      );
  end if;

  -- Sections: primary role -> role_sections -> afs_sections (enabled + public),
  -- with a whitelisted content payload per component_key. Unknown component keys
  -- still flow through (frontend renders them with the generic fallback).
  if v_role_id is not null then
    select coalesce(jsonb_agg(
      jsonb_build_object(
        'sectionKey', s.key,
        'label', s.label,
        'description', s.description,
        'sectionArea', s.section_area,
        'componentKey', s.component_key,
        'sortOrder', rs.sort_order,
        'content',
          case s.component_key
            when 'rich_text' then jsonb_build_object(
              'text', coalesce(v_item.long_description, v_item.short_description)
            )
            when 'badges' then jsonb_build_object(
              'badges', coalesce((
                select jsonb_agg(cc.name order by cicat.is_primary desc, cc.name)
                from public.catalog_item_categories cicat
                join public.catalog_categories cc on cc.id = cicat.category_id and cc.is_active = true
                where cicat.item_id = v_item.id
              ), '[]'::jsonb)
            )
            when 'links' then jsonb_build_object(
              'links', coalesce((
                select jsonb_agg(
                  jsonb_build_object('type', l.link_type, 'label', l.label, 'url', l.url)
                  order by l.sort_order, l.created_at
                )
                from public.catalog_item_links l
                where l.item_id = v_item.id and l.is_public = true
              ), '[]'::jsonb)
            )
            when 'title' then jsonb_build_object('text', v_item.title)
            when 'location' then jsonb_build_object(
              'city', v_city, 'countryCode', v_country_code, 'countryLabel', v_country_label
            )
            when 'image' then jsonb_build_object('url', v_avatar_url)
            else '{}'::jsonb
          end
      ) order by rs.sort_order, s.key
    ), '[]'::jsonb)
    into v_sections
    from public.role_sections rs
    join public.afs_sections s on s.id = rs.section_id
    where rs.role_id = v_role_id
      and rs.is_enabled = true
      and coalesce(rs.visibility, 'public') = 'public'
      and coalesce(s.default_visibility, 'public') = 'public'
      and s.is_active = true;
  end if;

  -- Contacts (public rows only).
  select coalesce(jsonb_agg(
    jsonb_build_object(
      'type', cic.contact_type,
      'value', cic.contact_value,
      'label', cic.label,
      'isPrimary', cic.is_primary
    ) order by cic.is_primary desc, cic.sort_order asc, cic.created_at asc
  ), '[]'::jsonb)
  into v_contacts
  from public.catalog_item_contacts cic
  where cic.item_id = v_item.id
    and cic.is_public = true;

  -- Links (public rows only).
  select coalesce(jsonb_agg(
    jsonb_build_object(
      'type', l.link_type,
      'label', l.label,
      'url', l.url,
      'isPrimary', false
    ) order by l.sort_order asc, l.created_at asc
  ), '[]'::jsonb)
  into v_links
  from public.catalog_item_links l
  where l.item_id = v_item.id
    and l.is_public = true;

  -- Services (public rows only).
  select coalesce(jsonb_agg(
    jsonb_build_object('name', cis.service_name, 'description', cis.description)
    order by cis.sort_order asc, cis.created_at asc
  ), '[]'::jsonb)
  into v_services
  from public.catalog_item_services cis
  where cis.item_id = v_item.id
    and cis.is_public = true;

  -- Languages.
  select coalesce(jsonb_agg(
    jsonb_build_object('code', cl.language_code, 'proficiency', cl.proficiency)
    order by cl.is_primary desc, cl.created_at asc
  ), '[]'::jsonb)
  into v_languages
  from public.catalog_item_languages cl
  where cl.item_id = v_item.id;

  -- Media (public, never documents).
  select coalesce(jsonb_agg(
    jsonb_build_object(
      'type', cim.media_type,
      'url', cim.url,
      'altText', cim.alt_text,
      'isPrimary', cim.is_primary
    ) order by cim.is_primary desc, cim.sort_order asc, cim.created_at asc
  ), '[]'::jsonb)
  into v_media
  from public.catalog_item_media cim
  where cim.item_id = v_item.id
    and cim.is_public = true
    and cim.media_type <> 'document'
    and cim.url is not null;

  return jsonb_build_object(
    'item', jsonb_build_object(
      'id', v_item.id,
      'slug', v_item.slug,
      'title', v_item.title,
      'itemType', v_item.item_type,
      'roleKey', v_role_key,
      'roleLabel', coalesce(v_role_label, v_item.item_type),
      'headline', v_item.headline,
      'shortDescription', v_item.short_description,
      'longDescription', v_item.long_description,
      'avatarUrl', v_avatar_url,
      'coverImageUrl', v_cover_url,
      'verificationStatus', v_item.verification_status,
      'isVerified', coalesce(v_item.is_verified, false),
      'isClaimable', coalesce(v_item.verification_status, '') <> 'claimed',
      'city', v_city,
      'countryCode', v_country_code,
      'countryLabel', v_country_label,
      'addressLine', v_address_line,
      'categories', v_categories
    ),
    'sections', v_sections,
    'attributes', v_attributes,
    'contacts', v_contacts,
    'links', v_links,
    'services', v_services,
    'languages', v_languages,
    'media', v_media,
    'claim', jsonb_build_object(
      'canClaim', coalesce(v_item.verification_status, '') <> 'claimed',
      'verificationStatus', v_item.verification_status
    )
  );
end;
$$;

revoke all on function public.get_catalog_item_public_page_v2(text) from public;
grant execute on function public.get_catalog_item_public_page_v2(text) to anon, authenticated;

comment on function public.get_catalog_item_public_page_v2(text) is
  'Public profile page payload (camelCase, whitelist-only). NULL for private/unpublished/missing items. 2026-06-10.';

commit;
