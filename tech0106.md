# CorteQS Landing — Teknik Dokümantasyon

> Oluşturulma: 2026-06-02

## 1. Proje Özeti

**Stack:** React 18.3.1 + Vite 5.4.19 + Supabase (PostgreSQL + RLS) + TypeScript  
**Deployment:** Docker / Coolify — `npm run build` → `node server.mjs`  
**Kapsam:** Çok özellikli SPA — pazarlama sitesi, admin paneli, üye profilleri, anketler, workspace araçları, muhasebe modülü

---

## 2. Dizin Yapısı

```
corteqs_fin/
├── src/
│   ├── App.tsx                     # 80+ route tanımı (refactor hedefi)
│   ├── main.tsx                    # React render entry point
│   ├── components/                 # 222 .tsx dosyası
│   │   ├── ui/                     # shadcn/ui primitives (48 adet, elle düzenleme)
│   │   ├── admin/                  # Admin panel bileşenleri
│   │   │   └── muhasebe/           # KpiCard, FormDialog, StatusBadge
│   │   ├── auth/                   # AuthProvider, RequireAuth, RequireFeature
│   │   ├── profiles/               # Profil bileşenleri
│   │   ├── chat/                   # ChatBot (Gemini 2.5 Flash)
│   │   ├── surveys/                # Anket UI
│   │   ├── feed/                   # Sosyal feed
│   │   └── ...                     # booking, connections, messaging, may19 vb.
│   ├── pages/                      # 135 .tsx dosyası
│   │   ├── admin/                  # Admin sayfaları
│   │   │   ├── muhasebe/           # MuhasebeDashboard, GiderlerPage, GelirlerPage, NakitAkisiPage, routes.tsx
│   │   │   ├── surveys/            # Anket yönetimi
│   │   │   └── workspace/          # Command Center, Resources, TODO
│   │   └── ...                     # Public sayfalar
│   ├── lib/                        # 43 .ts modülü
│   │   ├── muhasebe-api.ts         # Supabase CRUD (referans pattern)
│   │   ├── muhasebe-schemas.ts     # Zod şemaları
│   │   ├── muhasebe-format.ts      # Format yardımcıları
│   │   ├── muhasebe-aggregations.ts# İş mantığı / KPI
│   │   ├── supabase.ts             # Supabase client re-export
│   │   ├── utils.ts                # cn(), classNames vb.
│   │   ├── features.ts             # Feature flags
│   │   ├── lansman.ts              # Lansman API
│   │   ├── submissions.ts          # Form submission tracking
│   │   ├── surveys.ts              # Anket API
│   │   ├── cadde.ts                # Marketplace API
│   │   ├── ragApi.ts               # RAG API proxy
│   │   └── dashboard/              # Command Center, Resources, MVP items
│   ├── hooks/                      # 18 custom hook
│   │   ├── useMuhasebe.ts          # React Query wrapper (gelir/gider/KPI)
│   │   ├── useAuth.ts              # Auth context consumer
│   │   ├── useCurrentUserProfile.ts
│   │   ├── useFeedSocial.ts        # Feed, beğeni, takip
│   │   ├── useFeatureFlags.ts
│   │   └── ...
│   ├── types/                      # TypeScript domain tipleri
│   │   ├── muhasebe.ts             # 251 satır — ExpenseRow, IncomeRow, KpiSummary, etiket haritaları
│   │   ├── lansman.ts
│   │   └── auth-context.ts
│   ├── integrations/supabase/
│   │   ├── client.ts               # Lovable-generated client (dikkatli ol)
│   │   └── types.ts                # 2000+ satır auto-generated DB schema
│   └── test/
│       └── setup.ts                # jest-dom, ResizeObserver mock
├── supabase/
│   ├── migrations/                 # 118 .sql dosyası (20260322 → 20260524)
│   └── functions/                  # 5 Edge Function (Deno runtime)
│       ├── chat-register/          # Gemini 2.5 Flash, rate-limit, CORS
│       ├── find-matches/
│       ├── lansman-admin/
│       ├── send-submission-email/
│       └── submit-survey-response/
├── docs/                           # Teknik dokümantasyon
├── turkish_missions_import_builder/# Dışişleri temsilcilik scraper + SQL üretici
├── public/                         # Statik varlıklar
├── server.mjs                      # Production HTTP server (278 satır)
├── vite.config.ts                  # Build konfigürasyonu + standalone HTML plugin
├── tsconfig.json                   # Gevşek strict mode (intentional)
├── tailwind.config.ts
└── eslint.config.js
```

---

## 3. Bağımlılıklar

### Üretim Bağımlılıkları (76 paket)

| Kategori | Paket | Versiyon |
|---|---|---|
| React | react, react-dom | 18.3.1 |
| Routing | react-router-dom | 6.30.1 |
| State/Fetch | @tanstack/react-query | 5.83.0 |
| Tablo | @tanstack/react-table | 8.21.3 |
| Supabase | @supabase/supabase-js | 2.101.1 |
| Form | react-hook-form | 7.61.1 |
| Validasyon | zod | 3.25.76 |
| UI | shadcn/ui (Radix UI) | — |
| İkonlar | lucide-react | 0.462.0 |
| Stil | tailwindcss | 3.4.17 |
| Dark mode | next-themes | 0.3.0 |
| Toast | sonner | — |
| Grafik | recharts | 2.15.4 |
| Harita | d3-geo | 3.1.0 |
| Tarih | date-fns | 3.6.0 |

### Geliştirme Bağımlılıkları

| Paket | Amaç |
|---|---|
| vitest 3.2.4 | Test runner |
| @testing-library/react 16.0.0 | Component test |
| @playwright/test 1.57.0 | E2E test |
| @vitejs/plugin-react-swc 3.11.0 | Hızlı transpile |
| typescript-eslint 8.38.0 | Linting |
| lovable-tagger 1.1.13 | Component tracking |

### Script'ler

```bash
npm run dev                # Vite dev server — port 8080
npm run build              # Production bundle → dist/
npm run start              # node server.mjs (dist/ serve)
npm run test               # Vitest tek çalıştırma
npm run test:watch         # Vitest izleme modu
npm run lint               # ESLint kontrolü
npm run verify:release     # Release doğrulama
```

---

## 4. Routing Mimarisi (src/App.tsx)

~250 satır — monolitik, refactor hedefi.

### Public Route'lar (`<PublicLayout />` ile sarılı)

| Path | Sayfa | Açıklama |
|---|---|---|
| `/` | Index | Hero, diaspora arama, danışman kategorileri |
| `/founders` | FoundersPage | Kurucular |
| `/radar` | RadarPage | İstatistik paneli |
| `/commercial/:slug` | CommercialPage | Ticari partner |
| `/diaspora/:slug` | DiasporaDetailPage | Diaspora detay |
| `/lansman` | LansmanPage | **SEO-kilitli** — Lansman kaydı |
| `/19051919*` | May19* | Kampanya (harita, fikir, anı) |
| `/founding-1000` | Founding1000Page | Kurucu başvurusu |
| `/anket*` | SurveysPage | **SEO-kilitli** — Anketler |
| `/cadde` | CaddePage | **SEO-kilitli** — Marketplace |
| `/directory` | DirectoryPage | Üye dizini |
| `/login` | LoginPage | Giriş |
| `/profile*` | ProfilePage | Kullanıcı profili |

### Admin Route'lar (`<AdminLayout />` + `<RequireAuth />`)

| Path | Sayfa |
|---|---|
| `/admin` | AdminHomePage |
| `/admin/members` | AdminMembersPage |
| `/admin/lansman` | AdminLansmanPage |
| `/admin/referral*` | Referral yönetimi |
| `/admin/muhasebe/*` | **Modularize edilmiş** — muhasebeRoutes |
| `/admin/workspace/*` | Command Center, Resources, TODO |
| `/admin/surveys/*` | Anket yönetimi |
| `/admin/cadde` | AdminCaddePage |

### Provider Hiyerarşisi

```
QueryClientProvider
└── ThemeProvider (next-themes)
    └── AuthProvider (Supabase session)
        └── DiasporaProvider (search state)
            └── Routes
                └── ...
```

---

## 5. Veri Katmanı (Üç Stil — Standardize Gerekiyor)

### Tercih Edilen: API Modülü + React Query

```
Component
  └── Hook (useQuery / useMutation) — src/hooks/useMuhasebe.ts
        └── API Modülü — src/lib/muhasebe-api.ts
              └── Supabase Client
                    └── Veritabanı
```

### Anti-Pattern: Doğrudan Component Fetch

```tsx
// Yaygın ama kaçınılmalı
const { data } = await supabase.from('table').select()
```

### Referans Implementation: Muhasebe Pattern

```typescript
// muhasebe-api.ts
export async function fetchExpenses(): Promise<ExpenseRow[]> { ... }
export async function createExpense(input: ExpenseInput): Promise<ExpenseRow> { ... }
export async function fetchKpiSummary(): Promise<KpiSummary> { ... }

// muhasebe-schemas.ts
export const expenseFormSchema = z.object({
  expense_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  person: z.enum(['burak', 'baris', 'ortak']),
  category: z.enum([...]),
  amount: z.number().nonnegative(),
})
export type ExpenseFormValues = z.infer<typeof expenseFormSchema>

// useMuhasebe.ts
export function useExpenses() {
  return useQuery({
    queryKey: muhasebeKeys.expenses(),
    queryFn: fetchExpenses,
  })
}
export function useCreateExpense() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: ExpenseInput) => createExpense(input),
    onSuccess: () => { invalidateAll(qc); toast.success('Eklendi') },
  })
}
```

---

## 6. Muhasebe Modülü — Referans Mimari

Yeni özellikler için kopyalanacak template:

```
src/
├── lib/
│   ├── muhasebe-api.ts           # Supabase CRUD + RPC
│   ├── muhasebe-schemas.ts       # Zod validasyon
│   ├── muhasebe-format.ts        # Para birimi, tarih, URL format
│   ├── muhasebe-aggregations.ts  # KPI, kategori, nakit akışı hesaplama
│   └── muhasebe-*.test.ts        # Unit + integrasyon testleri
├── hooks/
│   └── useMuhasebe.ts            # React Query hooks
├── types/
│   └── muhasebe.ts               # ExpenseRow, IncomeRow, KpiSummary vb.
├── pages/admin/muhasebe/
│   ├── MuhasebeDashboard.tsx
│   ├── GiderlerPage.tsx
│   ├── GelirlerPage.tsx
│   ├── NakitAkisiPage.tsx
│   ├── MuhasebeLayout.tsx
│   └── routes.tsx                # Modüler routing
└── components/admin/muhasebe/
    ├── KpiCard.tsx
    ├── ExpenseFormDialog.tsx
    ├── IncomeFormDialog.tsx
    └── StatusBadge.tsx
```

### Tip Sistemi (src/types/muhasebe.ts)

```typescript
type ExpenseCategory = 'yazilim_araclar' | 'hosting_sunucu' | ... (12 varyant)
type ExpenseStatus = 'odendi' | 'bekliyor' | 'iptal'
type PersonType = 'burak' | 'baris' | 'ortak'
type CurrencyCode = 'TRY' | 'USD' | 'EUR' | 'GBP' | 'QAR'
type PaymentMethod = 'sanal_kart_burak' | 'sanal_kart_baris' | ... (7 varyant)

interface KpiSummary { total_expense_try, total_income_try, net_position_try, ... }
interface CashflowMonth { year_num, month_num, income_try, expense_try, net_try }
```

---

## 7. Authentication & Rol Sistemi

### Eski Sistem (aktif, kaldırılmadı)
- `public.admin_users` tablosu
- `role_features` view

### Yeni Sistem — RolesGo MVP (Mayıs 2026)
- `user_profiles_v2` — auth_provider, profile_type
- `rolesgo_roles` — Rol tanımları
- `rolesgo_features` — Özellik tanımları
- `rolesgo_role_features` — Rol → özellik eşleşmesi
- `rolesgo_user_roles` — Kullanıcı → rol ataması

**Durum:** Her iki sistem birlikte yaşıyor. Canonical yön belirlenmedi — profil mantığına dokunmadan önce sor.

### Auth Flow

```
AuthProvider (src/components/auth/AuthProvider.tsx)
  └── Supabase session subscribe
        └── useAuth() hook → { session, user, isLoading }
              └── RequireAuth (admin route guard)
                    └── RequireFeature (özellik bazlı erişim)
```

---

## 8. Supabase Yapısı

### Client Kaynakları (İki Ayrı — Birleştir!)

| Dosya | Kaynak | Not |
|---|---|---|
| `src/integrations/supabase/client.ts` | Lovable-generated | Type tanımları mevcut, riskli değiştirmek |
| `src/lib/supabase.ts` | Custom re-export | Günlük kullanım için |

### Temel Tablolar

| Tablo | Amaç |
|---|---|
| `expenses` / `incomes` | Muhasebe |
| `submissions` | Form gönderimleri (karmaşık RLS geçmişi) |
| `user_profiles_v2` | Yeni auth sistemi |
| `rolesgo_*` | RolesGo MVP |
| `surveys` + `survey_responses` | Anketler |
| `feed_posts` + `feed_likes` | Sosyal feed |
| `user_follows` / `user_connections` | Sosyal ilişkiler |
| `messages` | Mesajlaşma |
| `lansman_registrations` | Lansman kayıtları |
| `marquee_items` | Haber kaydı |
| `command_center_items` / `resource_entries` / `mvp_items` | Workspace |
| `may19_submissions` | 19 Mayıs kampanyası |

### Storage Bucket'ları

- `submission_documents` — Form yüklemeleri
- `avatars` — Profil fotoğrafları
- `may19_submissions_media` — Kampanya medyası
- `whatsapp_landing_hero` — Landing görselleri

### Edge Functions (5 adet — Deno runtime)

| Fonksiyon | Amaç |
|---|---|
| `chat-register` | Gemini 2.5 Flash entegrasyonu, rate-limit (15 req/600s/IP) |
| `find-matches` | Danışman ↔ diaspora eşleştirme |
| `lansman-admin` | Lansman yönetim RPC |
| `send-submission-email` | E-posta bildirimleri |
| `submit-survey-response` | Anket yanıt kaydetme |

---

## 9. Build & Deployment

### Vite Konfigürasyonu (vite.config.ts)

- **Dev server:** port 8080, HMR, rag.corteqs.net proxy
- **Multiple entry points:** `index.html` + `lansman/index.html`
- **Custom plugin `standalone-commercial-documents`:**
  - `info-*.html` dosyalarını `dist/commercial/<slug>/index.html` olarak inject eder
  - Karmaşık ama zorunlu — kaldırma
- **React plugin:** @vitejs/plugin-react-swc (hızlı)
- **Path alias:** `@/*` → `src/*`

### server.mjs — Production Server (278 satır)

```
Fonksiyonlar:
1. Statik dosya serve (MIME type map, cache headers)
2. SPA fallback (route → index.html)
3. Security headers (CSP, HSTS, X-Frame-Options: DENY, vb.)
4. Runtime config injection (/env-config.js → window.__APP_CONFIG__)
5. RAG API proxy (POST /api/chat → rag.corteqs.net, rate-limit 12 req/60s/IP)
```

### Ortam Değişkenleri

```env
# Build-time (VITE_ prefix — frontend'e açık)
VITE_SUPABASE_URL=https://injprdrsklkxgnaiixzh.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=...
VITE_SUPABASE_PROJECT_ID=injprdrsklkxgnaiixzh

# Runtime only (server.mjs — frontend'e asla açma)
SUPABASE_SERVICE_ROLE_KEY=...
RAG_API_SECRET=...
```

### Deployment Akışı

```
npm run build → dist/
  └── node server.mjs (PORT=3000)
        ├── /env-config.js üret (runtime env injection)
        ├── dist/ serve et
        └── /api/chat → rag.corteqs.net proxy
```

---

## 10. TypeScript Konfigürasyonu

**Kasıtlı gevşek strict mode:**

```json
{
  "strict": false,
  "strictNullChecks": false,
  "noImplicitAny": false,
  "noUnusedLocals": false,
  "noUnusedParameters": false,
  "skipLibCheck": true
}
```

Yeni kod yazarken `strict: true` davranışını taklit et — public API'lerde explicit tip kullan.

---

## 11. Tailwind & Tema

```
Dark mode: class-based (next-themes)
Container: max 1400px
CSS değişkenleri: HSL tabanlı (--primary, --background, --sidebar-*, vb.)
Özel renkler: section-warm, glow-teal, glow-orange
Animasyonlar: accordion-down/up, float (6s infinite)
```

---

## 12. Test Altyapısı

```
Framework: Vitest 3.2.4 + Testing Library + jsdom
E2E: Playwright (yapılandırılmış, yetersiz kullanılıyor)
Setup: src/test/setup.ts — jest-dom, ResizeObserver mock
Toplam test dosyası: 53 .test.ts(x)
```

### İyi Test Örnekleri

- `src/lib/muhasebe-format.test.ts` — Para birimi, tarih, URL
- `src/lib/muhasebe-schemas.test.ts` — Zod validasyon
- `src/lib/muhasebe-aggregations.test.ts` — KPI, cashflow
- `src/components/AdminLansmanTable.test.tsx` — Component render

```bash
npm run test                          # Tek çalıştırma
npm run test:watch                    # İzleme modu
npm run test -- src/lib/foo.test.ts   # Tekil test
npm run test -- --coverage            # Coverage raporu
```

---

## 13. Kritik Kısıtlamalar

### SEO-Kilitli URL'ler (asla değiştirme)

```
/lansman, /cadde, /founders, /commercial/<slug>, /19051919, /anket
```

### Değiştirilemez Parçalar

1. **Supabase Migrations** — Silinemez, sıralanamaz. Sadece ekle.
2. **server.mjs** — `/env-config.js` üretimi ve `/api/chat` proxy davranışını koru.
3. **Vite Plugin** — `info-*.html` → `dist/commercial/` inject mantığını koru.
4. **Hardcoded Project ID** — `injprdrsklkxgnaiixzh` (`VITE_SUPABASE_URL` ile override edilebilir)
5. **RLS Policies** — Submission insert geçmişi karmaşık — test ortamında doğrula.
6. **lovable-tagger + components.json** — Lovable entegrasyonunu koru.

---

## 14. Domain Terminolojisi (Türkçe — Yeniden Adlandırma)

| Terim | Anlam |
|---|---|
| muhasebe | accounting |
| gelirler | income |
| giderler | expenses |
| nakit akışı | cash flow |
| lansman | launch/startup registration |
| cadde | street/marketplace |
| kaynak | resource |
| kişi | person (burak/baris/ortak) |
| oda | room/chamber |
| referans | referral |
| ambasador | ambassador |
| yönetici | admin |
| anket | survey |

---

## 15. Bilinen Sorunlar & Refactor Fırsatları

| Sorun | Öncelik | Çözüm |
|---|---|---|
| `src/App.tsx` monolitik (250 satır) | Yüksek | Feature-based route modülleri (muhasebe pattern) |
| Çift Supabase client | Orta | `client.ts` + `supabase.ts` birleştir |
| Karışık veri fetch stilleri | Orta | `*-api.ts` + React Query standardize et |
| Code-splitting yok | Orta | `React.lazy` + `Suspense` ekle |
| TypeScript gevşek | Düşük | Routing refactor sonrası sıkılaştır |
| Test coverage yetersiz | Orta | Playwright E2E kritik akışlar |
| Eski + yeni auth coexist | Yüksek | RolesGo canonical yönünü belirle |

---

## 16. İstatistikler

| Metrik | Değer |
|---|---|
| Component dosyaları | 222 .tsx |
| Sayfa dosyaları | 135 .tsx |
| Lib modülleri | 43 .ts |
| Hook dosyaları | 18 |
| Route sayısı | 80+ |
| Supabase migration | 118 .sql |
| Edge Function | 5 |
| Test dosyaları | 53 |
| Üretim bağımlılıkları | 76 paket |
| TypeScript strict | false (kasıtlı) |
| Dark mode | Evet (next-themes) |
| RLS | Aktif (Supabase) |

---

## 17. Geliştirme Hızlı Başlangıç

```bash
# Kurulum
npm install
npm run dev                         # http://localhost:8080

# Test
npm run test
npm run lint

# Supabase
supabase functions deploy chat-register
supabase migrations list

# Derleme ve doğrulama
npm run build
npm run start                       # dist/ serve et
BASE_URL=https://corteqs.net npm run verify:release
```

---

## 18. Yeni Özellik Eklemek İçin Şablonlar

### Admin CRUD Sayfası

```
1. src/pages/admin/<özellik>/List.tsx oluştur
2. src/lib/<özellik>-api.ts ekle
3. src/lib/<özellik>-schemas.ts (Zod) ekle
4. useQuery + useMutation hook'ları yaz
5. src/App.tsx (veya routes.tsx) route ekle
```

### Public Form

```
1. src/pages/<FormPage>.tsx oluştur
2. Zod schema tanımla
3. react-hook-form + @hookform/resolvers kullan
4. supabase.from('submissions').insert() ile gönder
5. Başarı/hata için toast kullan
6. src/App.tsx route ekle
```

### Hata Yönetim Paterni

```typescript
try {
  const data = await supabase.from('table').select()
  // işlem
} catch (error: unknown) {
  const message = error instanceof Error ? error.message : 'Beklenmedik hata'
  toast.error(message)
  console.error(error)
}
```
