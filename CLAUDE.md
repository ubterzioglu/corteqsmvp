# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**CorteQS Landing** is a multi-feature React + Vite application with Supabase backend. It combines a public marketing site, admin dashboard, member profiles, surveys, workspace collaboration tools, and an accounting module (muhasebe) — all in a single SPA.

**Key Metrics:**
- 90+ pages, 100+ components, 40+ lib modules
- 60+ Supabase migrations with RLS policies
- TypeScript with relaxed strict mode (intentional trade-off)
- Deployed via Docker (Coolify) with runtime environment injection

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

### Routing (App.tsx — Known Bottleneck)
- All 80+ routes defined in `src/App.tsx` (large file, low modularity)
- **Exception:** Muhasebe routes are modularized via `src/pages/admin/muhasebe/routes.tsx` — use this as reference pattern
- Public pages wrapped in `<PublicLayout />` (header, footer, scroll button)
- Admin pages wrapped in `<AdminLayout />` + `<RequireAuth />`
- No lazy loading or code-splitting yet (bundle optimization opportunity)

### Data Layer (Mixed Patterns — Inconsistent)
**Two Supabase client sources:**
- `src/integrations/supabase/client.ts` (Lovable-generated, has type definitions)
- `src/lib/supabase.ts` (custom re-export)

**Three data-fetching styles (choose one per feature):**
1. **Direct component fetch** (anti-pattern): `supabase.from('table').select()` in component
2. **API module layer** (preferred): `src/lib/*-api.ts` (muhasebe-api.ts is good example)
3. **React Query** (recommended but underused): `useQuery`/`useMutation` hooks with query keys

**Guideline:** New features should use `src/lib/*-api.ts` + React Query hooks. Prefer `muhasebe-*.ts` pattern over surveys/lansman pattern.

### Authentication & Roles

**CRITICAL: Two AuthProviders — only one is mounted**

| | `src/components/auth/` | `src/contexts/AuthContext.tsx` |
|---|---|---|
| Mounted in App.tsx | **YES** (canonical) | **NO** (orphaned provider) |
| Fields | `session`, `user`, `isLoading` | `session`, `user`, `loading`, `profile`, `accountType`, `signOut`, `refreshProfile` |
| Profile support | None | Fetches from `profiles` table |

`src/contexts/AuthContext.tsx` exports its own `AuthProvider` and `useAuth`, but its `AuthProvider` is **never mounted** in App.tsx. The 38 public/member-area components that import `useAuth` from `src/contexts/AuthContext.tsx` receive only the default context values (`user: null`, `loading: true`) — they never see a real session.

**Before touching any of these 38 files, confirm whether they need real auth or are intentionally unauthenticated UI.**

The canonical `useAuth` lives in `src/components/auth/useAuth.ts` → reads from `src/components/auth/auth-context.ts`. Always import from here for admin/guarded routes.

**Role / permission systems (both active, direction TBD):**
- **Old system:** `public.admin_users` table — `userIsAdmin()` in `src/lib/admin.ts` checks this. `AdminLayout` gates the entire admin section via this check.
- **New system:** `user_profiles_v2` + `rolesgo_*` tables (RolesGo MVP, May 2026) — drives `RequireFeature` / `useFeatureFlags`.
- `RequireAuth` guards admin routes (checks canonical session).
- `RequireFeature` provides feature-flag-based authorization via new system.
- **Do not touch profile logic or role checks without first clarifying which system applies to the feature.**

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

**Follow this structure for surveys, cadde, may19, lansman, referral modules.**

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
| `src/App.tsx` | Master route table (refactor target) |
| `src/main.tsx` | Hydrate/Render switch (future SSR entry) |
| `src/components/auth/AuthProvider.tsx` | Supabase session + context root |
| `src/lib/muhasebe-*.ts` | Reference architecture (apis, schemas, aggregations) |
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
   - `/lansman`, `/cadre`, `/founders`, `/commercial/<slug>`, `/cadde`, `/19051919`, `/anket`
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

- **60+ migrations** in `supabase/migrations/`
- **RLS active** — submissions require specific conditions
- **Key tables:** `public.submissions`, `public.surveys`, `user_profiles_v2`, `rolesgo_*`, `muhasebe_*`
- **Edge Functions:** 5 functions in `supabase/functions/`

Before touching migrations:
1. Read recent migration files to understand dependencies
2. Test schema changes locally with `supabase db push`
3. Never delete existing migrations

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

Located in `docs/`:
- `docs/architecture/` — technical overview and decisions
- `docs/modules/` — feature-specific documentation (Turkish domain names)
- `docs/guides/` — user/admin guides
- `docs/operations/` — deployment, database, security runbooks
- `docs/history/` — archived plans and cleanup reports

**Before major changes, check docs for context and constraints.**

## Known Limitations & Refactor Opportunities

1. **`src/App.tsx` is monolithic** → Use feature-based route modules (muhasebe pattern)
2. **Duplicate Supabase client** → Consolidate to single source of truth
3. **Mixed data fetching** → Standardize on React Query + `*-api.ts` modules
4. **No code-splitting** → Add `React.lazy` + `Suspense` for route chunks
5. **TypeScript loose** → Can be tightened incrementally
6. **Test coverage spotty** → Add critical path E2E tests (Playwright)
7. **Old + new auth systems coexist** → Clarify canonical direction

## Additional Resources

- README.md — deployment, env setup, Edge Function secrets
- docs/CORTEQS_LANDING_TEKNIK_DOKUMANTASYON.md — deep technical overview (Turkish)
- docs/cleanup/2026-05-30/ — recent cleanup audit results
- vite.config.ts comments — explains custom plugin behavior
- src/test/setup.ts — test environment config

