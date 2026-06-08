# CorteQS — Agent Context Dosyası

> Bu dosya, yeni bir agent oturumunun projeyi hızla kavraması için hazırlanmıştır.
> Diğer teknik belgelerden bilgi derleyerek token maliyetini minimize eder.
> **Güncelleme:** 2026-06-09

---

## 1. Proje Özeti

**CorteQS Landing** — React 18 + Vite 5 + Supabase SPA. ODTÜ mezunları ve Türk diasporası topluluğu platformu.

- URL: `https://corteqs.net`
- Supabase Project ID: `injprdrsklkxgnaiixzh`
- Deploy: Docker / Coolify → `npm run build` → `node server.mjs`
- ~90 public sayfa, ~30 admin sayfası, ~50 lib modülü, 188 migration, 49+ test dosyası

### Modüller (tek SPA içinde)

| Modül | Path | Açıklama |
|-------|------|----------|
| Landing | `/`, `/about`, `/founders`, `/cadde` | Kurumsal tanıtım |
| Lansman | `/lansman` | Startup/girişim kayıt formu |
| Anketler | `/anket`, `/admin/surveys/*` | Admin yönetimli anket |
| Muhasebe | `/admin/muhasebe/*` | Gelir/gider/nakit akışı |
| Dizin | `/directory/*` | Üye profil dizini |
| Ticari | `/commercial/<slug>` | Standalone partner sayfaları |
| Workspace | `/admin/workspace/*` | Komuta merkezi, todo, kaynaklar |
| May19 | `/19051919`, `/may19/*` | Anma kampanyası |
| Catalog | `/admin/data` | Unified catalog + üye yönetimi |
| RolesGo | `/admin/new-member/*` | Rol/attribute/feature/section yönetimi |

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
├── App.tsx                  # Tüm 80+ route tek dosyada (refactor hedefi)
├── main.tsx                 # hydrateRoot/createRoot switch
├── pages/
│   ├── admin/
│   │   ├── muhasebe/        # routes.tsx ile modülerize (ÖRNEK AL)
│   │   ├── workspace/
│   │   └── surveys/
│   └── ...                  # Public sayfalar
├── components/
│   ├── ui/                  # shadcn primitives — DOKUNMA
│   ├── auth/                # AuthProvider, RequireAuth, RequireFeature
│   ├── admin/muhasebe/      # Muhasebe UI kapsülü
│   └── profile/, surveys/, may19/, chat/
├── lib/
│   ├── muhasebe-*.ts        # api, schemas, format, aggregations — REFERANS PATTERN
│   ├── member-profile*.ts   # Profil API katmanı (member-profile-api.ts tercih)
│   ├── catalog-*.ts         # Katalog veri katmanı
│   ├── profile-*.ts         # Profil view model, helpers, types
│   ├── independent-profiles.ts / individual-profile.ts
│   ├── supabase.ts          # Custom client (duplikasyon riski)
│   ├── admin.ts             # is_admin() kontrolü — eski tablo kalktı, is_admin() RPC'ye bağlı
│   ├── features.ts          # Feature flag yardımcıları
│   └── dashboard/           # Workspace data layer
├── hooks/                   # use-mobile, use-toast, useMuhasebe
├── integrations/supabase/
│   └── client.ts            # Lovable-generated — RİSKLİ, DOKUNMA
└── contexts/
    └── AuthContext.tsx       # ORPHANED — App.tsx'e mount edilmemiş, KULLANMA
```

---

## 4. Auth & Yetkilendirme

### ÖNEMLİ: İki AuthProvider var, biri ölü

| | `src/components/auth/` | `src/contexts/AuthContext.tsx` |
|--|------------------------|-------------------------------|
| App.tsx'e mount? | **EVET** (canonical) | **HAYIR** (orphaned) |
| Kullan mı? | **EVET** | **HAYIR** |

**Doğru import:**
```ts
import { useAuth } from "@/components/auth/useAuth";
```

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

### İki Supabase Client (sorun)

- `src/integrations/supabase/client.ts` — Lovable-generated, type'lı
- `src/lib/supabase.ts` — custom re-export

Yeni kod için `src/integrations/supabase/client.ts`'i kullan, `lib/supabase.ts`'e dokunma.

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
| `src/App.tsx` | Tüm route'lar burada — şişkin, refactor hedefi |
| `src/main.tsx` | hydrateRoot/createRoot switch |
| `src/components/auth/AuthProvider.tsx` | Session yönetiminin kalbi |
| `src/components/auth/useAuth.ts` | Canonical auth hook — buradan import et |
| `src/contexts/AuthContext.tsx` | **KULLANMA** — orphaned provider |
| `src/integrations/supabase/client.ts` | Lovable-generated — değiştirme |
| `src/lib/muhasebe-*.ts` | Referans mimari pattern |
| `src/lib/admin.ts` | `is_admin()` / `is_moderator()` wrappers |
| `src/lib/features.ts` | Feature flag yardımcıları |
| `src/lib/member-profile-api.ts` | Üye profil API katmanı (tercih edilen) |
| `src/lib/catalog-directory.ts` | Dizin arama veri katmanı |
| `vite.config.ts` | Standalone HTML emit — dokunma |
| `server.mjs` | Production runtime |
| `supabase/migrations/20260512103000_security_hardening_phase1.sql` | Güvenlik baseline |
| `supabase/migrations/20260609003000_drop_legacy_tables.sql` | Legacy tablo temizliği |

---

## 10. Dokunulmayacak / Kırılmayacak Şeyler

1. **SEO kilitli URL'ler:** `/lansman`, `/cadde`, `/19051919`, `/anket`, `/commercial/<slug>`, `/founders` — path değiştirilemez
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

1. **`src/App.tsx` monolitik** — 80+ route tek dosyada, lazy loading yok; muhasebe `routes.tsx` pattern'ini yay
2. **Çift Supabase client** — `integrations/client.ts` + `lib/supabase.ts`; tek kaynağa indir
3. **Karışık data fetching** — React Query + `*-api.ts` standardına geç
4. **TypeScript loose** — `strict` kademeli açılabilir
5. **Test coverage parçalı** — yeni modüllerde (RolesGo, catalog, profile-v2) düşük
6. **`no-unused-vars` ESLint kapalı** — ölü kod tespiti için açılmalı
7. **Playwright E2E pasif** — kritik flow'lar için aktive edilmeli
8. **`src/contexts/AuthContext.tsx` orphaned** — referans veren 38 component hâlâ var, temizlenmeli

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

## 13. Son Migrations (2026-06-09)

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
20260609011000_fix_unified_records_role_param.sql
20260609012000_fix_bucket_stats_rpc.sql
20260609013000_fix_catalog_rpcs_post_legacy_drop.sql  # catalog RPC'leri auth.users'a taşıdı
```

**2026-06-09 büyük temizlik özeti:**
- Legacy tablolar `profiles`, `user_profiles`, `admin_users`, `role_feature_defaults` DROP edildi
- Tüm RPC'ler `auth.users` + `user_profile_attributes` + `user_role_assignments` üzerinden çalışıyor
- Profil verisi canonical olarak `user_profile_attributes` tablosunda yaşıyor
- `is_admin()` / `is_moderator()` fonksiyonları güncellendi (artık `admin_users` tablosu yok)

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
