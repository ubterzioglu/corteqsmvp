# 05 — New Database Design (catalog / flat-role / AFS)

> **Status:** AWAITING USER APPROVAL. No migration is pushed until this is approved.
> **Date:** 2026-06-09 · **Project:** `injprdrsklkxgnaiixzh`
> Builds on `00-preflight-reconciliation-report.md`. Decisions: full rebuild; rename+rewire all; keep used satellites; phase-by-phase w/ checkpoints; no-backup drop (user-acknowledged).

---

## 1. Product invariants (from plan §1)
- **No role families.** No `family_key`, `parent_role_id`, `category_id`, `subcategory_id`, `inherits_from_role_id`. Every role is independent and flat.
- **No catalog families.** Centre = `catalog_items` + `roles` + `catalog_item_roles`.
- **No real data in v1.** Drop live data; seed only roles + AFS catalogs + explicit matrix + 1 placeholder item per role.
- **No legacy residue** in final state (tables, columns, RPCs, RLS, triggers, enums, indexes, FKs, aliases, fallbacks, frontend queries).

## 2. Final counts (resolved)
| Entity | Count |
|---|---|
| Flat roles | **76** (82 live − 6 legacy) |
| Attributes | **53** |
| Features | 42 |
| Sections | 7 |
| Placeholder items | 76 (one per role) |

## 3. Target schema

### Core
- **`roles`** — `id, key, label, description, is_active, sort_order, created_at, updated_at, deleted_at`. **Removed:** `family_key, parent_role_id, default_item_type, is_system, is_assignable, is_directory_visible, metadata`. (Any still-needed flag moves to an explicit column or `role_features`.)
- **`catalog_items`** — `id, slug, display_name, short_description, country_code, city, status, visibility, is_placeholder (NOT NULL DEFAULT false), is_verified, created_by, created_at, updated_at, deleted_at`. Frequently-filtered fields are real columns (not EAV).
- **`catalog_item_roles`** — `id, catalog_item_id, role_id, is_primary, created_at, updated_at`. `unique(catalog_item_id, role_id)` + partial unique index enforcing one primary per item.

### AFS catalogs (renamed from existing)
- **`afs_attributes`** ← `attribute_catalog`. Cols: `id, key, label, description, data_type, storage_strategy (core_column|dynamic_value|computed|private_storage), storage_key, default_visibility, is_active, validation_schema, …`.
- **`afs_features`** ← `feature_catalog`. Cols: `id, key, label, description, is_globally_enabled, default_visibility, is_active, …`.
- **`afs_sections`** ← `profile_section_catalog`. Cols: `id, key, label, description, section_area, component_key, default_visibility, is_active, …`.

### Role↔AFS relations (renamed, explicit rows — no inheritance)
- **`role_attributes`** ← `role_attribute_rules` — `unique(role_id, attribute_id)`, `is_required, is_public, owner_can_edit, admin_can_edit, visibility, sort_order`.
- **`role_features`** ← `role_feature_flags` — `unique(role_id, feature_id)`, `is_enabled, visibility`.
- **`role_sections`** ← `role_profile_section_rules` — `unique(role_id, section_id)`, `is_enabled, visibility, sort_order`.

### Item values + overrides (exist; align names)
- `catalog_item_attribute_values` ← `catalog_item_attributes` (typed value cols + `visibility_override`).
- `catalog_item_attribute_overrides`, `catalog_item_feature_overrides`, `catalog_item_section_overrides` (already exist).

### Claims + managers (exist; align names)
- `catalog_item_claims` ← `catalog_claim_requests` (`status: pending|approved|rejected|cancelled`).
- `catalog_item_managers` ← `catalog_item_memberships` (`manager_role: owner|admin|editor|moderator`).

## 4. Teardown targets (genuine legacy)
Drop: `catalog_item_types`, `item_type_attribute_rules`, `item_type_feature_defaults`, `item_type_features`, `role_taxonomy_rules`, `entity_metadata` (if unused), the 6 legacy role rows, family columns on `roles`, and all legacy RPCs/RLS/triggers referencing them. Old `_bak_*` tables retained as historical (out of scope to drop).

## 5. Satellite tables — keep/drop (FINALIZED in report 06)
Functional consumers: `DirectoryCatalogItemPage.tsx`, `admin-catalog.ts`, `admin-profile-api.ts` (NOT `AdminDatabaseTablesPage.tsx`, which only lists table names).
- **KEEP (functional consumers):** `catalog_search_documents`, `catalog_item_media`, `catalog_item_contacts`, `catalog_item_links`, `catalog_item_locations`, `catalog_item_services`, `catalog_item_languages`, `catalog_item_categories` (+ `catalog_categories`).
- **DROP (0 functional consumers):** `catalog_item_reviews`, `catalog_item_reports`, `catalog_item_tags`, `catalog_item_relations`, `catalog_item_favorites`, `catalog_audit_logs`, `catalog_item_verification_records`, `entity_metadata`.

## 6. Visibility & RLS (plan §5)
Levels: `public, authenticated, owner, editor, admin, internal`. Public RPCs are whitelist-only (no `select *`). Never expose: `requester_email`, claim details, manager list, admin/moderation notes, audit logs, private CV/presentation docs, `referral_code`, `phone_verified`, internal attrs/features, draft fields.
RPCs: `get_public_catalog_item_profile(slug)`, `get_owner_catalog_item_profile(id)`, `get_admin_catalog_item_profile(id)`, `get_catalog_item_form_schema(id)`, `get_role_form_schema(role_id)`, `get_flat_roles()`.

## 7. Migration sequence (plan §11) — staged, reversible per phase
`001_preflight_inventory` · `002_catalog_items` · `003_flat_roles` · `004_afs_catalogs` · `005_role_afs_relations` · `006_item_values_overrides` · `007_claims_managers` · `008_indexes_constraints_triggers` · `009_rls_policies` · `010_public_owner_admin_rpc` · `011_seed_flat_roles` · `012_seed_afs_catalogs` · `013_seed_explicit_role_afs_matrix` · `014_seed_placeholder_items` · `015_verify_new_system` · `016_drop_legacy_schema` · `017_post_cleanup_verification`.
No `_v2/_new/_temp/_legacy` names survive. Rename-collision handled per plan §11 (build under safe names → rewire → drop old → rename → retest).

## 8. Blast radius (grep-confirmed)
- Renamed-table refs in frontend/lib: **84 across 23 files** (admin pages, `profile-helpers.ts`, `role-catalog.ts`, `AuthProvider.tsx`, messaging, `cadde.ts`).
- Satellite refs: 344 across 30 files (mostly SQL migrations; few runtime).
- Plus RPCs, RLS, edge functions, admin Database menu, `/admin/new-member/guide`, `docs/roles-infogram.html` (← plan's `rosel-infogram.html`).

## 9. Phase plan (execution, with checkpoints)
1. **Reports** — finish 01–04 (audit, role inv, AFS inv, explicit matrix) + 06 ER diagram. *Checkpoint.*
2. **Schema migrations** (002–010) authored + locally validated. *Checkpoint.*
3. **Seeds** (011–014) + verify (015). *Checkpoint.*
4. **Backend rewire** — RPCs/RLS/edge fns/`*-api.ts` to new names. *Checkpoint.*
5. **Frontend rewire** — 23 files: new-member form, public/owner/admin profile, role select (flat only). *Checkpoint.*
6. **Admin Database menu + guide + infogram** rebuild. *Checkpoint.*
7. **E2E + cleanup grep** (reports 11, 13). *Checkpoint.*
8. **Drop legacy (016) + prod push (019 process)** — **explicit go/no-go before destructive remote push.**
9. **Post-migration verification (017)** + final reports (07–14).

## 10. Open items to finalize before push
- [ ] Report 01–04 + 06 written.
- [ ] Satellite keep/drop list confirmed per-table (0-consumer check).
- [ ] Attribute normalization-duplicate mapping (report 03) — no auto-delete.
- [ ] Secret rotation recommendation acknowledged (`sbp_` token).
