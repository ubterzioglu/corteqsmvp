# Catalog Rollback Notes

## Principle

These catalog migrations are forward-only. Do not edit or delete already-applied migration files. Rollback should happen by applying a new migration that disables the new surfaces while preserving data for recovery.

## Recommended Rollback Order

1. Disable application reads from `search_catalog(...)`.
2. Revoke execute on `search_catalog(...)`, `submit_catalog_claim_request(...)`, `review_catalog_claim_request(...)`, and `update_catalog_item_editor_content(...)`.
3. Drop or disable catalog sync triggers on legacy tables if they are causing unexpected writes.
4. Stop rebuilding `catalog_search_documents`.
5. Archive or rename newly created catalog objects only after data export or backup.

## Low-Risk Emergency Disable Actions

- Revoke execute from `anon` and `authenticated` on `search_catalog(...)`.
- Set all `catalog_items.status` to `draft` for a specific source batch if accidental publication is detected.
- Disable bridge triggers with `alter table ... disable trigger ...` before investigating bad sync behavior.
- Revoke `authenticated` DML grants from new catalog tables if editor workflows misbehave.

## Data Preservation Notes

- `source_records` is the recovery map from catalog rows back to legacy source rows.
- `duplicate_candidates` and `merge_history` should not be dropped before operational review.
- `catalog_claim_requests` and `catalog_audit_logs` preserve approval history and should be retained even if public search is rolled back.

## Final Hardening Deferred On Purpose

`public.profiles` public-read behavior was intentionally not tightened in this batch because the current frontend still reads it directly. The future hardening order should be:

1. move frontend public lookups to a safe public view or RPC,
2. validate those consumers in production,
3. then reduce `profiles` to self-read only.
