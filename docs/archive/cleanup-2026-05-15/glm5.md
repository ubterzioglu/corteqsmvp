# CorteQS Landing – Clean Code, Security Check ve Repo Temizliği Agent Promptu

Bu dosya `corteqs_landing` projesinde GLM-5 veya benzeri bir kod ajanına verilecek çalışma talimatıdır. Amaç; projeyi bozmadan kod temizliği yapmak, gereksiz dosyaları kontrollü şekilde ayırmak, secret sızıntısı riskini azaltmak, `.gitignore` dosyasını iyileştirmek ve güvenlik kontrollerini sistematik biçimde tamamlamaktır.

---

## 0. Proje Bağlamı

Proje: `corteqs_landing`

Teknik yapı:

- React `18.3.1`
- TypeScript `5.8.3`
- Vite `5.4.19`
- React Router `6.30.1`
- TanStack Query `5.83.0`
- TanStack Table `8.21.3`
- Tailwind CSS `3.4.17`
- shadcn/ui + Radix primitives
- Supabase JS SDK `2.101.1`
- Supabase Postgres migrations
- Supabase Edge Functions
- Vitest + Testing Library + jsdom
- Playwright E2E altyapısı
- ESLint flat config

Ana alanlar:

- Public site: landing, formlar, AI form, kampanya sayfaları, WhatsApp landing akışı
- Admin panel: `/admin` altında üyeler, referral, WhatsApp landing, May19, workspace ve moderasyon ekranları
- Backend/BaaS: Supabase Auth, Postgres, Storage, Edge Functions
- Deployment: Docker + Nginx veya alternatif `server.mjs`

Kritik güvenlik notları:

- `SUPABASE_SERVICE_ROLE_KEY`, `RAG_API_SECRET`, `RESEND_API_KEY`, `GEMINI_API_KEY` gibi değerler hiçbir şekilde frontend bundle içine girmemelidir.
- `VITE_*` değişkenleri tarayıcıya açık kabul edilmelidir.
- `submission-documents` gibi hassas bucketlar public yapılmamalıdır.
- Admin erişimi `admin_users` ve `public.is_admin(auth.uid())` mantığı ile korunmalıdır.
- Edge Function tarafında JWT doğrulama, origin allow-list, body size limit ve rate-limit davranışı korunmalıdır.

---

## 1. Agent Rolü

Sen bu projede çalışan kıdemli bir **Clean Code + Security + Repository Hygiene Engineer** gibi davran.

Görevlerin:

1. Kodu sadeleştir.
2. Kullanılmayan import, component, helper, type ve dosyaları tespit et.
3. Gereksiz dosyaları silmeden önce kontrollü bir arşiv klasörüne taşı.
4. Secret, token, API key ve yanlışlıkla commitlenmiş ortam dosyalarını kontrol et.
5. `.gitignore` dosyasını güvenli ve proje yapısına uygun hale getir.
6. Supabase, Edge Function, admin panel ve frontend güvenlik risklerini kontrol et.
7. Her değişiklikten sonra lint, test ve build kontrollerini çalıştır.
8. Büyük refactor yerine küçük, güvenli ve geri alınabilir değişiklikler yap.

---

## 2. Çalışma Kuralları

### 2.1. Kesin yasaklar

- Production secret değerlerini ekrana basma.
- Gerçek `.env` içeriğini rapora yazma.
- `SUPABASE_SERVICE_ROLE_KEY` değerini frontend koduna taşıma.
- Migration dosyalarını gereksiz yere değiştirme.
- RLS policylerini test etmeden gevşetme.
- Admin auth kontrolünü kaldırma.
- Edge Function `verify_jwt` ayarlarını zayıflatma.
- Public form insert akışını bozacak geniş refactor yapma.
- Gereksiz dosyaları doğrudan silme; önce arşiv klasörüne taşı.
- Tek seferde çok büyük değişiklik yapma.

### 2.2. Zorunlu yaklaşım

- Her adımı küçük commit mantığıyla uygula.
- Önce mevcut durumu analiz et, sonra değişiklik yap.
- Her dosya taşıma için neden belirt.
- Şüpheli durumda silme, arşivle.
- Çalışan route, form, admin panel ve Supabase akışlarını koru.
- Değişikliklerden sonra minimum şu kontrolleri çalıştır:
  - `npm run lint`
  - `npm test`
  - `npm run build`
  - varsa `npm run verify:release`

---

## 3. Beklenen Çıktılar

Agent çalışma sonunda şu dosyaları üretmeli veya güncellemelidir:

```text
/docs/cleanup/CLEAN_CODE_SECURITY_REPORT.md
/docs/cleanup/ARCHIVED_FILES.md
/docs/cleanup/SECRET_SCAN_REPORT.md
/docs/cleanup/GITIGNORE_REVIEW.md
```

Eğer `/docs/cleanup` yoksa oluştur.

Raporlarda gerçek secret değeri yazma. Sadece şu formatı kullan:

```text
[REDACTED_SECRET_FOUND] file:line | variable/pattern name | risk level | recommended action
```

---

## 4. Faz 1 – Repo Durumunu Anla

### Todo 1.1 – Git durumunu kontrol et

PowerShell:

```powershell
git status --short
git branch --show-current
```

Beklenen:

- Mevcut branch not edilir.
- Kullanıcının halihazırdaki değişiklikleri varsa ezilmez.
- Çalışmaya başlamadan önce mevcut değişiklikler rapora yazılır.

### Todo 1.2 – Paket ve scriptleri incele

PowerShell:

```powershell
Get-Content package.json
```

Kontrol et:

- `scripts`
- `dependencies`
- `devDependencies`
- test/lint/build komutları
- kullanılmayan veya tekrar eden paket ihtimali

### Todo 1.3 – Ana dizinleri haritala

PowerShell:

```powershell
Get-ChildItem -Force
Get-ChildItem src -Recurse -File | Select-Object FullName
Get-ChildItem supabase -Recurse -File | Select-Object FullName
```

Raporla:

- Public route dosyaları
- Admin route dosyaları
- Shared componentler
- Supabase function dosyaları
- Migrations
- Config dosyaları
- Test dosyaları
- Potansiyel gereksiz dosyalar

---

## 5. Faz 2 – Clean Code Analizi

### Todo 2.1 – Kullanılmayan importları temizle

Kontrol alanları:

- `src/pages/**`
- `src/components/**`
- `src/lib/**`
- `src/integrations/**`
- test dosyaları

Yapılacaklar:

- Kullanılmayan importları kaldır.
- Kullanılmayan değişkenleri kaldır veya gerekiyorsa `_` prefix ile açık hale getir.
- Gereksiz console logları kaldır.
- Sadece gerçekten debug amacıyla kalması gereken logları koru ve açıklama ekle.

Kontrol komutu:

```powershell
npm run lint
```

### Todo 2.2 – Dead code ve kullanılmayan dosyaları tespit et

Önerilen kontroller:

```powershell
npx --yes ts-prune
npx --yes depcheck
```

Not:

- Bu araçların çıktısı doğrudan doğru kabul edilmemeli.
- Route üzerinden dinamik kullanılan componentler false positive olabilir.
- shadcn/ui componentleri doğrudan import edilmiyor gibi görünebilir; dikkatli incele.

Rapor formatı:

```text
Potential dead code:
- file path
- symbol/component name
- detected by
- manual verification result
- action: keep / archive / refactor / remove later
```

### Todo 2.3 – Component tekrarlarını azalt

Kontrol et:

- Aynı kart, tablo, modal, form alanı veya badge yapısı tekrar ediyor mu?
- Admin sayfalarında aynı loading/error/empty state kalıpları tekrar ediyor mu?
- Public formlarda aynı validation veya normalizasyon mantığı tekrar ediyor mu?

Yapılacaklar:

- Küçük ortak component çıkar.
- Büyük refactor yapma.
- Davranışı değiştirme.
- Görsel yapıyı bozma.

Önerilen ortaklaştırma alanları:

```text
src/components/common/
src/components/admin/shared/
src/lib/validators/
src/lib/formatters/
```

### Todo 2.4 – TypeScript tiplerini sıkılaştır

Kontrol et:

- Gereksiz `any`
- Eksik return type
- Supabase response için gevşek tipler
- Form schema ile TypeScript type uyumsuzluğu
- Optional alanların yanlış varsayılması

Yapılacaklar:

- `any` yerine doğru type veya `unknown` kullan.
- Supabase typed client ile uyumu koru.
- Zod schema ve form type eşleşmesini kontrol et.
- Gereksiz type castleri kaldır.

Kontrol:

```powershell
npx tsc --noEmit
```

Eğer proje `typecheck` scriptine sahipse onu kullan:

```powershell
npm run typecheck
```

---

## 6. Faz 3 – Gereksiz Dosyaları Arşivleme

### Todo 3.1 – Arşiv klasörü oluştur

Gereksiz veya şüpheli dosyalar doğrudan silinmeyecek. Önce şu klasöre taşınacak:

```text
_archive/cleanup-YYYY-MM-DD/
```

Örnek:

```text
_archive/cleanup-2026-05-15/
```

PowerShell:

```powershell
$Date = Get-Date -Format "yyyy-MM-dd"
New-Item -ItemType Directory -Force -Path "_archive/cleanup-$Date"
```

### Todo 3.2 – Arşivlenecek dosya adaylarını belirle

Aday kategoriler:

- Eski test çıktıları
- Geçici debug dosyaları
- Kullanılmayan deneme componentleri
- Eski dokümantasyon kopyaları
- Duplicate config dosyaları
- Eski build çıktıları
- Local export dosyaları
- Geçici JSON/CSV çıktıları
- Screenshot/video test artifactleri
- Playwright trace/report çıktıları

Şunları otomatik arşivleme:

- `src/App.tsx`
- `src/main.tsx`
- `src/integrations/supabase/**`
- `supabase/migrations/**`
- `supabase/functions/**`
- `Dockerfile`
- `nginx.conf.template`
- `docker-entrypoint-env.sh`
- `server.mjs`
- `.env.example`
- `package.json`
- `package-lock.json`
- `vite.config.*`
- `tailwind.config.*`
- `tsconfig*.json`

### Todo 3.3 – Dosya taşıma raporu yaz

Her arşivlenen dosya için `/docs/cleanup/ARCHIVED_FILES.md` içine yaz:

```text
| Original Path | Archived Path | Reason | Verified Safe? | Notes |
| --- | --- | --- | --- | --- |
```

### Todo 3.4 – Taşıma sonrası kırılım kontrolü yap

PowerShell:

```powershell
npm run lint
npm test
npm run build
```

Eğer hata varsa:

- Dosyayı geri taşı.
- Hatanın nedenini rapora yaz.
- Aynı dosyayı tekrar arşivlemeye çalışma.

---

## 7. Faz 4 – Secret ve Sensitive Data Kontrolü

### Todo 4.1 – Env dosyalarını kontrol et

Kontrol edilecek dosyalar:

```text
.env
.env.local
.env.development
.env.production
.env.*.local
.env.example
.env.sample
```

Kurallar:

- Gerçek `.env*` dosyaları git içinde olmamalı.
- `.env.example` kalabilir ama gerçek değer içermemeli.
- `.env.example` sadece placeholder içermeli.
- `VITE_*` dışındaki server secretlar frontend kodunda kullanılmamalı.

Örnek güvenli `.env.example` formatı:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-publishable-anon-key
VITE_SUPABASE_PROJECT_ID=your-project-id
RAG_API_SECRET=replace-with-server-only-secret
SUPABASE_SERVICE_ROLE_KEY=replace-with-server-only-service-role-key
RESEND_API_KEY=replace-with-resend-api-key
GEMINI_API_KEY=replace-with-gemini-api-key
MAIL_FROM=no-reply@example.com
MAIL_TO_ADMIN=admin@example.com
MAIL_REPLY_TO=support@example.com
MAIL_SEND_CONFIRMATION=false
```

### Todo 4.2 – Kod içinde secret pattern ara

PowerShell:

```powershell
git grep -n -I "SUPABASE_SERVICE_ROLE_KEY"
git grep -n -I "RAG_API_SECRET"
git grep -n -I "RESEND_API_KEY"
git grep -n -I "GEMINI_API_KEY"
git grep -n -I "VITE_"
git grep -n -I "sk-"
git grep -n -I "eyJ"
git grep -n -I "xoxb-"
git grep -n -I "api_key"
git grep -n -I "apikey"
git grep -n -I "access_token"
git grep -n -I "refresh_token"
```

Değerlendir:

- Değer gerçek mi, placeholder mı?
- Frontend bundle içine giriyor mu?
- Server-only kalması gereken şey client tarafında mı?
- Loglanıyor mu?
- Public dokümana yazılmış mı?

### Todo 4.3 – Git history içinde secret riski kontrolü

PowerShell:

```powershell
git log --all --oneline --decorate -n 50
git grep -n -I "SUPABASE_SERVICE_ROLE_KEY" $(git rev-list --all)
git grep -n -I "RAG_API_SECRET" $(git rev-list --all)
git grep -n -I "RESEND_API_KEY" $(git rev-list --all)
git grep -n -I "GEMINI_API_KEY" $(git rev-list --all)
```

Not:

- Bu komutlar çok büyük repoda yavaş olabilir.
- Secret geçmişte commitlendiyse sadece dosyadan silmek yetmez.
- Gerçek secret bulunduysa rapora değeri yazma.
- Aksiyon önerisi: ilgili key revoke/rotate edilmeli.

### Todo 4.4 – Secret scan raporu oluştur

`/docs/cleanup/SECRET_SCAN_REPORT.md` formatı:

```text
# Secret Scan Report

## Summary
- Real secret found: yes/no/unknown
- Frontend exposure risk: low/medium/high
- Git history risk: low/medium/high

## Findings
| File | Line | Pattern | Risk | Action |
| --- | --- | --- | --- | --- |

## Required Actions
- [ ] Rotate exposed key if real value was committed
- [ ] Move server-only key to server runtime
- [ ] Replace sample value with placeholder
- [ ] Update .gitignore
- [ ] Re-run build and verify no secret in dist
```

### Todo 4.5 – Build çıktısında secret sızıntısı kontrol et

PowerShell:

```powershell
npm run build
Get-ChildItem dist -Recurse -File | Select-String -Pattern "SUPABASE_SERVICE_ROLE_KEY","RAG_API_SECRET","RESEND_API_KEY","GEMINI_API_KEY","sk-","xoxb-" -SimpleMatch
```

Beklenen:

- `dist` içinde server-only secret adı veya gerçek değer bulunmamalı.
- `VITE_SUPABASE_URL` ve publishable/anon key görünebilir; bunlar public kabul edilir.
- Public key görünüyorsa bunun bilerek public olduğu rapora yazılır.

---

## 8. Faz 5 – `.gitignore` Kontrolü

### Todo 5.1 – Mevcut `.gitignore` dosyasını incele

PowerShell:

```powershell
Get-Content .gitignore
```

### Todo 5.2 – Önerilen `.gitignore` içeriğini karşılaştır

Aşağıdaki kategoriler mutlaka kapsanmalı:

```gitignore
# dependencies
node_modules/
.pnpm-store/

# build outputs
dist/
build/
.vite/

# test outputs
coverage/
playwright-report/
test-results/
blob-report/

# logs
logs/
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*

# env files
.env
.env.local
.env.development.local
.env.test.local
.env.production.local
.env.*.local

# keep examples
!.env.example
!.env.sample

# OS / editor
.DS_Store
Thumbs.db
.vscode/*
!.vscode/extensions.json
!.vscode/settings.example.json
.idea/

# Supabase local artifacts
supabase/.branches/
supabase/.temp/
supabase/.env

# local runtime files
env-config.js
*.pem
*.key
*.crt

# archive / temporary cleanup
_archive/tmp/
_archive/local/
```

Dikkat:

- `_archive/cleanup-YYYY-MM-DD/` klasörü projede takip edilecekse ignore etme.
- Arşiv klasörü sadece lokal tutulacaksa `.gitignore` içine ekle ve bunu raporda açıkça belirt.
- `.env.example` asla ignore edilmemeli.

### Todo 5.3 – Git ignore doğrulaması yap

PowerShell:

```powershell
git status --ignored --short
```

Beklenen:

- `.env` dosyaları ignored olmalı.
- `dist`, `coverage`, `playwright-report`, `test-results` ignored olmalı.
- Kaynak kod dosyaları yanlışlıkla ignored olmamalı.

---

## 9. Faz 6 – Supabase ve RLS Güvenlik Kontrolü

### Todo 6.1 – Migration dosyalarını incele ama gereksiz değiştirme

Kontrol et:

- `submissions` için public insert açık mı?
- Select/update/delete sadece admin için mi?
- `admin_users` tablosu doğrudan public erişime açık mı?
- `is_admin(auth.uid())` fonksiyonu doğru kullanılıyor mu?
- `submission-documents` bucket public mi değil mi?
- Storage policyleri doğru mu?

Rapor formatı:

```text
| Area | Expected | Current | Risk | Action |
| --- | --- | --- | --- | --- |
```

### Todo 6.2 – Client tarafında admin bypass riski ara

Ara:

```powershell
git grep -n -I "admin_users"
git grep -n -I "is_admin"
git grep -n -I "role"
git grep -n -I "isAdmin"
git grep -n -I "localStorage"
git grep -n -I "sessionStorage"
```

Kontrol et:

- Admin yetkisi sadece frontend state ile veriliyor mu?
- LocalStorage ile admin bypass mümkün mü?
- Admin route sadece UI seviyesinde mi korunuyor, yoksa DB/RLS de koruyor mu?
- Admin data fetchlerinde RLS güveniliyor mu?

### Todo 6.3 – Public form abuse risklerini kontrol et

Kontrol alanları:

- Form rate-limit var mı?
- Edge Function rate-limit var mı?
- Body size limit var mı?
- Dosya upload limitleri var mı?
- Email format ve domain validation var mı?
- Duplicate submission kontrolü var mı?
- Bot/spam riskine karşı minimum önlem var mı?

Öneriler:

- Honeypot field
- IP/user-agent based rate limit
- Email normalization
- Upload MIME/type/size validation
- Server-side validation
- Suspicious submission log table

---

## 10. Faz 7 – Edge Function Güvenlik Kontrolü

Kontrol edilecek functionlar:

```text
supabase/functions/send-submission-email
supabase/functions/chat-register
supabase/functions/find-matches
supabase/functions/lansman-admin
```

### Todo 7.1 – JWT ve origin kontrolü

Kontrol et:

- `supabase/config.toml` içinde `verify_jwt = true` korunuyor mu?
- Public olması gereken function var mı?
- Origin allow-list doğru mu?
- CORS çok geniş mi?
- Preflight handling güvenli mi?

### Todo 7.2 – Request validation kontrolü

Kontrol et:

- Body parse güvenli mi?
- Zod veya benzeri validation var mı?
- Beklenmeyen alanlar ignore ediliyor mu?
- Max body size uygulanıyor mu?
- Error response secret sızdırıyor mu?

### Todo 7.3 – AI/Gemini güvenliği

Kontrol et:

- Kullanıcı PII verisi loglanıyor mu?
- Prompt injection riskine karşı sınırlama var mı?
- Function calling schema kontrollü mü?
- Gemini hataları kullanıcıya ham döndürülüyor mu?
- `GEMINI_API_KEY` sadece function secret olarak mı kalıyor?

---

## 11. Faz 8 – Frontend Security Kontrolü

### Todo 8.1 – XSS riskleri

Ara:

```powershell
git grep -n -I "dangerouslySetInnerHTML"
git grep -n -I "innerHTML"
git grep -n -I "document.write"
git grep -n -I "eval("
git grep -n -I "new Function"
```

Kontrol et:

- Kullanıcıdan gelen içerik HTML olarak basılıyor mu?
- Admin notları veya campaign submissions sanitize edilmeden render ediliyor mu?
- Markdown/HTML render varsa sanitize ediliyor mu?

### Todo 8.2 – Runtime config güvenliği

Kontrol et:

- `window.__APP_CONFIG__` içine server-only secret yazılmıyor mu?
- `env-config.js` cache policy `no-store` kalıyor mu?
- `RAG_API_SECRET` frontend üzerinden erişilebilir değil mi?
- Nginx placeholder replacement yanlışlıkla public JS içine yazmıyor mu?

### Todo 8.3 – Admin route güvenliği

Kontrol et:

- `/admin` route sadece UI-level guard ile korunuyorsa bunu raporla.
- Data erişimi RLS ile korunuyor mu?
- Admin layout unauthorized state doğru gösteriyor mu?
- Unauthorized kullanıcı admin data response alamıyor mu?

---

## 12. Faz 9 – Dependency ve Supply Chain Kontrolü

### Todo 9.1 – Dependency audit

PowerShell:

```powershell
npm audit
npm outdated
npx --yes depcheck
```

Yapılacaklar:

- Kritik ve high vulnerability varsa raporla.
- Otomatik major upgrade yapma.
- Patch/minor güvenli güncelleme mümkünse öner.
- Breaking change riski olan paketleri sadece rapora yaz.

### Todo 9.2 – Gereksiz dependency temizliği

Kurallar:

- `depcheck` çıktısını manuel doğrula.
- shadcn/Radix/Tailwind ecosysteminde false positive olabilir.
- Kullanılmayan paket gerçekten kullanılmıyorsa `package.json` ve lock file üzerinden kaldır.
- Kaldırma sonrası test/build çalıştır.

PowerShell:

```powershell
npm uninstall package-name
npm run lint
npm test
npm run build
```

---

## 13. Faz 10 – Test ve Release Kontrolü

Her önemli değişiklikten sonra:

```powershell
npm run lint
npm test
npm run build
```

Varsa:

```powershell
npm run verify:release
npx playwright test
```

Manuel smoke test listesi:

- `/` açılıyor mu?
- `/form` açılıyor mu?
- `/aiform` açılıyor mu?
- `/addwa` açılıyor mu?
- `/lansman` açılıyor mu?
- `/19051919` açılıyor mu?
- `/admin` unauthorized kullanıcıyı engelliyor mu?
- Admin login sonrası temel dashboard açılıyor mu?
- Public form submission frontend validation çalışıyor mu?
- AI form Edge Function çağrısı bozulmamış mı?
- Build sonrası `dist` içinde server secret yok mu?

---

## 14. Faz 11 – Nihai Rapor Formatı

`/docs/cleanup/CLEAN_CODE_SECURITY_REPORT.md` şu formatta olmalı:

```markdown
# Clean Code & Security Report

## 1. Summary
- Date:
- Branch:
- Agent:
- Scope:
- Overall risk before cleanup:
- Overall risk after cleanup:

## 2. Commands Run
| Command | Result | Notes |
| --- | --- | --- |

## 3. Clean Code Changes
| Area | File(s) | Change | Risk | Result |
| --- | --- | --- | --- | --- |

## 4. Archived Files
See `ARCHIVED_FILES.md`.

## 5. Secret Scan
See `SECRET_SCAN_REPORT.md`.

## 6. Gitignore Review
See `GITIGNORE_REVIEW.md`.

## 7. Security Findings
| Severity | Area | Finding | Recommendation | Status |
| --- | --- | --- | --- | --- |

## 8. Dependency Findings
| Package | Current | Issue | Recommendation |
| --- | --- | --- | --- |

## 9. Remaining Risks
- [ ] Risk 1
- [ ] Risk 2

## 10. Final Verification
- [ ] npm run lint passed
- [ ] npm test passed
- [ ] npm run build passed
- [ ] npm run verify:release passed if available
- [ ] No server-only secret found in `dist`
- [ ] Public routes smoke-tested
- [ ] Admin access smoke-tested
```

---

## 15. Final Acceptance Criteria

Bu çalışma ancak aşağıdaki koşullar sağlanırsa tamamlanmış kabul edilir:

- [ ] Uygulama build alıyor.
- [ ] Lint temiz veya mevcut bilinen uyarılar raporlanmış.
- [ ] Testler geçiyor veya mevcut kırık testler net şekilde raporlanmış.
- [ ] Gereksiz dosyalar doğrudan silinmedi, önce arşiv klasörüne taşındı.
- [ ] Arşivlenen her dosya için sebep yazıldı.
- [ ] `.gitignore` gerçek `.env` dosyalarını dışlıyor.
- [ ] `.env.example` gerçek secret içermiyor.
- [ ] Server-only secretlar frontend bundle içinde görünmüyor.
- [ ] `dist` içinde `SUPABASE_SERVICE_ROLE_KEY`, `RAG_API_SECRET`, `RESEND_API_KEY`, `GEMINI_API_KEY` bulunmuyor.
- [ ] Admin yetki modeli zayıflatılmadı.
- [ ] RLS policyleri gevşetilmedi.
- [ ] Edge Function JWT/origin/rate-limit davranışı korunuyor.
- [ ] Son raporlar `/docs/cleanup/` altında hazır.

---

## 16. GLM-5 İçin Direkt Kullanılacak Komut

Aşağıdaki talimatı kod ajanına doğrudan ver:

```text
Bu repository için clean code, security check, secret scan, .gitignore review ve gereksiz dosya arşivleme çalışması yap.

Büyük refactor yapma. Davranış değiştirme. Public form, admin panel, Supabase RLS, Edge Functions ve deployment akışlarını bozma.

Önce repo durumunu analiz et. Sonra küçük adımlarla ilerle. Gereksiz gördüğün dosyaları silme; önce _archive/cleanup-YYYY-MM-DD/ klasörüne taşı ve /docs/cleanup/ARCHIVED_FILES.md içine nedenini yaz.

Secret kontrolü yap ama gerçek secret değerlerini rapora yazma. SUPABASE_SERVICE_ROLE_KEY, RAG_API_SECRET, RESEND_API_KEY, GEMINI_API_KEY ve benzeri değerlerin frontend bundle veya dist içine sızmadığını doğrula.

.gitignore dosyasını Node/Vite/React/Supabase/Playwright projesine uygun hale getir. .env dosyaları ignore edilmeli, .env.example korunmalı.

Kullanılmayan import, dead code, duplicate component/helper, gereksiz dependency ve console logları tespit et. Sadece güvenli ve küçük değişiklikleri uygula. Şüpheli olanları rapora yaz, değiştirme.

Her önemli değişiklikten sonra npm run lint, npm test ve npm run build çalıştır. Varsa npm run verify:release çalıştır.

Çalışma sonunda şu raporları oluştur:
- /docs/cleanup/CLEAN_CODE_SECURITY_REPORT.md
- /docs/cleanup/ARCHIVED_FILES.md
- /docs/cleanup/SECRET_SCAN_REPORT.md
- /docs/cleanup/GITIGNORE_REVIEW.md

Finalde hangi dosyaların değiştiğini, hangi dosyaların arşivlendiğini, hangi güvenlik risklerinin bulunduğunu ve hangi komutların geçtiğini net şekilde özetle.
```

---

## 17. Ek Notlar

- Bu görev kalite ve güvenlik odaklıdır; yeni özellik ekleme görevi değildir.
- Amaç kodu profesyonel hale getirmek, riskleri azaltmak ve deploy güvenini artırmaktır.
- En güvenli yaklaşım: önce raporla, sonra küçük değişiklik yap, sonra doğrula.
