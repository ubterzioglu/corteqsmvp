# 07 — Backend Integration Report (Phase 4)

> **Date:** 2026-06-09 · Phase 4 of the catalog/flat-role/AFS rebuild.
> Goal: rewire every backend (DB functions) + frontend data-access reference from the old table/column names to the renamed schema, with no compatibility shims left.

## 1. Strategy decision (Checkpoint)
- **Tables renamed** (physical `ALTER TABLE RENAME`, FK graph preserved): see map below.
- **Columns NOT renamed** — `catalog_items.title` and `catalog_item_managers.role` are KEPT. Renaming these two columns would have broken 13 + 7 functions across too many syntactic forms (`ci.title`, `v_item.title`, bare `title` in UPDATE/INSERT, `m.role`, RETURNS TABLE output columns). Reverting the two column renames removed that entire brittle class of edits while still satisfying the product goal (flat roles, no families, renamed catalogs). Migration 010b (a write-path title fix) was consequently deleted as unnecessary.

### Table rename map
| Old | New |
|---|---|
| attribute_catalog | afs_attributes |
| feature_catalog | afs_features |
| profile_section_catalog | afs_sections |
| role_attribute_rules | role_attributes |
| role_feature_flags | role_features |
| role_profile_section_rules | role_sections |
| catalog_item_attributes | catalog_item_attribute_values |
| catalog_claim_requests | catalog_item_claims |
| catalog_item_memberships | catalog_item_managers |

## 2. DB function rewire (44 functions)
- **Migration 010c** (`20260609100900_rebuild_010c_backend_rewire.sql`): 40 functions rewired **programmatically** — `pg_get_functiondef` pulled from the local DB, transformed by `_phase4_rewire.py` with SAFE word-boundary table-name substitution only (no column edits), re-emitted as `create or replace`. Generator verified: zero old table names leaked into function bodies (only comments).
- **Migration 010d** (`20260609100901_rebuild_010d_fix_user_profiles_leftovers.sql`): 4 functions hand-repaired because they referenced the **dropped** `public.user_profiles` / `public.profiles` tables (legacy-drop leftovers that migration `20260609003000` fixed for siblings but missed):
  - `update_profile_avatar` — removed `profiles`/`user_profiles` avatar writes; kept the `user_profile_attributes` (profile_photo_url) upsert.
  - `admin_update_user_profile_attribute` — `full_name` branch routed to `user_profile_attributes`.
  - `admin_review_approval_request` — `full_name` branch routed to `user_profile_attributes`.
  - `get_public_profile_sections` — `profile_type`/`full_name` sourced from `user_role_assignments`+`roles` / `user_profile_attributes`.
- **`catalog_upsert_owner_membership`** — `public.profiles` existence check → `auth.users`.

## 3. Frontend data-access rewire
- **`.from("<old>")` calls** — 18 occurrences across 7 files (`lib/role-catalog.ts`, `lib/admin-catalog.ts`, `AdminAttributesPage`, `AdminProfileSectionsPage`, `AdminRolesFeaturesPage`, `AdminRolesOverviewPage`, `AdminUserOverridesPage`) → renamed.
- **PostgREST embedded-join refs** (`attribute_catalog!inner(key)`, `.in/.eq("attribute_catalog.key", …)`) — 24 occurrences across 7 files (`lib/profile-helpers.ts`, `lib/cadde.ts`, `components/auth/AuthProvider.tsx`, `components/messaging/MessagesInbox.tsx`, `AdminApprovalsPage`, `AdminAuditLogsPage`, `AdminWhatsAppLandingEditorsPage`) → `afs_attributes`.
- **Edge functions** (`supabase/functions/**`) — scanned, zero old-name references.
- **`src/integrations/supabase/types.ts`** — regenerated from local DB (`supabase gen types typescript --local`): 2386 → 8861 lines, all old table names gone, new names present. (Also resolves the long-standing "types out of sync / ~164 tsc errors" debt.)

## 4. Validation
- Full local `supabase start` replays all migrations; migration 015 emits `Rebuild verification PASSED: 76 roles, 53/42/7 AFS, 76 placeholders, explicit matrix.`
- `npm run build`: **PASS** (`✓ 2858 modules transformed`, built ~70s). (vite-plugin-image-optimizer prints non-fatal image warnings.)
- Remaining old-name references in `src` (runtime): **zero** outside `types.ts` (regenerated), `*.test.tsx` (Phase 7), and `AdminDatabaseTablesPage`/`AdminNewMemberGuidePage` (Phase 6 admin menu/guide — intentionally deferred).

## 5. Deferred to later phases
- Test files (`*.test.tsx`) referencing old names → Phase 7.
- `AdminDatabaseTablesPage.tsx` (DB browser) + `AdminNewMemberGuidePage.tsx` (guide) → Phase 6 (full rebuild of admin DB menu + guide).
- Post-rebuild-build type regressions (if any from the richer regenerated types) → tracked by build result below.
