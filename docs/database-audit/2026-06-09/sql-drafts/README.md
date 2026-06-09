# Database Audit SQL Drafts — 2026-06-09

**Project:** CorteQS Supabase (`injprdrsklkxgnaiixzh`)
**Scope:** `public` schema (154 tables, 108 FKs, 452 indexes, 164 triggers)
**Status:** DRAFT ONLY — human review required before any execution.

---

## CRITICAL RULE — DO NOT EXECUTE AUTOMATICALLY

Every file in this directory is a **human-review artifact**. None of them is a migration.

- Every `DDL` / destructive statement (`CREATE`, `ALTER`, `DROP`, `REVOKE`, `CREATE POLICY`) is **commented out**.
- The only statements that may be uncommented and run are **read-only `SELECT` verification queries**, and even those should be run against a replica/staging or during a low-traffic window.
- **These files must NEVER be moved into `supabase/migrations/`.** Migrations are append-only and run automatically in production. If a proposal is approved, a DBA must author a *separate, reviewed* migration with proper backup and rollback — not by copying a draft.

Every file begins with the mandatory banner:

```sql
-- ============================================================
-- DRAFT ONLY - DO NOT EXECUTE AUTOMATICALLY
-- Human review, backup and staging verification are required.
-- ============================================================
```

---

## The 6 Phases

| Phase | File | Theme | Destructive? |
|-------|------|-------|--------------|
| 01 | `phase-01-documentation-only.sql` | `COMMENT ON` metadata documentation | No (additive metadata only, still commented) |
| 02 | `phase-02-safe-additive-indexes.sql` | Additive indexes on FK / RLS columns | Additive (write-cost + lock considerations) |
| 03 | `phase-03-safe-constraints-draft.sql` | NOT NULL / UNIQUE / FK on-delete review | Validating ALTERs (lock risk) |
| 04 | `phase-04-rls-hardening-draft.sql` | RLS grants + policies + view `security_invoker` | Security-sensitive; **highest priority** |
| 05 | `phase-05-rpc-hardening-draft.sql` | `EXECUTE` grant tightening on RPCs | Security-sensitive |
| 06 | `phase-06-legacy-retirement-draft.sql` | Legacy / backup / duplicate table retirement | **Destructive** (`DROP TABLE`) |

### Recommended execution order (after approval)

1. **Phase 04 first (security P0).** The `_member_backup_20260609` table (RLS disabled, full anon grants) is a live data-exposure risk. Treat it as an incident, not a backlog item.
2. **Phase 05** (RPC `EXECUTE` tightening) alongside Phase 04.
3. **Phase 01** documentation — zero risk, can land any time.
4. **Phase 02 / 03** additive indexes and constraints — only after query-plan / duplicate-check evidence is collected.
5. **Phase 06** retirement — last, and only after backups + usage verification.

---

## Guiding Principles

### Additive-first
Prefer adding (indexes, constraints, policies, comments) over removing. Removal (`DROP`, `REVOKE` that breaks an app path) is always the last resort and always requires evidence that nothing depends on the object.

### Every proposal carries
- **Rationale** — why the change is proposed.
- **Evidence** — the live finding it is based on (and what additional evidence is still needed).
- **Precondition** — a read-only check to run *before* applying.
- **Risk / Lock** — write cost, lock level, blast radius.
- **Rollback** — how to undo.

### Never drop an index without evidence
`idx_scan = 0` is **not** sufficient justification. Stats reset on restart, and an index may serve uniqueness, FK enforcement, or rare-but-critical query plans. All index removal candidates are marked **"Manuel doğrulama gerekli"** (manual verification required) and none are proposed here.

---

## Required Human Workflow Before Any Apply

1. **Read** the draft and confirm the finding still holds (re-run the read-only precondition `SELECT`s).
2. **Backup** — `pg_dump` of affected tables (and for Phase 06, a full logical backup retained off-cluster).
3. **Staging** — apply the change on a staging clone restored from production; run the app's smoke + RLS tests.
4. **Author a real migration** — a DBA writes a new, reviewed file under `supabase/migrations/` (NOT a copy of the draft) with proper `up`/`down`.
5. **Low-traffic window** — apply with `CONCURRENTLY` where available; monitor locks (`pg_stat_activity`, `pg_locks`).
6. **Verify** — re-run preconditions as postconditions; confirm app behavior; keep rollback ready.

---

## Live Findings Summary (basis for these drafts)

**Security**
- P0: `_member_backup_20260609` — backup of member data in `public`, **RLS disabled**, full CRUD + TRUNCATE granted to `anon` and `authenticated`.
- 9 tables with **RLS enabled but ZERO policies** yet broad anon/authenticated grants: `referral_codes`, `referral_code_usages`, `referral_codes_legacy`, `referral_groups`, `referral_sources`, `referral_types`, `wa_messages`, `wa_tasks`, `wa_users`. (Deny-all today, but a latent misconfiguration.)
- 4 muhasebe views without `security_invoker=on`: `v_muhasebe_kpi`, `v_muhasebe_by_person`, `v_muhasebe_by_category`, `v_muhasebe_cashflow_monthly` — may bypass RLS on `expenses`/`incomes`.

**Positive (NO change needed)**
- All app `SECURITY DEFINER` functions already pin `search_path` (0 violations). Phase 05 therefore targets `EXECUTE` grants + admin-check verification only.

**Legacy / duplicate candidates (verify before retiring)**
- `referral_codes_legacy`, `command_center_legacy_map`, `_member_backup_20260609`.
- Possible duplicates: `feature_definitions` (0 rows) vs `feature_catalog`; `may19_campaign_submissions` vs `may19_submissions`; `todos` vs `todo_items`; `cafes`/`cafe_memberships` vs `cadde_cafes`/`cadde_cafe_members`.
- Retired-runtime taxonomy: `taxonomy_groups`, `taxonomy_options`, `role_taxonomy_rules`, `user_taxonomy_selections` (verify empty first).

**Infra context**
- Extensions: `postgis`, `pgvector`, `pg_trgm`, `unaccent`.
- Index scan stats captured but treated as advisory only (see "Never drop an index" above).
