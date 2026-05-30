# CorteQS SEO & GEO İyileştirme Planı
**URL:** https://corteqs.net/  
**Rapor Tarihi:** 20.04.2026 | **Analiz ID:** 717155a8  
**Mevcut Skor:** Genel: 45/100 | Teknik SEO: 65/100 | İçerik Kalitesi: 25/100  
**Toplam Sorun:** 372 (182 Kritik, 190 Orta)

---

## 🖥️ FRONTEND DEĞİŞİKLİKLERİ

> HTML/JSX şablonlarında, CSS'te ve statik içerikte yapılacak değişiklikler.  
> Geliştirici: UI/Frontend ekibi

---

### FE-01 — H1 Etiketi Düzeltmesi `[KRİTİK]`

**Dosya:** Ana sayfa şablonu (index veya home component)

**Mevcut:**
```html
<h1>Diasporayı BirleştirenPlatformYakında</h1>
```

**Olması gereken:**
```html
<h1>CorteQS: Global Türk Diasporasını Birleştiren Network Platformu</h1>
```

**Yapılacaklar:**
- [ ] H1 içindeki kelime birleşme hatasını düzelt (`BirleştirenPlatformYakında`)
- [ ] Marka adı `CorteQS`'i H1'e ekle
- [ ] "Yakında" ifadesini H1'den kaldır — geçici durum bilgisini ayrı bir `<span class="badge">` veya `<p>` ile göster

---

### FE-02 — Görsel ALT Etiketleri `[KRİTİK]`

**Dosya:** Hero component veya ana sayfa şablonu

**Mevcut:**
```html
<img src="hero-landmarks-watercolor.png" alt="" />
```

**Olması gereken:**
```html
<img 
  src="hero-landmarks-watercolor.png" 
  alt="CorteQS Diaspora Connect - Almanya ve Avrupa'daki Türk Diaspora Ağı ve Şehir Rehberi"
/>
```

**Yapılacaklar:**
- [ ] `hero-landmarks-watercolor` görselinin `alt=""` alanını doldur
- [ ] Sayfadaki diğer 4 görselin `alt` etiketlerini kontrol et — boş veya anlamsız olanları düzelt
- [ ] Alt metinlerde hedef anahtar kelimeleri doğal şekilde kullan (keyword stuffing yapma)

---

### FE-03 — Hero Bölümü İçerik Genişletme `[YÜKSEK]`

**Dosya:** Hero section component

**Mevcut durum:** Hero bölümünde H1 + CTA butonu var, açıklayıcı paragraf yok.

**Eklenecek:**
```html
<p class="hero-description">
  CorteQS, yurtdışında yaşayan Türk diasporası için geliştirilmiş şehir bazlı bir 
  topluluk ve hizmet platformudur. Almanya, Avrupa ve dünya genelindeki Türk 
  topluluklarını doğrulanmış danışmanlar, yerel işletmeler ve gurbetçi ağlarıyla 
  buluşturuyoruz. Yeni bir ülkeye taşınıyor musun? CorteQS ile relocation sürecinden 
  adaptasyona kadar her adımda yanındayız.
</p>
```

**Yapılacaklar:**
- [ ] Hero bölümüne yukarıdaki paragrafı ekle (80-100 kelime)
- [ ] Mobil görünümde okunabilirliği test et

---

### FE-04 — Kategori Kartları Açıklama Metni `[YÜKSEK]`

**Dosya:** Kategoriler / Services section component

**Mevcut durum:** Kartlarda yalnızca başlık ve ikon var, açıklayıcı metin yok.

**Eklenecek (her karta `<p>` olarak):**

| Kart | Eklenecek Açıklama |
|---|---|
| Relocation Danışmanlığı | Yeni ülkeye taşınma (relocation) sürecinde güvenilir danışmanlarla bağlantı kur. Vize, konut, eğitim ve daha fazlası için uzman desteği al. |
| Expat Topluluk Ağı | Şehrindeki Türk expat topluluğuna katıl. Newcomer'lara özel rehberler ve şehir bazlı diaspora etkinlikleriyle tanış. |
| Diaspora İş Ağı | Yurtdışındaki Türk iş ağına ulaş. Doğrulanmış hizmet sağlayıcılar ve diaspora business directory ile fırsatları keşfet. |
| Şehir Rehberi | Berlin, Dortmund ve Köln başta olmak üzere Avrupa şehirlerinde expatlar için hazırlanmış yerel rehberler. |

**Yapılacaklar:**
- [ ] Her kategori kartına `<p>` açıklama metni ekle
- [ ] Stil uyumunu sağla (font, renk, spacing)

---

### FE-05 — Şehir Bazlı GEO Bölümü `[ORTA]`

**Dosya:** Ana sayfa şablonu — yeni section eklenecek

**Eklenecek:**
```html
<section id="sehirler" aria-label="Şehir bazlı diaspora toplulukları">
  <h2>Almanya'daki Türk Toplulukları</h2>
  <p>
    Berlin, Dortmund ve Köln'deki Türk topluluğu üyeleriyle bağlan. 
    Şehrindeki gurbetçi ağına katıl, yerel hizmetleri keşfet ve 
    yeni gelenlere rehberlik et.
  </p>
  <ul>
    <li><strong>Berlin Türk Topluluğu</strong> — 200.000+ Türk kökenli nüfus ile Avrupa'nın en büyük diaspora merkezlerinden biri.</li>
    <li><strong>Dortmund Türkler</strong> — Güçlü yerel ağlar ve işletme topluluğu.</li>
    <li><strong>Köln Türk Topluluğu</strong> — Aktif diaspora etkinlikleri ve danışman ağı.</li>
  </ul>
</section>
```

**Yapılacaklar:**
- [ ] Yukarıdaki section'ı ana sayfaya ekle (FAQ'nun üstü veya kategorilerin altı önerilir)
- [ ] Tasarımla uyumlu hale getir (mevcut section stilini kullan)
- [ ] İleride her şehir için ayrı alt sayfa (`/berlin`, `/dortmund`, `/koln`) oluşturulacak — anchor linkler şimdiden hazır olsun

---

### FE-06 — FAQ Genişletme `[ORTA]`

**Dosya:** FAQ component veya FAQ veri dosyası

**Mevcut durum:** FAQ mevcut ancak marka ve platform odaklı sorular eksik.

**Eklenecek sorular:**

- [ ] **S: CorteQS nedir?**  
  C: CorteQS, Avrupa'daki Türk diasporası için geliştirilmiş, şehir bazlı bir topluluk ve hizmet platformudur. Expat destek, relocation danışmanlığı ve diaspora iş ağı hizmetleri sunar.

- [ ] **S: CorteQS nasıl çalışır?**  
  C: Platforma ücretsiz kaydolarak şehrindeki doğrulanmış danışmanlara, yerel işletmelere ve diaspora topluluğuna erişim sağlarsın.

- [ ] **S: CorteQS üyelik ücretli mi?**  
  C: Temel üyelik ücretsizdir. Danışman ve işletme profilleri için ek planlar mevcuttur.

- [ ] **S: Almanya'ya taşınmak için ne yapmalıyım?**  
  C: CorteQS üzerinden relocation danışmanlarıyla bağlantı kurabilir, vize süreçleri ve konut bulma konularında destek alabilirsin.

- [ ] **S: Expat danışmanlık hizmeti nasıl alınır?**  
  C: Kategoriler bölümünden danışman profillerini incele ve doğrudan iletişime geç.

- [ ] **S: Doğrulanmış hizmet sağlayıcıları nasıl bulabilirim?**  
  C: Tüm danışman ve işletme profilleri CorteQS doğrulama sürecinden geçmektedir.

- [ ] **S: Hangi şehirlerde hizmet veriyorsunuz?**  
  C: Berlin, Dortmund, Köln ve diğer Avrupa şehirlerinde aktif topluluklarımız bulunmaktadır.

---

### FE-07 — Performans Optimizasyonları `[DÜŞÜK]`

**Dosya:** HTML head, CSS, görsel asset'ler

**Yapılacaklar:**
- [ ] Kritik olmayan JS dosyalarına `defer` attribute ekle:
  ```html
  <script src="analytics.js" defer></script>
  ```
- [ ] Font tanımlamalarına `font-display: swap` ekle:
  ```css
  @font-face {
    font-family: '...';
    font-display: swap;
  }
  ```
- [ ] Hero dışındaki görsellere `loading="lazy"` ekle:
  ```html
  <img src="..." alt="..." loading="lazy" />
  ```
- [ ] Görselleri WebP formatına dönüştür (mevcut PNG/JPG yerine)
- [ ] Google PageSpeed Insights ile Core Web Vitals ölçümü yap — LCP, CLS, FID sonuçlarını kaydet

---

## ⚙️ BACKEND DEĞİŞİKLİKLERİ

> `<head>` meta verileri, structured data / schema, server-side rendering ayarları ve link yönetiminde yapılacak değişiklikler.  
> Geliştirici: Backend / Full-stack ekibi

---

### BE-01 — Title Etiketi Güncelleme `[KRİTİK]`

**Dosya:** SSR head yöneticisi, `_document.tsx`, `layout.tsx` veya CMS SEO alanı

**Mevcut:**
```html
<title>CorteQS - Türk Diaspora Network Platformu | Diaspora Connect</title>
```

**Olması gereken:**
```html
<title>CorteQS | Türk Diaspora & Expat Network Platformu — Relocation, Danışman, Topluluk</title>
```

**Yapılacaklar:**
- [ ] Ana sayfa `<title>` etiketini yukarıdaki formata güncelle
- [ ] Karakter sayısını doğrula: 70 karakterin altında tutmaya çalış (Google'ın kesilme eşiği)

---

### BE-02 — Meta Description Güncelleme `[KRİTİK]`

**Dosya:** SSR head yöneticisi veya CMS SEO alanı

**Mevcut:**
```html
<meta name="description" 
  content="CorteQS Diaspora Connect: Türk diasporasını işletmeler, kuruluşlar ve bireylerle birleştiren global network platformu. Hemen ücretsiz kaydolun." />
```
*(143 karakter — ideal 155-160)*

**Olması gereken:**
```html
<meta name="description" 
  content="CorteQS Diaspora Connect: Türk diasporasını, expatları ve işletmeleri birleştiren global network. Relocation rehberi, güvenilir danışmanlar ve ücretsiz üyelik." />
```
*(157 karakter)*

**Yapılacaklar:**
- [ ] Meta description'ı güncelle
- [ ] Karakter sayısını 155-160 aralığında tut

---

### BE-03 — Schema Markup: SoftwareApplication `[YÜKSEK]`

**Dosya:** SSR head yöneticisi veya JSON-LD script bloğu

**Eklenecek (mevcut schema bloğuna ek olarak):**
```json
{
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "CorteQS Diaspora Connect",
  "operatingSystem": "Web",
  "applicationCategory": "NetworkingApplication",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "EUR"
  },
  "description": "Türk diasporasını, expatları ve yerel işletmeleri birleştiren şehir bazlı community platform.",
  "url": "https://corteqs.net"
}
```

**Yapılacaklar:**
- [ ] Yukarıdaki JSON-LD bloğunu `<head>` içine `<script type="application/ld+json">` olarak ekle
- [ ] [Google Rich Results Test](https://search.google.com/test/rich-results) ile doğrula

---

### BE-04 — Schema Markup: Organization sameAs ve areaServed `[YÜKSEK]`

**Dosya:** Mevcut Organization schema bloğu

**Mevcut Organization schema'sına eklenecek alanlar:**
```json
{
  "@type": "Organization",
  "name": "CorteQS",
  "url": "https://corteqs.net",
  "sameAs": [
    "https://www.linkedin.com/company/corteqs-global",
    "https://www.instagram.com/corteqssocial/",
    "https://x.com/corteqsx"
  ],
  "areaServed": [
    "Berlin", "Dortmund", "Köln", "Hamburg", "München",
    "Germany", "Europe"
  ]
}
```

**Yapılacaklar:**
- [ ] Mevcut Organization schema'sına `sameAs` alanını ekle
- [ ] `areaServed` alanını ekle
- [ ] Schema doğrulama testini çalıştır

---

### BE-05 — FAQ Schema Güncelleme `[ORTA]`

**Dosya:** Mevcut FAQPage schema bloğu

**Yapılacaklar:**
- [ ] FE-06'da eklenen 7 yeni FAQ sorusunu **FAQPage schema**'sına da ekle:
  ```json
  {
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "CorteQS nedir?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "CorteQS, Avrupa'daki Türk diasporası için geliştirilmiş, şehir bazlı bir topluluk ve hizmet platformudur."
        }
      },
      {
        "@type": "Question",
        "name": "CorteQS nasıl çalışır?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Platforma ücretsiz kaydolarak şehrindeki doğrulanmış danışmanlara, yerel işletmelere ve diaspora topluluğuna erişim sağlarsın."
        }
      }
      // ... diğer sorular
    ]
  }
  ```
- [ ] Tüm yeni soruların hem görünür HTML'de hem de schema'da tutarlı olduğunu doğrula

---

### BE-06 — Kırık Linklerin Düzeltilmesi `[YÜKSEK]`

**Mevcut durum:** 4 kırık link tespit edildi

**Yapılacaklar:**
- [ ] Tüm iç ve dış linkleri tara (Screaming Frog / Ahrefs / manuel)
- [ ] Her kırık link için:
  - Eğer sayfa taşındıysa → **301 redirect** ekle
  - Eğer sayfa kaldırıldıysa → linki HTML'den kaldır veya `rel="nofollow"` ekle
- [ ] **WhatsApp grup linkini** kontrol et (`https://chat.whatsapp.com/L3FeJVRpPIb75bQGG7M3oN`) — link geçerli mi, grup aktif mi?
- [ ] `#kategoriler` anchor linkinin sayfada karşılık gelen bir `id="kategoriler"` elementi olduğunu doğrula
- [ ] `mailto:info@corteqs.net` adresinin aktif ve doğru olduğunu doğrula

---

### BE-07 — Open Graph ve Twitter Card Meta Etiketleri `[ORTA]`

**Dosya:** SSR head yöneticisi

**Yapılacaklar:**
- [ ] OG etiketlerinin güncel title ve description ile eşleştiğini kontrol et:
  ```html
  <meta property="og:title" content="CorteQS | Türk Diaspora & Expat Network Platformu" />
  <meta property="og:description" content="Türk diasporasını, expatları ve işletmeleri birleştiren global network. Relocation rehberi ve güvenilir danışmanlar." />
  <meta property="og:url" content="https://corteqs.net" />
  <meta property="og:type" content="website" />
  ```
- [ ] Twitter Card etiketlerini de aynı şekilde güncelle:
  ```html
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="CorteQS | Türk Diaspora & Expat Network Platformu" />
  ```

---

### BE-08 — Hakkımızda Sayfası (Yeni Route) `[ORTA — GEO]`

**Yeni route:** `/hakkimizda` veya `/about`

**Yapılacaklar:**
- [ ] Yeni bir sayfa oluştur: `corteqs.net/hakkimizda`
- [ ] Sayfa içeriği Wikipedia stili, entity odaklı olmalı:
  - CorteQS nedir, ne zaman kuruldu, misyonu nedir
  - Hangi şehirlerde aktif
  - Hangi sorunları çözüyor
  - Ekip / kurucu bilgisi (varsa)
- [ ] Bu sayfaya ana sayfadan link ver
- [ ] `Organization` schema'sının `url` alanının bu sayfayı işaret ettiğini doğrula

> **Neden önemli:** ChatGPT, Perplexity ve Google AI Overview gibi AI sistemleri entity sayfalarını öncelikli olarak indexler. Bu sayfa GEO görünürlüğünü doğrudan artırır.

---

## ✅ Uygulama Öncelik Özeti

```
HEMEN YAP — Bu hafta:
  Frontend:
    ☐ FE-01: H1 etiketini düzelt
    ☐ FE-02: Hero görsel ALT etiketini ekle
  Backend:
    ☐ BE-01: Title güncelle
    ☐ BE-02: Meta description güncelle
    ☐ BE-06: 4 kırık linki düzelt

KISA VADE — 1-2 hafta:
  Frontend:
    ☐ FE-03: Hero açıklama paragrafı ekle
    ☐ FE-04: Kategori kartı açıklamaları
    ☐ FE-06: 7 yeni FAQ sorusu
  Backend:
    ☐ BE-03: SoftwareApplication schema ekle
    ☐ BE-04: Organization sameAs + areaServed ekle
    ☐ BE-05: FAQ schema güncelle
    ☐ BE-07: OG ve Twitter Card meta etiketleri

ORTA VADE — 1 ay:
  Frontend:
    ☐ FE-05: Şehir bazlı GEO bölümü
    ☐ FE-07: Performans optimizasyonları (defer, lazy load, WebP)
  Backend:
    ☐ BE-08: /hakkimizda sayfası (yeni route)
```

---

*Bu plan, Spindora SEO Analiz Raporu (Analiz ID: 717155a8, 20.04.2026) baz alınarak oluşturulmuştur.*  
*Önerilen tüm içerik değişiklikleri, site sahibi / yetkili editör tarafından onaylanmalıdır.*
