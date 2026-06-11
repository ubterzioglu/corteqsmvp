# SECURITY AUDIT REPORT

## Executive summary

Overall risk level: High.

I did not confirm a repo-only Critical issue, but I did confirm several High-impact problems:

- admin-only workspace data is writable/readable by any authenticated Supabase user
- advisor CRM tables expose PII to the public through `anon` SELECT policies
- uploaded submission documents are intentionally public and globally readable
- the public AI matching flow can disclose existing member data to any visitor
- personal data is sent to third-party AI services before final consent is required

The strongest recurring pattern is a mismatch between the frontend admin model and the backend policy model. The React app checks `admin_users`, but several database and storage policies rely only on `authenticated`, not on admin membership.

## Attack surface map

### Public routes

- `/`
- `/hakkimizda`
- `/founders`
- `/radar`
- `/commercial`
- `/commercial/:slug`
- `/diaspora/:slug`
- `/lansman`
- `/form`
- `/privacy-policy`
- `/founding-1000`
- `/blogger-yarismasi`
- `/vlogger-yarismasi`
- public AI registration flow in `src/components/ChatRegisterBar.tsx`
- public RAG chat UI in `src/components/chat/RagChat.tsx`

### Admin routes

- `/admin`
- `/admin/members`
- `/admin/lansman`
- `/admin/referral`
- `/admin/referral/sources`
- `/admin/referral/groups`
- `/admin/referral/types`
- `/admin/marquee`
- `/admin/advisors/:profile`
- `/admin/social-media`
- `/admin/about`
- `/admin/workspace/*`
- muhasebe routes under `/admin`

### Edge Functions

- `send-submission-email`
- `chat-register`
- `find-matches`
- `lansman-admin`

### Supabase tables seen in repo or generated types

- `admin_users`
- `submissions`
- `lansman_registrations`
- `referral_sources`
- `referral_groups`
- `referral_types`
- `referral_codes`
- `referral_code_usages`
- `marquee_items`
- `news_posts`
- `matches`
- `expenses`
- `incomes`
- `social_media_links`
- `advisor_social_media_links`
- `consultant_social_media_links`
- `influencer_social_media_links`
- `contributor_social_media_links`
- `command_center_items`
- `resource_entries`
- `mvp_items`
- `wa_users`

### Storage buckets

- `submission-documents`
- `cv-files`
- `arge-files`
- `newsimage`

### External services

- Supabase Auth / Postgres / Storage / Edge Functions
- Resend
- Google Gemini API (`generativelanguage.googleapis.com`)
- `https://rag.corteqs.net/api/chat`

### Deployment/runtime surfaces

- `Dockerfile`
- `nginx.conf.template`
- `server.mjs`
- `docker-entrypoint-env.sh`
- public runtime config file `/env-config.js`

## Critical findings

No repository-confirmed Critical findings.

The closest issue to Critical is the public AI matching flow leaking member data, but based on repository evidence alone I am classifying it as High rather than Critical because I cannot prove the production sensitivity/classification of every exposed record.

## High findings

### SEC-001: Non-admin authenticated users can read and modify admin-only workspace data and files

- Severity: High
- Confidence: Confirmed
- Category: RLS
- Affected files:
  - `supabase/migrations/20260510130000_create_command_center_items_workspace.sql:90-105`
  - `supabase/migrations/20260510131000_create_resource_entries_workspace.sql:30-66`
  - `supabase/migrations/20260510132000_create_mvp_items_workspace.sql:29-42`
  - `src/components/dashboard/links/LinkManager.tsx:163-194`
  - `src/components/dashboard/links/LinkManager.tsx:307-325`
- Affected tables/functions/buckets/routes:
  - `command_center_items`
  - `resource_entries`
  - `mvp_items`
  - storage buckets `cv-files`, `arge-files`
  - admin workspace routes under `/admin/workspace/*`
- Evidence:
  - `command_center_items` grants `FOR SELECT` and `FOR ALL` to `authenticated` with `using (true)` / `with check (true)`.
  - `resource_entries` grants `FOR SELECT` and `FOR ALL` to `authenticated` with `using (true)` / `with check (true)`.
  - `mvp_items` grants `FOR SELECT` and `FOR ALL` to `authenticated` with `using (true)` / `with check (true)`.
  - storage policies for `cv-files` and `arge-files` allow `FOR ALL TO authenticated` based only on bucket id.
  - frontend admin UX checks `admin_users` in `src/components/admin/AdminLayout.tsx:62-86` and `src/lib/admin.ts:12-18`, but those backend policies do not.
- Exploitation scenario:
  - A non-admin authenticated Supabase user can bypass the hidden admin UI and call Supabase directly to read, insert, update, or soft-delete command center items, MVP items, resource entries, CV files, and ARGE files.
  - The same user can generate signed URLs for stored files through the browser client because storage access is also `authenticated`-wide.
- Impact:
  - unauthorized read/write access to internal planning data
  - unauthorized access to potentially sensitive CV files and ARGE files
  - privilege escalation from “authenticated user” to “effective workspace editor”
- Recommended fix:
  - change all workspace table and storage policies from `authenticated` to explicit admin checks, for example `exists (select 1 from public.admin_users where user_id = auth.uid())` or `public.is_admin(auth.uid())`
  - add separate least-privilege read/write policies if non-admin access is truly required
  - review all storage buckets referenced by `resource_entries` and restrict signed URL creation to admins
- Suggested test or PoC:
  - create a non-admin authenticated user
  - try `select`, `insert`, `update`, and `delete` against `command_center_items`, `resource_entries`, and `mvp_items`
  - try `storage.from('cv-files').createSignedUrl(...)`
- Status:
  - Confirmed vulnerability

### SEC-002: Advisor CRM tables expose personal contact data to the public

- Severity: High
- Confidence: Confirmed
- Category: RLS
- Affected files:
  - `supabase/migrations/20260424180000_split_advisor_profiles.sql:3-18`
  - `supabase/migrations/20260424180000_split_advisor_profiles.sql:88-142`
  - `supabase/migrations/20260424143000_extend_advisor_contact_tracking.sql:3-18`
  - `supabase/migrations/20260424123000_add_admin_resource_links.sql:71-90`
  - `src/pages/admin/AdminAdvisorLinksPage.tsx:275-301`
- Affected tables/functions/buckets/routes:
  - `consultant_social_media_links`
  - `influencer_social_media_links`
  - `contributor_social_media_links`
  - likely also legacy `advisor_social_media_links`
- Evidence:
  - the split advisor tables contain `name`, `email`, `phone`, `whatsapp`, `instagram`, and contact-status booleans.
  - each split table has `FOR SELECT TO anon, authenticated USING (true)`.
  - legacy `advisor_social_media_links` also has public SELECT and was later extended with contact fields.
- Exploitation scenario:
  - any unauthenticated internet user can query these tables directly with the public Supabase credentials and retrieve advisor names, emails, phone numbers, WhatsApp handles, and internal “contacted/not contacted” state.
- Impact:
  - direct PII disclosure
  - exposure of internal outreach workflow
  - potential privacy/compliance breach
- Recommended fix:
  - remove public SELECT from advisor CRM tables
  - split public marketing/social links from private CRM/contact-tracking records
  - if some fields must remain public, expose a separate sanitized view/table with only approved public columns
- Suggested test or PoC:
  - with only anon credentials, call `select *` on each advisor table and verify that rows are returned
- Status:
  - Confirmed vulnerability

### SEC-003: Submission documents are globally readable and publicly linked

- Severity: High
- Confidence: Confirmed
- Category: Storage
- Affected files:
  - `supabase/migrations/20260421161000_add_matching_and_documents.sql:7-39`
  - `src/lib/submissions.ts:254-279`
  - `src/components/RegisterInterestForm.tsx:86-100`
  - `src/components/BackerForm.tsx:132-155`
  - `src/components/ChatRegisterBar.tsx:186-217`
- Affected tables/functions/buckets/routes:
  - bucket `submission-documents`
  - `submissions.documents`
  - `submissions.document_url`
- Evidence:
  - migration creates bucket `submission-documents` with `public = true`.
  - storage policies allow `INSERT` and `SELECT` to `anon, authenticated`.
  - uploaded files are turned into `getPublicUrl()` links and stored in database rows.
- Exploitation scenario:
  - anyone can upload files into the bucket, and anyone can read any object in the bucket.
  - if a public URL leaks from the UI, email, logs, or exports, the file is directly retrievable without auth.
  - because the bucket is public, privacy does not depend on signed URLs or ownership checks.
- Impact:
  - public exposure of CVs, certificates, portfolios, or personal documents
  - storage abuse and content pollution by anonymous uploads
- Recommended fix:
  - make `submission-documents` private
  - replace `getPublicUrl()` with signed URLs or an admin-checked download endpoint
  - require storage object naming tied to submission ownership or server-generated identifiers
  - add upload abuse controls for anonymous traffic
- Suggested test or PoC:
  - upload a document as an anonymous visitor
  - open the returned public URL in a private browser session and verify public access
- Status:
  - Confirmed vulnerability

### SEC-004: Public AI matching flow can disclose existing submission data to any visitor

- Severity: High
- Confidence: Confirmed
- Category: Edge Function
- Affected files:
  - `src/components/ChatRegisterBar.tsx:140-165`
  - `src/components/ChatRegisterBar.tsx:275-290`
  - `supabase/config.toml:3-7`
  - `supabase/functions/find-matches/index.ts:94-162`
  - `supabase/functions/find-matches/index.ts:208-243`
- Affected tables/functions/buckets/routes:
  - Edge Function `find-matches`
  - table `submissions`
  - table `matches`
- Evidence:
  - the public chat UI invokes `find-matches` with no sign-in flow.
  - the function uses `SUPABASE_SERVICE_ROLE_KEY` to fetch up to 200 recent `submissions`.
  - it sends `fullname`, `city`, `country`, `field`, `category`, and `offers_needs` context into the matching pipeline and returns enriched matches containing `fullname`, `city`, `country`, `field`, `category`, `score`, and `reason`.
  - config only sets `verify_jwt = true`; it does not make the endpoint admin-only. In this app, the function is explicitly called from a public browser flow.
- Exploitation scenario:
  - a visitor can use the AI registration flow, provide crafted `offers_needs` text, and receive names and profile snippets from existing submissions before creating an account or being approved by an admin.
- Impact:
  - unauthorized disclosure of member/lead data
  - potential deanonymization of offers/needs and geographic details
  - privacy breach amplified by service-role access
- Recommended fix:
  - stop returning other users’ identities in public preview responses
  - if preview is required, return only abstract category-level hints, not names or locations
  - require explicit authenticated/admin context for persistent or identifiable matching
  - minimize data sent to the LLM and to the client
- Suggested test or PoC:
  - from a fresh browser session, trigger the AI chat and ask for a matching-oriented request
  - verify whether returned matches include real names and locations
- Status:
  - Confirmed vulnerability

### SEC-005: Personal data is sent to third-party AI before final consent is required

- Severity: High
- Confidence: Confirmed
- Category: AI
- Affected files:
  - `src/components/ChatRegisterBar.tsx:140-147`
  - `src/components/ChatRegisterBar.tsx:265-279`
  - `supabase/functions/chat-register/index.ts:55-61`
  - `supabase/functions/chat-register/index.ts:115-151`
  - `supabase/functions/find-matches/index.ts:138-162`
- Affected tables/functions/buckets/routes:
  - `chat-register`
  - `find-matches`
  - external service Google Gemini API
- Evidence:
  - `ChatRegisterBar` sends conversation history and collected fields to `chat-register` during normal conversation, not only after consented submit.
  - `chat-register` appends `JSON.stringify(collected)` to the system prompt and forwards it to the external AI gateway.
  - collected fields include name, city, country, email, phone, business, and offers/needs.
  - `find-matches` also forwards candidate profile snippets and need descriptions externally.
- Exploitation scenario:
  - a visitor starts the public AI conversation and provides PII.
  - PII is transmitted to an external LLM provider before the final “Kaydı Tamamla” consent gate.
- Impact:
  - privacy/compliance exposure
  - unnecessary third-party processing of personal data
  - broader blast radius if the AI provider logs or retains prompts
- Recommended fix:
  - require explicit privacy consent before sending user PII to external AI
  - pseudonymize or omit email/phone/full name from AI prompts
  - separate “conversation guidance” from “submission persistence” and apply strict data minimization
- Suggested test or PoC:
  - instrument request logging in a staging copy and verify that email/phone are sent to the AI gateway before final submit
- Status:
  - Confirmed vulnerability

## Medium findings

### SEC-006: Public mail function can likely be abused for spam and unsolicited confirmation mail

- Severity: Medium
- Confidence: High
- Category: Edge Function
- Affected files:
  - `src/lib/mail.ts:11-16`
  - `src/components/RegisterInterestForm.tsx:92-100`
  - `src/components/BackerForm.tsx:149-156`
  - `src/components/ChatRegisterBar.tsx:215-217`
  - `supabase/functions/send-submission-email/index.ts:124-163`
- Affected tables/functions/buckets/routes:
  - `send-submission-email`
- Evidence:
  - public browser code invokes `send-submission-email` directly after insert.
  - the function validates only that `submission.email` exists and matches a basic regex.
  - it can email the admin inbox and optionally send a confirmation mail to the submitted email address.
  - there is no proof-of-insert binding, no HMAC, no replay token, and no rate limiting in repo.
- Exploitation scenario:
  - an attacker calls the function directly with arbitrary payloads and causes repeated admin notifications or unsolicited confirmation emails to third parties.
- Impact:
  - email spam
  - reputation damage
  - potential provider quota exhaustion
- Recommended fix:
  - move mail sending to a server-side/database-triggered flow that checks a real inserted submission id
  - require a trusted token or admin-only execution path for resend actions
  - add rate limiting and abuse monitoring
- Suggested test or PoC:
  - in staging, invoke the function twice with the same fake payload and verify duplicate mails are sent
- Status:
  - Likely risk

### SEC-007: Public AI and RAG endpoints have no visible abuse controls

- Severity: Medium
- Confidence: Confirmed
- Category: Proxy
- Affected files:
  - `src/lib/ragApi.ts:6-17`
  - `server.mjs:112-145`
  - `nginx.conf.template:27-35`
  - `supabase/functions/chat-register/index.ts:47-161`
  - `supabase/functions/find-matches/index.ts:93-250`
- Affected tables/functions/buckets/routes:
  - `/api/chat`
  - `chat-register`
  - `find-matches`
- Evidence:
  - no CAPTCHA, no request throttling, no per-IP quota, and no body size checks were found in repo.
  - `/api/chat` forwards arbitrary POST bodies to an authenticated upstream.
  - `chat-register` and `find-matches` call external paid AI services.
- Exploitation scenario:
  - automated traffic can repeatedly hit the public chat and match endpoints, driving LLM costs and degrading service.
- Impact:
  - cost abuse
  - availability degradation
  - upstream quota exhaustion
- Recommended fix:
  - add IP- and session-based rate limiting
  - set request body limits and timeouts
  - add abuse telemetry and, for public forms, bot mitigation such as Turnstile/hCaptcha
- Suggested test or PoC:
  - from staging, send repeated requests and verify whether any 429 or timeout controls appear
- Status:
  - Confirmed vulnerability

### SEC-008: CSV export is vulnerable to formula injection

- Severity: Medium
- Confidence: Confirmed
- Category: Input Validation
- Affected files:
  - `src/pages/admin/AdminMembersPage.tsx:757-775`
- Affected tables/functions/buckets/routes:
  - `/admin/members`
  - CSV export workflow
- Evidence:
  - CSV cells are only quote-escaped; they are not neutralized when starting with `=`, `+`, `-`, or `@`.
  - exported columns include user-controlled fields such as full name, city, email, and referral code.
- Exploitation scenario:
  - an attacker submits a member record with a spreadsheet formula payload.
  - when an admin exports and opens the CSV in Excel/LibreOffice, the formula executes.
- Impact:
  - local client-side code execution within spreadsheet formula capabilities
  - exfiltration of opened workbook data
  - phishing or command execution chains depending on spreadsheet/client settings
- Recommended fix:
  - prefix risky cells with `'` before CSV generation
  - sanitize/export using a dedicated CSV-safe serializer
- Suggested test or PoC:
  - submit `=HYPERLINK("https://attacker.example","click")` as a name and export the CSV
- Status:
  - Confirmed vulnerability

### SEC-009: Deprecated `lansman-admin` remains configured as unauthenticated surface

- Severity: Medium
- Confidence: Confirmed
- Category: Edge Function
- Affected files:
  - `supabase/config.toml:9-10`
  - `supabase/functions/lansman-admin/index.ts:54-80`
- Affected tables/functions/buckets/routes:
  - Edge Function `lansman-admin`
- Evidence:
  - config explicitly sets `verify_jwt = false`.
  - the function currently returns HTTP 410, but it still initializes service-role prerequisites and remains deployable.
- Exploitation scenario:
  - a deprecated unauthenticated function remains exposed and may regress later or be repurposed unsafely.
- Impact:
  - residual attack surface
  - future regression risk
- Recommended fix:
  - remove the function from deploy config entirely if it is no longer used
  - if it must remain, set `verify_jwt = true` and document deprecation
- Suggested test or PoC:
  - verify in deployed function list that `lansman-admin` is not publicly exposed
- Status:
  - Confirmed vulnerability

## Low / informational findings

### SEC-010: CSP is missing from both Nginx and Node runtime responses

- Severity: Low
- Confidence: Confirmed
- Category: Deployment
- Affected files:
  - `nginx.conf.template:8-13`
  - `server.mjs:31-38`
- Affected tables/functions/buckets/routes:
  - all HTTP responses served by nginx or `server.mjs`
- Evidence:
  - several security headers are present, but `Content-Security-Policy` is absent.
- Exploitation scenario:
  - if an XSS sink is introduced later, lack of CSP increases exploitability.
- Impact:
  - reduced browser-side containment for future XSS
- Recommended fix:
  - add a restrictive CSP tuned to the current frontend asset and API model
- Suggested test or PoC:
  - inspect response headers for `Content-Security-Policy`
- Status:
  - Code quality issue

### SEC-011: Regex-based HTML sanitization is too weak for real HTML trust boundaries

- Severity: Low
- Confidence: Confirmed
- Category: Input Validation
- Affected files:
  - `src/lib/security.ts:14-18`
  - `src/pages/CommercialDocumentPage.tsx:82-83`
- Affected tables/functions/buckets/routes:
  - future HTML rendering paths
- Evidence:
  - `sanitizeHtml()` strips only `<script>` blocks and quoted `on*=` handlers.
  - the repo also contains a `dangerouslySetInnerHTML` sink, even though current source appears static.
- Exploitation scenario:
  - if untrusted HTML reaches this helper in the future, bypasses are likely.
- Impact:
  - future stored/reflected XSS risk
- Recommended fix:
  - use a real sanitizer such as DOMPurify for any untrusted HTML
- Suggested test or PoC:
  - test payloads using malformed tags, SVG payloads, or unquoted event handlers in a staging copy
- Status:
  - Code quality issue

### SEC-012: `npm audit` reports a moderate PostCSS vulnerability

- Severity: Low
- Confidence: Confirmed
- Category: Other
- Affected files:
  - `package.json`
  - `package-lock.json`
- Affected tables/functions/buckets/routes:
  - build toolchain
- Evidence:
  - `npm audit --omit=dev --json` reports `postcss` `<8.5.10` vulnerable to XSS in CSS stringify output.
- Exploitation scenario:
  - depends on whether attacker-controlled CSS is processed through vulnerable code paths.
- Impact:
  - build/runtime risk depends on app usage
- Recommended fix:
  - upgrade `postcss` to a patched version
- Suggested test or PoC:
  - rerun `npm audit` after updating the lockfile
- Status:
  - Needs manual verification

## Supabase RLS review

| Table | RLS enabled? | anon access | authenticated access | admin-only? | Risk | Recommendation |
|---|---|---|---|---|---|---|
| `admin_users` | Yes | none seen | self-read only | Yes | Low | Keep self-read only; no broad grants seen. |
| `submissions` | Yes | insert allowed | admin read/update only | Yes | Medium | Keep RLS, but add anti-spam controls and reconsider document exposure. |
| `lansman_registrations` | Yes | insert allowed | admin read/update only | Yes | Medium | RLS is acceptable; add abuse/rate-limit controls. |
| `referral_sources` | Yes | none seen | admin read/insert/update | Yes | Low | Add explicit delete policy only if needed. |
| `referral_groups` | Yes | none seen | admin read/insert/update | Yes | Low | Same as above. |
| `referral_types` | Yes | none seen | admin read/insert/update | Yes | Low | Same as above. |
| `referral_codes` | Yes | RPC execute only | admin read/insert/update/delete | Yes | Medium | Review public `validate_and_bind_referral_code` for info disclosure expectations. |
| `referral_code_usages` | Yes | none seen | admin read only | Yes | Low | Acceptable from repo view. |
| `marquee_items` | Yes | public read of active items | admin read/write/delete | Mixed | Low | Acceptable if content is intentionally public. |
| `matches` | Yes | none seen | SELECT to any authenticated user | No | Medium | Restrict to admins or owners; `using (true)` is too broad. |
| `expenses` | Yes | none seen | admin-only table access | Yes | Low | Keep; verify no unexpected grants outside repo. |
| `incomes` | Yes | none seen | admin-only table access | Yes | Low | Keep; verify no unexpected grants outside repo. |
| `social_media_links` | Yes | public SELECT | admin write | No | Low | Fine if data is public-only marketing content. |
| `advisor_social_media_links` | Yes | public SELECT | admin write | Should be Yes | High | Remove public SELECT if table still stores contact data. |
| `consultant_social_media_links` | Yes | public SELECT | admin write | Yes | High | Remove public SELECT; split public/private data. |
| `influencer_social_media_links` | Yes | public SELECT | admin write | Yes | High | Remove public SELECT; split public/private data. |
| `contributor_social_media_links` | Yes | public SELECT | admin write | Yes | High | Remove public SELECT; split public/private data. |
| `command_center_items` | Yes | none seen | all authenticated can read/write | Yes | High | Replace `authenticated`-wide access with admin checks. |
| `resource_entries` | Yes | none seen | all authenticated can read/write | Yes | High | Replace `authenticated`-wide access with admin checks. |
| `mvp_items` | Yes | none seen | all authenticated can read/write | Yes | High | Replace `authenticated`-wide access with admin checks. |
| `wa_users` | Not enabled in repo | unknown | unknown | likely sensitive | Medium | Could not confirm from repo alone; verify dashboard grants and consider migration cleanup. |
| `news_posts` | Not defined in repo migrations | unknown | unknown | likely mixed | Info | Could not confirm from repository alone; verify in Supabase dashboard. |

## Supabase Storage review

| Bucket | Public? | Upload policy | Read policy | Sensitive data? | Risk | Recommendation |
|---|---|---|---|---|---|---|
| `submission-documents` | Yes | `anon, authenticated` insert | `anon, authenticated` select | Yes | High | Make private; use signed URLs or admin-checked downloads. |
| `cv-files` | No | `authenticated` all | `authenticated` all | Yes | High | Restrict to admins only. |
| `arge-files` | No | `authenticated` all | `authenticated` all | Potentially yes | High | Restrict to admins only. |
| `newsimage` | Yes | admin upload/update/delete | public read | Usually no | Low | Acceptable if only public marketing/news images are stored. |

## Edge Function review

| Function | verify_jwt | Uses service role? | External calls? | Main risk | Recommendation |
|---|---|---|---|---|---|
| `send-submission-email` | Not explicitly set in repo | No | Resend | mail abuse / spam / no proof-of-insert | bind to real submission ids and rate-limit |
| `chat-register` | `true` | No | Google Gemini API | public AI abuse and pre-consent PII transfer | minimize data, gate by consent, rate-limit |
| `find-matches` | `true` | Yes | Google Gemini API | service-role data disclosure to public visitors | make admin/owner-only and minimize return data |
| `lansman-admin` | `false` | Yes | No | unnecessary unauthenticated surface | remove from deploy or require JWT |

## AI / RAG data flow review

### Flow: Public AI registration chat

- Input source:
  - visitor messages in `src/components/ChatRegisterBar.tsx`
- Data sent externally:
  - full conversation history
  - collected fields serialized into prompt context
- PII involved?
  - Yes: name, email, phone, city, country, business, offers/needs
- Prompt injection risk:
  - Medium
  - user messages are appended directly to LLM messages
- Output validation:
  - weak
  - structured tool schema exists, but final arguments are only `JSON.parse`d in `chat-register`
- Database impact:
  - indirect
  - extracted fields influence later submission inserts
- Recommendation:
  - require explicit AI/privacy consent before sending PII
  - exclude email/phone/full name from prompt context unless strictly necessary
  - validate parsed LLM output with Zod or equivalent before trusting it

### Flow: Public match preview / persistence

- Input source:
  - visitor-provided `offers_needs`, `field`, `city`, `country`, `category`
- Data sent externally:
  - candidate profile snippets derived from existing `submissions`
  - visitor need text
- PII involved?
  - Yes: candidate full names and locations
- Prompt injection risk:
  - Medium
  - both visitor text and candidate content go into the model
- Output validation:
  - weak
  - tool-call JSON is parsed and trusted
- Database impact:
  - yes
  - when `persist = true`, match records are upserted
- Recommendation:
  - do not expose identifiable matches in public preview mode
  - use server-side filtering with non-identifiable result summaries
  - validate returned IDs and constrain them to authorized records

### Flow: Public RAG proxy

- Input source:
  - `RagChat` question text
- Data sent externally:
  - request body is proxied to `https://rag.corteqs.net/api/chat`
- PII involved?
  - potentially, depending on user message content
- Prompt injection risk:
  - Medium, depends on upstream RAG implementation
- Output validation:
  - none beyond JSON parsing in client
- Database impact:
  - none visible in this repo
- Recommendation:
  - add rate limits, body limits, and logging
  - validate request content type and set upstream timeouts

## Secret exposure review

### What looks good

- I did not find direct exposure of `SUPABASE_SERVICE_ROLE_KEY` in frontend code.
- runtime `/env-config.js` generation includes only:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_PUBLISHABLE_KEY`
  - `VITE_SUPABASE_PROJECT_ID`
  - see `docker-entrypoint-env.sh:10-15` and `server.mjs:56-69`
- `.dockerignore` excludes `.env` and `.env.*`
- `.gitignore` excludes `.env`

### Risks / notes

- `RAG_API_SECRET` is injected into nginx config at runtime through string substitution in `docker-entrypoint-env.sh:4-8`; that is acceptable, but verify that rendered nginx configs are not logged or shipped to support systems.
- `server.mjs` returns a clear `RAG_API_SECRET missing` error when unset; not a leak, but avoid revealing secret names publicly if desired.
- `1111.txt` contains historical build-security warnings; no live secret values were observed there, but it is still an operational artifact worth excluding if not needed.

### Conclusion

- No confirmed direct service-role leak from repository alone.
- Manual verification still needed in:
  - CI/CD variables
  - container runtime env inspection
  - reverse-proxy logs
  - Supabase dashboard function secrets

## Recommended remediation plan

### Immediate fixes

- Lock down `command_center_items`, `resource_entries`, `mvp_items`, `cv-files`, and `arge-files` to admins only.
- Remove public SELECT from advisor CRM tables or split them into public/private datasets.
- Make `submission-documents` private and replace public URLs with signed/admin-checked access.
- Disable public identifiable match previews from `find-matches`.

### Short-term fixes

- Gate third-party AI processing behind explicit consent and data minimization.
- Add rate limiting / bot protection to:
  - public form submission
  - `chat-register`
  - `find-matches`
  - `/api/chat`
  - `send-submission-email`
- Bind `send-submission-email` to actual persisted submission ids or a server-trusted trigger.
- Remove or fully disable `lansman-admin`.
- Neutralize CSV formula injection in admin exports.

### Hardening improvements

- Add CSP headers to nginx and `server.mjs`.
- Validate AI tool outputs with Zod before use.
- Review `matches` table RLS and make it owner/admin scoped.
- Upgrade vulnerable dependencies such as `postcss`.
- Replace regex-based HTML sanitization with a maintained sanitizer if any untrusted HTML will ever be rendered.

## Test plan

### Supabase RLS tests

- Test anon access to:
  - `consultant_social_media_links`
  - `influencer_social_media_links`
  - `contributor_social_media_links`
  - `submission-documents`
- Test authenticated non-admin access to:
  - `command_center_items`
  - `resource_entries`
  - `mvp_items`
  - `cv-files`
  - `arge-files`
- Test admin access to the same resources to confirm intended behavior still works after fixes.

### Storage upload/read tests

- upload to `submission-documents` as anon and confirm whether object is public
- create a signed URL for `cv-files` as non-admin authenticated user
- verify overwrite behavior and cross-user object access attempts

### Edge Function auth tests

- invoke `find-matches` from a fresh public browser session
- invoke `chat-register` from a fresh public browser session
- attempt repeated `send-submission-email` calls with synthetic payloads in staging
- verify `lansman-admin` is not exposed in production if unused

### Proxy abuse tests

- send large bodies to `/api/chat`
- send rapid repeated POSTs and look for missing `429`
- verify GET returns `405`
- compare nginx deployment behavior versus `server.mjs` deployment behavior

### Form spam tests

- attempt repeated public submissions from the same IP/session
- verify whether any CAPTCHA, throttling, or duplicate-detection exists
- test anonymous file upload volume into `submission-documents`

### Prompt injection and privacy tests

- test whether `chat-register` forwards email/phone before consent
- test whether `find-matches` can be manipulated to reveal more existing-profile context
- test whether model outputs can include malformed ids or unexpected structures

### XSS and export tests

- CSV formula payload in `fullname` and `referral_code`
- malformed URLs in `resource_entries`
- future-proof test for any path using `dangerouslySetInnerHTML`
