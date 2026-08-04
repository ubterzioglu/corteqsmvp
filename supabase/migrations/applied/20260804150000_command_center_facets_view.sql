-- ============================================================
-- Purpose:                Add an aggregated facet view for the command center panel so the UI can build
--                         its filter options, source breakdown and badge counts from ~320 grouped rows
--                         instead of three unbounded full-table reads.
-- Module:                 COMMAND CENTER (/admin/workspace/command-center)
-- Risk level:             low (read-only view, no schema change on command_center_items)
-- Preconditions:          Postgres 15+ (live = 17). Source table: public.command_center_items.
-- Rollback:               DROP VIEW public.v_command_center_facets;  (see bottom)
-- Data migration required: no
-- Estimated lock impact:  negligible
--
-- Why this exists:
--   The panel used to SELECT every active row three times (filter options, date groups, source
--   breakdown). Supabase caps PostgREST responses at 1000 rows, so every batch beyond position 1000 was
--   silently dropped from those lists -- the newest WhatsApp batch ("2 Ağustos 2026", 329 rows, ordered
--   at positions 1041-1369) never appeared in the filters or the source card, which made the panel look
--   like it had no data past "WA 6 Temmuz". Grouping server side keeps the payload tiny and complete.
--
-- NOTE: the view returns one row per distinct facet combination (320 rows as of 2026-08-04). If this
--       ever approaches 1000 rows, the client must switch to range() paging when reading it.
--
-- Manual verification:
--   select count(*) from public.v_command_center_facets;                          -- ~320
--   select sum(item_count) from public.v_command_center_facets
--    where legacy_source_date_label = '2 Ağustos 2026';                           -- 329
-- ============================================================

create or replace view public.v_command_center_facets as
select
  item_type,
  category_label,
  legacy_source_code,
  legacy_source_date_label,
  legacy_source_category,
  assignee,
  count(*)::int as item_count
from public.command_center_items
where deleted_at is null
  and archived_at is null
group by
  item_type,
  category_label,
  legacy_source_code,
  legacy_source_date_label,
  legacy_source_category,
  assignee;

-- Caller RLS on command_center_items stays in force (project rule for reporting views).
alter view public.v_command_center_facets set (security_invoker = on);

grant select on public.v_command_center_facets to anon, authenticated;

comment on view public.v_command_center_facets is
  'Aggregated facet counts for the command center panel (active, non-archived items). Feeds filter options, the source breakdown card and badge counts without hitting the PostgREST 1000-row cap.';

-- ------------------------------------------------------------
-- ROLLBACK:
--   DROP VIEW public.v_command_center_facets;
-- ------------------------------------------------------------
