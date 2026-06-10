# CorteQS — AI Technical Reference

> **Audience:** AI coding agents. **Optimised for:** fast, unambiguous lookup.
> **Last verified against repo:** 2026-06-10 (post catalog/flat-role/AFS rebuild + diplomatic-profiles cleanup).
> **Companion docs:** `docs/AGENT_CONTEXT.md` (quick orientation, Turkish), `CLAUDE.md` (working rules),
> `docs/catalog-role-afs-rebuild/` (rebuild reports 00–14).
>
> This file states facts as `name = value` and `OLD → NEW`. When a fact here conflicts with an
> older doc, **this file + the migrations are the source of truth.** Verify a symbol still exists
> (Grep / Read the migration) before relying on it in a recommendation.

---

## 0. TL;DR for an agent landing cold

```
Project   : CorteQS Landing — single React+Vite SPA, Supabase backend, Turkish diaspora platform
Live URL  : https://corteqs.net
Supabase  : project id injprdrsklkxgnaiixzh (overridable via VITE_SUPABASE_URL)
Build     : npm run build → dist/ ;  serve: node server.mjs (Coolify/Docker)
Dev       : npm run dev (port 8080) ;  test: npm run test (vitest) ;  lint: npm run lint
TS strict : OFF (intentional) — write new code as if strict:true anyway
Auth      : @/components/auth/useAuth is canonical; @/contexts/AuthContext is a SHIM (still imported by ~39 files)
DB client : @/integrations/supabase/client — the ONLY client (Lovable-generated, do not edit)
Catalog   : AFS schema (Attributes/Features/Sections), 76 FLAT roles, no families. See §4.
Reference : muhasebe module (src/lib/muhasebe-*.ts) = the architecture template to copy
```

**Three rules that prevent most mistakes:**
1. Use the **AFS table names** (§4). Old names (`attribute_catalog`, `catalog_item_memberships`, …) are gone.
2. Never reference `profiles` / `user_profiles` / `admin_users` — use `user_role_assignments` + `user_profile_attributes` + `is_admin()`/`is_moderator()` RPCs.
3. Never change SEO-locked route paths or rename Turkish domain terms (§9).

---

## 1. Repo facts (verified 2026-06-10)

| Metric | Value | Source of truth |
|--------|-------|-----------------|
| Page `.tsx` files | 150 (65 under `src/pages/admin`) | `find src/pages -name '*.tsx'` |
| Components (`.ts`+`.tsx`) | 269 | `src/components/**` |
| Lib modules (`.ts`) | 81 | `src/lib/**` |
| Migrations | 221 | `supabase/migrations/*.sql` |
| Edge functions | 5 | `supabase/functions/` |
| Test files (`*.test.ts(x)`) | 83 | `src/**` |
| `src/App.tsx` | 299 lines, 75 `lazy()` imports | code-split route table |
| `src/components/admin/AdminLayout.tsx` | 741 lines | refactor target B4 |
| `server.mjs` | 277 lines | prod runtime |

**Edge functions:** `chat-register`, `find-matches`, `lansman-admin`, `send-submission-email`, `submit-survey-response`.

---

## 2. Tech stack (pinned families)

```
React 18.3            react-router-dom 7        @tanstack/react-query 5
TypeScript 5.8        Vite 5.4 + plugin-react-swc   @supabase/supabase-js 2.101
Tailwind 3.4          shadcn/ui (Radix)         react-hook-form 7 + zod 3
Vitest 3              Playwright 1.57           sonner · next-themes · lucide-react
recharts 2            @tanstack/react-table 8   d3-geo · date-fns 3
```
> `react-router-dom` is **v7** in `package.json` (older docs say v6). API used is the v6-compatible `<Routes>/<Route>` tree in `App.tsx`.

`tsconfig` is intentionally relaxed: `strict:false`, `strictNullChecks:false`, `noImplicitAny:false`,
`noUnusedLocals:false`, `noUnusedParameters:false`. Do **not** flip these globally; tighten per-file.

---

## 3. Directory map (where things live)

```
src/
├── App.tsx                      # route table, 75 lazy() splits. PublicLayout vs AdminLayout(+RequireAuth)
├── main.tsx                     # hydrateRoot/createRoot switch
├── pages/
│   ├── admin/                   # 65 admin pages
│   │   ├── muhasebe/            # routes.tsx — the ONLY modularised feature (COPY THIS PATTERN)
│   │   ├── workspace/           # command center, todos, resources, mvp, meeting-notes
│   │   ├── surveys/             # survey CRUD
│   │   ├── AdminCatalogPage.tsx        # /admin/data + profile-role-assignment
│   │   ├── AdminRolesOverviewPage.tsx  # roles/items overview
│   │   ├── AdminDurumRaporuPage.tsx    # /admin/new-member/durum-raporu (live rebuild status)
│   │   └── ...
│   └── *.tsx                    # ~85 public pages
├── components/
│   ├── ui/                      # shadcn primitives — AUTO-GENERATED, do not hand-edit
│   ├── auth/                    # AuthProvider, useAuth (canonical), RequireAuth, RequireFeature
│   ├── admin/                   # AdminLayout.tsx + muhasebe/ catalog/ role-management/ roles-overview/
│   ├── directory/              # directory search/filter/result + catalog profile layout
│   └── profile/ surveys/ may19/ chat/ messaging/ feed/ connections/
├── lib/
│   ├── muhasebe-*.ts            # api · schemas · format · aggregations — REFERENCE ARCHITECTURE
│   ├── admin.ts                 # 57-line barrel → re-exports src/lib/admin/
│   ├── admin/                   # 7 domain APIs (access/role/feature/profile/taxonomy/approval/referral)
│   ├── catalog-*.ts             # catalog-directory · catalog-entity-api · catalog-types
│   ├── admin-catalog.ts         # admin unified-records / catalog data layer
│   ├── role-catalog.ts          # role definitions data layer
│   ├── member-profile-api.ts    # member profile API (PREFERRED)
│   └── profile-*.ts features.ts dashboard/
├── hooks/                       # useAuth-adjacent: useFeatureFlags, useMuhasebe, useCurrentUserProfile, ...
├── integrations/supabase/
│   ├── client.ts                # the ONLY Supabase client (Lovable-generated)
│   └── types.ts                 # AUTO-GENERATED (supabase gen types) — 8861 lines, do not hand-edit
└── contexts/AuthContext.tsx     # backward-compat SHIM (delegates to canonical useAuth)
```

---

## 4. Database schema — AFS rebuild (CANONICAL)

The **catalog / flat-role / AFS** rebuild (Phases 1–8, live 2026-06-09) is the single biggest schema
change in the project. It (a) flattened roles, (b) renamed 9 tables to the `afs_*` / `catalog_item_*`
scheme, (c) dropped the item-type + role-family systems, (d) rewired 44+ DB functions.

### 4.1 Rename table (OLD → NEW) — memorise this

| OLD (gone) | NEW (canonical) |
|------------|-----------------|
| `attribute_catalog` | `afs_attributes` |
| `feature_catalog` | `afs_features` |
| `profile_section_catalog` | `afs_sections` |
| `role_attribute_rules` | `role_attributes` |
| `role_feature_flags` | `role_features` |
| `role_profile_section_rules` | `role_sections` |
| `catalog_item_attributes` | `catalog_item_attribute_values` |
| `catalog_claim_requests` | `catalog_item_claims` |
| `catalog_item_memberships` | `catalog_item_managers` |

**Dropped entirely:** `catalog_item_types`, `item_type_attribute_rules`, `item_type_feature_*`,
`role_taxonomy_rules`, all `*_details` tables (advisor_details, business_details, person_profile_details, …),
and the role-family columns `family_key` / `parent_role_id`.
**Also dropped earlier (legacy auth):** `profiles`, `user_profiles`, `user_profiles_v2`, `admin_users`, `role_feature_defaults`.

> Runtime code (`src/**`, excluding auto-gen `types.ts`) has **0** references to any OLD name —
> verified in `docs/catalog-role-afs-rebuild/13-post-cleanup-grep-report.md`. Keep it that way.

### 4.2 Canonical tables by domain

**Auth / roles / profile**
```
auth.users                  Supabase Auth canonical user
user_role_assignments       user ↔ role  (THE single place a user's role lives)
user_profile_attributes     all profile data, stored as attribute rows (full_name, avatar_url, bio, …)
user_feature_overrides      per-user feature exceptions
approval_requests           role-change / feature / attribute approval workflow
```

**Catalog**
```
catalog_items               every catalog record. cols: slug, title, country_code, city, status,
                            visibility, is_placeholder, is_verified, created_by, deleted_at
                            → live count 239 (163 real + 76 placeholder)
catalog_item_roles          item ↔ role (is_primary) — replaces the old *_details tables
catalog_item_attribute_values  per-item attribute values (typed columns)
catalog_item_claims         ownership claim requests
catalog_item_managers       owner/manager/editor/contributor/viewer grants
+ ~15 satellite tables: media, contacts, links, locations, services, languages, categories,
  reviews, reports, tags, relations, favorites, audit_logs, verification_records, search_documents
```

**AFS rule tables (role → attributes/features/sections)**
```
roles            76 FLAT roles. cols: key, label, is_active, sort_order, deleted_at. NO family/parent. 0 legacy.
afs_attributes   53 rows — attribute dictionary (storage strategies: core_column, dynamic_value,
                 private_storage, computed)
afs_features     42 rows — capability/permission dictionary (41 globally enabled, 1 disabled)
afs_sections     7 rows  — UI section dictionary (preview_card, detail_card, …)
role_attributes  role ↔ attribute rule (enabled / required / approval)
role_features    role ↔ feature flag (default-on per role)
role_sections    role ↔ section visibility
```

**Other domains (unchanged by the rebuild)**
```
submissions                 public marketing form submissions (RLS-sensitive; insert policy has reset history)
surveys / survey_questions / survey_responses
muhasebe_gelirler / muhasebe_giderler        accounting income / expenses
lansman_basvurular          startup applications
referral_codes / referral_uses
workspace_resources / workspace_todos / workspace_meetings
geo_countries / geo_cities  geography reference
```

### 4.3 Resolution rules (how data is computed)

```
Feature for a user/item:  override (user/item) > role_features default > false
Attribute config:         role_attributes rule + per-item override (catalog_item_attribute_values)
Profile of session user:  get_current_user_profile()  → joins user_role_assignments + user_profile_attributes
```

### 4.4 Claim flow
```
submit_catalog_claim_request  → catalog_item_claims (status=pending)
admin_approve_catalog_claim   → catalog_item_managers (editor grant)
admin_reject_catalog_claim    → status=rejected
```

---

## 5. RPC catalog (verified call sites in src/)

Use RPCs for anything privileged or cross-table. Direct `supabase.from()` is for simple, RLS-safe reads.

**Auth / permission**
`is_admin()` · `is_moderator()` · `get_current_user_profile()` · `get_current_user_features()`

**Directory / public profile**
`search_directory_catalog()` · `list_public_directory_profiles()` · `get_public_independent_profile()`
`get_catalog_item_public_profile()` · `get_catalog_item_profile()` · `get_catalog_item_rules()`

**Member self-service**
`get_current_member_catalog_profile()` · `set_current_member_catalog_role()` · `get_my_editable_catalog_items()`
`update_profile_attribute()` · `update_profile_avatar()` · `submit_role_change_request()` · `submit_feature_request()`
`complete_current_profile_onboarding_activation()`

**Admin — members & roles**
`admin_search_profiles()` · `admin_set_user_role()` · `admin_set_user_profile_type()`
`admin_update_user_profile_attribute()` · `admin_set_user_feature_override(_detailed)()` · `admin_clear_user_feature_override()`
`get_role_management_bundle()` · `admin_set_role_feature_flag()` · `admin_set_attribute_rule()`
`admin_upsert_role_profile_section_rule()` · `admin_set_feature_global_state()`

**Admin — catalog**
`admin_list_unified_records()` · `admin_list_member_catalog_profiles()` · `admin_list_catalog_claims()`
`admin_approve_catalog_claim()` · `admin_reject_catalog_claim()` · `admin_grant_catalog_editor()` · `admin_revoke_catalog_editor()`
`admin_set_catalog_item_role()` · `admin_set_catalog_item_attribute()` · `admin_upsert_catalog_item_*_override()`
`admin_upsert_entity_metadata()`

**Status / ops**
`get_rebuild_status_report()` (powers `/admin/new-member/durum-raporu`)
`get_submission_documents_bucket_stats()`

---

## 6. Auth model (canonical vs shim)

```
@/components/auth/AuthProvider.tsx   mounted in App.tsx — owns Supabase session
@/components/auth/useAuth.ts         CANONICAL hook → reads auth-context.ts  ← import this in new code
@/components/auth/RequireAuth        guards admin routes (session check)
@/components/auth/RequireFeature     conditional render by feature flag (useFeatureFlags → get_current_user_features)

@/contexts/AuthContext.tsx           BACKWARD-COMPAT SHIM. useAuth delegates to canonical;
                                     re-exports canonical AuthProvider; `loading` is a correct alias for `isLoading`.
                                     ~39 files still import it and DO see real session state. Not dead code.
```
**Admin gate:** `userIsAdmin()` in `src/lib/admin.ts` → `is_admin()` RPC. `AdminLayout` uses it. There is **no** `admin_users` table.

**Migration B5 (deferred):** repoint the 39 shim imports to `@/components/auth/useAuth` (rename `loading`→`isLoading`), then delete the shim.

---

## 7. Data-fetching: pick ONE style per feature

| # | Style | Verdict |
|---|-------|---------|
| 1 | `supabase.from('t').select()` inside a component | anti-pattern; still common; don't add more |
| 2 | `src/lib/<feature>-api.ts` module | **preferred** (`muhasebe-api.ts` is the model) |
| 3 | React Query `useQuery`/`useMutation` over the api layer | **recommended**, under-used |

**New feature = style 2 + 3.** Reference module set: `muhasebe-api.ts`, `muhasebe-schemas.ts` (zod + `z.infer`),
`muhasebe-format.ts`, `muhasebe-aggregations.ts`, `pages/admin/muhasebe/routes.tsx`.

### Standard error pattern
```typescript
try {
  const { data, error } = await supabase.from('table').select();
  if (error) throw error;
  // use data
} catch (error: unknown) {
  const message = error instanceof Error ? error.message : 'Unexpected error';
  toast.error(message);
  console.error(error);
}
```

---

## 8. Recipes (decision-tree style)

**Add an admin CRUD page**
```
1. src/lib/<feature>-api.ts        (supabase calls / RPCs)
2. src/lib/<feature>-schemas.ts    (zod, export z.infer types)
3. src/pages/admin/<feature>/*.tsx (use useQuery/useMutation)
4. route: App.tsx  (or a feature routes.tsx if modularising — copy muhasebe/routes.tsx)
5. permission: gate with is_admin() RPC / RequireAuth, never an ad-hoc table check
```

**Add a public form**
```
1. src/pages/<FormPage>.tsx
2. zod schema (inline or src/lib/<form>-schemas.ts)
3. react-hook-form + @hookform/resolvers
4. submit via supabase.from('submissions').insert()  (mind RLS — test it)
5. toast on success/error (use-toast)
6. route in App.tsx (do NOT touch SEO-locked paths)
```

**Touch catalog / role / AFS data**
```
1. Use AFS table names (§4.1). If you typed an OLD name, stop.
2. Prefer the admin_* / get_catalog_* RPCs (§5) over raw table writes — they enforce rules + RLS.
3. Roles are FLAT — no family_key/parent_role_id. Don't reintroduce hierarchy.
4. After schema change: add a NEW migration; regenerate types (supabase gen types); never edit old migrations.
```

---

## 9. Immovable constraints (breaking these breaks production)

1. **SEO-locked routes** — never rename: `/`, `/founders`, `/lansman`, `/commercial/:slug`, `/cadde`,
   `/19051919`, `/anket`, `/directory`, `/iletisim`. Check git history before any route edit.
2. **Migrations** — immutable in prod; only add, never delete/reorder.
3. **`server.mjs`** — generates `/env-config.js` from runtime env vars; proxies `/api/chat` →
   `rag.corteqs.net` (via `RAG_API_SECRET`); SPA fallback. Preserve all three behaviours.
4. **`vite.config.ts`** — emits standalone `info-*.html` into `dist/commercial/<slug>/`. Preserve.
5. **`src/integrations/supabase/client.ts`** and **`types.ts`** — Lovable/auto-generated; don't hand-edit.
6. **`src/components/ui/*`** — shadcn-generated; don't hand-edit.
7. **Turkish domain terms — never rename:** `muhasebe`(accounting), `gelirler`(income), `giderler`(expenses),
   `nakit akışı`(cash flow), `lansman`(launch), `cadde`(marketplace), `kaynak`(resource), `kişi`(person),
   `oda`(chamber), `referans`(referral), `ambasador`(ambassador), `yönetici`(admin), `anket`(survey), `üye`(member), `danışman`(advisor).
8. **Marketing "interest category" strings** (`danisman`, `isletme`, `bireysel`, `dernek`, `sehir-elcisi`,
   `blogger-vlogger`) bound to the `submissions` table are a **separate** taxonomy from the AFS role system.
   They look role-like but are not — do not "consolidate" them into `roles`. (See rebuild report 13 §3.)

---

## 10. Build / deploy / env

```
Build-time (VITE_ prefix, exposed to client):
  VITE_SUPABASE_URL=https://injprdrsklkxgnaiixzh.supabase.co
  VITE_SUPABASE_ANON_KEY=...
  VITE_SUPABASE_PROJECT_ID=injprdrsklkxgnaiixzh

Runtime only (server.mjs — NEVER sent to the frontend):
  SUPABASE_SERVICE_ROLE_KEY=...
  RAG_API_SECRET=...
```
Coolify: `npm run build` → `dist/`, then `npm run start` (`node server.mjs`). Env injected at runtime via
`/env-config.js` (loaded as a `<script>` in `index.html`). Verify after deploy:
`BASE_URL=https://corteqs.net npm run verify:release`.

---

## 11. Known debt / refactor roadmap

Canonical, prioritised list: `docs/refactor/2026-06-09-refactor-backlog.md` (B1–B10).

| ID | Item | Note |
|----|------|------|
| B1 | `supabase/types.ts` drift → ~164 tsc errors | regenerate with `supabase gen types` (highest priority) |
| B2 | broken imports (`@/lib/mapEntities`, `@/lib/radarNews`, `html-to-image`) | runtime-crash risk |
| B3 | `AdminMembersPage.test.tsx` broken | fix or quarantine |
| B4 | `AdminLayout.tsx` 741 lines | split into sub-components + `useAdminAccess` hook |
| B5 | auth shim: ~39 `@/contexts/AuthContext` imports | migrate to canonical, delete shim |
| B6 | mixed data fetching | standardise on `*-api.ts` + React Query |
| B7 | ~103 `as any` | clean up after B1 |

**Already done:** App.tsx code-split (75 `lazy()`), single Supabase client, legacy auth tables dropped,
`admin.ts` split into `admin/` domain modules, **catalog/flat-role/AFS rebuild live (76 roles, 53/42/7 AFS, 239 items)**.

---

## 12. Verification checklist before claiming a change is done

```
[ ] npm run lint   passes (or unchanged)
[ ] npm run test   passes (or only pre-existing failures, named explicitly)
[ ] No OLD table names introduced (§4.1)
[ ] No reference to profiles / user_profiles / admin_users
[ ] Permission via is_admin()/is_moderator() RPC, not an ad-hoc table read
[ ] New schema change = NEW migration + regenerated types; old migrations untouched
[ ] SEO routes & Turkish terms unchanged
[ ] Data access via *-api.ts + React Query for new code
```
