-- Catalog/Flat-Role/AFS Rebuild — Migration 008: catalog_item_roles + indexes
--
-- The plan/design require a many-to-many catalog_item_roles join table with a
-- single primary role per item. Today linkage is a single text column
-- catalog_items.platform_role_key. This migration:
--   1. creates catalog_item_roles
--   2. backfills it from catalog_items.platform_role_key (each item's role = primary)
--   3. adds the one-primary-per-item partial unique index
--   4. adds performance indexes on the renamed tables
--
-- platform_role_key is KEPT on catalog_items for now (consumers still read it);
-- final removal deferred to migration 016 after rewire.
-- Idempotent.

begin;

-- 1. join table
create table if not exists public.catalog_item_roles (
  id uuid primary key default gen_random_uuid(),
  catalog_item_id uuid not null references public.catalog_items(id) on delete cascade,
  role_id uuid not null references public.roles(id) on delete restrict,
  is_primary boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint catalog_item_roles_item_role_uniq unique (catalog_item_id, role_id)
);

-- 2. backfill from platform_role_key (only rows with a resolvable role)
insert into public.catalog_item_roles (catalog_item_id, role_id, is_primary)
select ci.id, r.id, true
from public.catalog_items ci
join public.roles r on r.key = ci.platform_role_key
where ci.platform_role_key is not null
  and not exists (
    select 1 from public.catalog_item_roles cir where cir.catalog_item_id = ci.id
  )
on conflict (catalog_item_id, role_id) do nothing;

-- 3. one-primary-per-item
create unique index if not exists catalog_item_roles_one_primary_uniq
  on public.catalog_item_roles (catalog_item_id)
  where is_primary;

create index if not exists catalog_item_roles_role_idx
  on public.catalog_item_roles (role_id);

-- 4. performance indexes on core/renamed tables
create index if not exists catalog_items_slug_idx        on public.catalog_items (slug);
create index if not exists catalog_items_status_vis_idx  on public.catalog_items (status, visibility);
create index if not exists catalog_items_placeholder_idx on public.catalog_items (is_placeholder);
create index if not exists catalog_items_country_city_idx on public.catalog_items (country_code, city);

create index if not exists role_attributes_role_idx on public.role_attributes (role_id);
create index if not exists role_features_role_idx   on public.role_features (role_id);
create index if not exists role_sections_role_idx   on public.role_sections (role_id);
create index if not exists civ_item_idx on public.catalog_item_attribute_values (item_id);

comment on table public.catalog_item_roles is
  'Rebuild 2026-06-09: M:N item<->role link. Exactly one primary role per item (partial unique index).';

commit;
