# CorteQS Landing — Teknik Proje Dökümanı

> Bu döküman, başka bir agentın bu projeye özel detaylı bir **"clean code refactor"** promptu üretmesi için hazırlanmıştır. Aşağıda projenin teknolojik temelleri, mimari yapısı, güçlü/zayıf yönleri, kullanılan konvansiyonlar, kritik dosyalar ve refactor sırasında dikkat edilmesi gereken alanlar yer almaktadır.

---

## 1. Proje Özeti

**CorteQS Landing**, React + Vite tabanlı, Supabase backend ile çalışan çok yüzlü bir landing + admin/dashboard uygulamasıdır. Lovable.dev üzerinde başlatılmış (`lovable-tagger`, `tailwind.config.lov.json` izleri var), ardından elle ve agent yardımıyla büyütülmüştür.

Tek bir Vite uygulaması içinde aşağıdaki ürünler birarada yaşar:
- Halka açık kurumsal landing (`Index`, `About`, `Founders`, `Cadde`, `Radar`, `Diaspora`, `Commercial`)
- Form toplama (`FormPage`, `AIFormPage`, `AddWhatsAppPage`, `BackerForm`)
- Çoklu kampanya sayfaları (`May19*`, `Founding1000`, `BloggerContest`, `VloggerContest`, `Lansman`)
- Anket (Surveys) modülü — public + admin
- Üye dizini & profil sistemi (`Directory*`, `Profile*`, `RolesGo`, attribute/approval/audit altyapısı)
- Admin paneli (`/admin/*`) — üyeler, referral, marquee, kaynaklar, sosyal medya, advisor link, lansman, anketler, May19, WhatsApp landings, taksonomi, profil seksiyonları, audit, onaylar, kullanıcı override
- Workspace dashboard (`/admin/workspace/*`) — Command Center, Todo, Meeting Notes, MVP, kaynaklar, doc
- Muhasebe modülü (`/admin/muhasebe/*`) — Gelir, Gider, Nakit Akışı, Dashboard
- RAG chat entegrasyonu (`/api/chat` proxy → `rag.corteqs.net`)

**Repo boyutu (kabaca):** 90+ sayfa (`src/pages/**`), 100+ component, 40+ lib modülü, 60+ Supabase migration.

---

## 2. Teknoloji Yığını

| Katman | Teknoloji | Not |
|---|---|---|
| Build/Bundler | **Vite 5** + `@vitejs/plugin-react-swc` | SWC ile hızlı transform |
| Dil | **TypeScript 5.8** | `strict` KAPALI, `strictNullChecks: false`, `noImplicitAny: false` — **çok zayıf type-safety** |
| UI Framework | **React 18.3** | StrictMode kullanılmıyor, `hydrateRoot` + `createRoot` switch'i `main.tsx`'de |
| Routing | **react-router-dom 6.30** | `BrowserRouter`, nested routes |
| Data Fetching | **@tanstack/react-query 5** | `QueryClient` tek instance, ama hook kullanımı tutarsız (bkz. `useMuhasebe.ts` vs doğrudan `supabase.from()` çağrıları) |
| UI Kit | **shadcn/ui** (Radix tabanlı) | `src/components/ui/*` 40+ component, `components.json` var |
| Styling | **Tailwind CSS 3.4** + CSS variables | `tailwindcss-animate`, `tailwind-merge`, `class-variance-authority` |
| Form | **react-hook-form 7** + **zod 3** | `@hookform/resolvers` |
| Backend | **Supabase** (Postgres + Auth + Storage + Edge Functions) | Project ID hardcoded `injprdrsklkxgnaiixzh` |
| Email | Edge Function `send-submission-email` (Resend API) | |
| Test (unit) | **Vitest 3** + Testing Library + jsdom | `vitest.config.ts`, `src/test/setup.ts` |
| Test (E2E) | **Playwright 1.57** | `playwright.config.ts` (kullanımı sınırlı) |
| Lint | ESLint 9 (flat config) + typescript-eslint | `@typescript-eslint/no-unused-vars: off`, gevşek |
| Diğer | `recharts`, `react-simple-maps`, `d3-geo`, `cmdk`, `sonner`, `embla-carousel`, `date-fns`, `next-themes`, `vaul` | |
| Deploy | Docker (Coolify) + `server.mjs` (Express benzeri) + nixpacks fallback | Runtime `/env-config.js` üretimi |

---

## 3. Dizin Yapısı

```
corteqs_landing/
├─ src/
│  ├─ main.tsx                # Hydrate or render root
│  ├─ App.tsx                 # Tüm route'ları tek dosyada içerir (BÜYÜK — 200+ satır import + route)
│  ├─ index.css               # Global Tailwind + CSS vars
│  ├─ pages/                  # 90+ route component
│  │  ├─ admin/               # Admin paneli sayfaları
│  │  │  ├─ muhasebe/         # Muhasebe alt-modülü
│  │  │  ├─ workspace/        # Dashboard alt-modülü
│  │  │  └─ surveys/          # Survey admin
│  │  └─ ...                  # Public sayfalar
│  ├─ components/
│  │  ├─ ui/                  # shadcn primitives (dokunma)
│  │  ├─ admin/               # Admin-only composites
│  │  ├─ auth/                # AuthProvider, RequireAuth, RequireFeature
│  │  ├─ chat/                # RAG chat widget
│  │  ├─ dashboard/           # Workspace UI
│  │  ├─ may19/               # Kampanya komponentleri
│  │  ├─ surveys/             # Public survey renderer
│  │  └─ profile/             # Profil kartları
│  ├─ lib/                    # Domain logic, API wrappers, Zod schemas
│  │  ├─ dashboard/           # Workspace data layer
│  │  ├─ muhasebe-*.ts        # Muhasebe domain (api, schemas, format, aggregations)
│  │  ├─ supabase.ts          # Client örneği (RE-EXPORT?)
│  │  ├─ submissions.ts, surveys.ts, cadde.ts, lansman.ts, ...
│  │  └─ utils.ts             # cn() helper
│  ├─ hooks/                  # use-mobile, use-toast, useMuhasebe
│  ├─ integrations/supabase/client.ts   # Generated Supabase client (Lovable kaynaklı olabilir)
│  ├─ types/                  # lansman.ts vb. (çok az kullanım — çoğu type lib içinde)
│  ├─ assets/                 # Statik görseller
│  └─ test/                   # setup.ts, example.test.ts
├─ supabase/migrations/       # 60+ timestamped SQL migration (RLS, RPC, buckets)
├─ supabase/functions/        # Edge Functions
├─ scripts/                   # Node ESM CLI'ları (import, verify-release)
├─ docs/                      # Modül başına Türkçe rehberler + cleanup raporları
├─ server.mjs                 # Production static + /env-config.js + /api/chat proxy
├─ playwright.config.ts
├─ vitest.config.ts
├─ vite.config.ts             # Standalone commercial HTML inject mantığı var
├─ tsconfig.{json,app.json,node.json}
├─ eslint.config.js
└─ tailwind.config.ts
```

---

## 4. Mimari Notlar ve Akış

### 4.1 Routing
- `src/App.tsx` **tek noktadan yönetilen route tablosu** içeriyor — şu an 80+ route, dosya **çok şişkin**. Bölgeselleştirme/lazy load yapılmamış.
- Admin route'ları `/admin/*` altında `AdminLayout` + `RequireAuth` ile sarılıyor.
- Muhasebe route'ları `muhasebeRoutes` named export ile modülerize edilmiş — **doğru örüntü**, diğerleri de buna evrilebilir.
- Public route'lar `PublicLayout`'tan geçer (header, footer, scroll button).

### 4.2 Auth & Yetkilendirme
- `AuthProvider` (`src/components/auth/AuthProvider.tsx`) Supabase session'ını context'e koyuyor.
- `RequireAuth` admin route'larını koruyor; `RequireFeature` feature-flag tabanlı yetki için.
- `public.admin_users` tablosu admin kullanıcıları belirliyor.
- Yeni jenerasyon: `user_profiles_v2` + `profile_type` + RolesGo MVP (`20260525000000_rolesgo_role_attribute_approval_mvp.sql`) + attribute/approval/audit altyapısı. **Eski + yeni sistem yan yana yaşıyor** — refactor riskli alan.

### 4.3 Data Layer
- İki Supabase client kaynağı görünüyor:
  - `src/integrations/supabase/client.ts` (Lovable-generated, types ile birlikte muhtemelen)
  - `src/lib/supabase.ts` (custom)
  → **Tek kaynağa indirgenmeli.**
- API çağrıları üç stilde:
  1. Component içinde doğrudan `supabase.from(...)` (anti-pattern, yaygın)
  2. `src/lib/*-api.ts` (`muhasebe-api.ts` örneği iyi — domain capsule)
  3. React Query hook'ları (sınırlı, `useMuhasebe.ts`)
- Zod şemaları `lib/*-schemas.ts` veya inline. Tutarsız.

### 4.4 RLS & Migration
- 60+ migration; RLS policy'leri sıkı (özellikle submission insert policy'leri birkaç kez resetlenmiş → migration kirlilik göstergesi).
- `security_hardening_phase1.sql` (Mayıs 2026) — sertleşmiş bir baseline var.
- RPC fonksiyonları admin işlemleri için yoğun (`admin_set_user_profile_type_rpc`, `admin_edit_profile_data_rpcs`, ...).

### 4.5 Deploy & Runtime
- `server.mjs`: dist'i SPA fallback ile sunar, `/env-config.js`'i runtime'da env'den üretir (Coolify'da `VITE_*` build-time gömülemediği için), `/api/chat`'i `RAG_API_SECRET` ile RAG backend'e proxyler.
- `vite.config.ts` build sırasında `info-*.html` standalone dosyalarını `dist/commercial/<slug>/*` altına emit ediyor — **özel build hook**.

### 4.6 Test
- Vitest unit/component testleri **var ama parçalı**: `*.test.ts(x)` dosyaları belli sayfa/lib'lerde mevcut, çoğu yok.
- `src/test/setup.ts` Testing Library jest-dom matcherları ekliyor.
- Coverage ölçümü ayarlanmamış.
- Playwright var ama aktif kullanım iz bırakmamış (`_archive/cleanup-2026-05-15/playwright-fixture.ts`).

---

## 5. Kodlama Konvansiyonları (Mevcut Durum)

- **Path alias:** `@/*` → `src/*` (hem `tsconfig` hem `vite.config.ts` hem `vitest.config.ts`'de tanımlı, tutarlı).
- **Import stili:** Karışık — bazı dosyalar `./pages/X.tsx`, bazıları `@/pages/X` kullanıyor (`App.tsx` ikisini de aynı dosyada karıştırıyor).
- **Dosya isimlendirme:** Component dosyaları `PascalCase.tsx`, lib dosyaları `kebab-case.ts` veya `camelCase.ts` (örn. `chatConfig.ts` vs `muhasebe-api.ts`) — **tutarsız**.
- **TS sıkılığı:** `tsconfig.json` neredeyse tüm güvenlik flag'lerini kapatıyor (`strictNullChecks: false`, `noImplicitAny: false`). Bu yüzden `any` ve runtime null hatalarına yatkın.
- **ESLint:** Sadece `recommended` + react-hooks/refresh; `no-unused-vars` kapalı. Custom kural yok.
- **Türkçe terminoloji:** `muhasebe`, `gelirler`, `giderler`, `lansman`, `cadde`, `kaynak`, `kişi`, `oda`, `referans` gibi domain terimler **Türkçe**. İngilizce'ye çevrilmemeli, anlam kaybı olur.
- **Comment yoğunluğu:** Düşük, ama bazı agent-generated dosyalarda gereksiz açıklayıcı yorumlar var.
- **Immutability:** Tail noktası — `lib/*-api.ts` çoğunlukla saf, ama bazı dashboard manager'lar local state mutation yapıyor olabilir.

---

## 6. Tespit Edilen Clean-Code Sorun Alanları

> Bu liste, refactor promptu üretirken hedeflenecek somut ağrı noktalarıdır.

### 6.1 Yapısal
- **`src/App.tsx` dev-route-table.** 100+ import + tek `<Routes>` bloğu. Lazy loading yok, route'lar feature klasörlere göre bölünmemiş. Bundle initial size yüksek.
- **Çift Supabase client** (`integrations/supabase/client.ts` + `lib/supabase.ts`). Hangisinin doğru olduğu belirsiz.
- **Eski + yeni profile sistemi** (`admin_users`, `user_profiles`, `user_profiles_v2`, `individual_profile_details`, `rolesgo_*`) yan yana. Hangisinin canonical olduğu kodda tutarsız.
- **Domain capsule eksik.** Muhasebe modülü doğru ayrılmış (`lib/muhasebe-*`, `pages/admin/muhasebe`, `components/admin/muhasebe`); diğer modüller (surveys, cadde, may19, lansman, referral) için aynı bütünlük yok — lib/components/pages arasında sızıntı var.

### 6.2 Tip Güvenliği
- `tsconfig.json` strict flag'leri kapalı. Refactor önceliği: `strictNullChecks` + `noImplicitAny` açıp olası 500+ hatayı kademeli kapatmak.
- `any` ve implicit-any geniş bir kullanımı var (özellikle Supabase response'larında).
- Supabase tablolarının auto-generated `Database` type'larından faydalanılmıyor olabilir.

### 6.3 Tekrar (DRY ihlali)
- Birçok admin sayfası benzer "list + create + edit + delete + RLS-aware fetch" deseni tekrarlıyor; ortak `<AdminCRUDPage>` veya `useAdminResource` hook'u yok.
- Form sayfaları (`FormPage`, `AIFormPage`, `BackerForm`, `May19SubmissionForm`, `LansmanForm`) field/validation kombinasyonlarını ayrı ayrı yazıyor.

### 6.4 Data Fetching
- React Query kullanımı tutarsız. Bazı bileşenler `useEffect + supabase.from()` ile direkt çekiyor → loading/error state'leri elle yönetiliyor, cache yok, stale data oluyor.
- Query key konvansiyonu yok.

### 6.5 Hata Yönetimi
- `try/catch + toast.error(err.message)` deseni yaygın. `error: unknown` narrow'lama eksik, kullanıcı dostu mesaj eşleme yok.
- Edge Function hatası ile RLS reddi ayırt edilmiyor.

### 6.6 Test Coverage
- Unit/integration test'ler parçalı. Kritik domain modülleri (özellikle muhasebe aggregations, referral codes, lansman, cadde, marquee) test edilmiş; ama yeni modüllerin (RolesGo, profile-v2, surveys, may19) coverage'ı düşük.
- Playwright E2E etkin değil.

### 6.7 ESLint
- `no-unused-vars: off` — refactor sırasında ölü kod tespiti için **açılmalı**.
- `react-hooks/exhaustive-deps` aktif ama bazı dosyalarda uyarılar görmezden gelinmiş olabilir.

### 6.8 Migration Kirliliği
- `supabase/migrations` içinde aynı policy'yi birden fazla kez resetleyen dosyalar var (`reset_submissions_insert*`, `add_debug_policy_rpc` + `remove_debug_policy_rpc`). Migration **squash** veya konsolidasyon değerlendirilmeli (ama production'da koşulduğu için dikkatli).

### 6.9 Asset & Public
- `public/` ve `_archive/` içinde geçmiş cleanup'tan kalan dosyalar olabilir. `docs/cleanup/` raporları geçmişi gösteriyor.

### 6.10 Build Configuration
- `vite.config.ts` içindeki standalone HTML (`info-*.html`) inject mantığı **karmaşık ama gerekli** — refactor'da korunmalı.
- `componentTagger` dev-only çalışıyor, doğru kullanılmış.

---

## 7. Refactor Sırasında Korunması Gerekenler

> Promptu hazırlayan agent bunları **kırmamalı**:

1. **Public URL'leri:** `/lansman`, `/commercial/<slug>`, `/cadde`, `/founders`, `/aboutpage` vb. SEO geçmişi olan rotalar değiştirilemez. (Recent commits hep "seo".)
2. **Supabase migration history** — geçmiş migration silinemez/yeniden adlandırılamaz; yalnız yeni migration eklenebilir.
3. **`server.mjs` runtime env injection** — Coolify deploy buna bağlı.
4. **`vite.config.ts` standalone HTML emit** — commercial/* dağıtımı buna bağlı.
5. **`/api/chat` proxy** — RAG entegrasyonu, `RAG_API_SECRET` server-only.
6. **Hardcoded Supabase project ID** ENV ile değişebilir, ama default URL'in `injprdrsklkxgnaiixzh.supabase.co` olduğu env örnekleri sabit.
7. **Türkçe domain terimleri** (muhasebe, cadde, lansman, kaynak, referans, oda, kişi, üye, ambasador). Bunlar **rename edilmemeli**.
8. **RLS policy davranışı** — submission insert policy'lerinin public-olmaya-zorlandığı geçmişi var; refactor'da bu policy'lere dokunulmamalı (varsa eklenir, mevcut olan değiştirilmez).
9. **shadcn/ui (`src/components/ui/*`)** — generated kod, **manuel düzenlenmemeli** (shadcn upgrade'i kırar).
10. **Lovable-generated `integrations/supabase/client.ts`** — overwrite riskli. Yeni bir wrapper koy.

---

## 8. Promptu Yazan Agent İçin Hedef Çerçeve

Sıralı, küçük PR'lara bölünmüş bir clean-code planı önerilmeli. Tek seferde "her şeyi yeniden yaz" prompt'undan kaçınılmalı. Önerilen aşama sıralaması:

1. **Foundation:**
   - `tsconfig` strict mod açma planı (kademeli)
   - ESLint kuralları sertleştirme (`no-unused-vars`, `consistent-type-imports`, `no-explicit-any`)
   - Tek kanonik Supabase client + tipli `Database` import'u
   - Path alias ve import stilini tek tipe çekme (`@/...`)

2. **Architectural:**
   - `src/App.tsx`'in feature route'larına bölünmesi (admin, public, campaigns, workspace, muhasebe — muhasebe modeline uygun)
   - Code-splitting / `React.lazy` + `Suspense`
   - Feature klasör konvansiyonu (lib + components + pages eşleştirilmiş kapsül)

3. **Data Layer:**
   - Tüm `supabase.from()` çağrılarının `src/lib/*-api.ts` modüllerine taşınması
   - React Query hook'larıyla sarılma (`useXxxQuery`, `useXxxMutation`), tutarlı query-key namespace
   - Zod schema → tip türetme (`z.infer`) konvansiyonu

4. **UI & Form:**
   - Ortak `AdminListPage`, `AdminFormDialog` patternleri
   - Form bileşenlerinde paylaşılan `useZodForm` hook'u
   - Toast/error utility (`getErrorMessage(unknown): string`)

5. **Testing:**
   - Kritik domain lib'leri için %80+ unit coverage hedefi
   - Workspace ve muhasebe sayfaları için component testleri
   - 5–10 kritik flow için Playwright E2E (admin login, submission create, survey response, muhasebe entry, lansman registration)

6. **Cleanup:**
   - `_archive/`, `docs/cleanup/`, ölü scripts/import çıktıları gözden geçirilip silinmeli
   - Eski + yeni profile sistemi netleştirilmeli (hangisi canonical, diğeri deprecate)
   - `console.log` taraması ve loglama soyutlaması

7. **Security:**
   - Tüm env okumaları tek bir `src/lib/env.ts` üzerinden, Zod validasyonu ile
   - `SUPABASE_SERVICE_ROLE_KEY`'in frontend bundle'a sızmadığının doğrulanması
   - Edge Function error/sentry hookları

---

## 9. Hızlı Komut Referansı

```bash
npm install
npm run dev                  # Vite dev server, port 8080
npm run build                # Production build
npm run build:dev            # Dev-mode build (komponent tagger açık)
npm run lint                 # ESLint
npm run test                 # Vitest run
npm run test:watch
npm run start                # node server.mjs (production)
npm run verify:release       # Built asset doğrulama
BASE_URL=https://corteqs.net npm run verify:release
supabase functions deploy send-submission-email
supabase functions deploy lansman-admin
```

---

## 10. Kritik Dosya Pointer'ları

| Dosya | Neden Kritik |
|---|---|
| `src/App.tsx` | Route tablosunun tek noktası; en yüksek refactor önceliği |
| `src/main.tsx` | Hydrate/Render switch (SSR/SSG ileride eklenirse buradan başlar) |
| `src/integrations/supabase/client.ts` | Lovable kaynaklı, dokunulması riskli |
| `src/lib/supabase.ts` | Custom client — duplikasyon kaynağı |
| `src/lib/muhasebe-*.ts` | İyi-örnek modül kapsülü (referans alınabilir) |
| `src/components/auth/AuthProvider.tsx` | Tüm yetki akışının kalbi |
| `vite.config.ts` | Standalone HTML inject + proxy + build input'ları |
| `server.mjs` | Production runtime; env injection mantığı burada |
| `supabase/migrations/20260512103000_security_hardening_phase1.sql` | Güvenlik baseline'ı |
| `supabase/migrations/20260525000000_rolesgo_role_attribute_approval_mvp.sql` | Yeni yetki sisteminin başlangıcı |
| `tsconfig.json` | Strict mod kapalı — refactor pivot noktası |
| `eslint.config.js` | Gevşek lint; refactor anchor |
| `docs/cleanup/CLEAN_CODE_SECURITY_REPORT.md` | Geçmiş cleanup raporu — okunmalı |

---

## 11. Bilinmeyenler / Doğrulanmamış Varsayımlar

Agent prompt'u yazarken kullanıcıya **şu soruları sormalı** veya kaynak kontrol etmeli:

1. Eski (`admin_users`, `user_profiles`) ve yeni (`user_profiles_v2`, `rolesgo_*`) profil sistemleri arasında canonical olan hangisi? Eski silinecek mi, paralel mi kalacak?
2. `_archive/` ve `docs/cleanup/` altındaki dosyalar tarihsel referans mı, silinebilir mi?
3. Playwright E2E hedef coverage'ı nedir? (Critical 5 flow yeterli mi, regression suite mı?)
4. TypeScript strict-mode'a kademeli geçiş için kaç sprint ayrılabilir? (Tek seferde açmak ~500+ hata üretebilir.)
5. `lovable-tagger` ve `components.json` korunacak mı, yoksa Lovable bağımlılığı tamamen kesilecek mi?
6. Multi-locale (Türkçe + İngilizce) planı var mı? Domain terimleri Türkçe kalacak mı?

---

**Bu döküman**, bir başka agentın bu projeye özel, gerçekçi, kademeli ve risk-bilinçli bir "clean code refactor" promptu yazması için gereken tüm bağlamı sağlar.
