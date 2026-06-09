# Catalog / Flat-Role / AFS Rebuild Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans (inline, with checkpoints) to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking. This is a destructive, production-touching rebuild — **HONOR every checkpoint and the go/no-go gate before the remote push.**

**Goal:** Replace the live catalog/role/AFS system in `corfin-mvp` with a clean, normalized, flat-role (no families) system: 76 roles, 53 attributes, 42 features, 7 sections, explicit role↔AFS matrix, 76 placeholder items, secure RPCs/RLS, fully rewired backend + frontend + admin UI, with all legacy residue dropped.

**Architecture:** Rename the existing flat catalogs to the plan's names (`afs_attributes`, `role_attributes`, …), strip family residue (`family_key`, `parent_role_id`, item-type indirection, 6 legacy roles, `role_taxonomy_rules`), reseed all data as placeholders, rewire ~100 RPCs / RLS / ~23 frontend files / edge functions, then drop legacy and push. Staged & reversible per phase per design §7/§9.

**Tech Stack:** Supabase Postgres (project `injprdrsklkxgnaiixzh`), SQL migrations under `supabase/migrations/`, Supabase Management API for read-only introspection + push (token from `.secretdb`, never logged/committed), React + Vite + TypeScript frontend, Vitest, Playwright.

**Approved design:** `docs/catalog-role-afs-rebuild/05-new-database-design.md`
**Preflight (gates cleared):** `docs/catalog-role-afs-rebuild/00-preflight-reconciliation-report.md`

**Verified facts (live DB, 2026-06-09):** roles=82 (76 real + 6 legacy), attribute_catalog=53, feature_catalog=42, profile_section_catalog=7, role_attribute_rules=1977, role_feature_flags=2487, role_profile_section_rules=574, catalog_items=163, user_role_assignments=129, user_profile_attributes=998, ~100 catalog/role RPCs. **User acknowledged permanent no-backup data loss.**

---

## File / artifact structure

**Reports (docs/catalog-role-afs-rebuild/):** 00 (done), 01 current-system-audit, 02 flat-role-inventory, 03 afs-catalog-inventory, 04 role-afs-explicit-matrix, 05 (done), 06 mermaid-er-diagram, 07 backend-integration, 08 frontend-integration, 09 admin-database-menu, 10 legacy-cleanup-manifest, 11 e2e-test-report, 12 migration-push-report, 13 post-cleanup-grep-report, 14 changed-files.

**Migrations (supabase/migrations/, prefix `20260609NNNNNN_`):** per design §7, `001_preflight_inventory` … `017_post_cleanup_verification`.

**Frontend (src/):** admin pages under `src/pages/admin/*`, `src/lib/role-catalog.ts`, `src/lib/admin-catalog.ts`, `src/lib/profile-helpers.ts`, `src/pages/Directory*`, new-member form, `src/integrations/supabase/types.ts`, `docs/roles-infogram.html`.

---

## PHASE 1 — Reconciliation reports + ER diagram  ⟶ CHECKPOINT

> Read-only. No schema change. Produces the analysis artifacts the plan (§20) requires. Connection helper (do NOT log token):
> `export SUPABASE_ACCESS_TOKEN="$(head -1 .secretdb | tr -d '[:space:]')"` then POST to `https://api.supabase.com/v1/projects/injprdrsklkxgnaiixzh/database/query`.

### Task 1.1: Current-system audit report (01)

**Files:**
- Create: `docs/catalog-role-afs-rebuild/01-current-system-audit.md`

- [ ] **Step 1: Enumerate every live table/RPC/trigger/RLS in the catalog/role/AFS surface**

Run these read-only queries and capture results:
- tables: `select table_name from information_schema.tables where table_schema='public' and (table_name ~* 'catalog|role|afs|attribute|feature|section|entity_metadata|claim|manager|directory') order by 1;`
- RPCs: already captured (~100 fns; list in report).
- triggers: `select event_object_table, trigger_name, action_statement from information_schema.triggers where trigger_schema='public' and (event_object_table ~* 'catalog|role|attribute|feature|section') order by 1,2;`
- RLS policies: `select tablename, policyname, cmd, roles, qual, with_check from pg_policies where schemaname='public' and (tablename ~* 'catalog|role|attribute|feature|section') order by 1,2;`

- [ ] **Step 2: Write report 01** with sections: live tables (+row counts), RPC inventory grouped by purpose (public/owner/admin/trigger/internal), triggers, RLS policies, FKs, indexes, and a "legacy residue" subsection (family_key, parent_role_id, catalog_item_types, item_type_*, role_taxonomy_rules, 6 legacy roles, entity_metadata). Mark each table/RPC as KEEP / RENAME / DROP per design §3–§5.

- [ ] **Step 3: Commit**

```bash
git add docs/catalog-role-afs-rebuild/01-current-system-audit.md
git commit -m "docs(rebuild): current-system audit report (01)"
```

### Task 1.2: Flat-role inventory report (02)

**Files:**
- Create: `docs/catalog-role-afs-rebuild/02-flat-role-inventory.md`

- [ ] **Step 1:** Query `select key,label,sort_order,is_active from public.roles order by sort_order,key;`. Tag the 6 legacy keys (`bireysel,danisman,isletme,kurulus-dernek,blogger-vlogger-youtuber,sehir-elcisi`) DROP, the other 76 KEEP.
- [ ] **Step 2:** Write report 02: the final 76-role table (key, label, group-prefix for display only — NOT a DB family), explicit statement "final count = 76", and the legacy-drop list with the resolution from report 00.
- [ ] **Step 3: Commit** `git commit -m "docs(rebuild): flat-role inventory (02)"`

### Task 1.3: AFS catalog inventory report (03)

**Files:**
- Create: `docs/catalog-role-afs-rebuild/03-afs-catalog-inventory.md`

- [ ] **Step 1:** Query full rows of `attribute_catalog` (53), `feature_catalog` (42), `profile_section_catalog` (7) incl. all columns (data_type, default visibility, global state, section_area).
- [ ] **Step 2:** Write report 03: three catalog tables. Add a **normalization-duplicate mapping** subsection (NOT auto-delete) for the pairs in plan §8: `avatar_url`/`profile_photo_url`, `address`/`physical_address`, `cv_path`+`cv_name`/`cv_doc`, `presentation_path`+`presentation_name`/`presentation_doc`, `business_website`/`website_url`, `is_volunteer_mentor`/`volunteer_mentorship_opt_in` — with a per-pair decision (keep both / canonical+alias) and a `storage_strategy` assignment for each of the 53 attrs (core_column vs dynamic_value vs private_storage vs computed) per design §3.
- [ ] **Step 3: Commit** `git commit -m "docs(rebuild): AFS catalog inventory (03)"`

### Task 1.4: Role↔AFS explicit matrix report (04)

**Files:**
- Create: `docs/catalog-role-afs-rebuild/04-role-afs-explicit-matrix.md`

- [ ] **Step 1:** Query the existing relation rows joined to keys:
  - `select r.key role, a.key attr, x.is_required, x.is_public, x.sort_order from role_attribute_rules x join roles r on r.id=x.role_id join attribute_catalog a on a.id=x.attribute_id where r.key not in (<6 legacy>) order by 1,2;` (similar for `role_feature_flags`→feature_catalog and `role_profile_section_rules`→profile_section_catalog).
- [ ] **Step 2:** Write report 04: per-role attribute/feature/section lists derived from LIVE data (this is the source for seed migration 013). Where a role has no rows, mark `PROPOSED` per plan §3.3 (do not silently invent). Include summary counts per role.
- [ ] **Step 3: Commit** `git commit -m "docs(rebuild): role-AFS explicit matrix (04)"`

### Task 1.5: Mermaid ER diagram (06) + satellite consumer finalization

**Files:**
- Create: `docs/catalog-role-afs-rebuild/06-mermaid-er-diagram.md`
- Modify: `docs/catalog-role-afs-rebuild/05-new-database-design.md` (§5 satellite list → finalize)

- [ ] **Step 1:** For EACH satellite (`catalog_item_contacts/_links/_locations/_media/_languages/_categories/_services/_tags/_relations/_reviews/_reports/_favorites/catalog_audit_logs/catalog_search_documents`), grep `src/**/*.{ts,tsx}` for the table name. 0 runtime hits → DROP; ≥1 → KEEP. Record the per-table verdict.
- [ ] **Step 2:** Write report 06: mermaid `erDiagram` of the TARGET schema (catalog_items → catalog_item_roles → roles; roles → role_attributes/role_features/role_sections → afs_*; catalog_item_attribute_values + overrides; claims; managers) per design §3.
- [ ] **Step 3:** Update design §5 with the finalized keep/drop satellite list.
- [ ] **Step 4: Commit** `git commit -m "docs(rebuild): ER diagram (06) + finalize satellite keep/drop"`

> **CHECKPOINT 1:** Present reports 01–04 + 06 summary. Get user confirmation that the explicit matrix (04) and satellite verdicts are correct before authoring any schema migration. STOP here.

---

## PHASE 2 — Schema migrations (002–010)  ⟶ CHECKPOINT

> Authored under final names per design §7. Each migration is idempotent where possible and validated locally (`supabase db lint` / dry parse) before any push. NO remote push in this phase.

- [ ] **Task 2.1** — `002_create_catalog_items.sql`: new `catalog_items` shape (design §3) incl. `is_placeholder NOT NULL DEFAULT false`. Build under final name; handle collision per design §7 (existing table renamed to `_legacy_catalog_items` until drop phase).
- [ ] **Task 2.2** — `003_create_flat_roles.sql`: `roles` without family columns; partial logic to carry the 76 keys.
- [ ] **Task 2.3** — `004_create_afs_catalogs.sql`: `afs_attributes/afs_features/afs_sections` (renamed shells).
- [ ] **Task 2.4** — `005_create_role_afs_relations.sql`: `role_attributes/role_features/role_sections` with unique constraints (design §3).
- [ ] **Task 2.5** — `006_create_item_values_and_overrides.sql`: `catalog_item_attribute_values` + 3 override tables with typed value cols + CHECK/trigger for type consistency (design §3, plan §4.4).
- [ ] **Task 2.6** — `007_create_claims_and_managers.sql`: `catalog_item_claims` + `catalog_item_managers` with status/manager_role enums or CHECKs.
- [ ] **Task 2.7** — `008_create_indexes_constraints_and_triggers.sql`: indexes (slug, role_id, item_id, search), one-primary-per-item partial unique index, updated_at triggers.
- [ ] **Task 2.8** — `009_create_rls_policies.sql`: RLS for all new tables per visibility levels (design §6). No public access to internal columns.
- [ ] **Task 2.9** — `010_create_public_owner_admin_rpc.sql`: whitelist RPCs `get_public_catalog_item_profile`, `get_owner_catalog_item_profile`, `get_admin_catalog_item_profile`, `get_catalog_item_form_schema`, `get_role_form_schema`, `get_flat_roles` (design §6). No `select *`.
- [ ] Each task: write SQL → local lint/parse → commit individually.

> **CHECKPOINT 2:** Review all DDL migrations + RLS + RPC signatures. STOP. (Still no remote push.)

---

## PHASE 3 — Seeds + verify (011–015)  ⟶ CHECKPOINT

- [ ] **Task 3.1** — `011_seed_flat_roles.sql`: insert the 76 roles from report 02 (helper fn allowed; final rows explicit).
- [ ] **Task 3.2** — `012_seed_afs_catalogs.sql`: 53 attrs + 42 features + 7 sections from report 03, with storage_strategy assignments.
- [ ] **Task 3.3** — `013_seed_explicit_role_afs_matrix.sql`: explicit role_attributes/features/sections rows from report 04 (every relation an explicit row; no runtime inheritance).
- [ ] **Task 3.4** — `014_seed_placeholder_items.sql`: one placeholder per role, `is_placeholder=true, status=active, visibility=public`, slug `placeholder-{role-key-kebab}`, + `catalog_item_roles` primary link.
- [ ] **Task 3.5** — `015_verify_new_catalog_role_afs_system.sql`: assertion queries (counts: 76 roles, 53 attrs, 42 features, 7 sections, 76 placeholders, each item 1 primary role, no family columns).
- [ ] Local apply to a scratch/branch DB if available; otherwise dry validate. Commit each.

> **CHECKPOINT 3:** Review seed correctness + verification queries. STOP.

---

## PHASE 4 — Backend rewire (RPCs / RLS / edge functions / *-api.ts)  ⟶ CHECKPOINT

- [ ] **Task 4.1** — Pull bodies of the ~100 catalog/role RPCs; classify keep-rewire vs drop-legacy. Write report 07 (backend-integration) mapping each.
- [ ] **Task 4.2** — Rewrite kept RPCs to reference new table names; drop legacy RPCs in `016`. Update triggers (catalog_sync_*, search_document_*).
- [ ] **Task 4.3** — Update edge functions in `supabase/functions/` that touch these tables.
- [ ] **Task 4.4** — Update `src/lib/*-api.ts` (role-catalog.ts, admin-catalog.ts, admin/*, profile-helpers.ts) to new names/RPCs. Regenerate `src/integrations/supabase/types.ts`.
- [ ] **Task 4.5** — Unit tests for changed lib modules (Vitest).

> **CHECKPOINT 4:** Backend green (lint + unit tests). STOP.

---

## PHASE 5 — Frontend rewire (23 files)  ⟶ CHECKPOINT

- [ ] **Task 5.1** — New-member / profile-create: flat role list only (no family/subcategory), dynamic form from `get_role_form_schema`, required/public/owner-editable split. Write report 08.
- [ ] **Task 5.2** — Public profile screen → `get_public_catalog_item_profile` (whitelist only).
- [ ] **Task 5.3** — Owner profile screen → owner RPC + edit perms.
- [ ] **Task 5.4** — Admin profile screen → admin RPC.
- [ ] **Task 5.5** — Build passes (`npm run build`), component tests updated.

> **CHECKPOINT 5:** Frontend builds + tests green. STOP.

---

## PHASE 6 — Admin Database menu + guide + infogram  ⟶ CHECKPOINT

- [ ] **Task 6.1** — Rebuild admin **Veritabanı** menu cards (plan §14): the ~18 new entities, counts/active/placeholder/last-updated. Remove legacy cards. Write report 09.
- [ ] **Task 6.2** — Rewrite `/admin/new-member/guide#rol-listesi` (`src/pages/admin/AdminNewMemberGuidePage.tsx`): flat roles only, AFS catalogs, per-role AFS counts, placeholder count, last migration date (plan §15).
- [ ] **Task 6.3** — Rebuild `docs/roles-infogram.html` (the plan's `rosel-infogram.html`; real path confirmed = `docs/roles-infogram.html`): CATALOG ITEMS → FLAT ROLES → A/F/S, owner/admin vs public views, remove all family/legacy visuals (plan §16).

> **CHECKPOINT 6:** UI reviewed. STOP.

---

## PHASE 7 — E2E + cleanup grep  ⟶ CHECKPOINT

- [ ] **Task 7.1** — DB/public/owner/admin/frontend E2E per plan §18.1–18.5 (incl. negative tests: no email/referral_code/phone_verified/CV/manager/admin-note leakage in public RPC).
- [ ] **Task 7.2** — Repo-wide legacy grep (plan §17 strings: `bireysel|danisman|isletme|kurulus-dernek|blogger-vlogger-youtuber|sehir-elcisi|attribute_catalog|feature_catalog|profile_section_catalog|entity_metadata|role_family|parent_role|subcategory|item_type|role_taxonomy`). Write reports 11 + 13. Runtime code must be clean (migrations/docs may reference for history).

> **CHECKPOINT 7:** All tests green, grep clean. STOP.

---

## PHASE 8 — Drop legacy + remote push  ⟶ HARD GO/NO-GO GATE

- [ ] **Task 8.1** — `016_drop_legacy_schema.sql`: DROP legacy tables/views/RPCs/policies/triggers/types/indexes/FKs + 6 legacy roles + family columns + item_type indirection + role_taxonomy_rules + 0-consumer satellites. Write report 10 (legacy-cleanup-manifest) with per-item before/after.
- [ ] **Task 8.2** — `017_post_cleanup_verification.sql`: final assertions.
- [ ] **Task 8.3 — GO/NO-GO:** Present full diff + manifest. **Explicitly confirm with user before remote push.** Restate: this drops 163 items / 998 attrs / 129 assignments permanently (user already acknowledged).
- [ ] **Task 8.4** — Push: verify remote connection (no token in output), `supabase db push` (or repo's chosen method — detect from repo), apply 001–017. Write report 12.
- [ ] **Task 8.5** — Post-push verification queries against remote; check admin Database menu, public/owner profile screens live. Write report 14 (changed-files).

> **GATE:** No remote push without explicit user GO.

---

## Final acceptance (plan §21)
Run the full §21 checklist; only DONE when all boxes pass: no families/subcategories/parent-child; flat roles; discrepancies resolved+reported; AFS catalogs + explicit matrix; 76 placeholders; no real data migrated; claims/managers wired; public/owner/admin RPCs secure; RLS rewritten; backend+frontend migrated; admin menu + guide + infogram updated; legacy dropped; grep clean; tests+build+E2E green; migrations pushed; remote verified; secrets never leaked.
