# 12 — Migration Push Report (Phase 8)

> **Date:** 2026-06-09 · Push of the 18 rebuild migrations to prod `injprdrsklkxgnaiixzh`.

## 1. Method
Pushed via **Supabase Management API** (per user choice — only the rebuild migrations, not the unrelated out-of-order `20260609050000`). A file-based body (`--data-binary @file`) was required because the large `010c` (2782 lines) exceeded the shell arg-length limit. Each migration was recorded in `supabase_migrations.schema_migrations` for tracking consistency. Script: `_push_to_prod.sh` (resumable; skips already-applied versions; stops on first error; token never printed).

## 2. Migrations applied (18, in order)
002 catalog_items · 003 flat_roles · 004 afs_catalogs · 005 role_afs_relations · 006 item_values_and_overrides · 007 claims_and_managers · 008 item_roles_indexes · 009 rls_policies · 010 public/owner/admin rpc · 010c backend_rewire (40 fns) · 010d user_profiles_leftovers (4 fns) · 010e user_profiles_leftovers_2 (9 fns) · 011 seed_flat_roles · 012 seed_afs_catalogs · 013 seed_role_afs_matrix · 014 seed_placeholder_items · 015 verify · 016 drop_legacy_schema · 017 post_cleanup_verification.

## 3. Real-data FK blockers discovered ONLY on prod (local had no such rows)
The legacy-role delete in 016 hit a series of FK constraints that local validation could not surface (local DB has no user/item data). Each was resolved by extending 016 to clear the legacy references first, then re-pushing 016 (atomic — failed attempts rolled back fully):

| Blocker (FK) | Legacy rows on prod | Resolution in 016 |
|---|---|---|
| `user_role_assignments_role_id_fkey` | 127 | delete legacy assignments |
| `catalog_items_platform_role_key_fkey` | 127 items | null the legacy platform_role_key |
| `catalog_item_roles_role_id_fkey` | 127 | delete legacy item-role links (from 014 backfill) |
| `role_attribute_rules/feature_flags/section_rules` FKs | 153 / 207 / 42 | delete legacy AFS-matrix rows |
| trigger `sync_user_profile_role_from_catalog` → dropped `user_profiles` | — | neutralized to no-op (010e + 016) |
| 9 functions referencing dropped `user_profiles`/`profiles` | — | repaired in 010e |

## 4. Prod post-migration verification — PASS
| Check | Value |
|---|---|
| roles total | 76 |
| legacy roles | 0 |
| afs_attributes / features / sections | 53 / 42 / 7 |
| placeholders | 76 |
| items total | 239 (163 real preserved + 76 placeholder) |
| legacy indirection tables remaining | 0 |
| family residue columns remaining | 0 |
| old table names remaining | 0 |

## 5. Follow-up flagged
127 real member items had their legacy role link severed (`platform_role_key` nulled, `catalog_item_roles` legacy links deleted). The items themselves are preserved but are temporarily without a primary flat role; they should be re-linked to an appropriate flat role (e.g. `User_Standard`) via admin tooling as a follow-up. (User authorized severing the blocking links; data backed up separately.)
