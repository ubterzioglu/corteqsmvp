-- ============================================================
-- DRAFT ONLY - DO NOT EXECUTE AUTOMATICALLY
-- Human review, backup and staging verification are required.
-- ============================================================
--
-- PHASE 06 — LEGACY / DUPLICATE / BACKUP RETIREMENT (proposals only)
-- Project: injprdrsklkxgnaiixzh  | Schema: public
--
-- This phase NEVER auto-drops anything. It provides:
--   * the retirement-candidate list,
--   * READ-ONLY verification queries (row counts, last-updated, FK-reference
--     checks) that MAY be uncommented and run, and
--   * the DROP TABLE statements COMMENTED OUT with precondition/risk/rollback.
--
-- IRON RULE: a table is retired ONLY after BOTH
--   (1) data verification (empty OR fully migrated / backed up off-cluster), and
--   (2) usage verification (no app code, no FK, no view/function references).
-- DROP TABLE is irreversible without a backup. Always pg_dump first.
-- ============================================================


-- ============================================================
-- SECTION 0 — Generic verification helpers (READ-ONLY — may run)
-- ============================================================
--
-- 0a. Find any FK that REFERENCES a candidate table (inbound dependencies):
--     If this returns rows, you CANNOT drop without handling those FKs first.
-- SELECT conrelid::regclass AS referencing_table, conname
-- FROM   pg_constraint
-- WHERE  contype = 'f'
--   AND  confrelid = 'public.<CANDIDATE_TABLE>'::regclass;
--
-- 0b. Find views/functions that reference a candidate table by name:
-- SELECT dependent.relname AS dependent_view
-- FROM   pg_depend d
-- JOIN   pg_rewrite r ON r.oid = d.objid
-- JOIN   pg_class dependent ON dependent.oid = r.ev_class
-- WHERE  d.refobjid = 'public.<CANDIDATE_TABLE>'::regclass
--   AND  dependent.relname <> '<CANDIDATE_TABLE>';
--
-- 0c. ALSO grep the application repo for the table name before dropping
--     (PostgREST/direct supabase.from('<name>') usage won't show in pg_depend).


-- ============================================================
-- SECTION 1 — _member_backup_20260609  (BACKUP table)
-- ============================================================
-- Context: detached member-data backup, FK-free, P0 exposure in phase-04.
-- After phase-04 access is removed/relocated, this backup should be EXPORTED
-- off-cluster and then DROPPED if no longer needed.
--
-- VERIFY (READ-ONLY — may run):
SELECT count(*) AS row_count FROM public._member_backup_20260609;
SELECT conrelid::regclass AS referencing_table, conname
FROM   pg_constraint
WHERE  contype = 'f' AND confrelid = 'public._member_backup_20260609'::regclass;
--
-- PRECONDITION before DROP:
--   [ ] pg_dump of the table stored off-cluster (retain per data-retention policy).
--   [ ] Confirmed not referenced by any FK (query above returns 0 rows — expected).
--   [ ] Confirmed phase-04 access remediation already applied.
--
-- PROPOSED (COMMENTED OUT):
-- -- DROP TABLE public._member_backup_20260609;
--
-- Risk:     irreversible loss of the backup copy if not dumped first.
-- Rollback: restore from the pg_dump taken in the precondition step.


-- ============================================================
-- SECTION 2 — command_center_legacy_map  (vs canonical command_center_items)
-- ============================================================
-- VERIFY (READ-ONLY — may run):
SELECT count(*) AS row_count FROM public.command_center_legacy_map;
SELECT conrelid::regclass AS referencing_table, conname
FROM   pg_constraint
WHERE  contype = 'f' AND confrelid = 'public.command_center_legacy_map'::regclass;
--
-- PRECONDITION before DROP:
--   [ ] Data either empty OR fully represented in command_center_items (verify a
--       mapping/migration already moved it).
--   [ ] No FK inbound; no view/function/app reference (Section 0 + repo grep).
--   [ ] pg_dump backup taken.
--
-- PROPOSED (COMMENTED OUT):
-- -- DROP TABLE public.command_center_legacy_map;
--
-- Risk:     may still be read by a legacy code path — grep the repo first.
-- Rollback: restore from pg_dump.


-- ============================================================
-- SECTION 3 — referral_codes_legacy  (vs canonical referral_codes)
-- ============================================================
-- VERIFY (READ-ONLY — may run):
SELECT count(*) AS row_count FROM public.referral_codes_legacy;
-- Compare against canonical to confirm migration completeness:
SELECT (SELECT count(*) FROM public.referral_codes)        AS canonical_count,
       (SELECT count(*) FROM public.referral_codes_legacy) AS legacy_count;
-- Inbound FK references to the legacy table:
SELECT conrelid::regclass AS referencing_table, conname
FROM   pg_constraint
WHERE  contype = 'f' AND confrelid = 'public.referral_codes_legacy'::regclass;
--
-- PRECONDITION before DROP:
--   [ ] All legacy codes confirmed migrated to referral_codes (or intentionally dead).
--   [ ] No FK inbound; no app/view reference.
--   [ ] pg_dump backup taken.
--   [ ] phase-04 grant tightening already applied to this table.
--
-- PROPOSED (COMMENTED OUT):
-- -- DROP TABLE public.referral_codes_legacy;
--
-- Risk:     irreversible; referral history could be lost if not migrated/backed up.
-- Rollback: restore from pg_dump.


-- ============================================================
-- SECTION 4 — Retired-runtime TAXONOMY tables (verify EMPTY first)
-- ============================================================
-- Tables: taxonomy_groups, taxonomy_options, role_taxonomy_rules,
--         user_taxonomy_selections
-- Context: taxonomy runtime is retired; tables still exist and are LIKELY empty.
--          DO NOT assume empty — verify row counts before retiring.
--
-- VERIFY ROW COUNTS (READ-ONLY — may run): expect 0 for each.
SELECT 'taxonomy_groups'          AS tbl, count(*) AS row_count FROM public.taxonomy_groups
UNION ALL
SELECT 'taxonomy_options',          count(*) FROM public.taxonomy_options
UNION ALL
SELECT 'role_taxonomy_rules',       count(*) FROM public.role_taxonomy_rules
UNION ALL
SELECT 'user_taxonomy_selections',  count(*) FROM public.user_taxonomy_selections;
--
-- VERIFY no inbound FK to any taxonomy table (READ-ONLY — may run):
SELECT confrelid::regclass AS taxonomy_table,
       conrelid::regclass  AS referencing_table,
       conname
FROM   pg_constraint
WHERE  contype = 'f'
  AND  confrelid IN ('public.taxonomy_groups'::regclass,
                     'public.taxonomy_options'::regclass,
                     'public.role_taxonomy_rules'::regclass,
                     'public.user_taxonomy_selections'::regclass);
--
-- PRECONDITION before DROP:
--   [ ] All four row counts = 0 (or any rows confirmed disposable + backed up).
--   [ ] No inbound FK (query above returns 0 rows).
--   [ ] No app/view/function reference (Section 0b + repo grep).
--   [ ] pg_dump backup taken (cheap for empty tables; still do it).
--   [ ] DROP child-before-parent to respect FK ordering among themselves
--       (user_taxonomy_selections / role_taxonomy_rules likely reference
--        taxonomy_groups / taxonomy_options).
--
-- PROPOSED (COMMENTED OUT) — order matters; drop dependents first:
-- -- DROP TABLE public.user_taxonomy_selections;
-- -- DROP TABLE public.role_taxonomy_rules;
-- -- DROP TABLE public.taxonomy_options;
-- -- DROP TABLE public.taxonomy_groups;
--
-- Risk:     low if empty; irreversible nonetheless.
-- Rollback: restore from pg_dump.


-- ============================================================
-- SECTION 5 — POSSIBLE DUPLICATES (review only — DO NOT drop yet)
-- ============================================================
-- These need a data + usage comparison before ANY retirement decision. No DROP
-- is proposed; only the comparison queries (READ-ONLY — may run).
--
-- 5a. feature_definitions (reported 0 rows) vs feature_catalog (canonical):
SELECT (SELECT count(*) FROM public.feature_definitions) AS feature_definitions_rows,
       (SELECT count(*) FROM public.feature_catalog)     AS feature_catalog_rows;
--
-- 5b. may19_campaign_submissions vs may19_submissions:
SELECT (SELECT count(*) FROM public.may19_campaign_submissions) AS campaign_rows,
       (SELECT count(*) FROM public.may19_submissions)          AS submissions_rows;
--
-- 5c. todos vs todo_items:
SELECT (SELECT count(*) FROM public.todos)      AS todos_rows,
       (SELECT count(*) FROM public.todo_items) AS todo_items_rows;
--
-- 5d. cafes / cafe_memberships  vs  cadde_cafes / cadde_cafe_members:
SELECT (SELECT count(*) FROM public.cafes)              AS cafes_rows,
       (SELECT count(*) FROM public.cafe_memberships)   AS cafe_memberships_rows,
       (SELECT count(*) FROM public.cadde_cafes)        AS cadde_cafes_rows,
       (SELECT count(*) FROM public.cadde_cafe_members) AS cadde_cafe_members_rows;
--
-- DECISION RULE: only after confirming which side is canonical, that the other is
-- unused (repo grep + pg_depend + 0 inbound FK), and a backup exists, author a
-- SEPARATE reviewed retirement migration. NOTHING is dropped from this file.


-- ============================================================
-- GLOBAL REMINDERS
-- * Index scan stats (idx_scan=0) are NOT grounds to drop indexes here or anywhere —
--   "Manuel doğrulama gerekli" (manual verification required) only.
-- * Never move this file into supabase/migrations/. Approved drops become NEW,
--   individually reviewed migrations, each with its own backup + rollback plan.
-- ============================================================
