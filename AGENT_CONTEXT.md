# CorteQS — Agent Context Dosyası

> Bu dosya, yeni bir agent oturumunun projeyi hızla kavraması için hazırlanmıştır.
> Diğer teknik belgelerden bilgi derleyerek token maliyetini minimize eder.
> **Güncelleme:** 2026-06-11 (Cadde 3.0 E2E rebuild Faz 0–9 + kuyruk TAMAMLANDI; kök dizin temizliği ve dokümantasyon konsolidasyonu yapıldı)
>
> **Kök doküman düzeni (2026-06-11):** kökte yalnız 4 doküman yaşar —
> `CLAUDE.md` (agent kuralları) · `AGENT_CONTEXT.md` (bu dosya) · `ARCHITECTURE.md` (tek ana mimari) · `rapor.html` (rapor + takip tablosu).
> Geri kalan her şey `docs/` altındadır (`docs/README.md` indeksine bak).
>
> **Tek ana mimari doküman:** `ARCHITECTURE.md` (kök)
> **Cadde 3.0 kapanış raporu:** `docs/cadde-300/change-report.md`
> **Catalog/AFS rebuild raporları:** `docs/catalog-role-afs-rebuild/` (00–14, canlı 2026-06-09)
> **Refactor yol haritası:** `docs/refactor/2026-06-09-refactor-backlog.md` (B1–B10)

---

## 1. Proje Özeti

**CorteQS Landing** — React 18 + Vite 5 + Supabase SPA. ODTÜ mezunları ve Türk diasporası topluluğu platformu.

- URL: `https://corteqs.net`
- Supabase Project ID: `injprdrsklkxgnaiixzh`
- Deploy: Docker / Coolify → `npm run build` → `node server.mjs`
- **Repo gerçekliği (2026-06-10):** 150 `*.tsx` page dosyası (65'i admin), 269 component, 81 lib modülü, **221 migration**, 83 test dosyası, 5 edge function

### Modüller (tek SPA içinde)

| Modül | Path | Açıklama |
|-------|------|----------|
| Landing | `/`, `/founders`, `/iletisim`, `/pricing`, `/kariyer` | Kurumsal tanıtım |
| Lansman | `/lansman` | Startup/girişim kayıt formu |
| Anketler | `/anket`, `/admin/surveys/*` | Admin yönetimli anket |
| Muhasebe | `/admin/muhasebe/*` | Gelir/gider/nakit akışı |
| Dizin | `/directory/*`, `/directory/catalog/:slug` | Üye profil + katalog item sayfaları |
| Ticari | `/commercial/<slug>` | Standalone partner sayfaları |
| Workspace | `/admin/workspace/*` | Komuta merkezi, todo, kaynaklar |
| May19 | `/19051919`, `/19051919/harita` | Anma kampanyası |
| Catalog | `/admin/data`, `/admin/new-member/profile-role-assignment` | Unified catalog + üye yönetimi |
| RolesGo | `/admin/new-member/*` | Rol/attribute/feature/section/overview yönetimi |
| WhatsApp | `/addcom`, `/addcom/edit/:slug`, `/admin/whatsapp-landings/*` | WhatsApp landing yönetimi |
| Profile | `/profile`, `/profile/:type`, `/profile/catalog/:itemId` | Kullanıcı profil editörü (+ Cadde panelleri: ilgi alanları, içeriklerim, Tanıtım) |
| Welcome | `/welcome/activate` | Yeni üye aktivasyon akışı |
| **Cadde 3.0** | `/cadde`, `/cadde/cafe/:cafeId`, `/cadde/carsi`, `/cadde/carsi/:itemId` | Diaspora sosyal akışı: band/skor ranking'li feed, Köprü, Cafe odaları, Çarşı (U2U pazar), Tanıtım kartları, bildirim zili |
| Cadde Admin | `/admin/cadde`, `/admin/cadde/promotions`, `/admin/cadde/moderation`, `/admin/cadde/carsi` | İçerik CRUD + kampanya onayı + moderasyon kuyruğu + ilan denetimi (`pages/admin/cadde/routes.tsx`) |

---

## 2. Tech Stack

```
React 18.3        react-router-dom 6.30    @tanstack/react-query 5
TypeScript 5.8    Vite 5.4 + SWC           @supabase/supabase-js 2.101
Tailwind 3.4      shadcn/ui (Radix)        react-hook-form 7 + zod 3
Vitest 3          Playwright 1.57          sonner, next-themes, lucide-react
recharts          react-simple-maps        @tanstack/react-table 8
```

**TypeScript strict modu KAPALI** (`strictNullChecks: false`, `noImplicitAny: false`) — intentional, refactor olmadan açılamaz.

---

## 3. Dizin Yapısı

```
src/
├── App.tsx                  # Tüm 100+ route tek dosyada; lazy() ile code-split edilmiş
├── main.tsx                 # hydrateRoot/createRoot switch
├── pages/
│   ├── admin/
│   │   ├── muhasebe/        # routes.tsx ile modülerize (ÖRNEK AL)
│   │   ├── workspace/       # Komuta, todo, resources, mvp, meeting-notes, docs
│   │   ├── surveys/         # CRUD survey yönetimi
│   │   ├── AdminCatalogPage.tsx          # /admin/data + /admin/new-member/profile-role-assignment
│   │   ├── AdminRoleManagementPage.tsx   # /admin/new-member/role-matrix (attr/feature/section)
│   │   ├── AdminRolesOverviewPage.tsx    # /admin/new-member/roles-overview
│   │   ├── AdminDatabaseTablesPage.tsx   # /admin/veritabani-tablolari
│   │   ├── AdminNewMemberGuidePage.tsx   # /admin/new-member/guide
│   │   └── ...                           # Diğer admin sayfaları
│   ├── DirectoryPage.tsx                 # /directory
│   ├── DirectoryCatalogItemPage.tsx      # /directory/catalog/:slug
│   ├── DirectoryProfilePage.tsx          # /directory/profile/:userId
│   ├── CatalogItemEditorPage.tsx         # /profile/catalog/:itemId
│   ├── WelcomeActivatePage.tsx           # /welcome/activate
│   ├── ContactPage.tsx                   # /iletisim
│   └── ...                              # Public sayfalar
├── components/
│   ├── ui/                  # shadcn primitives — DOKUNMA
│   ├── auth/                # AuthProvider, RequireAuth, RequireFeature
│   ├── admin/
│   │   ├── muhasebe/        # Muhasebe UI kapsülü
│   │   ├── catalog/         # CatalogEntityProfilePanel, CatalogClaimRequestsPanel, vb.
│   │   ├── role-management/ # AttributeRulesPanel, FeatureFlagsPanel, ProfileSectionRulesPanel
│   │   └── roles-overview/  # RoleListPanel, ItemListPanel, EntityCatalogPanel, CaseDetailPanel
│   ├── directory/           # DirectorySearchBar, DirectoryFilters, DirectoryResultRow, ProfileHeroCard, CatalogProfileLayout
│   ├── cadde/               # CaddeProfileGate, CaddeGeoFilter, CreateCafeForm, CarsiGlobalTicker,
│   │                        #   SponsoredFeedCard, PromotionRail, NotificationsBell, profil panelleri
│   └── profile/, surveys/, may19/, chat/, messaging/
│   # NOT: legacy feed/ ve connections/ klasörleri SİLİNDİ (Cadde 3.0 Faz 9, 2026-06-11)
├── lib/
│   ├── muhasebe-*.ts        # api, schemas, format, aggregations — REFERANS PATTERN
│   ├── member-profile-api.ts  # Profil API katmanı (TERCIH ET)
│   ├── member-profile.ts    # Profil tipler + helpers
│   ├── catalog-*.ts         # catalog-directory.ts, catalog-entity-api.ts, catalog-types.ts
│   ├── admin-catalog.ts     # Admin catalog data layer
│   ├── profile-*.ts         # profile-view-model, profile-helpers, profile-types, profile-onboarding-*
│   ├── role-catalog.ts      # Rol tanımları veri katmanı
│   ├── cadde-*.ts           # Cadde 3.0 katmanı: types/api/admin-api/schemas/rules/format/
│   │                        #   ranking/targeting/query-keys/internal + carsi-api/tanitim-api/
│   │                        #   notifications-api/moderation-api (RPC-only mutation kuralı)
│   ├── admin.ts             # 57 satır pure barrel → src/lib/admin/'i re-export eder
│   ├── admin/               # 7 domain API: access/role/feature/profile/taxonomy/approval/referral (+ admin-types)
│   ├── features.ts          # Feature flag yardımcıları
│   └── dashboard/           # Workspace data layer
│   # NOT: src/lib/supabase.ts KALDIRILDI — tek client: integrations/supabase/client.ts
├── hooks/                   # useFeatureFlags, useMuhasebe, usePublicIndividualProfile, vb.
├── integrations/supabase/
│   └── client.ts            # Lovable-generated — RİSKLİ, DOKUNMA
└── contexts/
    └── AuthContext.tsx       # BACKWARD-COMPAT SHIM — canonical useAuth'a delege eder; yeni kodda @/components/auth/useAuth kullan
```

---

## 4. Auth & Yetkilendirme

### ÖNEMLİ: Canonical auth + backward-compat shim

| | `src/components/auth/` | `src/contexts/AuthContext.tsx` |
|--|------------------------|-------------------------------|
| App.tsx'e mount? | **EVET** (canonical) | Canonical AuthProvider'ı re-export eder |
| Rol | Kaynak (`session`/`user`/`isLoading`) | **Shim**: `useAuth` canonical'a delege; `loading` alias'ı doğru |
| Yeni kodda kullan? | **EVET** | Hayır — ama orphan/ölü DEĞİL (39 dosya hâlâ buradan import ediyor, gerçek session görüyorlar) |

**Doğru import (yeni kod):**
```ts
import { useAuth } from "@/components/auth/useAuth";
```

> Shim migrasyonu ertelendi (39 import → canonical, `loading`→`isLoading`, sonra shim sil). Bkz. refactor backlog **B5**.

### Yetki Katmanları

```
Supabase Auth → AuthProvider → session/user context
                    ↓
RequireAuth       — admin route'larını korur (session kontrolü)
RequireFeature    — feature flag bazlı render
useFeatureFlags() — get_current_user_features RPC
```

### Tek Sistem (geçiş tamamlandı — 2026-06-09)

`admin_users`, `profiles`, `user_profiles`, `role_feature_defaults` tabloları **DROP edildi**.

| Eski (KALDIRILDI) | Yeni (CANONICAL) |
|-------------------|------------------|
| `public.admin_users` | `public.is_admin()` RPC / `public.is_moderator()` RPC |
| `public.profiles` | `user_profile_attributes` (full_name, avatar_url vs. attribute olarak) |
| `public.user_profiles` | `user_role_assignments` + `user_profile_attributes` |
| `public.role_feature_defaults` | `role_feature_flags` |

**Profil/rol mantığına dokunmadan önce:** `user_role_assignments` ve `user_profile_attributes` tablolarını kullan. `public.profiles` veya `user_profiles`'a referans veren herhangi bir kod varsa kaldırılmalı.

---

## 5. Veri Katmanı

### Üç Stil (tutarsız — yeni kod için #2 + #3 kullan)

1. Component içi `supabase.from()` — **anti-pattern, yaygın**
2. `src/lib/*-api.ts` — **tercih edilen** (`muhasebe-api.ts` örnek al)
3. React Query `useQuery` / `useMutation` — **önerilen**, az kullanılmış

### Tek Supabase Client (konsolidasyon tamamlandı)

- `src/integrations/supabase/client.ts` — Lovable-generated, type'lı — **tek client**.
- `src/lib/supabase.ts` **artık yok** (0 import). Eski "iki client" notu geçersiz.

Tüm kod `@/integrations/supabase/client`'i kullanır.

### Muhasebe Pattern (kopyala)

```
lib/muhasebe-api.ts          → Supabase queries/mutations
lib/muhasebe-schemas.ts      → Zod types + z.infer
lib/muhasebe-format.ts       → Display formatting
lib/muhasebe-aggregations.ts → Business logic
pages/admin/muhasebe/routes.tsx → Modül routing
components/admin/muhasebe/   → UI components
```

---

## 6. Veritabanı Modeli (Kritik Tablolar)

### Auth Kullanıcısı (GÜNCEL — legacy tablolar kalktı)

```
auth.users                   → Supabase Auth canonical kayıt
user_role_assignments        → user ↔ rol (TEK YER)
user_profile_attributes      → Tüm profil verileri attribute olarak
user_feature_overrides       → Kullanıcıya özel feature istisnası
approval_requests            → Rol değişikliği, feature talep, attribute onay
```

> `profiles`, `user_profiles`, `admin_users`, `role_feature_defaults` tablolar **mevcut değil**.

### Katalog (REBUILD SONRASI — AFS şeması, 2026-06-09)

> ⚠️ **Rebuild ile tablo adları değişti.** `*_details` tabloları ve item-type sistemi DROP edildi;
> profil verisi artık `catalog_item_attribute_values` (typed kolonlar) + `catalog_item_roles` ile tutuluyor.

```
catalog_items                → Tüm katalog kayıtları (slug, title, country_code, city,
                               status, visibility, is_placeholder, is_verified, created_by, deleted_at)
                               → 239 item (163 gerçek + 76 placeholder)
catalog_item_roles           → item ↔ rol (is_primary); *_details tablolarının yerine geçti
catalog_item_attribute_values → Item'ın attribute değerleri (typed; eski: catalog_item_attributes)
catalog_item_claims          → Sahiplenme talepleri (eski: catalog_claim_requests)
catalog_item_managers        → owner/manager/editor/viewer yetkileri (eski: catalog_item_memberships)
catalog_audit_logs           → + 15 satellite tablo (media, contacts, links, locations,
                               services, languages, categories, reviews, reports, tags, ...)
```

### Kural Tabloları (Rol → Attribute/Feature/Section) — AFS şeması

> **AFS = Attributes / Features / Sections.** 76 FLAT rol (aile/parent YOK — `family_key`,
> `parent_role_id` kolonları kaldırıldı). Her rol → attribute/feature/section'a explicit map.

```
roles                        → 76 flat rol (key, label, is_active, sort_order, deleted_at) — 0 legacy
afs_attributes               → Attribute sözlüğü, 53 satır (eski: attribute_catalog)
afs_features                 → Feature sözlüğü, 42 satır (eski: feature_catalog)
afs_sections                 → Section sözlüğü, 7 satır (eski: profile_section_catalog)
role_attributes              → Rol↔attribute kuralı (eski: role_attribute_rules)
role_features                → Rol↔feature flag (eski: role_feature_flags)
role_sections                → Rol↔section görünürlüğü (eski: role_profile_section_rules)
```

> **Eski→Yeni tablo eşlemesi (rebuild rename'leri):**
> `attribute_catalog`→`afs_attributes`, `feature_catalog`→`afs_features`,
> `profile_section_catalog`→`afs_sections`, `role_attribute_rules`→`role_attributes`,
> `role_feature_flags`→`role_features`, `role_profile_section_rules`→`role_sections`,
> `catalog_item_attributes`→`catalog_item_attribute_values`,
> `catalog_claim_requests`→`catalog_item_claims`,
> `catalog_item_memberships`→`catalog_item_managers`.
> **DROP edildi:** `catalog_item_types`, `item_type_attribute_rules`, `role_taxonomy_rules` ve aile/taxonomy konseptleri.
> Runtime kodda eski adların **0 referansı** var (auto-gen `types.ts` hariç).

### Cadde 3.0 (E2E rebuild, canlı 2026-06-11 — detay: `ARCHITECTURE.md` + `docs/cadde-300/change-report.md`)

```
cadde_settings               → TÜM ürün limitleri/flag'leri (telefon zorunluluğu D-03, cafe/carsi
                               limitleri, rate limitler) — ürün kararı SQL update'iyle, kod gerekmez
user_verifications           → Telefon doğrulama TEK truth source (dışa kapalı)
cadde_countries/cities       → Cadde mini-geo kataloğu (geo_* 'a bağ kolonlu; admin_import_cadde_geo_v1)
cadde_posts                  → need_category, engagement_score, published_at, cafe_id,
                               visibility(public|cafe), diaspora_key(tr|in|cn|ph)
cadde_interest_catalog (+user/post interests) → ilgi alanı hedefleme (band/skor ranking girdisi)
cadde_cafes / cadde_cafe_members → süreli odalar: entry_mode(open|approval|referral),
                               davet kodu sha256 hash, kapasite, arşiv
carsi_categories / carsi_items → Çarşı (U2U pazar; Tanıtım'dan AYRI — D-01)
cadde_promotion_*            → Tanıtım: placement kataloğu + kampanya(pending→approved) + event'ler
notifications (genişletildi) → üretim YALNIZ cadde_notify definer'ından; realtime user_id=eq.<uid>
cadde_reports / cadde_moderation_queue / cadde_user_bans → şikayet + otomatik tarama + ban
```

**Kurallar:** (1) Mutation'lar YALNIZ security-definer RPC — `create_cadde_post_v1`,
`create/join/approve/archive_cadde_cafe_v1`, `create/update/delete_carsi_item_v1`,
`create_cadde_promotion_campaign_v1`, `report_cadde_entity_v1`, `admin_moderate_cadde_entity_v1` vb.
(2) Üç SQL↔TS ayna sözleşmesi (birini değiştiren diğerini günceller):
`can_post_kopru`↔`cadde-rules.ts` · `list_cadde_feed_v1`↔`cadde-ranking.ts` · `can_join_cadde_cafe`↔`canJoinCafeRule`.
(3) Ban kill-switch `has_cadde_feature` içinde — banlı kullanıcının tüm cadde yazmaları kapanır.
(4) Hata kodları `cadde_*` → `cadde-rules.ts` haritasından Türkçe mesaja çevrilir; yeni RPC kodu eklersen haritaya da ekle.
(5) Otomatik içerik taraması trigger'larla kuyruğa düşürür, yayını engellemez (TS blocklist ile senkron).

**Legacy soft-decommission (Faz 9):** `feed_posts/feed_likes/cafes/cafe_memberships/user_follows`
yazmaya kapalı + policy'siz + COMMENT'li; DROP **canary sonrası** ayrı kararla (bekle-gözle onaylandı
2026-06-11; `user_follows` 1 satır R-06). Bu tablolara yeniden policy/grant AÇMA.
Canlı son migration: `20260611160000` (cadde300 serisi 001–014).

### Diğer Önemli Tablolar

```
submissions                  → Form gönderimleri (RLS hassas)
surveys / survey_questions / survey_responses
muhasebe_gelirler / muhasebe_giderler
lansman_basvurular           → Startup başvuruları
referral_codes / referral_uses
marquee_items                → Haber akışı
workspace_resources / workspace_todos / workspace_meetings
geo_countries / geo_cities   → Global coğrafya referansı (251 ülke / ~77k şehir)
```

### Feature Çözümleme Önceliği

```
override (user/item bazlı) > role_feature_flags default > fallback (false)
```

### Claim Akışı

```
submit_catalog_claim_request RPC → catalog_claim_requests (pending)
Admin onay → admin_approve_catalog_claim → catalog_item_memberships (editor)
Admin red  → admin_reject_catalog_claim
```

### Kritik RPC'ler

```
get_current_user_profile()       → Session kullanıcısının tam profili (user_role_assignments + user_profile_attributes)
get_current_user_features()      → Feature flag listesi
admin_search_profiles()          → Admin üye arama (auth.users + user_profile_attributes)
admin_list_catalog_claims()      → Claim yönetimi
list_public_directory_profiles() → Dizin liste endpoint'i
admin_set_user_role()            → Rol atama
update_profile_attribute()       → Attribute güncelleme (onay akışıyla)
is_admin() / is_moderator()      → Yetki kontrol fonksiyonları
```

---

## 7. Deployment & Runtime

### Build & Serve

```bash
npm run build        # dist/ üretir
node server.mjs      # Production: static serve + env injection + /api/chat proxy
```

### server.mjs Kritik İşlevler

1. `/env-config.js` → runtime'da env var'lardan üretilir (Coolify build-time inject edemez)
2. `/api/chat` → `RAG_API_SECRET` ile `rag.corteqs.net`'e proxy
3. SPA fallback routing

### Vite Config Özel Mantık

`info-*.html` dosyaları build sırasında `dist/commercial/<slug>/` altına emit edilir. **Bu mantığa dokunma.**

### Env Vars

```bash
# Build-time (VITE_ prefix)
VITE_SUPABASE_URL=https://injprdrsklkxgnaiixzh.supabase.co
VITE_SUPABASE_ANON_KEY=...
VITE_SUPABASE_PROJECT_ID=injprdrsklkxgnaiixzh

# Runtime only (server.mjs, frontend'e asla gönderilmez)
SUPABASE_SERVICE_ROLE_KEY=...
RAG_API_SECRET=...
```

---

## 8. Hızlı Komutlar

```bash
npm run dev                  # Port 8080
npm run build
npm run lint
npm run test                 # Vitest
npm run test:watch
npm run start                # node server.mjs
BASE_URL=https://corteqs.net npm run verify:release
supabase migrations list

# Edge functions (5): chat-register, find-matches, lansman-admin,
#                     send-submission-email, submit-survey-response
supabase functions deploy send-submission-email
supabase functions deploy lansman-admin
```

---

## 9. Kritik Dosyalar

| Dosya | Neden Kritik |
|-------|--------------|
| `src/App.tsx` | Tüm 100+ route burada; lazy() ile code-split edilmiş |
| `src/main.tsx` | hydrateRoot/createRoot switch |
| `src/components/auth/AuthProvider.tsx` | Session yönetiminin kalbi |
| `src/components/auth/useAuth.ts` | Canonical auth hook — buradan import et |
| `src/contexts/AuthContext.tsx` | Backward-compat shim — canonical'a delege; yeni kodda `@/components/auth/useAuth` kullan |
| `src/integrations/supabase/client.ts` | Lovable-generated — değiştirme (tek client) |
| `src/lib/muhasebe-*.ts` | Referans mimari pattern |
| `src/lib/admin.ts` + `src/lib/admin/` | `admin.ts` = barrel; `admin/` = 7 domain API (yeni admin API'leri için pattern) |
| `src/lib/features.ts` | Feature flag yardımcıları |
| `src/lib/member-profile-api.ts` | Üye profil API katmanı (tercih edilen) |
| `src/lib/catalog-directory.ts` | Dizin arama veri katmanı |
| `src/lib/catalog-entity-api.ts` | Katalog entity profil işlemleri |
| `src/lib/admin-catalog.ts` | Admin unified records / catalog data layer |
| `src/lib/role-catalog.ts` | Rol tanımları veri katmanı |
| `src/lib/profile-helpers.ts` | Profil yardımcı fonksiyonları (yeni eklendi) |
| `src/components/admin/roles-overview/` | RolesOverview modül bileşenleri |
| `src/components/directory/` | Dizin arama/filtreleme/sonuç bileşenleri |
| `vite.config.ts` | Standalone HTML emit — dokunma |
| `server.mjs` | Production runtime |
| `supabase/migrations/20260512103000_security_hardening_phase1.sql` | Güvenlik baseline |
| `supabase/migrations/20260609003000_drop_legacy_tables.sql` | Legacy tablo temizliği |
| `supabase/migrations/20260609015000_fix_catalog_profile_trigger_post_drop.sql` | Yeni kullanıcı oluşturma trigger düzeltmesi |

---

## 10. Dokunulmayacak / Kırılmayacak Şeyler

1. **SEO kilitli URL'ler:** `/lansman`, `/cadde` (+ alt rotaları `/cadde/cafe/:id`, `/cadde/carsi[/:id]`), `/19051919`, `/anket`, `/commercial/<slug>`, `/founders`, `/directory`, `/iletisim` — path değiştirilemez
2. **Supabase migration'ları** — silinemez, yeniden sıralanamaz; sadece yeni ekle
3. **`server.mjs`** — env injection ve RAG proxy mantığı
4. **`vite.config.ts`** — standalone HTML emit
5. **`src/components/ui/*`** — shadcn generated, manuel düzenleme yapma
6. **`info-*.html`** kök dizinde kalmalı (Vite plugin input)
7. **Türkçe domain terimleri** — aşağıdaki listeye bak, rename etme

### Türkçe Domain Terimleri (rename etme)

`muhasebe`, `gelirler`, `giderler`, `nakit akışı`, `lansman`, `cadde`, `çarşı (carsi)`, `köprü`, `tanıtım`, `kaynak`, `kişi`, `oda`, `referans`, `ambasador`, `yönetici`, `anket`, `üye`, `danışman`

---

## 11. Bilinen Teknik Borçlar (öncelik sırasıyla)

> Konsolide, uygulanabilir yol haritası: `docs/refactor/2026-06-09-refactor-backlog.md` (B1–B10).

1. **Generated `supabase/types.ts` senkron değil** — `supabase gen types` ile yenile (B1, en yüksek öncelik). **2026-06-11 denemesi:** `.env.local`'daki `SUPABASE_ACCESS_TOKEN` (+backup) Unauthorized — token yenilenmeli; sonra `cadde-internal.ts`'teki tek `db as any` cast'i kalkar
2. **Kırık import'lar** — `@/lib/mapEntities`, `@/lib/radarNews`, `html-to-image` eksik; runtime crash riski (B2)
3. **`AdminLayout.tsx` hâlâ büyük (741 satır)** — alt bileşenlere + `useAdminAccess` hook'una böl (B4)
4. **Auth shim migrasyonu** — `@/contexts/AuthContext`'ten ~39 import; canonical'a geçir, sonra shim'i sil (B5)
5. **Karışık data fetching** — component içi `supabase.from()` hâlâ yaygın; `*-api.ts` + React Query'ye geç (B6)
6. **TypeScript loose** — B1 sonrası kademeli sıkılaştır; ~103 `as any` temizle (B7)
7. **`no-unused-vars` ESLint kapalı** — warn seviyesinde aç (B8)
8. **Test coverage parçalı** — `AdminMembersPage.test.tsx` kırık (B3); Playwright E2E pasif (kayıt/profil/catalog claim)
9. **Yeni kullanıcı trigger** — `20260609015000` ile düzeltildi; yeni kayıt akışı `welcome/activate` üzerinden test edilmeli

**Zaten yapıldı:** App.tsx modüler (~75 lazy), tek Supabase client, legacy auth tabloları drop edildi (tek sistem), `admin.ts` → `admin/` domain modüllerine bölündü.

---

## 12. Yeni Özellik Eklerken Kontrol Listesi

```
[ ] Data: lib/*-api.ts + React Query mı? (component içi fetch değil)
[ ] Zod schema: lib/*-schemas.ts'de mi?
[ ] Route: App.tsx'e mi yoksa feature routes.tsx'e mi?
[ ] SEO URL değişikliği var mı? (olmamalı)
[ ] Migration eklendi mi? (sil/sırala değil, ekle)
[ ] RLS policy'ler test edildi mi?
[ ] Turkish domain termler korundu mu?
[ ] profiles / user_profiles / admin_users tablolarına referans YOK mu? (kalktı)
[ ] Yetki için is_admin() / is_moderator() RPC mi kullanılıyor?
[ ] Cadde içeriğine dokunuyorsa: mutation RPC'de mi? Yeni hata kodu cadde-rules.ts haritasında mı?
[ ] Cadde'ye yeni içerik tablosu eklendiyse: diaspora_key + CHECK + feed/list filtresi var mı?
[ ] SQL↔TS ayna sözleşmelerinden birine dokunulduysa karşı taraf da güncellendi mi?
```

---

## 13. Catalog/Flat-Role/AFS Rebuild — Son Migrations (2026-06-09/10)

**18 rebuild migration + 4 replay-safety fix canlıya alındı (Phase 1–8, 2026-06-09).** Rapor: `docs/catalog-role-afs-rebuild/12-migration-push-report.md`, `14-changed-files.md`.

```
# ── Legacy auth temizliği (önceki temizlik) ──
20260609003000_drop_legacy_tables.sql           # profiles, user_profiles, admin_users, role_feature_defaults DROP
20260609015000_fix_catalog_profile_trigger_post_drop.sql  # handle_auth_user_catalog_profile → user_role_assignments

# ── Catalog/AFS Rebuild (002–017) ──
20260609100000_rebuild_002_catalog_items.sql
20260609100100_rebuild_003_flat_roles.sql            # 76 flat rol, aile yok
20260609100200_rebuild_004_afs_catalogs.sql          # afs_attributes/features/sections
20260609100300_rebuild_005_role_afs_relations.sql    # role_attributes/features/sections
20260609100400_rebuild_006_item_values_and_overrides.sql
20260609100500_rebuild_007_claims_and_managers.sql   # catalog_item_claims/managers
20260609100600_rebuild_008_item_roles_indexes_constraints.sql
20260609100700_rebuild_009_rls_policies.sql
20260609100800_rebuild_010_public_owner_admin_rpc.sql
20260609100900_rebuild_010c_backend_rewire.sql       # 40 fn → yeni tablo adları
20260609101000..101400_rebuild_011..015              # seed: flat roles, AFS catalogs, role-AFS matrix, placeholder items, verify
20260609101500_rebuild_016_drop_legacy_schema.sql    # eski catalog/taxonomy şeması DROP (prod-only FK blocker'lar dahil)
20260609101600_rebuild_017_post_cleanup_verification.sql
20260609110000_rebuild_status_report_rpc.sql         # Durum Raporu RPC

# ── Sonrası ──
20260610090000_remove_diplomatic_profiles_and_missions.sql  # /admin/consulates seed temizliği
20260610120000_seed_command_center_meeting10.sql            # workspace meeting seed
```

**Rebuild özeti (canlıda doğrulandı):**
- **76 flat rol** (0 legacy) — `family_key` / `parent_role_id` kaldırıldı
- **AFS = Attributes(53) / Features(42) / Sections(7)** — her rol → explicit map
- 9 tablo AFS adlarına rename edildi; `*_details` ve item-type sistemi DROP edildi (bkz. §6)
- **239 catalog item** (163 gerçek + 76 placeholder)
- 44+ DB fonksiyonu yeni tablo adlarına rewire edildi
- Runtime kodda eski tablo adı / aile konsepti **0 referans** (`13-post-cleanup-grep-report.md`)
- **Durum Raporu:** `src/pages/admin/AdminDurumRaporuPage.tsx` (`/admin/new-member/durum-raporu`) → `rebuild_status_report` RPC ile canlı metrik gösterir

**Önceki 2026-06-09 legacy-auth temizliği:** `profiles`/`user_profiles`/`admin_users`/`role_feature_defaults` DROP; tüm RPC'ler `auth.users` + `user_profile_attributes` + `user_role_assignments` üzerinden; `is_admin()`/`is_moderator()` güncellendi; yeni-kullanıcı trigger'ı otomatik `bireysel` rolü atar.

---

## 14. Daha Fazla Detay İçin

| Konu | Dosya |
|------|-------|
| **Tek ana mimari doküman** | **`ARCHITECTURE.md` (kök)** |
| Durum panosu + kullanım senaryoları | `rapor.html` (kök) |
| Cadde 3.0 kapanış raporu + kalan işler | `docs/cadde-300/change-report.md` |
| Cadde 3.0 spec / envanter / devir notu | `docs/cadde-300/` |
| Catalog/Flat-Role/AFS rebuild raporları | `docs/catalog-role-afs-rebuild/` (00–14) |
| Eski mimari dokümanlar (arşiv) | `docs/archive/architecture/` (AI_TECHNICAL_REFERENCE, SISTEM_MIMARI, vb.) |
| Aktif planlar | `docs/plans/` (admin-v2 masterplan + handoff burada) |
| Modül belgeleri | `docs/modules/<modul>/` |
| Geçmiş raporlar / eski handoff'lar | `docs/history/`, `docs/archive/` |
| docs indeksi | `docs/README.md` |
