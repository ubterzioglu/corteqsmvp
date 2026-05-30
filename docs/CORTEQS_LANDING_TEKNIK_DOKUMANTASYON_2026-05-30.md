# CorteQS Landing — Teknik Dokümantasyon

**Tarih:** 2026-05-30  
**Versiyon:** main @ `d2d29ff`  
**Proje:** `corteqs_fin` — React + Vite + Supabase SPA  
**URL:** https://corteqs.net  
**Supabase Project ID:** `injprdrsklkxgnaiixzh`

---

## İçindekiler

1. [Genel Bakış](#1-genel-bakış)
2. [Tech Stack ve Sürümler](#2-tech-stack-ve-sürümler)
3. [Proje Yapısı](#3-proje-yapısı)
4. [Sayfa ve Route Envanteri](#4-sayfa-ve-route-envanteri)
5. [Özellik Modülleri](#5-özellik-modülleri)
6. [Veri Katmanı](#6-veri-katmanı)
7. [Veritabanı (Supabase)](#7-veritabanı-supabase)
8. [Edge Functions](#8-edge-functions)
9. [Kimlik Doğrulama ve Yetkilendirme](#9-kimlik-doğrulama-ve-yetkilendirme)
10. [Frontend Mimarisi](#10-frontend-mimarisi)
11. [Test Altyapısı](#11-test-altyapısı)
12. [Deployment ve Ortam](#12-deployment-ve-ortam)
13. [Güvenlik](#13-güvenlik)
14. [Bilinen Teknik Borçlar](#14-bilinen-teknik-borçlar)
15. [Son Değişiklikler (2026-05-30)](#15-son-değişiklikler-2026-05-30)

---

## 1. Genel Bakış

CorteQS Landing, ODTÜ mezunları ve Türk diasporası topluluğu için geliştirilmiş çok amaçlı bir React SPA'dır. Tek bir uygulama içinde şu modülleri barındırır:

| Modül | Açıklama |
|-------|----------|
| **Lansman** | Startup/girişim kayıt ve başvuru formu |
| **Cadde** | Topluluk marketplace'i (şehir bazlı sosyal feed) |
| **Muhasebe** | Admin için gelir/gider/nakit akışı takibi |
| **Anketler** | Admin tarafından yönetilen anket sistemi |
| **Dizin** | Üye profil dizini |
| **Topluluk (AddCom)** | WhatsApp/Telegram/Discord grup listeleme ve katılma |
| **19 Mayıs** | Atatürk anma kampanyası |
| **Ticari** | Partner/sponsor sayfaları (standalone HTML) |
| **Workspace** | Admin çalışma alanı (komuta merkezi, kaynaklar, MVPs) |

**Metrikler:**
- ~90 public sayfa
- ~30 admin sayfası
- ~42 lib modülü
- 122 Supabase migration
- 49 test dosyası

---

## 2. Tech Stack ve Sürümler

### Runtime ve Build

| Paket | Sürüm |
|-------|-------|
| React | ^18.3.1 |
| React DOM | ^18.3.1 |
| TypeScript | ^5.8.3 |
| Vite | ^5.4.19 |
| @vitejs/plugin-react-swc | ^3.11.0 |
| Node.js (runtime) | 22 (Alpine) |

### Routing ve State

| Paket | Sürüm |
|-------|-------|
| react-router-dom | ^6.30.1 |
| @tanstack/react-query | ^5.83.0 |
| @tanstack/react-table | ^8.21.3 |

### Backend / Database

| Paket | Sürüm |
|-------|-------|
| @supabase/supabase-js | ^2.101.1 |

### Form ve Validasyon

| Paket | Sürüm |
|-------|-------|
| react-hook-form | ^7.61.1 |
| @hookform/resolvers | ^3.10.0 |
| zod | ^3.25.76 |

### UI

| Paket | Sürüm |
|-------|-------|
| Tailwind CSS | ^3.4.17 |
| Radix UI (tüm bileşenler) | ~1.1–2.2 |
| lucide-react | ^0.462.0 |
| sonner (toast) | ^1.7.4 |
| next-themes | ^0.3.0 |
| class-variance-authority | ^0.7.1 |
| tailwind-merge | ^2.6.0 |
| recharts | ^2.15.4 |
| embla-carousel-react | ^8.6.0 |
| react-resizable-panels | ^2.1.9 |
| react-simple-maps + d3-geo | ^3.0.0 / ^3.1.0 |
| cmdk | ^1.1.1 |
| vaul | ^0.9.9 |
| input-otp | ^1.4.2 |

### Test

| Paket | Sürüm |
|-------|-------|
| vitest | ^3.2.4 |
| @playwright/test | ^1.57.0 |
| jsdom | ^20.0.3 |
| ESLint | ^9.32.0 |

---

## 3. Proje Yapısı

```
corteqs_fin/
├── src/
│   ├── App.tsx                      # Master route tablosu (monolitik, refactor hedefi)
│   ├── main.tsx                     # Entry point
│   ├── pages/                       # Sayfa bileşenleri
│   │   ├── admin/
│   │   │   ├── muhasebe/            # Muhasebe modülü sayfaları + routes.tsx
│   │   │   ├── workspace/           # Workspace sayfaları
│   │   │   └── surveys/             # Anket admin sayfaları
│   │   └── *.tsx                    # Public sayfalar (~88 dosya)
│   ├── components/
│   │   ├── ui/                      # shadcn/ui primitifleri (elle düzenleme)
│   │   ├── admin/                   # Admin layout ve bileşenleri
│   │   ├── auth/                    # AuthProvider, RequireAuth, RequireFeature
│   │   ├── profiles/                # Profil bileşenleri
│   │   ├── surveys/                 # Anket UI
│   │   ├── may19/                   # 19 Mayıs kampanya bileşenleri
│   │   └── ...                      # Diğer özellik modülleri
│   ├── lib/                         # API katmanı ve yardımcılar (~42 dosya)
│   ├── hooks/                       # Custom React hooks
│   ├── integrations/supabase/
│   │   ├── client.ts                # Lovable-generated Supabase client
│   │   └── types.ts                 # Otomatik üretilen DB tipleri
│   └── test/                        # Test setup
├── supabase/
│   ├── migrations/                  # 122 migration dosyası
│   └── functions/                   # 5 Edge Function
├── docs/                            # Teknik dokümantasyon
├── server.mjs                       # Production HTTP sunucusu
├── vite.config.ts                   # Vite + custom plugin konfigürasyonu
├── Dockerfile                       # Multi-stage build (Node → Nginx)
├── nixpacks.toml                    # Nixpacks deployment konfigürasyonu
└── package.json
```

---

## 4. Sayfa ve Route Envanteri

### Public Rotalar (`<PublicLayout>`)

| Path | Bileşen | Notlar |
|------|---------|--------|
| `/` | Index | Landing sayfası |
| `/founders` | FoundersCombinedPage | Kurucu + hakkımızda |
| `/radar` | RadarPage | |
| `/commercial/:slug` | CommercialDocumentPage | Standalone HTML enjeksiyonu |
| `/diaspora/:slug` | DiasporaDetailPage | |
| `/lansman` | LansmanPage | **SEO-kilitli URL** |
| `/founding-1000` | Founding1000Page | |
| `/blogger-yarismasi` | BloggerContestPage | |
| `/vlogger-yarismasi` | VloggerContestPage | |
| `/19051919` | May19CampaignPage | **SEO-kilitli URL** |
| `/19051919/harita` | May19MapPage | |
| `/190519idea` | May19IdeaPage | |
| `/190519memory` | May19MomentPage | |
| `/addcom` | AddWhatsAppPage | Topluluk listeleme — **SEO-kilitli URL** |
| `/anket` | SurveysPage | **SEO-kilitli URL** |
| `/anket/:slug` | SurveyDetailPage | |
| `/cadde` | CaddePage | **SEO-kilitli URL** |
| `/directory` | DirectoryPage | |
| `/directory/profile/:userId` | DirectoryProfilePage | |
| `/profile` | ProfileResolverPage | `<RequireAuth>` |
| `/login` | LoginPage | |
| `/privacy-policy` | PrivacyPolicyPage | |
| `/reset-password` | ResetPasswordPage | |

**Redirect'ler:** `/addwa`, `/whatsapp-groups` → `/addcom`; `/contributor`, `/influencer-partner`, vb. → `/commercial/<slug>`

### Admin Rotaları (`<AdminLayout>` + `<RequireAuth>`)

| Path | Bileşen |
|------|---------|
| `/admin` | AdminHomePage |
| `/admin/members` | AdminMembersPage |
| `/admin/lansman` | AdminLansmanPage |
| `/admin/referral/*` | Referral alt modülü |
| `/admin/cadde` | AdminCaddePage |
| `/admin/surveys/*` | Anket yönetimi |
| `/admin/new-member/*` | Rol/özellik/profil yönetimi |
| `/admin/whatsapp-landings` | AdminWhatsAppLandingsPage |
| `/admin/workspace/*` | Workspace modülü |
| `/admin/muhasebe/*` | Muhasebe modülü (routes.tsx'ten) |
| `/admin/may19/*` | 19 Mayıs admin sayfaları |

> **Not:** Tüm 80+ rota `src/App.tsx`'te tanımlı. Muhasebe istisnası: `src/pages/admin/muhasebe/routes.tsx` ayrı route modülü.

---

## 5. Özellik Modülleri

### Muhasebe (Referans Mimari)

Projedeki en iyi organize edilmiş modül — yeni özellikler bu pattern'ı takip etmeli:

```
src/
├── lib/
│   ├── muhasebe-api.ts           # Supabase sorguları ve mutasyonlar
│   ├── muhasebe-schemas.ts       # Zod tipleri + z.infer
│   ├── muhasebe-format.ts        # Görüntüleme formatlaması
│   └── muhasebe-aggregations.ts  # İş mantığı
└── pages/admin/muhasebe/
    ├── GelirlerPage.tsx          # Gelir yönetimi
    ├── GiderlerPage.tsx          # Gider yönetimi
    ├── MuhasebeDashboard.tsx     # KPI kartları ve özet
    ├── NakitAkisiPage.tsx        # Nakit akışı görünümü
    ├── MuhasebeLayout.tsx        # Modül layout
    └── routes.tsx                # Modül route tanımları
```

### Topluluk/AddCom (`/addcom`)

| Dosya | Rol |
|-------|-----|
| `src/pages/AddWhatsAppPage.tsx` | Ana sayfa (1393 satır — refactor hedefi) |
| `src/lib/whatsapp-landings.ts` | API katmanı |
| `src/components/admin/WhatsAppLandingsModeration.tsx` | Admin moderasyon |
| `src/pages/admin/AdminWhatsAppLandingsPage.tsx` | Admin sayfa wrapper |
| `supabase/migrations/20260515120000_add_whatsapp_landings.sql` | Tablo şeması |
| `supabase/migrations/20260530120000_add_badge_columns_to_whatsapp_landings.sql` | Badge sütunları |

**Badge sistemi (2026-05-30 güncellendi):**
- `member_approved BOOLEAN NOT NULL DEFAULT false` — "Üye onaylı!" rozeti
- `admin_approved BOOLEAN NOT NULL DEFAULT false` — "Admin onaylı!" rozeti
- CHECK kısıtı: `NOT (member_approved AND admin_approved)` — aynı anda ikisi birden olamaz
- Admin edit formunda: "Üye onaylı!" / "Admin onaylı!" / "Yok (badge yok)" (3 seçenek)

**Platform desteği:** WhatsApp, Telegram, Discord, Facebook, Instagram, LinkedIn, X, TikTok, YouTube, Reddit

### Cadde

Türk diasporası için şehir bazlı topluluk marketplace'i. 2026-05-29'da oluşturuldu.

**Tablolar:** `cadde_countries`, `cadde_cities`, `cadde_posts`, `cadde_post_reactions`, `cadde_post_comments`, `cadde_cafes`, `cadde_cafe_members`, `cadde_billboard_cards`, `cadde_sponsored_placements`

**Post tipleri:** text, question, offer, event  
**Tepki tipleri:** like, support, idea

### Anketler

**Tablolar:** `surveys`, `survey_questions`, `survey_responses`  
**Edge Function:** `submit-survey-response`  
**Admin:** Oluşturma, düzenleme, yanıt görüntüleme

### Lansman

Startup kayıt formu. **SEO-kilitli URL:** `/lansman`

**Edge Functions:** `lansman-admin` (admin bildirimleri), `send-submission-email`

### RolesGo (Yeni Auth Sistemi — Mayıs 2026 MVP)

Eski `admin_users` tablosu yerini `user_profiles_v2` + `rolesgo_*` tablolarına bırakıyor.

| Tablo | Açıklama |
|-------|----------|
| `user_profiles_v2` | Ana profil kaydı |
| `attribute_catalog` | Tanımlı profil attribute'ları |
| `role_attribute_rules` | Role göre attribute kuralları |
| `user_profile_attributes` | Kullanıcıya ait attribute değerleri |
| `taxonomy_groups` | Taksonomi grupları (single/multiple seçim) |
| `taxonomy_options` | Taksonomi seçenekleri |
| `user_taxonomy_selections` | Kullanıcı seçimleri |
| `approval_requests` | Onay akışı |

> **Durum:** Eski ve yeni sistem birlikte çalışıyor. Canonical yön henüz netleşmedi — profil mantığına dokunmadan önce sormak gerekiyor.

---

## 6. Veri Katmanı

### İki Supabase Client

```typescript
// 1. Lovable-generated (tip tanımları var) — TERCİH EDİLEN
import { supabase } from "@/integrations/supabase/client";

// 2. Custom re-export — eski kod
import { supabase } from "@/lib/supabase";
```

> **Hedef:** Tek kaynak. `src/integrations/supabase/client.ts` canonical olmalı.

### Üç Veri Çekme Pattern'ı

| Pattern | Örnek | Durum |
|---------|-------|-------|
| **Direct component fetch** | `supabase.from('table').select()` bileşen içinde | Anti-pattern, kaçınılmalı |
| **API modül katmanı** | `src/lib/*-api.ts` | Tercih edilen |
| **React Query** | `useQuery` + `useMutation` | En iyi, az kullanılıyor |

**Kural:** Yeni özellikler `src/lib/*-api.ts` + React Query kullanmalı.

### lib/ Modülleri

| Dosya | Sorumluluk |
|-------|-----------|
| `muhasebe-api.ts` | Muhasebe Supabase sorguları |
| `muhasebe-schemas.ts` | Muhasebe Zod şemaları |
| `muhasebe-aggregations.ts` | Muhasebe iş mantığı |
| `muhasebe-format.ts` | Muhasebe görüntüleme |
| `whatsapp-landings.ts` | Topluluk listeleme API |
| `lansman.ts` | Lansman başvuru API |
| `surveys.ts` + `survey-responses.ts` | Anket API |
| `cadde.ts` | Cadde API |
| `submissions.ts` | Genel başvuru API |
| `member-profile-api.ts` | Üye profil API |
| `referral-codes.ts` | Referans kodu API |
| `features.ts` | Özellik bayrağı yönetimi |
| `security.ts` | Güvenlik yardımcıları |
| `text-normalization.ts` | Türkçe metin normalizasyonu |
| `admin.ts` | Admin yardımcı fonksiyonlar |
| `ragApi.ts` | RAG chat proxy |
| `utils.ts` | Genel yardımcılar |

---

## 7. Veritabanı (Supabase)

### Temel Tablolar

| Tablo | Açıklama |
|-------|----------|
| `public.submissions` | Ana başvuru tablosu (lansman vb.) |
| `public.surveys` | Anket tanımları |
| `public.survey_questions` | Anket soruları |
| `public.survey_responses` | Anket yanıtları |
| `public.whatsapp_landings` | Topluluk listeleri |
| `public.whatsapp_join_requests` | Topluluk katılma talepleri |
| `public.muhasebe_gelirler` | Gelir kayıtları |
| `public.muhasebe_giderler` | Gider kayıtları |
| `public.admin_users` | Eski admin sistemi |
| `public.user_profiles_v2` | Yeni profil sistemi |
| `public.attribute_catalog` | Profil attribute tanımları |
| `public.user_profile_attributes` | Kullanıcı attribute değerleri |
| `public.approval_requests` | Onay akışı |
| `public.taxonomy_groups` | Taksonomi grupları |
| `public.taxonomy_options` | Taksonomi seçenekleri |
| `public.lansman_registrations` | Lansman etkinlik kayıtları |
| `public.cadde_posts` | Cadde gönderileri |
| `public.cadde_cafes` | Cadde kafeler |
| `public.resource_entries` | Admin workspace kaynakları |
| `public.command_center_items` | Komuta merkezi görevleri |
| `public.marquee_items` | Şerit duyuruları |
| `public.may19_campaign_submissions` | 19 Mayıs kampanya |
| `public.founding_1000_signups` | Founding 1000 kayıtları |

### Migration Geçmişi Özeti

**122 migration** — Mart 2026'dan itibaren:

| Dönem | Kapsam |
|-------|--------|
| Mart 2026 | Temel altyapı |
| Nisan 2026 | Admin workflow, muhasebe modülü, referral sistemi |
| Mayıs 2026 (1-2. hafta) | Güvenlik sertleştirme, Edge Functions, Lansman kayıtları |
| Mayıs 2026 (3. hafta) | Workspace, Anket modülü, 19 Mayıs, Topluluk hero görselleri |
| Mayıs 2026 (4. hafta) | User Profiles v2, RolesGo MVP, Taxonomy sistemi, Cadde modülü |
| 30 Mayıs 2026 | Admin profil düzenleme RPC'leri, **Topluluk badge sütunları** |

### Son 5 Migration (2026-05-30)

**`20260530120000_add_badge_columns_to_whatsapp_landings.sql`**
- `member_approved BOOLEAN NOT NULL DEFAULT false` eklendi
- `admin_approved BOOLEAN NOT NULL DEFAULT false` eklendi
- Mevcut `description` metin etiketlerinden backfill yapıldı
- `chk_single_badge` CHECK kısıtı eklendi (`NOT VALID` + `VALIDATE` pattern)

**`20260530093000_add_admin_edit_profile_data_rpcs.sql`**
- `admin_update_user_profile_attribute()` PL/pgSQL fonksiyonu
- `admin_update_user_taxonomy_selection()` PL/pgSQL fonksiyonu
- Audit logging dahil, `security definer` ile

**`20260529213000_create_cadde_mvp.sql`**
- Cadde modülü için 9 tablo oluşturuldu
- 5 ülke (DE, NL, GB, US, TR) için demo veri eklendi

**`20260525230000_profile_sections_and_taxonomy_phase2.sql`**
- Profile section kataloğu
- Taxonomy sistemi (group + option + user selection)
- Role bazlı profile section kuralları

**`20260525000000_rolesgo_role_attribute_approval_mvp.sql`**
- RolesGo MVP: attribute catalog, role attribute rules
- User profile attributes (visibility + approval_status)
- Onay akışı tablosu

### RLS Politikaları

Tüm tablolarda RLS aktif. Genel pattern:

```sql
-- Public okuma (approved kayıtlar)
SELECT WHERE status = 'approved'

-- Kendi kaydını ekleme
INSERT WHERE user_id = auth.uid()

-- Kendi kaydını görme/silme
SELECT/DELETE WHERE user_id = auth.uid()

-- Admin tam erişim
ALL WHERE EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
```

> **Uyarı:** `submissions` tablosunun insert politikası birden fazla kez sıfırlandı (bakınız: migration'lar 20260519*). Dokunmadan önce dikkatli olunmalı.

### Storage Bucket'ları

| Bucket | Amaç | Limit |
|--------|------|-------|
| `whatsapp-landing-hero` | Topluluk hero görselleri | 5 MB, JPEG/PNG/WebP/GIF |
| `submission-documents` | Başvuru dokümanları | — |
| `avatars` | Profil fotoğrafları | — |
| `may19-*` | 19 Mayıs kampanya medyaları | — |

### PL/pgSQL Fonksiyonları

| Fonksiyon | Açıklama |
|-----------|----------|
| `admin_update_user_profile_attribute()` | Güvenli attribute güncelleme |
| `admin_update_user_taxonomy_selection()` | Taksonomi seçimi |
| `admin_set_user_profile_type()` | Profil tipi atama |
| `debug_policy_check()` | Kaldırıldı (20260519122500) |

---

## 8. Edge Functions

Konum: `supabase/functions/`

| Fonksiyon | Tetikleyici | Açıklama |
|-----------|-------------|----------|
| `send-submission-email` | HTTP POST | Lansman başvuru e-posta bildirimi (Resend) |
| `lansman-admin` | HTTP POST | Admin lansman bildirimleri |
| `submit-survey-response` | HTTP POST | Anket yanıt işleme |
| `find-matches` | HTTP POST | Üye eşleştirme |
| `chat-register` | HTTP POST | Chat kayıt |

**Ortam değişkenleri (Edge Functions):**
- `RESEND_API_KEY` — E-posta gönderimi
- `MAIL_FROM`, `MAIL_TO_ADMIN`, `MAIL_REPLY_TO` — E-posta adresleri
- `SUPABASE_SERVICE_ROLE_KEY` — Admin DB erişimi

---

## 9. Kimlik Doğrulama ve Yetkilendirme

### AuthProvider

`src/components/auth/AuthProvider.tsx` — Supabase session'ı context ile yönetir.

### Route Koruması

| Bileşen | Açıklama |
|---------|----------|
| `<RequireAuth>` | Admin rotaları için zorunlu login |
| `<RequireFeature feature="...">` | Özellik bayrağı bazlı yetkilendirme |

### İki Auth Sistemi

**Eski sistem:**
- `public.admin_users` tablosu
- `role_features` view
- Basit admin/üye ayrımı

**Yeni sistem (RolesGo — Mayıs 2026 MVP):**
- `user_profiles_v2` ana profil tablosu
- `attribute_catalog` + `role_attribute_rules` — granüler attribute kontrolü
- `taxonomy_groups` + `role_taxonomy_rules` — taksonomi yetkilendirme
- `approval_requests` — değişiklik onay akışı

> **Durum:** Her iki sistem birlikte çalışıyor. Canonical yön belirlenmeli.

---

## 10. Frontend Mimarisi

### TypeScript Konfigürasyonu

```json
{
  "strict": false,
  "strictNullChecks": false,
  "noImplicitAny": false,
  "noUnusedLocals": false,
  "noUnusedParameters": false
}
```

Bu ayar kasıtlı bir trade-off — büyük refactor yükünü önlemek için. Yeni kod, `strict: true` gibi yazılmalı.

### Path Alias

```
@/* → src/*
```

### Vite Konfigürasyonu

**Dev sunucusu:**
- Host: `::` (IPv6 localhost)
- Port: `8080`
- Proxy: `/api/chat` → `https://rag.corteqs.net`

**Custom Plugin — `standalone-commercial-documents`:**
- Ticari sayfalar için (`/commercial/:slug`) standalone HTML üretir
- `info-*.html` template'lerinden build zamanı 4 varyant üretir:
  - `commercial/slug/index.html`
  - `commercial/slug.html`
  - `slug/index.html`
  - `slug.html`
- Dev'de middleware ile intercept edilir, build'de Rollup input olarak eklenir

**Dedupe:**
- `react`, `react-dom`, `@tanstack/react-query` deduplication aktif

### Tema Sistemi

- `next-themes` ile dark/light mode
- CSS variable'ları Tailwind ile entegre
- shadcn/ui bileşen primitifleri: `src/components/ui/` (elle düzenlenmemeli)

### Form Pattern'ı

```typescript
// Tercih edilen pattern
const schema = z.object({...});
type FormData = z.infer<typeof schema>;
const form = useForm<FormData>({ resolver: zodResolver(schema) });
```

### Hata Yönetimi

```typescript
try {
  const data = await supabase.from('table').select();
} catch (error: unknown) {
  const message = error instanceof Error ? error.message : 'Beklenmeyen hata';
  toast.error(message);
  console.error(error);
}
```

### Türkçe Domain Terminolojisi

| Terim | Anlam |
|-------|-------|
| muhasebe | accounting |
| gelirler | income |
| giderler | expenses |
| nakit akışı | cash flow |
| lansman | launch/startup registration |
| cadde | street/marketplace |
| kaynak | resource |
| kişi | person |
| oda | room/chamber |
| referans | referral |
| ambasador | ambassador |
| yönetici | admin |

> Bu terimler **değiştirilmemelidir** — domain uyumu ve kullanıcı anlayışı için kritik.

---

## 11. Test Altyapısı

### Framework'ler

| Framework | Amaç |
|-----------|------|
| Vitest | Unit + integration testler |
| @testing-library/react | Bileşen testleri |
| jsdom | DOM ortamı simülasyonu |
| Playwright | E2E testler (yapılandırılmış, az kullanılıyor) |

### Test Komutları

```bash
npm run test                 # Vitest tek seferlik
npm run test:watch           # Watch mode
npm run test -- --ui         # Vitest UI dashboard
npm run test -- --coverage   # Coverage raporu
npm run test -- src/lib/muhasebe-api.test.ts  # Tek dosya
```

### Test Dosyaları (49 adet)

**Route testleri (App.tsx):**
- `App.addwa-routes.test.tsx`, `App.admin-route.test.tsx`, `App.cadde-routes.test.tsx`, vb.

**Lib testleri (birim/entegrasyon):**
- `muhasebe-aggregations.test.ts`, `muhasebe-schemas.test.ts`, `muhasebe-format.test.ts`
- `whatsapp-landings.test.ts`, `lansman.test.ts`, `submissions.test.ts`
- `referral-codes.test.ts`, `cadde.test.ts`, `marquee.test.ts`, vb.

**Bileşen testleri:**
- `AdminLansmanTable.test.tsx`, `LansmanForm.test.tsx`, `SiteHeader.test.tsx`
- `RequireAuth.test.tsx`, `AdminLayout.test.tsx`

**Sayfa testleri:**
- `GelirlerPage.test.tsx`, `GiderlerPage.test.tsx`, `MuhasebeDashboard.test.tsx`
- `AddWhatsAppPage.test.tsx`, `CaddePage.test.tsx`, `LansmanPage.test.tsx`, vb.

### İyi Test Örnekleri

- `src/lib/muhasebe-*.test.ts` — Aggregation ile entegrasyon testleri
- `src/lib/lansman.test.ts` — Domain mantığı testi
- `src/components/AdminLansmanTable.test.tsx` — Bileşen testi

---

## 12. Deployment ve Ortam

### Ortam Değişkenleri

```env
# Build-time (VITE_ prefix — frontend'e gönderilir)
VITE_SUPABASE_URL=https://injprdrsklkxgnaiixzh.supabase.co
VITE_SUPABASE_ANON_KEY=...
VITE_SUPABASE_PROJECT_ID=injprdrsklkxgnaiixzh
VITE_SUPABASE_PUBLISHABLE_KEY=...   # ANON_KEY ile aynı

# Runtime (server.mjs — asla frontend'e gönderilmez)
SUPABASE_SERVICE_ROLE_KEY=...
RAG_API_SECRET=...
GEMINI_API_KEY=...
RESEND_API_KEY=...
MAIL_FROM=...
MAIL_TO_ADMIN=...
MAIL_REPLY_TO=...
MAIL_SEND_CONFIRMATION=true
```

### Build Pipeline

```bash
npm install    # Bağımlılık kurulumu
npm run build  # Vite build → dist/
npm run start  # node server.mjs (production)
```

### Docker (Nginx)

```dockerfile
# Stage 1: Build
FROM node:22-alpine AS builder
RUN npm ci && npm run build

# Stage 2: Runtime
FROM nginx:1.27-alpine
COPY nginx.conf.template /etc/nginx/templates/
COPY docker-entrypoint-env.sh /docker-entrypoint.d/
COPY --from=builder /dist /usr/share/nginx/html
EXPOSE 80
```

### Nixpacks (Node.js)

```toml
[phases.setup]
nixPkgs = ["nodejs_22"]

[phases.install]
cmds = ["npm ci"]

[phases.build]
cmds = ["npm run build"]

[start]
cmd = "npm run start"  # → node server.mjs
```

### server.mjs (Production HTTP Sunucusu)

`server.mjs` — 278 satır Node.js HTTP sunucusu:

**Özellikler:**
- Statik dosyalar `dist/` klasöründen sunulur
- `/api/chat` → `https://rag.corteqs.net/api/chat` proxy (15s timeout, 32KB limit)
- Rate limiting: 12 istek / 60 saniye / IP
- Runtime env injection: `dist/env-config.js` → `window.__APP_CONFIG__`
- SPA fallback: uzantısız route'lar → `index.html`

**Cache politikası:**
- `index.html`, `env-config.js`: `no-cache, no-store`
- `/assets/*`: `max-age=31536000, immutable`

**Güvenlik başlıkları:**
- CSP: self, data:, blob:, Unsplash, Supabase CDN
- HSTS: 1 yıl
- X-Frame-Options: DENY
- COOP/CORP: same-origin

### Deployment Sonrası Doğrulama

```bash
BASE_URL=https://corteqs.net npm run verify:release
```

---

## 13. Güvenlik

### Frontend

- XSS: React JSX otomatik escape + CSP
- CSRF: SameSite cookie (Supabase default)
- Sensitive data: `SUPABASE_SERVICE_ROLE_KEY` asla frontend'e gönderilmez
- Rate limiting: chat endpoint, server tarafında

### Database (RLS)

- Tüm tablolarda RLS aktif
- Service role key sadece Edge Functions'da
- Migration `20260512103000_security_hardening_phase1.sql` güvenlik baseline'ı tanımlar

### Bilinenler ve Dikkat Edilmesi Gerekenler

- `submissions` tablosu insert politikası birden fazla reset gördü — dikkatli olunmalı
- RLS politikaları test ortamında doğrulanmalı (production'a push edilmeden önce)
- `lovable-tagger` bileşeni production build'de devre dışı bırakılmalı (dev-only)

---

## 14. Bilinen Teknik Borçlar

| Borç | Öncelik | Notlar |
|------|---------|--------|
| `src/App.tsx` monolitik | Orta | 80+ route tek dosyada. Muhasebe pattern'ı (routes.tsx) modelden alınmalı |
| Çift Supabase client | Düşük | `integrations/supabase/client.ts` canonical yapılmalı |
| Karışık veri çekme | Orta | Direct fetch anti-pattern yaygın. React Query + `*-api.ts` standardizasyonu |
| Code splitting yok | Düşük | `React.lazy` + `Suspense` ile route-based splitting eklenebilir |
| TypeScript gevşek | Düşük | Incremental `strict: true` geçişi mümkün, App.tsx refactor sonrası |
| Test coverage eksik | Orta | E2E testler az. Critical path Playwright testleri gerekli |
| Eski + yeni auth sistemi | Yüksek | `admin_users` vs `user_profiles_v2` — canonical yön belirlenmeli |
| `AddWhatsAppPage.tsx` büyük | Orta | 1393 satır — bileşenlere bölünebilir |
| Supabase types stale riski | Düşük | `supabase gen types` migration sonrası çalıştırılmalı |

---

## 15. Son Değişiklikler (2026-05-30)

### Öne Çıkan: Topluluk Badge Sistemi Yenilendi

**Problem:** Topluluk onay rozetleri (`Üye onaylı!` / `Admin onaylı!`) `description` alanındaki metin etiketleriyle saklanıyordu (`[Badge member: true]`). Bu yaklaşım kırılgan, sorgulanamaz ve tip güvensizdi.

**Çözüm:** Düzgün boolean sütunları + mutual exclusivity kısıtı + UI'da 3. seçenek.

**Etkilenen dosyalar:**

| Dosya | Değişiklik |
|-------|-----------|
| `supabase/migrations/20260530120000_add_badge_columns_to_whatsapp_landings.sql` | Yeni sütunlar, backfill, CHECK kısıtı |
| `src/lib/whatsapp-landings.ts` | Sütunlardan okuma, yazma, doğrulama, dead code temizliği |
| `src/integrations/supabase/types.ts` | Badge sütunları eklendi |
| `src/components/admin/WhatsAppLandingsModeration.tsx` | "Yok (badge yok)" seçeneği, 3 sütunlu grid layout |

**Mimari kararlar:**
- DB kısıtı `NOT VALID` + `VALIDATE` pattern ile (AccessExclusiveLock önlemi)
- `IF NOT EXISTS` ile idempotent migration
- Backfill'de member priority (her ikisi true ise admin false yapılır)
- `parseBooleanTag` fonksiyonu dead code olarak kaldırıldı

### Diğer Değişiklikler (Son 15 Commit)

```
d2d29ff  hadi bakalım                                                 (2026-05-30)
bc3b951  feat: add 'no badge' option to admin edit form               (2026-05-30)
46a4fbe  feat: write badge flags to member_approved/admin_approved    (2026-05-30)
6fbb1f9  fix: remove dead parseBooleanTag, regenerate types           (2026-05-30)
cc616e3  feat: read badge flags from new columns                      (2026-05-30)
60a64e0  feat: add member_approved and admin_approved columns         (2026-05-30)
b401abe  docs: add community badge single-select implementation plan  (2026-05-30)
2320914  docs: add community badge single-select design spec          (2026-05-30)
598b8a6  hadi bakalım                                                 (2026-05-30)
fafc6de  hadi bakalım                                                 (2026-05-30)
ed71573  hadi bakalım                                                 (2026-05-30)
eba2cc1  chore: merge base-landing into main                         (2026-05-30)
28abaa8  feat: overlay secondary repos onto base                     (2026-05-30)
5a80882  feat: import corteqslanding as base                         (2026-05-30)
725af73  chore: add .gitignore, exclude .env.local                   (2026-05-30)
```

---

*Bu doküman `main @ d2d29ff` (2026-05-30) snapshot'ına dayanmaktadır. Sonraki migration veya özellik eklemelerinden sonra ilgili bölümler güncellenmelidir.*
