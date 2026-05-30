# Clean Code & Security Report

**Proje:** corteqs_landing
**Tarih:** 2026-05-15

---

## 1. Executive Summary

| Metric | Before | After |
|--------|--------|-------|
| Lint errors | 2 | 0 |
| Lint warnings | 10 | 10 (shadcn/react-refresh, acceptable) |
| Test failures | 2 | 0 |
| Test files passing | 37/38 | 38/38 |
| Tests passing | 100/102 | 102/102 |
| Build | OK | OK |
| Root-level clutter files | 21 | 0 |
| Unused dependencies | 1 | 0 |

---

## 2. Code Fixes Applied

### 2.1 Lint Error Fixes

| File | Issue | Fix |
|------|-------|-----|
| `src/App.addwa-routes.test.tsx:9` | `useLocation` called in lowercase mock function | Renamed to `MockAddWA` (uppercase) to satisfy rules-of-hooks |
| `src/pages/CommercialDocumentPage.tsx:17` | `useEffect` called conditionally after early returns | Moved hook above conditional returns |

### 2.2 Test Fix

| File | Issue | Fix |
|------|-------|-----|
| `src/App.may19-routes.test.tsx:41,50` | Test expected nav link "19 mayis etkinlikleri" that was removed from UI | Removed stale assertion; route rendering test retained |

---

## 3. Secret Scan Findings

### 3.1 Environment Files

| File | Status |
|------|--------|
| `.env.example` | OK - Only placeholders |
| `.env` | OK - Only VITE_* public vars |
| `.env.local` | OK - Gitignored via `*.local` pattern. Contains real secrets but never committed. |

### 3.2 [CRITICAL] `VITE_ADMIN_PASSWORD` in `.env.local`

- Has `VITE_` prefix, making it eligible for frontend bundling
- Currently NOT referenced in any source file, so not in bundle
- **Recommendation:** Rename to `ADMIN_PASSWORD` (remove VITE_ prefix), move admin auth to server-side

### 3.3 [CRITICAL] Secrets in Git History

- `secret.md` (deleted) contains two Supabase access tokens (`sbp_9c1a...`, `sbp_1b4b...`)
- **Recommendation:** Rotate both tokens immediately. Consider `git filter-repo` to purge history.

### 3.4 [MEDIUM] `dangerouslySetInnerHTML` Without Sanitization

- `src/pages/CommercialDocumentPage.tsx:83` renders `document.html` without sanitization
- Currently safe (all `html` fields are `undefined`), but risky if populated from external input
- `sanitizeHtml()` exists in `src/lib/security.ts:14` but is NOT applied at this usage site

### 3.5 Server Secrets

All server secrets (SUPABASE_SERVICE_ROLE_KEY, RESEND_API_KEY, GEMINI_API_KEY, RAG_API_SECRET) are correctly:
- NOT prefixed with `VITE_`
- Only accessed via `Deno.env.get()` in edge functions
- Not present in any `src/` file

---

## 4. Security Findings

### 4.1 [CRITICAL] `wa_users` Table - No RLS

- Table created without `ENABLE ROW LEVEL SECURITY`
- Full public read/write access to PII (names, emails, phones, WhatsApp IDs)
- **Action:** Add RLS policies immediately

### 4.2 [MEDIUM] `social_media_links` Public SELECT

- Policy allows anon to read all rows with `USING (true)`
- Missed by the security hardening migration that locked down split tables
- **Action:** Restrict to admin-only

### 4.3 [MEDIUM] No Bot/Spam Prevention on Forms

- No honeypot fields or CAPTCHA on submission forms
- Bot protection relies solely on edge function rate limiting
- **Action:** Add honeypot fields to public forms

### 4.4 [MEDIUM] Referral Code ID Leakage

- `validate_and_bind_referral_code` RPC returns `referral_code_id` to anon users
- Attacker can enumerate valid codes
- **Action:** Remove UUID from public RPC response

### 4.5 Security OK Items

- Admin auth is RLS-protected (not UI-only)
- No localStorage admin bypass possible
- All edge functions have `verify_jwt = true`
- CORS restricts to corteqs.net + localhost
- Zod validation on all edge function inputs
- Rate limiting implemented on all active edge functions
- PII redacted before sending to Gemini API
- RAG API secret NOT exposed to frontend
- Security headers properly configured in nginx
- `env-config.js` has no-cache policy

---

## 5. Dependency Audit

### 5.1 Vulnerabilities

| Severity | Count | Key Issues |
|----------|-------|------------|
| Critical | 0 | - |
| High | 5 | d3-color ReDoS (via react-simple-maps) |
| Moderate | 2 | esbuild info leak, vite path traversal |
| Low | 3 | jsdom chain via http-proxy-agent |

All fixes require major version bumps. No patch-level fixes available.

### 5.2 Unused Dependency Removed

| Package | Reason |
|---------|--------|
| `@tailwindcss/typography` | Not in tailwind plugins, no `prose` class used |

### 5.3 Dead Code Candidates

These files have no external consumers and may be WIP features:

| File | Exports | Status |
|------|---------|--------|
| `src/lib/dashboard/meeting-notes-data.ts` | 14 | No consumers |
| `src/lib/dashboard/todo-items.ts` | 10 | No consumers |
| `src/lib/dashboard/command-center-items.ts` | 24+ | No consumers |
| `src/components/chat/RagChat.tsx` | 1 | No route imports it |

**Action:** Evaluate for deletion or archival in a separate task.

---

## 6. Acceptance Criteria Status

- [x] Build succeeds
- [x] Lint clean (0 errors; 10 warnings are shadcn/react-refresh, documented)
- [x] Tests pass (102/102)
- [x] Unnecessary files archived to `_archive/cleanup-2026-05-15/`
- [x] Every archived file has a reason documented (see ARCHIVED_FILES.md)
- [x] `.gitignore` excludes real `.env` files
- [x] `.env.example` contains no real secrets
- [x] Server-only secrets not in frontend bundle
- [x] Admin auth model not weakened
- [x] RLS policies not loosened
- [x] Edge Function security preserved
- [x] Final reports in `docs/cleanup/`
