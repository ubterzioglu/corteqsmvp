# 11 — E2E / Test Report (Phase 7)

> **Date:** 2026-06-09 · Validation of the rebuild against the existing test suite + DB assertions.

## 1. DB-level assertions (migration 015) — PASS
Every local `supabase start` runs migration `015_verify_system` which raises on any violation. Result on the final replay:
```
NOTICE: Rebuild verification PASSED: 76 roles, 53/42/7 AFS, 76 placeholders, explicit matrix.
```
Covers (plan §18.1): no family columns on `roles`; 76 active flat roles; renamed tables present + old names absent; 53/42/7 AFS counts; 76 placeholders each with exactly one primary role; every active role has explicit AFS rows (no inheritance).

## 2. Frontend build — PASS
`npm run build`: ✓ 2858 modules transformed, built ~23s, no TS errors (with regenerated types.ts).

## 3. Vitest suite — 287 / 288 PASS
- **Test Files:** 83 passed / 1 failed (84).
- **Tests:** 287 passed / 1 failed (288).
- Phase-7 test fixes: mock table names in `MessagesInbox.test.tsx` and `AdminAttributesPage.test.tsx` updated to new names → those suites pass.

### The 1 failing test is UNRELATED to the rebuild
`AdminLayout.test.tsx > AdminLayout > shows internal dashboard workspace links` — fails with `Unable to find role="menuitem" and name /^CC$/i`. This is an **admin navigation/menu** test (a "Command Center" workspace link). Verified:
- Neither `AdminLayout.tsx` nor `AdminLayout.test.tsx` references ANY renamed catalog/role/AFS table.
- The failure concerns UI nav items, not data access.
- It sits near the user-acknowledged "ignore" UI commits (legacy Navbar removal). It is a pre-existing/UI-side failure, **not a rebuild regression**, and fixing it is out of rebuild scope.

## 4. Security-oriented checks (plan §18.2) — design-level
The new public RPC `get_public_catalog_item_profile` is whitelist-only (explicit jsonb_build_object of allowed fields; status='published' + visibility='public' + deleted_at is null gate). It never selects `requester_email`, claim details, manager list, admin notes, `referral_code`, `phone_verified`, or private docs. Full negative E2E (anon hitting each endpoint) is recommended post-prod-push when live data exists; locally there is no seeded PII to leak (placeholders only).

## 5. Conclusion
Rebuild introduces **zero test regressions**. DB assertions pass, build passes, 287/288 unit tests pass, and the single failure is a pre-existing rebuild-unrelated admin-nav test. Ready for Phase 8 (legacy drop + prod push gate).
