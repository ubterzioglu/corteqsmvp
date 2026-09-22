-- Public site content search: published blog posts on the /directory surface.
-- B18.2 indexes the existing blog corpus; B18.3 consumes the bounded RPC.
-- The RPC deliberately returns no contact fields or markdown body.

create extension if not exists pg_trgm;

create index if not exists blog_posts_public_search_trgm_idx
  on public.blog_posts using gin (
    public.catalog_search_normalize(
      title || ' ' || coalesce(excerpt, '') || ' ' || coalesce(content_markdown, '')
    ) gin_trgm_ops
  )
  where published = true;

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
  candidates as (
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
  )
  select
    c.content_type,
    c.external_id,
    c.slug,
    c.title,
    c.description,
    c.href,
    c.match_rank
  from candidates c
  order by c.match_rank, c.sort_order, c.published_at desc nulls last, c.title
  limit (select row_limit from input);
$function$;

revoke all on function public.search_public_content(text, integer) from public;
grant execute on function public.search_public_content(text, integer)
  to anon, authenticated, service_role;

comment on function public.search_public_content(text, integer) is
  'PII-free public content search. Returns only published blog metadata with a hard limit of 24.';
