# 09 — Admin Database Menu / Guide / Infogram Report (Phase 6)

> **Date:** 2026-06-09 · Phase 6: rebuild the admin-facing surfaces for the flat-role/AFS system.

## 1. AdminNewMemberGuidePage.tsx (`/admin/new-member/guide#rol-listesi`)
- **Removed all role-family logic:** `type RoleFamily`, `getFamilyKey()`, `FAMILY_LABELS`, and the `<div key={group.family}>` grouping. Roles now render as a FLAT list (visual prefix sections allowed, but no family/inheritance concept or DB family column).
- **Updated table-name references** in explanatory copy: `attribute_catalog`→`afs_attributes`, `role_attribute_rules`→`role_attributes`, `feature_catalog`→`afs_features`, `role_feature_flags`→`role_features`, `profile_section_catalog`→`afs_sections`, `role_profile_section_rules`→`role_sections`.
- **Summary header** shows flat role count + AFS counts (76 / 53 / 42 / 7).
- Roles still fetched via `.from("roles")` (roles table not renamed).
- Verify: family refs = 0, old table-name refs = 0 in the file.

## 2. AdminDatabaseTablesPage.tsx (admin "Veritabanı" menu)
- **Renamed** all old table cards to new names (afs_attributes, afs_features, afs_sections, role_attributes, role_features, role_sections, catalog_item_attribute_values, catalog_item_claims, catalog_item_managers).
- **Added new cards:** catalog_item_roles, catalog_item_attribute_overrides, catalog_item_feature_overrides, catalog_item_section_overrides.
- Role copy de-familied (no "aile" wording for roles).
- Verify: old-name entries = 0; new cards present.

## 3. docs/roles-infogram.html
- **Removed family framing** ("82 rol — Ailelere göre gruplanır" → flat "76 bağımsız rol"); prefix headings kept as pure visual sections with explicit "bağımsız, miras yok" copy.
- **Corrected numbers:** 82→76 roles; AFS 53/42/7 made explicit; described v1 = 76 placeholder items, no real-data migration.
- **Removed legacy references:** 6 legacy role keys, "aile"/"parent"/"alt kategori", old table names.
- **Updated table list** to new names (catalog_items, roles, catalog_item_roles, afs_*, role_*, catalog_item_attribute_values, overrides, catalog_item_claims, catalog_item_managers).
- Kept the owner/admin-view vs public-view section.
- HTML well-formed (tags balanced).

## 4. Validation
- `npm run build`: see commit/log (Phase 6 build).
- All three surfaces free of role-family concepts and old table names.

## 5. Note
The new-member guide + DB menu now reflect the flat system. Live row-counts on the DB-menu cards are placeholders until the prod push (Phase 8); they can be wired to live `count(*)` queries as a follow-up.
