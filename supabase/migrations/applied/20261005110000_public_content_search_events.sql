-- A16 · Ana sayfa araması: etkinlik türü ekle
--
-- Kaynak: docs/plans/2026-10-05-plan-8-urun-istegi.md A16
-- search_public_content RPC'sine etkinlik türü eklenir.
-- Yalnız published etkinlikler, event_date >= current_date (gelecekteki etkinlikler).
-- PII-free: user_id, iletişim bilgisi DÖNMEZ.

begin;

-- Etkinlikler için trgm index (published + gelecek etkinlikler)
create index if not exists events_public_search_trgm_idx
  on public.events using gin (
    public.catalog_search_normalize(
      title || ' ' || coalesce(description, '') || ' ' || coalesce(city, '') || ' ' || coalesce(country, '')
    ) gin_trgm_ops
  )
  where status = 'published' and event_date >= current_date;

-- search_public_content RPC'sini genişlet: event türü ekle
create or replace function public.search_public_content(
  p_search_text text,
  p_limit integer default 12
)
returns table (
  content_type text,
  external_id text,
  slug text,
  title text,
  description text,
  href text,
  match_rank integer
)
language sql
stable
security definer
set search_path = public, extensions
as $function$
  with input as (
    select
      nullif(public.catalog_search_normalize(p_search_text), '') as query,
      least(greatest(coalesce(p_limit, 12), 1), 24) as row_limit
  ),
  blog_candidates as (
    select
      'blog'::text as content_type,
      b.id::text as external_id,
      b.slug,
      b.title,
      b.excerpt as description,
      '/blog/' || b.slug as href,
      case
        when public.catalog_search_normalize(b.title) = i.query then 0
        when public.catalog_search_normalize(b.title) like i.query || '%' then 1
        else 2
      end as match_rank,
      b.sort_order,
      b.published_at
    from public.blog_posts b
    cross join input i
    where b.published = true
      and length(i.query) >= 2
      and public.catalog_search_normalize(
        b.title || ' ' || coalesce(b.excerpt, '') || ' ' || coalesce(b.content_markdown, '')
      ) like '%' || i.query || '%'
  ),
  event_candidates as (
    select
      'event'::text as content_type,
      e.id::text as external_id,
      null::text as slug,
      e.title,
      left(e.description, 200) as description,
      '/events/' || e.id::text as href,
      case
        when public.catalog_search_normalize(e.title) = i.query then 0
        when public.catalog_search_normalize(e.title) like i.query || '%' then 1
        else 2
      end as match_rank,
      0 as sort_order,
      e.event_date as published_at
    from public.events e
    cross join input i
    where e.status = 'published'
      and e.event_date >= current_date
      and length(i.query) >= 2
      and public.catalog_search_normalize(
        e.title || ' ' || coalesce(e.description, '') || ' ' || coalesce(e.city, '') || ' ' || coalesce(e.country, '')
      ) like '%' || i.query || '%'
  ),
  all_candidates as (
    select * from blog_candidates
    union all
    select * from event_candidates
  )
  select
    c.content_type,
    c.external_id,
    c.slug,
    c.title,
    c.description,
    c.href,
    c.match_rank
  from all_candidates c
  order by c.match_rank, c.sort_order, c.published_at desc nulls last, c.title
  limit (select row_limit from input);
$function$;

revoke all on function public.search_public_content(text, integer) from public;
grant execute on function public.search_public_content(text, integer)
  to anon, authenticated, service_role;

comment on function public.search_public_content(text, integer) is
  'A16: PII-free public content search. Returns published blog posts and upcoming events (event_date >= today). Hard limit 24.';

commit;
