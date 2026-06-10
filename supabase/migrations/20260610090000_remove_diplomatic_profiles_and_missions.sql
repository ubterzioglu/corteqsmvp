-- Remove all diplomatic profiles (consulates/embassies) and their source data.
--
-- Why: The /admin/consulates page ("Diplomatik Profiller") was populated from
-- public.turkish_missions, which is re-seeded on every DB rebuild by:
--   - 20260601130000_add_turkish_missions_schema.sql
--   - 20260602103000_add_embassy_independent_profiles.sql
--   - supabase/manual/sync_all_turkish_missions_as_embassy_profiles.sql
-- Deleting the rows alone is not durable: a rebuild re-runs those seeds and the
-- 241 missions + 241 derived independent_profiles come back. This migration runs
-- AFTER all of them (latest timestamp), so the data stays gone across rebuilds.
--
-- The catalog_sync_* triggers on these tables fire on DELETE and call
-- catalog_delete_item_for_source(...), which removes any derived catalog_items
-- and their source_records automatically. So we let the triggers do that cleanup
-- and only delete the base rows here (child FK tables first).
--
-- Idempotent: safe to run multiple times. Uses IF EXISTS guards so it does not
-- fail if a table is absent in some environments.

begin;

-- turkish_missions child tables (FK to turkish_missions.slug) must go first.
do $$
begin
  if to_regclass('public.turkish_mission_relations') is not null then
    delete from public.turkish_mission_relations;
  end if;

  if to_regclass('public.turkish_mission_units') is not null then
    delete from public.turkish_mission_units;
  end if;

  -- Base source table. DELETE fires trg_catalog_sync_turkish_mission per row,
  -- which deletes derived catalog_items via catalog_delete_item_for_source.
  if to_regclass('public.turkish_missions') is not null then
    delete from public.turkish_missions;
  end if;

  -- Derived public profile table (consulates + embassies).
  -- DELETE fires trg_catalog_sync_independent_profile per row, cleaning catalog.
  if to_regclass('public.independent_profiles') is not null then
    delete from public.independent_profiles;
  end if;
end;
$$;

-- Belt-and-suspenders: clear any orphaned source_records for these sources in
-- case rows were bulk-inserted before the sync triggers existed (so the DELETE
-- triggers above had nothing to match). This also removes their catalog_items.
do $$
declare
  v_external_id text;
begin
  if to_regclass('public.source_records') is not null then
    for v_external_id in
      select external_id
      from public.source_records
      where source_type in ('official.turkish_missions', 'legacy.independent_profiles')
    loop
      -- catalog_delete_item_for_source deletes the source_record and, if no
      -- other source references the item, the catalog_item itself.
      perform public.catalog_delete_item_for_source('official.turkish_missions', v_external_id);
      perform public.catalog_delete_item_for_source('legacy.independent_profiles', v_external_id);
    end loop;
  end if;
exception
  when undefined_function then
    -- catalog_delete_item_for_source not present in this environment; skip.
    null;
end;
$$;

commit;
