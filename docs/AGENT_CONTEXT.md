# CorteQS — Agent Context Dosyası

> Bu dosya, yeni bir agent oturumunun projeyi hızla kavraması için hazırlanmıştır.
> Diğer teknik belgelerden bilgi derleyerek token maliyetini minimize eder.
> **Güncelleme:** 2026-06-09 (clean-code refactor sonrası repo gerçekliğiyle senkronlandı)
> **Refactor yol haritası:** `docs/refactor/2026-06-09-refactor-backlog.md` (ertelenen işler B1–B10)

---

## 1. Proje Özeti

**CorteQS Landing** — React 18 + Vite 5 + Supabase SPA. ODTÜ mezunları ve Türk diasporası topluluğu platformu.

- URL: `https://corteqs.net`
- Supabase Project ID: `injprdrsklkxgnaiixzh`
- Deploy: Docker / Coolify → `npm run build` → `node server.mjs`
- ~100 public sayfa, ~35 admin sayfası, ~55 lib modülü, 190+ migration, 55+ test dosyası

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
| Profile | `/profile`, `/profile/:type`, `/profile/catalog/:itemId` | Kullanıcı profil editörü |
| Welcome | `/welcome/activate` | Yeni üye aktivasyon akışı |

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
│   ├── profile/             # EditableProfilesSelector, IndividualPublicView
│   └── profile/, surveys/, may19/, chat/, connections/, messaging/, feed/
├── lib/
│   ├── muhasebe-*.ts        # api, schemas, format, aggregations — REFERANS PATTERN
│   ├── member-profile-api.ts  # Profil API katmanı (TERCIH ET)
│   ├── member-profile.ts    # Profil tipler + helpers
│   ├── catalog-*.ts         # catalog-directory.ts, catalog-entity-api.ts, catalog-types.ts
│   ├── admin-catalog.ts     # Admin catalog data layer
│   ├── profile-*.ts         # profile-view-model, profile-helpers, profile-types, profile-onboarding-*
│   ├── role-catalog.ts      # Rol tanımları veri katmanı
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

### Katalog

```
catalog_items                → Tüm katalog kayıtları (item_type + platform_role_key)
  ├── advisor_details
  ├── business_details
  ├── event_details
  ├── person_profile_details → linked_profile_id ile auth user'a bağlanır
  └── ...
catalog_item_memberships          → owner/editor/viewer yetkileri
catalog_claim_requests            → Sahiplenme talepleri
catalog_audit_logs
```

### Kural Tabloları (Rol → Attribute/Feature/Section)

```
roles                        → Aktif rol tanımları
attribute_catalog            → Attribute sözlüğü
role_attribute_rules         → Hangi attribute hangi rolde aktif/zorunlu/onay gerekli
feature_catalog              → Feature sözlüğü
role_feature_flags           → Hangi feature hangi rolde açık (role_feature_defaults YOK)
profile_section_catalog      → Section sözlüğü
role_profile_section_rules   → Hangi section hangi rolde görünür
taxonomy_groups / options    → Çoktan seçmeli kategori sistemi (runtime kaldırıldı)
role_taxonomy_rules          → Hangi taxonomy grubu hangi rolde aktif
```

### Diğer Önemli Tablolar

```
submissions                  → Form gönderimleri (RLS hassas)
surveys / survey_questions / survey_responses
muhasebe_gelirler / muhasebe_giderler
lansman_basvurular           → Startup başvuruları
referral_codes / referral_uses
marquee_items                → Haber akışı
workspace_resources / workspace_todos / workspace_meetings
geo_countries / geo_cities   → Global coğrafya referansı
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
supabase functions deploy send-submission-email
supabase functions deploy lansman-admin
supabase migrations list
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

1. **SEO kilitli URL'ler:** `/lansman`, `/cadde`, `/19051919`, `/anket`, `/commercial/<slug>`, `/founders`, `/directory`, `/iletisim` — path değiştirilemez
2. **Supabase migration'ları** — silinemez, yeniden sıralanamaz; sadece yeni ekle
3. **`server.mjs`** — env injection ve RAG proxy mantığı
4. **`vite.config.ts`** — standalone HTML emit
5. **`src/components/ui/*`** — shadcn generated, manuel düzenleme yapma
6. **`info-*.html`** kök dizinde kalmalı (Vite plugin input)
7. **Türkçe domain terimleri** — aşağıdaki listeye bak, rename etme

### Türkçe Domain Terimleri (rename etme)

`muhasebe`, `gelirler`, `giderler`, `nakit akışı`, `lansman`, `cadde`, `kaynak`, `kişi`, `oda`, `referans`, `ambasador`, `yönetici`, `anket`, `üye`, `danışman`

---

## 11. Bilinen Teknik Borçlar (öncelik sırasıyla)

> Konsolide, uygulanabilir yol haritası: `docs/refactor/2026-06-09-refactor-backlog.md` (B1–B10).

1. **Generated `supabase/types.ts` senkron değil** — ~164 tsc hatası; `supabase gen types` ile yenile (B1, en yüksek öncelik)
2. **Kırık import'lar** — `@/lib/mapEntities`, `@/lib/radarNews`, `html-to-image` eksik; runtime crash riski (B2)
3. **`AdminLayout.tsx` hâlâ büyük (721 satır)** — alt bileşenlere + `useAdminAccess` hook'una böl (B4)
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
```

---

## 13. Son Migrations (2026-06-08/09)

```
20260608020000_simplify_unified_records_rpc.sql
20260608030000_catalog_as_profile_source_of_truth.sql
20260609000000_backup_member_data.sql
20260609001000_backfill_to_rolesgo.sql          # profiles verisi → user_profile_attributes
20260609002000_update_rpc_remove_rfd.sql
20260609003000_drop_legacy_tables.sql           # profiles, user_profiles, admin_users, role_feature_defaults DROP
20260609003600_fix_directory_opt_in_trigger.sql
20260609004000_set_admin_users.sql
20260609010000_fix_is_moderator_post_legacy_drop.sql
20260609011000_fix_unified_records_role_param.sql    # admin_list_unified_records p_platform_role_key restore
20260609012000_fix_bucket_stats_rpc.sql              # get_submission_documents_bucket_stats → is_admin()
20260609013000_fix_catalog_rpcs_post_legacy_drop.sql # catalog RPC'leri auth.users'a taşıdı
20260609014000_fix_unified_records_ambiguous_columns.sql  # CTE kolon çakışması (42702) düzeltme
20260609015000_fix_catalog_profile_trigger_post_drop.sql  # handle_auth_user_catalog_profile → user_role_assignments
```

**2026-06-09 büyük temizlik özeti:**
- Legacy tablolar `profiles`, `user_profiles`, `admin_users`, `role_feature_defaults` DROP edildi
- Tüm RPC'ler `auth.users` + `user_profile_attributes` + `user_role_assignments` üzerinden çalışıyor
- Profil verisi canonical olarak `user_profile_attributes` tablosunda yaşıyor
- `is_admin()` / `is_moderator()` fonksiyonları güncellendi (artık `admin_users` tablosu yok)
- Yeni kullanıcı kayıt trigger'ı düzeltildi: `on_auth_user_created` → otomatik `bireysel` rolü atar

---

## 14. Daha Fazla Detay İçin

| Konu | Dosya |
|------|-------|
| Mimari (derin) | `docs/architecture/PROJECT_TECHNICAL_OVERVIEW.md` |
| Sistem modeli (roller/attr/feature) | `docs/architecture/SISTEM_MIMARI.md` |
| Aktif planlar | `docs/plans/` |
| Modül belgeleri | `docs/modules/<modul>/` |
| Geçmiş raporlar | `docs/history/` |
| Cleanup audit | `docs/cleanup/2026-05-30/` |
