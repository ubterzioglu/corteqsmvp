# CorteQS — Database Data Dictionary

**Project:** CorteQS Supabase (`injprdrsklkxgnaiixzh`)
**Schema scope:** `public`
**Snapshot date:** 2026-06-09
**Source of truth:** the live production database (read-only metadata read). This document is **documentation only** — it makes no DB changes.

---

## 1. Introduction & Methodology

This dictionary is a scannable, module-by-module catalog of the CorteQS production database as it actually exists on **2026-06-09**, derived from a read-only inspection of live `pg_catalog` / `information_schema` metadata plus the `supabase gen types` output. Where the committed source tree disagrees with the live DB, **the live DB wins** (see the type-drift note in §7).

### Live state at a glance

| Object class | Count |
|---|---|
| Public base tables | **154** |
| Views | **6** (4 application: `v_muhasebe_*`; 2 PostGIS system views) |
| Application RPC / functions | **157** |
| Triggers | **164** |
| RLS policies | **~395** |
| Indexes | **452** |
| Foreign keys | **108** |
| Extensions | postgis 3.3.7, pgvector 0.8.0, pg_trgm, unaccent, pgcrypto, pg_stat_statements, supabase_vault, uuid-ossp |

### Conventions used in this document

- **Purpose** lines are inferred from descriptive table names and the architecture docs; treat them as a navigation aid, not a column spec. For per-column detail, see the CSV inventory referenced in §8.
- **Legacy / retirement candidate** tables are flagged inline with `RETIRE?` and consolidated in the migration roadmap.
- Turkish domain terms (`muhasebe`, `gelirler`, `giderler`, `lansman`, `cadde`, `gorevler`, `mayis19`, `oda`, `kaynak`) are **kept verbatim** — they are domain vocabulary, not naming defects.
- Modules below are grouped by **table-name prefix**, which is the de-facto module boundary in this schema.

### Confirmed-dropped legacy tables (NOT present in live DB)

`profiles`, `user_profiles`, `admin_users`, `role_feature_defaults` have all been **dropped**. Any doc, comment, or code still referencing them is stale. The canonical identity model is now `auth.users` + `user_role_assignments` + `user_profile_attributes` + `user_feature_overrides` (see §3).

> **Doc-sync note:** `docs/architecture/SISTEM_MIMARI.md` still references `profiles`, `admin_users`, and `user_profiles_v2` in its prose (it predates the 2026-06-09 drop). Cite it for the **role / attribute / feature / section model** (its §2–§8 are authoritative for that), but for the **identity table set** trust this dictionary and the live DB.

---

## 2. Module Catalog

Roughly 20 modules, grouped by prefix. Each row: table → one-line purpose. `RETIRE?` marks a verified-before-drop candidate.

### 2.1 AUTH_PROFILE — identity & profile attributes

| Table | Purpose |
|---|---|
| `user_role_assignments` | Canonical map of `auth.users` → role(s). **107 rows.** Source of truth for who has which role. |
| `user_profile_attributes` | Per-user attribute values (`value_text` / `value_json`, visibility, approval_status). **196 rows.** |
| `user_feature_overrides` | Per-user feature on/off exceptions (always win over role default). |
| `user_taxonomy_selections` | Per-user taxonomy option selections. Taxonomy retired at runtime — likely empty. `RETIRE?` |
| `_member_backup_20260609` | **Backup snapshot of member data left in `public`.** RLS OFF + full anon grants. **P0 security exposure.** `RETIRE?` |

### 2.2 ROLESGO — roles, attributes, sections (the rule engine)

| Table | Purpose |
|---|---|
| `roles` | Master role list. **82 rows** (User/Admin/Consultant/Organization/Business/Healthcare/Event/Job/Community/Marketplace families + 6 legacy). |
| `attribute_catalog` | Dictionary of all attribute keys (label, data_type, is_active). |
| `role_attribute_rules` | Which attribute is active/required/public per role. **1977 rows.** |
| `profile_section_catalog` | Dictionary of profile sections (key, area, sort_order). |
| `role_profile_section_rules` | Which section is visible per role. **574 rows.** |
| `role_taxonomy_rules` | Which taxonomy group is active per role. Runtime-retired. `RETIRE?` |

### 2.3 FEATURES — feature flags

| Table | Purpose |
|---|---|
| `feature_catalog` | Dictionary of all feature keys (label, is_active_globally). |
| `role_feature_flags` | Default feature on/off per role. **2487 rows.** |
| `feature_definitions` | Apparent older feature dictionary. **0 rows** — likely superseded by `feature_catalog`. `RETIRE?` (dedup decision) |

Resolution order (per `SISTEM_MIMARI.md` §4): **user/item override → `role_feature_flags` role default → fallback `false`**. Runtime entry point is the `get_current_user_features()` RPC.

### 2.4 CATALOG — unified content hub (architectural reference)

| Table | Purpose |
|---|---|
| `catalog_items` | **Unified hub for every non-auth record** (doctors, businesses, events, etc.). **623 rows.** `platform_role_key` → `roles.key`. |
| `advisor_details` | 1:1 detail extension for `advisor` items. |
| `business_details` | 1:1 detail extension for `business` items. |
| `event_details` | 1:1 detail extension for `event` items. |
| `job_posting_details` | 1:1 detail extension for `job_posting` items. |
| `community_group_details` | 1:1 detail extension for `community_group` items. |
| `person_profile_details` | 1:1 detail for `person_profile` items; `linked_profile_id` ties a catalog record to a real auth user. |
| `organization_details` | 1:1 detail extension for `organization` items. |
| `marketplace_listing_details` | 1:1 detail extension for `marketplace_listing` items. |
| `catalog_item_locations` | Item geo/address rows (PostGIS-backed). |
| `catalog_item_contacts` | Item contact channels. |
| `catalog_item_media` | Item images / media assets. |
| `catalog_item_links` | Item external links. |
| `catalog_item_categories` | Item ↔ category join. |
| `catalog_item_tags` | Item ↔ tag join. |
| `catalog_item_services` | Item service offerings. |
| `catalog_item_attribute_overrides` | Item-level override of a role attribute rule. |
| `catalog_item_feature_overrides` | Item-level feature on/off exception. |
| `catalog_item_section_overrides` | Item-level section visibility exception. |
| `catalog_item_memberships` | Editor/owner/manager grants on an item (`owner/manager/editor/contributor/viewer`). |
| `catalog_audit_logs` | Change audit trail for catalog items. |
| `source_records` | Provenance: which CSV/API import produced an item. |

### 2.5 CLAIMS — ownership claim workflow

| Table | Purpose |
|---|---|
| `catalog_claim_requests` | Pending/approved/rejected claims of unowned catalog records by their real owner. |

(Workflow RPCs: `submit_catalog_claim_request`, `admin_approve_catalog_claim`, `admin_reject_catalog_claim`, `admin_grant_catalog_editor`, `admin_revoke_catalog_editor` — see `SISTEM_MIMARI.md` §8.)

### 2.6 DIRECTORY — public directory surface

| Table | Purpose |
|---|---|
| `directory_*` / category & tag dictionaries | Public-facing directory taxonomy and listing surface over `catalog_items`. |

### 2.7 CADDE — marketplace / street (`cadde_*`, `cafe*`)

| Table | Purpose |
|---|---|
| `cadde_cafes` | Cafe/venue records for the cadde marketplace. |
| `cadde_cafe_members` | Cafe membership rows. |
| `cafes` | Older cafe table — overlaps `cadde_cafes`. `RETIRE?` (dedup decision) |
| `cafe_memberships` | Older membership table — overlaps `cadde_cafe_members`. `RETIRE?` (dedup decision) |

### 2.8 WHATSAPP_COMMUNITIES (`wa_*`, `whatsapp_*`)

| Table | Purpose |
|---|---|
| `wa_users` | WhatsApp-linked user records. **RLS on, 0 policies, broad anon grant.** P1 hardening. |
| `wa_messages` | Inbound/outbound WhatsApp messages. **RLS on, 0 policies, broad anon grant.** P1. |
| `wa_tasks` | Task queue for WhatsApp automation. **RLS on, 0 policies, broad anon grant.** P1. |
| `whatsapp_*` | WhatsApp landing/community config tables (e.g. assigned-landing edit feature). |

### 2.9 REFERRAL (`referral_*`)

| Table | Purpose |
|---|---|
| `referral_codes` | Active referral codes. **RLS on, 0 policies, broad anon grant.** P1. |
| `referral_code_usages` | Redemption/usage log per code. **RLS on, 0 policies, broad anon grant.** P1. |
| `referral_groups` | Referral campaign groupings. **RLS on, 0 policies, broad anon grant.** P1. |
| `referral_sources` | Referral source/channel dictionary. **RLS on, 0 policies, broad anon grant.** P1. |
| `referral_types` | Referral type dictionary. **RLS on, 0 policies, broad anon grant.** P1. |
| `referral_codes_legacy` | Pre-refactor referral codes. **RLS on, 0 policies.** `RETIRE?` |

### 2.10 SURVEYS

| Table | Purpose |
|---|---|
| `surveys` | Survey definitions. |
| `submissions` | Public form submissions (RLS-sensitive; insert policy has reset history). |
| `survey_*` | Survey question/response satellite tables. |

### 2.11 LANSMAN (launch registration)

| Table | Purpose |
|---|---|
| `lansman_registrations` | Launch/startup registration entries (SEO-locked `/lansman` flow). |
| `lansman_*` | Lansman config/satellite tables. |

### 2.12 MAY19 (`may19_*`)

| Table | Purpose |
|---|---|
| `may19_submissions` | May 19 campaign submissions. |
| `may19_campaign_submissions` | Apparent parallel submissions table — overlaps `may19_submissions`. `RETIRE?` (dedup decision) |

### 2.13 MUHASEBE (accounting)

| Table | Purpose |
|---|---|
| `expenses` | **giderler** — expense ledger rows. |
| `incomes` | **gelirler** — income ledger rows. |

(4 aggregate views over these — see §4. nakit akışı = cash flow.)

### 2.14 GEO

| Table | Purpose |
|---|---|
| `geo_cities` | City reference data. **76901 rows.** PostGIS-backed. |
| `geo_countries` | Country reference data. **251 rows.** |

### 2.15 WORKSPACE — internal collaboration

| Table | Purpose |
|---|---|
| `command_center_items` | Command-center board items. |
| `command_center_legacy_map` | Legacy id mapping for command center. `RETIRE?` |
| `mvp_items` | MVP backlog items. |
| `todo_items` | Canonical task items. |
| `todos` | Older todo table — overlaps `todo_items`. `RETIRE?` (dedup decision) |
| `gorevler` | **gorevler** — task records (TR). |
| `draft_notlar` | **draft notes** (TR). |
| `meeting_notes` | Meeting minutes. |
| `arge_*` | **Ar-Ge** (R&D) workspace tables. |
| `resource_entries` | **kaynak** — resource library entries. |

### 2.16 ADMIN / SYSTEM / RAG

| Table | Purpose |
|---|---|
| `job_listings` | Public job listings (note EN naming vs TR `gorevler`). |
| `rag_documents` | RAG document store with pgvector embeddings (powers `/api/chat`). |
| `diaspora_*` | Diaspora analytics/data tables. |
| `spatial_ref_sys` | PostGIS system table (SRID registry). |
| `taxonomy_groups` | Taxonomy group dictionary. Runtime-retired. `RETIRE?` |
| `taxonomy_options` | Taxonomy options. Runtime-retired. `RETIRE?` |

---

## 3. Core Entities — Deep Dive

### 3.1 `catalog_items` — the unified hub

`catalog_items` (623 rows) is the architectural reference pattern: **one row per non-auth entity**, with type-specific data pushed into 1:1 `*_details` tables and cardinal data into `catalog_item_*` child tables. Eight item types (`advisor`, `organization`, `business`, `event`, `marketplace_listing`, `job_posting`, `community_group`, `person_profile`) each map to a `*_details` extension.

```
catalog_items (hub, platform_role_key → roles.key)
├── *_details                    (1:1 type extension)
├── catalog_item_locations       (geo, PostGIS)
├── catalog_item_contacts / _media / _links
├── catalog_item_categories / _tags / _services
├── catalog_item_attribute_overrides   (override role_attribute_rules)
├── catalog_item_feature_overrides     (override role_feature_flags)
├── catalog_item_section_overrides     (override role_profile_section_rules)
├── catalog_item_memberships     (owner/manager/editor/contributor/viewer)
├── catalog_claim_requests       (claim workflow)
├── catalog_audit_logs           (audit)
└── source_records               (import provenance)
```

Assigning `platform_role_key` auto-applies that role's attribute/feature/section rule set to the item; item-level override tables let admins deviate per item. (Full model: `SISTEM_MIMARI.md` §7.)

### 3.2 Identity model (post-drop)

```
auth.users
├── user_role_assignments      (107)  → who has which role  → roles
├── user_profile_attributes    (196)  → form-field values, visibility, approval_status
└── user_feature_overrides            → per-user feature exceptions (win over role default)
```

The old `profiles` / `user_profiles` / `admin_users` tables are **gone**. Admin status is resolved via the `is_admin()` RPC (no `admin_users` table). `is_moderator()` covers the moderator tier.

### 3.3 Rules tables (the engine)

| Table | Rows | Drives |
|---|---|---|
| `roles` | 82 | role identity & families |
| `role_feature_flags` | 2487 | per-role feature defaults |
| `role_attribute_rules` | 1977 | per-role attribute behavior (enabled/required/public/editable) |
| `role_profile_section_rules` | 574 | per-role profile section visibility & order |

Authoritative model and resolution semantics: **`docs/architecture/SISTEM_MIMARI.md` §2–§6** (do not re-derive here). Override > role default > fallback(false) holds for both features and attributes.

### 3.4 Muhasebe (`expenses` / `incomes` + 4 views)

Two ledgers — `expenses` (**giderler**) and `incomes` (**gelirler**) — feed four read-model views (§4) that the muhasebe dashboard consumes for KPI cards, per-person and per-category breakdowns, and monthly **nakit akışı** (cash flow). The `*-api.ts` + Zod + aggregations pattern in `src/lib/muhasebe-*.ts` is the codebase's reference data-layer architecture.

---

## 4. Views

Four application views, all in the muhasebe read model:

| View | Sources | Purpose |
|---|---|---|
| `v_muhasebe_kpi` | `expenses`, `incomes` | Headline KPI totals (income, expense, net). |
| `v_muhasebe_by_person` | `expenses`, `incomes` | Aggregation per **kişi**. |
| `v_muhasebe_by_category` | `expenses`, `incomes` | Aggregation per category. |
| `v_muhasebe_cashflow_monthly` | `expenses`, `incomes` | Monthly **nakit akışı** time series. |

> **`security_invoker` note:** None of the four currently set `security_invoker=on`. A Postgres view runs with the **definer's** privileges by default, so these views can read `expenses`/`incomes` rows the calling user's RLS would otherwise hide. Recommended hardening: `ALTER VIEW … SET (security_invoker = on)` so RLS on the base ledgers is enforced for the caller. Tracked as **P1** in the roadmap. (The other 2 views are PostGIS system views — `geography_columns` / `geometry_columns` — not application objects.)

---

## 5. Extensions in Use

| Extension | Version | Powers |
|---|---|---|
| `postgis` | 3.3.7 | `geo_cities`/`geo_countries`, `catalog_item_locations`, spatial directory queries. |
| `pgvector` | 0.8.0 | `rag_documents` embeddings (`/api/chat` RAG) and catalog semantic search. |
| `pg_trgm` | — | Fuzzy / partial-match search on names and text fields. |
| `unaccent` | — | Accent-insensitive Turkish search (ç/ş/ı/ğ/ü/ö folding). |
| `pgcrypto` | — | UUID / hashing primitives. |
| `uuid-ossp` | — | `uuid_generate_*` for legacy PK defaults. |
| `pg_stat_statements` | — | Query performance telemetry. |
| `supabase_vault` | — | Encrypted secret storage (Supabase Vault). |

`postgis` + `pgvector` + `pg_trgm` + `unaccent` together back the catalog search contract (`docs/architecture/catalog-ai-search-contract.md`): geo filtering, semantic similarity, and accent-folded fuzzy text.

---

## 6. RLS / Policy Posture (summary)

~395 policies across the schema. Healthy baseline overall, with these flagged exceptions (detail and remediation drafts in the migration roadmap and `sql-drafts/phase-04-*`):

- **P0:** `_member_backup_20260609` — RLS **disabled** + full anon CRUD/TRUNCATE grants.
- **P1:** nine tables with **RLS on but 0 policies** plus broad anon grants — `referral_codes`, `referral_code_usages`, `referral_codes_legacy`, `referral_groups`, `referral_sources`, `referral_types`, `wa_messages`, `wa_tasks`, `wa_users`. (Deny-all today, but a latent footgun.)
- **Positive:** 0 `SECURITY DEFINER` functions are missing `search_path` — RPC hardening is already done well.

---

## 7. Type Drift (B1)

The committed `src/integrations/supabase/types.ts` is **2386 lines** but a live `supabase gen types` is **9511 lines** — the committed types cover only **~25%** of the real schema. This silently disables type safety for ~75% of tables/columns. **Regenerate the types** (`supabase gen types typescript --project-id injprdrsklkxgnaiixzh`) and commit. Tracked as **P1 / B1** in the roadmap.

---

## 8. Full Per-Column Detail (CSV reference)

This dictionary is intentionally a navigation layer. For exhaustive per-object / per-column detail, see the inventory CSVs in this audit folder:

- `database-object-inventory.csv` — every table/view/function with row counts and flags.
- (companion CSVs as produced by the audit run — columns, indexes, FKs, policies.)

When CSV and this doc disagree, the **CSV (live metadata)** is authoritative for column-level facts; this doc is authoritative for module grouping and narrative.

---

*Generated 2026-06-09 from live read-only metadata. Documentation only — no schema changes performed.*
