# CorteQS — Database Migration Roadmap & Naming Standard

**Project:** CorteQS Supabase (`injprdrsklkxgnaiixzh`)
**Schema scope:** `public`
**Date:** 2026-06-09
**Status:** Documentation only. No DB changes. Companion to `database-data-dictionary.md` and the `sql-drafts/` phases (all draft, none executable as-is).

This roadmap does three things:
1. A **naming convention guide for NEW objects only** (§1).
2. A **migration governance standard** (§2).
3. A **phased, prioritized simplification roadmap** mapped to `sql-drafts/` phases 01–06 (§3).

---

## 1. Naming Convention Guide — NEW Objects Only

> **Hard rule:** These conventions apply to objects you **create going forward**. **Do NOT bulk-rename existing objects.** The live schema (154 tables, 157 RPCs, 395 policies) is referenced by frontend code, RPCs, RLS policies, and 108 FKs. A rename is a breaking change.
>
> **If a rename is genuinely required:** open a **compatibility window** — keep the old name, add a **view alias** (or an RPC wrapper) under the new name, migrate the frontend to the new name, confirm zero references to the old name in code + logs, *then* drop the old name in a later migration. Never rename and drop in one step.

Recommendations below are derived from the **observed** live conventions (snake_case; `id uuid` PKs; `created_at`/`updated_at`; existing `set_updated_at` / `update_updated_at_column` trigger functions; `v_` view prefix; `admin_` RPC prefix; `*_rules` / `*_catalog` patterns). Turkish domain terms (`muhasebe`, `gelirler`, `giderler`, `lansman`, `cadde`, `gorevler`, `mayis19`, `oda`, `kaynak`) are **kept** — they are domain vocabulary.

| # | Object | Convention | Example |
|---|---|---|---|
| 1 | **Schema** | App objects in `public` (matches existing layout). Reserve future namespacing for clearly isolated subsystems only; don't split modules into schemas now. | `public` |
| 2 | **Table** | `snake_case`, **module prefix**, plural for collections. Keep Turkish domain roots. | `cadde_cafes`, `referral_codes`, `muhasebe_*` |
| 3 | **Primary key** | `id uuid PRIMARY KEY DEFAULT gen_random_uuid()` (pgcrypto). Matches dominant existing pattern. | `id uuid` |
| 4 | **Foreign key column** | `<referenced_singular>_id`. FK constraint `fk_<table>_<column>`. Always index the FK column (see #13). | `catalog_item_id`, `fk_catalog_item_media_catalog_item_id` |
| 5 | **Timestamp columns** | `created_at timestamptz NOT NULL DEFAULT now()`, `updated_at timestamptz NOT NULL DEFAULT now()` (maintained by trigger #11). | `created_at`, `updated_at` |
| 6 | **Status column** | `status text` + a `CHECK (status IN (...))` constraint; reuse existing enums of values (`pending/approved/rejected`, `draft/pending/approved`) rather than inventing new vocabularies. | `status text CHECK (status IN ('pending','approved','rejected'))` |
| 7 | **Soft-delete** | Prefer `deleted_at timestamptz NULL` (nullable timestamp) over a boolean; filter `WHERE deleted_at IS NULL`. Only add when a real undelete/audit need exists. | `deleted_at` |
| 8 | **Audit columns** | `created_by uuid`, `updated_by uuid` referencing `auth.users(id)`; pair with `catalog_audit_logs`-style trail for sensitive tables. | `created_by`, `updated_by` |
| 9 | **RPC (function)** | `snake_case`, verb-first, returns typed rows. Public/runtime RPCs: plain verb (`get_current_user_features`, `submit_catalog_claim_request`). **SECURITY DEFINER must pin** `SET search_path = public, pg_temp`. | `get_*`, `submit_*`, `list_*` |
| 10 | **Admin RPC** | Prefix `admin_` and gate internally with `is_admin()` / `is_moderator()`. Restrict `EXECUTE` to `authenticated` (not `anon`). | `admin_set_user_role`, `admin_approve_catalog_claim` |
| 11 | **View** | Prefix `v_`, module-scoped name; **always** `WITH (security_invoker = on)` so caller RLS is enforced. | `v_muhasebe_by_person` |
| 12 | **Trigger** | `trg_<table>_<action>`; reuse existing `set_updated_at()` / `update_updated_at_column()` functions for `updated_at` — do not create a third variant. | `trg_incomes_set_updated_at` |
| 13 | **Index** | `idx_<table>_<col[s]>`; unique → `uq_<table>_<col[s]>`; partial → suffix the predicate intent; GIN for `pg_trgm`/`tsvector`/`jsonb`, GiST for PostGIS. Create `CONCURRENTLY` in prod. | `idx_catalog_item_media_catalog_item_id`, `uq_referral_codes_code` |
| 14 | **Constraint** | PK `pk_<table>`, FK `fk_<table>_<col>`, unique `uq_<table>_<cols>`, check `ck_<table>_<rule>`. Validate as `NOT VALID` then `VALIDATE CONSTRAINT` for big tables. | `ck_incomes_amount_nonneg` |
| 15 | **Policy** | `<table>_<role>_<action>` (e.g. `select`/`insert`/`update`/`delete` + audience). Make intent explicit; never leave a table RLS-on with 0 policies *and* broad grants. | `referral_codes_authenticated_select` |
| 16 | **Migration filename** | `YYYYMMDDHHMMSS_<module>_<purpose>.sql` (matches existing `supabase/migrations/` convention). | `20260610090000_referral_rls_policies.sql` |

---

## 2. Migration Governance Standard

### 2.1 Filename & location

- Path: `supabase/migrations/`. Append-only — **never delete, edit-in-place, or reorder** an existing migration (production replays them in order).
- Name: `YYYYMMDDHHMMSS_<module>_<purpose>.sql` — UTC timestamp, module prefix, single concrete purpose.
- `sql-drafts/` files are **review artifacts and must never be copied into `supabase/migrations/`.** An approved draft → a DBA authors a *fresh* reviewed migration with up/down.

### 2.2 Mandatory header template

Every migration starts with:

```sql
-- ============================================================
-- Purpose:                <one sentence>
-- Module:                 <AUTH_PROFILE | CATALOG | REFERRAL | MUHASEBE | ...>
-- Risk level:             <low | medium | high>
-- Preconditions:          <read-only checks run + result>
-- Rollback:               <exact down steps, or "see paired down migration">
-- Data migration required:<yes/no — describe backfill>
-- Estimated lock impact:  <none | brief ACCESS EXCLUSIVE | CONCURRENTLY no-lock>
-- Manual verification:    <smoke tests / RLS matrix / app paths to re-check>
-- ============================================================
```

### 2.3 Principles

1. **Small, single-purpose** — one concern per migration; easier to review and roll back.
2. **Additive-first** — add (column/index/policy/comment) before you remove. Removal is the last resort.
3. **Compatibility window before any rename** — old name + new alias coexist until the frontend is migrated and references hit zero.
4. **Usage evidence before any drop** — confirm 0 rows where expected, 0 code references, 0 recent query hits (`pg_stat_statements`), and a retained backup, before `DROP`.
5. **Data-quality query before a constraint** — run the violating-rows `SELECT` first; a `NOT NULL`/`CHECK`/`UNIQUE` that fails mid-deploy is an outage.
6. **Duplicate / coverage check before an index** — verify no existing index already covers the columns; check selectivity; build `CONCURRENTLY`.
7. **Policy-matrix test on any RLS change** — test anon / authenticated / admin × select/insert/update/delete on a staging clone before prod.
8. **Execute-privilege check on any RPC change** — confirm `anon` vs `authenticated` `EXECUTE` grants; `SECURITY DEFINER` must pin `search_path`.
9. **Rollback for every destructive change** — a paired down path (or documented manual restore) is mandatory for `DROP`/`REVOKE`/destructive `ALTER`.
10. **No big-bang cleanup** — never batch unrelated drops/renames. Phase them; each phase independently reversible.
11. **Never drop an index on `idx_scan = 0` alone** — stats reset on restart; an index may serve uniqueness, FK enforcement, or rare critical plans. Treat as manual-verify-only.

---

## 3. Phased Simplification Roadmap

Mapped to the six draft files in `sql-drafts/` (each is DRAFT, DDL commented out):

| Phase | Draft file | Theme |
|---|---|---|
| 01 | `phase-01-documentation-only.sql` | `COMMENT ON` metadata (zero risk) |
| 02 | `phase-02-safe-additive-indexes.sql` | Additive FK/RLS indexes |
| 03 | `phase-03-safe-constraints-draft.sql` | NOT NULL / UNIQUE / FK on-delete |
| 04 | `phase-04-rls-hardening-draft.sql` | RLS grants/policies + view `security_invoker` (**highest priority**) |
| 05 | `phase-05-rpc-hardening-draft.sql` | `EXECUTE` grant tightening |
| 06 | `phase-06-legacy-retirement-draft.sql` | Legacy/backup/duplicate retirement (**destructive**) |

### 3.1 Prioritized action table

Legend — **Migration?** = needs a migration file · **FE?** = frontend change needed · **Data-mig?** = backfill/data move needed · **Approval** = human sign-off required before apply.

| ID | Title | Module | Evidence | Risk | Migration? | FE? | Data-mig? | Rollback | Effort | Manual approval |
|---|---|---|---|---|---|---|---|---|---|---|
| **P0-1** | Remediate `_member_backup_20260609` exposure | AUTH_PROFILE | Backup table in `public`, **RLS OFF + full anon CRUD/TRUNCATE grants** (live) | **Critical** | Yes (REVOKE + enable RLS now; DROP after off-cluster backup) | No | No (it's a backup) | Re-grant from backup if rollback needed | S | **Yes — treat as incident** |
| **P1-1** | Regenerate `supabase/types.ts` (B1) | SYSTEM | Committed 2386 lines vs live 9511 (~25% coverage) | Low | No (codegen + commit) | Yes (recompile) | No | Revert the commit | S | No |
| **P1-2** | Add RLS policies + tighten grants on 9 tables | REFERRAL, WHATSAPP | RLS on, **0 policies**, broad anon grants: `referral_codes/_code_usages/_codes_legacy/_groups/_sources/_types`, `wa_messages/_tasks/_users` | High | Yes | Maybe (if anon paths relied on grants) | No | Drop the new policies / restore prior grants | M | **Yes — RLS matrix on staging** |
| **P1-3** | `security_invoker=on` on 4 muhasebe views | MUHASEBE | `v_muhasebe_kpi/_by_person/_by_category/_cashflow_monthly` lack it → may bypass `expenses`/`incomes` RLS | Medium | Yes | No | No | `ALTER VIEW … SET (security_invoker=off)` | S | **Yes — verify dashboard still loads** |
| **P2-1** | Add indexes on uncovered FK / RLS-filter columns | CATALOG, REFERRAL, others | 108 FKs vs index coverage; phase-02 candidates | Low-Med | Yes | No | No | `DROP INDEX CONCURRENTLY` | M | Yes — duplicate-check + plan evidence |
| **P2-2** | Add NOT NULL / UNIQUE / CHECK + FK on-delete review | CATALOG, MUHASEBE | phase-03 candidates | Medium | Yes | No | Maybe (backfill nulls) | Drop constraint | M | Yes — run violating-rows query first |
| **P3-1** | Retire `referral_codes_legacy` | REFERRAL | `_legacy` suffix; superseded by `referral_codes` | Medium | Yes | No | Verify 0 active reads | Restore from backup | S | Yes — usage + backup |
| **P3-2** | Retire `command_center_legacy_map` | WORKSPACE | `_legacy` suffix; id-mapping leftover | Low-Med | Yes | No | Verify 0 reads | Restore from backup | S | Yes — usage + backup |
| **P3-3** | Retire taxonomy tables (after empty-check) | ROLESGO/SYSTEM | Runtime-retired: `taxonomy_groups`, `taxonomy_options`, `role_taxonomy_rules`, `user_taxonomy_selections` | Medium | Yes | Maybe | Confirm all empty first | Restore from backup | M | Yes — confirm empty + no RPC refs |
| **P4-1** | Decide `todos` vs `todo_items` | WORKSPACE | Singular/plural duplicate | Low | Yes (after decision) | Yes | Maybe (merge rows) | Keep both until migrated | M | Yes — pick canonical, migrate refs |
| **P4-2** | Decide `cafes`/`cafe_memberships` vs `cadde_cafes`/`cadde_cafe_members` | CADDE | Prefix duplicate | Low-Med | Yes (after decision) | Yes | Maybe (merge rows) | Keep both until migrated | M | Yes — pick canonical, migrate refs |
| **P4-3** | Decide `feature_definitions` (0 rows) vs `feature_catalog` | FEATURES | Empty duplicate dictionary | Low | Yes | No | No | Restore from backup | S | Yes — confirm 0 refs |
| **P4-4** | Decide `may19_campaign_submissions` vs `may19_submissions` | MAY19 | Parallel submissions tables | Low-Med | Yes (after decision) | Yes | Maybe (merge rows) | Keep both until migrated | M | Yes — pick canonical |

### 3.2 Recommended sequencing

1. **P0-1 immediately** (security incident). REVOKE anon grants + enable RLS first; DROP only after an off-cluster backup.
2. **P1-2 + P1-3** (RLS gaps + view invoker) next — same security sweep, staging RLS-matrix tested.
3. **P1-1** (regenerate types) any time — unblocks type safety, no DB risk.
4. **P2** (indexes/constraints) — only with duplicate-check and violating-rows evidence collected first.
5. **P3** (legacy retirement) — after usage verification + retained backups.
6. **P4** (naming/dedup) — last; each requires a canonical decision, compatibility window, and frontend migration. **No bulk rename.**

### 3.3 Naming-inconsistency notes (do NOT auto-fix)

Observed and intentionally **left in place** unless a P4 decision says otherwise:

- **TR/EN mix:** `gorevler`/`draft_notlar`/`lansman_registrations` vs `job_listings`. Turkish domain terms stay; only resolve genuine duplicates.
- **Singular/plural mix:** `todos` vs `todo_items`, `cafes` vs `cadde_cafes`.
- **Legacy/backup suffixes:** `_legacy`, `_backup_<date>` — these are retirement signals (P0/P3), not rename targets.

---

*Generated 2026-06-09. Documentation only — no schema changes performed. All `sql-drafts/` remain human-review artifacts; approved changes require a fresh, reviewed migration authored by a DBA.*
