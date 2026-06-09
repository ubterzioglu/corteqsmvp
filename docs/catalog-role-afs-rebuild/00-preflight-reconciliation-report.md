# 00 — Preflight Reconciliation Report

> **Status:** Discrepancies RESOLVED against live DB. Destructive remote push BLOCKED pending approved design.
> **Date:** 2026-06-09
> **Repo:** `corfin-mvp` (remote `github.com/corteqssocial-web/corfin-mvp`)
> **Supabase project:** `injprdrsklkxgnaiixzh` ("corteqs project", West Europe / London)
> **Access:** read-only introspection via Supabase Management API (CLI token from `.secretdb`; never logged/committed)

---

## 0. Executive summary

The master plan assumes a greenfield teardown of an *old role-family system*. The live database tells a different story: a **flat-role AFS system already exists in production** (built via migrations `20260607010000_afs_phase0…` through `20260609060000`), the legacy tables were *already* dropped, and the reference catalog was generated *from this live DB* on 2026-06-09.

Both numeric discrepancies the plan flagged as push-blockers are now **resolved against live data**:

| Discrepancy | Plan expectation | Live DB truth | Resolution |
|---|---|---|---|
| Role count (76 vs 82) | 82 rows incl. 6 legacy → 76 clean | `roles` = **82** rows = 76 real + 6 legacy (all 6 legacy keys present) | **Final = 76.** Drop 6 legacy. No phantom replacement roles exist. |
| Attribute count (55 vs 53) | header says 55, list shows 53 | `attribute_catalog` = **53** rows | **Final = 53.** The "55" is a stale header/title; there are no 2 missing attributes. |

Features = **42** (matches plan). Sections = **7** (matches plan).

**Both push-blockers are cleared.** The remaining blocker is procedural: brainstorming hard-gate + plan §22 require an approved design before any destructive migration.

---

## 1. Live schema inventory (catalog / role / AFS surface)

### 1.1 Core tables (exist today)
`catalog_items`, `catalog_item_types`, `roles`, `attribute_catalog`, `feature_catalog`, `profile_section_catalog`, `entity_metadata`, `feature_definitions`, `catalog_categories`.

### 1.2 Role↔AFS relation tables (exist + populated)
| Table | Rows | Role in plan |
|---|---|---|
| `role_attribute_rules` | 1,977 | = plan's `role_attributes` |
| `role_feature_flags` | 2,487 | = plan's `role_features` |
| `role_profile_section_rules` | 574 | = plan's `role_sections` |
| `role_taxonomy_rules` | — | taxonomy (no plan equivalent; legacy candidate) |
| `item_type_attribute_rules`, `item_type_feature_defaults`, `item_type_features` | — | item-type indirection layer (legacy candidate) |

> The "explicit role↔AFS matrix" the plan asks me to *build* **already exists** as ~5,038 live rows. Under full-rebuild it will be dropped and reseeded.

### 1.3 Item value / override tables (exist)
`catalog_item_attributes` (values), `catalog_item_attribute_overrides`, `catalog_item_feature_overrides`, `catalog_item_section_overrides`.

### 1.4 Claims / managers (exist)
`catalog_claim_requests` (1 row), `catalog_item_memberships`, `catalog_item_verification_records`.

### 1.5 Satellite catalog_item_* tables (exist — ~18)
`catalog_item_contacts`, `_links`, `_locations`, `_media`, `_languages`, `_categories`, `_services`, `_tags`, `_relations`, `_reviews`, `_reports`, `_favorites`, `catalog_audit_logs`, `catalog_search_documents`.

### 1.6 User-facing identity tables (exist — live data)
`user_role_assignments` (129), `user_profile_attributes` (998), `user_feature_overrides`.

### 1.7 Backups present
- `_member_backup_20260609` — **only 14 rows**, auth/profile snapshot (auth_user_id, full_name, profile_type, business_*, is_admin…). Does NOT cover catalog_items/attribute values.
- `_bak_org_*_20260609` (8 tables) — old org-import set (482 items). Not a 1:1 snapshot of current 163 live items.

---

## 2. Legacy / family-system residue detected

The plan forbids family columns. Live `roles` table currently HAS:
- `family_key text`
- `parent_role_id uuid`
- plus `default_item_type`, `is_system`, `is_assignable`, `is_directory_visible`, `metadata jsonb`

And 6 legacy role rows: `bireysel`, `danisman`, `isletme`, `kurulus-dernek`, `blogger-vlogger-youtuber`, `sehir-elcisi`.

Plus indirection layers that act like an item-type→role family mapping: `catalog_item_types`, `item_type_attribute_rules`, `item_type_feature_defaults`, `item_type_features`, `role_taxonomy_rules`.

**These are the genuine teardown targets.** (Not "catalogs→families→roles" as the plan imagined — that exact shape is not present — but a functionally equivalent item-type indirection + family columns.)

---

## 3. Discrepancy #1 — role count (RESOLVED)

- Live `roles`: 82 rows. Enumerated keys confirm exactly the 6 legacy keys + 76 new flat keys from §7.2 of the plan.
- No role exists in the live DB that is "new but missing from the reference." No duplicate-key-under-different-casing roles found.
- No approved replacement roles exist for the 6 legacy ones beyond the already-present new equivalents (e.g. `User_CityAmbassador` already exists alongside legacy `sehir-elcisi`).

**Final independent role count = 76.** Migration push is NOT blocked by this discrepancy.

---

## 4. Discrepancy #2 — attribute count (RESOLVED)

- Live `attribute_catalog`: exactly **53** rows. Enumerated keys match the plan's §8 list of 53 one-for-one.
- The reference markdown header literally says "Attribute Kataloğu (55)" but its own table lists 53 — and the live DB it was generated from has 53.

**Conclusion:** "55" is a stale/erroneous count in the header. There are no 2 hidden/soft-deleted/UI-filtered attributes. **Final attribute count = 53.** Migration push is NOT blocked by this discrepancy.

> Potential *normalization* duplicates flagged by plan §8 (e.g. `avatar_url` vs `profile_photo_url`, `cv_path`/`cv_name` vs `cv_doc`, `address` vs `physical_address`, `business_website` vs `website_url`) are real and will be addressed in the AFS catalog design (report 03) with an explicit mapping — NOT auto-deleted.

---

## 5. Data-loss / backup finding (CRITICAL — decided)

A literal full rebuild drops live data with NO adequate backup:

| Table | Rows at risk | Existing backup |
|---|---|---|
| `catalog_items` | 163 | partial only (`_bak_org` = different 482-row set) |
| `user_role_assignments` | 129 | none |
| `user_profile_attributes` | 998 | none |
| role↔AFS relations | 5,038 | none (reseedable) |

The plan's premise "yedeği ayrıca alınmıştır" is **FALSE** for this data — verified, not assumed.

**Decision (user, explicit, 3× confirmed):** proceed with no-backup drop; user has acknowledged permanent, unrecoverable loss of the 163 items / 998 attributes / 129 assignments and accepted responsibility. Recorded here for audit trail.

---

## 6. Push gate status

| Gate | Status |
|---|---|
| Discrepancy #1 (roles 76) | ✅ resolved |
| Discrepancy #2 (attrs 53) | ✅ resolved |
| Backup of live data | ⚠️ none; user accepted loss |
| Approved design (brainstorming gate + plan §22) | ⛔ **PENDING** — required before any drop/push |
| Secret hygiene (`.secretdb` gitignored, token not logged) | ✅ confirmed (line 86); ⚠️ recommend token rotation (was surfaced in shell once) |

**No remote migration will be pushed until the design in `05-new-database-design.md` is approved by the user.**
