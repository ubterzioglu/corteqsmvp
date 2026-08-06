# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**CorteQS Landing** is a multi-feature React + Vite application with Supabase backend. It combines a public marketing site, admin dashboard, member profiles, surveys, workspace collaboration tools, and an accounting module (muhasebe) — all in a single SPA.

**Key Metrics (ölçüldü 2026-08-04):**
- 989 `.ts`/`.tsx` files under `src` — 209 pages, 429 components, 278 lib modules
- **358 Supabase migrations** (ölçüldü 2026-08-06) — 106 in `supabase/migrations/applied/`
  + 252 in `supabase/migrations/archive/` (2026-08-04 baseline split); 7 Edge Functions
- 202 test files (`src` 190, `scripts` 9, `supabase` 3, `workers` 4) + 18 Playwright `.spec.ts`
- `src/App.tsx`: 283 lines, 51 `lazy()` imports
- TypeScript with relaxed strict mode (intentional trade-off) — 98 remaining `tsc` errors
- **Production runtime is nginx** (Dockerfile → `nginx.conf.template`), deployed via Docker (Coolify).
  `server.mjs` is the local/nixpacks path only — see the Deployment section.

> **Recent major changes:**
> 1. Catalog / flat-role / **AFS** rebuild (live 2026-06-09) — renamed 9 tables, dropped the old
>    item-type/role-family system. See `docs/catalog-role-afs-rebuild/` and the DB section below.
> 2. **Cadde 3.0 E2E rebuild (live 2026-06-11, Faz 0–9 + kuyruk TAMAM)** — social feed with CKS
>    band/score ranking, Cafe rooms, Çarşı marketplace, Tanıtım campaigns, notifications + moderation,
>    multi-diaspora. ~30 security-definer RPCs, migrations `cadde300_001–014`. **Read the Cadde rules
>    section below before touching cadde code.** Closing report: `docs/cadde-300/change-report.md`.
> 3. **Modernizasyon çalışması (2026-08-04)** — nginx güvenlik başlıkları + CSP, tek kaynaklı
>    yönlendirme tablosu (`src/lib/redirects.ts`), SEO canonical/404 düzeltmeleri, sitemap doğruluğu,
>    5 ölü sayfa silindi. **Yeni "Değişmez sözleşmeler" bölümünü okumadan bu alanlara dokunma.**
>    Plan: `docs/plans/2026-08-04-modernization-plan.md`.
>
> **Doküman düzeni (kök temizliği 2026-08-04):** kökte YALNIZ 2 `.md` kalır — `CLAUDE.md`
> (agent kuralları, Claude Code kökten okur) ve `README.md` (GitHub giriş sayfası). Diğer her
> şey `docs/` altında (`docs/README.md` indeksi):
> **`docs/ARCHITECTURE.md`** (tek ana mimari) · `docs/AGENT_CONTEXT.md` (hızlı bağlam) ·
> `docs/status/rapor.html` (durum panosu) · `docs/history/SONDURUM.md` (faz durumu — backlog
> B-10 böylece kapandı). Eski mimari dokümanlar `docs/archive/architecture/` içinde
> dondurulmuştur — güncellemeyi `docs/ARCHITECTURE.md`'ye yap.
>
> ⚠️ `docs/AGENT_CONTEXT.md` ve `docs/ARCHITECTURE.md` yollarını **iki script sabit yazar**:
> `scripts/check-drift.mjs` (preload listesi) ve `scripts/agent/drift-rules.mjs` (`docs` dizisi).
> İkisi birebir eşleşmezse `ctx.read()` boş string döner ve drift kuralı **sessizce hiç bulgu
> üretmez** — bu dosyaları taşırsan iki script de güncellenmelidir.

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
- All routes defined in `src/App.tsx` — the file is **283 lines** and **code-split via 51 `lazy()` imports** (not the monolith it once was)
- **Reference:** Muhasebe routes are modularized via `src/pages/admin/muhasebe/routes.tsx` — use this as the pattern for further extraction
- **Legacy redirects are NOT hand-written in App.tsx anymore.** They are generated from
  `src/lib/redirects.ts` (`LEGACY_REDIRECTS` 14 static + `DYNAMIC_LEGACY_REDIRECTS` 2 dynamic).
  The same list must exist in `nginx.conf.template` — see "Değişmez sözleşmeler" below.
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

`src/contexts/AuthContext.tsx` is **not** an orphan. It is a backward-compatibility shim: its `useAuth` delegates to the canonical `@/components/auth/useAuth`, and it re-exports the canonical `AuthProvider`. The `loading` field is a correct alias for `isLoading`. **21 files still import from this shim** (measured 2026-08-04) and see real session state.

**Migration (deferred, low-risk):** point those 21 imports at `@/components/auth/useAuth` (rename `loading`→`isLoading` where used), then delete the shim once imports hit 0. See `docs/refactor/2026-06-09-refactor-backlog.md` (B5).

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

### Cadde 3.0 Rules (live 2026-06-11 — full detail: `docs/ARCHITECTURE.md` §4)
- **RPC-only mutations:** cadde content tables have NO user INSERT policies. All writes go through
  security-definer RPCs (`create_cadde_post_v1`, cafe/carsi/promotion/report RPC families).
- **SQL↔TS mirror contracts** (tested; changing one side requires updating the other):
  `can_post_kopru` ↔ `src/lib/cadde-rules.ts` · `list_cadde_feed_v1` ↔ `cadde-ranking.ts` ·
  `can_join_cadde_cafe` ↔ `canJoinCafeRule` · auto-scan regex ↔ `CAFE_NAME_BLOCKLIST`.
- **`cadde_settings`** holds ALL product limits/flags (phone requirement D-03, cafe/carsi limits,
  rate limits) — product decisions are SQL updates, not code changes.
- **Ban kill-switch** lives inside `has_cadde_feature` — new write RPCs are covered automatically.
- New `cadde_*` RPC error codes MUST be added to the Turkish message map in `cadde-rules.ts`.
  RPC errors from supabase-js are **plain objects, not `Error` instances** — `resolveCaddeRpcErrorMessage`
  reads `message`/`code`/`details`/`hint`. Never narrow it back to `instanceof Error` (that bug made the
  whole map dead in production until 2026-08-05); tests must build the error as a plain object.
- **Target matching is fold-insensitive on BOTH sides (write side fixed 2026-08-05).** The read/feed
  side moved to `cadde_fold_text` on 2026-07-29; `create_cadde_post_v2` was missed and still compared
  by **exact name** (`c.name = country_name`) while the profile supplies the raw attribute
  (`get_cadde_actor_context` → `cadde_attr_text`), so `Türkiye` never matched the stored `Turkiye`.
  Migration `20260805130000_cadde_post_target_fold.sql` aligns both joins; contract test
  `src/lib/cadde-post-target-fold.test.ts` locks it. **Do not reintroduce a bare `c.name = ...` join
  on a user-supplied location name** — profile location is free text.
  Folding alone did not close the gap: the remaining values were not spelling variants but
  **different words** (`Qatar`/`Katar`, `Deutschland`/`Almanya`, `ABD`/`Amerika Birlesik Devletleri`).
  Migration `20260805140000_cadde_geo_data_repair_ab.sql` repaired the data directly (4 countries +
  4 cities added, 21 country + 3 city attribute values corrected) — deliberately **not** an
  alias/rule table. Measured live: members able to post **42 → 83 (fold) → 104 (data repair)**.
  ⚠️ **Still open, different root cause:** re-measured live 2026-08-05 over 126 profiles —
  **17 members' country and 20 members' city have no catalog row at all** (`Belirtilmedi` 14,
  `München` vs catalog `Münih`, `Böblingen`, `Düsseldorf/Grevenbroich` = two cities in one field,
  `Çankaya` = an Ankara district, …). These members are **not broken today**: the blind-viewer
  safety valve shows every post to the 44 members whose location cannot be resolved.
  ⚠️ **The "profile form is still free text" diagnosis was WRONG — do not repeat it.** Re-measured
  2026-08-05 evening: the form already uses select components (`ProfilePage.tsx:1610`,
  `SearchableCountrySelect` / `SearchableCitySelect`). The actual root cause is **two disjoint
  catalogs**: the form is fed from `geo_countries` (251) / `geo_cities` (76,990) via `useGeo`,
  while Cadde matches against `cadde_countries` (22) / `cadde_cities` (54). A member picks a
  perfectly valid city (`München`) that the Cadde catalog does not know (`Münih`). Converting the
  form to a select therefore fixes nothing — it already is one; **the two lists must be
  reconciled.** Bridge columns already exist and are partly filled: `cadde_countries.geo_country_id`
  18/22, `cadde_cities.geo_city_id` 49/54 (the 9 empty ones are exactly the rows hand-inserted by
  `20260805140000`). Distinct-value measurement: 60 of 68 city values and 26 of 29 country values
  resolve. The unresolved mass is **not** catalog coverage — `Belirtilmedi` (14 country + 13 city)
  is legacy **WhatsApp-bot registration** data (`register` / `WhatsApp Bot` / `@wa.local` rows in
  the archived dumps); no current code writes it. Genuine catalog gaps affect **4 members**
  (`München`, `Böblingen`, `Çankaya`, `Düsseldorf/Grevenbroich`) and junk values 4 more.
  **Do not derive country from the phone dialling code** — systematically misleading here (a `+90`
  member may well live in Berlin). Tracked in `admin-todos.ts`
  (`20260805-cadde-profil-konum-serbest-metin`).
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
| `src/App.tsx` | Master route table (283 lines, 51 `lazy()` code-split) |
| `src/main.tsx` | Hydrate/Render switch (future SSR entry) |
| `src/components/auth/AuthProvider.tsx` | Supabase session + context root |
| `src/lib/muhasebe-*.ts` | Reference architecture (apis, schemas, aggregations) |
| `src/lib/admin.ts` + `src/lib/admin/*.ts` | `admin.ts` is a 57-line barrel; real impl in `admin/` (7 domain APIs) — pattern for new admin APIs |
| `src/integrations/supabase/client.ts` | Lovable-generated, risky to modify |
| `vite.config.ts` | Legacy `*.html` redirect stubs for commercial docs (SPA renders the content) |
| **`nginx.conf.template`** | **THE production runtime config.** Security headers + CSP, all 301 redirects, `/api/chat` rate limit, prerender routing. SEO/header/redirect behavior belongs HERE, not in `server.mjs`. |
| **`src/lib/redirects.ts`** | Single source for legacy redirects; App.tsx generates routes from it, `nginx.conf.template` must mirror it (`src/lib/redirects.test.ts` enforces) |
| `public/analytics.js` | gtag config + Clarity loader, moved out of `index.html` so CSP needs no `'unsafe-inline'` |
| `server.mjs` | **NOT the production runtime.** Local `npm run start` + nixpacks path only; env injection via `/env-config.js`, `/api/chat` proxy. Keep its `legacyRedirectMap` aligned with `src/lib/redirects.ts`. |
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

## Türkçe Metin Kuralları (ZORUNLU — 2026-06-12)

JS'in varsayılan `toUpperCase()/toLowerCase()` dönüşümleri Türkçe'de yanlıştır
(`"İstanbul".toLowerCase() === "i̇stanbul"` — sade "istanbul" ile eşleşmez; `i → I` olur, `İ` olmaz).
Tekrarlayan Türkçe karakter sorunlarının kök nedeni budur. Kurallar:

1. **Kullanıcıya görünen Türkçe metinlerde** `src/lib/text-normalization.ts` yardımcılarını kullan:
   - Arama/filtre eşleşmesi → `trIncludes(haystack, query)` (aksan-toleranslı: "uskudar" → "Üsküdar" bulur)
   - Görüntüleme amaçlı case → `trUpper(...)` / `trLower(...)` (avatar baş harfleri dahil)
   - Sıralama → `trCompare(a, b)` veya `localeCompare(b, "tr")`
   - Bare `toUpperCase()/toLowerCase()` SADECE teknik değerlerde doğrudur:
     para/ülke kodu, dosya uzantısı, hex, referans kodu, `event.key`, İngilizce hata mesajı.
2. **CSV export** Blob'larının başına UTF-8 BOM (`"﻿"`) ekle — yoksa Excel Türkçe karakterleri bozar.
3. **`npm run verify:text`** tüm kaynak dosyaların UTF-8 + mojibake denetimini yapar; `predev/prebuild/prelint/pretest` otomatik koşar. Yeni içerik dizini eklersen scriptin `includeDirs` listesine ekle.
4. **psql/Windows tuzağı:** PowerShell komut satırından psql'e geçen Türkçe karakterler bozulur (ı→i).
   Türkçe içerikli SQL'i daima UTF-8 dosya olarak `psql -f` ile gönder veya `U&'...\0131...'` unicode escape kullan.
5. `<html lang="tr">` (index.html) korunmalı — CSS `text-transform: uppercase` Türkçe i/İ kuralını bu nitelikten alır.

## Değişmez sözleşmeler (ZORUNLU — 2026-08-04)

Bu beş kural 2026-08-04 modernizasyon çalışmasında ölçülerek konuldu. Her biri sessizce
bozulabilen (test/build patlamayan ama canlıda zarar veren) bir sınıfı kapatır.

1. **Yönlendirme eklemek üç dosyayı birlikte değiştirir.** Yeni bir legacy 301 eklerken
   `src/lib/redirects.ts` (tek kaynak) + `nginx.conf.template` (`location = ... return 301
   ...$is_args$args`) + `src/App.tsx` (client-side fallback, tablodan üretilir) üçü de
   güncellenmelidir. `src/lib/redirects.test.ts` bu üçlü arasındaki drift'i yakalar —
   testi susturma, dosyayı düzelt. Yönlendirmenin doğru yeri **nginx**'tir; `server.mjs`
   prod'da çalışmaz.

2. **nginx'te `add_header` KALITILMAZ.** Kendi `add_header`'ı olan bir `location`, üst
   bloktaki TÜM `add_header`'ları iptal eder. Bu yüzden `nginx.conf.template` içinde güvenlik
   başlıkları 5 location'da (`= /env-config.js`, `= /index.html`, `= /api/chat`, `/assets/`,
   `= /__prerender_internal`) + server bloğunda **tekrarlanır**. Yeni bir `add_header` içeren
   location eklersen güvenlik başlıklarını oraya da kopyala — yoksa CSP ve clickjacking
   koruması o yolda sessizce düşer. (Bu tam olarak yaşandı: `/robots.txt`'te 8 başlık vardı,
   `/` adresinde 0.)

3. **CSP `script-src`'ine `'unsafe-inline'` eklenmez.** CSP tek kaynaktan gelir
   (`map $host $corteqs_csp`). Yeni bir analitik/inline script gerekiyorsa ya
   `public/analytics.js` dosyasına ekle (index.html'deki gtag + Clarity yükleyicisi oraya
   taşındı, `defer` ile yükleniyor) ya da yeni host'u CSP allowlist'ine yaz. Değişken adı
   `$corteqs_csp` bilinçli olarak dar seçildi: nginx imajının
   `20-envsubst-on-templates.sh` scripti template'i envsubst'tan geçirir, genel adlar çakışır.

4. **Sitemap'e rota eklemeden önce 3 kriteri de doğrula** (`scripts/generate-sitemap.mjs`
   `STATIC_ROUTES`): (a) gerçekten public mi — `RequireAuth` / `RequireFeature` arkasında
   OLMAMALI, (b) sayfa `useSeo` + `canonicalPath` tanımlıyor mu, (c) thin content değil mi.
   Üçünden biri tutmuyorsa ekleme. `scripts/generate-sitemap.test.mjs` `App.tsx`'i parse
   ederek auth arkasındaki rotaları ve redirect kaynaklarını yakalar.

5. **PostgREST 1000 satırda sessizce keser.** Hata dönmez, eksik veri döner. Toplu veri
   çeken her sorgu `Range` başlıklı sayfalama kullanmalıdır — `scripts/generate-sitemap.mjs`
   içindeki `fetchAllRows()` deseni referanstır. Ayrıca filtre mantığını çoğaltıyorsan
   (ör. anket `starts_at`/`ends_at` penceresi) kaynak modülle (`src/lib/surveys.ts`) birebir
   aynı olmalı — yarım kopyalanan filtre sitemap'e süresi dolmuş kayıt sızdırır.

6. **nginx'te `server_name _` JOKER DEĞİLDİR — catch-all blok `default_server` olmalı.**
   Apache'nin aksine `_` hiçbir Host ile eşleşmez; eşleşme yoksa nginx o portun
   `default_server`'ını seçer, işaretlenmemişse "dosyadaki ilk blok"u. `nginx.conf.template`'e
   yeni bir `server` bloğu eklerken **sıra anlam taşır**: 2026-08-04'te www/mvp→apex 301 bloğu
   `_` bloğundan önce eklenince apex ona düştü ve kendine 301 atarak siteyi tamamen düşürdü
   (ERR_TOO_MANY_REDIRECTS). Yönlendirme dönen bir blok asla default olamaz.
   `src/lib/redirects.test.ts` bunu kilitler — ama test yalnız METNİ denetler, çalışan
   nginx'i değil. Blok yapısını değiştirdiysen deploy sonrası `curl -I` ile doğrula.

## Important Constraints & Immovable Parts

1. **SEO-locked URLs** (recent commits all "seo" related):
   - `/lansman`, `/cadre`, `/founders`, `/commercial/<slug>`, `/cadde` (+ sub-routes `/cadde/cafe/:cafeId`, `/cadde/carsi[/:itemId]`), `/19051919`, `/anket`
   - Never change route paths without checking git history

2. **Supabase Migrations** cannot be deleted or reordered in production. Only add new migrations.
   They live in `supabase/migrations/applied/` (100) + `supabase/migrations/archive/` (252,
   pre-baseline — **never delete**); the parent `supabase/migrations/`
   directory itself holds 0 `.sql` files.

3. **Production runtime is nginx — NOT `server.mjs`** (corrected 2026-08-04; the old claim here
   was a P0 misdirection that sent header/redirect fixes to a file that never runs in prod):
   - `Dockerfile` → `FROM nginx:1.27-alpine`, copies `nginx.conf.template` to
     `/etc/nginx/templates/default.conf.template`. Live proof: `Server: nginx/1.27.5`.
   - **Anything about response headers, CSP, 301 redirects, caching or robots behavior must be
     written into `nginx.conf.template`.** Editing `server.mjs` for these has no production effect.
   - `server.mjs` still matters for the local `npm run start` and the nixpacks path:
     generates `/env-config.js` from env vars at startup, proxies `/api/chat` to
     `rag.corteqs.net`, serves the SPA with fallback — keep this behavior, but keep its
     `legacyRedirectMap` (15 entries) aligned with `src/lib/redirects.ts`.

4. **Commercial documents** (changed 2026-06-11 — now SPA routes):
   - `/commercial/<slug>` is rendered by `CommercialDocumentPage` from fragments in
     `src/content/commercial/*.html`. The old standalone-HTML injection plugin was
     removed; `vite.config.ts` only emits legacy `*.html` redirect stubs.
   - `src/content/commercial/*.html` fragments are now the **single content source** —
     edit them directly. The old root `info-*.html` files and the
     `scripts/extract-commercial-docs.mjs` extract step were removed (2026-07-13); there is
     no longer an intermediate generation step. Shared hero image:
     `public/commercial-docs/corteqs-doc-hero.png`.

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
- **202 test files total** (`src` 190, `scripts` 9, `supabase` 3, `workers` 4)
- **E2E:** Playwright configured but underutilized (18 `.spec.ts`)
- **Setup:** `src/test/setup.ts` (jest-dom matchers)
- **Coverage target:** 80%+ for new code

### Good Test Examples
- `src/lib/muhasebe-*.test.ts` — integration tests with aggregations
- `src/lib/lansman.test.ts` — domain logic testing
- `src/components/AdminLansmanTable.test.tsx` — component testing

### Contract tests — do not delete, do not "fix" by loosening (added 2026-08-04)
These four guard the silent-failure classes listed in "Değişmez sözleşmeler". They assert on
config **text** and route tables, so they fail loudly when someone edits one side of a pair.
- `src/lib/redirects.test.ts` (10 tests) — locks `src/lib/redirects.ts` ↔ `nginx.conf.template`
  redirect drift, the CSP repetition count across locations, the absence of `'unsafe-inline'`,
  and that the blanket `X-Robots-Tag` header never comes back.
- `src/lib/seo.test.ts` (17 tests) — first tests for the SEO helper: canonical must use
  `SEO_CANONICAL_ORIGIN` + `pathname` only, so query strings/hashes and `www.`/`mvp.`/`localhost`
  hosts can never leak into `<link rel="canonical">`.
- `src/App.notfound-seo.test.tsx` (4 tests) — 404 shell writes `robots: "noindex, follow"`,
  stopping soft-404 pages from being indexed.
- `scripts/generate-sitemap.test.mjs` (9 tests) — parses `App.tsx` to prove no `STATIC_ROUTES`
  entry sits behind `RequireAuth`/`RequireFeature` or is a redirect source.

## Database & Migrations

- **358 migrations total, split by a baseline on 2026-08-04** (date-prefixed, immutable in prod).
  Note the subdirectories — the parent `supabase/migrations/` contains 0 `.sql` files, so a glob
  on the parent silently finds nothing.

| Path | Count | Meaning |
|------|-------|---------|
| `supabase/migrations/applied/` | 106 | Post-baseline (≥ `20260615100000`) — the working set |
| `supabase/migrations/archive/` | 252 | Pre-baseline, **applied in production, never delete** |
| `supabase/baseline/2026-08-04-public-schema.sql` | 1 | `pg_dump --schema-only` of the live `public` schema (237 tables, 481 RLS policies, 1568 grants, 342 indexes, 115 triggers, 5 views) |

**Rebuilding from zero = baseline + `applied/` in order.** That is why `archive/` is archived and
not deleted: it is the only record of *why* the schema looks like it does (RLS has been reset
several times here), and the only fallback if the baseline dump ever turns out incomplete.

### Checking for unapplied migrations — do not do it by hand
```bash
npm run check:migrations        # drift → exit 1
npm run check:migrations:warn   # reports, exit 0
```
Compares `applied/` + `archive/` against the live `supabase_migrations.schema_migrations`
(psql over the session pooler; needs `SUPABASE_DB_PASSWORD` in `.env.local`). If it cannot
connect it exits **2** and says so — a failed check is never reported as "clean".

⚠️ **Bir migration dosyası `supabase/migrations/` parent dizininde BIRAKILMAZ.** Dosyalar
`applied/` (veya `archive/`) altında yaşar; parent dizin sürüm karşılaştırmasına **dahil
değildir** (`MIGRATION_DIRS`). Akış: yaz → uygula → `applied/` altına **taşı**.
2026-08-05'te `20260805200000_cadde_geo_bridge_backfill.sql` parent'ta kaldı, canlıda
kaydı yoktu ve `check:migrations` yine de **"sapma yok"** dedi — dosyayı hiç görmemişti.
Kontrol artık bunu ayrı bir sinyal olarak yakalar (`findStrayParentMigrations`, strict
modda exit 1) ve bu tarama DB bağlantısından **önce** çalışır, böylece "bağlanamadım"
hatasının arkasında kaybolmaz. Testi: `scripts/check-migrations.test.mjs` — gevşetme.

⚠️ **Two timestamps carry two files each** — this is real, not a bug:
`20260718120000` (`brainstorming_tables` + `revision_requests_mvp_seed`) and `20260718130000`
(`remove_world_cup_campaign` + `statusreport_comments_admin_only`). `schema_migrations.version`
is unique, so the second of each pair is recorded as `...0001` in production. The checker models
this (`expectedVersionsFor`); a naive filename↔DB diff reports 4 false positives. **When adding a
migration, do not reuse a timestamp that already exists** — pick a different second.

⚠️ A table or column existing in production does **not** prove a `schema_migrations` row exists —
this repo has hit that gap twice (2026-07-18, 2026-07-20). Check the real schema before applying.

### ⚠️ The production instance has under 1 GB of RAM — a single bad query takes the site down

Measured 2026-08-05 (`/customer/v1/privileged/metrics`): **904 MB total RAM, ~46% used at idle**,
disk 7.78 GB with only 5.7% used. This is Supabase's smallest compute tier. **Memory is the
binding constraint, not disk.**

On 2026-08-05 this was not theoretical. An ad-hoc measurement query — a nested `EXISTS` calling
`cadde_fold_text()` against `geo_cities` (**76,990 rows**) once per profile row — was run from a
session. Minutes later Postgres died: `db`, `rest` and `auth` all went `UNHEALTHY`, the API
returned Cloudflare **521**, and because a 521 page carries no CORS headers the browser reported
it as a *CORS error* — which sends you hunting in nginx for a problem that is not there.
`pg_postmaster_start_time()` confirmed the process restarted from scratch. The whole site was
down for roughly 50 minutes.

Rules that follow from this:
1. **Never run an exploratory query that applies a function per row over a large table.** Fold /
   normalize on the **distinct value set** first (`select distinct value …` is ~150 rows here,
   not 126 × 76,990), then join.
2. `geo_cities` (76,990) and `geo_countries` (251) are the big ones; `cadde_cities` (54) and
   `cadde_countries` (22) are safe. Know which one you are touching.
3. **A psql client timeout does not cancel the server-side query.** Killing your terminal leaves
   the query running and the pooler connection checked out — the follow-on symptom is
   `ECHECKOUTTIMEOUT` on every later connection.
4. Diagnose project-level outages through the **control plane**, which stays up when the project
   is down: `GET https://api.supabase.com/v1/projects/<ref>/health?services=db,rest,auth,pooler`
   with `SUPABASE_ACCESS_TOKEN`. It distinguishes "project paused / billing" from
   "instance unhealthy" in one call.

- **RLS active** — submissions require specific conditions
- **Edge Functions (7):** `find-matches`, `lansman-admin`, `radar-news-scan`,
  `relocation-notifications`, `send-notification-emails`, `send-submission-email`,
  `submit-survey-response`. (There is no `chat-register` function — that name was stale.)

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

# Runtime only (server.mjs / nixpacks path)
SUPABASE_SERVICE_ROLE_KEY=...  (never expose to frontend)
RAG_API_SECRET=...             (server-side proxy secret)
```

### Coolify Deployment — nginx is the runtime
- **`Dockerfile` path (production):** `npm run build` → `dist/`, then `FROM nginx:1.27-alpine`
  serves it. `nginx.conf.template` is copied to `/etc/nginx/templates/default.conf.template`
  and passed through the image's `20-envsubst-on-templates.sh` (so template variable names
  must not collide with env vars — hence `$corteqs_csp`).
- **`server.mjs` does not run in this path.** Header, CSP, 301 and cache behavior all come from
  `nginx.conf.template`. If a header/redirect fix "doesn't work in prod", check that you edited
  the nginx template and not `server.mjs`.
- **`nixpacks.toml` path (local/fallback):** serves with `npm run start` (node server.mjs).
- Env injection via `/env-config.js` (loaded in `index.html` as `<script>`)

**Verify release after deploy:**
```bash
BASE_URL=https://corteqs.net npm run verify:release
```

**Deploy sonrası ZORUNLU kontrol (2026-08-04):** CSP ve güvenlik başlıkları konteynerde
doğrulanamadı (docker daemon kapalıydı) — `src/lib/redirects.test.ts` yalnızca template
metnini denetler, çalışan nginx'in davranışını kanıtlamaz. Deploy sonrası tarayıcı
konsolunda **CSP ihlali olup olmadığına bak** ve `curl -I https://corteqs.net/` ile
güvenlik başlıklarının `/` adresinde de geldiğini doğrula.

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

Root holds exactly **2** `.md` files after the 2026-08-04 cleanup: `CLAUDE.md` (agent rules —
Claude Code loads it from the root) and `README.md` (GitHub landing page). Backlog B-10 is closed:
`SONDURUM.md` moved to `docs/history/`. Everything else lives in `docs/` (index: `docs/README.md`):
- `docs/ARCHITECTURE.md` — the single maintained architecture document
- `docs/AGENT_CONTEXT.md` — fast project context for a new session
- `docs/status/` — `rapor.html` (status board) + `burakubtstatus.html`
- `docs/cadde-300/` — Cadde 3.0 spec, devir notu, faz dokümanları, change-report
- `docs/archive/` — frozen content: old architecture docs, root cleanup archive, DB backups, QA artifacts
- `docs/modules/` — feature-specific documentation (Turkish domain names)
- `docs/guides/` — user/admin guides
- `docs/operations/` — deployment, database, security runbooks
- `docs/history/` — archived plans, cleanup reports, `SONDURUM.md`
- `docs/exports/blog-md/` — generated blog markdown (default output of `scripts/export-blog-md.mjs`)

**Do not add new files to the repo root.** Only build/tooling config, `CLAUDE.md` and `README.md`
belong there; documentation goes under `docs/`.

**Before major changes, check docs for context and constraints.**

## Known Limitations & Refactor Opportunities

> Consolidated, prioritized roadmap: `docs/refactor/2026-06-09-refactor-backlog.md` (items B1–B10).
> **Re-measured 2026-08-04** — several items below were already closed and are kept here only so
> nobody re-opens them from stale notes.

**CLOSED (do not re-open):**
- ~~B1 `supabase/types.ts` out of sync → ~164 tsc errors~~ → **RESOLVED.** `types.ts` is current
  (`cadde_posts`, `revision_request*` are defined). The 98 remaining `tsc` errors are a completely
  different class — see item 5 below.
- ~~B3 `AdminMembersPage.test.tsx` broken~~ → **OBSOLETE.** That file no longer exists.
- ~~B4 `AdminLayout.tsx` 741 lines, must be split~~ → **RESOLVED.**
  `src/components/admin/AdminLayout.tsx` is now a 6-line barrel.

**Open:**
1. **Broken imports (B2) — partially fixed, claim was partly wrong.** `@/lib/radarNews` was never
   the real name: the module is `src/lib/radarNewsPipeline.ts` and it **exists**. The
   `@/lib/mapEntities` and `html-to-image` problems were real, and the 5 dead pages that caused
   them were deleted 2026-08-04 (`MapSearch`, `PostGenerator`, `CityNews`, `WhatsAppGroupLanding`,
   `WhatsAppGroups` — all had zero importers and no route).
2. **Auth shim migration (B5)** → **21** imports of `@/contexts/AuthContext`; migrate to canonical,
   then delete shim.
3. **Mixed data fetching (B6)** → 83 `supabase.from(` + 42 `supabase.rpc(` calls still sit inside
   components; standardize on `*-api.ts` + React Query.
4. **TypeScript loose (B7)** → **89** `as any` to clean up (not ~103).
5. **98 remaining `tsc -p tsconfig.app.json --noEmit` errors** (down from 103). Not a types.ts
   problem: variant/accent prop types, `ProfilePage` boolean assignments, and a reference to a
   `role_taxonomy_rules` table that does not exist.
6. **ESLint debt** → `npm run lint` reports **1280 problems (1060 error, 220 warning)**, mostly
   `no-explicit-any`. Pre-existing; a cleanup item of its own.
7. **Test coverage spotty** → activate Playwright for critical flows.
8. **Large files** → 112 files exceed 300 lines (`ProfilePage.tsx` 2511, `CommandCenterManager.tsx`
   1987, `AddWhatsAppPage.tsx` 1611).
9. **Repo weight** → ~78 MB of video in `public/` ships into the Docker image
   (`footer-community.mp4` 48 MB, `hero-people.mp4` 11 MB, `hero-network.mp4` 7.9 MB, …) plus
   duplicate images (`sweet.png`/`sweet.jpg`, `last.png`/`newbg.png`, `og-image.png`/`og-image-new.jpg`).
10. **`public/burak-stripe-rehberi.html` is publicly served** at
    `https://corteqs.net/burak-stripe-rehberi.html` and tracked in git; `robots.txt` only blocks
    `/admin`. Decide whether this is intended.

**Deferred by user decision (report only, do not change):** `index.html` JSON-LD scope (12-question
FAQPage, `Offer` 99 EUR, hardcoded `dateModified 2026-07-06`, `BreadcrumbList` inherited by every
route); unverifiable claims ("164 ülkede 8,8 milyon", foundingDate/foundingLocation, founder `Person`
records); invalid `SearchAction`, loose `SpeakableSpecification`, `meta keywords`; real HTTP 404
(needs server-side route knowledge); AI-crawler policy in `robots.txt` (GPTBot, CCBot,
Google-Extended, Bytespider currently allowed); `Suspense fallback={null}` blank-screen/LCP effect;
bundle work (recharts, d3-geo, framer-motion usage map, no `manualChunks`).

**Already done:** App.tsx modularized (51 `lazy()`), single Supabase client, legacy auth tables
dropped (single system), `admin.ts` split into `admin/` domain modules, `types.ts` regenerated,
`AdminLayout` reduced to a barrel, 0 `console.log` under `src`, nginx security headers + CSP,
single-source redirect table.

## Additional Resources

- README.md — deployment, env setup, Edge Function secrets
- docs/ARCHITECTURE.md — the single maintained architecture document (Turkish)
- docs/archive/architecture/ — frozen historical architecture docs
- docs/cleanup/2026-05-30/ — recent cleanup audit results
- vite.config.ts comments — explains custom plugin behavior
- src/test/setup.ts — test environment config

