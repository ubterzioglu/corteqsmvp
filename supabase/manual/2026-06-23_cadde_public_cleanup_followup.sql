-- Cadde mobile audit follow-up
-- Goal: preview malformed public geo labels and possible public beta junk rows
-- without rewriting historical migrations.

-- 1. Preview known malformed geo labels seeded in early Cadde history.
select id, code, name
from public.cadde_countries
where name in ('Birlesik Krallik', 'Amerika Birlesik Devletleri', 'Turkiye')
order by code;

select
  cities.id,
  countries.code as country_code,
  cities.name,
  cities.timezone
from public.cadde_cities as cities
join public.cadde_countries as countries on countries.id = cities.country_id
where cities.name in ('Istanbul')
order by countries.code, cities.name;

-- 2. Preview obviously public-facing junk content before moderation.
select id, title, body, status, created_at
from public.cadde_posts
where status = 'published'
  and title in (
    'test',
    'Test',
    'demo',
    'Demo'
  )
order by created_at desc;

select id, title, summary, status, created_at
from public.cadde_cafes
where status = 'published'
  and title in (
    'test',
    'Test',
    'demo',
    'Demo'
  )
order by created_at desc;

-- 3. Apply exact-match moderation updates only after manual review.
-- Example geo fix:
-- update public.cadde_countries
-- set name = 'Birleşik Krallık'
-- where code = 'GB'
--   and name = 'Birlesik Krallik';
--
-- update public.cadde_countries
-- set name = 'Amerika Birleşik Devletleri'
-- where code = 'US'
--   and name = 'Amerika Birlesik Devletleri';
--
-- update public.cadde_countries
-- set name = 'Türkiye'
-- where code = 'TR'
--   and name = 'Turkiye';
--
-- update public.cadde_cities
-- set name = 'İstanbul'
-- where name = 'Istanbul'
--   and country_id = (select id from public.cadde_countries where code = 'TR');
--
-- Example content moderation:
-- update public.cadde_posts
-- set status = 'hidden'
-- where id = 'replace-with-reviewed-post-id'
--   and title = 'test';
