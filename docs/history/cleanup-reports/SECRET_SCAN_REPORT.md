# Secret Scan Report

**Proje:** corteqs_landing
**Tarih:** 2026-05-15

---

## 1. Environment File Analysis

### `.env.example` - OK
Contains only placeholder values. No real secrets.

### `.env` - OK
Contains only `VITE_*` public Supabase variables. No real secrets.

### `.env.local` - [CRITICAL] Contains real secrets (gitignored, never committed)

**Variables containing real secrets:**
- `ACCESS_TOKEN` - Meta/Facebook API long-lived token
- `SUPABASE_SERVICE_ROLE_KEY` - Full service role JWT (admin bypasses RLS)
- `SUPABASE_ACCESS_TOKEN` - Supabase management API token (`REDACTED_SUPABASE_TOKEN_MASKED`)
- `SUPABASE_DB_PASSWORD` - Plaintext DB password
- `VERIFY_TOKEN` - Webhook verification token
- `RAG_API_SECRET` - RAG API secret
- `VITE_ADMIN_PASSWORD` - Admin password (VITE_ prefix = frontend-exposable!)
- `SUPABASE_ACCESS_TOKEN_BACKUP` - Second management API token (`REDACTED_SUPABASE_TOKEN_MASKED`)
- `SUPABASE_DB_URL` - PostgreSQL URL with embedded password

**Mitigating factors:** `.env.local` is gitignored via `*.local` pattern.

---

## 2. Code Pattern Scan Results

### Server Secrets in Source Code

| Secret Pattern | Files Found | Frontend? | Status |
|---------------|-------------|-----------|--------|
| `SUPABASE_SERVICE_ROLE_KEY` | 4 edge functions (`Deno.env.get()`) | No | OK |
| `RESEND_API_KEY` | `send-submission-email/index.ts:226` | No | OK |
| `GEMINI_API_KEY` | `find-matches/index.ts:217`, `chat-register/index.ts:266` | No | OK |
| `RAG_API_SECRET` | Not found in source code | N/A | OK |

### Hardcoded Patterns in `src/`

| Pattern | Count | Status |
|---------|-------|--------|
| `sk-` (OpenAI keys) | 0 | OK |
| `eyJ` (JWT literals) | 0 | OK |
| `xoxb-` (Slack tokens) | 0 | OK |
| `api_key` / `apikey` | 0 | OK |
| `access_token` | 1 (URL fragment parsing in ResetPasswordPage) | OK |
| `eval(` | 0 | OK |
| `new Function(` | 0 | OK |
| `innerHTML` | 0 | OK |

### `dangerouslySetInnerHTML` Usage

| File | Line | Risk | Status |
|------|------|------|--------|
| `CommercialDocumentPage.tsx` | 83 | [MEDIUM] Renders `document.html` without sanitization. Currently `undefined` for all entries. | Safe today |
| `chart.tsx` | 70 | [LOW] Internal CSS variable generation | Safe |

---

## 3. Git History Findings

### [CRITICAL] `secret.md` - Committed and Later Deleted

- Commit `a082bd9`: Added `REDACTED_SUPABASE_TOKEN_1` (Supabase access token)
- Commit `e32a935`: Changed to `REDACTED_SUPABASE_TOKEN_2`
- Commit `99af624`: Deleted file
- **Both tokens remain recoverable from git history**

### [LOW] `.env` - Committed and Later Deleted

- Commit `121cb97`: Contained Supabase anon key (public-by-design)
- Commit `63c81d0`: Deleted
- Anon key is public-safe, low risk

---

## 4. Frontend Bundle Risk

### VITE_ Variables Actually Used

| Variable | Files | Value Type | Status |
|----------|-------|------------|--------|
| `VITE_SUPABASE_URL` | `supabase.ts:16`, `client.ts:17` | Public URL | OK |
| `VITE_SUPABASE_ANON_KEY` | `supabase.ts:21` | Public key | OK |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | `client.ts:19` | Public key | OK |
| `VITE_SUPABASE_PROJECT_ID` | Runtime config types | Public ID | OK |

### [HIGH] `VITE_ADMIN_PASSWORD` - Defined but Unused

- Has `VITE_` prefix (eligible for frontend bundling)
- Not referenced in any source file currently
- **Risk:** Any future `import.meta.env.VITE_ADMIN_PASSWORD` would ship password to all browsers
- **Recommendation:** Rename to `ADMIN_PASSWORD` (no VITE_ prefix)

---

## 5. Recommended Actions

| Priority | Action |
|----------|--------|
| **CRITICAL** | Rotate both `REDACTED_SUPABASE_TOKEN_*` Supabase access tokens from git history |
| **CRITICAL** | Rename `VITE_ADMIN_PASSWORD` to `ADMIN_PASSWORD` |
| **HIGH** | Apply `sanitizeHtml()` to `CommercialDocumentPage.tsx:83` |
| **MEDIUM** | Add `.env.local` warning comment about `VITE_` prefix |
| **LOW** | Consider `git filter-repo` to purge `secret.md` from history |

