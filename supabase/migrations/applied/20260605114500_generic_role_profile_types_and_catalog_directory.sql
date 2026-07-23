begin;

update public.profiles p
set profile_type = 'bireysel'
where profile_type is null
   or not exists (select 1 from public.roles r where r.key = p.profile_type);

update public.user_profiles up
set profile_type = 'bireysel'
where profile_type is null
   or not exists (select 1 from public.roles r where r.key = up.profile_type);

alter table public.profiles
  drop constraint if exists profiles_profile_type_check;

alter table public.user_profiles
  drop constraint if exists user_profiles_profile_type_check;

alter table public.profiles
  drop constraint if exists profiles_profile_type_role_key_fkey;

alter table public.user_profiles
  drop constraint if exists user_profiles_profile_type_role_key_fkey;

alter table public.profiles
  add constraint profiles_profile_type_role_key_fkey
  foreign key (profile_type)
  references public.roles(key)
  on update cascade
  on delete restrict
  not valid;

alter table public.user_profiles
  add constraint user_profiles_profile_type_role_key_fkey
  foreign key (profile_type)
  references public.roles(key)
  on update cascade
  on delete restrict
  not valid;

alter table public.profiles validate constraint profiles_profile_type_role_key_fkey;
alter table public.user_profiles validate constraint user_profiles_profile_type_role_key_fkey;

create or replace function public.admin_set_user_profile_type(
  target_user_id uuid,
  next_profile_type text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  if not exists (
    select 1 from public.roles r
    where r.key = next_profile_type and r.is_active = true
  ) then
    raise exception 'invalid profile type' using errcode = '22023';
  end if;

  update public.user_profiles
  set profile_type = next_profile_type,
      updated_at = now()
  where user_id = target_user_id;
end;
$$;

grant execute on function public.admin_set_user_profile_type(uuid, text) to authenticated;

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
      coalesce(csd.filter_data, '{}'::jsonb) ||
        jsonb_strip_nulls(
          jsonb_build_object(
            'platform_role_key', ci.attributes ->> 'platform_role_key',
            'platform_role_label', ci.attributes ->> 'platform_role_label',
            'specialty_summary', ci.attributes ->> 'specialty_summary'
          )
        ) as filter_data,
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
  'Deterministic unified catalog search RPC for public search UIs and AI assistants. Returns safe public fields plus catalog role metadata.';

commit;
