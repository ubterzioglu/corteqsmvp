# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**CorteQS Landing** is a multi-feature React + Vite application with Supabase backend. It combines a public marketing site, admin dashboard, member profiles, surveys, workspace collaboration tools, and an accounting module (muhasebe) — all in a single SPA.

**Key Metrics (2026-06-10):**
- 150 page `.tsx` files (65 admin), 269 components, 81 lib modules
- **221 Supabase migrations** with RLS policies; 5 Edge Functions
- TypeScript with relaxed strict mode (intentional trade-off)
- Deployed via Docker (Coolify) with runtime environment injection

> **Recent major changes:**
> 1. Catalog / flat-role / **AFS** rebuild (live 2026-06-09) — renamed 9 tables, dropped the old
>    item-type/role-family system. See `docs/catalog-role-afs-rebuild/` and the DB section below.
> 2. **Cadde 3.0 E2E rebuild (live 2026-06-11, Faz 0–9 + kuyruk TAMAM)** — social feed with CKS
>    band/score ranking, Cafe rooms, Çarşı marketplace, Tanıtım campaigns, notifications + moderation,
>    multi-diaspora. ~30 security-definer RPCs, migrations `cadde300_001–014`. **Read the Cadde rules
>    section below before touching cadde code.** Closing report: `docs/cadde-300/change-report.md`.
>
> **Doküman düzeni (2026-06-11):** kökte yalnız 4 doküman — `CLAUDE.md`, `AGENT_CONTEXT.md`
> (hızlı bağlam), **`ARCHITECTURE.md` (tek ana mimari)**, `rapor.html` (durum panosu).
> Diğer her şey `docs/` altında (`docs/README.md` indeksi). Eski mimari dokümanlar
> `docs/archive/architecture/` içinde dondurulmuştur — güncellemeyi ARCHITECTURE.md'ye yap.

## Quick Commands

### Development
```bash
npm install                  # Install dependencies
npm run dev                  # Vite dev server (port 8080)
npm run build                # Production bundle
npm run build:dev            # Dev build with component tagger
npm run lint                 # ESLint check
npm run test                 # Vitest run once
npm run test:watch           # Vitest watch mode
npm run start                # Serve dist/ locally (node server.mjs)
```

### Database & Functions
```bash
supabase functions deploy send-submission-email
supabase functions deploy lansman-admin
supabase migrations list
npm run verify:release       # Validate built assets
BASE_URL=https://corteqs.net npm run verify:release
```

### Debugging
```bash
npm run lint -- --fix        # Auto-fix ESLint issues
npm run test -- src/lib/muhasebe-api.test.ts  # Run single test file
```

## Architecture & Code Organization

### Routing (App.tsx — Already Modularized)
- All routes defined in `src/App.tsx` — but the file is now **~300 lines** and **code-split via ~75 `lazy()` imports** (not the monolith it once was)
- **Reference:** Muhasebe routes are modularized via `src/pages/admin/muhasebe/routes.tsx` — use this as the pattern for further extraction
- Public pages wrapped in `<PublicLayout />` (header, footer, scroll button)
- Admin pages wrapped in `<AdminLayout />` + `<RequireAuth />`
- Remaining (optional) refactor: move non-muhasebe modules to the `routes.tsx` pattern — see `docs/refactor/2026-06-09-refactor-backlog.md`

### Data Layer (Mixed Patterns — Inconsistent)
**Single Supabase client source (consolidation complete):**
- `src/integrations/supabase/client.ts` (Lovable-generated, has type definitions) — the only client.
- `src/lib/supabase.ts` **no longer exists** (0 imports). The old "two clients" note is obsolete.

**Three data-fetching styles (choose one per feature):**
1. **Direct component fetch** (anti-pattern): `supabase.from('table').select()` in component
2. **API module layer** (preferred): `src/lib/*-api.ts` (muhasebe-api.ts is good example)
3. **React Query** (recommended but underused): `useQuery`/`useMutation` hooks with query keys

**Guideline:** New features should use `src/lib/*-api.ts` + React Query hooks. Prefer `muhasebe-*.ts` pattern over surveys/lansman pattern.

### Authentication & Roles

**Canonical auth + a backward-compat shim**

| | `src/components/auth/` | `src/contexts/AuthContext.tsx` |
|---|---|---|
| Mounted in App.tsx | **YES** (canonical) | N/A — re-exports the canonical `AuthProvider` |
| Role | Source of truth (`session`, `user`, `isLoading`) | **Backward-compat shim**: `useAuth` delegates to canonical; provides a correct `loading` alias |

`src/contexts/AuthContext.tsx` is **not** an orphan. It is a backward-compatibility shim: its `useAuth` delegates to the canonical `@/components/auth/useAuth`, and it re-exports the canonical `AuthProvider`. The `loading` field is a correct alias for `isLoading`. **~39 files still import from this shim** and see real session state.

**Migration (deferred, low-risk):** point those 39 imports at `@/components/auth/useAuth` (rename `loading`→`isLoading` where used), then delete the shim once imports hit 0. See `docs/refactor/2026-06-09-refactor-backlog.md` (B5).

The canonical `useAuth` lives in `src/components/auth/useAuth.ts` → reads from `src/components/auth/auth-context.ts`. For new code, always import from here.

**Role / permission system (single system — legacy dropped 2026-06-09):**
- **Admin check:** `userIsAdmin()` in `src/lib/admin.ts` calls the `is_admin()` RPC. The `public.admin_users` table was **DROPPED** (migration `20260609003000`). `AdminLayout` gates the admin section via this check.
- **Canonical tables:** `user_role_assignments` + `user_profile_attributes` (+ `is_admin()`/`is_moderator()` RPCs). The old `profiles` / `user_profiles` / `admin_users` / `role_feature_defaults` tables no longer exist.
- **Feature flags:** `RequireFeature` / `useFeatureFlags` resolve via `get_current_user_features()` (`role_feature_flags` + `user_feature_overrides`).
- `RequireAuth` guards admin routes (checks canonical session).
- **Do not reference `profiles` / `user_profiles` / `admin_users`** — use `user_role_assignments` + `user_profile_attributes` and the `is_admin()`/`is_moderator()` RPCs.

### Feature Modules (Copy Muhasebe Pattern)
Muhasebe module is the architectural template:
```
muhasebe/
├── lib/
│   ├── muhasebe-api.ts       (Supabase queries + mutations)
│   ├── muhasebe-schemas.ts   (Zod types + z.infer)
│   ├── muhasebe-format.ts    (Display formatting)
│   └── muhasebe-aggregations.ts  (Business logic)
├── pages/
│   └── admin/muhasebe/
│       ├── MuhasebeDashboard.tsx
│       ├── GelirlerPage.tsx
│       ├── GiderlerPage.tsx
│       └── routes.tsx         (Module-level routing)
└── components/
    └── admin/muhasebe/
        ├── KpiCard.tsx
        ├── StatusBadge.tsx
        └── DialogForms.tsx
```

**Follow this structure for surveys, may19, lansman, referral modules.** (Cadde already follows it — `src/lib/cadde-*.ts` is the most complete example.)

### Cadde 3.0 Rules (live 2026-06-11 — full detail: `ARCHITECTURE.md` §4)
- **RPC-only mutations:** cadde content tables have NO user INSERT policies. All writes go through
  security-definer RPCs (`create_cadde_post_v1`, cafe/carsi/promotion/report RPC families).
- **SQL↔TS mirror contracts** (tested; changing one side requires updating the other):
  `can_post_kopru` ↔ `src/lib/cadde-rules.ts` · `list_cadde_feed_v1` ↔ `cadde-ranking.ts` ·
  `can_join_cadde_cafe` ↔ `canJoinCafeRule` · auto-scan regex ↔ `CAFE_NAME_BLOCKLIST`.
- **`cadde_settings`** holds ALL product limits/flags (phone requirement D-03, cafe/carsi limits,
  rate limits) — product decisions are SQL updates, not code changes.
- **Ban kill-switch** lives inside `has_cadde_feature` — new write RPCs are covered automatically.
- New `cadde_*` RPC error codes MUST be added to the Turkish message map in `cadde-rules.ts`.
- New cadde content tables MUST carry `diaspora_key` + CHECK + feed/list filter.
- Legacy tables (`feed_posts/feed_likes/cafes/cafe_memberships/user_follows`) are write-revoked and
  COMMENT'ed; **do not re-open policies/grants** — DROP happens after canary via separate decision.

### UI Components & Styling
- **shadcn/ui primitives:** `src/components/ui/*` (auto-generated, don't edit manually)
- **Tailwind CSS + CSS variables** for theming
- **Dark mode:** `next-themes` provider in App.tsx
- **Icons:** Lucide React (`lucide-react`)
- **Forms:** react-hook-form + zod validation
- **Alerts/Toasts:** Sonner + native toast provider

### TypeScript Configuration (Intentionally Relaxed)
```json
{
  "strict": false,
  "strictNullChecks": false,
  "noImplicitAny": false,
  "noUnusedLocals": false,
  "noUnusedParameters": false
}
```
This is intentional to avoid massive refactor burden. When adding new code, write as if `strict: true` — use explicit types on public APIs and exports.

### Path Aliases
- `@/*` → `src/*` (configured in tsconfig, vite.config, vitest.config)
- Use `@/pages`, `@/components`, `@/lib` consistently
- Import styles should match `src/App.tsx` style (mixed but acceptable)

## Critical Files & Architectural Decisions

| File | Why It Matters |
|------|---|
| `src/App.tsx` | Master route table (~300 lines, ~75 `lazy()` code-split) |
| `src/main.tsx` | Hydrate/Render switch (future SSR entry) |
| `src/components/auth/AuthProvider.tsx` | Supabase session + context root |
| `src/lib/muhasebe-*.ts` | Reference architecture (apis, schemas, aggregations) |
| `src/lib/admin.ts` + `src/lib/admin/*.ts` | `admin.ts` is a 57-line barrel; real impl in `admin/` (7 domain APIs) — pattern for new admin APIs |
| `src/integrations/supabase/client.ts` | Lovable-generated, risky to modify |
| `vite.config.ts` | Standalone HTML injection for commercial/* routes |
| `server.mjs` | Production runtime; env injection via `/env-config.js` |
| `supabase/migrations/20260512103000_security_hardening_phase1.sql` | Security baseline |
| `tsconfig.json` | Relaxed strict mode — refactor pivot point |
| `eslint.config.js` | Minimal rules; `no-unused-vars: off` |

## Domain Terminology (Turkish — Do Not Rename)

Keep these terms in Turkish throughout codebase:
- **muhasebe** = accounting
- **gelirler** = income
- **giderler** = expenses
- **nakit akışı** = cash flow
- **lansman** = launch/startup registration
- **cadde** = street/marketplace
- **kaynak** = resource
- **kişi** = person
- **oda** = room/chamber
- **referans** = referral
- **ambasador** = ambassador
- **yönetici** = admin

Renaming these breaks domain cohesion and user understanding.

## Important Constraints & Immovable Parts

1. **SEO-locked URLs** (recent commits all "seo" related):
   - `/lansman`, `/cadre`, `/founders`, `/commercial/<slug>`, `/cadde` (+ sub-routes `/cadde/cafe/:cafeId`, `/cadde/carsi[/:itemId]`), `/19051919`, `/anket`
   - Never change route paths without checking git history

2. **Supabase Migrations** cannot be deleted or reordered in production. Only add new migrations.

3. **`server.mjs` Runtime** (Coolify deployment):
   - Generates `/env-config.js` from env vars at startup
   - Proxies `/api/chat` to `rag.corteqs.net`
   - Serves SPA with fallback — keep this behavior

4. **Vite Plugin** (`vite.config.ts`):
   - Injects `info-*.html` standalone documents into `dist/commercial/<slug>/`
   - Complex but required — preserve this logic

5. **Hardcoded Supabase Project ID:**
   - `injprdrsklkxgnaiixzh` in env examples and code
   - Can be overridden via `VITE_SUPABASE_URL`

6. **RLS Policies** have reset history (submission insert changed multiple times)
   - Be cautious adding/modifying RLS — validate in test environment

7. **lovable-tagger & components.json** — preserve Lovable integration unless explicitly deprecated

## Testing

### Test Commands
```bash
npm run test                 # Vitest one-shot
npm run test:watch           # Watch mode
npm run test -- --ui         # UI dashboard (Vitest)
npm run test -- --coverage   # Coverage report (experimental)
```

### Test Organization
- **Unit/integration:** `src/**/*.test.ts(x)` (vitest + Testing Library + jsdom)
- **E2E:** Playwright configured but underutilized
- **Setup:** `src/test/setup.ts` (jest-dom matchers)
- **Coverage target:** 80%+ for new code

### Good Test Examples
- `src/lib/muhasebe-*.test.ts` — integration tests with aggregations
- `src/lib/lansman.test.ts` — domain logic testing
- `src/components/AdminLansmanTable.test.tsx` — component testing

## Database & Migrations

- **221 migrations** in `supabase/migrations/` (date-prefixed, immutable in prod)
- **RLS active** — submissions require specific conditions
- **Edge Functions (5):** `chat-register`, `find-matches`, `lansman-admin`, `send-submission-email`, `submit-survey-response`

### Canonical schema (after the AFS rebuild — 2026-06-09)

The catalog / flat-role / **AFS** rebuild renamed 9 tables and dropped the old item-type / role-family
system. **Do not reference the old names** — runtime code has 0 references to them.

| Domain | Canonical tables |
|--------|------------------|
| **Auth/roles** | `auth.users`, `user_role_assignments`, `user_profile_attributes`, `user_feature_overrides` |
| **Catalog** | `catalog_items`, `catalog_item_roles`, `catalog_item_attribute_values`, `catalog_item_claims`, `catalog_item_managers` (+ ~15 satellite tables) |
| **AFS rules** | `roles` (76 flat, no families; 75 aktif — `User_Standard` 2026-06-11'de `User_DiasporaMember`'a konsolide edilip pasifleştirildi), `afs_attributes` (53), `afs_features` (42), `afs_sections` (7), `role_attributes`, `role_features`, `role_sections` |
| **Other** | `submissions`, `surveys`/`survey_*`, `muhasebe_gelirler`/`muhasebe_giderler`, `lansman_basvurular`, `referral_*`, `workspace_*` |

**Renamed (old → new):** `attribute_catalog`→`afs_attributes`, `feature_catalog`→`afs_features`,
`profile_section_catalog`→`afs_sections`, `role_attribute_rules`→`role_attributes`,
`role_feature_flags`→`role_features`, `role_profile_section_rules`→`role_sections`,
`catalog_item_attributes`→`catalog_item_attribute_values`, `catalog_claim_requests`→`catalog_item_claims`,
`catalog_item_memberships`→`catalog_item_managers`.

**Dropped:** `profiles`, `user_profiles`, `user_profiles_v2`, `admin_users`, `role_feature_defaults`,
`catalog_item_types`, all `*_details` tables, role-family / taxonomy concepts.
(`rolesgo_*` was always a conceptual label for the role system, not a table prefix.)

Before touching migrations:
1. Read recent migration files to understand dependencies
2. Test schema changes locally with `supabase db push`
3. Never delete or reorder existing migrations — only add new ones

## Deployment & Environment

### Build & Runtime Environment Variables
```env
# Build-time (VITE_ prefix)
VITE_SUPABASE_URL=https://injprdrsklkxgnaiixzh.supabase.co
VITE_SUPABASE_ANON_KEY=...
VITE_SUPABASE_PROJECT_ID=injprdrsklkxgnaiixzh

# Runtime only (server.mjs)
SUPABASE_SERVICE_ROLE_KEY=...  (never expose to frontend)
RAG_API_SECRET=...             (server-side proxy secret)
```

### Coolify Deployment
- Uses `Dockerfile` or `nixpacks.toml`
- Expects `npm run build` → `dist/`
- Runtime serves with `npm run start` (node server.mjs)
- Env injection via `/env-config.js` (loaded in `index.html` as `<script>`)

**Verify release after deploy:**
```bash
BASE_URL=https://corteqs.net npm run verify:release
```

## Common Development Patterns

### Adding a New Admin CRUD Page
1. Create `src/pages/admin/<feature>/List.tsx`
2. Add API layer: `src/lib/<feature>-api.ts`
3. Add schemas: `src/lib/<feature>-schemas.ts` (Zod)
4. Use React Query: `useQuery` + `useMutation` for CRUD
5. Add route in `src/App.tsx` (or feature `routes.tsx` if modularizing)

### Adding a Public Form
1. Create page in `src/pages/<FormPage>.tsx`
2. Define Zod schema in same file or `src/lib/<form>-schemas.ts`
3. Use `react-hook-form` + `@hookform/resolvers`
4. Submit to Supabase via `supabase.from('submissions').insert()`
5. Show toast on success/error (use `use-toast` hook)
6. Add to routing in `src/App.tsx`

### Error Handling Pattern
```typescript
try {
  const data = await supabase.from('table').select()
  // Process data
} catch (error: unknown) {
  const message = error instanceof Error ? error.message : 'Unexpected error'
  toast.error(message)
  console.error(error)
}
```

## Linting & Code Quality

- **ESLint:** `npm run lint`
- **No auto-fix on save** (hooks configured elsewhere if needed)
- **Disabled rules:** `no-unused-vars`, loose style
- **Recommended:** Enable `strict` checks in `tsconfig` after routing refactor

## Documentation & Runbooks

Root holds exactly 4 documents: `CLAUDE.md`, `AGENT_CONTEXT.md`, `ARCHITECTURE.md`, `rapor.html`.
Everything else lives in `docs/` (index: `docs/README.md`):
- `docs/cadde-300/` — Cadde 3.0 spec, devir notu, faz dokümanları, change-report
- `docs/archive/` — frozen content: old architecture docs, root cleanup archive, DB backups, import tools
- `docs/modules/` — feature-specific documentation (Turkish domain names)
- `docs/guides/` — user/admin guides
- `docs/operations/` — deployment, database, security runbooks
- `docs/history/` — archived plans and cleanup reports

**Before major changes, check docs for context and constraints.**

## Known Limitations & Refactor Opportunities

> Consolidated, prioritized roadmap: `docs/refactor/2026-06-09-refactor-backlog.md` (items B1–B10).

1. **Generated `supabase/types.ts` out of sync** → ~164 tsc errors; regenerate via `supabase gen types` (B1, highest priority)
2. **Broken imports** → `@/lib/mapEntities`, `@/lib/radarNews`, `html-to-image` missing; runtime crash risk (B2)
3. **`AdminLayout.tsx` still large (741 lines)** → split into layout sub-components + `useAdminAccess` hook (B4)
4. **Auth shim migration** → ~39 imports of `@/contexts/AuthContext`; migrate to canonical, then delete shim (B5)
5. **Mixed data fetching** → in-component `supabase.from()` still common; standardize on `*-api.ts` + React Query (B6)
6. **TypeScript loose** → tighten incrementally after B1; ~103 `as any` to clean up (B7)
7. **Test coverage spotty** → `AdminMembersPage.test.tsx` broken (B3); activate Playwright for critical flows

**Already done:** App.tsx modularized (~75 `lazy()`), single Supabase client, legacy auth tables dropped (single system), `admin.ts` split into `admin/` domain modules.

## Additional Resources

- README.md — deployment, env setup, Edge Function secrets
- ARCHITECTURE.md (root) — the single maintained architecture document (Turkish)
- docs/archive/architecture/ — frozen historical architecture docs
- docs/cleanup/2026-05-30/ — recent cleanup audit results
- vite.config.ts comments — explains custom plugin behavior
- src/test/setup.ts — test environment config

