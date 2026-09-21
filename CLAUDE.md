# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**CorteQS Landing** is a multi-feature React + Vite application with Supabase backend. It combines a public marketing site, admin dashboard, member profiles, surveys, workspace collaboration tools, and an accounting module (muhasebe) — all in a single SPA.

**Key Metrics (ölçüldü 2026-09-19 gece):**
- **1.098** `.ts`/`.tsx` files under `src` (2026-09-06 ölü kod temizliğiyle 1.092 → 950'ye
  inmişti; 13 Eylül gecesi iki dalgalık büyük dosya ayrıştırmasıyla 1.091'e **çıktı** — bu
  bilinçlidir, 11 dev dosya ~140 küçük modüle bölündü, bkz. Known Limitations md.7)
- **397 Supabase migrations** — 145 in `supabase/migrations/applied/`
  + 252 in `supabase/migrations/archive/` (2026-08-04 baseline split; ölçüldü 2026-09-19);
  **11** Edge Functions (`relocation-assistant` 2026-09-20, `site-assistant` 2026-09-21;
  "9" rakamı iki turdur bayattı — aşağıdaki listeye bak, ezberleme)
- **279 dosya / 1.981 test** yeşil (`npm run test`, ölçüldü 2026-09-19 gece) — 245, 271, 276 ve
  278 taban rakamları bayattı; birkaç oturumdur `*-api.ts` göçleriyle yeni test dosyaları ekleniyor
- `npm run lint` → **0 problem** (eski "1280 problem" notu bayattı)
- `src/App.tsx`: 313 lines, 51 `lazy()` imports
- TypeScript with relaxed strict mode (intentional trade-off) — **`tsc` hatası SIFIRA indi**
  (109 → 22 → 16 → 12 → 9 → **0**, 2026-09-13; 19 Eylül gecesi 3 hataya çıkıp yeniden **0**'a
  indirildi). "Known Limitations" md.5 artık KAPALI — eski sınıf tablosunu ezberleme, aşağıdaki
  not güncel. ⚠️ `tsc` ne `prelint`te ne `pretest`te koşar; dosya ekleyen her oturum
  `npx tsc -p tsconfig.app.json --noEmit` komutunu ELLE çalıştırmalıdır.
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
- All routes defined in `src/App.tsx` — the file is **313 lines** and **code-split via 51 `lazy()` imports** (not the monolith it once was)
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

**Tek auth sistemi — shim 2026-09-06'da KALDIRILDI (B5 kapandı)**

Auth için **tek yol** vardır: `src/components/auth/`.
- `AuthProvider` App.tsx'te mount edilir; `useAuth` → `@/components/auth/useAuth`
  → `@/components/auth/auth-context`.
- Sözleşme yüzeyi: `session · user · isLoading · profile · accountType ·
  onboardingCompleted · signOut · refreshProfile`.
- **`loading` diye bir alan YOKTUR** — `isLoading` kullan.

~~`src/contexts/AuthContext.tsx`~~ backward-compat shim'i **silindi**; onu import eden
16 dosya kanonik yola geçirildi. Göç risksiz çıktı çünkü shim'in kattığı tek şey
`loading` alias'ıydı ve ölçüldüğünde **hiçbir dosya onu kullanmıyordu** (hepsi yalnız
`{ user }`, biri ayrıca `refreshProfile` alıyordu).

⚠️ **Test yazarken:** `vi.mock` yolu bileşenin GERÇEKTEN import ettiği yol olmalı —
`@/components/auth/useAuth`. Yanlış yolu mock'lamak sessizce hiçbir şeyi değiştirmez
ve test gerçek provider'ı arayıp `"useAuth must be used within AuthProvider"` ile
patlar. (`MessagesInbox.test.tsx` tam olarak bu yüzden güncellendi.)

The canonical `useAuth` lives in `src/components/auth/useAuth.ts` → reads from `src/components/auth/auth-context.ts`. For new code, always import from here.

**Role / permission system (single system — legacy dropped 2026-06-09):**
- **Admin check:** `userIsAdmin()` in `src/lib/admin.ts` calls the `is_admin()` RPC. The `public.admin_users` table was **DROPPED** (migration `20260609003000`). `AdminLayout` gates the admin section via this check.
- **Canonical tables:** `user_role_assignments` + `user_profile_attributes` (+ `is_admin()`/`is_moderator()` RPCs). The old `profiles` / `user_profiles` / `admin_users` / `role_feature_defaults` tables no longer exist.
- **Feature flags:** `RequireFeature` / `useFeatureFlags` resolve via `get_current_user_features()` (`role_feature_flags` + `user_feature_overrides`).
- `RequireAuth` guards admin routes (checks canonical session).
- **Do not reference `profiles` / `user_profiles` / `admin_users`** — use `user_role_assignments` + `user_profile_attributes` and the `is_admin()`/`is_moderator()` RPCs.

### Profil formu kuralları (Profil Workshop WS1 — canlı 2026-09-05)

Kaynak: 3 Eylül 2026 "Profiller" toplantısı (T19). Pano: `/admin/workshop/profil`.
Migration: `20260904200000_profil_ws1_form_alanlari.sql`.

1. **Bir alanın profil formunda görünmesi `role_attributes` kuralına bağlıdır.**
   `get_current_user_profile` yalnız o rol için `is_enabled` kuralı OLAN alanları döner.
   `phone` attribute'u aylardır tanımlıydı ve 116 üyede değer vardı ama **hiçbir rolde
   kuralı yoktu** → alan hiç çizilmiyordu. Yeni alan eklerken migration'da tüm aktif
   rollere kural ekle (ölçüm: 78 aktif rol), yoksa kod canlıda sessizce görünmez.
2. **`user_can_hide=false` bir alanı "her zaman public" yapar, "her zaman private" YAPMAZ.**
   `update_profile_attribute`, `user_can_hide=false` iken `'public'` dışı görünürlüğü
   `42501` ile reddeder. Telefon bu yüzden `user_can_hide=true` + her yazımda açık
   `'private'` ile kaydedilir; gizlilik garantisi `afs_attributes.storage_strategy =
   'private_storage'`tan gelir (public sayfa RPC'si bu stratejiyi baştan eler).
3. **Ülke telefon alan kodundan TÜRETİLMEZ** (+90 numaralı üye Berlin'de yaşıyor olabilir).
   `src/lib/phone-country-derivation.test.ts` `src/` ağacını tarar: `countryFromPhone`,
   `dialCode`, `callingCode`, `libphonenumber` girerse test düşer. `src/lib/profile-phone.ts`
   yalnız E.164 biçim doğrular, ülke üretmez.
4. **İlgi alanları (`interests`) herkese açıktır ve gizlenemez** (T19 kararı) — 82 rolde
   `user_can_hide=false`. `CaddeInterestsCard` bu durumda anahtar yerine rozet çizer.
5. **"Bizi nereden buldunuz?" (`referral_source`) kayıt akışından kaldırıldı.** Attribute
   canlıda `is_active=false`; veri SİLİNMEDİ (112 üyede geçmiş değer, admin başvuru
   detayında görünür). `REFERRAL_SOURCE_OPTIONS` etiket sözlüğü olarak DURUR — geçmiş
   satırları göstermek için gerekir, silme.

### Dizin araması ANONİME AÇIKTIR (canlı 2026-09-21)

Migration: `applied/20260921090000_directory_search_anon_normalized.sql`.
Plan: `docs/plans/2026-09-20-dizin-arama-plani.md`.

1. **`search_directory_catalog` artık giriş istemez.** Gövdedeki
   `raise exception 'authentication required' ... 42501` KALDIRILDI. `anon`'un
   EXECUTE grant'i zaten vardı — "grant ekle" diye bir iş yok, engel gövdedeydi.
   `DirectoryPage` ziyaretçi için de sorgu atar; `DiasporaSearchBar` ve
   `DiasporaSearchSection` artık `/login?next=`'e YÖNLENDİRMEZ. Üçü aynı
   sözleşmededir — birini değiştirirsen üçünü birden değiştir.
2. **Fonksiyon 7 argümanlıdır** (`p_limit`, `p_offset` eklendi) ve 5 argümanlı
   sürüm DROP edildi. İkisini birden bırakma: PostgREST aşırı yükleme arasında
   karar veremez. Sayfa tavanı **100**; `DIRECTORY_MAX_PAGE_SIZE`
   (`src/lib/catalog-directory.ts`) bu sayıyla BİREBİR aynı olmalıdır ve
   `catalog-directory.test.ts` bunu kilitler.
3. **Sayaç ayrı sorgu DEĞİLDİR.** `total_count` pencere fonksiyonuyla sonuç
   kümesinden döner; `getTotalDirectoryCount()` aynı RPC'yi `p_limit=1` ile
   çağırır. Ayrı bir `catalog_items` sayımı yazma — tam olarak o ayrışma ana
   sayfada "645+ kayıt" yazarken dizinde 237 kayıt gösterilmesine yol açtı.
4. **B20 yönetici elemesi artık HER İKİ dalda SQL'de.** Eskiden yalnız Branch 2
   (bireysel profil) vardı; Branch 1'de `Admin_ContentModerator` rolüyle bir
   kayıt `is_directory_visible=true` kaldığı için SQL filtresinden GEÇİYORDU ve
   onu gizleyen tek şey TS'teki `isPublicDirectoryRole` guard'ıydı. RPC anonime
   açıldığı için bu artık kabul edilemezdi. TS guard'ı ikinci savunma olarak
   DURUR — silme.
5. ⚠️ **`catalog_search_documents.search_text` aramada KULLANILMAZ.** O blob
   `catalog_item_contacts.contact_value` (is_public) değerlerini içerir (canlıda
   336 açık iletişim kaydı); anonime açık aramada taranması e-posta/telefon
   doğrulama (enumeration) yüzeyi açar. Aranan metin RPC içinde AÇIKÇA kurulur;
   csd'den yalnız PII'siz türetilmiş kolonlar alınır (`city`, `country_code`,
   `category_slugs`). `search_catalog` ve `catalog_rebuild_search_document`
   DEĞİŞMEDİ.
6. **Eşleşme ELEMEZ, SIRALAR.** `catalog_search_normalize()` (= `lower(unaccent(...))`)
   ile hem sorgu hem belge katlanır; `match_rank` 0=tam başlık, 1=başlık öneki,
   2=tüm kelimeler, 3=kısmi. Eski katı AND + ham `ilike` davranışı
   `"Berlin'de doktor"` aramasını GARANTİLİ sıfırlıyordu (ölçüm: 0 → 11).
   Kelime eşleşmesi `position(w in haystack)` ile yapılır, `like '%'||w||'%'`
   ile DEĞİL — aksi hâlde kullanıcının yazdığı `%` tüm dizini döker.
7. **Verisiz çip ekleme.** "İş İlanları" çipi kaldırıldı: `job_posting_details`
   0 satır, `item_type='job_posting'` 0 kayıt. Boş dönen bir çip kullanıcıya
   sistemin bozuk olduğunu öğretir. Yeni çip eklerken ÖNCE sonucu canlıda ölç.

### İstemci hata kayıtları (m134 tanısı — canlı 2026-09-05)

`public.client_error_reports` + `report_client_error` RPC (mig `20260904210000`).
Tarayıcıda yakalanan hata artık yalnız `console.error`'a değil, DB'ye de yazılır;
`/admin/client-errors` ekranından okunur (RLS: yalnız admin SELECT).

- **Tek giriş noktası `src/lib/client-error-reports.ts`.** Doğrudan RPC çağırma.
  Bağlı yerler: `caddeWriteError` / `caddeReadError` (`cadde-internal.ts`),
  `AppErrorBoundary`, `SectionErrorBoundary`.
- **Payload ASLA gönderilmez** — yalnız hata nesnesinin `message/code/details/hint`'i,
  rota (yalnız `pathname`) ve user-agent. Yorum metni, medya, kişisel veri gitmez.
- Fren: aynı (kaynak, bağlam, mesaj) 60 sn içinde tekrar gönderilmez, sayfa yaşamı
  boyunca 20 kayıt tavanı, RPC tarafında kullanıcı başına saatte 30. 90 gün saklanır.
- `reportClientError` **asla fırlatmaz ve beklemez** — hata yolunu bozamaz.

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
- ✅ **Global eşikler 2026-08-10'da CANLIDA 0/0/0 yapıldı — konum filtresi FİİLEN KALKTI.**
  Ölçüldü (uygulama anında, `UPDATE 3`): `min_reactions=0`, `min_comments=0`, `min_shares=0`,
  `enabled=true`. Doğrulama: aynı iki hesap **12/20 ve 7/20 → 20/20 ve 20/20**. Türkiye'deki
  üye artık Katar'daki üyenin paylaşımını görüyor.
  Uygulanan dosya: `docs/operations/2026-08-06-cadde-global-esik-sifirlama.sql` (geri alma
  10/5/10 içinde). Sıralama bantları (aynı şehir → aynı ülke → etkileşim) **aynen duruyor**;
  kalkan yalnız FİLTRE. Şüphelenirsen ezberleme, teyit et:
  `select key, value from cadde_settings where key like 'cadde.global%'`.
  ⚠️ `src/lib/cadde-ranking.ts` içindeki `CADDE_GLOBAL_THRESHOLD_SETTINGS` **hâlâ 10/5/10'dur
  ve öyle kalmalıdır** — o sabit SEED varsayılanını tanımlar ve
  `cadde-global-threshold-migration.test.ts` onu değişmez seed migration'ının metnine kilitler.
  Canlı değerle ayrışması BEKLENEN durumdur; sabite bakıp "canlı eşik 10" sanma.
  ⚠️ Eşik sıfırlanınca **erişim kartı iki yerden birden yanlışa düştü** ve düzeltildi
  (`src/lib/cadde-reach.ts`): (1) `caddeGlobalThresholdText` "0 reaksiyon · 0 yorum ·
  0 paylaşım" diye saçmalıyordu → `isCaddeGlobalGateOpen` ile ayrı metin; (2)
  `get_cadde_feed_reach_v1` yalnız KONUM dallarını sayar, global katmanı saymaz — kapı
  açıkken ham `reach.total` gerçeği EKSİK gösterir, `caddeEffectiveReach` bunu tüm üyelere
  genişletir. Eşikleri tekrar oynatırsan bu iki fonksiyonu da gözden geçir.
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
| `src/App.tsx` | Master route table (313 lines, 51 `lazy()` code-split) |
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
6. **VERİTABANINA YAZILAN DEĞERLERDEN Türkçe karakter SİLİNMEZ.** 19 Eylül 2026'da herkese
   açık etkinlik formunda `"yüz yüze" → "yuz yuze"`, `"eğitim" → "egitim"`, `"kültür" →
   "kultur"`, `"iş" → "is"` yapıldı. Bunlar kullanıcıya görünen METİN değil, **DB anahtarı**
   idi; `events.type` üzerinde CHECK kısıtı olmadığı için yanlış değer hata vermeden kaydedildi
   ve formdan eklenen etkinlik "Fiziksel"/"Eğitim" filtresine düşmedi, detay sayfasında konumu
   görünmedi. Kural: `value`/`key` alanları kaynak modülden gelir, elle yazılmaz —
   `src/lib/events-vocabulary.ts` tek kaynaktır, `events-vocabulary.test.ts` kilitler.
   Aynı gece yazılan kodda arayüz metinleri de ASCII'ye düşmüştü (459 satırda 5 Türkçe
   karakter). Yeni dosya yazarken `npm run verify:text` BUNU YAKALAMAZ — o yalnız kodlama
   ve mojibake denetler, eksik harfi değil. Gözle kontrol et.

## DEMO içerik deseni (ZORUNLU — 2026-09-20)

Canlıda yayında ama içeriği GERÇEK OLMAYAN sayfalar (örnek ödül/takvim/başvuru)
tek bir listeden işaretlenir: **`src/lib/demo-pages.ts` → `DEMO_ROUTES`**.

- İki görünür işaret vardır ve ikisi de o listeden türetilir: düğme/kartın sağ
  üst köşesindeki `DemoBadge` ve sayfaya girince açık beta bandının altına
  düşen `DemoBanner`. **Uyarıyı sayfaya elle yazma** — `SiteHeader` bandı
  rotadan kendisi çizer, `CampaignHubPage` rozeti `isDemoRoute()` ile alır.
- Yeni demo sayfası = `DEMO_ROUTES`'a **bir satır**. Gerçek içeriğe kavuşunca =
  satırı **sil**. `path` `App.tsx`'teki `path` ile birebir aynı olmalı, yoksa
  bant hiç çizilmez ve hata hiçbir yerde görünmez.
- Demo bandı **kapatılamaz** (beta bandı kapatılabilir; ikisi farklı iştir) ve
  rengi bilerek farklıdır.
- Sözleşme testi: `src/lib/demo-pages.test.ts` — gevşetme.
- Tam gerekçe ve akış: `docs/guides/demo-icerik-deseni.md`.

Bugünkü liste: `/campaign/vlogger`, `/campaign/blogger`, `/businesses`, `/relocation`.

⚠️ `/relocation` **kısmi demodur** ve deseni bir adım ileri taşır: sayfanın şehir,
servis, bürokrasi, maliyet ve belge sekmeleri GERÇEK veri okur; yalnız İş & İşletmeler,
Okullar ve Hoşgeldin Paketi sekmeleri örnek içerik gösterir. O üç sekme
`isDemoRoute("/relocation")` ile **gatelidir** (`RelocationHomePage.tsx`), yani
`DEMO_ROUTES` satırı silindiğinde sekmeler de kendiliğinden kaybolur — demo içerik
canlıda unutulamaz. Yeni bir kısmi demo sayfası yaparken bu deseni kopyala; örnek
içeriği rotadan bağımsız bir bayrakla gizleme.

## AI bilgi tabanı ve site asistanı (2026-09-21)

Bot `supabase/functions/site-assistant/`'tır ve `ai_knowledge_documents` tablosunu okur.
Plan: `docs/plans/2026-09-20-site-geneli-ai-bot-plani.md` · Ertelenenler:
`docs/kalanlar/2026-09-21-site-geneli-ai-bot-kalan-isler.md`.

1. **Bilgi tabanı TEK tablodur:** `ai_knowledge_documents`. Kaynaklar `source_key` ile
   ayrılır (bugün `catalog` + `blog`). **`catalog_search_documents`'a blog/doküman
   YAZILAMAZ** — `item_id` sütunu `catalog_items(id)` üzerine zorunlu FK'dir. Bu
   varsayım bir kez yapıldı ve çürüdü; tekrarlama.
2. **Yeni veri seti eklemek = `scripts/ai-knowledge/sources.mjs`'e bir satır** + bir
   `load(client)` fonksiyonu. Şema değişmez, `npm run ai:ingest` aynı kalır.
3. **Embedding boyutu 1536'dır ve pazarlık konusu değildir.** Gemini
   `gemini-embedding-001` varsayılanı **3072**'dir; `outputDimensionality: 1536`
   parametresi atlanırsa yazma anında patlar. Belge tarafı `RETRIEVAL_DOCUMENT`,
   sorgu tarafı `RETRIEVAL_QUERY` `taskType` kullanır — **ikisi tutarsız olursa
   mesafeler sessizce bozulur, hata çıkmaz.**
4. **`audience` sütunu (`public`/`member`/`admin`) kitle filtresidir ve filtre
   `ai_knowledge_search` RPC'si İÇİNDE uygulanır.** İstemciden gelen rol iddiasına
   güvenilmez; `site-assistant` kullanıcının kendi oturumuyla `is_admin()` sorar.
   Bugün korpusta `admin` satırı yok; iç belgeler eklendiğinde (kalan işler K1) bu
   sözleşme onları üyeden gizleyen tek mekanizma olacak.
5. **Yeni `hnsw` indeksi kullanılır, `ivfflat` değil.** ivfflat küme merkezlerini var
   olan satırlardan öğrenir; boş tabloda kurulursa isabet *hiçbir hata vermeden* düşük
   kalır. `catalog_search_documents` üzerindeki ivfflat indeksi (lists=100) tam olarak
   bu durumdadır — o sütun doldurulursa indeks yeniden kurulmalıdır.
6. **Korpus filtresi dizinin filtresini AYNEN yansıtır — bot kendi arayüzünden
   cömert olamaz.** 21 Eylül'de ölçülen üç sızma: (a) `[PLACEHOLDER]` kayıtlar
   (249'un **76**'sı) semantik aramada gerçeklerden DAHA İYİ eşleşiyordu, çünkü
   başlıkları kategorinin tam adı; (b) yalnız `status`+`visibility` filtresiyle
   `roles.is_directory_visible=false` olan **5 kayıt** (2 Süper Admin + 3 test
   hesabı) korpusa giriyordu — dizinin B20 koşulunun karşılığı eksikti;
   (c) `catalog_search_documents.search_text` **rol etiketini içermez**, bu yüzden
   "şehir elçisi kim?" sorgusu hiçbir şey bulamıyordu. Üçü de
   `scripts/ai-knowledge/sources.mjs` içinde kapatıldı — **gevşetme.**
7. **Alaka eşiği `0.35`'tir ve ÖLÇÜMDÜR** (`site-assistant/index.ts`). Doğru
   eşleşmeler 0.20–0.32, gürültü 0.36+. İlk sürümdeki 0.65 alakasız sorgulara da
   bağlam veriyordu, yani `hasContext` hep `true` oluyordu — düzeltilmek istenen
   kusurun aynısı. Değiştirmeden önce dosyadaki örnek sorguları yeniden ölç.
8. **`ChatBot.tsx` artık `/api/chat`'i (rag.corteqs.net) ÇAĞIRMAZ.** Proxy nginx ve
   `server.mjs`'te hâlâ duruyor (sökümü K4'te). `src/lib/ragApi.ts` artık ölüdür ama
   silinmedi — silmeden önce importer sayısını ölç.
7. **`site-assistant/providers.ts`, `relocation-assistant/providers.ts` ile AYNIDIR** ve
   kopya olması bilinçlidir. Birleştirme K3'te; **birini değiştirirken diğerine bak.**

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
- **252 test files under `src`** (+ 16 `scripts` + 7 `supabase` + 4 `workers` = **279** toplam) — **1.981** test (ölçüldü 2026-09-19 gece)
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

**2026-09-19'da eklenen iki sözleşme testi** (aynı gün canlıya çıkmak üzereyken yakalanan
iki sessiz kusur için — ayrıntı "Türkçe Metin Kuralları" md.6 ve aşağıdaki not):
- `src/lib/events-vocabulary.test.ts` (12 test) — etkinlik kategori/tür DEĞERLERİNİ Türkçe
  yazımlarına kilitler ve etkinlik dosyalarının kendi rakip seçenek listesini tanımlamadığını
  kaynak metinden denetler. `events.type` üzerinde CHECK kısıtı YOKTUR; yanlış değer hata
  vermeden kaydedilir ve etkinlik kendi filtresine düşmez.
- `src/lib/whatsapp-landings-insert-contract.test.ts` (4 test) — `submitLanding` insert yükünün
  her anahtarının `types.ts`'teki gerçek `whatsapp_landings` Insert sözleşmesinde bulunduğunu
  doğrular ve yükün `as TablesInsert<...>` ile CAST edilmesini yasaklar (`satisfies` zorunlu).
  Cast, olmayan bir sütuna yazmayı tsc'den gizlemişti.

⚠️ **Supabase yüklerinde `as TablesInsert<...>` / `as TablesUpdate<...>` CAST KULLANMA.**
Cast, olmayan bir sütuna yazmayı derleme zamanında gizler; hata yalnız canlıda,
`PGRST204 Could not find the '<sütun>' column ... in the schema cache` olarak çıkar ve
formu tamamen düşürür. Doğru araç `satisfies`: aynı okunabilirlik, gerçek denetim.

## Database & Migrations

- **397 migrations total, split by a baseline on 2026-08-04** (date-prefixed, immutable in prod; sayı 2026-09-19'da dosyadan ölçüldü, `check:migrations` 397/397 canlı kayıt doğruladı).
  Note the subdirectories — the parent `supabase/migrations/` contains 0 `.sql` files, so a glob
  on the parent silently finds nothing.

| Path | Count | Meaning |
|------|-------|---------|
| `supabase/migrations/applied/` | 145 | Post-baseline (≥ `20260615100000`) — the working set |
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
- **Edge Functions (11, ölçüldü 2026-09-21 dosyadan):** `find-matches`, `lansman-admin`
  (deprecated — handler returns HTTP 410), `radar-news-scan`, `relocation-assistant`,
  `relocation-notifications`, `send-notification-emails`, `send-submission-email`,
  `site-assistant`, `submit-survey-response`, `whatsapp-reply`, `whatsapp-webhook`
  (last two added 2026-08-30; they read `WHATSAPP_*` secrets — see README
  "Required function secrets"). `_shared/` bir fonksiyon değil, paylaşılan modüller.
  (There is no `chat-register` function — that name was stale.)
  ⚠️ Önceki "9" rakamı iki turdur bayattı: `relocation-assistant` (20 Eylül) ve
  `site-assistant` (21 Eylül) listeye hiç eklenmemişti. **Sayıyı ezberleme, dizini say.**

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

> ⚠️ **Yeniden ölçüldü 2026-09-05.** Aşağıdaki rakamların ÇOĞU bayattı ve gelecek oturumları
> çoktan ödenmiş borcu yeniden ödemeye yönlendiriyordu. Her satır artık ölçülmüş değerdir;
> ezberleme, değiştirmeden önce komutu tekrar çalıştır.
>
> | İddia (eski) | Ölçüm (2026-09-05) |
> |---|---|
> | ESLint 1280 problem | **0** |
> | 89 `as any` | **9** |
> | 83 `from(` + 42 `rpc(` bileşende | **32** + **4** |
> | 21 auth shim import'u | **18** |
> | 98 `tsc` hatası | **22** |
> | ~78 MB video | **16,4 MB** |

**CLOSED (do not re-open):**
- ~~ESLint debt: 1280 problems~~ → **RESOLVED.** `npm run lint` **0 problem** (ölçüldü 2026-09-05).
- ~~`public/burak-stripe-rehberi.html` publicly served~~ → **OBSOLETE.** Dosya artık yok.
- ~~~78 MB video in `public/`~~ → **BÜYÜK ÖLÇÜDE KAPANDI.** Toplam video **16,4 MB**
  (`hero-network.mp4` 7,8 MB · `whatmaskot.mp4` 5,4 MB · `herovideo.mp4` 3,5 MB).
  `footer-community.mp4` (48 MB) ve `hero-people.mp4` (11 MB) silinmiş. `public/` toplamı 28 MB.

**Open:**
1. **Broken imports (B2) — partially fixed, claim was partly wrong.** `@/lib/radarNews` was never
   the real name: the module is `src/lib/radarNewsPipeline.ts` and it **exists**. The
   `@/lib/mapEntities` and `html-to-image` problems were real, and the 5 dead pages that caused
   them were deleted 2026-08-04 (`MapSearch`, `PostGenerator`, `CityNews`, `WhatsAppGroupLanding`,
   `WhatsAppGroups` — all had zero importers and no route).
2. ~~**Auth shim migration (B5)**~~ → **KAPANDI 2026-09-06.** 16 dosya kanonik
   `@/components/auth/useAuth` yoluna geçirildi, `src/contexts/AuthContext.tsx` silindi.
   Belgelenen `loading`→`isLoading` riski hiç gerçekleşmedi: alias'ı kullanan dosya yoktu.
   Ayrıntı ve test tuzağı için "Authentication & Roles" bölümüne bak.
3. **Mixed data fetching (B6)** → **AÇIK, 2 çağrı kaldı** (2026-09-13 gece, düzeltilmiş ölçüm).
   Sabah ölçümü "8 `from(` + 3 `rpc(` kaldı" diyordu (83+42 → 32+4 → 8+3), ama S1-S10 göçü o
   listedeki 7 dosyayı zaten kapatmıştı — akşam yeniden ölçülünce yalnız `ProfilePage.tsx`'teki
   `individual_profile_details` tablosuna iki çağrı (select+upsert) kalmıştı. Commit `1285337`
   bunu `member-profile-api.ts`'e taşıdı (`upsertIndividualProfileDetailsPatch`); `ProfilePage.tsx`
   artık ince bir sarmalayıcı.

   ⚠️ **"0 kaldı" diye yazılmıştı, YANLIŞTI — aynı gece düzeltildi.** Gerçek sayı **2**, ikisi de
   `src/components/auth/AuthProvider.tsx`'te (satır 14-15 `user_profile_attributes`, satır 19-20
   `user_role_assignments`). Hata ölçüm yönteminde: `supabase\.from\(` deseni **tek satırda**
   arandı, ama bu iki çağrı çok satırlı zincir (`supabase` bir satırda, `.from(...)` altında)
   olduğu için görünmedi. **Bu deseni sayarken multiline arama kullan**
   (`supabase\s*\n?\s*\.from\(`), yoksa borcu sıfır sanırsın.

   Kalan 2 çağrı AuthProvider'da savunulabilir (oturum kurulumu, henüz API katmanı yok) ama
   madde **kapanmadı**. Yeni özellik eklerken `*-api.ts` + React Query kalıbını kullan.
4. **TypeScript loose (B7)** → **10** satırda `as any` metni geçiyor (3 gerçek cast + 7
   yorum/açıklama satırı — 2026-09-13 ölçümü, önceki not "9 kaldı, 6 yorum" idi). Gerçek cast'ler
   bilinçli: `const db = supabase as any` (`cadde-internal.ts` · `relocation-api.ts` ·
   `relocation-tools-api.ts`) — kaldırmak tsc'yi yeniden artırır, hâlâ gerçek iş yapıyorlar.
5. ~~**`tsc -p tsconfig.app.json --noEmit` errors**~~ → **KAPANDI 2026-09-13, SIFIR hata**
   (109 → 22 → 16 → 12 → 9 → **0**). Eskiden burada üç sınıflık (A/B/C) bir döküm tablosu vardı —
   hepsi kapandı: B sınıfı (`Json` sütununa tipli nesne) 2026-09-06'da `src/lib/supabase-json.ts`
   (`toJson`/`fromJson`) ile; A sınıfı (Supabase insert/update payload tipleme, `resource-links.ts` ·
   `turkish-missions-admin.ts` · `LinkManager.tsx` · `MvpManager.tsx` · `submissions.test.ts` ·
   `marquee.test.ts`) ve C sınıfı (sorgu kurucusu özyinelemesi TS2589/TS2769,
   `command-center-items.ts` · `diasporaSearch.ts`) 2026-09-13'te kapandı — C sınıfının çözümü
   `let query: any` + `// eslint-disable-next-line @typescript-eslint/no-explicit-any` deseni
   (`cadde-internal.ts`'teki `const db = supabase as any` ile aynı tuzak). Yeni bir `tsc` hatası
   açılırsa önce bu iki sınıftan birine mi girdiğine bak.
6. **Test coverage spotty** → activate Playwright for critical flows.
7. **Large files** → **800 satırı aşan üretilmemiş dosya: 13 → 5** (ölçüldü 2026-09-13 gece).
   O gece iki dalgada **on bir** dev dosya ayrıştırıldı, **16.615 satır** tek dosyalık
   yığınlardan odaklı modüllere taşındı. Kalan 5'in ikisi test, biri veri, ikisi bilinçli
   ertelenen Cadde dosyası — yani **ertelenenler dışında 800'ü aşan üretim kaynak dosyası
   kalmadı.**

   **Dalga 2 (aynı gece, bağımsız gözden geçirici doğrulamasıyla):**

   | Dosya | Önce | Sonra |
   |---|---|---|
   | `commandcenter/CommandCenterManager.tsx` | 2127 | **25** |
   | `admin-shell/burak-share-tools.ts` | 1418 | **49** |
   | `dashboard/command-center-items.ts` | 1276 | **107** |
   | `admin-shell/social-test-tools.ts` | 1189 | **32** |
   | `dashboard/links/LinkManager.tsx` | 967 | **131** |

   ⚠️ **Dalga 2'nin öğrettiği üç şey** (gözden geçirici ajanlar buldu, ayrıştıran ajanlar
   kaçırmıştı — bu yüzden ayrıştırma ve inceleme AYRI ajanlara verilmelidir):
   1. **`npm run ingest:tools:check` bu refactor sınıfında MUTLAKA çalıştırılmalı.** `src/lib/**`
      altına yeni dosya ekleyen her değişiklik ajan araç kataloğunu (`docs/agent/tools.json` +
      `src/lib/agent/tools-catalog.generated.ts` + `docs/agent/openapi.yaml`) bayatlatır. Bu
      katalog `/admin/tool-registry` ve `/admin/agent-analytics` sayfalarına gider. **Ne lint ne
      test yakalar** — `prelint` yalnız `check:drift` çalıştırır, `ingest:tools:check` DEĞİL.
   2. **`npm run check:dead`** ayrıştırma sırasında geçici olarak kırmızı görünür (parçalar
      oluşturulmuş ama henüz bağlanmamışken). İş bitmeden ölçüp "ölü kod var" sonucuna varma;
      bitince tekrar çalıştır.
   3. **Regex'teki kaçış dizileri ham karaktere çevrilmemeli.** Bir ajan
      `command-center-items/date-groups.ts`'te `/[̀-ͯ]/` desenini gerçek görünmez
      birleştirici karakterlere dönüştürdü. İşlevsel olarak aynı, ama editörde görünmez ve
      kopyalanamaz. Geri alındı — Türkçe metin normalizasyonu yapan kodda bu ciddi bir tuzak.

   | Dosya | Önce | Sonra | Nereye |
   |---|---|---|---|
   | `admin-shell/social-diaspora-posts.ts` | 2934 | **37** | `social-diaspora-posts/posts-*.ts` + `theme-labels` + `types` |
   | `pages/ProfilePage.tsx` | 2782 | **795** | `components/profile/*` + `hooks/profile/*` + `lib/profile-*.ts` |
   | `admin-shell/admin-updates.ts` | 2210 | **31** | `admin-updates/2026-*.ts` (aylık) |
   | `pages/AddWhatsAppPage.tsx` | 1747 | **493** | `components/whatsapp/*` + `lib/whatsapp-landing-*.ts` |
   | `pages/admin/AdminCatalogPage.tsx` | 1249 | **393** | `components/admin/catalog/*` + `lib/admin-catalog-display.ts` |
   | `admin-shell/admin-navigation-registry.ts` | 849 | **40** | `admin-navigation-registry/<grup>.ts` (13 grup) |

   ⚠️ **300+ sayısı 92'den 97'ye ÇIKTI ve bu bir gerileme DEĞİL** — beklenen sonuç:
   2934 satırlık tek dosyayı ~400'erlik 8 parçaya bölmek, 300-500 bandındaki dosya sayısını
   artırır ama tek bir devi yok eder. Bu maddede takip edilecek metrik **800 üstü sayısı**dır,
   300 üstü değil. 300 üstünü sayıp "kötüleşmiş" sonucuna varma.

   **Hâlâ 800 üstünde (5):** `CaddePage.test.tsx` (1845, test) · `CaddePage.tsx` (1716) ·
   `ProfilePage.test.tsx` (1028, test) · `cadde-api.ts` (986) · `zgen-data.ts` (980, veri).

   **Sıradaki gerçek iş = Cadde çifti** (`cadde-api.ts` + `CaddePage.tsx`). İki dalgada da
   bilinçli olarak ERTELENDİ, çünkü: `cadde-api.ts`'in **25 importer'ı var ve hiç testi yok**,
   `CaddePage.tsx`'in 19 importer'ı var. CLAUDE.md'nin Cadde bölümü bu alanın *sessizce*
   kırıldığı üç ayrı olayı belgeliyor (fold-insensitive eşleşme, `instanceof Error` hatası
   aylarca canlıda kaldı, hedef eşleşmesi). **Doğru sıra: önce karakterizasyon testi yaz,
   sonra ayrıştır.** Testsiz ayrıştırma bu iki dosyada kabul edilemez.

   ⚠️ **Satır sayarken Windows tuzağı:** PowerShell'in `Measure-Object -Line`'ı **boş satırları
   saymaz** — `burak-share-tools.ts` için 1091 der, gerçek 1418'dir. Doğru ölçüm
   `(Get-Content $f).Count` veya `wc -l`. Bu farkla ölçülen bir "iyileşme" sahtedir.

   `src/integrations/supabase/types.ts` (15.764) · `src/lib/agent/tools-catalog.generated.ts`
   (3242) · `src/data/geoCountries.generated.ts` (1013) ÜRETİLEN dosyalardır, sayıma dahil değil.
8. ~~**Duplicate images in `public/`**~~ → **YENİDEN ÖLÇÜLDÜ 2026-09-13, KAPANDI.**
   `sweet.png` gerçekten ölüydü, silindi (13 Eylül Q1) — `sweet.jpg` tek kalan, kullanılan
   dosya. `last.png`/`newbg.png` byte-birebir aynı dosya (763.198 bayt) ama **ikisi de
   kullanılıyor**: `May19CampaignPage.tsx` ikisini de ayrı katmanlar için ayrı ayrı
   çağırıyor (biri marquee/OG varsayılanı, öbürü "poetic layer"). `og-image.png`
   (`MarqueeItemCard.tsx` · `marquee.ts` · `AdminMarqueePage.tsx` · `DiasporaDetailPage.tsx`)
   ile `og-image-new.jpg` (`seo.ts`) de aynı şekilde — ikisi de canlı, farklı rolde. **Bu üç
   çift "duplicate" değil, benzer görünümlü ama ayrı amaçlı dosyalar — silme.**

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

