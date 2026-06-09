-- Catalog/Flat-Role/AFS Rebuild — Migration 002: catalog_items
--
-- Strategy: physical RENAME of columns to the plan's target names + add
-- is_placeholder. We do NOT drop/recreate catalog_items: that preserves the
-- FK graph (all satellites + claims + managers + attribute_values reference
-- catalog_items.id), data, indexes, and triggers automatically.
--
-- Plan target shape (design 05 §3):
--   id, slug, display_name, short_description, country_code, city, status,
--   visibility, is_placeholder, is_verified, created_by, created_at,
--   updated_at, deleted_at
--
-- Live shape today:
--   id, item_type, slug, title, headline, short_description, long_description,
--   status, visibility, verification_status, created_by_user_id, published_at,
--   attributes(jsonb), created_at, updated_at, platform_role_key, linked_user_id
--
-- Mapping decisions:
--   title              -> KEPT as `title` (rename reverted at Checkpoint: column
--                          rename would break 13 fns in too many syntactic forms;
--                          keeping title avoids brittle column rewire. display_name
--                          is NOT introduced; consumers keep using catalog_items.title)
--   created_by_user_id -> created_by        (rename)
--   verification_status -> derive is_verified boolean (add; keep column for now)
--   country_code/city  -> add if absent (country_code added; city may live in
--                          satellites/locations — add nullable column for the
--                          plan's directory-filter requirement)
--   item_type, headline, long_description, attributes, published_at,
--   platform_role_key, linked_user_id -> KEPT (used by satellites/sync/rewire);
--   not dropped here to avoid breaking ~100 RPCs mid-rename. Final cleanup of
--   genuinely-unused columns is deferred to migration 016 after rewire.
--
-- Idempotent: guarded with IF EXISTS / IF NOT EXISTS.

begin;

-- 1. title is intentionally KEPT (no rename to display_name). See header.

-- 2. created_by (from created_by_user_id)
do $$
begin
  if exists (select 1 from information_schema.columns
             where table_schema='public' and table_name='catalog_items' and column_name='created_by_user_id')
     and not exists (select 1 from information_schema.columns
             where table_schema='public' and table_name='catalog_items' and column_name='created_by') then
    alter table public.catalog_items rename column created_by_user_id to created_by;
  end if;
end $$;

-- 3. is_placeholder (new, required by plan §6 / design §3)
alter table public.catalog_items
  add column if not exists is_placeholder boolean not null default false;

-- 4. is_verified (derive from verification_status; keep source col until 016)
alter table public.catalog_items
  add column if not exists is_verified boolean not null default false;

update public.catalog_items
  set is_verified = true
  where is_verified = false
    and coalesce(lower(verification_status), '') in ('verified', 'approved', 'confirmed');

-- 5. country_code + city (plan directory-filter requirement)
alter table public.catalog_items
  add column if not exists country_code text;
alter table public.catalog_items
  add column if not exists city text;

-- 6. soft-delete support
alter table public.catalog_items
  add column if not exists deleted_at timestamptz;

comment on column public.catalog_items.is_placeholder is
  'Rebuild 2026-06-09: true = seed placeholder (one per flat role), deletable in one query.';
comment on column public.catalog_items.is_verified is
  'Rebuild 2026-06-09: boolean derived from verification_status; canonical verification flag.';

commit;
