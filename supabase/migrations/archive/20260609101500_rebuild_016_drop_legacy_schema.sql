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

-- 0. Neutralize a legacy sync trigger that writes to the DROPPED public.user_profiles.
--    sync_user_profile_role_from_catalog() fires on catalog_items UPDATE and tries
--    `update public.user_profiles set profile_type=...` — public.user_profiles was
--    dropped (legacy). It is already broken on prod (any member-item update raises
--    42P01) and would block step 3a's platform_role_key update. Role sync is now
--    handled via catalog_item_roles / user_role_assignments, so make this a no-op.
create or replace function public.sync_user_profile_role_from_catalog()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
begin
  -- legacy user_profiles sync removed (table dropped); role lives in
  -- catalog_item_roles / user_role_assignments now. No-op.
  return new;
end;
$function$;

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

-- 3a. Null out catalog_items.platform_role_key for legacy keys (the text FK
--     catalog_items_platform_role_key_fkey would otherwise block the role delete).
--     On prod 127 items (126 'bireysel' + 1 'danisman') still carried a legacy key.
--     Items are KEPT; their role link lives in catalog_item_roles. Setting the
--     legacy projection key to null detaches them from the soon-deleted roles.
update public.catalog_items
   set platform_role_key = null
 where platform_role_key in ('bireysel','danisman','isletme','kurulus-dernek',
                             'blogger-vlogger-youtuber','sehir-elcisi');

-- 3a2. Remove catalog_item_roles rows that link items to legacy roles. On prod the
--      014 placeholder backfill linked 127 real member items to legacy roles via
--      catalog_item_roles; without removing them the legacy-role delete hits
--      catalog_item_roles_role_id_fkey. Items are KEPT (re-linkable later).
delete from public.catalog_item_roles
 where role_id in (select id from public.roles where key in
   ('bireysel','danisman','isletme','kurulus-dernek','blogger-vlogger-youtuber','sehir-elcisi'));

-- 3b. Remove user_role_assignments still pointing at the 6 legacy roles, then
--    delete the legacy role rows. On prod, 127 assignments (126 'bireysel' +
--    1 'danisman') still referenced legacy roles and blocked the delete via
--    user_role_assignments_role_id_fkey. User decision (data backed up
--    separately): delete the blocking assignments. Local has 0 such rows so
--    this is a no-op there.
delete from public.user_role_assignments
 where role_id in (
   select id from public.roles
   where key in ('bireysel','danisman','isletme','kurulus-dernek',
                 'blogger-vlogger-youtuber','sehir-elcisi')
 );

-- Clear the explicit AFS-matrix rows for the legacy roles (these tables are KEPT
-- so their legacy rows must be deleted, not dropped). On prod: role_attributes=153,
-- role_features=207, role_sections=42 referenced legacy roles.
delete from public.role_attributes
 where role_id in (select id from public.roles where key in
   ('bireysel','danisman','isletme','kurulus-dernek','blogger-vlogger-youtuber','sehir-elcisi'));
delete from public.role_features
 where role_id in (select id from public.roles where key in
   ('bireysel','danisman','isletme','kurulus-dernek','blogger-vlogger-youtuber','sehir-elcisi'));
delete from public.role_sections
 where role_id in (select id from public.roles where key in
   ('bireysel','danisman','isletme','kurulus-dernek','blogger-vlogger-youtuber','sehir-elcisi'));

-- Defensive: clear any other roles-FK table for legacy ids (guarded by existence).
do $$
declare v_legacy uuid[];
begin
  select array_agg(id) into v_legacy from public.roles
   where key in ('bireysel','danisman','isletme','kurulus-dernek',
                 'blogger-vlogger-youtuber','sehir-elcisi');
  if v_legacy is null then return; end if;
  if to_regclass('public.user_profile_attributes') is not null
     and exists (select 1 from information_schema.columns
                 where table_schema='public' and table_name='user_profile_attributes' and column_name='role_id') then
    execute 'delete from public.user_profile_attributes where role_id = any($1)' using v_legacy;
  end if;
end $$;

delete from public.roles
 where key in ('bireysel','danisman','isletme','kurulus-dernek',
               'blogger-vlogger-youtuber','sehir-elcisi');

-- 4. Drop any leftover legacy RPCs tied to the dropped tables.
drop function if exists public.admin_upsert_role_taxonomy_rule(uuid, uuid, uuid, integer) cascade;

commit;
