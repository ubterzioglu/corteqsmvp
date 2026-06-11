# SECURITY FIX PLAN

## Prioritized checklist

### 1. Lock down backend authorization for admin workspace data

- Priority: Highest
- Complexity: Medium
- Affected files:
  - `supabase/migrations/20260510130000_create_command_center_items_workspace.sql`
  - `supabase/migrations/20260510131000_create_resource_entries_workspace.sql`
  - `supabase/migrations/20260510132000_create_mvp_items_workspace.sql`
- Actions:
  - replace `to authenticated using (true)` policies with admin membership checks
  - restrict storage policies for `cv-files` and `arge-files` to admins
  - add regression tests for anon vs authenticated non-admin vs admin
- Regression tests needed:
  - non-admin cannot read/write workspace tables
  - non-admin cannot create signed URLs for admin file buckets
  - admin behavior still works

### 2. Remove public PII exposure from advisor CRM tables

- Priority: Highest
- Complexity: Medium
- Affected files:
  - `supabase/migrations/20260424123000_add_admin_resource_links.sql`
  - `supabase/migrations/20260424180000_split_advisor_profiles.sql`
  - possibly follow-up cleanup migration for legacy `advisor_social_media_links`
- Actions:
  - remove `anon, authenticated` public SELECT from CRM tables
  - decide whether a separate sanitized public table/view is needed
  - migrate public-safe fields only if business requires public visibility
- Regression tests needed:
  - anon cannot select CRM contact fields
  - admin can still manage records
  - public social-only records remain accessible only if explicitly intended

### 3. Make submission documents private

- Priority: Highest
- Complexity: Medium
- Affected files:
  - `supabase/migrations/20260421161000_add_matching_and_documents.sql`
  - `src/lib/submissions.ts`
  - `src/pages/admin/AdminMembersPage.tsx`
- Actions:
  - change bucket `submission-documents` to private
  - remove `getPublicUrl()`
  - serve documents with signed URLs or admin-only backend mediation
  - review existing stored public URLs and plan migration/rotation
- Regression tests needed:
  - uploaded document is not retrievable without auth/signed URL
  - admin can still open document details
  - public submission flow still succeeds

### 4. Restrict `find-matches` to non-identifiable or authorized use only

- Priority: Highest
- Complexity: High
- Affected files:
  - `supabase/functions/find-matches/index.ts`
  - `src/components/ChatRegisterBar.tsx`
  - `supabase/config.toml`
  - possibly `supabase/migrations/20260421161000_add_matching_and_documents.sql`
- Actions:
  - stop returning names/cities/countries to public users
  - if preview remains public, return only coarse categories or “matches exist” flags
  - consider requiring authenticated admin context for persisted matching
  - review `matches` table SELECT policy
- Regression tests needed:
  - public visitor cannot obtain identifiable match data
  - admin/internal review can still inspect match details
  - persisted matching still works for allowed roles

### 5. Add consent-aware AI data minimization

- Priority: High
- Complexity: Medium
- Affected files:
  - `src/components/ChatRegisterBar.tsx`
  - `supabase/functions/chat-register/index.ts`
  - `supabase/functions/find-matches/index.ts`
- Actions:
  - gate third-party AI calls behind explicit privacy consent, or
  - strip email, phone, and full name before external calls
  - validate tool outputs with Zod before use
- Regression tests needed:
  - no email/phone sent before consent
  - malformed LLM output is rejected safely

### 6. Protect public email and AI endpoints from abuse

- Priority: High
- Complexity: Medium
- Affected files:
  - `supabase/functions/send-submission-email/index.ts`
  - `supabase/functions/chat-register/index.ts`
  - `supabase/functions/find-matches/index.ts`
  - `server.mjs`
  - `nginx.conf.template`
- Actions:
  - add rate limiting
  - add request size limits
  - add replay/abuse protection for mail function
  - tie mail sending to trusted submission ids or a database-triggered flow
- Regression tests needed:
  - burst traffic triggers throttling
  - direct unauthenticated mail abuse attempts fail
  - normal form submissions still deliver mail

### 7. Remove deprecated unauthenticated function surface

- Priority: Medium
- Complexity: Low
- Affected files:
  - `supabase/config.toml`
  - `supabase/functions/lansman-admin/index.ts`
- Actions:
  - remove `lansman-admin` from deployable config or set `verify_jwt = true`
  - document deprecation
- Regression tests needed:
  - function is absent or protected in deployed environment

### 8. Fix CSV export formula injection

- Priority: Medium
- Complexity: Low
- Affected files:
  - `src/pages/admin/AdminMembersPage.tsx`
- Actions:
  - prefix dangerous spreadsheet-leading characters with `'`
  - add tests for `=`, `+`, `-`, `@`
- Regression tests needed:
  - exported CSV renders text, not formulas

### 9. Add CSP and deployment hardening

- Priority: Medium
- Complexity: Medium
- Affected files:
  - `nginx.conf.template`
  - `server.mjs`
  - possibly `index.html`
- Actions:
  - add a restrictive CSP compatible with Vite assets and required network destinations
  - add upstream timeouts for `/api/chat`
  - align nginx and `server.mjs` behavior as closely as possible
- Regression tests needed:
  - application still loads under CSP
  - chat/API calls still work

### 10. Upgrade vulnerable dependencies

- Priority: Medium
- Complexity: Low
- Affected files:
  - `package.json`
  - `package-lock.json`
- Actions:
  - upgrade `postcss` to a patched version
  - rerun `npm audit`
- Regression tests needed:
  - build passes
  - `npm audit` is clean or improved

## Suggested implementation order

1. Fix RLS/storage overexposure for workspace and advisor CRM data.
2. Make `submission-documents` private and migrate retrieval paths.
3. Restrict `find-matches` output and review `matches` table policy.
4. Add AI privacy minimization and validation.
5. Add rate limiting and proof-of-insert protection for public endpoints.
6. Remove `lansman-admin` public surface.
7. Fix CSV export injection.
8. Add CSP and proxy hardening.
9. Upgrade dependencies and rerun checks.

## Regression test matrix

- Auth matrix:
  - anon
  - authenticated non-admin
  - authenticated admin
- Data surfaces:
  - workspace tables
  - advisor CRM tables
  - `submissions`
  - `matches`
  - storage buckets
- Endpoint surfaces:
  - `chat-register`
  - `find-matches`
  - `send-submission-email`
  - `/api/chat`
- Export/upload surfaces:
  - CSV export
  - file upload and retrieval

## Notes

- No application code has been changed yet.
- This plan assumes repository evidence only.
- Production-specific items still need manual verification in the Supabase dashboard and deployment platform.
