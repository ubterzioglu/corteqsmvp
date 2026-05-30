# CorteQS Commercial Contributor Page Structure

Bu doküman, [`info-contributor.html`](c:/temp_private/corteqs/corteqs_landing/info-contributor.html) dosyasındaki `/commercial/contributor/` sayfasının yapısını tekrar üretilebilir bir şablon olarak açıklar. Amaç, sonraki commercial belgeleri aynı görsel sistem ve içerik akışıyla daha hızlı hazırlamaktır.

## Amaç

Bu sayfa bir satış dokümanı değil, “tek sayfalık açıklayıcı commercial handoff” formatındadır.

Kullanım amacı:

- Belirli bir rolü veya partner modelini hızlı anlatmak
- Gelir modeli, süreç ve değer önerisini tek sayfada göstermek
- CTA ile kullanıcıyı `corteqs.net` ana başvuru akışına yönlendirmek
- Uzun PDF hissi vermeden, açılır bloklarla yoğun bilgiyi sindirilebilir tutmak

## Sayfa Karakteri

Sayfa şu tasarım karakterine sahip:

- Tek HTML dosyası
- Harici framework yok
- Güçlü görsel katmanlı arka plan
- Büyük hero + maskot görseli
- Cam efekti ve yumuşak kart sistemi
- Accordion-first bilgi mimarisi
- Mobil öncelikli, desktop’ta genişleyen grid yapısı

## Tasarım Sistemi

Ana tokenlar:

- Font: `Manrope`
- Ana renkler: `--navy`, `--blue`, `--cyan`, `--orange`, `--yellow`, `--green`
- Arka plan: açık beyaz/mavi degrade + radial glow katmanları
- Kart: `--card: rgba(255,255,255,.86)`
- Radius: `--radius: 28px`
- Gölge: `--shadow: 0 24px 70px rgba(3,16,34,.16)`

Görsel dil:

- Üstte fixed grid overlay
- Sağ üstte `orbit-bg` dairesel çerçeve dekoru
- Büyük gradient başlık
- Beyaz/cam kartlar
- Renkli emoji ikonlar

## Sayfa İskeleti

Ana akış:

1. Hero
2. Stats
3. Program nedir?
4. Contributor ne yapar?
5. Paketler ve kazanç modeli
6. Dashboard
7. Yol haritası
8. Detaylı anlatım arşivi
9. Footer

Temel DOM sırası:

```html
<body>
  <div class="orbit-bg"></div>
  <main id="top">
    <div class="container hero">...</div>
    <section id="program">...</section>
    <section>...</section>
    <section id="kazanc">...</section>
    <section id="dashboard">...</section>
    <section id="basvuru">...</section>
    <section id="program-arsivi" class="archive">...</section>
  </main>
  <footer>...</footer>
</body>
```

## Bölüm Bazlı Yapı

### 1. Hero

Amaç:

- Rolü tek cümlede anlatmak
- Güçlü bir ana vaat vermek
- Hızlı CTA sunmak

İçerik parçaları:

- `eyebrow`
- büyük `h1`
- `lead`
- 2 aksiyon butonu
- sağda `hero-card` içinde maskot görseli

Kullanılan class’lar:

- `.hero`
- `.eyebrow`
- `.pulse`
- `.gradient-text`
- `.lead`
- `.actions`
- `.btn.primary`
- `.btn.secondary`
- `.hero-card`
- `.mascot`

İçerik kuralı:

- Başlık 2 parçalı olmalı
- İkinci vurgu `gradient-text` ile öne çıkmalı
- Lead paragrafı 1 kısa blok olmalı
- CTA sayısı tercihen 2 olmalı

### 2. Stats

Amaç:

- Hızlı güven sinyali vermek
- Programı sayısal olarak çerçevelemek

Yapı:

- `.stats`
- tekrar eden `.stat`
- içinde bir `strong` ve bir `span`

Not:

- Contributor sayfasında bu alan hero’dan hemen sonra geliyor
- Diğer sayfalarda bu blok opsiyonel bırakılabilir

### 3. Primary Accordion Sections

Bu sayfanın ana bilgi mimarisi büyük accordion kartlar üzerine kurulu.

Kapsam:

- `Program nedir?`
- `Contributor ne yapar?`
- `Paketler ve kazanç modeli`
- `Contributor Dashboard'da Neler Var ?`
- `Contributor yol haritası`
- `Detaylı Anlatım`

Standart iskelet:

```html
<section id="ornek">
  <div class="container">
    <details class="card accordion-card">
      <summary class="accordion-toggle">
        <div class="accordion-title">
          <div class="icon">🌍</div>
          <div class="accordion-copy">
            <h3>Bölüm başlığı</h3>
            <p>Kısa özet cümlesi</p>
          </div>
        </div>
        <span class="accordion-arrow" aria-hidden="true">
          <span class="accordion-glyph"></span>
        </span>
      </summary>

      <div class="accordion-body">
        <!-- bölüm içeriği -->
      </div>
    </details>
  </div>
</section>
```

Bu desen sonraki sayfalarda korunmalı.

## İçerik Bileşenleri

### Card

Kullanım:

- kısa açıklama
- alt başlık
- avantaj listesi
- iki sütunlu mini anlatım

Class:

- `.card`

Varyant:

- `.card.dark`

### Grid

Kullanım:

- iki kartı yan yana göstermek
- görev tipleri, avantajlar, örnekler

Class:

- `.grid-2`
- `.grid-2.stack-always`

Kural:

- Mobilde tek kolon
- Desktop’ta iki kolon
- `stack-always` gerektiğinde desktop’ta bile tek kolon bırakır

### Price Card

Kullanım:

- paket / plan / seviye anlatımı

Class:

- `.price-card`

Sayfadaki örnek:

- Aylık Paket
- Yıllık Paket

### Table

Kullanım:

- oran tablosu
- senaryo tablosu
- seviye karşılaştırması

Contributor sayfasında 2 tablo var:

- kademe karşılaştırması
- referral kazanç örnekleri

### Callout

Kullanım:

- kritik fırsat
- kurucu avantajı
- final CTA

Class:

- `.callout`

Özellik:

- yüksek kontrastlı arka plan
- içinde tekrar başlık + paragraf + CTA olabilir

### Steps

Kullanım:

- lineer yol haritası
- başvuru süreci

Class:

- `.steps`
- `.step`

Contributor sayfasında 6 adımlı akış kullanılıyor.

### Archive / Nested Accordion

Bu sayfanın son bölümü, yüksek bilgi yoğunluğunu ikinci seviyede açılır yapı ile taşıyor.

Ana blok:

- `.archive`
- `.archive-wrap`
- `.archive-grid`

İç blok:

- `.accordion-item`

Amaç:

- Uzun açıklamaları ana akışı bozmadan saklamak
- Tek sayfayı hem kısa özet hem derin anlatım olarak kullanmak

Bu yapı özellikle gelecekteki “ambassador”, “partner”, “community lead”, “advisor” gibi sayfalarda çok değerli.

## Contributor Sayfasındaki İçerik Mantığı

Bu sayfa içerik olarak şu sırayla ikna kuruyor:

1. Rol nedir?
2. Kimler için?
3. Ne yapar?
4. Nasıl kazanır?
5. Hangi araçlara sahip olur?
6. Süreç nasıl işler?
7. Tüm detaylar isterse nerede açılır?
8. Başvuru nereye gider?

Bu ikna akışı korunmalı. Yani ileride aynı yapıda başka sayfalar üretirken başlıklar değişse de mantık değişmemeli.

## Reusable Blueprint

Yeni bir commercial page üretirken şu şablon kullanılmalı:

### A. Hero

- rol adı
- ana değer önerisi
- kısa açıklama
- 1 birincil CTA
- 1 ikincil CTA
- sağda görsel / maskot / illüstrasyon

### B. Role Definition

- bu rol nedir
- kimler için uygundur
- neden önemlidir

### C. Responsibilities

- bu kişi / kurum ne yapar
- katkı alanları nelerdir

### D. Monetization or Value Model

- gelir modeli varsa anlat
- yoksa görünürlük / erişim / network / temsil avantajını anlat

### E. Tooling / System

- dashboard
- panel
- takip
- metrikler

### F. Journey

- başvuru
- onay
- onboarding
- aktif kullanım
- seviye atlama

### G. Deep Archive

- uzun SSS
- detaylı açıklamalar
- örnek senaryolar

### H. Final CTA

- ana siteye dönüş
- başvuru linki
- görüşme / iletişim

## İçerik Yazım Kuralları

Bu formatta yeni sayfalar yazarken:

- Kısa ve vurucu başlık kullan
- Her accordion summary altında 1 cümlelik özet ver
- Ana gövdeyi listelerle parçala
- Aşırı uzun paragrafları archive bölümüne taşı
- “rol”, “değer”, “süreç”, “kazanç”, “araç”, “CTA” sırasını koru

## Teknik Notlar

Dosya tipi:

- saf `.html`

Bağımlılıklar:

- yalnızca Google Fonts

Asset yaklaşımı:

- büyük görsel gerekiyorsa harici public URL kullanılabiliyor

Responsive davranış:

- mobilde tek kolon
- geniş ekranda iki kolon
- hero ve stats desktop’ta genişliyor

Accordion yaklaşımı:

- native `details/summary`
- JS zorunlu değil

## Sonraki Sayfalar İçin Önerilen İş Akışı

Yeni belge geldiğinde şu şekilde ilerleyebiliriz:

1. Önce rolün amacı ve hedef kitlesini çıkarırız.
2. Contributor yapısındaki bölüm sırasını koruruz.
3. Sadece içerik başlıklarını yeni role göre adapte ederiz.
4. Gerekirse kazanç bölümünü “faydalar” veya “temsiliyet modeli” ile değiştiririz.
5. Son kısımda yine detaylı archive bırakırız.

## Hızlı Checklist

- Hero güçlü mü?
- Ana vaat ilk ekranda net mi?
- En az 4-6 ana accordion var mı?
- Kart yapısı contributor sayfasıyla tutarlı mı?
- Gelir / fayda / süreç net mi?
- Final CTA var mı?
- Uzun içerik archive bölümüne alındı mı?

## Kaynak

Referans dosya:

- [`info-contributor.html`](c:/temp_private/corteqs/corteqs_landing/info-contributor.html)
