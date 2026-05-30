# CorteQS Landing — Güvenli Clean Code ve Dokümantasyon Düzenleme Görevi

## 1. Rolün

Sen deneyimli bir Senior Software Architect ve Clean Code Refactoring Engineer olarak çalışacaksın.

Bu görevde amacın mevcut uygulamayı yeniden yazmak değildir. Önce projeyi analiz edecek, ardından yalnızca düşük riskli ve doğrulanabilir temizlik işlemlerini uygulayacaksın.

Temel yaklaşım:

* Mevcut çalışan davranışları koru.
* Production ortamını etkileyebilecek riskli değişikliklerden kaçın.
* Belirsiz dosyaları silme.
* Kullanılmadığı kesin olarak doğrulanan dosyaları bile ilk aşamada tarihli arşiv klasörüne taşı.
* Her taşıma ve değişikliği raporla.
* Büyük refactor ihtiyaçlarını ayrı bir backlog dosyasına yaz.
* Küçük, denetlenebilir ve geri alınabilir değişiklikler yap.
* Bir dosyanın gereksiz olduğundan emin değilsen aktif dizinden kaldırma; `review-required` listesine ekle.

---

# 2. Proje Bağlamı

Proje adı: **CorteQS Landing**

Teknoloji yığını:

* React 18
* Vite 5
* TypeScript 5.8
* React Router 6
* Supabase
* TanStack React Query
* Tailwind CSS
* shadcn/ui
* Vitest
* Playwright
* Node.js tabanlı production server
* Coolify deployment
* Supabase Edge Functions
* RAG chat proxy entegrasyonu

Uygulama tek bir Vite projesi içinde çok sayıda modül içeriyor:

* Public landing sayfaları
* Kampanya sayfaları
* Form toplama sayfaları
* Surveys modülü
* Üye dizini ve profil sistemi
* RolesGo yetkilendirme altyapısı
* Admin paneli
* Workspace dashboard
* Muhasebe modülü
* Referral sistemi
* RAG chat proxy entegrasyonu
* Standalone commercial HTML sayfaları

Repo yaklaşık olarak şu büyüklüktedir:

* 90+ sayfa
* 100+ component
* 40+ lib modülü
* 60+ Supabase migration

---

# 3. Bu Görevin Ana Hedefi

Bu çalışma yalnızca **Phase 0: Safe Cleanup and Documentation Organization** kapsamındadır.

Aşağıdaki işleri tamamla:

1. Repo içinde dağınık durumda bulunan dokümantasyonu envanterle.
2. Dokümanları anlamlı klasörler altında topla.
3. Tarihsel, tamamlanmış veya artık aktif olmayan dokümanları ayrı klasörlere taşı.
4. Gereksiz olduğu düşünülen ancak silinmesi riskli dosyaları tarihli `_archive` klasörüne taşı.
5. Kullanılmayan import, debug log, geçici dosya, kopya dosya ve açıkça ölü kod adaylarını belirle.
6. Yalnızca güvenli olduğu doğrulanabilen küçük clean-code düzeltmelerini uygula.
7. Büyük mimari refactor ihtiyaçlarını kodu bozmadan raporla.
8. Temizlik öncesi ve sonrası build, lint ve test durumlarını karşılaştır.
9. Yapılan tüm işlemler için okunabilir manifest ve cleanup raporu üret.

Bu görev sırasında geniş kapsamlı bir yeniden yapılandırma yapma.

---

# 4. Kesinlikle Korunması Gereken Alanlar

Aşağıdaki dosya, klasör ve davranışları değiştirme. Bunları yalnızca inceleyebilir ve sorun görürsen backlog dosyasına yazabilirsin.

## 4.1 Public URL Yapısı

Aşağıdaki route örnekleri dahil olmak üzere mevcut public URL’leri değiştirme:

* `/lansman`
* `/commercial/<slug>`
* `/cadde`
* `/founders`
* `/aboutpage`
* Mevcut kampanya URL’leri
* SEO geçmişi bulunan diğer public route’lar

Route isimlerini değiştirme, kaldırma veya redirect ekleme.

## 4.2 Supabase Migration Geçmişi

`supabase/migrations/**` altındaki mevcut migration dosyaları için:

* Dosya silme.
* Dosya taşıma.
* Dosya yeniden adlandırma.
* Eski migration içeriklerini değiştirme.
* Migration squash yapma.
* RLS policy davranışlarını değiştirme.

Yalnızca inceleme yap. Tespit ettiğin migration kirliliğini backlog dosyasına yaz.

## 4.3 Kritik Runtime ve Build Dosyaları

Aşağıdaki dosyalarda bu görev kapsamında refactor yapma:

* `server.mjs`
* `vite.config.ts`
* `src/main.tsx`
* `src/components/auth/AuthProvider.tsx`
* `src/integrations/supabase/client.ts`
* `src/App.tsx`

Bu dosyalarda hata veya karmaşıklık tespit edersen raporla ancak davranış değişikliği yapma.

Özellikle aşağıdaki özellikleri koru:

* `/env-config.js` runtime env injection
* Coolify uyumluluğu
* `/api/chat` proxy
* `RAG_API_SECRET` değerinin yalnızca server tarafında kalması
* Standalone commercial HTML emit mantığı
* SPA fallback davranışı
* Hydrate / createRoot switch mantığı

## 4.4 Generated Kodlar

Aşağıdaki generated veya dış araçlara bağlı alanları manuel olarak düzenleme:

* `src/components/ui/**`
* `src/integrations/supabase/client.ts`
* `components.json`
* Lovable ile ilişkili generated yapılandırmalar

## 4.5 Domain Terminolojisi

Aşağıdaki Türkçe domain terimlerini İngilizceye çevirme veya yeniden adlandırma:

* `muhasebe`
* `gelirler`
* `giderler`
* `lansman`
* `cadde`
* `kaynak`
* `referans`
* `oda`
* `kişi`
* `üye`
* `ambasador`

Dosya ve değişken isimlerinde mevcut domain dilini koru.

## 4.6 Profil ve Yetkilendirme Sistemi

Eski ve yeni profil sistemleri birlikte çalışıyor olabilir:

* `admin_users`
* `user_profiles`
* `user_profiles_v2`
* `individual_profile_details`
* `rolesgo_*`
* `profile_type`
* Attribute, approval ve audit yapıları

Bu görevde:

* Tablo kaldırma.
* Profil sistemi birleştirme.
* Canonical sistem seçme.
* Eski sistemi deprecate etme.
* Yetkilendirme davranışı değiştirme.

Yalnızca analiz et ve backlog oluştur.

---

# 5. Dokümantasyon İçin Hedef Klasör Yapısı

Repo kökünde dağınık durumda bulunan Markdown, text ve açıklama dokümanlarını incele.

Gerekli olduğunda aşağıdaki klasör yapısını oluştur:

```text
docs/
├─ README.md
├─ architecture/
├─ modules/
├─ operations/
│  ├─ deployment/
│  ├─ database/
│  ├─ security/
│  └─ release/
├─ decisions/
├─ guides/
├─ cleanup/
│  └─ 2026-05-30/
├─ history/
│  ├─ deprecated/
│  ├─ cleanup-reports/
│  ├─ status-reports/
│  └─ completed-plans/
└─ inbox-review/
```

Dokümanları aşağıdaki kurallara göre sınıflandır.

## 5.1 `docs/architecture/`

Buraya güncel mimari dokümanları taşı:

* Proje teknik genel bakışı
* Sistem mimarisi
* Modüller arası ilişkiler
* Auth ve yetkilendirme mimarisi
* Veri akışı açıklamaları
* Route yapısı açıklamaları
* Supabase client kullanım stratejisi
* RAG entegrasyonu açıklamaları

Örnek:

```text
docs/architecture/PROJECT_TECHNICAL_OVERVIEW.md
```

## 5.2 `docs/modules/`

Buraya belirli bir ürün veya modül ile ilişkili güncel dokümanları taşı:

* Surveys
* Muhasebe
* Workspace
* RolesGo
* Referral
* Lansman
* May19
* WhatsApp landing
* Directory
* Profile
* Cadde
* Commercial pages

Gerekirse modül bazlı alt klasör oluştur:

```text
docs/modules/muhasebe/
docs/modules/rolesgo/
docs/modules/surveys/
docs/modules/workspace/
```

## 5.3 `docs/operations/`

Buraya operasyonel olarak halen geçerli dokümanları taşı:

* Deploy rehberleri
* Coolify notları
* Supabase rehberleri
* Release checklist
* Edge Function deploy adımları
* Security hardening rehberleri
* Ortam değişkenleri açıklamaları
* Production doğrulama adımları

## 5.4 `docs/decisions/`

Buraya güncel Architecture Decision Record benzeri karar dokümanlarını taşı:

* Neden belirli bir yapı seçildi?
* Hangi yaklaşım reddedildi?
* Hangi teknik karar halen geçerli?
* Hangi backward compatibility gereksinimi korunmalı?

Mevcut dokümanlarda karar niteliği taşıyan ancak dağınık halde bulunan notları tespit et.

## 5.5 `docs/guides/`

Buraya aktif kullanıcı veya geliştirici rehberlerini taşı:

* Local setup
* Development workflow
* Import rehberleri
* Veri yönetim rehberleri
* Admin kullanım notları
* Test rehberleri

## 5.6 `docs/history/`

Buraya artık aktif olmayan fakat tarihsel olarak değerli dokümanları taşı:

* Eski cleanup raporları
* Tamamlanmış planlar
* Geçmiş durum raporları
* Uygulanmış migration planları
* Eski teknik analizler
* Yerini daha güncel bir dokümana bırakmış dosyalar

Bu dosyaları silme.

## 5.7 `docs/inbox-review/`

Bir dokümanın güncel olup olmadığını doğrulayamıyorsan buraya taşıma kararı verme.

Bunun yerine:

* Dosyayı bulunduğu yerde bırak veya yalnızca açıkça güvenliyse `docs/inbox-review/` altına taşı.
* Raporda neden karar verilemediğini belirt.
* İlgili dosya için manuel kontrol ihtiyacını yaz.

---

# 6. Arşiv Klasörü Standardı

Aktif kaynak kod ağacında kalmaması gerektiği düşünülen ancak silinmesi riskli dosyalar için aşağıdaki yapıyı oluştur:

```text
_archive/
└─ cleanup-2026-05-30/
   ├─ README.md
   ├─ obsolete-code/
   ├─ obsolete-scripts/
   ├─ obsolete-assets/
   ├─ temporary-files/
   ├─ duplicate-files/
   ├─ old-tests/
   ├─ old-configs/
   └─ review-required/
```

Arşiv klasörü kullanım kuralları:

* İlk aşamada doğrudan silme yapma.
* Taşınan dosyanın eski ve yeni konumunu manifest dosyasına yaz.
* Dosyanın neden taşındığını açıkla.
* Dosyanın aktif kod tarafından referans edilmediğini nasıl kontrol ettiğini belirt.
* Emin olmadığın dosyaları `review-required/` altında tut.
* Arşiv klasörüne taşınan dosyaların import, link veya script referanslarını kontrol et.
* Build veya test kırılırsa taşıma işlemini geri al.
* Daha önce oluşturulmuş `_archive/` klasörlerini otomatik temizleme.
* Eski arşiv klasörlerini arşiv içinde yeniden düzenleme; yalnızca raporla.

Arşiv klasöründe oluşturulacak `README.md` dosyası en az şunları içersin:

* Temizlik tarihi
* Temizlik kapsamı
* Dosyaların neden doğrudan silinmediği
* Manifest dosyasının konumu
* Geri alma yöntemi
* Manuel kontrol gerektiren alanlar

---

# 7. İş Akışı

## Phase 0A — Başlangıç Durumunu Kaydet

Değişiklik yapmadan önce repo durumunu incele.

Aşağıdaki işlemleri gerçekleştir:

1. Git durumunu kontrol et.
2. Mevcut dosya ağacını analiz et.
3. Root seviyesindeki dokümanları listele.
4. `docs/`, `_archive/`, `public/`, `scripts/`, `src/`, `supabase/` klasörlerini incele.
5. `package.json` scriptlerini analiz et.
6. Kod, doküman, config ve script dosyaları arasındaki referansları ara.
7. Başlangıç lint, test ve build sonuçlarını kaydet.
8. Başlangıçta zaten mevcut olan hataları ayrı şekilde işaretle.

Kullanılabilecek PowerShell komutları:

```powershell
git status --short
git branch --show-current

Get-ChildItem -Force
Get-ChildItem -Recurse -File | Select-Object FullName

Get-ChildItem -Path . -File -Include *.md,*.txt,*.adoc,*.rst
Get-ChildItem -Path docs -Recurse -File -ErrorAction SilentlyContinue
Get-ChildItem -Path _archive -Recurse -File -ErrorAction SilentlyContinue

Get-Content package.json
npm run lint
npm run test
npm run build
npm run verify:release
```

Notlar:

* `npm run verify:release` local ortam koşulları nedeniyle çalışmazsa bunu hata gibi gizleme. Sebebini raporla.
* Başlangıçta mevcut olan hataları düzeltmiş gibi gösterme.
* Başlangıç sonuçlarını `BASELINE_RESULTS.md` dosyasına yaz.

Hedef dosya:

```text
docs/cleanup/2026-05-30/BASELINE_RESULTS.md
```

---

## Phase 0B — Doküman Envanteri Oluştur

Repo içindeki dokümanları tara.

En az aşağıdaki uzantıları kontrol et:

```text
*.md
*.txt
*.adoc
*.rst
*.doc
*.docx
*.pdf
```

Her doküman için şu bilgileri kaydet:

| Alan              | Açıklama                                                       |
| ----------------- | -------------------------------------------------------------- |
| Mevcut dosya yolu | Dosyanın şu anki konumu                                        |
| Önerilen kategori | Architecture, module, operations, guide, history, inbox-review |
| Güncellik durumu  | Active, historical, uncertain                                  |
| Referans sayısı   | Repo içinde başka dosyalar tarafından referans ediliyor mu?    |
| İşlem             | Keep, move, archive, manual-review                             |
| Gerekçe           | Neden bu işlem önerildi?                                       |
| Yeni konum        | Taşınacaksa hedef yol                                          |
| Risk              | Low, medium, high                                              |

Envanteri şu dosyaya yaz:

```text
docs/cleanup/2026-05-30/DOCUMENT_INVENTORY.md
```

Bir dokümanın güncel olduğuna yalnızca dosya adına bakarak karar verme.

İçeriğini incele ve şu sinyalleri değerlendir:

* Tamamlanmış plan ifadeleri
* Eski tarih bilgileri
* Deprecated ifadeleri
* Önceki cleanup çalışmalarına ait raporlar
* Yerine başka doküman yazılmış olması
* Kod içinde referans edilip edilmemesi
* README veya başka rehberlerden link alıp almaması
* Eski klasör isimlerine atıf yapması
* Artık mevcut olmayan script veya route isimlerini içermesi

---

## Phase 0C — Dokümanları Düzenle

Envanter tamamlandıktan sonra yalnızca düşük riskli doküman taşıma işlemlerini uygula.

Kurallar:

* Root klasöründe gereksiz doküman bırakma.
* Root seviyesinde yalnızca proje giriş noktası niteliğindeki dokümanları tut.
* Genel kural olarak root seviyesinde `README.md` kalabilir.
* `AGENTS.md`, `CODEX.md`, `CLAUDE.md`, `CONTRIBUTING.md`, `CHANGELOG.md`, `LICENSE` gibi dosyaları yalnızca gerçekten kullanılıyorsa root seviyesinde tut.
* Doküman linkleri bozulursa referansları güncelle.
* Taşınan dokümanlar için relative linkleri düzelt.
* Kod davranışını değiştirme.
* Doküman içeriğini gereksiz şekilde yeniden yazma.
* Türkçe içerikleri otomatik olarak İngilizceye çevirme.
* Mevcut tarihsel raporları silme.

Ana doküman indeksi oluştur:

```text
docs/README.md
```

Bu dosyada en az aşağıdakiler yer alsın:

* Dokümantasyon klasörlerinin açıklaması
* Aktif mimari dokümanlara linkler
* Modül rehberlerine linkler
* Operasyonel rehberlere linkler
* History klasörü açıklaması
* Inbox-review klasörü açıklaması
* Yeni doküman ekleme kuralları

---

## Phase 0D — Geçici ve Gereksiz Dosya Taraması

Aşağıdaki türlerdeki dosyaları tespit et:

* `*.bak`
* `*.tmp`
* `*.old`
* `*.orig`
* `*.copy`
* `*.disabled`
* `*.backup`
* `*backup*`
* `*old*`
* `*copy*`
* `*final-final*`
* `*test-copy*`
* `*unused*`
* `*deprecated*`
* Editor veya agent tarafından oluşturulmuş geçici çıktılar
* Çakışma çözümünden kalan dosyalar
* Kullanılmayan fixture dosyaları
* Kullanılmayan Playwright fixture adayları
* Artık referans edilmeyen scriptler
* Aynı içeriğe sahip duplicate dosyalar
* Root klasörüne yanlışlıkla bırakılmış rapor ve çıktı dosyaları

Aşağıdaki alanları özellikle tara:

```text
public/
scripts/
src/
docs/
_archive/
```

Ancak şu klasörlerde otomatik taşıma veya silme yapma:

```text
supabase/migrations/
supabase/functions/
src/components/ui/
src/integrations/supabase/
```

Tespitleri şu dosyaya yaz:

```text
docs/cleanup/2026-05-30/FILE_CANDIDATES.md
```

Dosya için aktif referans aramak amacıyla uygun araçları kullan.

Örnek PowerShell komutları:

```powershell
Get-ChildItem -Recurse -File |
  Where-Object {
    $_.Name -match 'backup|bak|tmp|old|copy|unused|deprecated|final-final|orig|disabled'
  } |
  Select-Object FullName

Get-ChildItem -Recurse -File |
  Group-Object Length |
  Where-Object { $_.Count -gt 1 } |
  ForEach-Object { $_.Group.FullName }
```

Duplicate dosya kararı verirken yalnızca dosya boyutuna güvenme. Hash karşılaştırması yap:

```powershell
Get-FileHash -Algorithm SHA256 .\path\to\file
```

---

## Phase 0E — Güvenli Kod Temizliği

Yalnızca düşük riskli clean-code değişikliklerini uygula.

Yapılabilecek işlemler:

* Kullanılmayan importları kaldır.
* Kullanılmayan local değişkenleri kaldır.
* Açıkça debug amaçlı bırakılmış `console.log` ifadelerini kaldır.
* Gereksiz ve kodu tekrar eden açıklama yorumlarını azalt.
* Aynı dosya içinde tekrar eden küçük sabitleri anlamlı constant haline getir.
* Dokunulan dosyalarda import stilini mümkün olduğunda `@/...` alias yaklaşımına yaklaştır.
* Type-only importları `import type` ile ayır.
* Aynı dosya içinde açıkça tekrar eden basit helper fonksiyonlarını birleştir.
* Kullanılmayan export adaylarını raporla.
* Kod içinde bulunan TODO, FIXME ve HACK notlarını envanterle.

Aşağıdaki işlemleri bu aşamada yapma:

* Klasör bazlı büyük feature migration
* Route mimarisi değişikliği
* `src/App.tsx` parçalama
* `React.lazy` uygulama
* Supabase client birleştirme
* Yeni global state çözümü
* React Query migration
* Admin CRUD abstraction oluşturma
* Form altyapısını yeniden yazma
* TypeScript strict mode açma
* Büyük dosya rename operasyonları
* Domain terminolojisini değiştirme
* RLS policy düzenleme
* Database migration ekleme
* Profil sistemlerini birleştirme
* Auth akışını değiştirme
* shadcn/ui refactor
* `server.mjs` veya `vite.config.ts` değişikliği

Önemli:

* Bir importun kullanılmadığını sadece görsel incelemeyle varsayma.
* Dinamik import, string tabanlı referans, Vite build hook, HTML inject veya script kullanım ihtimalini kontrol et.
* Temizlik sonrası lint, test veya build kırılırsa değişikliği geri al.
* Kod kalitesini artırmak adına yeni abstraction eklemekte acele etme.
* Bu aşamanın hedefi yeniden tasarım değil, görünür kirliliği azaltmaktır.

---

## Phase 0F — Asset Taraması

`public/` ve `src/assets/` altındaki dosyaları incele.

Aşağıdaki kontrolleri yap:

* Kod içinde import ediliyor mu?
* CSS içinde URL olarak kullanılıyor mu?
* HTML içinde referans ediliyor mu?
* `vite.config.ts` içindeki özel commercial HTML mantığı tarafından kullanılıyor mu?
* Runtime tarafından string yol ile çağrılıyor olabilir mi?
* SEO, favicon, OG image veya manifest amacıyla kullanılıyor mu?
* Standalone HTML dosyaları tarafından referans ediliyor mu?

Kullanılmadığından emin olmadığın asset dosyalarını taşıma.

Açıkça kullanılmadığı doğrulanan asset dosyalarını doğrudan silme. Şuraya taşı:

```text
_archive/cleanup-2026-05-30/obsolete-assets/
```

Şüpheli assetleri şuraya taşıma; yalnızca raporla:

```text
_archive/cleanup-2026-05-30/review-required/
```

Asset raporunu şu dosyaya yaz:

```text
docs/cleanup/2026-05-30/ASSET_AUDIT.md
```

---

## Phase 0G — Script Taraması

`scripts/` klasörünü ve `package.json` scriptlerini incele.

Her script için şunları kontrol et:

* `package.json` tarafından çağrılıyor mu?
* Dokümanlarda kullanılıyor mu?
* CI/CD veya release sürecinin parçası mı?
* Supabase işlemleri için manuel olarak kullanılıyor olabilir mi?
* Import, data migration veya release doğrulama amacıyla mı oluşturulmuş?
* Aynı işlevi yapan daha güncel bir script var mı?
* Dosyada deprecated veya temporary olduğuna dair açıklama var mı?

Kesin şekilde obsolete olduğu doğrulanan scriptleri şuraya taşı:

```text
_archive/cleanup-2026-05-30/obsolete-scripts/
```

Karar veremediğin scriptleri taşıma. Raporla.

Script raporunu şu dosyaya yaz:

```text
docs/cleanup/2026-05-30/SCRIPT_AUDIT.md
```

---

# 8. Büyük Refactor Backlog’u Oluştur

Bu görev kapsamında uygulamayacağın ancak tespit ettiğin sorunları ayrı bir backlog dosyasına yaz.

Hedef dosya:

```text
docs/cleanup/2026-05-30/FOLLOW_UP_REFACTOR_BACKLOG.md
```

Backlog dosyasında aşağıdaki başlıkları kullan:

## P0 — Güvenlik veya Production Riski

Örnek konular:

* Frontend bundle içine yanlışlıkla sızabilecek secret değerleri
* RLS riski
* Auth bypass ihtimali
* Kullanılmayan fakat halen erişilebilir debug endpoint
* Server-only olması gereken env değerleri
* Riskli runtime davranışı

## P1 — Mimari Borç

Özellikle incele:

* Büyük `src/App.tsx` route tablosu
* Route modülerleştirme ihtiyacı
* Lazy loading eksikliği
* İki farklı Supabase client kaynağı
* Feature capsule eksikliği
* Eski ve yeni profil sistemlerinin paralel yaşaması
* React Query kullanım tutarsızlığı
* Component içinde doğrudan `supabase.from()` çağrıları
* Query key standardı eksikliği
* Ortak CRUD pattern eksikliği
* Form tekrarları
* Ortak hata yönetimi eksikliği

## P2 — Type Safety

Özellikle incele:

* `strictNullChecks: false`
* `noImplicitAny: false`
* `any` kullanımı
* Supabase generated `Database` type kullanım eksikliği
* Inline schema ve type tekrarları
* `z.infer` standardı ihtiyacı

Bu aşamada strict mode açma. Hata sayısını tahmini olarak raporla ve kademeli geçiş planı öner.

## P3 — Test Borcu

Özellikle incele:

* RolesGo
* Profile v2
* Surveys
* May19
* Workspace
* Muhasebe
* Referral
* Lansman
* Cadde
* Marquee
* Playwright E2E akışları

Minimum önerilen kritik E2E akışları:

1. Admin login
2. Public submission create
3. Survey response
4. Muhasebe entry create
5. Lansman registration
6. Workspace todo create
7. Profile approval flow
8. RolesGo attribute approval
9. Referral flow
10. RAG chat proxy smoke test

## P4 — Dokümantasyon Borcu

Özellikle incele:

* Güncelliği doğrulanamayan dokümanlar
* Birbiriyle çelişen rehberler
* Eski klasör yapılarını anlatan dokümanlar
* Eksik deploy rehberleri
* Eksik local setup rehberleri
* Eksik module owner bilgileri
* Karar dokümanı gerektiren alanlar

Her backlog kaydı için tablo kullan:

| ID | Öncelik | Alan | Dosya veya Modül | Sorun | Risk | Önerilen Sonraki PR | Not |
| -- | ------- | ---- | ---------------- | ----- | ---- | ------------------- | --- |

---

# 9. Taşıma Manifest Dosyası Oluştur

Yapılan her dosya taşıma işlemini şu dosyada kaydet:

```text
docs/cleanup/2026-05-30/MOVE_MANIFEST.md
```

Tablo formatı:

| ID | Eski Konum | Yeni Konum | Dosya Türü | İşlem Nedeni | Referans Kontrolü | Risk | Geri Alma Yöntemi |
| -- | ---------- | ---------- | ---------- | ------------ | ----------------- | ---- | ----------------- |

Örnek:

```text
| DOC-001 | docs/cleanup-old.md | docs/history/cleanup-reports/cleanup-old.md | Documentation | Tamamlanmış geçmiş cleanup raporu | Repo içi linkler tarandı ve güncellendi | Low | git mv ile eski konuma taşı |
```

Taşıma işlemlerinde mümkün olduğunda `git mv` kullan.

PowerShell örneği:

```powershell
New-Item -ItemType Directory -Force -Path docs\history\cleanup-reports
git mv .\docs\cleanup-old.md .\docs\history\cleanup-reports\cleanup-old.md
```

---

# 10. Doğrulama Adımları

Her anlamlı taşıma veya kod temizliği grubundan sonra doğrulama yap.

Final doğrulama sırasında aşağıdaki komutları çalıştır:

```powershell
git status --short
npm run lint
npm run test
npm run build
npm run verify:release
```

Gerekirse production server smoke testi yap:

```powershell
npm run start
```

Başlangıç ve final sonuçlarını karşılaştır.

Final sonuçlarını şu dosyaya yaz:

```text
docs/cleanup/2026-05-30/VALIDATION_RESULTS.md
```

Tablo formatı:

| Kontrol | Başlangıç Durumu | Final Durumu | Sonuç | Açıklama |
| ------- | ---------------- | ------------ | ----- | -------- |

Önemli kurallar:

* Başlangıçta kırık olan bir testi gizleme.
* Yeni kırılan test varsa değişikliği düzelt veya geri al.
* Build kırılırsa görevi tamamlanmış sayma.
* `verify:release` ortam nedeniyle çalışamıyorsa açıkça yaz.
* Validation yapılmamış bir değişikliği başarı olarak raporlama.

---

# 11. Cleanup Özet Raporu Oluştur

Ana rapor dosyası:

```text
docs/cleanup/2026-05-30/CLEANUP_REPORT.md
```

Rapor şu bölümleri içersin:

## 1. Yönetici Özeti

* Yapılan işlemlerin kısa özeti
* Kaç dokümanın taşındığı
* Kaç dosyanın arşivlendiği
* Kaç dosyada küçük clean-code düzeltmesi yapıldığı
* Kaç adayın manuel inceleme listesine eklendiği
* Build, test ve lint sonuçları

## 2. Dokümantasyon Düzenleme Sonuçları

* Oluşturulan klasörler
* Taşınan dokümanlar
* Root seviyesinde bırakılan dosyalar
* History klasörüne alınan dokümanlar
* Inbox-review listesi

## 3. Kod Temizliği Sonuçları

* Kaldırılan kullanılmayan importlar
* Kaldırılan debug loglar
* Temizlenen yorumlar
* Düzeltilen küçük tekrarlar
* Değiştirilen dosyaların listesi

## 4. Arşiv Sonuçları

* `_archive/cleanup-2026-05-30/` altına taşınan dosyalar
* Taşıma gerekçeleri
* Geri alma yöntemi
* Manuel inceleme gerektiren adaylar

## 5. Riskler ve Dokunulmayan Alanlar

* Bilerek değiştirilmeyen kritik dosyalar
* Belirsiz alanlar
* Production riski taşıdığı için ertelenen işlemler
* Profil sistemi belirsizlikleri
* Migration kirliliği
* Supabase client duplikasyonu
* Route modülerleştirme ihtiyacı

## 6. Validation Sonuçları

* Başlangıç ve final karşılaştırması
* Lint
* Test
* Build
* Release verification
* Çalıştırılamayan adımların gerekçeleri

## 7. Sonraki Önerilen PR’lar

En fazla 8 öneri yaz.

Önerileri küçük ve bağımsız PR’lara böl.

Örnek sıra:

1. ESLint kurallarının kontrollü sertleştirilmesi
2. Tek kanonik Supabase wrapper stratejisinin belirlenmesi
3. Route dosyalarının modül bazında ayrılması
4. Lazy loading uygulanması
5. React Query query-key standardının oluşturulması
6. Error utility eklenmesi
7. Profile v2 canonical kararının verilmesi
8. TypeScript strict mode için kademeli geçiş planı

---

# 12. Oluşturulması Gereken Dosyalar

Görev sonunda en az şu dosyalar bulunmalı:

```text
docs/README.md

docs/cleanup/2026-05-30/
├─ BASELINE_RESULTS.md
├─ DOCUMENT_INVENTORY.md
├─ FILE_CANDIDATES.md
├─ ASSET_AUDIT.md
├─ SCRIPT_AUDIT.md
├─ MOVE_MANIFEST.md
├─ FOLLOW_UP_REFACTOR_BACKLOG.md
├─ VALIDATION_RESULTS.md
└─ CLEANUP_REPORT.md

_archive/cleanup-2026-05-30/
└─ README.md
```

Gerekirse şu klasörleri oluştur:

```text
docs/architecture/
docs/modules/
docs/operations/deployment/
docs/operations/database/
docs/operations/security/
docs/operations/release/
docs/decisions/
docs/guides/
docs/history/deprecated/
docs/history/cleanup-reports/
docs/history/status-reports/
docs/history/completed-plans/
docs/inbox-review/

_archive/cleanup-2026-05-30/obsolete-code/
_archive/cleanup-2026-05-30/obsolete-scripts/
_archive/cleanup-2026-05-30/obsolete-assets/
_archive/cleanup-2026-05-30/temporary-files/
_archive/cleanup-2026-05-30/duplicate-files/
_archive/cleanup-2026-05-30/old-tests/
_archive/cleanup-2026-05-30/old-configs/
_archive/cleanup-2026-05-30/review-required/
```

Boş kalacak klasörleri oluşturmak zorunda değilsin.

---

# 13. Kabul Kriterleri

Görev ancak aşağıdaki koşullar sağlanırsa tamamlanmış sayılır:

* Dokümantasyon envanteri oluşturuldu.
* Root klasörü daha temiz hale getirildi.
* Aktif dokümanlar anlamlı klasörlere taşındı.
* Tarihsel dokümanlar ayrı klasörde toplandı.
* Gereksiz olduğu düşünülen dosyalar doğrudan silinmedi.
* Arşive taşınan her dosya manifest dosyasına işlendi.
* Belirsiz dosyalar açıkça raporlandı.
* Kritik production dosyalarına dokunulmadı.
* Migration geçmişi değiştirilmedi.
* RLS policy davranışları değiştirilmedi.
* Public URL yapısı değişmedi.
* Türkçe domain terimleri korunmaya devam etti.
* shadcn/ui dosyaları manuel olarak düzenlenmedi.
* Mevcut çalışan özelliklerde davranış değişikliği yapılmadı.
* Yeni lint, test veya build hatası oluşmadı.
* Cleanup raporu oluşturuldu.
* Sonraki refactor adımları ayrı backlog dosyasında listelendi.

---

# 14. Final Yanıt Formatı

Çalışmayı tamamladığında aşağıdaki formatta cevap ver:

## Tamamlanan İşlemler

Kısa maddeler halinde yaz.

## Değiştirilen Dosyalar

* Oluşturulan dosyalar
* Taşınan dosyalar
* Düzenlenen kaynak kod dosyaları
* Arşivlenen dosyalar

## Validation Sonuçları

| Kontrol | Sonuç | Açıklama |
| ------- | ----- | -------- |

## Manuel İnceleme Gerektiren Alanlar

Yalnızca gerçekten kullanıcı kararı gerektiren konuları yaz.

## Sonraki Önerilen PR

Bir sonraki en düşük riskli clean-code adımını öner.

---

# 15. Son Güvenlik Kuralı

Bu görev sırasında emin olmadığın hiçbir dosyayı silme.

Bir dosyanın aktif olup olmadığı net değilse:

1. Silme.
2. Riskli şekilde taşıma.
3. Tahmin yürütme.
4. `review-required` veya backlog listesine ekle.
5. Kararın neden verilemediğini açıkça yaz.

Öncelik kod miktarını azaltmak değil, güvenli ve izlenebilir bir temizlik süreci oluşturmaktır.
