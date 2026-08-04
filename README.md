# CorteQS Landing

React + Vite landing page backed by Supabase for form collection, admin review, and email notifications.

## What is included

- Public landing page forms writing to `public.submissions`
- Admin panel at `/admin`
- Standalone lansman registration page at `/lansman`
- Lansman admin screen at `/admin/lansman` under the shared admin shell
- Supabase Auth based admin access via `user_role_assignments` + the `is_admin()` RPC (the legacy `public.admin_users` table was dropped 2026-06-09)
- 7 Supabase Edge Functions for email notifications, matching, radar news scanning, and survey intake
- Additional workflow notes are indexed under `docs/README.md`.

## Local setup

Requires **Node.js >= 22** (enforced by `engines.node` in `package.json`; the Docker build stage
uses `node:22-alpine`).

1. Install dependencies with `npm install`.
2. Provide the Supabase client env vars in `.env.local`.
3. Apply Supabase migrations.
4. Create at least one admin auth user and assign it an admin role in `user_role_assignments` (verified via the `is_admin()` RPC; `public.admin_users` no longer exists).
5. Deploy the Edge Functions and set their secrets.

## Required app env

```env
VITE_SUPABASE_PROJECT_ID=injprdrsklkxgnaiixzh
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_SUPABASE_URL=https://injprdrsklkxgnaiixzh.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your_anon_key
```

`VITE_SUPABASE_ANON_KEY` is the preferred client env for new frontend modules. `VITE_SUPABASE_PUBLISHABLE_KEY` remains supported as a compatibility fallback.

## Server-only secret

```env
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

`SUPABASE_SERVICE_ROLE_KEY` is server-only. Do not expose it to frontend code or rename it with a `VITE_` prefix.

## Prerender (SEO/GEO) — optional

```env
PRERENDER_URL=https://prerender.corteqs.net          # self-hosted Rendertron/Prerender service
PRERENDER_CANONICAL_HOST=corteqs.net                  # host used to build the target URL
PRERENDER_TOKEN=                                       # server.mjs only; sent as X-Prerender-Token
```

When `PRERENDER_URL` is set, search-engine and AI-answer-bot user-agents (Googlebot,
Bingbot, GPTBot, PerplexityBot, ClaudeBot, etc.) are detected on route requests and
proxied to the prerender service, returning fully-rendered HTML so crawlers see per-page
`<title>`/`<meta>`/JSON-LD instead of an empty SPA shell. Human visitors always get the
normal SPA. If `PRERENDER_URL` is unset, the layer is a no-op. Any prerender error or
timeout falls back gracefully to the SPA shell (never 5xx).

Both runtimes implement this layer:

- **Production (nginx):** `docker-entrypoint-env.sh` substitutes `__PRERENDER_URL__` and
  `__PRERENDER_CANONICAL_HOST__` into `nginx.conf.template`. When `PRERENDER_URL` is empty
  the placeholder resolves to `0` and the map disables prerendering. `/admin` and `/api`
  are excluded from prerendering.
- **`npm run start` / Nixpacks (`server.mjs`):** same behaviour, plus optional
  `PRERENDER_TOKEN`. **`PRERENDER_TOKEN` is not read by the nginx path** — it only affects
  `server.mjs`.

## Required function secrets

```bash
supabase secrets set ZOHO_SMTP_HOST=... ZOHO_SMTP_PORT=... ZOHO_SMTP_USER=... ZOHO_SMTP_PASSWORD=...
supabase secrets set MAIL_FROM=...   # Zoho hesabıyla (veya alias'ıyla) aynı olmalı
supabase secrets set MAIL_TO_ADMIN=...
supabase secrets set MAIL_REPLY_TO=...
supabase secrets set MAIL_SEND_CONFIRMATION=true
```

Additional secrets, per function:

```bash
supabase secrets set NOTIFY_DISPATCH_SECRET=...   # send-notification-emails (dispatch auth)
supabase secrets set PUBLIC_SITE_URL=...          # send-notification-emails (links in mails)
supabase secrets set GEMINI_API_KEY=...           # find-matches
supabase secrets set RADAR_NEWS_CRON_SECRET=...   # radar-news-scan (cron auth)
supabase secrets set RADAR_NEWS_MIN_SCORE=...     # radar-news-scan (optional threshold)
supabase secrets set SURVEY_IP_HASH_SALT=...      # submit-survey-response
```

`SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` are injected by the
Supabase runtime — do not set them manually.

## Deploying Edge Functions

There are **7** Edge Functions in `supabase/functions/`:

```bash
supabase functions deploy send-submission-email
supabase functions deploy send-notification-emails
supabase functions deploy submit-survey-response
supabase functions deploy find-matches
supabase functions deploy radar-news-scan
supabase functions deploy relocation-notifications

# lansman-admin is DEPRECATED (its handler returns HTTP 410). Admin lansman access now
# uses direct RLS-backed table access — do not deploy or call this function.
```

## Docker / Coolify deployment

**The production runtime is nginx, not Node.** `Dockerfile` is a two-stage build:

1. `FROM node:22-alpine AS build` → `npm ci` + `npm run build` → `dist/`
2. `FROM nginx:1.27-alpine` → serves `dist/` from `/usr/share/nginx/html`

The runtime stage wires up three files:

| File | Role |
|------|------|
| `nginx.conf.template` | Copied to `/etc/nginx/templates/default.conf.template`. Single source of truth for routing, `301` legacy redirects, security headers + CSP, `/api/chat` proxying and rate limiting, and prerender routing. |
| `docker-entrypoint-env.sh` | Copied to `/docker-entrypoint.d/40-env-config.sh`. Substitutes `__RAG_API_SECRET__`, `__PRERENDER_URL__`, `__PRERENDER_CANONICAL_HOST__` into the rendered config and writes `/usr/share/nginx/html/env-config.js` at container start. |
| `dist/` | The built Vite app, copied from the build stage. |

Note that the nginx image also runs `envsubst` over the template
(`20-envsubst-on-templates.sh`) before the entrypoint script executes — avoid introducing
nginx variables whose names could collide with environment variables.

`server.mjs` is **not** the production runtime. It is only used on the
`npm run start` / Nixpacks path, and provides:

- serving `dist/` with SPA fallback
- runtime `/env-config.js` generation
- `/api/chat` proxying for `RAG_API_SECRET`
- `nixpacks.toml` so Coolify builds with `npm run build` and starts with `npm run start`
- strict asset handling so missing chunks return `404` instead of `index.html`

Keep the two runtimes in sync when changing redirects: the legacy redirect list is
defined once in `src/lib/redirects.ts` and mirrored into `nginx.conf.template`;
`src/lib/redirects.test.ts` fails if they drift.

Use `npm run verify:release` to validate built assets locally and against a live base URL.

Required runtime environment variables in Coolify (read by `docker-entrypoint-env.sh` /
nginx):

```env
VITE_SUPABASE_URL=https://injprdrsklkxgnaiixzh.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your_anon_key
VITE_SUPABASE_PROJECT_ID=injprdrsklkxgnaiixzh
RAG_API_SECRET=your_rag_api_secret
PRERENDER_URL=https://prerender.corteqs.net   # optional; empty disables prerendering
PRERENDER_CANONICAL_HOST=corteqs.net          # optional; defaults to corteqs.net
```

The container writes `/env-config.js` on startup so frontend runtime config works without
committing `.env`. Only `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, and
`VITE_SUPABASE_PROJECT_ID` are emitted into `/env-config.js` — set
`VITE_SUPABASE_ANON_KEY` at build time if a module depends on it. `RAG_API_SECRET` is used
only in the server-side nginx proxy for `/api/chat` and must not be exposed with a `VITE_`
prefix.

Deploy `dist/` atomically: publish the new `index.html` together with the hashed `/assets/*` files from the same build. Do not switch the app shell before its referenced assets are available.

After a deployment, verify the published release with:

```bash
BASE_URL=https://corteqs.net npm run verify:release
```

Also confirm the nginx security headers survived the deploy. nginx `add_header` is **not**
inherited: any `location` that declares its own `add_header` drops every header from the
parent block, so the headers are repeated per location in `nginx.conf.template`. Check the
app shell itself, not just a static file:

```bash
curl -sI https://corteqs.net/ | grep -Ei 'content-security-policy|x-frame-options'
```

Then open the site and confirm the browser console reports no CSP violations.

## Documentation

Since the 2026-08-04 cleanup the repo root holds **only two** documents — everything else moved
under `docs/`:

| File | Purpose |
|------|---------|
| `README.md` | This file — setup, env, deployment |
| `CLAUDE.md` | Agent/contributor rules and constraints (Claude Code reads it from the root) |

| Moved document | New location |
|----------------|--------------|
| Architecture (single maintained doc) | `docs/ARCHITECTURE.md` |
| Fast project context for a new session | `docs/AGENT_CONTEXT.md` |
| Status board + use-case scenarios (open in a browser) | `docs/status/rapor.html` |
| Current phase / handover status | `docs/history/SONDURUM.md` |

See `docs/README.md` for the full index. Frozen archives live in `docs/archive/`,
`docs/reference/`, `docs/docu/`. **Do not add new documents to the repo root.**

## Notes

- Form submission must succeed even if email delivery fails.
- Non-admin authenticated users cannot read submissions.
- The admin panel supports filtering, CSV export, status updates, and internal notes.
- `/admin/lansman` now uses the same Supabase admin session as the rest of `/admin`.
- The admin shell exposes `Command Center` as the dedicated external dashboard entry alongside the remaining dashboard tools.
