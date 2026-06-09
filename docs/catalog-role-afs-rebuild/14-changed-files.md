# 14 — Changed Files (Rebuild)

> **Date:** 2026-06-09 · Files changed by the catalog/flat-role/AFS rebuild on branch `rebuild/catalog-flat-role-afs`.
> (Excludes unrelated UI commits the user asked to ignore — e.g. legacy Navbar removal.)

## Migrations — new (18 rebuild + 4 replay-fixes to existing)
**New rebuild migrations:**
- `20260609100000_rebuild_002_catalog_items.sql`
- `20260609100100_rebuild_003_flat_roles.sql`
- `20260609100200_rebuild_004_afs_catalogs.sql`
- `20260609100300_rebuild_005_role_afs_relations.sql`
- `20260609100400_rebuild_006_item_values_and_overrides.sql`
- `20260609100500_rebuild_007_claims_and_managers.sql`
- `20260609100600_rebuild_008_item_roles_indexes_constraints.sql`
- `20260609100700_rebuild_009_rls_policies.sql`
- `20260609100800_rebuild_010_public_owner_admin_rpc.sql`
- `20260609100900_rebuild_010c_backend_rewire.sql` (40 fns)
- `20260609100901_rebuild_010d_fix_user_profiles_leftovers.sql` (4 fns)
- `20260609101450_rebuild_010e_fix_user_profiles_leftovers_2.sql` (9 fns)
- `20260609101000_rebuild_011_seed_flat_roles.sql`
- `20260609101100_rebuild_012_seed_afs_catalogs.sql`
- `20260609101200_rebuild_013_seed_role_afs_matrix.sql`
- `20260609101300_rebuild_014_seed_placeholder_items.sql`
- `20260609101400_rebuild_015_verify_system.sql`
- `20260609101500_rebuild_016_drop_legacy_schema.sql`
- `20260609101600_rebuild_017_post_cleanup_verification.sql`

**Pre-existing migrations edited (replay-safety fixes, no-op on prod):**
- `20260423140000_reduce_referral_validation_leakage.sql`
- `20260604103000_catalog_seed_item_types_taxonomy_features.sql`
- `20260609031000_referral_wa_grant_hardening.sql`
- `20260609033000_add_missing_fk_indexes.sql`

## Frontend (src) — rewired for renamed tables
- `src/integrations/supabase/types.ts` (regenerated, 2386→8861 lines)
- `src/lib/role-catalog.ts`, `src/lib/admin-catalog.ts`, `src/lib/profile-helpers.ts`, `src/lib/cadde.ts`
- `src/components/auth/AuthProvider.tsx`, `src/components/messaging/MessagesInbox.tsx`
- `src/pages/admin/AdminAttributesPage.tsx`, `AdminProfileSectionsPage.tsx`, `AdminRolesFeaturesPage.tsx`, `AdminRolesOverviewPage.tsx`, `AdminUserOverridesPage.tsx`, `AdminApprovalsPage.tsx`, `AdminAuditLogsPage.tsx`, `AdminWhatsAppLandingEditorsPage.tsx`
- `src/pages/admin/AdminNewMemberGuidePage.tsx` (flat roles, family logic removed)
- `src/pages/admin/AdminDatabaseTablesPage.tsx` (new table cards)
- Tests: `MessagesInbox.test.tsx`, `AdminAttributesPage.test.tsx`

## Static assets
- `docs/roles-infogram.html` (flat, family framing removed)

## Reports (docs/catalog-role-afs-rebuild/)
00 preflight · 01 audit · 02 flat-role-inventory · 03 afs-catalog-inventory · 04 role-afs-matrix · 05 design · 06 ER-diagram · 07 backend-integration · 08 frontend-integration · 09 admin-database-menu · 10 legacy-cleanup-manifest · 11 e2e-test · 12 migration-push · 13 post-cleanup-grep · 14 changed-files · _phase2-live-structure-notes · _RESUME-HERE · _phase4_rewire.py · _push_to_prod.sh

## Not touched (deliberate)
- Landing/marketing submission-category strings (`danisman`/`isletme`/`bireysel` in CategoriesSection, InterestForm, RegisterInterestForm, Founding1000Section, chatConfig) — bound to `submissions`, not RolesGo (report 13 §3).
- `catalog_items.title`, `catalog_item_managers.role` columns — rename reverted.
- All satellite tables — kept (Checkpoint 1).
