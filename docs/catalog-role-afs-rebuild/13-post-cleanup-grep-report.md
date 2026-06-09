# 13 — Post-Cleanup Grep Report (Phase 7)

> **Date:** 2026-06-09 · Repo-wide sweep for legacy strings per plan §17/§18.6.

## 1. Old table names in runtime + test code → ZERO
After Phase 4 (runtime) + Phase 7 (tests) rewire, a sweep of `src/**/*.{ts,tsx}` for the 9 renamed tables (`attribute_catalog`, `feature_catalog`, `profile_section_catalog`, `role_attribute_rules`, `role_feature_flags`, `role_profile_section_rules`, `catalog_item_attributes`, `catalog_claim_requests`, `catalog_item_memberships`) returns **0** matches, excluding `src/integrations/supabase/types.ts` (auto-generated, regenerated to new names).

Fixes applied in Phase 7:
- `AdminNewMemberGuidePage.tsx` — 3 explanatory-copy refs `catalog_item_attributes` → `catalog_item_attribute_values`.
- `MessagesInbox.test.tsx`, `AdminAttributesPage.test.tsx` — mock table names → new names.

## 2. Role-family concepts in runtime code → ZERO
Sweep for `family_key | parent_role_id | role_family | inherits_from | roleFamily | parentRole`: only the (now-removed) `AdminNewMemberGuidePage` family logic existed; after Phase 6 it is gone. The infogram's residual `aile` strings are **negating copy** ("aile … yoktur" = "there is no family") + CSS `font-family`, not family logic.

## 3. Intentional exception — landing/marketing submission categories (NOT touched)
The strings `danisman`, `isletme`, `bireysel`, `dernek`, `sehir-elcisi`, `blogger-vlogger` appear in:
- `src/components/CategoriesSection.tsx`, `Founding1000Section.tsx`, `InterestForm.tsx`, `RegisterInterestForm.tsx`
- `src/lib/chatConfig.ts`

These are **landing/marketing "interest category" values bound to the `submissions` table** (`@/lib/submissions`), NOT the RolesGo flat-role system. They are a separate, pre-existing taxonomy on the public marketing site. They do **not** reference `roles`, `user_role_assignments`, or any AFS table. Touching them would break working landing forms for zero rebuild benefit.

**Decision (user-confirmed):** leave them untouched; documented here as a deliberate, scoped exception. The rebuild concerns the RolesGo catalog/role/AFS system only.

## 4. Migrations / docs references (allowed)
Old table names still appear in:
- Historical migration files (immutable — cannot be reordered/deleted; the rename migrations themselves naturally name both old and new).
- Rebuild docs (`docs/catalog-role-afs-rebuild/*`) — descriptive/audit references.
These are explicitly permitted by plan §18.6 ("yalnızca migration geçmişi veya açıklayıcı cleanup dokümanları içindeki zorunlu referanslara izin ver").

## 5. Conclusion
Runtime code (src, excl. auto-gen types + the scoped landing exception) is free of old RolesGo table names and role-family concepts. Cleanup grep target met.
