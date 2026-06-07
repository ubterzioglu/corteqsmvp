# CorteQS Landing — Technical Detail Documentation (2026-06-04)

**Status:** Production SPA with mixed architectural patterns. Both refactoring in progress and stability constraints present.

**Last Updated:** 2026-06-04  
**Scope:** Codebase of 90+ pages, 100+ components, 40+ lib modules, 60+ Supabase migrations

---

## 1. PROJECT OVERVIEW

### 1.1 What Is CorteQS Landing?

Multi-feature React + Vite SPA combining:
- Public marketing site (public pages wrapped in `<PublicLayout />`)
- Admin dashboard (wrapped in `<AdminLayout />` + `<RequireAuth />`)
- Member profiles & workspace collaboration (user_profiles_v2 + rolesgo_* tables)
- Accounting module **muhasebe** (income/expenses/cash flow)
- Survey/questionnaire system
- Marketplace (cadde) + Lansman (startup registration) + Referral system
- E-commerce (WelcomePack, Coupons)
- Events, job listings, social media campaigns

### 1.2 Core Metrics

| Metric | Value | Notes |
|--------|-------|-------|
| **Pages** | 90+ | Mostly in `src/App.tsx` (bottleneck) |
| **Components** | 100+ | UI primitives + page-specific |
| **Lib modules** | 40+ | `src/lib/*-api.ts`, `*-schemas.ts`, etc. |
| **Supabase migrations** | 60+ | Cannot reorder; only append new ones |
| **TypeScript strict** | Off | Intentional trade-off (relaxed config) |
| **Test coverage** | Spotty | 80%+ target for new code |
| **Deployment** | Docker (Coolify) | Runtime env injection via `/env-config.js` |

---

## 2. ARCHITECTURE OVERVIEW

### 2.1 Routing Architecture (Known Bottleneck)

**Location:** `src/App.tsx` (main routing hub)

```
src/App.tsx (80+ routes)
├── Public pages (PublicLayout wrapper)
│   ├── HomePage
│   ├── LansmanPage
│   ├── CaddePage
│   ├── AnketPage (survey)
│   ├── CommercialPages (contributors, influencers, etc.)
│   └── ... (50+ public routes)
├── Admin pages (AdminLayout + RequireAuth)
│   ├── Dashboard
│   ├── Muhasebe routes (EXCEPTION: modularized via muhasebe/routes.tsx)
│   ├── Surveys admin
│   ├── Lansman admin
│   └── ... (20+ admin routes)
└── Auth pages (login, register)
```

**Critical Issue:** All routes centralized in one file. **Exception:** Muhasebe routes use modular pattern (`src/pages/admin/muhasebe/routes.tsx`) — **use as reference template for refactoring other modules.**

**Missing:** Code-splitting & lazy loading. Bundle includes all pages upfront.

### 2.2 Data Layer Architecture (Mixed Patterns — Intentionally Inconsistent)

Three approaches coexist. **New code should follow Pattern 2 + 3.**

#### Pattern 1: Direct Component Fetch (❌ Anti-pattern)
```typescript
// BAD: Don't do this
function MyComponent() {
  const [data, setData] = useState([])
  
  useEffect(() => {
    supabase.from('table').select().then(setData)
  }, [])
  
  return <div>{data.length}</div>
}
```

**Problems:**
- No error handling
- No caching
- Causes waterfall requests
- Hard to refactor
- No dependency isolation

#### Pattern 2: API Module Layer (✅ Preferred)
```typescript
// src/lib/muhasebe-api.ts
export async function getGelirler(userId: string) {
  const { data, error } = await supabase
    .from('muhasebe_gelir')
    .select('*')
    .eq('user_id', userId)
  
  if (error) throw error
  return data
}

export async function createGelir(payload: CreateGelirDto) {
  // Validation, mutation, error handling
}
```

**Use this pattern for:**
- All new features
- Shared data operations
- Complex business logic
- Testable operations

**Example:** `src/lib/muhasebe-api.ts`, `src/lib/lansman.ts`

#### Pattern 3: React Query Hooks (✅ Recommended, underused)
```typescript
// In component file or hooks directory
export function useGelirler(userId: string) {
  return useQuery({
    queryKey: ['gelirler', userId],
    queryFn: () => getGelirler(userId)
  })
}

export function useCreateGelir() {
  return useMutation({
    mutationFn: createGelir,
    onSuccess: (newData) => {
      queryClient.invalidateQueries({ queryKey: ['gelirler'] })
    }
  })
}
```

**Provides:**
- Automatic caching
- Deduplication
- Background refetching
- Error/loading states
- Invalidation strategy

**Status:** Implemented in muhasebe, surveys partially; missing in lansman, cadde.

### 2.3 Supabase Client Sources (Dual Client Problem)

```
Two sources exist:
├── src/integrations/supabase/client.ts (Lovable-generated, has type definitions)
└── src/lib/supabase.ts (Custom re-export)
```

**Issue:** Creates confusion, potential divergence. **Solution:** Consolidate both to single source (pending architectural decision).

**Current guideline:** Use `src/lib/supabase.ts` for new code.

### 2.4 Authentication & Authorization (Dual System Coexistence)

**Old System:**
- Table: `public.admin_users`
- View: `role_features` (role-to-feature mapping)
- Pattern: Direct table checks in code

**New System (RolesGo MVP, May 2026):**
- Table: `user_profiles_v2`
- Tables: `rolesgo_roles`, `rolesgo_features`, `rolesgo_role_features`
- Pattern: Unified role/feature lookup

**Status:** **Both systems coexist. Canonical direction TBD.** Before touching profile logic, ask which system is authoritative.

**Usage in Code:**
```typescript
// AuthProvider (src/components/auth/AuthProvider.tsx)
// - Manages Supabase session
// - Provides AuthContext (user, session, isLoading)

// Components that check auth:
<RequireAuth />          // Guards admin routes
<RequireFeature name="feature_slug" />  // Feature flags
```

### 2.5 Feature Modules (Muhasebe as Template)

**Reference Architecture:** `src/muhasebe/` (best-organized module)

```
muhasebe/
├── lib/
│   ├── muhasebe-api.ts          (Supabase queries + mutations)
│   ├── muhasebe-schemas.ts      (Zod validation schemas)
│   ├── muhasebe-format.ts       (Display formatting, number locale)
│   └── muhasebe-aggregations.ts (Business logic: KPIs, calculations)
├── pages/admin/muhasebe/
│   ├── MuhasebeDashboard.tsx
│   ├── GelirlerPage.tsx         (Income management)
│   ├── GiderlerPage.tsx         (Expense management)
│   └── routes.tsx               (Module-level routing — preferred pattern)
└── components/admin/muhasebe/
    ├── KpiCard.tsx
    ├── StatusBadge.tsx
    └── DialogForms.tsx          (Create/Edit dialogs)
```

**Why This Pattern Is Good:**
- ✅ Cohesion: Related code grouped
- ✅ Testability: Isolated API layer
- ✅ Reusability: Schemas + formatting shared
- ✅ Scalability: New pages + components added without touching root

**Target:** Refactor surveys, cadde, lansman, referral to follow this pattern.

---

## 3. CODE ORGANIZATION

### 3.1 Directory Structure (Active)

```
src/
├── App.tsx                              (⚠️  Bottleneck: 80+ routes)
├── main.tsx                             (Hydrate/SSR entry point)
├── components/
│   ├── ui/                              (shadcn/ui auto-generated, don't edit)
│   ├── auth/
│   │   └── AuthProvider.tsx             (Supabase session context)
│   ├── admin/
│   │   ├── muhasebe/                    (KPIs, dialogs)
│   │   ├── surveys/                     (Survey UI)
│   │   └── ...
│   └── <FeatureName>*.tsx               (Page-specific components)
├── pages/
│   ├── HomePage.tsx
│   ├── LansmanPage.tsx
│   ├── admin/
│   │   ├── muhasebe/
│   │   │   ├── MuhasebeDashboard.tsx
│   │   │   ├── GelirlerPage.tsx
│   │   │   ├── GiderlerPage.tsx
│   │   │   └── routes.tsx               (Module routing)
│   │   └── ...
│   └── ...
├── lib/
│   ├── muhasebe-api.ts                  (API layer)
│   ├── muhasebe-schemas.ts              (Zod schemas)
│   ├── muhasebe-format.ts               (Display formatting)
│   ├── muhasebe-aggregations.ts         (Business logic)
│   ├── lansman.ts                       (Domain logic)
│   ├── lansman-api.ts                   (API layer)
│   ├── supabase.ts                      (Client re-export)
│   └── ...
├── integrations/
│   └── supabase/
│       └── client.ts                    (Lovable-generated types)
├── hooks/
│   ├── useAuth.ts
│   ├── useToast.ts
│   └── ...
├── test/
│   └── setup.ts                         (Test environment config)
└── styles/
    └── index.css                        (Global Tailwind + CSS variables)
```

### 3.2 Path Aliases

**Configured in:** `tsconfig.json`, `vite.config.ts`, `vitest.config.ts`

```typescript
@/*  →  src/*

// Usage
import { Button } from '@/components/ui/button'
import { getGelirler } from '@/lib/muhasebe-api'
import { AuthProvider } from '@/components/auth/AuthProvider'
```

---

## 4. TECHNOLOGY STACK

### 4.1 Core Frontend

| Layer | Technology | Version | Notes |
|-------|-----------|---------|-------|
| **Framework** | React | 18.3.1 | No hooks rules violations expected |
| **Build Tool** | Vite | Latest | SWC compiler via @vitejs/plugin-react-swc |
| **Router** | React Router DOM | 6.30.1 | Simple but no lazy loading yet |
| **Language** | TypeScript | (strict: false) | Intentional relaxation; new code should use strict types |

### 4.2 UI & Styling

| Tool | Library | Version | Purpose |
|------|---------|---------|---------|
| **UI Primitives** | shadcn/ui | Auto-generated | Accessible Radix-based components |
| **CSS Framework** | Tailwind CSS | Latest | Utility-first styling |
| **Theming** | next-themes | 0.3.0 | Dark mode + CSS variables |
| **Icons** | Lucide React | 0.462.0 | 1000+ icon set |
| **Forms** | react-hook-form | 7.61.1 | Lightweight form state |
| **Form Validation** | Zod | 3.25.76 | Runtime schema validation + TS inference |
| **Notifications** | Sonner | 1.7.4 | Toast library |
| **Tables** | @tanstack/react-table | 8.21.3 | Headless table library |
| **Carousels** | embla-carousel-react | 8.6.0 | Responsive carousel |
| **Dialogs/Modals** | @radix-ui/react-dialog | 1.1.14 | Accessible modal primitives |

### 4.3 Data & State Management

| Tool | Library | Version | Purpose |
|------|---------|---------|---------|
| **Database** | Supabase | PostgreSQL backend | RLS-enabled, 60+ migrations |
| **JS Client** | @supabase/supabase-js | 2.101.1 | Session auth, real-time |
| **Query Caching** | @tanstack/react-query | 5.83.0 | Server state management (underused) |
| **Form State** | react-hook-form | 7.61.1 | Client state, minimal overhead |

### 4.4 Server & Build

| Tool | Config | Purpose |
|------|--------|---------|
| **Node Server** | server.mjs | Production runtime; env injection via `/env-config.js` |
| **Build Output** | dist/ | Static SPA + ES modules |
| **Environment** | .env.local, .env | Build-time (VITE_*) + runtime (server.mjs) |

### 4.5 Testing

| Framework | Config | Coverage |
|-----------|--------|----------|
| **Unit/Integration** | Vitest + Testing Library | ~40% (target 80%+) |
| **E2E** | Playwright | ~5% (underutilized) |
| **Setup** | src/test/setup.ts | jest-dom matchers, jsdom |

---

## 5. TYPESCRIPT CONFIGURATION

### 5.1 Compiler Options (Intentionally Relaxed)

```json
{
  "strict": false,              // INTENTIONAL: Would require massive refactor
  "strictNullChecks": false,
  "noImplicitAny": false,
  "noUnusedLocals": false,
  "noUnusedParameters": false
}
```

**Rationale:** Codebase predates strict TS. Tightening without rewrite not feasible.

**Guideline for New Code:**
- Write as if `strict: true` is enabled
- Explicit types on public APIs and exports
- Use `unknown` for external input
- Avoid `any`

### 5.2 Path Resolution

```json
{
  "paths": {
    "@/*": ["./src/*"]
  }
}
```

**Always use `@/` prefix:**
```typescript
// ✅ Correct
import { Button } from '@/components/ui/button'

// ❌ Avoid
import { Button } from '../../../components/ui/button'
```

---

## 6. BUILD & DEPLOYMENT

### 6.1 Build Pipeline

```bash
npm run verify:text          # Text encoding check (pre-hook)
npm run build                # Production bundle (Vite)
npm run verify:release       # Asset validation
```

**Vite Custom Plugin:** `vite.config.ts`
- Injects standalone HTML documents into `dist/commercial/<slug>/`
- Maps routes like `/commercial/contributor` → `info-contributor.html`
- Preserves complex logic; DO NOT simplify without testing

### 6.2 Environment Variables

#### Build-Time (VITE_ prefix)
```env
VITE_SUPABASE_URL=https://injprdrsklkxgnaiixzh.supabase.co
VITE_SUPABASE_ANON_KEY=<public-key>
VITE_SUPABASE_PROJECT_ID=injprdrsklkxgnaiixzh
```

**Exposed to browser:** These are public keys. Sensitive keys must use server-side-only approach.

#### Runtime-Only (server.mjs)
```env
SUPABASE_SERVICE_ROLE_KEY=<service-role>  (Never expose to frontend)
RAG_API_SECRET=<secret>                   (For /api/chat proxy)
```

### 6.3 Runtime (server.mjs)

```javascript
// Runs via: npm run start

// Key behaviors:
1. Generates /env-config.js from env vars at startup
2. Injects config into index.html
3. Proxies /api/chat to rag.corteqs.net
4. Serves SPA with fallback (history API)
```

**Deploy Platform:** Coolify (Docker)
- Expects: `npm run build` → `dist/`
- Runs: `npm run start` → Server listening
- Runtime env: Injected at container startup

### 6.4 Verification

```bash
# Local testing
npm run start
curl http://localhost:3000/env-config.js

# Production verification
BASE_URL=https://corteqs.net npm run verify:release
```

---

## 7. DATABASE & MIGRATIONS

### 7.1 Supabase Project

| Property | Value |
|----------|-------|
| **Project ID** | injprdrsklkxgnaiixzh |
| **Region** | (TBD) |
| **RLS Status** | Active |
| **Migrations** | 60+ (can only append, never reorder) |

### 7.2 Key Tables

| Table | Purpose | RLS | Notes |
|-------|---------|-----|-------|
| `public.submissions` | Survey responses, lansman forms | ✅ | Main submission table |
| `public.surveys` | Questionnaire definitions | ✅ | Questions stored in JSONB |
| `user_profiles_v2` | Member profiles (new system) | ✅ | RolesGo canonical source |
| `rolesgo_roles` | Role definitions | ✅ | MVP in progress |
| `rolesgo_features` | Feature flags | ✅ | New auth system |
| `rolesgo_role_features` | Role→feature mapping | ✅ | New auth system |
| `muhasebe_gelir` | Income records | ✅ | User-scoped |
| `muhasebe_gider` | Expense records | ✅ | User-scoped |
| `public.admin_users` | Old auth system | ✅ | Legacy, will be deprecated |

### 7.3 RLS Policies (Critical)

**Status:** Active across all tables. **Before modifying RLS:**
1. Read recent migration files for context
2. Test locally with `supabase db push`
3. Validate in staging environment
4. Never delete existing migrations

**Known Issue:** Submission insert RLS has reset history (changed multiple times).

### 7.4 Edge Functions

Located in `supabase/functions/`:

| Function | Purpose |
|----------|---------|
| `send-submission-email` | Email notification on form submit |
| `lansman-admin` | Admin notification for lansman signup |
| (3 others) | TBD |

**Deploy:** `supabase functions deploy <name>`

---

## 8. AUTHENTICATION & AUTHORIZATION

### 8.1 Session Management

**Entry point:** `src/components/auth/AuthProvider.tsx`

```typescript
// Wraps entire app, manages:
// - Supabase session lifecycle
// - User context (user, session, isLoading)
// - Token refresh

export const AuthContext = createContext<AuthContextType>()

// Usage in components:
const { user, session, isLoading } = useContext(AuthContext)
```

### 8.2 Route Guards

```typescript
// Guards admin routes
<RequireAuth>
  <AdminPage />
</RequireAuth>

// Feature-flag based authorization
<RequireFeature name="muhasebe_access">
  <MuhasebeModule />
</RequireFeature>
```

### 8.3 Role System (Transitional)

**Old System (legacy):**
- Check `user.role` from `admin_users` table
- Used in many older components

**New System (RolesGo, May 2026):**
- Query `rolesgo_*` tables via `user_profiles_v2`
- More granular feature control
- Pending finalization

**Before Using:** Ask which system should be authoritative for your feature.

---

## 9. TESTING STRATEGY

### 9.1 Current Test Structure

```
src/
├── **/*.test.ts(x)         (Vitest + Testing Library)
├── test/
│   └── setup.ts            (jsdom, jest-dom matchers)
```

### 9.2 Test Coverage by Module

| Module | Coverage | Pattern | Notes |
|--------|----------|---------|-------|
| **muhasebe** | ~60% | Unit + integration | Good example: `muhasebe-api.test.ts` |
| **surveys** | ~40% | Component tests | Partial; missing E2E |
| **lansman** | ~50% | Domain logic | Good: `lansman.test.ts` |
| **cadde** | ~20% | Minimal | Needs coverage |
| **admin pages** | ~5% | Spotty | Major gap |

### 9.3 Running Tests

```bash
npm run test              # Run once
npm run test:watch       # Watch mode
npm run test -- --ui     # UI dashboard
npm run test -- --coverage  # Coverage report (experimental)

# Single file
npm run test -- src/lib/muhasebe-api.test.ts
```

### 9.4 E2E Testing (Underutilized)

**Framework:** Playwright (configured, barely used)

**Critical paths to cover (not yet done):**
- User login → profile completion → dashboard access
- Survey submission → confirmation email
- Lansman form → admin notification → user confirmation
- Accounting form submission → data persistence

---

## 10. KNOWN CONSTRAINTS & IMMOVABLE PARTS

### 10.1 SEO-Locked Routes

These routes **cannot be renamed** without breaking user-facing URLs:

| Route | Purpose |
|-------|---------|
| `/lansman` | Startup registration (public + admin) |
| `/cadde` | Marketplace |
| `/founders` | Founders page |
| `/commercial/<slug>` | Standalone pages (contributor, influencer, etc.) |
| `/19051919` | Special date-based page |
| `/anket` | Survey/questionnaire |

**Why:** External links, bookmarks, SEO. **Changing them breaks discoverability.**

### 10.2 Supabase Migrations

**Immutable in production:**
- Cannot delete existing migrations
- Cannot reorder migrations
- Only append new migrations

**Reason:** Migrating databases forward-only; reversing breaks data integrity.

**Procedure:**
1. Create new migration via `supabase migration new <name>`
2. Test locally with `supabase db push`
3. Commit to git
4. Deploy via `supabase migrations deploy` (automatic on CD)

### 10.3 Vite Plugin (Commercial Documents)

**File:** `vite.config.ts`

**Does:** Injects `info-*.html` documents into `dist/commercial/<slug>/` during build.

**Why Complex:** Supports multiple route aliases for each document.

**Don't change without testing:** Build output may break commercial pages.

### 10.4 server.mjs Runtime Behavior

**Preserves:**
- `/env-config.js` generation from env vars
- `/api/chat` proxy to `rag.corteqs.net`
- SPA fallback (history API support)

**Critical for:** Production deployment, runtime env injection, RAG integration.

### 10.5 Hardcoded Supabase Project ID

Value: `injprdrsklkxgnaiixzh` (appears in env examples, some code)

**Override via:** `VITE_SUPABASE_URL` env var

---

## 11. COMMON DEVELOPMENT PATTERNS

### 11.1 Adding a New Admin CRUD Page

**Checklist:**
```
□ Create src/pages/admin/<feature>/List.tsx
□ Create src/lib/<feature>-api.ts (Supabase queries + mutations)
□ Create src/lib/<feature>-schemas.ts (Zod validation)
□ Implement React Query hooks (useQuery + useMutation)
□ Create form dialogs in src/components/admin/<feature>/
□ Add route to src/App.tsx (or feature routes.tsx if modularizing)
□ Add tests for API layer (80%+ coverage)
```

**Example:**
```typescript
// src/lib/item-api.ts
export async function getItems(userId: string) {
  const { data, error } = await supabase
    .from('items')
    .select('*')
    .eq('user_id', userId)
  if (error) throw error
  return data
}

// In component
const { data, isLoading } = useQuery({
  queryKey: ['items', userId],
  queryFn: () => getItems(userId)
})
```

### 11.2 Adding a Public Form

**Checklist:**
```
□ Create src/pages/<FormPage>.tsx
□ Define Zod schema (inline or src/lib/<form>-schemas.ts)
□ Use react-hook-form + @hookform/resolvers
□ Submit to supabase.from('submissions').insert()
□ Handle success/error with toast (use-toast hook)
□ Add to routing in src/App.tsx
□ Validate RLS policy permits insert
□ Test with various user roles
```

**Example:**
```typescript
const schema = z.object({
  email: z.string().email(),
  name: z.string().min(1)
})

type FormData = z.infer<typeof schema>

function MyForm() {
  const form = useForm<FormData>({
    resolver: zodResolver(schema)
  })

  const onSubmit = async (data: FormData) => {
    try {
      await supabase.from('submissions').insert(data)
      toast.success('Submitted!')
    } catch (error) {
      toast.error('Failed to submit')
    }
  }

  return <form onSubmit={form.handleSubmit(onSubmit)}>...</form>
}
```

### 11.3 Error Handling Pattern

```typescript
// ALWAYS handle unknown errors safely
try {
  const result = await riskyOperation()
  // Process result
} catch (error: unknown) {
  const message = error instanceof Error 
    ? error.message 
    : 'Unexpected error'
  
  toast.error(message)
  console.error('Operation failed:', error)
}
```

### 11.4 State Updates (Immutability)

```typescript
// WRONG: Mutation
items[0].name = 'New Name'
setItems(items)

// CORRECT: Immutable update
setItems(prev => prev.map((item, i) =>
  i === 0 ? { ...item, name: 'New Name' } : item
))
```

---

## 12. TERMINAL COMMANDS QUICK REFERENCE

### Development
```bash
npm install              # Install dependencies
npm run dev              # Vite dev (port 8080)
npm run build            # Production build
npm run start            # Serve dist/ locally
npm run lint             # ESLint check
npm run lint -- --fix    # Auto-fix linting issues
```

### Testing
```bash
npm run test             # Run once
npm run test:watch       # Watch mode
npm run test -- --ui     # UI dashboard
npm run test -- --coverage  # Coverage report
```

### Database
```bash
supabase functions deploy send-submission-email
supabase migrations list
supabase db push         # Push local migrations (dev only)
```

### Verification
```bash
npm run verify:text      # Text encoding check
npm run verify:release   # Asset validation
BASE_URL=https://corteqs.net npm run verify:release
```

---

## 13. KNOWN ISSUES & REFACTOR OPPORTUNITIES

### 13.1 High Priority

| Issue | Impact | Effort | Blocker |
|-------|--------|--------|---------|
| **App.tsx monolithic** | Hard to navigate, slow startup | High | No, but necessary for modularity |
| **Dual Supabase clients** | Confusion, potential divergence | Medium | No, consolidation safe |
| **Mixed auth systems** | Feature gate complexity | Medium | Yes, need canonical choice |
| **No code-splitting** | Large bundle (>500KB) | High | No, but impacts performance |

### 13.2 Medium Priority

| Issue | Impact | Effort |
|--------|--------|--------|
| **Inconsistent data fetching** | Hard to debug, scattered patterns | Medium |
| **Test coverage < 50%** | Regression risk | High |
| **TypeScript strict off** | Hidden type bugs | High |
| **E2E tests minimal** | Critical paths untested | Medium |

### 13.3 Low Priority (Nice-to-Have)

- [ ] Add Storybook for component catalog
- [ ] Implement error tracking (Sentry)
- [ ] Add performance monitoring (Web Vitals)
- [ ] Standardize date/number formatting library-wide

---

## 14. DECISION MATRICES FOR AGENTS

### 14.1 "Where Should I Put This New Feature?"

| Scenario | Decision | Why |
|----------|----------|-----|
| Admin CRUD (users, items, etc.) | New page in `src/pages/admin/<feature>/` + `src/lib/<feature>-api.ts` | Follows muhasebe template |
| Public landing/marketing | New page in `src/pages/<FeaturePage>.tsx` + `PublicLayout` | Clear separation of concerns |
| Shared utility/hook | `src/lib/<name>.ts` or `src/hooks/<name>.ts` | Reusable, testable |
| Reusable component | `src/components/<CategoryName>/<ComponentName>.tsx` | Follows naming convention |
| UI primitive | Already exists in `src/components/ui/` (don't edit) | Use shadcn/ui auto-generated |

### 14.2 "Which Data-Fetching Pattern Should I Use?"

| Requirement | Pattern | Why |
|-------------|---------|-----|
| Simple read, no caching needed | Direct Supabase in component | Only for throwaway prototypes |
| API layer + component reuse | API module + React Query | ✅ Standard for new code |
| Complex business logic | Separate aggregation module | Testable, reusable |
| Optimistic updates | React Query mutation with onSuccess | Built-in cache invalidation |
| Real-time subscriptions | Supabase `.on('*', callback)` | Only for live data |

### 14.3 "When Should I Use RLS vs. App-Level Auth?"

| Scenario | Use RLS | Why |
|----------|---------|-----|
| User can only access own data | ✅ RLS policy | Protects at DB layer |
| Admin has special permissions | ✅ RLS + role check | Prevents unauthorized access |
| Feature gate (feature flag) | App-level check | No data risk; UX preference |
| Super-admin bypass | ✅ RLS with service role | Service role ignores RLS |

---

## 15. SECURITY POSTURE

### 15.1 Mandatory Checks Before Commit

- [ ] No hardcoded secrets (API keys, passwords, tokens)
- [ ] All user inputs validated (Zod schemas)
- [ ] No direct SQL injection risk (using Supabase parameterized queries)
- [ ] XSS prevention (React escapes by default, watch for `dangerouslySetInnerHTML`)
- [ ] CSRF protection (Supabase handles via session tokens)
- [ ] Auth routes properly guarded
- [ ] Error messages don't leak sensitive data
- [ ] No `console.log` in production code

### 15.2 Secret Management

```typescript
// NEVER
const API_KEY = "sk-proj-xxxxx"

// ALWAYS
const API_KEY = process.env.VITE_API_KEY
if (!API_KEY) {
  throw new Error('VITE_API_KEY not configured')
}
```

### 15.3 RLS Policies (Active)

**All sensitive tables have RLS enabled:**
- `submissions`: User-scoped rows
- `user_profiles_v2`: Self + admin access
- `muhasebe_*`: User-scoped data

**Before modifying RLS:**
1. Understand policy logic
2. Test with multiple user roles
3. Validate staging environment
4. Never disable RLS for convenience

---

## 16. PERFORMANCE CONSIDERATIONS

### 16.1 Bundle Size (Known Issue)

**Current:** ~500KB+ (all pages + routes included upfront)

**Opportunities:**
- [ ] Code-split by route (React.lazy + Suspense)
- [ ] Dynamic imports for admin pages
- [ ] Tree-shake unused dependencies
- [ ] Upgrade Vite for better optimization

### 16.2 Query Optimization

```typescript
// SLOW: Fetch all, filter in JS
const allUsers = await supabase.from('users').select('*')
const activeUsers = allUsers.filter(u => u.is_active)

// FAST: Filter at DB layer
const activeUsers = await supabase
  .from('users')
  .select('*')
  .eq('is_active', true)
```

### 16.3 N+1 Query Prevention

```typescript
// WRONG: Loop makes N queries
for (const user of users) {
  const profile = await supabase
    .from('profiles')
    .select()
    .eq('user_id', user.id)
}

// CORRECT: One query with join
const usersWithProfiles = await supabase
  .from('users')
  .select('*, profiles(*)')
```

### 16.4 Caching Strategy

- **React Query:** Automatic cache with 5min stale-time (configurable)
- **Browser:** Supabase auth token cached in localStorage
- **Supabase:** Query results cached per session (no additional config needed)

---

## 17. LINGUISTICS & DOMAIN TERMINOLOGY

### Turkish Terms (NEVER Rename)

Keep these in Turkish throughout codebase:

| Term | English | Usage |
|------|---------|-------|
| **muhasebe** | Accounting | Table/module names, feature flags |
| **gelirler** | Income | Table `muhasebe_gelir`, pages, components |
| **giderler** | Expenses | Table `muhasebe_gider`, pages, components |
| **nakit akışı** | Cash flow | Reports, KPI labels |
| **lansman** | Launch/startup registration | Routes `/lansman`, module `lansman-api.ts` |
| **cadde** | Street/marketplace | Routes `/cadde`, module `cadde-*.ts` |
| **oda** | Room/chamber | `OdaList.tsx`, etc. |
| **kişi** | Person | User profiles, member data |
| **yönetici** | Admin | Role, permission levels |
| **referans** | Referral | Program, tables, components |
| **ambasador** | Ambassador | Role, program, components |
| **kaynak** | Resource | Tables, UI labels |

**Reason:** Renaming breaks domain understanding for Turkish-speaking stakeholders.

---

## 18. CRITICAL FILES & THEIR PURPOSES

| File Path | Purpose | Risk Level | Touch Frequency |
|-----------|---------|-----------|-----------------|
| `src/App.tsx` | Master routing hub | HIGH | Weekly (refactoring target) |
| `src/components/auth/AuthProvider.tsx` | Session + context management | HIGH | Rarely (stable) |
| `src/lib/supabase.ts` | Supabase client re-export | HIGH | Rarely |
| `src/integrations/supabase/client.ts` | Lovable-generated types | HIGH | Never edit manually |
| `vite.config.ts` | Build config + custom plugin | HIGH | Rarely (complex logic) |
| `server.mjs` | Production runtime | HIGH | Rarely (env injection magic) |
| `tsconfig.json` | TypeScript config (relaxed) | MEDIUM | Rarely |
| `package.json` | Dependencies + scripts | MEDIUM | Monthly (updates) |
| `supabase/migrations/*` | Database schema | HIGH | Weekly (new features) |

---

## 19. MEMORY & CONTEXT FOR AGENTS

**When working on this codebase, reference:**

1. **CLAUDE.md** (main guidance) — Architecture decisions, constraints
2. **This document (0406techdet.md)** — Current state, patterns, decision matrices
3. **Muhasebe module** (`src/muhasebe/`) — Best-practice reference
4. **docs/CORTEQS_LANDING_TEKNIK_DOKUMANTASYON.md** — Deep technical overview (Turkish)
5. **docs/cleanup/2026-05-30/** — Recent refactor audit results
6. **docs/modules/** — Feature-specific docs (Turkish domain names)

---

## 20. GLOSSARY & ABBREVIATIONS

| Abbreviation | Full Form | Context |
|--------------|-----------|---------|
| **SPA** | Single Page Application | App is client-side router based |
| **RLS** | Row-Level Security | Supabase database policies |
| **JWT** | JSON Web Token | Supabase session token |
| **API** | Application Programming Interface | `src/lib/*-api.ts` modules |
| **Dto** | Data Transfer Object | Schemas for API inputs |
| **MVC** | Model-View-Controller | Not explicitly used; avoid mentioning |
| **UI** | User Interface | shadcn/ui primitives |
| **HSL** | Hue-Saturation-Lightness | CSS variable color system |
| **JSDOM** | JavaScript DOM environment | Vitest setup for browser API simulation |

---

## 21. DOCUMENT METADATA

| Property | Value |
|----------|-------|
| **Document Version** | 1.0 |
| **Date Created** | 2026-06-04 |
| **Last Updated** | 2026-06-04 |
| **Audience** | AI Agents, Developers, Architects |
| **Format** | Markdown (AI-friendly) |
| **Language** | English (technical) + Turkish (domain terms) |
| **Related Documents** | CLAUDE.md, docs/CORTEQS_LANDING_TEKNIK_DOKUMANTASYON.md, docs/cleanup/2026-05-30/* |

---

**END OF TECHNICAL DETAIL DOCUMENTATION**

*For additions or corrections, update this document and commit changes to preserve accuracy.*
