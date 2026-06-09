-- Catalog/Flat-Role/AFS Rebuild — Migration 016: drop legacy schema
--
-- Removes the role-family / item-type indirection residue. Per Checkpoint-1
-- decision, ALL satellite tables are KEPT — only the genuine family/indirection
-- legacy is dropped:
--   - catalog_item_types (role->item_type family indirection)
--   - item_type_attribute_rules, item_type_feature_defaults, item_type_features
--   - role_taxonomy_rules
--   - the 6 legacy role rows (bireysel, danisman, isletme, kurulus-dernek,
--     blogger-vlogger-youtuber, sehir-elcisi) — verified 0 catalog_item_roles use them
--
-- catalog_items.item_type and catalog_categories.module COLUMNS are kept (those
-- tables/satellites stay) but their FK to catalog_item_types is dropped (the
-- referenced table is being removed); the columns become free text.
--
-- Ordering: drop FKs -> drop indirection tables -> delete legacy roles.

begin;

-- 1. Drop FKs that reference catalog_item_types (kept columns become free text).
alter table public.catalog_items   drop constraint if exists catalog_items_item_type_fkey;
alter table public.catalog_categories drop constraint if exists catalog_categories_module_fkey;
-- (item_type_* tables' own FKs drop with the tables below.)

-- 2. Drop the item-type indirection + taxonomy tables (CASCADE clears their
--    triggers/policies/indexes/remaining FKs).
drop table if exists public.item_type_attribute_rules  cascade;
drop table if exists public.item_type_feature_defaults cascade;
drop table if exists public.item_type_features         cascade;
drop table if exists public.catalog_item_types         cascade;
drop table if exists public.role_taxonomy_rules        cascade;

-- 3. Delete the 6 legacy role rows (verified unused by catalog_item_roles).
--    Defensive: re-point/cleanup any dangling refs first would go here, but the
--    preflight confirmed cir_using_legacy = 0.
delete from public.roles
 where key in ('bireysel','danisman','isletme','kurulus-dernek',
               'blogger-vlogger-youtuber','sehir-elcisi');

-- 4. Drop any leftover legacy RPCs tied to the dropped tables.
drop function if exists public.admin_upsert_role_taxonomy_rule(uuid, uuid, uuid, integer) cascade;

commit;
