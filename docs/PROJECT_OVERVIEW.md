# CorteQS — Proje Genel Bakış & Clean Code Rehberi

> **Bu doküman, Gemini'ye clean code uygulaması yaptırmak üzere hazırlanmıştır.**
> Projenin tüm mimari bağlamını, kod düzenini, kalıplarını, kısıtlarını ve iyileştirme alanlarını içerir.
> Güncelleme: 2026-09-27

---

## 1. Proje Özeti

**CorteQS** — Türk diasporası için geliştirilmiş çok modüllü bir topluluk platformudur. Tek bir SPA (Single Page Application) içinde aşağıdaki işlevleri barındırır:

- **Kurumsal landing sayfası** — tanıtım, iletişim, ticari dokümanlar
- **Üye dizini & katalog** — arama, profil görüntüleme, rol bazlı görünürlük
- **Cadde 3.0** — sosyal akış (feed), Cafe (oda sistemi), Çarşı (pazar yeri), Tanıtım (kampanyalar)
- **Anketler** — oluşturma, yanıtlama, sonuç görüntüleme
- **Muhasebe** — gelir/gider/bütçe modülleri (admin)
- **Relocation (yer değiştirme) asistanı** — ülke bazlı göç rehberi, araçlar, hizmetler
- **Workspace** — topluluk işbirliği araçları
- **Admin paneli** — tam yönetim kabuğu (Command Center, katalog, üye yönetimi, moderasyon)
- **AI site asistanı** — bilgi tabanlı sohbet botu (RAG)
- **WhatsApp entegrasyonu** — webhook, bot, landing sayfaları

**Canlı adres:** `corteqs.net`
**Supabase proje ID:** `injprdrsklkxgnaiixzh`

---

## 2. Teknoloji Yığını

| Katman | Teknoloji | Versiyon |
|--------|-----------|----------|
| **Framework** | React | 18.3 |
| **Build** | Vite | 8.2 (SWC) |
| **Dil** | TypeScript | 5.8 (strict KAPALI — bilinçli gevşek) |
| **Stil** | Tailwind CSS + shadcn/ui | 3.4 |
| **State/Data** | @tanstack/react-query | 5.83 |
| **Routing** | react-router-dom | 7.17 |
| **Form** | react-hook-form + zod | 7.61 / 3.25 |
| **Backend** | Supabase (Postgres + RLS + Edge Functions + Auth + Realtime) | — |
| **UI Primitives** | Radix UI (30+ paket) | — |
| **Animasyon** | framer-motion | 12.40 |
| **Grafik** | recharts | 2.15 |
| **İkon** | lucide-react | 0.462 |
| **Test** | Vitest + Testing Library + Playwright | 4.1 / 1.57 |
| **Deploy** | Docker → nginx 1.27-alpine (Coolify) | — |
| **Node** | >= 22 | — |

---

## 3. Proje Büyüklüğü (Ölçülmüş 2026-09-21)

| Metrik | Sayı |
|--------|------|
| `src/` altı `.ts/.tsx` dosya | **1.195** |
| Test dosyası (toplam) | **306** (src: 275, scripts: 19, supabase: 8, workers: 4) |
| Toplam test sayısı | **2.361** |
| Sayfa (`src/pages/`) | **211** |
| Bileşen (`src/components/`) | **447** |
| Lib modülü (`src/lib/`) | **463** |
| Supabase migration | **403** (151 applied + 252 archive) |
| Edge Function kaynak dizini | **13** (10 aktif, 1 deprecated, 2 sadece repo'da) |
| Playwright E2E spec | **10** |
| `App.tsx` satır / lazy import | **329** / **61** |

---

## 4. Dizin Yapısı

```
corteqs_fin/
├── src/
│   ├── App.tsx                    # Ana route tablosu (329 satır, 61 lazy code-split)
│   ├── main.tsx                   # Hydrate/render giriş noktası
│   ├── pages/                     # 79 sayfa dosyası + admin/ ve cadde/ alt dizinleri
│   │   ├── admin/                 # Admin paneli sayfaları
│   │   │   ├── muhasebe/          # Muhasebe modülü (routes.tsx deseni referansı)
│   │   │   ├── cadde/             # Cadde admin sayfaları
│   │   │   └── ...
│   │   ├── cadde/                 # Cadde public sayfaları
│   │   ├── relocation/            # Relocation sayfaları
│   │   └── *.tsx                  # Public sayfalar (Index, Directory, Profile, vb.)
│   ├── components/                # 66 alt dizin/dosya
│   │   ├── ui/                    # shadcn/ui primitives (elle düzenlenmez)
│   │   ├── auth/                  # AuthProvider, useAuth, RequireAuth, RequireFeature
│   │   ├── admin/                 # Admin bileşenleri
│   │   ├── cadde/                 # Cadde bileşenleri
│   │   ├── profile/               # Profil bileşenleri
│   │   └── ...
│   ├── lib/                       # 330 modül — API katmanı, şemalar, yardımcı fonksiyonlar
│   │   ├── muhasebe-*.ts          # Muhasebe modülü (referans mimari)
│   │   ├── cadde-*.ts             # Cadde modülü (en kapsamlı)
│   │   ├── relocation-*.ts        # Relocation modülü
│   │   ├── admin/                 # Admin domain API'leri (7 modül)
│   │   ├── admin-shell/           # Admin kabuk yardımcıları
│   │   ├── agent/                 # AI agent araç kataloğu
│   │   ├── zgen/                  # Zgen modülü
│   │   └── ...
│   ├── hooks/                     # Paylaşılan custom hook'lar
│   ├── contexts/                  # (Büyük ölçüde auth/ altına taşındı)
│   ├── data/                      # Statik veri dosyaları (mock, geo)
│   ├── types/                     # Paylaşılan TypeScript tipleri
│   ├── content/                   # İçerik dosyaları (commercial HTML, relocation i18n)
│   ├── integrations/supabase/     # Supabase client + generated types
│   └── test/                      # Test setup
├── supabase/
│   ├── functions/                 # 13 Edge Function dizini
│   │   ├── _shared/               # Paylaşılan modüller
│   │   ├── send-submission-email/
│   │   ├── send-notification-emails/
│   │   ├── find-matches/
│   │   ├── radar-news-scan/
│   │   ├── relocation-assistant/
│   │   ├── relocation-notifications/
│   │   ├── site-assistant/
│   │   ├── submit-survey-response/
│   │   ├── whatsapp-webhook/
│   │   ├── whatsapp-reply/
│   │   ├── directory-search/
│   │   └── lansman-admin/         # DEPRECATED (HTTP 410)
│   └── migrations/
│       ├── applied/               # 151 migration (çalışan set)
│       └── archive/               # 252 migration (baseline öncesi, SİLİNMEZ)
├── workers/                       # Bağımsız worker servisleri
│   ├── service-finder/            # Hizmet bulma worker'ı
│   └── relocation-ingestion/      # Relocation veri yükleme
├── scripts/                       # Build, import, kontrol scriptleri (MJS)
├── e2e/                           # Playwright E2E testleri
├── docs/                          # Tüm dokümantasyon (41 alt dizin)
├── infra/selfhost/                # Docker Compose (self-host)
├── public/                        # Statik dosyalar
├── nginx.conf.template            # Üretim nginx yapılandırması (TEK kaynak)
├── server.mjs                     # Yerel/Nixpacks sunucusu (PROD RUNTIME DEĞİLDİR)
├── Dockerfile                     # İki aşamalı: node:22-alpine → nginx:1.27-alpine
├── vite.config.ts
├── tailwind.config.ts
├── tsconfig.json                  # strict: false (bilinçli)
├── eslint.config.js
└── package.json
```

---

## 5. Mimari Kalıplar

### 5.1 Feature Modülü Deseni (Muhasebe Referans)

Her özellik modülü şu yapıyı izlemelidir:

```
<modul>/
├── lib/
│   ├── <modul>-api.ts           # Supabase sorguları + mutation sarmalayıcıları
│   ├── <modul>-schemas.ts       # Zod tipleri + z.infer
│   ├── <modul>-types.ts         # Row + domain tipleri
│   ├── <modul>-format.ts        # Görüntüleme formatlaması
│   ├── <modul>-aggregations.ts  # İş mantığı
│   └── <modul>-query-keys.ts    # React Query anahtar fabrikaları
├── pages/
│   └── admin/<modul>/
│       ├── <Modul>Dashboard.tsx
│       ├── <Modul>ListPage.tsx
│       └── routes.tsx            # Modül seviyesi routing
└── components/
    └── admin/<modul>/
        ├── KpiCard.tsx
        └── DialogForms.tsx
```

**Referans uygulamalar:**
- `muhasebe-*` — ilk ve en temiz örnek
- `cadde-*` — en kapsamlı ve güncel örnek

### 5.2 Veri Çekme Kalıpları

Üç stil var, yeni kod için tercih sırası:

1. **API modül katmanı + React Query** (ÖNERİLEN): `src/lib/*-api.ts` + `useQuery`/`useMutation`
2. **Doğrudan API modülü**: `src/lib/*-api.ts` (React Query olmadan)
3. **Component içi fetch** (ANTI-PATTERN): `supabase.from('table').select()` component içinde — **YENİ KODDA YASAK**

### 5.3 Auth & Rol Sistemi

```
Supabase Auth → session context
  → RequireAuth (route guard)
    → RequireFeature / useFeatureFlags (feature guard)
      → DB: is_admin() / is_moderator() / has_cadde_feature() RPC'leri
```

- **Tek auth yolu:** `src/components/auth/` (AuthProvider, useAuth)
- **Import yolu:** `@/components/auth/useAuth` — başka yol kullanma
- **`loading` diye bir alan YOKTUR** — `isLoading` kullan

### 5.4 Supabase Client

- **Tek kaynak:** `src/integrations/supabase/client.ts`
- `src/lib/supabase.ts` artık yok (0 import)

### 5.5 Routing

- Tüm route'lar `src/App.tsx`'te tanımlı (61 `lazy()` ile code-split)
- Admin alt ağacı: `src/pages/admin/routes.tsx`
- Modül bazlı routing deseni: `pages/admin/muhasebe/routes.tsx` (referans)
- Legacy yönlendirmeler: `src/lib/redirects.ts` → `nginx.conf.template` → `App.tsx` (üçlü senkron)

---

## 6. Veritabanı & Backend

### 6.1 Temel Tablolar (AFS Rebuild Sonrası)

| Domain | Tablolar |
|--------|----------|
| **Auth/Rol** | `auth.users`, `user_role_assignments`, `user_profile_attributes`, `user_feature_overrides` |
| **Katalog** | `catalog_items`, `catalog_item_roles`, `catalog_item_attribute_values`, `catalog_item_claims`, `catalog_item_managers` |
| **AFS Kurallar** | `roles` (76 flat), `afs_attributes` (53), `afs_features` (42), `afs_sections` (7), `role_attributes`, `role_features`, `role_sections` |
| **Cadde** | `cadde_posts`, `cadde_cafes`, `cadde_cafe_memberships`, `cadde_carsi_items`, `cadde_promotions`, `cadde_settings`, `cadde_countries`, `cadde_cities` |
| **Diğer** | `submissions`, `surveys`/`survey_*`, `muhasebe_gelirler`/`muhasebe_giderler`, `lansman_basvurular`, `referral_*`, `workspace_*`, `ai_knowledge_documents`, `relocation_*` |

### 6.2 Edge Functions (10 Aktif)

| Fonksiyon | Amaç |
|-----------|------|
| `send-submission-email` | Form gönderim bildirimi |
| `send-notification-emails` | Genel e-posta bildirimleri |
| `submit-survey-response` | Anket yanıtı kaydetme |
| `find-matches` | Gemini AI ile eşleşme |
| `radar-news-scan` | Haber tarama |
| `relocation-assistant` | Yer değiştirme asistanı |
| `relocation-notifications` | Yer değiştirme bildirimleri |
| `site-assistant` | AI site asistanı (RAG) |
| `whatsapp-webhook` | WhatsApp webhook (henüz deploy edilmedi) |
| `whatsapp-reply` | WhatsApp yanıtı (henüz deploy edilmedi) |

### 6.3 Migration Kuralları

- Migration'lar **silinemez veya yeniden sıralanamaz** — yalnız yeni migration eklenebilir
- `supabase/migrations/applied/` — çalışan set (151 dosya)
- `supabase/migrations/archive/` — baseline öncesi (252 dosya, **ASLA SİLME**)
- Parent `supabase/migrations/` dizininde **0** `.sql` olmalıdır

---

## 7. Üretim Ortamı & Deploy

### 7.1 Runtime

- **Üretim runtime'ı nginx'dir** — `server.mjs` DEĞİLDİR
- `Dockerfile`: `node:22-alpine` (build) → `nginx:1.27-alpine` (runtime)
- `nginx.conf.template` — güvenlik başlıkları, CSP, 301 yönlendirmeler, prerender routing TEK kaynağı
- `server.mjs` yalnız yerel `npm run start` ve Nixpacks yolu için

### 7.2 Deploy Akışı

```
npm run build → dist/
Docker build → nginx:1.27-alpine + dist/
Coolify deploy → corteqs.net
```

### 7.3 Kritik Dosyalar

| Dosya | Neden Önemli |
|-------|-------------|
| `src/App.tsx` | Ana route tablosu (329 satır, 61 lazy code-split) |
| `src/components/auth/AuthProvider.tsx` | Supabase session + context kökü |
| `src/lib/muhasebe-*.ts` | Referans mimari (API, şema, formatlama, agregasyon) |
| `src/integrations/supabase/client.ts` | Tek Supabase client (Lovable-generated) |
| `nginx.conf.template` | Üretim runtime yapılandırması |
| `src/lib/redirects.ts` | Tek yönlendirme kaynağı |
| `src/lib/admin.ts` | 6 satırlık barrel; gerçek implementasyon `admin/` altında |

---

## 8. Türkçe Domain Terminolojisi (DEĞİŞTİRİLMEZ)

Bu terimler kod genelinde Türkçe kalır — İngilizce'ye çevirme:

| Türkçe | Anlam |
|--------|-------|
| **muhasebe** | accounting |
| **gelirler** | income |
| **giderler** | expenses |
| **nakit akışı** | cash flow |
| **lansman** | launch/startup registration |
| **cadde** | street/marketplace |
| **kaynak** | resource |
| **kişi** | person |
| **oda** | room/chamber |
| **referans** | referral |
| **ambasador** | ambassador |
| **yönetici** | admin |

---

## 9. Türkçe Metin Kuralları

1. **Kullanıcıya görünen Türkçe metinlerde** `src/lib/text-normalization.ts` yardımcılarını kullan:
   - Arama/filtre → `trIncludes(haystack, query)`
   - Case → `trUpper(...)` / `trLower(...)`
   - Sıralama → `trCompare(a, b)`
2. **Bare `toUpperCase()/toLowerCase()`** SADECE teknik değerlerde (para kodu, dosya uzantısı, hex, referans kodu)
3. **CSV export** Blob başına UTF-8 BOM (`"﻿"`) ekle
4. **`<html lang="tr">`** korunmalı
5. **DB'ye yazılan değerlerden Türkçe karakter SİLİNMEZ** — `src/lib/events-vocabulary.ts` tek kaynak

---

## 10. Clean Code İyileştirme Alanları

### 10.1 Hâlâ Açık Teknik Borçlar

#### A. Büyük Dosyalar (800+ satır — 5 dosya)

| Dosya | Satır | Durum |
|-------|-------|-------|
| `src/pages/cadde/CaddePage.test.tsx` | 1845 | Test dosyası |
| `src/pages/cadde/CaddePage.tsx` | 1716 | **ÖNCELİK — üretim dosyası** |
| `src/pages/ProfilePage.test.tsx` | 1028 | Test dosyası |
| `src/lib/cadde-api.ts` | 986 | **ÖNCELİK — 25 importer, test YOK** |
| `src/lib/zgen/zgen-data.ts` | 980 | Veri dosyası |

**Sıradaki gerçek iş = Cadde çifti** (`cadde-api.ts` + `CaddePage.tsx`).
Kural: **Önce karakterizasyon testi yaz, sonra ayrıştır.** Testsiz ayrıştırma bu iki dosyada kabul edilemez.

#### B. Karışık Veri Çekme (B6) — 2 çağrı kaldı

`src/components/auth/AuthProvider.tsx` satır 14-20'de 2 doğrudan `supabase.from()` çağrısı var.
Savunulabilir (oturum kurulumu) ama kalıp dışı.

#### C. TypeScript `as any` — 3 gerçek cast

| Dosya | Cast | Neden |
|-------|------|-------|
| `src/lib/cadde-internal.ts` | `const db = supabase as any` | Query builder özyinelemesi |
| `src/lib/relocation-api.ts` | `const db = supabase as any` | Aynı |
| `src/lib/relocation-tools-api.ts` | `const db = supabase as any` | Aynı |

Bunları kaldırmak `tsc` hatalarını yeniden artırır — dikkatli yaklaşılmalı.

#### D. TypeScript strict mode KAPALI

```json
{
  "strict": false,
  "strictNullChecks": false,
  "noImplicitAny": false,
  "noUnusedLocals": false,
  "noUnusedParameters": false
}
```

**Hedef:** Yeni kod `strict: true` gibi yazılmalı. Mevcut kodda strict mode'u açmak büyük refactor gerektirir — bu bilinçli bir ertelemeydi.

#### E. Component İçi Doğrudan Supabase Çağrıları

B6 kapsamında ölçüldü: component içinde doğrudan `supabase.from()` kullanan dosya sayısı **2**'ye indi (AuthProvider). Ancak hâlâ bazı eski component'lerde bu anti-pattern görülebilir. **Yeni kodda kesinlikle yasak.**

### 10.2 Clean Code İçin Öncelikli Hedefler

#### ÖNCELİK 1: `cadde-api.ts` Ayrıştırması (986 satır)

Bu dosya Cadde modülünün ana API katmanıdır ve **25 importer'ı** var ama **hiç testi yok**.

**Doğru sıra:**
1. Karakterizasyon testleri yaz (`cadde-api.test.ts`)
2. Modülün alt sorumluluklarını tanımla (feed, cafe, carsi, promotion, notification, moderation)
3. Her alt modül için ayrı `cadde-<alt>-api.ts` dosyası oluştur
4. Importer'ları yeni dosyalara yönlendir
5. Eski dosyayı kaldır

**Mevcut deseni takip et:** `cadde-cafe-api.ts`, `cadde-carsi-api.ts`, `cadde-promotion-api.ts`, `cadde-moderation-api.ts`, `cadde-notifications-api.ts`, `cadde-engagement-api.ts` dosyaları zaten var — `cadde-api.ts` bunların atasıdır ve kalan genel/ortak işlevleri barındırır.

#### ÖNCELİK 2: `CaddePage.tsx` Ayrıştırması (1716 satır)

19 importer'ı var. Mevcut Cadde bileşen deseni: `src/components/cadde/` altında zaten birçok alt bileşen var. Sayfa bileşeni:
- Feed görünümü
- Cafe entegrasyonu
- Çarşı entegrasyonu
- Tanıtım/kampanya alanları
- Bildirim sistemi
- Moderasyon araçları

gibi alt bölümlere ayrılabilir.

#### ÖNCELİK 3: TypeScript Strict Mode Geçiş Planı

1. `tsconfig.strict-pilot.json` zaten var — pilot dosyalar için strict mode
2. Her yeni dosya strict mode'da yazılmalı
3. Mevcut dosyalarda kademeli geçiş: önce `strictNullChecks`, sonra `noImplicitAny`

#### ÖNCELİK 4: Kod Kalitesi Scriptleri

Mevcut kalite kontrol araçları:
```bash
npm run lint                    # ESLint (0 problem hedefi)
npm run typecheck               # tsc (0 hata hedefi)
npm run test                    # Vitest (2.361 test)
npm run check:dead              # Ölü kod tespiti
npm run check:drift             # Doküman/code drift kontrolü
npm run check:bundle            # Bundle boyutu kontrolü
npm run verify:text             # UTF-8 + mojibake kontrolü
npm run verify:quality          # typecheck + typecheck:node + typecheck:workers
```

### 10.3 Clean Code Kuralları (Bu Projeye Özel)

1. **Yeni dosya 800 satırı aşmamalı** — aşacaksa ayrıştır
2. **Component içi `supabase.from()` YASAK** — `*-api.ts` + React Query kullan
3. **`as any` YASAK** (yorum satırı hariç) — `supabase-json.ts` (`toJson`/`fromJson`) veya tip narrowing kullan
4. **`as TablesInsert<...>` / `as TablesUpdate<...>` CAST YASAK** — `satisfies` kullan (cast olmayan sütunu gizler)
5. **Türkçe domain terimlerini İngilizce'ye çevirme**
6. **`loading` değil `isLoading`** kullan (auth context)
7. **Bare `toUpperCase()/toLowerCase()` Türkçe metinde YASAK** — `trUpper/trLower` kullan
8. **`src/components/ui/*` elle düzenlenmez** — shadcn/ui generated
9. **Supabase migration silinmez veya yeniden sıralanmaz**
10. **`nginx.conf.template` + `src/lib/redirects.ts` + `App.tsx` üçlüsünü senkron tut**

---

## 11. Değişmez Sözleşmeler

Bu kurallar sessizce bozulabilen (test/build patlamayan ama canlıda zarar veren) hataları önler:

1. **Yönlendirme eklemek 3 dosyayı birlikte değiştirir:** `src/lib/redirects.ts` + `nginx.conf.template` + `App.tsx`
2. **nginx'te `add_header` KALITILMAZ** — her `location` bloğunda güvenlik başlıklarını tekrarla
3. **CSP `script-src`'ine `'unsafe-inline'` eklenmez**
4. **Sitemap'e rota eklemeden önce 3 kriteri doğrula:** public mi, `useSeo` var mı, thin content değil mi
5. **PostgREST 1000 satırda sessizce keser** — toplu veri `Range` başlıklı sayfalama kullanmalı
6. **nginx'te `server_name _` joker değildir** — catch-all blok `default_server` olmalı

---

## 12. Test Stratejisi

### Mevcut Durum
- **306 test dosyası / 2.361 test** yeşil
- Vitest + Testing Library + jsdom (unit/integration)
- Playwright (E2E — 10 spec, altında kullanılabilir)

### Test Yazım Kuralları
- `vi.mock` yolu bileşenin GERÇEKTEN import ettiği yol olmalı
- Supabase RPC hataları **plain object**'tir, `Error` instance DEĞİLDİR
- `npm run verify:text` `predev/prebuild/prelint/pretest` otomatik koşar
- Sözleşme testleri (redirects, seo, notfound-seo, sitemap) **gevşetilemez**

### İyi Test Örnekleri
- `src/lib/muhasebe-*.test.ts` — agregasyonlu integration test
- `src/lib/lansman.test.ts` — domain logic
- `src/components/AdminLansmanTable.test.tsx` — component test

---

## 13. Komutlar

### Geliştirme
```bash
npm install                     # Bağımlılıkları yükle
npm run dev                     # Vite dev server (port 8080)
npm run build                   # Production bundle
npm run lint                    # ESLint
npm run typecheck               # TypeScript kontrol
npm run test                    # Vitest tek sefer
npm run test:watch              # Vitest watch
```

### Kalite Kontrolü
```bash
npm run verify:quality          # Tüm typecheck'ler
npm run check:dead              # Ölü kod
npm run check:drift             # Doküman drift
npm run check:bundle            # Bundle boyutu
npm run verify:text             # UTF-8/mojibake
npm run verify:release          # Deploy sonrası doğrulama
```

### Veritabanı
```bash
npm run check:migrations        # Migration drift kontrolü
npm run migrate:apply           # Migration uygulama
```

---

## 14. Önemli Uyarılar

1. **Supabase projesi < 1 GB RAM** — tek bir kötü sorgu siteyi düşürür
2. **`geo_cities` (76.990 satır)** büyük tablo — fonksiyonu satır başına uygulama
3. **psql/Windows tuzağı** — PowerShell'den psql'e Türkçe karakterler bozulur
4. **`npm run ingest:tools:check`** — `src/lib/**` altına yeni dosya eklenince MUTLAKA çalıştırılmalı
5. **`src/integrations/supabase/types.ts`** (15.764 satır) — generated dosya, elle düzenlenmez
6. **`src/lib/agent/tools-catalog.generated.ts`** (3242 satır) — generated dosya
7. **`src/data/geoCountries.generated.ts`** (1013 satır) — generated dosya

---

## 15. Dokümantasyon Yapısı

| Dosya/Dizin | Amaç |
|-------------|------|
| `CLAUDE.md` | Agent/katılımcı kuralları (1011 satır — çok detaylı) |
| `README.md` | GitHub giriş sayfası, kurulum, deploy |
| `docs/ARCHITECTURE.md` | Tek bakımlı mimari doküman |
| `docs/AGENT_CONTEXT.md` | Hızlı bağlam |
| `docs/status/rapor.html` | Durum panosu |
| `docs/history/SONDURUM.md` | Faz durumu |
| `docs/cadde-300/` | Cadde 3.0 detaylı dokümanları |
| `docs/kalanlar/` | Açık iş listesi |
| `docs/refactor/` | Refactor backlog |
| `docs/plans/` | Plan dokümanları |
| `docs/operations/` | Operasyonel runbook'lar |

---

## 16. Clean Code Uygulaması İçin Rehber

### Gemini'ye Talimatlar

1. **Önce `CLAUDE.md`'yi oku** — projenin tüm kuralları, kısıtları ve bağlamı orada
2. **Muhasebe modülünü referans al** — `src/lib/muhasebe-*.ts` en temiz kalıp
3. **Cadde modülünü dikkatli değiştir** — sessizce kırılan bir alan, test olmadan dokunma
4. **800+ satırlık 5 dosyaya odaklan** — özellikle `cadde-api.ts` ve `CaddePage.tsx`
5. **TypeScript strict mode'a kademeli geçiş** — yeni dosyalar strict, eskilere dokunma
6. **Component içi Supabase çağrılarını API katmanına taşı** — 2 kalan AuthProvider'da
7. **Türkçe domain terimlerini koru** — İngilizce'ye çevirme
8. **Sözleşme testlerini gevşetme** — redirects, seo, sitemap testleri kutsal
9. **`npm run verify:quality` + `npm run test`** — her değişiklikten sonra çalıştır
10. **Generated dosyalara dokunma** — `types.ts`, `tools-catalog.generated.ts`, `geoCountries.generated.ts`

### Yasak İşlemler

- `src/components/ui/*` düzenleme (shadcn generated)
- Supabase migration silme/yeniden sıralama
- `nginx.conf.template` dışındaki dosyada header/CSP/redirect değişikliği
- `as TablesInsert<...>` cast kullanma → `satisfies` kullan
- Türkçe karakterleri DB değerlerinden silme
- `loading` alanı ekleme → `isLoading` kullan
- SEO kilitli URL path'lerini değiştirme (`/lansman`, `/cadde`, `/19051919`, vb.)
- `profiles`, `user_profiles`, `admin_users` tablo isimlerine referans ekleme
