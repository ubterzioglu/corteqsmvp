# 10 — Legacy Cleanup Manifest (Phase 8)

> **Date:** 2026-06-09 · Migration `016_drop_legacy_schema` + `017_post_cleanup_verification`.
> Per Checkpoint-1: **all satellite tables KEPT**; only role-family / item-type indirection legacy is dropped.

## Dropped elements

| Component | Type | Why legacy | New equivalent | Drop method |
|---|---|---|---|---|
| `catalog_item_types` | table | role→item_type family indirection | flat `roles` + `catalog_item_roles` | `drop table cascade` (016) |
| `item_type_attribute_rules` | table | item-type→attribute indirection | `role_attributes` (explicit per role) | `drop table cascade` |
| `item_type_feature_defaults` | table | item-type→feature indirection | `role_features` | `drop table cascade` |
| `item_type_features` | table | item-type→feature indirection | `role_features` | `drop table cascade` |
| `role_taxonomy_rules` | table | taxonomy/family grouping | (none — flat) | `drop table cascade` |
| 6 legacy role rows | data | old generic roles | replaced by flat `User_*` etc. | `delete from roles` (verified 0 `catalog_item_roles` refs) |
| `catalog_items_item_type_fkey` | FK | pointed at dropped `catalog_item_types` | `item_type` kept as free text | `drop constraint` |
| `catalog_categories_module_fkey` | FK | pointed at dropped `catalog_item_types` | `module` kept as free text | `drop constraint` |
| `admin_upsert_role_taxonomy_rule` | function | operated on `role_taxonomy_rules` | (none) | `drop function cascade` |

## Renamed (not dropped) — recorded for completeness
attribute_catalog→afs_attributes, feature_catalog→afs_features, profile_section_catalog→afs_sections, role_attribute_rules→role_attributes, role_feature_flags→role_features, role_profile_section_rules→role_sections, catalog_item_attributes→catalog_item_attribute_values, catalog_claim_requests→catalog_item_claims, catalog_item_memberships→catalog_item_managers.

## Reverted (kept original name) — Checkpoint decision
- `catalog_items.title` (NOT → display_name) — column rename would break 13 functions.
- `catalog_item_managers.role` (NOT → manager_role) — column rename would break 7 functions.

## Explicitly KEPT (Checkpoint-1: keep all satellites)
catalog_item_media, _contacts, _links, _locations, _services, _languages, _categories, _reviews, _reports, _tags, _relations, _favorites, catalog_audit_logs, catalog_item_verification_records, catalog_search_documents, entity_metadata, catalog_categories.

## Verification (017)
`Post-cleanup verification PASSED: 76 roles (0 legacy), no family residue, 53/42/7 AFS, 76 placeholders, item_type FK dropped.`

## Data-loss note
This rebuild keeps real `catalog_items`/`user_*` data on the live DB (renames preserve data); only legacy indirection tables + 6 unused legacy role rows are dropped. (The plan's "drop all real data, placeholders only" §1.3 was NOT applied to live user data — see report 00 §5; the user-acknowledged no-backup drop concerned a path that the rename-based strategy ultimately avoided, since renames preserve rows. Placeholders were ADDED alongside existing data, not as a replacement.)
