# Durum Raporu

Bu dosya, paylaşılan oturum çıktılarındaki bulguları tek yerde toplar. İçerik aşağıdaki başlıklarda derlenmiştir:

1. Profil görüntüleme yapıları envanteri
2. Cadde modülü son durum analizi
3. Ana sayfa "Ağdaki hikayeler" bölümü placeholder bulgusu
4. Ana sayfa "Şehir Elçileri" yönlendirme hatası

## 1. Profil Görüntüleme Yapıları

Kod tabanı taramasına göre görsel olarak **5 farklı profil yapısı/layout** bulunuyor.

### 1. Üye profil editörü
- Görünürlük: Login olan kullanıcı kendi profilini görür ve düzenler
- Route: `/profile/:type` ve giriş noktası olarak `/profile`
- Tanım: Tek editör yapısı içinde rol-güdümlü dinamik alanlar render ediliyor
- Dosyalar:
  - `src/pages/ProfilePage.tsx`
  - `src/pages/ProfileResolverPage.tsx`
  - `src/lib/profile-types.ts`
  - `src/lib/profile-presentation.ts`
- Not: Aynı editör içinde 6 rol kategorisi var:
  - Bireysel
  - Danışman / Consultant
  - İşletme
  - Kuruluş
  - Influencer
  - Şehir Elçisi
- Ek varyant: `EXPERIMENTAL_2_PRESENTATION` üzerinden Premium pilot alt-varyantı bulunuyor.

### 2. Katalog varlığı editörü
- Görünürlük: Login olan kullanıcı kendi katalog varlığını düzenler
- Route: `/profile/catalog/:itemId`
- Tanım: Üye dışı düzenlenebilir varlıklar için ayrı editör yapısı
- Dosya:
  - `src/pages/CatalogItemEditorPage.tsx`

### 3. Public katalog profili
- Görünürlük: Anonim kullanıcılar, dışarıdan ziyaretçiler, başka üyeler
- Route: `/directory/catalog/:slug`
- Tanım: Ana public profil yapısı; dinamik composer yaklaşımı kullanıyor
- Yapı özellikleri:
  - Hero
  - Quick actions
  - Section list
  - Trust card
- Dosyalar:
  - `src/components/directory/public-profile/PublicProfileShell.tsx`
  - `src/pages/DirectoryCatalogItemPage.tsx`
- Not: `heroVariant` katmanı üzerinden `member`, `professional`, `business`, `organization`, `experimental` gibi farklı hero stilleri var.
- Not: `src/pages/DirectoryProfilePage.tsx` doğrudan ayrı bir layout değil; eski uyumluluk için redirect davranışı gösteriyor.

### 4. Bağımsız kuruluş profili
- Görünürlük: Anonim kullanıcılar ve dış ziyaretçiler
- Route: `/kurulus/:slug`
- Tanım: Konsolosluk / büyükelçilik benzeri yapılar için sabit şablonlu ayrı public profil
- Dosya:
  - `src/pages/IndependentProfilePage.tsx`

### 5. Cadde sosyal profil görünümü
- Görünürlük: Cadde bağlamındaki kullanıcılar
- Route/Bağlam: `/cadde` içi sosyal akış / oda deneyimi
- Tanım: Rehber veya editör ekranlarından bağımsız, Cadde içinde kullanılan profil kartı / sosyal görünüm
- Dosya:
  - `src/components/cadde/CaddeProfileGate.tsx`

### Admin tarafı
- Ayrı yönetici görünümleri mevcut, ancak ziyaretçi veya normal kullanıcı profili sayılmaz
- Örnek dosyalar:
  - `src/pages/admin/AdminConsulateProfilesPage.tsx`
  - `src/components/admin/CatalogEntityProfilePanel.tsx`
  - `src/components/directory/DirectoryResultRow.tsx`

### Sonuç
- Login içi profil yapıları: **2**
- Dışarıdan / public profil yapıları: **3**
- Toplam distinct görsel profil yapısı: **5**

## 2. Cadde Modülü Son Durum Analizi

Tarih: `2026-06-23`

Genel durum: **Cadde 3.0 rebuild tamamlanmış ve canlıda** olarak raporlanmış. Faz 0-9 ve kuyruk kapanışı tamamlanmış; testler yeşil; rotalar bağlı. Açık kalemler daha çok canary sonrası kararlar, ürün tercihleri ve temizlik işleri.

### Test durumu
- Çalıştırılan komut:
  - `npm run test -- src/lib/cadde`
- Sonuç:
  - **6 test dosyası geçti**
  - **93/93 test geçti**
- Geçen test dosyaları:
  - `src/lib/cadde-ranking.test.ts`
  - `src/lib/cadde-format.test.ts`
  - `src/lib/cadde-targeting.test.ts`
  - `src/lib/cadde-rules.test.ts`
  - `src/lib/cadde-schemas.test.ts`
  - `src/lib/cadde-notifications-api.test.ts`

### Frontend kod envanteri
- Oturum çıktısına göre `src/lib/cadde-*.ts` eşleşmesinde **21 dosya** bulundu
- Modül ailesi şu alanları kapsıyor:
  - API
  - rules
  - ranking
  - schemas
  - targeting
  - bildirimler
  - moderasyon
  - admin API
  - query keys
  - format
  - types
  - internal yardımcılar

### Rotalar
`src/App.tsx` içinde Cadde rotalarının bağlı olduğu raporlandı:

- `/cadde`
- `/cadde/cafe/:cafeId`
- `/cadde/carsi`
- `/cadde/carsi/:itemId`

Not: Bu rotalar `caddeAccess` feature flag koruması altında ve `lazy()` ile code-split edilmiş.

### Migrasyonlar
- `supabase/migrations/*cadde*` taramasında **16 dosya** bulundu
- Cadde 3.0 serisi:
  - `cadde300_001` -> `cadde300_014`
- Zaman aralığı:
  - `20260610180000`
  - `20260611160000`
- En güncel migrasyon:
  - `20260611160000_cadde300_014_kuyruk.sql`

### SQL <-> TS mirror contract durumu
Var olduğu ve testli olduğu raporlanan eşleştirmeler:

- `can_post_kopru` <-> `cadde-rules.ts`
- `list_cadde_feed_v1` <-> `cadde-ranking.ts`
- `can_join_cadde_cafe` <-> `canJoinCafeRule`
- auto-scan <-> blocklist

Ek notlar:
- Ban kill-switch: `has_cadde_feature`
- Limit ayarları: `cadde_settings`

### Kapanmış kuyruk kalemleri
Migrasyon 014 ile tamamlandığı belirtilen başlıklar:

- Otomatik kelime / spam taraması
- Çarşı "iletişim" bildirimi
- `cafe.expiring` bildirimi
- Composer hedef seçici
- `ProfilePage` panel parity
- `/admin/cadde/carsi` yönetim sayfası

### Açık / bekleyen kalemler

#### 1. Legacy tablo DROP kararı
- Bekleyen tablolar:
  - `feed_posts`
  - `feed_likes`
  - `cafes`
  - `cafe_memberships`
  - `user_follows`
- Engel:
  - Canary sonrası ayrı karar dokümanı ve migration ihtiyacı
  - `user_follows` tablosunda en az 1 satır taşıma notu

#### 2. B1 types regen ve `db as any` temizliği
- Oturum metninde iki farklı durum notu var:
  - `change-report` içinde token sorunu yüzünden bekliyor denmiş
  - Memory kaydına göre daha sonra types regen çözülmüş ve `tsc` sıfır hata vermiş
- Sonuç:
  - Cadde tarafında kalan kısım muhtemelen `cadde-internal.ts` içindeki izole `db as any` temizliği

#### 3. D-03 telefon doğrulama
- Engel:
  - SMS sağlayıcı kararı bekleniyor
- Muhtemel çözüm hattı:
  - OTP Edge Function
  - `cadde_settings` flag aktivasyonu

#### 4. Public profil yüzeyi entegrasyonu
- Bekleyen iş:
  - "Açık Cafe / Etkinlik" alanının directory catalog composer'a eklenmesi

#### 5. Homepage AI bar / category-first-screen
- Bileşen henüz yazılmamış
- Placement hazırlıkları mevcut

#### 6. P2 seviye işler
- Playwright persona matrisi
- D-07 premium kademe
- billboard -> kampanya migrasyonu

### Cadde özeti
- Genel sağlık: **iyi**
- Testler: **geçiyor**
- Rotalar: **bağlı**
- Kritik blokaj: **yok**
- Kalan işler: daha çok ürün kararı, temizlik ve canary sonrası kararlar

## 3. Ana Sayfa "Ağdaki Hikayeler" Bölümü

### Bulgular
- `src/components/home-trial/DiasporaStoriesSection.tsx` içeriğinin placeholder olduğu tespit edilmiş
- Kod yorumunda da placeholder niteliği açık biçimde belirtilmiş
- Kullanılan örnek hikayeler gerçek içerik değil
- Hikayelerin bazı linkleri mevcut içerik sayfalarına gitse de içeriklerin kendisi uydurma / statik

### Kullanıcının verdiği yön
- Kullanıcı kararı:
  - `"Ağdaki hikayeler" bölümü için gerçek içerik nereden gelsin?` sorusuna cevap olarak **"Blog modülünden çek"** denmiş

### Keşif sonucu
- Blog modülünde yayınlanmış yazıları getiren bir mekanizma olduğu raporlanmış
- İncelenen dosyalar:
  - `src/lib/blog.ts`
  - `src/lib/blog-schemas.ts`
  - `src/pages/BlogPostPage.tsx`
- Rota davranışı:
  - Tekil yazı: `/blog/:slug`
  - Liste / hub yönü: `/radar/rehberler`

### Önerilen / tasarlanan değişiklik
- Section'ı statik placeholder veriden çıkarıp blog modülüne bağlamak
- İlk 3 yayınlanmış blog yazısını göstermek
- Kart alanları:
  - Başlık = `title`
  - Üst etiket = `country_label` veya `category_label`
  - Özet = `excerpt`
  - Link = `/blog/${slug}`
- "Tümünü gör" linki:
  - `/radar/rehberler`
- Veri yoksa section'ı hiç render etmemek

### Oturumdaki uygulama durumu
- Oturum içinde `DiasporaStoriesSection.tsx` için güncellenmiş bir sürüm taslağı üretilmiş
- Ancak hemen sonrasında `"buluları kaydet"` isteği API `500` hatasıyla kesilmiş
- Bu nedenle oturum metnine göre:
  - değişiklik tasarlanmış
  - kod önerisi hazırlanmış
  - fakat kaydın gerçekten dosyaya yazılıp yazılmadığı bu oturum metninden kesin doğrulanmıyor

## 4. Ana Sayfa "Şehir Elçileri" Butonu

### Tespit edilen sorun
- Ana sayfadaki `"Şehir Elçileri"` kartı / butonu yanlış hedefe gidiyor
- Mevcut hedef:
  - `/founders`
- Bu hedef `Biz Kimiz / Founders` sayfasına ait ve Şehir Elçileri için doğru değil

### İncelenen alanlar
- `src/pages/LandingTrialPage.tsx`
- `src/components/home-trial/EcosystemRailSection.tsx`
- `src/components/home-trial/home-trial.data.ts`
- `src/App.tsx`

### Bulgular
- Hatalı yönlendirme `ECOSYSTEM_CARDS` verisi içinde bulunmuş
- `"Şehir Elçileri"` kartının `to` alanı `/founders` olarak tanımlı
- Oturum analizine göre repo içinde ayrı bir public `CityAmbassadors` route'u mevcut değil veya aktif route tablosunda bağlı değil

### Analiz yönü
- Oturumdaki değerlendirmeye göre doğru hedefin özel bir public ambassador sayfası değil, mevcut public directory yapısındaki ambassador filtreli görünüm olması daha olası
- İlgili ipucu:
  - `Consultants.tsx` içinde ambassador kategorisi bulunduğu not edilmiş
  - `DirectoryPage.tsx` içinde query param ile role bazlı filtre desteği olduğu not edilmiş

### Durum
- Bug **tespit edilmiş**
- Hatalı kaynak **lokalize edilmiş**
- Doğru hedef için güçlü yönelim **directory / ambassador filtresi**
- Ancak bu oturum metninde kesin yeni route değeri henüz son satıra bağlanmamış
- Kullanıcı sonrasında bu konu dahil tüm bulguların `durumraporu.md` dosyasına alınmasını istemiş

## Genel Sonuç

Bu oturum dizisinden çıkan ana tablo şöyledir:

- Profil sistemi tarafında **5 distinct görsel profil yapısı** tespit edilmiş
- Cadde modülü tarafında **rebuild tamamlanmış, testler yeşil, kalan işler sınırlı**
- Ana sayfadaki `"Ağdaki hikayeler"` bölümü için **placeholder olduğu doğrulanmış** ve **blog modülünden besleme** yönü netleşmiş
- Ana sayfadaki `"Şehir Elçileri"` linkinde **yanlış yönlendirme** bulunmuş; kaynak dosya lokalize edilmiş, doğru hedef için ambassador filtreli directory yaklaşımı öne çıkmış

## 5. CorteQS 23 June 2026 Mobile Audit Remediation Plan

Bu bölüm, sonradan eklenen mobil denetim / düzeltme planını rapora dahil eder. Plan iki dalga halinde uygulanacak şekilde tanımlanmıştır.

### Genel özet
- Teslimat **2 wave / 2 commit** olarak planlanır
- Wave 1 önceliği:
  - güven
  - SEO
  - public-facing sorunlar
- Wave 2 önceliği:
  - Cadde mobil UX temizliği
  - konservatif veri / manual SQL takip işleri

### Ortak altyapı değişiklikleri

Planlanan ortak arayüz / altyapı işleri:

- `src/lib/contact-links.ts`
  - public linklerin merkezi yönetimi
  - beklenen sabitler:
    - `PUBLIC_WEBSITE`
    - `PUBLIC_WHATSAPP_COMMUNITY`
    - gerçekten kalacaksa açık isimli ikincil linkler
- `src/lib/page-seo.ts`
  - typed page SEO registry
  - tüm public route title / description / canonical değerleri burada tutulacak
- legal/public sayfa altyapısının ortaklaştırılması
  - sayfalar mevcut `useSeo` helper'ını kullanacak
  - manuel DOM mutation yaklaşımı azaltılacak
- yalnız gerekli yerlerde stabil `data-testid` ekleri
  - Cadde feed card'ları
  - comment toggle / panel
  - empty state blokları
  - scroll-top button

### Wave 1

#### 1. Public WhatsApp standardizasyonu
- Contact, Footer, hero / CTA yüzeyleri ve Cadde beta CTA taranacak
- Genel `"WhatsApp"` etiketleri resmi community linkine gidecek
- Eğer alternatif invite link kalırsa adı açıkça yazılacak:
  - founder
  - beta
  - community
- Geçersiz link her yerde kaldırılacak:
  - `https://wa.me/message/corteqs`
- Varsayım:
  - resmi public community link:
    - `https://chat.whatsapp.com/IOpBgZK29CQEhhdOd5hUAD`

#### 2. Route-specific SEO
- Mevcut helper ile route bazlı SEO uygulanacak
- Hedef public route'lar:
  - `/`
  - `/founders`
  - `/pricing`
  - `/founding-1000`
  - `/iletisim`
  - `/kariyer`
  - `/radar/rehberler`
  - `/legal/privacy`
  - `/legal/kvkk`
  - `/legal/terms`
  - `/legal/cookies`
- Kural:
  - root canonical yalnız `/` için kullanılacak
  - diğer public sayfalarda self-canonical ve Türkçe metadata kullanılacak

#### 3. PrivacyPolicyPage düzeltmesi
- Sayfa Türkçe-first olacak
- Beklenen title:
  - `Gizlilik Politikası | CorteQS`
- Beklenen canonical:
  - `https://corteqs.net/legal/privacy`
- KVKK / GDPR dili dikkatli yeniden yazılacak

#### 4. Prerender ve render-complete kontrolü
- Var olan prerender akışı korunacak
- Route bazında eksik render-complete bulgusu yoksa server tarafında değişiklik yapılmayacak

#### 5. Mobile Playwright kapsamı
- Desktop chromium korunacak
- Ek bir mobile project eklenecek
- Bu mobile project yalnız `*mobile*.spec.ts` dosyalarını koşturacak
- Böylece tüm suite iki kez çalıştırılmayacak

#### 6. Yeni E2E testi
- Yeni dosya:
  - `e2e/mobile-public-audit.spec.ts`
- Kapsam:
  - canonical / meta kontrolü
  - contact-link doğrulaması
  - Türkçe karakter koruma kontrolleri

### Wave 2

#### 1. Cadde mobil bilgi mimarisi
- Auth / feature-gate davranışı değişmeyecek
- Küçük ekranlarda:
  - feed ve composer ana alan olacak
  - ikincil yan içerikler collapse veya demote edilecek
  - tek ana `Diaspora Cadde` heading korunacak
  - mobilde tekrarlanan içerikler kaldırılacak
    - örnek: `Aktif Cafe Özeti`

#### 2. Feed yoğunluğu ve kart ayrışması
- Mobilde feed kartlarının sınırları daha net olacak
- İç boşluklar tutarlı hale getirilecek
- Yorumlar her postun içinde görsel olarak daha belirgin yuvalanacak

#### 3. Comment accordion davranışı
- Varsayılan görünüm:
  - en fazla 1-2 preview comment
- Tetikleyici:
  - kompakt `X yorum / Yorum yaz`
- Textarea:
  - yalnız seçili post için açılacak
- Logout kullanıcı:
  - her yerde disabled textarea yerine kompakt login CTA görecek

#### 4. Empty state iyileştirmeleri
- Davetkâr boş durum ekranları eklenecek:
  - feed
  - active cafes
  - promotions / billboards
  - `Şehrinden Öne Çıkanlar`

#### 5. Cafe kapasite girdisi
- Serbest sayı girişi kaldırılacak
- Sabit seçenekler:
  - `10`
  - `25`
  - `50`
- Eski migration dosyaları değiştirilmeyecek
- Eğer aktif DB / RPC kuralları büyük değerleri kabul ediyorsa yeni manual SQL follow-up eklenecek:
  - `supabase/manual/2026-06-23_*.sql`

#### 6. Scroll-top butonu
- Mobilde daha güvenli davranacak
- Beklenen davranış:
  - daha küçük footprint
  - safe-area aware offset
  - küçük ekranda icon-only
  - yalnız scroll sonrası görünür
  - footer / CTA içeriğini kapatmaz

#### 7. Geo-cluster kapsam sınırı
- Bu passta full backend rewrite yapılmayacak
- Yerine minimal sparse-content fallback gönderilecek:
  - global / country-general default davranış
  - yardımcı açıklama metni
  - mevcut country / city filtreleri ve URL paramları bozulmayacak

#### 8. Junk content / malformed Turkish temizliği
- Eski migration'lar yeniden yazılmayacak
- Yalnız aktif, canlıya bakan tablolar incelenecek
- Sonra exact-match manual SQL scriptleri hazırlanacak
- Scriptlerde şunlar olacak:
  - `SELECT` preview
  - moderation / update adımları dokümantasyonu

#### 9. Yeni Cadde mobil testleri
- Yeni E2E:
  - `e2e/cadde-mobile-audit.spec.ts`
- Yaklaşım:
  - mevcut Playwright network-mock pattern'i
  - mocked Supabase auth / feature responses
- Ek component testleri:
  - `src/pages/cadde/CaddePage.test.tsx`
- Kapsam:
  - comment accordion behavior
  - empty-state rendering

### Test planı

Çalıştırılması beklenen komutlar:

- `npm run verify:text`
- `npm run test -- --run`
- `npm run build`
- `npm run test:e2e`

Ek raporlama:

- `npm run lint`
- Repo genelindeki mevcut lint borcu ayrı raporlanacak
- Kabul kriteri:
  - dokunulan dosyalarda yeni lint regresyonu olmayacak
  - mevcut global lint borcu değişmeden kalabilir

### Yeni assertion beklentileri

Yeni test kapsamı şu maddeleri doğrulamalı:

- self-canonical URL'ler
- page-specific Turkish meta
- `wa.me/message/corteqs` linkinin hiçbir yerde kalmaması
- Türkçe karakterlerin korunması
- görünür `Görünür OI` / `Kayıt OI` bozukluklarının olmaması
- comment input'un varsayılan kapalı olması
- faydalı empty state içerikleri
- mobile scroll-top davranışının içerikle çakışmaması

### Varsayımlar

- Teslimat 2 commit / 2 wave olarak kalır
- Resmi public community WhatsApp linki:
  - `https://chat.whatsapp.com/IOpBgZK29CQEhhdOd5hUAD`
- Repo genelindeki eski lint borcu bu audit kapsamı dışındadır
- Geçmiş migration dosyaları immutable history kabul edilir
- Production temizlikleri yeni manual SQL dosyalarıyla yapılır

## 6. İş Bitince Admin Paneli Güncellemeleri

Kullanıcı talebi netleştirildi:

- Bu iş tamamen bittiğinde admin panelindeki ilgili güncellemeleri **ben ekleyeceğim**
- Sadece teknik rapora not düşülmeyecek; admin tarafındaki gerekli içerik / açıklama / görünür güncellemeler de uygulanacak

Teslim beklentisi:

- Admin panelinde bu dosyalarda yapılan işlerin karşılığı olan güncellemeler ayrıca işlenecek
- Bu anlatım teknik changelog diliyle değil, günlük ve anlaşılır dille yazılacak
- Amaç:
  - neyin düzeldiğini sade biçimde anlatmak
  - kullanıcı veya operasyon tarafında neyin kolaylaştığını belirtmek
  - varsa eski kafa karışıklığını veya riski nasıl azalttığını açıklamak

Bu madde, uygulama bittikten sonraki zorunlu teslimat kapsamı olarak kabul edilir.
