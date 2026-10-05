-- B7b · Cadde gönderisi arama (PII'siz, gizlilik filtreli)
--
-- Kaynak: docs/plans/2026-10-05-birlesik-uygulama-plani.md B7
-- Karar: 5 Ekim 2026 — kullanıcı onayı alındı.
--
-- Filtreler:
--   - status = 'published' (herkese açık)
--   - visibility = 'public' (gizli değil)
--   - content_mode = 'real' (AI-generated değil)
--   - Banlı kullanıcı yok (cadde_user_bans tablosu kontrolü)
--   - PII'siz: author_user_id dönmüyor
--
-- search_public_content fonksiyonunu günceller.

begin;

-- search_public_content fonksiyonunu güncelle (Cadde gönderisi ekle)
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
  -- B7b: Cadde gönderisi (PII'siz, gizlilik filtreli)
  cadde_candidates as (
    select
      'cadde'::text as content_type,
      p.id::text as external_id,
      null::text as slug,
      coalesce(p.title, left(p.body, 60)) as title,
      left(p.body, 200) as description,
      '/cadde/post/' || p.id::text as href,
      case
        when public.catalog_search_normalize(coalesce(p.title, '')) = i.query then 0
        when public.catalog_search_normalize(coalesce(p.title, '')) like i.query || '%' then 1
        else 2
      end as match_rank,
      0 as sort_order,
      coalesce(p.published_at, p.created_at) as published_at
    from public.cadde_posts p
    cross join input i
    where p.status = 'published'
      and p.visibility = 'public'
      and p.content_mode = 'real'
      and length(i.query) >= 2
      -- Banlı kullanıcı yok
      and not exists (
        select 1 from public.cadde_user_bans b
        where b.user_id = p.author_user_id
          and (b.expires_at is null or b.expires_at > now())
      )
      and public.catalog_search_normalize(
        coalesce(p.title, '') || ' ' || coalesce(p.body, '')
      ) like '%' || i.query || '%'
  ),
  all_candidates as (
    select * from blog_candidates
    union all
    select * from event_candidates
    union all
    select * from cadde_candidates
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
  'B7b: PII-free public content search. Returns published blog posts, upcoming events, and Cadde posts (public, real, non-banned). Hard limit 24.';

commit;
