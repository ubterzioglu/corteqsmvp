begin;

create or replace function public.admin_list_unified_records(
  p_page integer default 1,
  p_page_size integer default 50,
  p_kind text default null,
  p_query text default null,
  p_item_type text default null,
  p_status text default null,
  p_verification_status text default null,
  p_city text default null,
  p_country_code text default null
)
returns table (
  id uuid,
  kind text,
  slug text,
  item_type text,
  title text,
  summary text,
  status text,
  visibility text,
  verification_status text,
  platform_role_key text,
  primary_city text,
  primary_country_code text,
  category_labels text[],
  source_types text[],
  created_at timestamptz,
  updated_at timestamptz,
  profile_type text,
  email text,
  total_count bigint
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_actor_id uuid := auth.uid();
  v_page integer := greatest(coalesce(p_page, 1), 1);
  v_page_size integer := greatest(least(coalesce(p_page_size, 50), 100), 1);
  v_offset integer := (greatest(coalesce(p_page, 1), 1) - 1) * greatest(least(coalesce(p_page_size, 50), 100), 1);
  v_query text := nullif(btrim(coalesce(p_query, '')), '');
  v_kind text := nullif(btrim(coalesce(p_kind, '')), '');
  v_item_type text := nullif(btrim(coalesce(p_item_type, '')), '');
  v_status text := nullif(btrim(coalesce(p_status, '')), '');
  v_verification_status text := nullif(btrim(coalesce(p_verification_status, '')), '');
  v_city text := nullif(btrim(coalesce(p_city, '')), '');
  v_country_code text := nullif(btrim(coalesce(p_country_code, '')), '');
begin
  if v_actor_id is null or not public.is_moderator(v_actor_id) then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  return query
  with catalog_rows as (
    select
      ci.id,
      'catalog_item'::text as kind,
      ci.slug,
      ci.item_type,
      ci.title,
      coalesce(ci.short_description, ci.headline, left(ci.long_description, 240)) as summary,
      ci.status,
      ci.visibility,
      ci.verification_status,
      ci.platform_role_key,
      primary_location.city as primary_city,
      primary_location.country_code as primary_country_code,
      coalesce(category_names.category_labels, '{}'::text[]) as category_labels,
      coalesce(source_names.source_types, '{}'::text[]) as source_types,
      ci.created_at,
      ci.updated_at,
      null::text as profile_type,
      null::text as email,
      concat_ws(
        ' ',
        ci.title,
        ci.slug,
        ci.headline,
        ci.short_description,
        primary_location.city,
        primary_location.country_code,
        array_to_string(coalesce(category_names.category_labels, '{}'::text[]), ' '),
        array_to_string(coalesce(source_names.source_types, '{}'::text[]), ' ')
      ) as search_text
    from public.catalog_items ci
    left join lateral (
      select cil.city, cil.country_code
      from public.catalog_item_locations cil
      where cil.item_id = ci.id
      order by cil.is_primary desc, cil.created_at asc
      limit 1
    ) primary_location on true
    left join lateral (
      select array_agg(cc.name order by cic.is_primary desc, cc.name asc) as category_labels
      from public.catalog_item_categories cic
      join public.catalog_categories cc on cc.id = cic.category_id
      where cic.item_id = ci.id
    ) category_names on true
    left join lateral (
      select array_agg(distinct sr.source_type order by sr.source_type) as source_types
      from public.source_records sr
      where sr.item_id = ci.id
    ) source_names on true
  ),
  profile_rows as (
    select
      p.id,
      'profile'::text as kind,
      null::text as slug,
      null::text as item_type,
      coalesce(nullif(p.display_name, ''), nullif(p.full_name, ''), split_part(coalesce(p.email, 'corteqs-uye'), '@', 1)) as title,
      p.email as summary,
      case when p.directory_opt_in then 'directory_opted_in' else 'private' end as status,
      null::text as visibility,
      null::text as verification_status,
      p.profile_type as platform_role_key,
      null::text as primary_city,
      p.country_code as primary_country_code,
      '{}'::text[] as category_labels,
      '{}'::text[] as source_types,
      p.created_at,
      p.updated_at,
      p.profile_type,
      p.email,
      concat_ws(
        ' ',
        p.display_name,
        p.full_name,
        p.email,
        p.profile_type,
        p.country_code
      ) as search_text
    from public.profiles p
  ),
  combined as (
    select * from catalog_rows
    union all
    select * from profile_rows
  ),
  filtered as (
    select *
    from combined
    where (v_kind is null or kind = v_kind)
      and (v_item_type is null or item_type = v_item_type)
      and (v_status is null or status = v_status)
      and (v_verification_status is null or verification_status = v_verification_status)
      and (v_city is null or lower(coalesce(primary_city, '')) = lower(v_city))
      and (v_country_code is null or lower(coalesce(primary_country_code, '')) = lower(v_country_code))
      and (
        v_query is null
        or search_text ilike '%' || v_query || '%'
      )
  ),
  paged as (
    select
      filtered.*,
      count(*) over() as total_count
    from filtered
    order by created_at desc, title asc
    offset v_offset
    limit v_page_size
  )
  select
    paged.id,
    paged.kind,
    paged.slug,
    paged.item_type,
    paged.title,
    paged.summary,
    paged.status,
    paged.visibility,
    paged.verification_status,
    paged.platform_role_key,
    paged.primary_city,
    paged.primary_country_code,
    paged.category_labels,
    paged.source_types,
    paged.created_at,
    paged.updated_at,
    paged.profile_type,
    paged.email,
    paged.total_count
  from paged;
end;
$$;

revoke all on function public.admin_list_unified_records(integer, integer, text, text, text, text, text, text, text) from public;
grant execute on function public.admin_list_unified_records(integer, integer, text, text, text, text, text, text, text) to authenticated;

commit;
