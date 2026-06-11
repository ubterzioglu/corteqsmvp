# Catalog Schema Audit

## Existing Schema Audit

Detected existing auth/profile primitives:
- `public.profiles`
- `public.user_profiles`
- `public.roles`
- `public.user_role_assignments`
- `public.feature_catalog`
- `public.role_feature_defaults`
- `public.role_feature_flags`
- `public.user_feature_overrides`
- `public.attribute_catalog`
- `public.user_profile_attributes`
- `public.approval_requests`
- `public.admin_audit_logs`

Detected existing searchable/public record tables:
- `public.events`
- `public.job_listings`
- `public.whatsapp_landings`
- `public.independent_profiles`
- `public.turkish_missions`

Detected reusable supporting structures:
- `public.admin_users`
- `public.individual_profile_details`
- `public.taxonomy_groups`
- `public.taxonomy_options`
- `public.list_public_directory_profiles(...)`

## Naming Collisions and Reuse Notes

- `profiles` and `user_profiles` both describe authenticated users and both had auth signup triggers.
- Legacy `app_role` / `user_roles` still exist alongside the newer `roles` / `user_role_assignments` model.
- Public entity data is fragmented across legacy tables instead of one canonical catalog base.
- Existing `feature_catalog` and `taxonomy_*` support the member-profile system and are intentionally not reused as the new catalog taxonomy or capability tables.

## Migration Risks

- Tightening `profiles` RLS immediately would break current frontend reads that still query `profiles` directly.
- Legacy source tables remain active in application code, so catalog sync must be additive and trigger-based.
- `turkish_missions` and `independent_profiles` can describe the same institution and require duplicate review rather than auto-merge.
- Semantic search and geospatial search need optional extensions and must not block baseline deployment.

## Architecture Summary

- `auth.users` remains the sole authentication source.
- `public.profiles` becomes the canonical app-level identity profile.
- `public.catalog_items` becomes the universal searchable record.
- `public.catalog_item_memberships` stores record-level ownership and management.
- `public.catalog_claim_requests` handles deferred ownership claims.
- `public.catalog_search_documents` becomes the unified public search projection.
- Legacy tables remain in place and sync into catalog tables through deterministic bridge functions.

## Migration Plan Snapshot

1. Expand `profiles`, unify auth-to-profile sync, and backfill platform roles and directory opt-in.
2. Create new `catalog_*` base tables plus type-specific extension tables.
3. Seed item types, taxonomy categories, and item-type capabilities.
4. Apply RLS and claim-review RPCs.
5. Add bridge functions and triggers from legacy tables into the catalog.
6. Backfill current legacy data into catalog tables.
7. Build unified search projection and search refresh logic.
8. Publish the `search_catalog(...)` RPC.
9. Add optional PostGIS support.
10. Add optional pgvector embedding scaffolding.
