begin;

create or replace function public.search_catalog(
  search_query text,
  item_types text[] default null,
  category_slugs text[] default null,
  city_filter text default null,
  country_filter text default null,
  language_filters text[] default null,
  verified_only boolean default false,
  limit_count integer default 20,
  offset_count integer default 0
)
returns table (
  item_id uuid,
  item_type text,
  slug text,
  title text,
  headline text,
  short_description text,
  city text,
  country_code text,
  verification_status text,
  category_slugs text[],
  language_codes text[],
  thumbnail_url text,
  score numeric,
  filter_data jsonb
)
language sql
security definer
set search_path = public
as $$
  with normalized as (
    select
      nullif(btrim(search_query), '') as raw_query,
      public.catalog_search_normalize(search_query) as normalized_query,
      greatest(1, least(coalesce(limit_count, 20), 100)) as safe_limit,
      greatest(0, coalesce(offset_count, 0)) as safe_offset
  ),
  base as (
    select
      csd.item_id,
      ci.item_type,
      ci.slug,
      ci.title,
      ci.headline,
      ci.short_description,
      csd.city,
      csd.country_code,
      ci.verification_status,
      csd.category_slugs,
      csd.language_codes,
      coalesce(csd.filter_data ->> 'thumbnail_url', '') as thumbnail_url,
      csd.filter_data,
      n.raw_query,
      n.normalized_query,
      case
        when n.raw_query is null then 0::numeric
        else (
          case
            when public.catalog_search_normalize(ci.title) = n.normalized_query then 100
            else 0
          end
          + (
            coalesce(
              ts_rank_cd(
                csd.search_vector,
                websearch_to_tsquery('simple', n.normalized_query)
              ),
              0
            ) * 10
          )
          + greatest(
            similarity(public.catalog_search_normalize(ci.title), n.normalized_query),
            similarity(public.catalog_search_normalize(csd.search_text), n.normalized_query)
          )
          + case
              when ci.verification_status in ('verified', 'official_source') then 0.25
              else 0
            end
        )::numeric
      end as score
    from public.catalog_search_documents csd
    join public.catalog_items ci on ci.id = csd.item_id
    cross join normalized n
    left join public.person_profile_details ppd on ppd.item_id = ci.id
    where ci.status = 'published'
      and ci.visibility = 'public'
      and (
        ci.item_type <> 'person_profile'
        or coalesce(ppd.directory_opt_in, false) = true
      )
      and (
        item_types is null
        or cardinality(item_types) = 0
        or ci.item_type = any (item_types)
      )
      and (
        category_slugs is null
        or cardinality(category_slugs) = 0
        or csd.category_slugs && category_slugs
      )
      and (
        language_filters is null
        or cardinality(language_filters) = 0
        or csd.language_codes && language_filters
      )
      and (
        city_filter is null
        or lower(coalesce(csd.city, '')) = lower(city_filter)
      )
      and (
        country_filter is null
        or lower(coalesce(csd.country_code, '')) = lower(country_filter)
      )
      and (
        not verified_only
        or ci.verification_status in ('verified', 'official_source')
      )
      and (
        coalesce((csd.filter_data ->> 'expires_at')::timestamptz, 'infinity'::timestamptz) >= now()
      )
      and (
        n.raw_query is null
        or csd.search_vector @@ websearch_to_tsquery('simple', n.normalized_query)
        or similarity(public.catalog_search_normalize(ci.title), n.normalized_query) >= 0.20
        or similarity(public.catalog_search_normalize(csd.search_text), n.normalized_query) >= 0.12
      )
  )
  select
    b.item_id,
    b.item_type,
    b.slug,
    b.title,
    b.headline,
    b.short_description,
    b.city,
    b.country_code,
    b.verification_status,
    b.category_slugs,
    b.language_codes,
    nullif(b.thumbnail_url, '') as thumbnail_url,
    b.score,
    b.filter_data
  from base b
  order by
    case
      when b.raw_query is not null and public.catalog_search_normalize(b.title) = b.normalized_query then 1
      else 0
    end desc,
    case
      when b.verification_status in ('verified', 'official_source') then 1
      else 0
    end desc,
    b.score desc,
    b.title asc,
    b.item_id asc
  limit (select safe_limit from normalized)
  offset (select safe_offset from normalized);
$$;

revoke all on function public.search_catalog(text, text[], text[], text, text, text[], boolean, integer, integer) from public;
grant execute on function public.search_catalog(text, text[], text[], text, text, text[], boolean, integer, integer) to anon, authenticated;

comment on function public.search_catalog(text, text[], text[], text, text, text[], boolean, integer, integer) is
  'Deterministic unified catalog search RPC for public search UIs and AI assistants. Returns safe public fields only.';

commit;
