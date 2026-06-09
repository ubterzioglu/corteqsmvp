# 01 — Current System Audit

> **Date:** 2026-06-09 · **Project:** `injprdrsklkxgnaiixzh` · Source: live DB read-only introspection (Management API).
> Companion to `00-preflight-reconciliation-report.md`. Verdicts per approved design `05`.

## 1. Scope counts (live)
- Catalog/role/AFS-related tables: ~45 (+ 9 `_bak*` backups)
- RPC functions touching catalog/role/AFS: **~100**
- Triggers on these tables: **62**
- RLS-protected tables: **39** (~80 policies)

## 2. Table inventory + verdict (KEEP / RENAME / DROP)

### Core
| Table | Rows | Verdict | Note |
|---|---|---|---|
| `roles` | 82 | **KEEP (alter)** | strip `family_key`,`parent_role_id`,`default_item_type`,`is_system`,`is_assignable`,`is_directory_visible`,`metadata`; drop 6 legacy rows → 76 |
| `catalog_items` | 163 | **KEEP (rebuild shape)** | add `is_placeholder`; reseed placeholders only |
| `catalog_item_types` | — | **DROP** | family/indirection layer (forbidden) |
| `entity_metadata` | — | **DROP** if unused | confirm 0 consumers |
| `catalog_categories` | — | **DROP** | taxonomy indirection |

### AFS catalogs (RENAME)
| From | To | Rows |
|---|---|---|
| `attribute_catalog` | `afs_attributes` | 53 |
| `feature_catalog` | `afs_features` | 42 |
| `profile_section_catalog` | `afs_sections` | 7 |
| `feature_definitions` | merge/DROP | confirm vs feature_catalog |

### Role↔AFS relations (RENAME)
| From | To | Rows |
|---|---|---|
| `role_attribute_rules` | `role_attributes` | 1,977 |
| `role_feature_flags` | `role_features` | 2,487 |
| `role_profile_section_rules` | `role_sections` | 574 |
| `role_taxonomy_rules` | **DROP** | taxonomy (no plan equivalent) |

### Item-type indirection (DROP — all)
`item_type_attribute_rules`, `item_type_feature_defaults`, `item_type_features`.

### Values + overrides (KEEP/align)
`catalog_item_attributes`→`catalog_item_attribute_values`; `catalog_item_attribute_overrides`, `catalog_item_feature_overrides`, `catalog_item_section_overrides` (KEEP).

### Claims + managers (RENAME)
`catalog_claim_requests`→`catalog_item_claims` (1 row); `catalog_item_memberships`→`catalog_item_managers`.

### Satellites (verdict finalized in report 06; trigger dependency noted)
`catalog_search_documents` (+ its triggers from every satellite) — **KEEP** (directory search). `catalog_item_media/_contacts/_links/_locations` — KEEP pending consumer check. `catalog_item_reviews/_reports/_services/_tags/_relations/_languages/_categories/_favorites/catalog_audit_logs`, `catalog_item_verification_records` — DROP-candidates pending 0-consumer check.

### User identity (KEEP — rewire only)
`user_role_assignments` (129), `user_profile_attributes` (998), `user_feature_overrides`.

## 3. RPC inventory (grouped; ~100 fns)
- **Public/whitelist:** `get_catalog_item_public_profile`, `get_public_directory_profile`, `get_public_independent_profile`, `get_public_profile_sections`, `list_public_directory_profiles`, `search_catalog`, `search_directory_catalog`, `catalog_item_is_publicly_visible`.
- **Owner/self:** `get_current_member_catalog_profile`, `get_current_user_profile`, `get_my_editable_catalog_items`, `update_profile_attribute`, `update_profile_avatar`, `update_catalog_item_attribute`, `submit_catalog_claim_request`, `set_current_member_catalog_role`.
- **Admin:** ~36 `admin_*` fns (set/upsert/delete attribute & feature & section overrides, claims approve/reject, editor grant/revoke, role set/change, search/list profiles).
- **Access checks:** `can_view/edit/administer_catalog_item`, `catalog_user_can_edit/manage_item`, `can_manage_catalog_item_editors`.
- **Triggers/sync (internal):** `catalog_sync_*` (event, job_listing, independent_profile, whatsapp_landing, turkish_mission, member_visibility, location_geo), `catalog_search_document_*`, `sync_member_catalog_role_*`, `sync_user_profile_role_from_catalog`, `handle_new_auth_user_role`.
- **Verdict:** keep+rewire public/owner/admin/access fns to new table names (report 07); DROP fns bound to item_type/taxonomy/legacy.

## 4. Triggers (62) — categories
- `*_updated_at` BEFORE UPDATE on nearly every table (KEEP pattern, re-point to new tables).
- `trg_catalog_search_document_*` AFTER I/U/D on items + satellites → rebuild search doc (KEEP if satellite kept).
- `trg_catalog_sync_member_visibility` on feature overrides (KEEP, rewire).
- `trg_sync_user_profile_role_from_catalog` on catalog_items; `trg_sync_member_catalog_role_from_user_role_assignments` on user_role_assignments; `trg_sync_individual_public_profile_settings_from_attribute` on user_profile_attributes — KEEP, rewire.
- Triggers on `item_type_*` and taxonomy — DROP with their tables.

## 5. RLS policies (~80) — highlights
- `catalog_items`=7, `catalog_claim_requests`=4, `catalog_item_attributes`/`_feature_overrides`/`_memberships`/`_reports`/`_reviews`=3 each.
- Catalogs (`attribute_catalog`/`feature_catalog`/`profile_section_catalog`/`roles`)=1 each (likely public-read).
- **Verdict:** all rewritten from scratch in migration `009` per design §6 visibility levels; do NOT carry old policies forward.

## 6. Legacy residue summary (teardown targets)
1. `roles.family_key`, `roles.parent_role_id` (+ other non-plan columns)
2. 6 legacy role rows
3. `catalog_item_types` + `item_type_attribute_rules` + `item_type_feature_defaults` + `item_type_features`
4. `role_taxonomy_rules`, `catalog_categories`, `entity_metadata` (if unused)
5. legacy/indirection RPCs + their triggers
6. old RLS policies (replaced wholesale)
