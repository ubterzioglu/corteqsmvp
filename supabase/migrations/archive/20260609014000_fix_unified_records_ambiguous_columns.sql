begin;

-- The RETURNS TABLE columns (kind, item_type, status, verification_status,
-- platform_role_key, ...) are in scope as PL/pgSQL variables throughout the
-- body. In the `filtered` CTE the WHERE clause referenced them unqualified
-- (e.g. `kind = v_kind`), so PostgreSQL could not tell whether `kind` meant
-- the CTE column or the same-named OUT parameter:
--   ERROR: 42702 column reference "kind" is ambiguous
-- PostgREST surfaced this as HTTP 400 on /rpc/admin_list_unified_records,
-- breaking /admin/data and /admin/new-member/roles-overview.
--
-- Fix: declare `#variable_conflict use_column` so PL/pgSQL resolves ambiguous
-- bare names to the query column (defense-in-depth), AND qualify the filter
-- predicates with the source CTE alias `catalog_rows.` so intent is explicit.
--
-- A second latent bug was masked by the ambiguity error: auth.users.email is
-- varchar(255) but the RETURNS TABLE declares `email text`, which raised
--   ERROR: 42804 structure of query does not match function result type
--   (Returned type character varying(255) does not match expected type text)
-- once the query actually executed. Cast member_email.email to text.
--
-- Function signature and returned shape are unchanged.

create or replace function public.admin_list_unified_records(
  p_page integer default 1,
  p_page_size integer default 50,
  p_kind text default null,
  p_query text default null,
  p_item_type text default null,
  p_status text default null,
  p_verification_status text default null,
  p_city text default null,
  p_country_code text default null,
  p_platform_role_key text default null
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
#variable_conflict use_column
declare
  v_actor_id uuid := auth.uid();
  v_page_size integer := greatest(least(coalesce(p_page_size, 50), 100), 1);
  v_offset integer := (greatest(coalesce(p_page, 1), 1) - 1) * greatest(least(coalesce(p_page_size, 50), 100), 1);
  v_query text := nullif(btrim(coalesce(p_query, '')), '');
  v_kind text := nullif(btrim(coalesce(p_kind, '')), '');
  v_item_type text := nullif(btrim(coalesce(p_item_type, '')), '');
  v_status text := nullif(btrim(coalesce(p_status, '')), '');
  v_verification_status text := nullif(btrim(coalesce(p_verification_status, '')), '');
  v_city text := nullif(btrim(coalesce(p_city, '')), '');
  v_country_code text := nullif(btrim(coalesce(p_country_code, '')), '');
  v_platform_role_key text := nullif(btrim(coalesce(p_platform_role_key, '')), '');
begin
  if v_actor_id is null or not public.is_moderator(v_actor_id) then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  return query
  with catalog_rows as (
    select
      ci.id,
      case when ci.linked_user_id is not null then 'member_profile' else 'catalog_item' end::text as kind,
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
      ci.platform_role_key as profile_type,
      member_email.email::text as email,
      concat_ws(
        ' ',
        ci.title,
        ci.slug,
        ci.headline,
        ci.short_description,
        ci.platform_role_key,
        primary_location.city,
        primary_location.country_code,
        array_to_string(coalesce(category_names.category_labels, '{}'::text[]), ' '),
        array_to_string(coalesce(source_names.source_types, '{}'::text[]), ' '),
        member_email.email
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
    left join lateral (
      select au.email
      from auth.users au
      where au.id = ci.linked_user_id
      limit 1
    ) member_email on true
  ),
  filtered as (
    select catalog_rows.*
    from catalog_rows
    where (v_kind is null or catalog_rows.kind = v_kind)
      and (v_item_type is null or catalog_rows.item_type = v_item_type)
      and (v_status is null or catalog_rows.status = v_status)
      and (v_verification_status is null or catalog_rows.verification_status = v_verification_status)
      and (v_city is null or lower(coalesce(catalog_rows.primary_city, '')) = lower(v_city))
      and (v_country_code is null or lower(coalesce(catalog_rows.primary_country_code, '')) = lower(v_country_code))
      and (v_platform_role_key is null or catalog_rows.platform_role_key = v_platform_role_key)
      and (
        v_query is null
        or catalog_rows.search_text ilike '%' || v_query || '%'
      )
  ),
  paged as (
    select
      filtered.*,
      count(*) over() as total_count
    from filtered
    order by filtered.created_at desc, filtered.title asc
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

revoke all on function public.admin_list_unified_records(integer, integer, text, text, text, text, text, text, text, text) from public;
grant execute on function public.admin_list_unified_records(integer, integer, text, text, text, text, text, text, text, text) to authenticated;

commit;
