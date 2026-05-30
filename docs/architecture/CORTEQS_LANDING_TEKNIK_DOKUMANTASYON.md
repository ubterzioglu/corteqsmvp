# CorteQS Landing – Teknik Dokümantasyon

Bu doküman, `corteqs_landing` reposunun mevcut teknik mimarisini (frontend, backend, veri modeli, güvenlik, test ve deployment) uçtan uca anlatır.

## 1) Sistem Özeti

- Proje tipi: React + Vite tabanlı SPA.
- Ana domain: `https://corteqs.net`
- Public alan: Landing, yarışma/kampanya sayfaları, form/AI form, WhatsApp landing akışı.
- Admin alanı: `/admin` altında yönetim paneli (üyeler, referral, sosyal medya, workspace, moderasyon ekranları).
- Veri ve auth: Supabase (Postgres + Auth + Storage + Edge Functions).

## 2) Teknoloji Stack

### Frontend çekirdek
- React `18.3.1`
- TypeScript `5.8.3`
- Vite `5.4.19`
- Router: `react-router-dom 6.30.1`
- Data cache/state: `@tanstack/react-query 5.83.0`
- Tablo katmanı: `@tanstack/react-table 8.21.3`

### UI katmanı
- Tailwind CSS `3.4.17`
- shadcn/ui + Radix primitives
- Icon: `lucide-react`
- Form: `react-hook-form`, `zod`
- Toast: `sonner` + custom toaster

### Backend/BaaS
- Supabase JS SDK `2.101.1`
- Supabase Postgres migrations: `supabase/migrations/*`
- Supabase Edge Functions:
  - `send-submission-email`
  - `chat-register`
  - `find-matches`
  - `lansman-admin` (deprecated, 410 döner)

### Test ve kalite
- Vitest + Testing Library + jsdom
- Playwright (E2E altyapısı mevcut)
- ESLint (flat config)

## 3) Uygulama Mimarisi

### Route mimarisi
- Public route’lar `src/App.tsx` içinde `PublicLayout` altında:
  - `/`, `/hakkimizda`, `/form`, `/aiform`, `/addwa`, `/lansman`, `/19051919`, `/19051919/harita`, yarışma ve commercial route’ları.
- Admin route’lar `src/App.tsx` içinde `AdminLayout` altında:
  - `/admin/members`, `/admin/referral/*`, `/admin/whatsapp-landings`, `/admin/may19/*`, `/admin/workspace/*`, vb.

### Katmanlar
- `src/pages/*`: Route seviyesinde sayfalar.
- `src/components/*`: Sayfa içi bileşenler ve UI parçaları.
- `src/lib/*`: İş kuralları ve servis fonksiyonları (`submissions`, `whatsapp-landings`, `may19-campaign`, `admin`, `mail`).
- `src/integrations/supabase/*`: Typed Supabase client + DB tipleri.

### Runtime config yaklaşımı
- Frontend, Supabase bilgilerini iki kaynaktan alır:
  - Build-time: `import.meta.env.VITE_*`
  - Runtime: `window.__APP_CONFIG__` (`env-config.js` ile enjekte edilir)
- Bu sayede yeniden build almadan ortam değişkeni güncellenebilir.

## 4) Veri Modeli ve Ana Akışlar

### Temel tablolar
- `public.submissions`:
  - Ana kayıt havuzu (form, chatbot, wa kaynakları).
  - `source_type`: `form | chatbot | wa`
  - Referral alanları, doküman metadata’sı, durum alanları (`new/contacted/archived`) içerir.
- `public.admin_users`:
  - Admin yetki kontrolü için allow-list tablosu.
- `public.may19_campaign_submissions`:
  - 19 Mayıs fikir/anı gönderimleri.
- `public.whatsapp_landings` ve `public.whatsapp_join_requests`:
  - WhatsApp topluluk landing’leri ve katılım talepleri.
- `public.referral_*` tabloları:
  - Source/group/type/code ve kullanım kayıtları.
- `public.matches`:
  - AI eşleşme sonuçlarının kalıcı kaydı.
- `public.edge_rate_limits`:
  - Edge Function rate-limit durum tablosu.

### Kayıt akışı (public form)
1. Form verisi frontend’de normalize edilir (`toSubmissionInsert`).
2. Referral kod varsa `validate_and_bind_referral_code` RPC doğrulanır.
3. Doküman varsa `submission-documents` bucket’ına yüklenir.
4. `submissions` insert edilir.
5. Asenkron mail bildirimi `send-submission-email` function ile tetiklenir.

### AI kayıt akışı
1. Kullanıcı `chat-register` function ile sohbet eder.
2. Gemini fonksiyon çağrısı ile alanlar (`category`, `fullname`, `email`, vb.) çıkarılır.
3. Kullanıcı onayından sonra kayıt `submissions` tablosuna `source_type='chatbot'` ile yazılır.
4. İsteğe bağlı eşleşme için `find-matches` çağrılır ve `matches` tablosuna persist edilir.

### 19 Mayıs kampanya akışı
- `submitMay19CampaignEntry` ile `may19_campaign_submissions` insert edilir.
- Admin moderasyon sayfalarında status/review notes güncellenir.

## 5) Güvenlik Tasarımı

### RLS ve erişim
- `submissions` insert anon/auth için açık; select/update admin kısıtlı.
- Admin erişimi `public.is_admin(auth.uid())` ve `admin_users` tablosu ile korunur.
- Hassas storage bucket (`submission-documents`) public değil; select/delete admin kısıtlı.

### Edge function güvenliği
- `supabase/config.toml` içinde function’larda `verify_jwt = true`.
- Origin allow-list kontrolü var.
- Body size limit ve IP tabanlı rate-limit var (`edge_rate_limits` üzerinden).

### Proxy ve transport güvenliği
- Nginx ve node server tarafında güvenlik header’ları aktif:
  - CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer/Permissions policy.
- `/api/chat` sadece `POST` + `application/json` kabul eder.
- `RAG_API_SECRET` yalnızca server tarafında kullanılır.

## 6) Deployment ve Çalışma Ortamı

### Docker (önerilen)
- Multi-stage build:
  - Build stage: `node:22-alpine`, `npm ci`, `npm run build`
  - Runtime stage: `nginx:1.27-alpine`, static `dist` serve
- `docker-entrypoint-env.sh`:
  - `env-config.js` üretir
  - nginx config içinde `__RAG_API_SECRET__` placeholder’ını set eder

### Alternatif runtime (`server.mjs`)
- `dist` klasörünü HTTP server ile sunar.
- SPA fallback uygular.
- `/api/chat` için upstream proxy + rate-limit + timeout uygular.
- Asset cache politikası:
  - `/assets/*`: immutable cache
  - `index.html` ve `env-config.js`: no-store

### Ortam değişkenleri
- Frontend/runtime:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_PUBLISHABLE_KEY`
  - `VITE_SUPABASE_PROJECT_ID`
- Server-only:
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `RAG_API_SECRET`
- Function secret’ları:
  - `RESEND_API_KEY`, `MAIL_FROM`, `MAIL_TO_ADMIN`, `MAIL_REPLY_TO`, `MAIL_SEND_CONFIRMATION`
  - `GEMINI_API_KEY` (`chat-register` ve `find-matches` için)

## 7) Test, Build ve Operasyon Komutları

- Geliştirme: `npm run dev`
- Build: `npm run build`
- Local preview: `npm run preview`
- Test: `npm test`
- Watch test: `npm run test:watch`
- Lint: `npm run lint`
- Release doğrulama: `npm run verify:release`

## 8) Önemli Tasarım Kararları

- Public kayıt insert açık, admin görüntüleme kapalı: veri toplama + güvenli yönetim dengesi.
- Runtime env injection: tek artifact ile çok ortam deploy.
- AI akışında PII redaction ve kontrollü function-calling şeması.
- Submission insert için geriye uyum mantığı (`insertSubmissionWithCompatibility`) ile şema drift riskinin azaltılması.
- `lansman-admin` fonksiyonu bilinçli olarak deprecated (410), doğrudan RLS tabanlı tablo erişimi tercih ediliyor.

## 9) Bilinen Riskler ve İzleme Önerileri

- Şema drift: client tipleri ile prod migration seti senkron tutulmalı.
- Edge function quota/rate-limit: `edge_rate_limits` tablosu düzenli izlenmeli.
- Mail başarısızlığı: kayıt akışı mailden bağımsız, ancak delivery metriği (`notification_sent_at`) takip edilmeli.
- CSP değişiklikleri: yeni üçüncü parti servis eklenirse CSP `connect-src`/`img-src` güncellenmeli.

## 10) Dizin Referansı

```text
src/
  App.tsx
  pages/
  components/
  lib/
  integrations/supabase/
supabase/
  migrations/
  functions/
  config.toml
Dockerfile
nginx.conf.template
docker-entrypoint-env.sh
server.mjs
```
