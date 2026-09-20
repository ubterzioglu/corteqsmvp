# Catalog Manual Dashboard Checklist

## Before Applying

- Confirm a fresh backup or point-in-time recovery window exists.
- Check that the project has enough extension allowance for `pg_trgm`, `unaccent`, and optional `vector` / `postgis`.
- Verify service-role ingestion jobs are the only callers that should write ownerless imported records.

## After Applying Base Catalog Migrations

- Open Table Editor and confirm new `catalog_*` tables and extension tables exist.
- Confirm `profiles.platform_role` and `profiles.directory_opt_in` were backfilled as expected.
- Check that only one auth-to-profile trigger remains active on `auth.users`.
- Spot-check `source_records` for each legacy source family after backfill.

## Search Validation

- Run `search_catalog(...)` in SQL Editor for:
  - business-only filters
  - cross-type filters
  - verified-only filters
  - empty-query browse mode
- Confirm person profiles do not appear when `directory_opt_in = false`.
- Confirm private contacts do not appear in results.

## Claim Workflow Validation

- Submit a test claim as an authenticated non-admin user.
- Review it as a moderator/admin account.
- Confirm owner membership was created and audit logs were written.

## Optional Extension Validation

- If PostGIS is enabled, verify `catalog_item_locations.geo` is populated for rows with latitude/longitude.
- If pgvector is enabled, verify `catalog_search_documents.embedding` exists and the setter RPC is service-role only.

## Deferred Follow-Up

- Regenerate typed Supabase client definitions after these migrations are applied to an environment.
- Migrate frontend public reads away from direct `profiles` usage before tightening `profiles` RLS.
