# CorteQS Security Audit Guide

Bu dokumanin amaci, bu repository icin harici bir LLM'e veya ChatGPT'ye yeterli baglam vermektir. Hedef, bu baglamdan hareketle yuksek kaliteli bir guvenlik audit prompt'u uretmektir.

Bu dosya bir "proje ozeti + audit kapsam dokumani" olarak okunmalidir. Buradaki bilgiler repo icindeki dosyalardan cikarilmistir; canli production ortamina dogrudan baglanilmamistir.

## 1. Proje Ozeti

- Proje adi: `corteqs_landing`
- Tip: React + Vite tabanli landing site + Supabase destekli admin panel
- Ana amac:
  - public formlar ile kayit toplamak
  - admin panelden kayitlari yonetmek
  - lansman kayitlarini toplamak
  - referral / resource / workspace verilerini admin tarafinda yonetmek
  - bazi AI destekli akislari calistirmak

## 2. Teknoloji Yigini

- Frontend:
  - React 18
  - TypeScript
  - Vite
  - React Router
  - TanStack Query
  - React Hook Form
  - Zod
  - Tailwind
  - shadcn/ui + Radix UI
- Backend/BaaS:
  - Supabase
  - Supabase Auth
  - Supabase Postgres
  - Supabase Storage
  - Supabase Edge Functions
- Mail:
  - Resend
- AI / harici API:
  - Google Gemini API
  - harici RAG endpoint: `https://rag.corteqs.net/api/chat`
- Deployment:
  - Docker
  - Nginx
  - alternatif runtime server: `server.mjs`

## 3. Uygulama Yuzeyleri

### Public yuzey

- `/`
- `/hakkimizda`
- `/founders`
- `/radar`
- `/commercial`
- `/commercial/:slug`
- `/diaspora/:slug`
- `/lansman`
- `/form`
- `/privacy-policy`
- `/founding-1000`
- `/blogger-yarismasi`
- `/vlogger-yarismasi`
- site icindeki RAG chat arayuzu
- chat-register bar / AI destekli kayit akisi

### Admin yuzey

- `/admin`
- `/admin/members`
- `/admin/lansman`
- `/admin/referral`
- `/admin/referral/sources`
- `/admin/referral/groups`
- `/admin/referral/types`
- `/admin/marquee`
- `/admin/advisors/:profile`
- `/admin/social-media`
- `/admin/about`
- `/admin/workspace/*`
- `/admin` altindaki muhasebe rotalari

### API / function / server yuzeyi

- Supabase Edge Functions:
  - `send-submission-email`
  - `chat-register`
  - `find-matches`
  - `lansman-admin` (deprecated gorunuyor)
- reverse proxy:
  - `POST /api/chat` -> `https://rag.corteqs.net/api/chat`

## 4. Kimlik Dogrulama ve Yetkilendirme

### Admin auth modeli

- Admin login, Supabase Auth uzerinden yapiliyor.
- Admin olabilmek icin login yeterli degil; kullanicinin `admin_users` tablosunda da bulunmasi gerekiyor.
- Bu kontrol frontend tarafinda `userIsAdmin()` ile yapiliyor.

Ilgili dosyalar:

- `src/components/admin/AdminLayout.tsx`
- `src/lib/admin.ts`
- `src/integrations/supabase/client.ts`

### Dikkat edilmesi gereken nokta

- Admin korumasi yalnizca frontend route guard ile degil, esas olarak Supabase RLS policy'leri ile guvenli olmali.
- Audit prompt'u, "frontend'de gizli ama backend'de acik" tipindeki IDOR/RLS eksiklerini ozellikle sorgulamali.

## 5. Ortam Degiskenleri ve Gizli Veriler

Repo icinde gorülen degiskenler:

### Frontend runtime/public env

- `VITE_SUPABASE_PROJECT_ID`
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

### Server-only env / secret

- `SUPABASE_SERVICE_ROLE_KEY`
- `RAG_API_SECRET`

### Edge Function secret'lari

- `RESEND_API_KEY`
- `MAIL_FROM`
- `MAIL_TO_ADMIN`
- `MAIL_REPLY_TO`
- `MAIL_SEND_CONFIRMATION`
- `GEMINI_API_KEY`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

Notlar:

- Gercek secret degerleri prompt'a konulmamalidir.
- `.env.local` gibi dosyalarda gercek degerler olabilir; prompt secret istememeli, yalnizca degisken isimleriyle calismalidir.
- `SUPABASE_SERVICE_ROLE_KEY` kesinlikle frontend'e sizmamali.

## 6. Supabase Yapisi

Repo ve kod kullanimina gore aktif Supabase yuzeyi en az su nesneleri iceriyor:

### Tablolar

- `admin_users`
- `submissions`
- `lansman_registrations`
- `referral_sources`
- `referral_groups`
- `referral_types`
- `referral_codes`
- `referral_code_usages`
- `marquee_items`
- `news_posts`
- `matches`
- `expenses`
- `incomes`
- `social_media_links`
- `advisor_social_media_links`
- `consultant_social_media_links`
- `influencer_social_media_links`
- `contributor_social_media_links`
- `command_center_items`
- `resource_entries`
- `mvp_items`

### Storage bucket'lari

- `submission-documents`
- `cv-files`
- `arge-files`
- migration'larda marquee ile ilgili bucket tanimlari da kontrol edilmeli

### RPC / SQL function

- `get_submission_documents_bucket_stats()`
- `validate_and_bind_referral_code(...)`
- `is_admin(uid uuid)`
- `set_updated_at()`
- `set_command_center_items_updated_at()`
- `set_mvp_items_updated_at()`

Not:

- Tam kapsam icin `supabase/migrations/` incelenmeli.
- Audit prompt'u, her migration'ı RLS, storage policy, privilege ve veri sizintisi acisindan incelemeye yonlendirmeli.

## 7. Onemli Kod Dosyalari

### Uygulama ve route girisi

- `src/App.tsx`

### Supabase client

- `src/integrations/supabase/client.ts`
- `src/lib/supabase.ts`

Bu iki client dosyasi arasindaki fark audit icin onemli:

- `src/integrations/supabase/client.ts`
  - session persistence acik
  - admin login akisi burada
- `src/lib/supabase.ts`
  - `persistSession: false`
  - farkli moduller tarafindan kullaniliyor olabilir

Bu ayrim yanlis client secimi, tutarsiz auth davranisi veya beklenmeyen session/anon davranislarina yol aciyor mu diye kontrol edilmeli.

### Admin

- `src/components/admin/AdminLayout.tsx`
- `src/lib/admin.ts`
- `src/pages/admin/*`
- `src/pages/AdminLansmanPage.tsx`

### Form ve kayit akislar

- `src/components/RegisterInterestForm.tsx`
- `src/components/BackerForm.tsx`
- `src/components/ChatRegisterBar.tsx`
- `src/components/LansmanForm.tsx`
- `src/lib/submissions.ts`
- `src/lib/lansman.ts`
- `src/lib/mail.ts`

### Chat / AI / proxy

- `src/components/chat/RagChat.tsx`
- `src/lib/ragApi.ts`
- `server.mjs`
- `supabase/functions/chat-register/index.ts`
- `supabase/functions/find-matches/index.ts`

### Guvenlik yardimci dosyalari

- `src/lib/security.ts`

### Infra / deploy

- `Dockerfile`
- `nginx.conf.template`
- `docker-entrypoint-env.sh`
- `supabase/config.toml`

## 8. Mevcut Guvenlik Mekanizmalari

Kodda gorulen bazi korumalar:

- Supabase Auth tabanli admin login
- `admin_users` allowlist kontrolu
- bazi migration'larda RLS
- dosya uzantisi ve boyut dogrulamalari
- URL sanitization yardimcilari
- HTML/script temizleme icin basit string-based sanitization
- Nginx / Node server uzerinde bazi security header'lari
- `/api/chat` icin sadece `POST`
- path normalization ile temel path traversal onlemi (`server.mjs`)
- CORS allowlist'leri Edge Function tarafinda tanimli

## 9. Ozel Risk Alanlari

ChatGPT'nin yazacagi security audit prompt'u asagidaki alanlari ozellikle hedeflemeli.

### 9.1 Supabase RLS ve data exposure

- Tum tablolar icin `anon` / `authenticated` yetkileri dogru mu?
- Admin-only olmasi gereken tablolar gercekten yalnizca admin tarafindan okunup yazilabiliyor mu?
- `workspace` tablolarinda yalnizca `authenticated` policy varsa bu cok genis yetki veriyor olabilir.
- Storage bucket policy'leri fazla genis olabilir.
- Public insert acik tablolar spam, abuse veya data pollution'a acik olabilir.

### 9.2 Edge Functions

- `supabase/config.toml` icinde:
  - `chat-register` -> `verify_jwt = true`
  - `find-matches` -> `verify_jwt = true`
  - `lansman-admin` -> `verify_jwt = false`
- `lansman-admin` deprecated olsa da hala deploy edilirse istenmeyen yuzey olusturabilir.
- Edge Function'larda CORS fallback davranisi, origin eslesmezse default origin donuyor; bunun guvenlik etkisi degerlendirilmeli.
- Service role kullanan function'larda input validation yeterli mi diye bakilmali.

### 9.3 AI entegrasyonlari

- `chat-register` ve `find-matches` harici LLM endpoint'ine veri gonderiyor.
- Prompt injection, sensitive data over-sharing, uncontrolled tool output parsing riskleri incelenmeli.
- Kullanicidan gelen metinler LLM'e nasil iletiliyor?
- PII veya hassas kayit verileri gereksiz yere harici servislere gidiyor mu?

### 9.4 RAG proxy

- `server.mjs` ve `nginx.conf.template` altinda `/api/chat` reverse proxy var.
- Rate limit yok gibi gorunuyor.
- Request body boyut limiti, abuse korumasi, timeout ve content-type denetimi audit edilmeli.
- `RAG_API_SECRET` yalnizca server tarafinda mi kaliyor kontrol edilmeli.

### 9.5 Formlar ve input validation

- Public formlarda server-side validation yetersiz olabilir.
- Bircok alanda validation frontend'de; bunun tek basina yeterli olmadigi vurgulanmali.
- URL alanlari, text alanlari, referral alanlari ve dosya yuklemeleri ayrica incelenmeli.
- `sanitizeHtml()` cok basit regex tabanli; bypass ihtimali yuksek olabilir.

### 9.6 File upload ve storage

- `submission-documents` public URL ile donuyor.
- Yuklenen dokumanlarin public olmasi is gereksinimi mi, yoksa gizlilik riski mi?
- MIME type ve extension kontrolu istemci tarafinda; server/storage tarafinda da teyit edilmeli.
- Dosya adlari, collision, content sniffing ve malware yukleme riskleri dusunulmeli.

### 9.7 Admin panel

- Brute-force / rate limiting yok gibi gorunuyor.
- Reset password akisi acik; enumeration riski / bilgi sizintisi var mi incelenmeli.
- Admin UI'da export/import ve bulk islem alanlari hassas olabilir.
- Yetkisiz authenticated user'larin admin olmayan ama `authenticated` policy ile acilan alanlara erisimi incelenmeli.

### 9.8 Reverse proxy / deployment

- Nginx CSP basligi yok gibi gorunuyor.
- `server.mjs` ve nginx config arasinda davranis farki olabilir.
- Runtime `env-config.js` public servis ediliyor; yalnizca publish edilmesi gereken degiskenler cikiyor mu kontrol edilmeli.
- Docker image icine istemeden hassas dosya giriyor mu kontrol edilmeli.

## 10. Koddan Gorulen Dikkat Ceken Noktalar

Bunlar kesin zafiyet tespiti degildir; audit prompt'unun bu alanlari derinlestirmesi istenmelidir.

- Iki farkli Supabase client yapisi mevcut.
- `src/lib/security.ts` icindeki HTML sanitization regex tabanli ve sinirli.
- `submission-documents` icin `getPublicUrl()` kullaniliyor.
- `find-matches` service role ile `submissions` verisini cekip AI servisine ozet bilgiler gonderiyor.
- `chat-register` ve `find-matches` CORS allowlist mantigi dikkatli audit edilmeli.
- `lansman-admin` function JWT dogrulamasi kapali oldugu halde repo icinde duruyor.
- Workspace tablolari icin `authenticated` write policy varsa admin olmayan kullanicilar da yazabilir olabilir.
- Public form insert akislarinda anti-spam / CAPTCHA / rate limit gorunmuyor.

## 11. Audit Icin Beklenen Inceleme Tarzi

ChatGPT'den yazilacak prompt su davranisi istemeli:

- Kod tabanini dosya dosya incele
- RLS, storage policy, auth ve server-side trust boundary'lerine agirlik ver
- "frontend'de var ama backend'de yok" tarzı kontrolleri yakala
- PII akisini izle
- Secret exposure risklerini ara
- Public endpoint abuse senaryolari uret
- Her bulgu icin:
  - siddet
  - etkilenen dosya / alan
  - exploitation mantigi
  - beklenen etki
  - cozum onerisi
  - gerekiyorsa test / PoC fikri
  ver
- Sonuc verirken ozellikle:
  - gerçek zafiyet
  - muhtemel risk
  - sadece kod kalitesi konusu
  ayrimini yap

## 12. Audit Kapsamina Dahil Edilmesi Gereken Dosyalar

Asagidaki path'ler prompt'ta oncelikli inceleme listesi olarak gecmeli:

- `src/App.tsx`
- `src/components/admin/AdminLayout.tsx`
- `src/lib/admin.ts`
- `src/lib/submissions.ts`
- `src/lib/lansman.ts`
- `src/lib/mail.ts`
- `src/lib/security.ts`
- `src/lib/ragApi.ts`
- `src/integrations/supabase/client.ts`
- `src/lib/supabase.ts`
- `src/components/RegisterInterestForm.tsx`
- `src/components/BackerForm.tsx`
- `src/components/ChatRegisterBar.tsx`
- `src/components/LansmanForm.tsx`
- `src/pages/admin/**/*`
- `src/pages/AdminLansmanPage.tsx`
- `server.mjs`
- `nginx.conf.template`
- `Dockerfile`
- `supabase/config.toml`
- `supabase/functions/chat-register/index.ts`
- `supabase/functions/find-matches/index.ts`
- `supabase/functions/send-submission-email/index.ts`
- `supabase/functions/lansman-admin/index.ts`
- `supabase/migrations/*.sql`

## 13. ChatGPT'ye Verilecek Ek Yonlendirme

Prompt yazarken su sinirlari belirtmek faydali olur:

- Gercek secret degerleri isteme.
- Sadece repo baglamina gore analiz yap.
- Eksik canli ortam verisini "varsayim" olarak etiketle.
- Ozellikle Supabase RLS/policy/storage incelemesini derinlestir.
- OWASP web, auth, file upload, SSRF-benzeri proxy abuse, IDOR, privilege escalation, data leak ve prompt injection basliklarini kapsa.

## 14. Kisa Sonuc

Bu repo, basit bir landing page'den daha genis bir yuzeye sahip:

- public form toplama
- admin auth ve panel
- Supabase storage
- edge functions
- AI entegrasyonlari
- reverse proxy ile RAG backend baglantisi
- workspace benzeri admin veri katmanlari

Dolayisiyla yazilacak security audit prompt'u sadece React frontend kodunu degil, su trust boundary'leri merkezine almalidir:

- browser -> Supabase
- browser -> edge function
- browser -> `/api/chat` proxy
- edge function -> service role
- edge function -> external AI provider
- deployment/runtime env injection
