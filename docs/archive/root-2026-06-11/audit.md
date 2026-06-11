# CorteQS — Comprehensive Repository Audit Master Prompt

CorteQS projesinin kök dizinindesin. Bu görevde kıdemli bir Software Architect, Application Security Engineer ve Code Quality Auditor gibi davran.

Amacın uygulamada değişiklik yapmak değil; mevcut sistemi ayrıntılı biçimde incelemek, kanıta dayalı bulgular üretmek ve sonuçları tek bir bağımsız HTML raporuna yazmaktır.

## 0. Temel Çalışma Kuralı

Bu görev bir **READ-ONLY AUDIT** görevidir.

Uygulama kodunu değiştirme.
Migration dosyalarını değiştirme, silme veya yeniden sıralama.
Refactor yapma.
Dependency güncelleme.
`npm audit fix`, otomatik formatlama veya otomatik düzeltme çalıştırma.
Yeni package yükleme.
Supabase üzerinde veri değiştiren komut çalıştırma.
Canlı ortama deploy yapma.
Veritabanına write işlemi gönderme.
Dosyaları silme veya taşımaya çalışma.

Yalnızca aşağıdaki yeni dosyayı oluşturabilirsin:

```text
docs/audits/YYYY-MM-DD-corteqs-comprehensive-audit.html
```

Buradaki tarihi çalışma gününün tarihiyle değiştir.

Geçici analiz dosyaları oluşturman gerekirse yalnızca `/tmp` altında oluştur ve görev sonunda temizle.

Her bulgu için mümkün olduğunca dosya yolu, satır aralığı, ilgili sembol, route, tablo, RPC veya migration adını belirt. Kanıt bulunmayan hiçbir şeyi kesin gerçek gibi yazma. Emin olmadığın durumları `İncelenmeli` veya `Doğrulama Gerekli` olarak işaretle.

---

# 1. Önce Projeyi Anla

İlk olarak aşağıdaki dosyayı eksiksiz oku:

```text
AGENT_CONTEXT.md
```

Ardından en azından aşağıdaki alanları incele:

```text
package.json
src/
supabase/
docs/
server.mjs
vite.config.ts
tsconfig*.json
eslint*
.env.example
README*
Dockerfile*
docker-compose*
.github/
public/
scripts/
```

Mevcutsa aşağıdaki belgeleri özellikle oku:

```text
docs/architecture/PROJECT_TECHNICAL_OVERVIEW.md
docs/architecture/SISTEM_MIMARI.md
docs/plans/
docs/modules/
docs/history/
docs/cleanup/2026-05-30/
```

`AGENT_CONTEXT.md` içindeki bilgileri doğru kabul etmek yerine repo içindeki gerçek durumla çapraz doğrula. Uyuşmazlıkları ayrıca raporla.

---

# 2. Projenin Kritik Bağlamını Koru

Audit sırasında aşağıdaki kritik kuralları göz önünde bulundur:

## 2.1 Dokunulmaması Gereken Alanlar

Aşağıdaki alanlar potansiyel iyileştirme konusu olsa bile otomatik silme veya değiştirme önerisi verme. Yalnızca dikkatli analiz et:

```text
server.mjs
vite.config.ts
src/components/ui/*
src/integrations/supabase/client.ts
info-*.html
supabase/migrations/*
```

## 2.2 Kilitli URL Yapısı

Aşağıdaki URL path değerleri SEO veya mevcut kullanım nedeniyle korunmalıdır:

```text
/lansman
/cadde
/19051919
/anket
/commercial/<slug>
/founders
```

Bu path değerlerini kaldırma veya yeniden adlandırma önerisi verme. Sorun varsa geriye uyumluluk sağlayacak çözüm öner.

## 2.3 Migration Kuralı

Migration dosyaları geçmiş kayıt niteliğindedir:

```text
supabase/migrations/*
```

Eski migration dosyalarının halen runtime tarafından doğrudan kullanılmaması normal olabilir. Bunları yalnızca kullanılmıyor diye silinebilir dosya olarak sınıflandırma.

Gelecekte yapılabilecek SQL değişiklikleri için yalnızca yeni migration eklenmesini öner.

## 2.4 Korunacak Türkçe Domain Terimleri

Aşağıdaki domain terimlerini rename edilmesi gereken clean-code sorunu olarak işaretleme:

```text
muhasebe
gelirler
giderler
nakit akışı
lansman
cadde
kaynak
kişi
oda
referans
ambasador
yönetici
anket
üye
danışman
```

## 2.5 Bilinen Hassas Noktalar

Özellikle doğrulanması gereken alanlar:

```text
src/App.tsx
src/main.tsx
src/components/auth/AuthProvider.tsx
src/components/auth/useAuth.ts
src/components/auth/RequireAuth*
src/components/auth/RequireFeature*
src/contexts/AuthContext.tsx
src/integrations/supabase/client.ts
src/lib/supabase.ts
src/lib/admin.ts
src/lib/features.ts
src/lib/muhasebe-*.ts
server.mjs
vite.config.ts
supabase/migrations/20260512103000_security_hardening_phase1.sql
supabase/migrations/20260525000000_rolesgo_role_attribute_approval_mvp.sql
supabase/migrations/20260607010000_afs_phase0_foundation_tables.sql
supabase/migrations/20260607020000_afs_phase1_member_type_and_trigger.sql
supabase/migrations/20260607030000_afs_phase2_catalog_rpcs.sql
supabase/migrations/20260607040000_afs_phase4_directory_sync.sql
supabase/migrations/20260607050000_unify_member_profiles_on_catalog.sql
supabase/migrations/20260607060000_retire_taxonomy_runtime_and_item_overrides.sql
supabase/migrations/20260607120000_mass_profile_visibility_and_search.sql
```

---

# 3. Çalıştırılabilecek Read-Only Kontroller

Önce repo durumunu kaydet:

```bash
git status --short
git branch --show-current
git rev-parse --short HEAD
```

Projenin gerçek komutlarını `package.json` üzerinden kontrol ettikten sonra uygun olanları çalıştır:

```bash
npm run lint
npm run test
npm run build
npm audit --json
```

Repo içinde mevcutsa ayrıca uygun verify veya release scriptlerini incele. Canlı sisteme write işlemi göndermeyen kontrolleri çalıştırabilirsin.

Önemli:

* Her komutun başarı veya hata sonucunu rapora ekle.
* Komut başarısız olursa hatayı saklama.
* `npm audit fix` çalıştırma.
* Eksik script varsa yalnızca `Mevcut değil` olarak raporla.
* Ağ erişimi gerektiren kontrol çalışmazsa bunu raporda açıkça belirt.
* Yeni analiz aracı kurma.
* Mevcut araçlarla analiz yap.
* Gerekirse yalnızca read-only amaçlı `grep`, `rg`, `find`, `git grep`, `node`, `python`, `npm ls` veya mevcut scriptleri kullan.

---

# 4. Audit Kapsamı

Audit dört ana başlıkta yapılacak:

1. Güvenlik
2. Clean Code ve Mimari Kalite
3. Kullanılmayan Bağlantılar, Route Değerleri ve Doküman Referansları
4. Sistemin Aktif Parçası Olmayan Dokümanlar ve Dosyalar

Bunlara ek olarak raporda önceliklendirilmiş aksiyon planı oluştur.

---

# 5. Audit Bölümü A — Güvenlik

Kapsamlı bir application security audit yap.

Her bulgu için aşağıdaki alanları ver:

```text
ID
Başlık
Kategori
Severity: Critical / High / Medium / Low / Info
Confidence: High / Medium / Low
Etkilenen Alan
Kanıt
Risk Senaryosu
Önerilen Çözüm
Önerilen Öncelik
```

## 5.1 Secret ve Environment Güvenliği

Şunları kontrol et:

* Repo içinde yanlışlıkla commit edilmiş secret, token veya private key var mı?
* `.env`, `.env.*`, config, JSON, YAML, SQL, shell script veya kaynak kod içinde hassas değer var mı?
* `SUPABASE_SERVICE_ROLE_KEY` frontend bundle içine sızabilir mi?
* `RAG_API_SECRET` frontend tarafına gönderilebilir mi?
* `VITE_*` değişkenlerinin istemciye açık olduğu doğru anlaşılmış mı?
* `/env-config.js` endpoint’i yalnızca public değerleri mi yayımlıyor?
* `server.mjs` runtime env injection sırasında private değerleri istemciye taşıyor mu?
* Loglarda hassas veri sızıntısı olabilir mi?
* Hata mesajlarında secret, query veya kullanıcı verisi ifşa edilebilir mi?
* `.gitignore` yeterli mi?

Potansiyel secret bulursan rapora secret değerini tam olarak yazma. Maskeli göster:

```text
abcd...wxyz
```

## 5.2 Auth ve Authorization

Şunları incele:

* Canonical auth provider gerçekten `src/components/auth/` altındaki sistem mi?
* `src/contexts/AuthContext.tsx` gerçekten orphaned mı?
* Orphaned auth context herhangi bir yerde yanlışlıkla import ediliyor mu?
* Admin route’ları gerçekten `RequireAuth`, feature gate veya başka bir kontrolle korunuyor mu?
* Yalnızca frontend route guard ile korunmuş fakat backend/RLS tarafından korunmayan işlemler var mı?
* Eski `public.admin_users` sistemi ile yeni `user_profiles_v2` / RolesGo sistemi arasında güvenlik boşluğu doğabilir mi?
* `userIsAdmin()` çağrıları doğru mu?
* Feature flag sistemi kritik işlemler için yalnızca UI gizleme amacıyla mı kullanılıyor, yoksa backend koruması da var mı?
* Role veya feature override işlemlerinde privilege escalation riski var mı?
* Admin panelde IDOR riski oluşturabilecek doğrudan ID bazlı işlemler var mı?
* Kullanıcı kendi rolünü, üyeliğini, attribute değerini veya feature override değerini yetkisiz güncelleyebilir mi?
* Catalog claim akışında yetkisiz sahiplenme riski var mı?
* `catalog_item_memberships` owner/editor/viewer mantığı RLS ve RPC seviyesinde uygulanıyor mu?

## 5.3 Supabase RLS ve Database Security

Migration dosyalarını kronolojik olarak incele. Aktif veri modelini son migration durumuna göre değerlendir.

Özellikle aşağıdaki tabloları kontrol et:

```text
profiles
user_profiles_v2
user_role_assignments
user_profile_attributes
user_feature_overrides
user_taxonomy_selections
catalog_items
advisor_details
business_details
event_details
person_profile_details
catalog_item_attribute_overrides
catalog_item_feature_overrides
catalog_item_section_overrides
catalog_item_memberships
catalog_claim_requests
catalog_audit_logs
public.admin_users
submissions
surveys
survey_questions
survey_responses
muhasebe_gelirler
muhasebe_giderler
lansman_basvurular
referral_codes
referral_uses
workspace_resources
workspace_todos
workspace_meetings
geo_countries
geo_cities
```

Her kritik tablo için şu sorulara cevap ara:

* RLS etkin mi?
* Public read gerçekten gerekli mi?
* Authenticated kullanıcılar gereğinden geniş erişime sahip mi?
* Insert, update ve delete policy koşulları doğru mu?
* `USING` ve `WITH CHECK` doğru uygulanmış mı?
* Admin kontrolü güvenilir mi?
* Ownership doğrulaması var mı?
* Kişisel veri içeren kolonlar istemeden açık mı?
* Yeni AFS migration’ları eski policy’leri geçersiz veya yetersiz hale getirmiş olabilir mi?
* Retire edilen taxonomy runtime veya item override parçaları halen yanlışlıkla güvenlik kararlarında kullanılıyor mu?

## 5.4 RPC, Function ve SQL Güvenliği

Tüm SQL function ve RPC tanımlarını tarayarak şunları kontrol et:

* `SECURITY DEFINER` kullanımları
* Güvenli `search_path` tanımı
* Yetki kontrolü yapılmadan çalışan admin RPC değerleri
* SQL injection riski
* Dynamic SQL kullanımı
* Kullanıcı kontrollü parametrelerin filtrelenmesi
* RPC üzerinden privilege escalation
* Kullanıcının başka kullanıcıya ait profil, claim, feature veya catalog kaydını değiştirebilmesi
* Audit log eksiklikleri
* Yetkili işlemlerde actor bilgisinin doğru tutulması

Özellikle şu akışları doğrula:

```text
submit_catalog_claim_request
admin_approve_catalog_claim
admin_reject_catalog_claim
get_current_user_features
```

## 5.5 `server.mjs` Güvenliği

Şunları kontrol et:

* `/env-config.js`
* `/api/chat`
* RAG proxy
* `RAG_API_SECRET`
* Input validation
* Request body size limit
* Timeout
* Error handling
* Rate limiting
* CORS
* Header forwarding
* Open proxy riski
* SSRF riski
* Method kontrolü
* JSON parse hataları
* Production log güvenliği
* SPA fallback davranışı
* Path traversal riski
* Static file serving güvenliği
* Cache header değerleri

Rate limiting veya CSP gibi production katmanında Coolify, reverse proxy veya başka bir katmanda ele alınabilecek konularda kesin hüküm verme. Repo içinde görünmüyorsa `Repo içinde doğrulanamadı` yaz.

## 5.6 Frontend Güvenliği

Şunları tara:

* `dangerouslySetInnerHTML`
* HTML injection
* XSS
* Kullanıcı kaynaklı URL değerleri
* `target="_blank"` ile `rel="noopener noreferrer"` eksikliği
* Open redirect
* Unvalidated URL
* Local storage içinde hassas veri
* Session handling
* Form validation eksikliği
* Zod kullanılmadan gönderilen kritik formlar
* Dosya upload varsa MIME, size ve erişim kontrolü
* Public storage bucket riski
* Kişisel veri ifşası
* Kullanıcı e-posta, telefon veya profil bilgisinin istemeden public görünmesi
* Directory search sonuçlarında gereğinden fazla kişisel veri
* Chat input sanitization ve abuse riski

## 5.7 Dependency ve Supply Chain

Şunları kontrol et:

* `npm audit --json`
* Kritik veya yüksek seviyeli dependency zafiyetleri
* Kullanılmayan dependencies
* Geliştirme dependency değerlerinin production bundle’a gereksiz eklenmesi
* Lock file varlığı
* Sabitlenmemiş sürümler
* Şüpheli scriptler
* Docker image güvenliği
* GitHub Actions içinde secret kullanımı
* Dependency kaynaklı riskler

Dependency riskini değerlendirirken yalnızca mevcut çıktı üzerinden konuş. İnternet erişimi nedeniyle doğrulanamayan noktaları ayrıca belirt.

---

# 6. Audit Bölümü B — Clean Code ve Mimari Kalite

Bu bölümde kod kalitesi, sürdürülebilirlik, test edilebilirlik ve mimari tutarlılığı değerlendir.

Her bulgu için aşağıdaki alanları kullan:

```text
ID
Başlık
Kategori
Severity: High / Medium / Low / Info
Confidence
Etkilenen Dosyalar
Kanıt
Neden Sorun
Önerilen Refactor Yaklaşımı
Tahmini Efor: XS / S / M / L / XL
Bağımlılıklar ve Riskler
```

## 6.1 Monolitik Alanlar

Özellikle incele:

```text
src/App.tsx
```

Şunları raporla:

* Dosyanın satır sayısı
* Route sayısı
* Doğrudan import sayısı
* Lazy load eksikliği
* Feature bazlı route modüllerine ayrılabilecek bölümler
* Muhasebe `routes.tsx` yaklaşımının başka modüllere uygulanabilirliği
* Bundle veya maintainability etkisi
* SEO kilitli URL değerlerinin korunması şartıyla önerilen refactor sırası

## 6.2 Çift veya Tutarsız Sistemler

Aşağıdaki paralel yapıları ayrıntılı incele:

```text
src/integrations/supabase/client.ts
src/lib/supabase.ts

src/components/auth/*
src/contexts/AuthContext.tsx

public.admin_users
user_profiles_v2
rolesgo_*
```

Şunları raporla:

* Gerçek kullanım noktaları
* Import edilen dosyalar
* Orphaned parçalar
* Eski sistem bağımlılıkları
* Yeni sistem bağımlılıkları
* Birleştirme veya emekliye ayırma için güvenli sıralama
* Doğrudan silinmemesi gereken alanlar
* Migration gerektiren noktalar

## 6.3 Veri Katmanı Tutarlılığı

Kod tabanındaki Supabase erişimlerini tara:

* Component içinde doğrudan `supabase.from()`
* `src/lib/*-api.ts`
* React Query kullanımı
* Mutation yaklaşımı
* Error handling
* Loading state yönetimi
* Tekrarlayan query yapıları
* Zod validation kullanımı
* Type safety
* Cache invalidation
* Business logic’in UI içine karışması

`src/lib/muhasebe-*.ts` yapısını referans pattern olarak değerlendir. Diğer modüller için uygulanabilir refactor adaylarını sırala.

## 6.4 TypeScript Kalitesi

Şunları ölç:

* `strictNullChecks`
* `noImplicitAny`
* `any`
* `as any`
* `@ts-ignore`
* `@ts-expect-error`
* Gereksiz type assertion
* Eksik return type
* Zayıf null handling
* Kullanılmayan type değerleri
* Duplicate interface veya type tanımları

TypeScript strict modunun tek seferde açılmasını önermek yerine kademeli geçiş öner.

## 6.5 Ölü Kod ve Kullanılmayan Dosyalar

Şunları tara:

* Kullanılmayan import
* Kullanılmayan değişken
* Kullanılmayan component
* Import edilmeyen TS/TSX dosyaları
* Orphan hook
* Orphan context
* Orphan utility
* Orphan CSS
* Duplicate helper
* Yorum satırına alınmış eski kod
* Süresi geçmiş feature flag
* TODO, FIXME, HACK ve geçici workaround
* Kullanılmayan assets
* Kullanılmayan dependencies

Önemli istisnalar:

* Route tabanlı dosyalar doğrudan import edilmediği halde aktif olabilir.
* `info-*.html` dosyaları Vite plugin input olabilir.
* Migration dosyaları tarihsel kayıt olduğu için kullanılmıyor olarak sınıflandırılmamalı.
* `docs/history/` altındaki belgeler bilinçli arşiv olabilir.
* Generated shadcn bileşenleri kullanılmasa bile ayrı bir kategoride raporlanmalı; otomatik silme önerisi verilmemeli.

Her aday dosyayı aşağıdaki sınıflardan biriyle işaretle:

```text
Kesin orphan
Yüksek olasılıkla orphan
Muhtemelen aktif
Generated veya korunan
Tarihsel kayıt
Manuel doğrulama gerekli
```

## 6.6 Test Kalitesi

Şunları analiz et:

* Test dosyası sayısı
* Unit test dağılımı
* Integration test
* E2E test
* Playwright konfigürasyonu
* Kritik flow coverage
* RolesGo coverage
* Profile v2 coverage
* AFS unified model coverage
* Auth coverage
* RLS coverage
* Claim flow coverage
* Admin muhasebe coverage
* Lansman formu coverage
* Survey coverage
* Chat proxy coverage
* Build, lint ve test sonucu

Eksik kritik testleri öncelik sırasıyla öner.

---

# 7. Audit Bölümü C — Kullanılmayan Bağlantılar, Route Değerleri ve Referanslar

Bu bölümde bağlantıları yalnızca grep ile bulmakla kalma; gerçek kullanım ilişkilerini çıkar.

## 7.1 Route Inventory Oluştur

Aşağıdaki kaynakları inceleyerek tüm route değerlerini çıkar:

```text
src/App.tsx
feature routes.tsx dosyaları
React Router tanımları
navigate(...)
<Link ...>
<a href=...>
window.location
redirect
menu config
navigation config
footer
header
sidebar
admin menu
commercial sayfalar
info-*.html
public/
server.mjs SPA fallback
```

Her route için aşağıdaki bilgileri raporla:

```text
Route
Tanımlandığı Dosya
Kullanıldığı veya Link Verildiği Yerler
Public / Admin / Internal / Standalone
Auth Gate
Feature Gate
SEO Kilitli mi?
Durum
Öneri
```

Durum alanı aşağıdakilerden biri olmalı:

```text
Aktif ve erişilebilir
Tanımlı fakat görünür bağlantısı bulunamadı
Bağlantı var fakat route tanımı bulunamadı
Muhtemel legacy route
Redirect gerekli olabilir
Standalone ticari sayfa
Manuel doğrulama gerekli
```

## 7.2 Broken Internal Link Kontrolü

Şunları bul:

* Route tanımı olmayan internal link
* Yanlış path
* Typo
* Büyük-küçük harf uyumsuzluğu
* Slash uyumsuzluğu
* Query parametre uyumsuzluğu
* Anchor hedefi olmayan hash link
* Eksik asset link
* Eksik görsel
* Eksik favicon veya manifest referansı
* Eksik doküman linki
* Admin menüde ölü link
* Public navigasyonda erişilemeyen sayfa
* Sitemap veya robots referans uyuşmazlığı varsa bunlar

## 7.3 External Link Kontrolü

Repo içindeki dış URL değerlerini listele:

* URL
* Kaynak dosya
* Kullanım amacı
* HTTP veya HTTPS
* Potansiyel risk
* Manuel doğrulama ihtiyacı

Ağ erişimin varsa dış URL değerlerine read-only HEAD veya güvenli GET kontrolü uygulayabilirsin. Ağ erişimi yoksa bunu açıkça belirt.

Özellikle şunları kontrol et:

* Sosyal medya linkleri
* WhatsApp linkleri
* Telegram linkleri
* Supabase URL
* RAG endpoint
* Partner sayfaları
* External form linkleri
* Mailto ve telefon linkleri
* Placeholder URL
* `localhost`
* Preview veya staging URL
* Eski domain
* Hardcoded test URL

## 7.4 Doküman Referansları

Tüm markdown ve doküman dosyalarında geçen internal file referanslarını kontrol et:

* Referans verilen dosya gerçekten var mı?
* Rename edilmiş dosyaya eski link var mı?
* Geçmiş plana işaret eden aktif doküman var mı?
* Artık bulunmayan modül veya tablo adı kullanılıyor mu?
* Doküman ile gerçek kod arasında uyuşmazlık var mı?

---

# 8. Audit Bölümü D — Sistemin Aktif Parçası Olmayan Dokümanlar ve Dosyalar

Bu bölüm özellikle önemlidir. Dokümanları yalnızca kullanılmıyor olarak etiketleme. Amacını ve yaşam döngüsünü değerlendir.

## 8.1 Doküman Envanteri

Aşağıdaki uzantıları tara:

```text
.md
.txt
.html
.pdf
.docx
.json
.yaml
.yml
.sql
.csv
```

Özellikle aşağıdaki klasörleri değerlendir:

```text
docs/
docs/architecture/
docs/plans/
docs/modules/
docs/history/
docs/cleanup/
root directory
public/
```

Her doküman için mümkün olduğunca şu bilgileri üret:

```text
Dosya
Tür
Boyut
Son Git Değişiklik Tarihi
Başlık veya Amaç
Başka Dosyalardan Referans Sayısı
Kodla İlişkisi
Tahmini Durum
Öneri
```

## 8.2 Doküman Sınıflandırması

Her dokümanı aşağıdaki sınıflardan yalnızca biriyle etiketle:

```text
ACTIVE_CORE
Aktif sistem için temel doküman

ACTIVE_MODULE
Aktif bir modülün dokümanı

ACTIVE_PLAN
Henüz tamamlanmamış aktif plan

HISTORICAL_KEEP
Geçmiş karar, audit veya migration bağlamı için korunmalı

ARCHIVE_CANDIDATE
Aktif sistemden ayrılmış fakat arşivlenmesi uygun

DELETE_CANDIDATE
Açıkça geçici, duplicate veya artık anlamsız görünen dosya

STALE_REVIEW_REQUIRED
İçerik eski olabilir; insan incelemesi gerekli

GENERATED_KEEP
Build, Vite plugin veya tooling nedeniyle korunmalı

UNKNOWN_MANUAL_REVIEW
İlişkisi güvenilir biçimde belirlenemedi
```

## 8.3 Özellikle Ara

Aşağıdaki durumları bul:

* Aynı konuyu anlatan duplicate doküman
* Aynı dosyanın farklı tarihli kopyaları
* Eski plan ile yeni mimariyi karıştıran belgeler
* Tamamlanmış ama halen aktif plan klasöründe duran belge
* Kodda bulunmayan tablo, RPC veya route değerlerine referans veren belge
* Artık kaldırılmış taxonomy runtime sistemini aktif gibi anlatan belge
* Artık kaldırılmış item override yaklaşımını aktif gibi anlatan belge
* AFS unified model geçişiyle çelişen eski belge
* Root dizinde unutulmuş geçici not
* Prompt dosyaları
* Agent scratchpad
* Eski audit çıktıları
* Gereksiz export
* Kullanılmayan CSV veya JSON
* Test amacıyla bırakılmış örnek dosya
* Eski screenshot veya asset
* Build çıktısı yanlışlıkla commit edilmiş mi?
* Backup dosyası
* `.bak`, `.old`, `.copy`, `.tmp`, `.orig` gibi dosyalar

## 8.4 Silme Konusunda Güvenlik Kuralı

Hiçbir dosyayı silme.

`DELETE_CANDIDATE` olarak işaretlenen her dosya için şunları yaz:

```text
Neden aday?
Hangi kontroller yapıldı?
Yanlış pozitif riski var mı?
Silmeden önce insan tarafından ne doğrulanmalı?
```

---

# 9. AGENT_CONTEXT.md Doğruluk Kontrolü

`AGENT_CONTEXT.md` içeriğini repo gerçekliğiyle karşılaştır.

Aşağıdaki başlıklara göre uyuşmazlık tablosu oluştur:

```text
Context İddiası
Repo İçindeki Kanıt
Durum: Doğru / Kısmen Doğru / Güncel Değil / Doğrulanamadı
Önerilen Context Güncellemesi
```

Özellikle doğrula:

* Sayfa sayısı
* Admin sayfası sayısı
* Lib modülü sayısı
* Migration sayısı
* Test dosyası sayısı
* `App.tsx` route sayısı
* Orphaned auth provider
* İki Supabase client
* Eski ve yeni admin sistemi
* AFS tamamlandı ifadesi
* Taxonomy runtime kaldırıldı ifadesi
* Item override yaklaşımı kaldırıldı mı?
* Güncel tablolar
* Güncel RPC değerleri
* Aktif planlar
* Korunan URL değerleri
* Build ve deploy mantığı

---

# 10. Önceliklendirilmiş Aksiyon Planı

Audit sonunda uygulanabilir bir aksiyon planı üret.

Aksiyonları aşağıdaki zaman gruplarına ayır:

```text
P0 — Hemen: güvenlik açığı veya veri riski
P1 — İlk 7 gün
P2 — İlk 30 gün
P3 — Sonraki refactor dönemi
P4 — Manuel karar veya ürün kararı gerekli
```

Her aksiyon için şu alanları yaz:

```text
Aksiyon ID
Başlık
İlgili Bulgular
Neden Öncelikli?
Önerilen Çözüm
Tahmini Efor: XS / S / M / L / XL
Risk
Bağımlılıklar
Önerilen Sorumlu Rol
Doğrulama Kriteri
```

Aksiyonları olabildiğince küçük ve uygulanabilir parçalara böl. Büyük refactor önerilerini tek kart olarak bırakma.

Örnek:

```text
P1-03: src/contexts/AuthContext.tsx import kullanımını doğrula ve orphan ise kontrollü emeklilik planı hazırla.
```

---

# 11. HTML Rapor Formatı

Rapor tamamen bağımsız tek bir HTML dosyası olmalı:

```text
docs/audits/YYYY-MM-DD-corteqs-comprehensive-audit.html
```

Harici CDN, harici JavaScript veya harici CSS kullanma.

CSS ve gerekiyorsa minimal JavaScript dosyanın içine gömülü olsun.

Rapor Türkçe yazılsın. Teknik kavramları gerektiğinde İngilizce kullanabilirsin.

## 11.1 Görsel Yapı

HTML rapor profesyonel, okunabilir ve yönetici sunumuna uygun olsun.

Şunları içersin:

* Başlık alanı
* Audit tarihi
* Git branch
* Commit hash
* Repo durumu
* İncelenen dosya sayısı
* Çalıştırılan komutlar
* Komut sonuçları
* Genel skor kartları
* Severity özet grafiği veya görsel dağılım
* İçindekiler
* Filtrelenebilir bulgu tabloları
* Arama kutusu
* Severity filtresi
* Kategori filtresi
* Confidence filtresi
* Katlanabilir detay alanları
* Dosya yolu ve satır numarası gösterimi
* Print-friendly CSS
* Rapor sonunda metodoloji
* Sınırlamalar
* Manuel doğrulama gerektiren noktalar
* Kullanılan terimler sözlüğü

## 11.2 Ana Bölümler

Raporun sırası şu şekilde olsun:

```text
1. Yönetici Özeti
2. En Kritik 10 Bulgu
3. Audit Kapsamı ve Metodoloji
4. Güvenlik Audit Sonuçları
5. Clean Code ve Mimari Kalite
6. Kullanılmayan veya Hatalı Bağlantılar
7. Route Envanteri
8. Doküman ve Dosya Yaşam Döngüsü Analizi
9. Orphan veya Legacy Adayları
10. AGENT_CONTEXT.md Doğruluk Kontrolü
11. Test, Lint, Build ve Dependency Sonuçları
12. Önceliklendirilmiş Aksiyon Planı
13. Manuel Doğrulama Listesi
14. Ekler
```

## 11.3 Skor Kartları

Aşağıdaki alanlara 0–100 arasında temkinli bir skor ver:

```text
Security
Authorization & RLS
Clean Code
Architecture Consistency
Test Coverage Confidence
Documentation Health
Route & Link Health
Operational Readiness
```

Her skorun yanında kısa gerekçe yaz.

## 11.4 Bulgular İçin Kanıt Standardı

Her bulguda aşağıdakilerden en az biri olmalı:

```text
Dosya yolu
Satır numarası veya satır aralığı
İlgili kod sembolü
Route
Migration adı
Tablo adı
RPC adı
Komut sonucu
Referans veren dosyalar
Referans vermeyen dosyalar
```

Örnek kanıt gösterimi:

```text
src/contexts/AuthContext.tsx:1-120
src/App.tsx:45
supabase/migrations/20260607060000_retire_taxonomy_runtime_and_item_overrides.sql
RPC: admin_approve_catalog_claim
Table: catalog_item_memberships
```

Kanıt olmadan kesin hüküm verme.

---

# 12. Beklenen Analiz Derinliği

Yalnızca bilinen sorunları tekrar etme.

`AGENT_CONTEXT.md` içindeki teknik borçları başlangıç noktası kabul et; fakat repo içinde yeni sorunlar ara.

Özellikle şu ayrımı yap:

```text
Bilinen ve doğrulanan sorun
Bilinen fakat artık çözülmüş sorun
Context dosyasında yazmayan yeni sorun
Yanlış pozitif olabilecek aday
Manuel doğrulama gerektiren konu
```

Her bölümde:

* Kaç dosya tarandığını belirt.
* Kaç bulgu çıktığını belirt.
* Severity dağılımını ver.
* En önemli üç aksiyonu özetle.
* Kanıt eksikse açıkça söyle.

---

# 13. Son Kontrol

HTML raporunu oluşturmadan önce şu kontrolleri tamamla:

```text
[ ] Uygulama koduna dokunmadım.
[ ] Migration dosyalarını değiştirmedim.
[ ] Her kritik bulguda kanıt sundum.
[ ] Secret değerlerini maskeli gösterdim.
[ ] Korunan dosyaları yanlışlıkla delete adayı yapmadım.
[ ] info-*.html dosyalarını Vite plugin bağlamında değerlendirdim.
[ ] Migration dosyalarını orphan olarak sınıflandırmadım.
[ ] docs/history içeriğini bilinçli arşiv olasılığıyla değerlendirdim.
[ ] AFS sonrası aktif veri modelini son migration durumuna göre değerlendirdim.
[ ] AGENT_CONTEXT.md ile repo gerçekliği arasındaki farkları raporladım.
[ ] HTML tek dosyalı ve tarayıcıda bağımsız açılabilir.
[ ] Rapor içinde filtreleme ve arama çalışıyor.
[ ] HTML dosyasını doğru klasöre yazdım.
[ ] git diff --stat ile yalnızca audit HTML dosyasının eklendiğini doğruladım.
```

Son olarak çalıştır:

```bash
git status --short
git diff --stat
```

Uygulama kodunda görev öncesinden bulunmayan bir değişiklik oluştuysa geri al. Ancak görev başlamadan önce mevcut olan kullanıcı değişikliklerine dokunma.

---

# 14. Bana Vereceğin Son Yanıt

Analiz tamamlandığında yalnızca kısa bir teslim özeti yaz:

```text
Audit tamamlandı.

HTML raporu:
docs/audits/YYYY-MM-DD-corteqs-comprehensive-audit.html

Özet:
- Taranan dosya sayısı:
- Toplam bulgu:
- Critical:
- High:
- Medium:
- Low:
- Info:
- Manuel doğrulama gereken konu sayısı:
- Build sonucu:
- Test sonucu:
- Lint sonucu:
- Dependency audit sonucu:

Not:
Uygulama kodunda değişiklik yapılmadı. Yalnızca HTML audit raporu oluşturuldu.
```

HTML dosyasını oluştur ve kullanıcıya indirilebilir dosya olarak sunulabiliyorsa doğrudan sun. Sunulamıyorsa kesin dosya yolunu belirt.
