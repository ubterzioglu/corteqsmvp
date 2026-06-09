-- Catalog/Flat-Role/AFS Rebuild — Migration 006: item values + overrides
--
-- Renames the item attribute value table to the plan's name and ensures typed
-- value columns + visibility override exist. The three override tables already
-- exist with the right names (catalog_item_attribute_overrides,
-- catalog_item_feature_overrides, catalog_item_section_overrides) and are KEPT.
--
--   catalog_item_attributes -> catalog_item_attribute_values
--
-- RENAME preserves the item_id + attribute_id FKs.
-- Idempotent.

begin;

-- 1. catalog_item_attributes -> catalog_item_attribute_values
do $$
begin
  if exists (select 1 from information_schema.tables
             where table_schema='public' and table_name='catalog_item_attributes')
     and not exists (select 1 from information_schema.tables
             where table_schema='public' and table_name='catalog_item_attribute_values') then
    alter table public.catalog_item_attributes rename to catalog_item_attribute_values;
  end if;
end $$;

-- 2. Ensure typed value columns + visibility_override (design §3 / plan §4.4).
alter table public.catalog_item_attribute_values
  add column if not exists value_text text,
  add column if not exists value_boolean boolean,
  add column if not exists value_numeric numeric,
  add column if not exists value_date date,
  add column if not exists value_jsonb jsonb,
  add column if not exists visibility_override text;

comment on table public.catalog_item_attribute_values is
  'Rebuild 2026-06-09: per-item attribute values (was catalog_item_attributes). Typed value columns.';

commit;
