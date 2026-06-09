-- Catalog/Flat-Role/AFS Rebuild — Migration 014: placeholder items
--
-- Exactly ONE placeholder catalog_item per active flat role (76 total), each
-- linked to its role as primary via catalog_item_roles.
--
-- status: 'published' (the live status CHECK allows draft|pending_review|published|
--   archived|rejected — there is NO 'active'; published is the visible state).
-- visibility: 'public'. is_placeholder: true.
-- slug: 'placeholder-' || kebab-case(role key).
-- item_type: r.key — catalog_item_types already contains every role key (case-
--   sensitive), so item_type=r.key satisfies catalog_items_item_type_fkey. This
--   FK + catalog_item_types are dropped in migration 016 (role linkage lives in
--   catalog_item_roles); until then item_type must reference a valid type key.
--
-- Idempotent: re-running does not duplicate (slug unique guard).

begin;

-- kebab-case slug: lower, replace _ with -, collapse non-alnum to -
insert into public.catalog_items (item_type, slug, title, status, visibility, is_placeholder, platform_role_key)
select
  r.key,
  'placeholder-' || regexp_replace(regexp_replace(lower(r.key), '_', '-', 'g'), '[^a-z0-9]+', '-', 'g'),
  '[PLACEHOLDER] ' || r.label,
  'published',
  'public',
  true,
  r.key
from public.roles r
where r.is_active = true and r.deleted_at is null
  and not exists (
    select 1 from public.catalog_items ci
    where ci.slug = 'placeholder-' || regexp_replace(regexp_replace(lower(r.key), '_', '-', 'g'), '[^a-z0-9]+', '-', 'g')
  );

-- Link each placeholder to its role as primary.
insert into public.catalog_item_roles (catalog_item_id, role_id, is_primary)
select ci.id, r.id, true
from public.catalog_items ci
join public.roles r on r.key = ci.platform_role_key
where ci.is_placeholder = true
  and not exists (
    select 1 from public.catalog_item_roles cir
    where cir.catalog_item_id = ci.id and cir.role_id = r.id
  )
on conflict (catalog_item_id, role_id) do nothing;

-- Assertion: exactly 76 placeholder items, each with a primary role link.
do $$
declare p int; linked int;
begin
  select count(*) into p from public.catalog_items where is_placeholder = true;
  if p <> 76 then raise exception 'Expected 76 placeholder items, found %', p; end if;

  select count(*) into linked
  from public.catalog_items ci
  where ci.is_placeholder = true
    and exists (select 1 from public.catalog_item_roles cir
                where cir.catalog_item_id = ci.id and cir.is_primary);
  if linked <> 76 then raise exception 'Expected 76 placeholders with primary role, found %', linked; end if;
end $$;

commit;
