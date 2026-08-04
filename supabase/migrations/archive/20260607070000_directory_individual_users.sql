-- Extend search_directory_catalog to include individual users from individual_profile_details.
-- Individual profiles with visibility_status = 'open' appear alongside catalog items.

create or replace function public.search_directory_catalog(
  p_search_text text default null,
  p_role_key text default null,
  p_country_code text default null,
  p_city text default null,
  p_featured_only boolean default false
)
returns table (
  item_id uuid,
  item_type text,
  slug text,
  title text,
  role_key text,
  role_label text,
  description text,
  city text,
  country text,
  image_url text,
  special_label text,
  special_value text,
  is_featured boolean,
  is_verified boolean,
  is_claimable boolean
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_search_text text := nullif(btrim(coalesce(p_search_text, '')), '');
  v_role_key text := nullif(btrim(coalesce(p_role_key, '')), '');
  v_country_code text := upper(nullif(btrim(coalesce(p_country_code, '')), ''));
  v_city text := nullif(btrim(coalesce(p_city, '')), '');
begin
  if v_user_id is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;

  return query
  -- Branch 1: catalog items
  with primary_locations as (
    select distinct on (cil.item_id)
      cil.item_id,
      cil.city,
      cil.country_code
    from public.catalog_item_locations cil
    order by cil.item_id, cil.is_primary desc, cil.created_at asc
  ),
  primary_media as (
    select distinct on (cim.item_id)
      cim.item_id,
      coalesce(cim.thumbnail_url, cim.url) as image_url
    from public.catalog_item_media cim
    where cim.is_public = true
    order by cim.item_id, cim.is_primary desc, cim.created_at asc
  ),
  claim_status as (
    select
      ccr.item_id,
      bool_or(ccr.status = 'pending') as has_pending_claim
    from public.catalog_claim_requests ccr
    group by ccr.item_id
  )
  select
    ci.id as item_id,
    ci.item_type,
    ci.slug,
    ci.title,
    coalesce(ci.platform_role_key, r.key, ci.item_type) as role_key,
    coalesce(r.label, ci.platform_role_key, ci.item_type) as role_label,
    coalesce(ci.short_description, ci.headline, left(ci.long_description, 220)) as description,
    pl.city,
    pl.country_code as country,
    pm.image_url,
    case
      when coalesce(ci.attributes ->> 'specialty_summary', '') <> '' then 'Uzmanlık / Kategori'
      when coalesce(ci.headline, '') <> '' then 'Başlık'
      else null
    end as special_label,
    nullif(coalesce(ci.attributes ->> 'specialty_summary', ci.headline), '') as special_value,
    coalesce((ci.attributes ->> 'is_featured')::boolean, false) as is_featured,
    (ci.verification_status in ('verified', 'official_source', 'claimed')) as is_verified,
    (
      ci.verification_status <> 'claimed'
      and not coalesce(cs.has_pending_claim, false)
    ) as is_claimable
  from public.catalog_items ci
  left join public.roles r
    on r.key = ci.platform_role_key
  left join primary_locations pl
    on pl.item_id = ci.id
  left join primary_media pm
    on pm.item_id = ci.id
  left join claim_status cs
    on cs.item_id = ci.id
  where ci.status = 'published'
    and ci.visibility in ('public', 'unlisted')
    and coalesce(r.is_directory_visible, true)
    and (v_role_key is null or ci.platform_role_key = v_role_key)
    and (v_country_code is null or upper(coalesce(pl.country_code, '')) = v_country_code)
    and (v_city is null or lower(coalesce(pl.city, '')) = lower(v_city))
    and (
      not p_featured_only
      or coalesce((ci.attributes ->> 'is_featured')::boolean, false)
    )
    and (
      v_search_text is null
      or ci.title ilike '%' || v_search_text || '%'
      or coalesce(ci.headline, '') ilike '%' || v_search_text || '%'
      or coalesce(ci.short_description, '') ilike '%' || v_search_text || '%'
      or coalesce(ci.long_description, '') ilike '%' || v_search_text || '%'
      or coalesce(pl.city, '') ilike '%' || v_search_text || '%'
      or coalesce(pl.country_code, '') ilike '%' || v_search_text || '%'
      or coalesce(ci.platform_role_key, '') ilike '%' || v_search_text || '%'
    )

  union all

  -- Branch 2: individual users (AFS system via individual_profile_details view)
  select
    ipd.user_id as item_id,
    'member' as item_type,
    ipd.user_id::text as slug,
    coalesce(p.display_name, 'CorteQS Üyesi') as title,
    'bireysel' as role_key,
    'Bireysel Kullanıcı' as role_label,
    ipd.tagline as description,
    ipd.active_city as city,
    gc.code as country,
    (ipd.front_card ->> 'profile_image_url') as image_url,
    null::text as special_label,
    null::text as special_value,
    false as is_featured,
    false as is_verified,
    false as is_claimable
  from public.individual_profile_details ipd
  left join public.profiles p on p.id = ipd.user_id
  left join public.geo_countries gc
    on gc.is_active = true
    and (
      gc.name = ipd.active_country
      or gc.code = upper(ipd.active_country)
    )
  where ipd.visibility_status = 'open'
    and not p_featured_only
    and (v_role_key is null or v_role_key = 'bireysel')
    and (v_country_code is null or upper(coalesce(gc.code, '')) = v_country_code)
    and (v_city is null or lower(coalesce(ipd.active_city, '')) = lower(v_city))
    and (
      v_search_text is null
      or coalesce(p.display_name, '') ilike '%' || v_search_text || '%'
      or coalesce(ipd.tagline, '') ilike '%' || v_search_text || '%'
      or coalesce(ipd.active_city, '') ilike '%' || v_search_text || '%'
      or coalesce(ipd.active_country, '') ilike '%' || v_search_text || '%'
    )

  order by
    is_featured desc,
    is_verified desc,
    title asc;
end;
$$;
