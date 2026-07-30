# CorteQS Landing

React + Vite landing page backed by Supabase for form collection, admin review, and email notifications.

## What is included

- Public landing page forms writing to `public.submissions`
- Admin panel at `/admin`
- Standalone lansman registration page at `/lansman`
- Lansman admin screen at `/admin/lansman` under the shared admin shell
- Supabase Auth based admin access via `user_role_assignments` + the `is_admin()` RPC (the legacy `public.admin_users` table was dropped 2026-06-09)
- Supabase Edge Function for email notifications
- Additional workflow notes are indexed under `docs/README.md`.

## Local setup

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
PRERENDER_TOKEN=                                       # optional; sent as X-Prerender-Token
PRERENDER_CANONICAL_HOST=corteqs.net                  # host used to build the target URL
```

When `PRERENDER_URL` is set, `server.mjs` detects search-engine and AI-answer-bot
user-agents (Googlebot, Bingbot, GPTBot, PerplexityBot, ClaudeBot, etc.) on route
requests and proxies them to the prerender service, returning fully-rendered HTML so
crawlers see per-page `<title>`/`<meta>`/JSON-LD instead of an empty SPA shell. Human
visitors always get the normal SPA. If `PRERENDER_URL` is unset, the layer is a no-op.
Any prerender error or timeout falls back gracefully to the SPA shell (never 5xx).

## Required function secrets

```bash
supabase secrets set ZOHO_SMTP_HOST=... ZOHO_SMTP_PORT=... ZOHO_SMTP_USER=... ZOHO_SMTP_PASSWORD=...
supabase secrets set MAIL_FROM=...   # Zoho hesabıyla (veya alias'ıyla) aynı olmalı
supabase secrets set MAIL_TO_ADMIN=...
supabase secrets set MAIL_REPLY_TO=...
supabase secrets set MAIL_SEND_CONFIRMATION=true
```

## Deploying Edge Functions

```bash
supabase functions deploy send-submission-email
# Note: lansman-admin is DEPRECATED (returns HTTP 410). Admin lansman access now
# uses direct RLS-backed table access — do not deploy or call this function.
```

## Docker / Coolify deployment

This repo now includes a production `Dockerfile` for Coolify.

If Coolify is using Nixpacks instead of the `Dockerfile`, the repo now also provides:

- `server.mjs` to serve `dist/` with SPA fallback
- runtime `/env-config.js` generation
- `/api/chat` proxying for `RAG_API_SECRET`
- `nixpacks.toml` so Coolify builds with `npm run build` and starts with `npm run start`
- strict asset handling so missing chunks return `404` instead of `index.html`
- `npm run verify:release` to validate built assets locally and against a live base URL

Required runtime environment variables in Coolify:

```env
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_SUPABASE_URL=https://injprdrsklkxgnaiixzh.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your_anon_key
VITE_SUPABASE_PROJECT_ID=injprdrsklkxgnaiixzh
RAG_API_SECRET=your_rag_api_secret
```

The container serves the built Vite app with nginx and writes `/env-config.js` on startup so frontend runtime config works without committing `.env`. `RAG_API_SECRET` is used only on the server-side nginx proxy for `/api/chat` and must not be exposed with a `VITE_` prefix.

Deploy `dist/` atomically: publish the new `index.html` together with the hashed `/assets/*` files from the same build. Do not switch the app shell before its referenced assets are available.

After a deployment, verify the published release with:

```bash
BASE_URL=https://corteqs.net npm run verify:release
```

## Documentation

Root holds exactly 4 maintained documents (2026-06-11 layout):

| File | Purpose |
|------|---------|
| `CLAUDE.md` | Agent/contributor rules and constraints |
| `AGENT_CONTEXT.md` | Fast project context for a new session |
| `ARCHITECTURE.md` | The single maintained architecture document |
| `rapor.html` | Status board + use-case scenarios (open in a browser) |

Everything else is under `docs/` — see `docs/README.md` for the index. Frozen archives live in
`docs/archive/`, `docs/reference/`, `docs/docu/`.

## Notes

- Form submission must succeed even if email delivery fails.
- Non-admin authenticated users cannot read submissions.
- The admin panel supports filtering, CSV export, status updates, and internal notes.
- `/admin/lansman` now uses the same Supabase admin session as the rest of `/admin`.
- The admin shell exposes `Command Center` as the dedicated external dashboard entry alongside the remaining dashboard tools.
