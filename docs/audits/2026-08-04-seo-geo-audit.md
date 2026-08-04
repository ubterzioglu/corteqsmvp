# SEO / GEO Denetimi — 2026-08-04

Kapsam: `corteqs.net` üretim yayını, `nginx.conf.template`, `src/lib/seo.ts`,
`src/lib/redirects.ts`, `scripts/generate-sitemap.mjs`, `public/llms.txt`,
`public/robots.txt` ve `index.html` JSON-LD bloğu.

Bu belge bir denetim raporudur: her madde **SORUN → KANIT → DÜZELTME** yapısındadır.
"Düzeltme" başlığı altında yazan şey uygulanmıştır; uygulanmayanlar açıkça
**"raporlandı, dokunulmadı"** ile işaretlenmiştir.

Ölçümlerin tamamı 2026-08-04 tarihinde bu depo üzerinde ve canlı yayına karşı
yapılmıştır. Tahmin yoktur; ölçülmeyen bir şey "ölçülmedi" olarak yazılmıştır.

---

## 0. Özet

| # | Bulgu | Şiddet | Durum |
|---|-------|--------|-------|
| 1 | Prod runtime yanılgısı → 301'ler ve www yönlendirmesi canlıda yok | P0 | Düzeltildi (konteyner doğrulaması yapılmadı) |
| 2 | Güvenlik başlıkları + CSP tüm HTML yanıtlarında düşüyor | P0 | Düzeltildi (konteyner doğrulaması yapılmadı) |
| 3 | Soft-404 indekslenmesi + sitemap drift'i | P0 | Düzeltildi |
| 4 | Canonical sızıntısı (query/hash + host) | P1 | Düzeltildi |
| 5 | Sitemap doğruluğu: auth arkası rota + eksik public rotalar | P1 | Düzeltildi (107 → 108 URL) |
| 6 | PostgREST 1000 satır sessiz kesmesi (sitemap fetcher'ları) | P1 | Düzeltildi |
| 7 | Anket `ends_at` filtre drift'i (SQL ↔ sitemap) | P1 | Düzeltildi |
| 8 | `llms.txt` ölü çapalar — GEO tarafı | P1 | Düzeltildi |
| 9 | JSON-LD kapsam / doğrulanamayan iddialar / geçersiz SearchAction | P2 | Raporlandı, dokunulmadı (B-1, B-2, B-3) |
| 10 | AI crawler politikası: tüm eğitim botlarına açık | Karar | Raporlandı, dokunulmadı (B-5) |

Doğrulama durumu: `npm run build` exit 0, `npm run verify:text` geçiyor,
`tsc -p tsconfig.app.json --noEmit` 103 → 98 hata. Konteyner (docker + curl)
doğrulaması **yapılmadı** — gerekçe §11'de.

---

## 1. P0 — Prod runtime yanılgısı: 301'ler ve www yönlendirmesi canlıda hiç yoktu

### SORUN

`CLAUDE.md`, `server.mjs`'i "Production Runtime" olarak tarif ediyordu. Bu yanlıştır.
Üretimde uygulama **nginx** tarafından servis edilir; `server.mjs` yalnızca
`npm run start` ve nixpacks yolunda çalışır.

Bu yanılgının doğrudan SEO sonucu: yönlendirme tablosu üç ayrı yerde, üçü de farklı
içerikle duruyordu ve **hiçbiri üretimde HTTP 301 üretmiyordu**.

| Katman | İçerik | Üretimde etkili mi |
|--------|--------|--------------------|
| `src/App.tsx` | 14 adet client-side `<Navigate>` | Evet ama HTTP 200 döner, 301 değil |
| `server.mjs` | `legacyRedirectMap`, yalnız 4 madde | Hayır — prod'da hiç çalışmıyor |
| nginx | — | Hiç yoktu |

Arama motoru açısından bu tablo şu anlama gelir: `/hakkimizda` ile `/founders`
iki ayrı, aynı içeriği dönen, kendi başına 200 veren URL'dir. Konsolidasyon sinyali
(301) bota hiç ulaşmaz; link değeri ve indeks bütçesi bölünür.

Aynı sebeple `www.corteqs.net` ve `mvp.corteqs.net` apex'e yönlenmiyordu.

### KANIT

Canlı yayına karşı ölçülen HTTP yanıtları:

```
Server: nginx/1.27.5                      # runtime nginx, server.mjs değil
GET https://corteqs.net/hakkimizda   → 200   # beklenen: 301 → /founders
GET https://www.corteqs.net/         → 200   # beklenen: 301 → https://corteqs.net/
```

Depo tarafındaki kanıt: `Dockerfile` içinde `FROM nginx:1.27-alpine` ve
`nginx.conf.template`'in `/etc/nginx/templates/default.conf.template` olarak
kopyalanması. `server.mjs` imajın çalışma yolunda değildir.

### DÜZELTME

1. Yeni **tek kaynak**: `src/lib/redirects.ts` — `LEGACY_REDIRECTS` (14 statik) +
   `DYNAMIC_LEGACY_REDIRECTS` (`/auth`, `/whatsapp-groups/:id`).
   `src/App.tsx` client-side route'larını artık bu tablodan üretir.
2. `nginx.conf.template`'e 15 adet tam eşleşmeli 301 + 1 regex 301 eklendi.
   Query string korunur (`$is_args$args`):

```nginx
location = /hakkimizda            { return 301 /founders$is_args$args; }
location = /blog                  { return 301 /radar/rehberler$is_args$args; }
location = /privacy-policy        { return 301 /legal/privacy$is_args$args; }
...
location ~ ^/whatsapp-groups/(.+)$ { return 301 /addcom?group=$1; }
```

3. `www.` / `mvp.` → apex için ayrı `server` bloğu (default `server_name _`
   bloğundan önce eşleşir):

```nginx
server {
  listen 80;
  server_name www.corteqs.net mvp.corteqs.net;
  return 301 https://corteqs.net$request_uri;
}
```

4. `server.mjs`'e "PROD RUNTIME DEĞİLDİR" başlık yorumu eklendi ve
   `legacyRedirectMap` 4 → 15 maddeye hizalandı (dev/nixpacks yolu için).
5. **Anti-drift kilidi:** `src/lib/redirects.test.ts` (10 test) `redirects.ts` ile
   `nginx.conf.template` metnini karşılaştırır; biri güncellenip diğeri unutulursa
   build kırılır.

Katman ayrımı bilinçlidir: nginx 301 gerçek SEO sinyalidir; App.tsx'teki
`<Navigate>` nginx'in devrede olmadığı yollarda (dev sunucu, nixpacks, client-side
gezinme) savunma katmanıdır. İkisi de kalmalıdır.

---

## 2. P0 — Güvenlik başlıkları ve CSP tüm HTML yanıtlarında düşüyordu

### SORUN

nginx'te `add_header` **kalıtılmaz**. Kendi `add_header`'ı olan bir `location`,
üst bloktaki *tüm* `add_header` direktiflerini iptal eder.

Zincir şuydu: `location /` → `try_files ... /index.html` → internal redirect
`location = /index.html`'e düşer → oradaki `Cache-Control` `add_header`'ı `server`
bloğundaki 8 güvenlik başlığını birden düşürür.

Sonuç: **tüm HTML sayfaları** — giriş ekranı ve admin paneli dahil — CSP'siz ve
clickjacking korumasız servis ediliyordu. Statik dosyalarda başlıklar görünüyordu,
bu da sorunu yüzeysel bir kontrolde görünmez kılıyordu.

### KANIT

```
GET https://corteqs.net/robots.txt  → 8 güvenlik başlığı VAR
GET https://corteqs.net/            → 0 güvenlik başlığı
```

Yani "başlıkları ekledik" iddiası `curl -I https://corteqs.net/robots.txt` ile
doğrulanıyor, uygulamanın kendisiyle doğrulanmıyordu.

### DÜZELTME

Güvenlik başlıkları kendi `add_header`'ı olan **5 location'da tek tek tekrarlandı**
(`= /env-config.js`, `= /index.html`, `= /api/chat`, `/assets/`,
`= /__prerender_internal`) — `server` bloğundaki tanımlara ek olarak. Bu tekrarlar
kopya değildir; nginx semantiği gereği zorunludur ve dosyada bu gerekçeyle
yorumlanmıştır.

CSP tek kaynağa alındı, böylece bir host'a izin verilirken beş ayrı yeri güncelleme
riski kalktı:

```nginx
map $host $corteqs_csp {
  default "default-src 'self'; base-uri 'self'; frame-ancestors 'none'; ...";
}
```

Değişken adı bilinçli olarak daraltıldı: nginx imajının
`20-envsubst-on-templates.sh` scripti template'i `envsubst`'tan geçirir; jenerik bir
ad (`$csp`) çakışma riski taşır.

CSP allowlist'i mevcut üçüncü taraflara açıldı: `googletagmanager`,
`analytics.ahrefs.com`, `clarity.ms`, `fonts.googleapis.com`, `fonts.gstatic.com`,
`google-analytics`, `c.bing.com`.

`script-src`'de **`'unsafe-inline'` yoktur ve eklenmemelidir.** `index.html`'deki iki
inline script (gtag config + Clarity yükleyicisi) bu yüzden yeni `public/analytics.js`
dosyasına taşındı ve `defer` ile yükleniyor. `style-src`'deki `'unsafe-inline'`
bilinçli bırakıldı: Tailwind/shadcn runtime'da inline style üretir, kaldırmak nonce
altyapısı gerektirir (bugün yok).

**SEO tarafındaki yan bulgu:** `X-Robots-Tag: index, follow` blanket header'ı
kaldırıldı. Sayfa seviyesinde `meta robots` zaten vardı; blanket header 404 kabuğunda
"beni indeksle" diyerek §3'teki `noindex` düzeltmesini gölgeleyecekti.

---

## 3. P0 — Soft-404 indekslenmesi ve sitemap drift'i

### SORUN

İki ayrı ama aynı kök nedene bağlı problem: **sunucu, hangi yolun gerçek sayfa
olduğunu bilmiyordu.**

1. **Soft-404:** SPA gerçek HTTP 404 döndüremez. Var olmayan her yol
   `200 + index.html` kabuğu olarak servis edilir. `index.html`'deki global
   `robots: index, follow` devrede kaldığı için, uydurma her URL indekslenebilir
   bir "sayfa" gibi görünüyordu. §2'de kaldırılan blanket `X-Robots-Tag` bunu
   ayrıca pekiştiriyordu.
2. **Sitemap drift'i:** `STATIC_ROUTES` listesi el ile bakımdaydı; auth arkasındaki
   bir rotanın listeye girmesini (veya orada kalmasını) engelleyen hiçbir denetim
   yoktu. Bkz. §5.

### KANIT

- `src/pages/NotFound.tsx` bileşeni `robots` meta'sına hiç dokunmuyordu; ayrıca her
  404'te konsola `console.error` basıyordu (gerçek hataları gölgeliyordu).
- Canlı `sitemap.xml`'de `/cadde` 107 URL içinde duruyordu — `RequireAuth` +
  `RequireFeature(caddeAccess)` arkasında olmasına rağmen (`src/App.tsx`).

### DÜZELTME

`NotFound.tsx` artık `useSeo` ile `robots: "noindex, follow"` yazar. `follow`
bilinçlidir: sayfadaki iç bağlantıların taranması sürsün. `applySeo`
`render-complete` event'ini dispatch ettiği için bu, prerender çıktısına da yansır.
Gereksiz `console.error` kaldırıldı.

Sitemap tarafında `scripts/generate-sitemap.test.mjs` (9 test) eklendi: `App.tsx`'i
parse edip `STATIC_ROUTES` içinde auth arkası rota veya redirect kaynağı olmadığını
doğrular.

Yeni testler: `src/App.notfound-seo.test.tsx` (4 test).

**Kalan:** gerçek HTTP 404 (soft-404'ün tam çözümü) uygulanmadı — sunucu tarafı route
bilgisi gerektirir. Backlog **B-4**.

---

## 4. P1 — Canonical sızıntısı: query, hash ve host

### SORUN

`src/lib/seo.ts` içindeki `resolveCanonical()`, `canonicalPath` verilmediğinde
`window.location.href` döndürüyordu. İki ayrı sızıntı:

1. **Query + hash canonical'a giriyordu.** `/directory?city=Berlin&page=2` gibi her
   filtre kombinasyonu kendini "canonical" ilan ediyordu. Filtreli bir dizin
   sayfasında bu, sonsuz sayıda kendi kendini canonical'layan yinelenen URL demektir —
   crawl bütçesi tüketen klasik desen.
2. **Canonical host mevcut host'tan geliyordu.** `www.`, `mvp.` veya `localhost`
   üzerinden açılan bir sayfa kendi host'unu canonical yazıyordu; "tek canonical host"
   kuralı bozuluyordu. §1'deki eksik www→apex 301'i ile birleşince sinyal iki katına
   bölünüyordu.

### KANIT

Düzeltme öncesi kod yolu: `canonicalPath` yoksa → `window.location.href` → tam URL
(scheme + host + path + query + hash) canonical'a yazılıyordu.

### DÜZELTME

Sabit origin + yalnız pathname; ayrıca kök dışı yollarda sondaki slash atılıyor
(`/blog/` ve `/blog` aynı canonical'a çıksın):

```ts
return `${SEO_CANONICAL_ORIGIN}${normalizePath(window.location.pathname)}`;
```

`src/lib/seo.test.ts` eklendi (17 test) — bu helper'ın **ilk** testleridir.

---

## 5. P1 — Sitemap doğruluğu: 107 → 108 URL

### SORUN

`STATIC_ROUTES` iki yönde de hatalıydı: auth arkasında bir rota içeriyordu ve
gerçekten public olan iki sayfayı içermiyordu.

### KANIT

Canlı `sitemap.xml`: 107 URL, içinde `/cadde` var. `src/App.tsx`'te `/cadde`
`RequireAuth` + `RequireFeature(caddeAccess)` ile sarılıdır — girişsiz bot login'e
yönlenir, dolayısıyla GSC'de "Crawled - currently not indexed" üretir ve crawl
bütçesini gerçek içerikten çalar.

Dosyada zaten `/tools/:slug` için yazılmış aynı gerekçeli bir not vardı; kural
yazılmış ama `/cadde`'ye uygulanmamıştı.

### DÜZELTME

`/cadde` çıkarıldı. Eksik public rota taraması yapıldı; **6 aday** üç kritere karşı
denetlendi:

| Aday rota | (a) public | (b) `useSeo` + `canonicalPath` | (c) thin content değil | Sonuç |
|-----------|-----------|-------------------------------|------------------------|-------|
| `/campaign/vlogger` | evet | evet | evet | **Eklendi** |
| `/campaign/blogger` | evet | evet | evet | **Eklendi** |
| `/19051919/harita` | evet | evet | hayır — tek dış link butonu | Reddedildi |
| `/190519memory` | evet | evet | hayır — gönderim formu | Reddedildi |
| `/190519idea` | evet | hayır | — | Reddedildi |
| `/addcom` | evet | hayır | — | Reddedildi |

Reddetme gerekçesi tektir: üç kriteri birden geçmeyen bir rota sitemap'e girince
Google onu düşük değerli görür, "Crawled - currently not indexed" durumuna düşürür ve
crawl bütçesini asıl indekslenmesini istediğiniz sayfalardan çalar. Sitemap bir
"tüm rotalar" dizini değil, **indekslenmesini talep ettiğiniz** sayfalar listesidir.

**Ölçülen sonuç:** 107 → 108 URL. Çıkan: `/cadde`. Eklenen: `/campaign/vlogger`,
`/campaign/blogger`.

Kriterler artık `scripts/generate-sitemap.mjs` başında yazılıdır ve (a) şıkkı
`scripts/generate-sitemap.test.mjs` tarafından otomatik denetlenir.

---

## 6. P1 — PostgREST 1000 satır sessiz kesmesi

### SORUN

PostgREST varsayılan olarak en fazla 1000 satır döner ve **bunu sessizce yapar** —
hata vermez, eksik listeyi normal bir yanıt gibi gönderir. Sitemap'in 5 dinamik
fetcher'ı tek istekle çekiyordu; tablolar 1000 satırı geçtiğinde sitemap sessizce
eksilecekti ve hiçbir uyarı çıkmayacaktı.

### KANIT

Bu tuzak aynı projede daha önce yaşandı: `v_command_center_facets` üzerinde
"son WhatsApp kaydı 6 Temmuz" yanılgısı (2026-08-04), kök neden 1000 satır kesmesiydi.

Sitemap tarafında etkilenen 5 fetcher: `blog_posts`, `surveys`, `marquee_items`,
`catalog_items`, `independent_profiles`.

### DÜZELTME

Ortak `fetchAllRows()` helper'ı: `Range` başlığıyla 1000'lik sayfalar hâlinde tabloyu
sonuna kadar okur, son sayfayı `batch.length < PAGE_SIZE` ile tespit eder, hata veya
timeout durumunda `null` döner ve build'i **asla** kırmaz (mevcut `sitemap.xml`
korunur).

```js
Range: `${offset}-${offset + PAGE_SIZE - 1}`,
```

Sayfalama devreye girdiğinde build log'una satır sayısı basılır — sessiz kalmaz.

---

## 7. P1 — Anket `ends_at` filtre drift'i

### SORUN

Aynı iş kuralı iki yerde farklı uygulanıyordu:

| Kaynak | `status=published` | `starts_at` penceresi | `ends_at` penceresi |
|--------|--------------------|-----------------------|---------------------|
| `src/lib/surveys.ts` | evet | evet | **evet** |
| `scripts/generate-sitemap.mjs` | evet | evet | **hayır** |

Sonuç: süresi dolmuş anketler sitemap'te kalıyordu. Arama sonucundan tıklayan
kullanıcı kapalı bir ankete düşüyordu — hem kötü kullanıcı sinyali hem de
indekslenmemesi gereken URL'ler.

### KANIT

Sitemap fetcher'ı yalnız `starts_at` koşulunu uyguluyordu; `src/lib/surveys.ts`
`getPublishedSurveys()` ise iki pencereyi de uyguluyordu.

### DÜZELTME

İki ayrı `or` parametresi `append` edilerek eklendi — PostgREST bunları AND'ler
(supabase-js'te zincirlenmiş `.or()` ile aynı davranış):

```js
params.append("or", `(starts_at.is.null,starts_at.lte.${nowIso})`);
params.append("or", `(ends_at.is.null,ends_at.gte.${nowIso})`);
```

`append` zorunludur: `URLSearchParams` constructor'ına aynı anahtar iki kez
verilemez, ikincisi birinciyi ezer. Bu, sessizce yanlış sonuç üreten bir tuzaktır.

---

## 8. P1 — GEO: `llms.txt` ölü çapa temizliği

### SORUN

`public/llms.txt`, answer engine'lere (ChatGPT, Perplexity, Claude vb.) sunulan
**tek yapılandırılmış içerik haritasıdır**. Dosyadaki 7 çapanın **hepsi ölüydü**:

```
#hakkinda  #sss  #kategoriler  #ilgi  #destek  #elci  #blogger
```

Bu çapalar eski `Index` sayfasına aitti. `Index` bugün `/landingtrial` adresindedir
ve `noindex`'tir. Ana sayfa artık `LandingTrialPage`'dir.

GEO açısından etkisi doğrudandır: bir answer engine `llms.txt`'teki bağlantıyı
izleyip hedefte hiçbir şey bulamazsa, o iddiayı atıfsız bırakır veya tamamen atar.
Ölü çapa = kaybedilmiş atıf fırsatı.

### KANIT

Ana sayfa DOM'unda ölçülen id'ler yalnızca şunlardır:

```
id="main"
id="landingtrial-atlas"
```

Yani `llms.txt`'te listelenen 7 çapanın hiçbirinin karşılığı yoktur.

Ek bulgu: `https://corteqs.net/blog` bir **redirect**'ti (§1'de artık 301). Bir
GEO haritasının içinde redirect'e işaret eden bağlantı bulundurması gereksiz bir
sıçrama ekler.

### DÜZELTME

1. Ölü çapalar gerçek sayfalara yönlendirildi:
   - şehir elçisi → `/commercial/ambassador`
   - blogger → `/campaign/blogger`
   - destekçi → `/founding-1000`
   - kategoriler → `/directory`
2. `/blog` bağlantısı doğrudan hedefe (`/radar/rehberler`) çevrildi.
3. Eksik public rotalar eklendi: `/radar`, `/anket`, `/commercial`, `/lansman`,
   `/campaign`, `/campaign/vlogger`, `/legal/*` (7 sayfa), `/kurulus/<slug>`,
   `/iletisim`.
4. Tüm URL'ler `src/App.tsx` route tablosuna karşı doğrulandı: hepsi geçerli,
   **hiçbiri redirect değil**.

**Dokunulmadı (ürün kararı, §9 ile aynı gerekçe):** dosyadaki "164 ülkede 8,8 milyon",
"2026'da Istanbul merkezli", "$1.000 / $10.000 kurucu katkısı" iddiaları.

---

## 9. P2 — JSON-LD bulguları: raporlandı, dokunulmadı

`index.html` içindeki `@graph` bloğu her rotada miras alınır. Aşağıdaki üç madde
kullanıcı kararıyla **değiştirilmedi**; burada yalnızca kaydedilmiştir.

### B-1 — JSON-LD kapsamı

**SORUN.** Ana sayfa `@graph`'ı tüm SPA rotalarına taşınır. İçinde:

- **12 soruluk `FAQPage`** — sayfada gerçekten FAQ içeriği var, ancak çapası yok
  (§8'deki `#sss` ölü çapası bunun kanıtı). Yapılandırılmış veri ile görünür içerik
  arasındaki bağ zayıf.
- **`Offer`** (99 EUR) — fiyatlandırma sayfası dışındaki her rotada da geçerli
  görünür.
- **Sabit `"dateModified": "2026-07-06"`** — elle güncellenen bir alan; her yayında
  bayatlar.
- **`BreadcrumbList`** — tek elemanlı ("Ana Sayfa") ve tüm rotalarda aynı kalır;
  `/legal/kvkk` gibi derin bir sayfada bile breadcrumb "Ana Sayfa" der.

**KANIT.** `index.html`: satır 128 `dateModified`, satır 140 `BreadcrumbList`,
satır 152 `FAQPage`, satır 274 ve 310 `Offer`.

**DÜZELTME.** Raporlandı, dokunulmadı. Doğru çözüm per-rota JSON-LD'dir
(`useSeo({ jsonLd })` altyapısı zaten mevcut ve unmount'ta temizlik yapıyor), ancak
bu bir ürün/içerik kararıdır.

### B-2 — Doğrulanamayan iddialar

**SORUN.** Yapılandırılmış veride doğrulanamayan ölçüler ve kurumsal bilgiler var:
"164 ülkede 8,8 milyon", `"foundingDate": "2026"`, `foundingLocation` = Istanbul,
iki kurucu `Person` kaydı (Qualtron Sinclair, Akcakanat-Terzioglu).

**KANIT.** `index.html` satır 67 (`foundingDate`), 68 (`foundingLocation`),
284 ve 293 (`Person`). Aynı iddialar `public/llms.txt` satır 3 ve 5'te tekrarlanır.

**DÜZELTME.** Raporlandı, dokunulmadı. Bunlar doğruluk/ürün kararıdır, mühendislik
kararı değildir. Not: yapılandırılmış veride yanlış kurumsal bilgi manuel yaptırım
riski taşır ve answer engine'ler tarafından atıfla birlikte yayılır.

### B-3 — Geçersiz `SearchAction`, serbest `SpeakableSpecification`, `meta keywords`

**SORUN.**

- `SearchAction.target` kendi site içi aramanıza değil, Google'ın kendisine işaret
  ediyor. Bu, `SearchAction`'ın tanımına aykırıdır (hedef, sitenizin arama sonuç
  URL'si olmalıdır) ve pratikte hiçbir şey yapmaz:

```json
"target": "https://www.google.com/search?q=site:corteqs.net+{search_term_string}"
```

- `SpeakableSpecification` serbestçe kullanılmış; Google bu tipi haber içeriğiyle
  sınırlı ve davetli yayıncılara açık tutar.
- `meta keywords` (satır 12) hiçbir büyük arama motoru tarafından kullanılmaz.
  Zararsızdır ama bakımı bedava değildir.

**KANIT.** `index.html` satır 12 (`keywords`), 109-111 (`SearchAction`).

**DÜZELTME.** Raporlandı, dokunulmadı.

---

## 10. AI crawler politikası (B-5) — karar bekliyor

### SORUN

`public/robots.txt` şu anda **tüm** AI botlarına — hem atıf veren tarayıcılara hem de
saf eğitim tarayıcılarına — tam erişim veriyor. İkisi farklı işlerdir:

| Grup | Örnek | Karşılığında ne alırsınız |
|------|-------|---------------------------|
| Atıf veren (answer/browsing) | `OAI-SearchBot`, `PerplexityBot`, `Claude-User`, `ChatGPT-User` | Yanıtlarda kaynak gösterimi ve trafik |
| Saf eğitim | `GPTBot`, `CCBot`, `Google-Extended`, `Bytespider`, `Applebot-Extended`, `Amazonbot`, `cohere-ai`, `Meta-ExternalAgent` | Doğrudan karşılık yok |

Dosya bu ayrımı yorum satırlarında yapıyor ("Browsing / answer bots" vs
"Training / index crawlers") ama davranış olarak ikisine de aynı erişimi veriyor.

### KANIT

`public/robots.txt`: 16 ayrı `User-agent` bloğunun tamamı `Allow: /` +
`Disallow: /admin`. Tek engellenen yol `/admin`'dir.

### DÜZELTME

Raporlandı, dokunulmadı — bu bir ürün/strateji kararıdır, teknik hata değildir.
Karar verilirse değiştirilecek tek dosya `public/robots.txt`'tir.

İlgili risk (B-11, bu denetimin kapsamı dışında ama aynı dosyadan doğuyor):
`public/burak-stripe-rehberi.html` git'te izleniyor ve
`https://corteqs.net/burak-stripe-rehberi.html` adresinde herkese açık servis
ediliyor; `robots.txt` yalnız `/admin`'i engellediği için taranabilir durumda.

---

## 11. Doğrulama durumu — dürüst kayıt

### Yapılan doğrulamalar

| Kontrol | Sonuç |
|---------|-------|
| `npm run build` | exit 0 |
| `npm run verify:text` | geçiyor (1307 dosya UTF-8) |
| `tsc -p tsconfig.app.json --noEmit` | 103 → 98 hata |
| `src/lib/redirects.test.ts` | 10 test |
| `src/lib/seo.test.ts` | 17 test |
| `src/App.notfound-seo.test.tsx` | 4 test |
| `scripts/generate-sitemap.test.mjs` | 9 test |
| Sitemap URL sayısı | 107 → 108 (ölçüldü) |

### YAPILMAYAN doğrulama

§1 ve §2'nin plandaki kabul kriteri **"docker build + curl ile başlık/301 kontrolü"**
idi. Rancher Desktop kapalı olduğu için docker daemon'a bağlanılamadı →
**konteyner doğrulaması yapılmadı.**

Yerine `src/lib/redirects.test.ts` `nginx.conf.template` dosyasının **metnini**
denetler: location'lar, 301 hedefleri, CSP tekrar sayısı, `'unsafe-inline'` yokluğu,
`X-Robots-Tag`'in geri gelmemiş olması. Bu gerçek bir doğrulamadır ancak **çalışan
nginx'in davranışını kanıtlamaz.**

### Deploy sonrası ZORUNLU kontrol listesi

```bash
# 1. Güvenlik başlıkları artık HTML'de de var mı?
curl -sI https://corteqs.net/ | grep -Ei 'content-security-policy|x-frame-options'

# 2. 301'ler gerçekten dönüyor mu?
curl -sI https://corteqs.net/hakkimizda   | head -1   # beklenen: 301
curl -sI https://corteqs.net/privacy-policy | head -1  # beklenen: 301

# 3. www → apex
curl -sI https://www.corteqs.net/ | head -1           # beklenen: 301

# 4. X-Robots-Tag geri gelmemiş olmalı
curl -sI https://corteqs.net/ | grep -i x-robots-tag  # beklenen: boş çıktı
```

**Ek olarak:** deploy sonrası tarayıcı konsolunda **CSP ihlali kontrolü zorunludur.**
`script-src`'de `'unsafe-inline'` bulunmadığı için, gözden kaçmış bir inline script
veya allowlist dışı bir üçüncü taraf host'u sessizce değil, konsolda görünür şekilde
bloklanacaktır. Analytics (gtag, Clarity, Ahrefs) ve Supabase çağrılarının çalıştığı
tek tek doğrulanmalıdır.

---

## 12. Bu denetimden çıkan backlog kalemleri

| Kod | Kalem | Neden ertelendi |
|-----|-------|-----------------|
| B-1 | JSON-LD kapsamı (FAQPage çapası, Offer, sabit dateModified, BreadcrumbList) | Ürün/içerik kararı |
| B-2 | Doğrulanamayan iddialar (164 ülke / 8,8 milyon, foundingDate, Person kayıtları) | Doğruluk kararı |
| B-3 | Geçersiz SearchAction, serbest Speakable, meta keywords | Düşük etki |
| B-4 | Gerçek HTTP 404 (soft-404'ün tam çözümü) | Sunucu tarafı route bilgisi gerekir |
| B-5 | AI crawler politikası (eğitim botları) | Strateji kararı |
| B-11 | `public/burak-stripe-rehberi.html` herkese açık servis ediliyor | Karar bekliyor |

---

*Rapor tarihi: 2026-08-04. Ölçümler bu tarihte, değişiklikler uygulandıktan sonra
alınmıştır. §11'de belirtilen konteyner doğrulaması yapılmamıştır.*
