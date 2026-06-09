# 08 — Frontend Integration Report (Phase 5)

> **Date:** 2026-06-09 · Decision: **verify-and-proceed** (no gratuitous rewrite — YAGNI).

## 1. Finding: frontend already runs on the flat-role system
The June AFS rebuild already migrated the member/profile/directory screens onto the flat-role + AFS model. Phase 4 made them table-rename-compatible. Evidence:

- **No real role-family residue in runtime code.** A repo-wide scan for `family_key | parent_role_id | role_family | inherits_from | roleFamily | parentRole` across `src/**/*.{ts,tsx}` returns exactly ONE hit: `AdminNewMemberGuidePage.tsx:642` (`key={group.family}`) — and that page is in Phase 6 scope (guide rebuild). `ServiceRequestForm.tsx`'s `subcategory` state is a **service-request form field**, not a role subcategory.
- **Role selection is flat.** `AdminRoleManagementPage.tsx` lists roles via `.from("roles")` (the `roles` table, not renamed, flat — no family/parent columns after migration 003).
- **Profile screens build clean.** `DirectoryCatalogItemPage`, `DirectoryProfilePage`, `ProfilePage`, `IndependentProfilePage`, `CatalogItemEditorPage` were data-access-rewired in Phase 4 and `npm run build` PASSES (2858 modules, no TS errors).

## 2. Plan §13 mapping
| Plan §13 requirement | Status |
|---|---|
| 13.1 New-member form: flat role list (no family/subcategory) | ✅ already flat (`.from("roles")`) |
| 13.1 dynamic form from role attributes | ✅ existing role-attribute-driven form (now `role_attributes`) |
| 13.2 public profile = public fields only | ✅ via existing directory/public RPCs (Phase 4-rewired) + new `get_public_catalog_item_profile` available |
| 13.3 owner profile edit | ✅ `CatalogItemEditorPage` + owner RPCs |
| 13.4 admin profile | ✅ admin catalog/profile pages |

## 3. New whitelist RPCs (migration 010) — available, optional adoption
`get_flat_roles`, `get_role_form_schema`, `get_public_catalog_item_profile` are seeded and callable. They are a cleaner whitelist surface but the existing screens already function; adopting them is an optional follow-up, not a blocker. Not forcing a rewrite avoids regressions in working screens.

## 4. Verification performed
- `npm run build`: PASS (built 22.74s with regenerated types).
- Old table-name refs in runtime `src`: zero (outside `types.ts`, tests, and the Phase-6 admin guide/DB-browser pages).
- Local DB `supabase start` verification: PASSED (76 roles / 53 attrs / 42 features / 7 sections / 76 placeholders).

## 5. Conclusion
Phase 5 requires no screen rewrite. The frontend is flat-role-correct and rename-compatible. Proceeding to Phase 6 (admin Database menu + guide + infogram — the genuine remaining UI work) and Phase 7 (E2E + cleanup grep).
