# CorteQS MVP — Clean Code, SEO/GEO, Performans ve Dokümantasyon Modernizasyonu

> **Durum:** onaylandı, uygulama başlamadı · **Tarih:** 2026-08-04 · **Branch:** `main`
> Bulgular kod okuması **+ canlı `https://corteqs.net` üzerinde curl doğrulaması** ile tespit edildi.

## Context

Bu çalışma, `corteqs_fin` deposunda **davranış bozmadan** ölçülebilir teknik iyileştirme yapmak için
istendi. Plan aşamasında hiçbir dosya değiştirilmedi.

Keşif sırasında, dokümantasyonda hiç geçmeyen **üç P0 sınıfı gerçek sorun** ortaya çıktı. Bunlar bu
planın omurgasıdır:

1. **Prod runtime nginx, `server.mjs` değil.** Canlı yanıt `Server: nginx/1.27.5`. `Dockerfile`
   nginx imajı kurup `nginx.conf.template` kullanıyor; `server.mjs` yalnızca `nixpacks.toml`
   yolunda çalışır ve prod'da devrede değil. Sonuç: `server.mjs`'teki **legacy 301 haritası,
   www→apex yönlendirmesi, `/api/chat` rate-limit'i ve `/admin` prerender istisnası prod'da yok.**
   Canlı kanıt: `/hakkimizda` → **200** (301 değil), `https://www.corteqs.net/` → **200** (apex'e
   301 değil). CLAUDE.md `server.mjs`'i "production runtime" diye tarif ediyor — yanlış.

2. **HTML sayfalarında tüm güvenlik başlıkları sessizce kayboluyor.** Klasik nginx `add_header`
   kalıtım tuzağı: server bloğundaki `add_header`'lar, kendi `add_header`'ı olan bir `location`
   tarafından iptal edilir. `location /` → `try_files … /index.html` → `location = /index.html`
   (kendi `Cache-Control` `add_header`'ı var) → **server seviyesindeki CSP / HSTS /
   X-Frame-Options / nosniff / Referrer-Policy / Permissions-Policy / COOP / CORP düşer.**
   Canlı kanıt: `/robots.txt` → 8 güvenlik başlığı **var**; `/` → **0** güvenlik başlığı.
   Yani tüm uygulama (login ve admin dahil) **CSP'siz ve clickjacking korumasız** servis ediliyor.
   Ters yönü kritik: başlıklar olduğu gibi geri gelirse mevcut CSP (`script-src 'self'`)
   Google Fonts + GA + Ahrefs + Clarity + index.html'deki iki inline script'i **bloklar.**
   Bu yüzden CSP allowlist'i **aynı değişiklikte** düzeltilmeli.

3. **Soft 404 + sitemap/route drift.** Olmayan rota (`/bu-sayfa-yok-12345`) → **200** + SPA kabuğu,
   ve `NotFound.tsx` hiçbir SEO/robots meta'sı set etmiyor → index.html'in global
   `robots: index, follow` değeri geçerli kalıyor. Ayrıca canlı `sitemap.xml` (107 URL) içinde
   `/cadde` var; oysa `/cadde` `RequireAuth` + `RequireFeature` arkasında
   ([App.tsx:196-205](../../src/App.tsx#L196-L205)) — script kendi yorumunda (satır 309-312) bu
   kuralı `/tools/:slug` için uyguladığını yazıyor ama `/cadde`'yi atlamış.

**Kullanıcı kararları (onaylandı):** güvenlik başlıkları geri getirilecek + CSP mevcut üçüncü
taraflara açılacak · nginx tek kaynak yapılıp eksik davranışlar porta edilecek ·
**`index.html` JSON-LD'sine dokunulmayacak, yalnızca raporlanacak.**

**Amaç:** P0/P1'leri küçük, doğrulanabilir batch'lerle kapatmak; geri kalanı uygulanabilir backlog'a
çevirmek. **Commit / push / PR / deploy / canlı DB yazımı YOK.**

---

## Doğrulanmış baseline (keşif çıktısı)

| Ölçüm | Gerçek | CLAUDE.md iddiası |
|---|---|---|
| `src` altında .ts/.tsx | 990 | — |
| pages / components / lib | 214 / 429 / 275 | 150 / 269 / 81 (**bayat**) |
| test dosyası | 183 (+5 Playwright spec) | — |
| migration | **352**, hepsi `supabase/migrations/applied/` (kökte 0 `.sql`) | 221 (**bayat**) |
| Edge Function | **7** (`find-matches`, `lansman-admin`, `radar-news-scan`, `relocation-notifications`, `send-notification-emails`, `send-submission-email`, `submit-survey-response`) | 5, ve olmayan `chat-register` sayılıyor (**yanlış**) |
| kök `.md` | 5 (+ `rapor.html`; `SONDURUM.md` dahil) | "kökte yalnız 4 doküman" (**yanlış**) |
| `App.tsx` | 285 satır, 51 `lazy()` | ~300 satır, ~75 lazy (**yaklaşık**) |
| `AdminLayout.tsx` | **6 satır** (barrel) | "741 satır, bölünmeli" (**bayat**) |
| `@/contexts/AuthContext` importu | 26 dosya | ~39 (**bayat**) |
| `supabase/types.ts` | güncel (`cadde_posts`, `revision_request*` var) | "out of sync, ~164 tsc hatası" (**bayat**) |
| `src/lib/supabase.ts` | yok ✅ | yok ✅ |
| `as any` | 92 | ~103 (yakın) |
| `console.log` (src) | **0** ✅ | — |
| >300 satır dosya | 112 | — |

Hassas dosyalar (`.env`, `.env.local`, `.secretdb`, `walast.txt`) **git'te izlenmiyor** ve
`.gitignore` kapsıyor ✅ — sızıntı yok.

---

## Uygulama planı

### Faz A — Baseline ölçümü (kod değişikliği yok)

`npm run lint`, `npm run test`, `npx tsc -p tsconfig.app.json --noEmit`, `npm run build` çalıştırılıp
**exit code / hata sayısı / bundle boyutu** kaydedilir. Bu, "yeni hata mı, mevcut hata mı" ayrımının
tek dayanağıdır. Faz F'de birebir tekrar edilir.

> Beklenti: `tsc --noEmit` **hata verecek** — aşağıdaki iki ölü dosya yüzünden (Batch 5).

---

### Batch 1 — P0: nginx güvenlik başlıkları + CSP allowlist

**Dosyalar:** [nginx.conf.template](../../nginx.conf.template), [index.html](../../index.html)

1. `nginx.conf.template`'te güvenlik başlıklarını **kendi `add_header`'ı olan her `location`
   bloğunda tekrarla**: `= /env-config.js`, `= /index.html`, `/assets/`, `= /api/chat`,
   `= /__prerender_internal`. (nginx `add_header` kalıtımı böyle çalışır; ek dosya `include`
   etmek Dockerfile değişikliği gerektirir — gereksiz risk.) Tekrarın nedenini yorum satırıyla
   yaz, yoksa bir sonraki geliştirici "kopya" sanıp siler.
2. **CSP allowlist'ini genişlet** — mevcut üçüncü taraflar çalışmaya devam etsin:
   - `script-src`: `'self'` + `https://www.googletagmanager.com` + `https://analytics.ahrefs.com`
     + `https://www.clarity.ms https://*.clarity.ms`
   - `style-src`: `+ https://fonts.googleapis.com` · `font-src`: `+ https://fonts.gstatic.com`
   - `connect-src`: `+ https://*.google-analytics.com https://*.analytics.google.com
     https://*.googletagmanager.com https://analytics.ahrefs.com https://*.clarity.ms`
   - `img-src`: `+ https://*.google-analytics.com https://*.googletagmanager.com
     https://*.clarity.ms https://c.bing.com`
3. **`'unsafe-inline'` EKLEME.** Bunun yerine `index.html`'deki iki inline script bloğunu
   (gtag config — satır 27-32; Clarity loader — satır 55-61) tek bir self-hosted
   `public/analytics.js` dosyasına taşı ve `<script src="/analytics.js" defer>` ile yükle.
   Böylece `script-src` inline'sız kalır. JSON-LD bloğu yerinde bırakılır
   (`application/ld+json` çalıştırılabilir kod değil) ve davranış deploy sonrası konsoldan
   doğrulanır.
4. **`X-Robots-Tag: index, follow`'u HTML location'ından çıkar.** Sayfa seviyesinde `meta robots`
   zaten var; blanket header gereksiz ve 404 kabuğunda yanıltıcı. Statik dosyalarda da anlamsız.

**Kabul kriteri:** `docker build` sonrası lokal konteynerde `curl -D -` ile `/`, `/robots.txt`,
`/assets/*.js` üçünde de CSP + HSTS + X-Frame-Options + nosniff dönmeli; tarayıcı konsolunda
**hiç CSP ihlali olmamalı** (fontlar yüklenmeli, GA/Clarity/Ahrefs istek atmalı).

> ⚠️ Deploy sonrası tarayıcı konsolu kontrolü **zorunlu**. İstenirse CSP önce
> `Content-Security-Policy-Report-Only` olarak bir tur gözlemlenebilir — karar deploy anında.

---

### Batch 2 — P0/P1: nginx'i tek runtime kaynağı yap

**Dosyalar:** [nginx.conf.template](../../nginx.conf.template), yeni `src/lib/redirects.ts`,
[server.mjs](../../server.mjs), yeni test

Yönlendirme listesi bugün **üç yerde ayrı ayrı** duruyor: `App.tsx` (`<Navigate>`),
`server.mjs` (`legacyRedirectMap`, prod'da ölü), nginx (hiç yok). Kalıcı çözüm tek bir tablo:

1. Yeni `src/lib/redirects.ts` → `LEGACY_REDIRECTS: ReadonlyArray<{ from: string; to: string }>`.
   `App.tsx`'teki mevcut `<Navigate>` rotaları bu tablodan üretilir (davranış aynı kalır;
   client-side yönlendirme **kaldırılmaz**, savunma katmanı olarak durur).
2. `nginx.conf.template`'e her madde için `return 301` ekle, **query string korunarak**
   (`return 301 /hedef$is_args$args;`). Kapsam — App.tsx'te bugün yalnız client-side olanlar:
   `/hakkimizda`, `/blog`, `/campaign/founding-1000`, `/addwa`, `/whatsapp-groups`,
   `/whatsapp-groups/:id` (regex → `/addcom?group=$1`), `/privacy-policy`, `/190519`,
   `/contributor`, `/influencer-partner`, `/strategic-partner`, `/community-leader`,
   `/ambassador`, `/aiform`, `/form`, `/auth`.
3. **www./mvp. → apex 301** ekle (`server_name` ayrımı + `return 301 https://corteqs.net$request_uri`).
4. **Prerender'dan `/admin` ve `/api` hariç tut** — `server.mjs` yapıyor, nginx yapmıyor.
5. `/api/chat` için `limit_req_zone` ile rate-limit (server.mjs'teki 12 istek/dk ile hizalı).
6. `server.mjs`'in başına net bir yorum: **"Yerel/geliştirme sunucusu. Prod runtime nginx'tir
   (Dockerfile). SEO davranışını buraya değil `nginx.conf.template`'e ekle."**
   Silme — `nixpacks.toml` ve `npm run start` hâlâ kullanıyor.
7. **Anti-drift testi:** `redirects.ts` içindeki her `from` için `nginx.conf.template` metninde
   karşılık gelen bir `return 301` bulunduğunu doğrulayan test. Ayrıca redirect hedeflerinin
   kendisinin redirect olmadığını (zincir yok) ve döngü olmadığını kontrol et.

**Kabul kriteri:** test yeşil; lokal nginx konteynerinde `/hakkimizda` → 301 `/founders`,
`/blog?utm=x` → 301 `/radar/rehberler?utm=x`, www host → 301 apex.

---

### Batch 3 — P1: SEO helper doğruluğu + 404 noindex

**Dosyalar:** [src/lib/seo.ts](../../src/lib/seo.ts),
[src/pages/NotFound.tsx](../../src/pages/NotFound.tsx),
yeni `src/lib/seo.test.ts`, yeni `src/App.notfound-seo.test.tsx`

1. **Canonical query/hash sızıntısı.** [seo.ts:46](../../src/lib/seo.ts#L46) `canonicalPath`
   verilmezse `window.location.href` döndürüyor → `?city=Berlin&page=2` gibi filtre
   kombinasyonları self-canonical oluyor **ve** canonical host yerine mevcut host
   (www./mvp./localhost) yazılıyor.
   Düzeltme: `SEO_CANONICAL_ORIGIN + window.location.pathname` (query + hash atılır, host sabitlenir).
2. **404 noindex.** `NotFound.tsx` `useSeo({ title: …, robots: "noindex, follow" }, [])` çağırsın.
   SPA gerçek HTTP 404 dönemez (backlog B-4), ama `noindex` soft-404 indekslenmesini durdurur ve
   prerender çıktısına da yansır. Mevcut `console.error` yerine sessiz davranış.
3. **`seo.test.ts` yaz** (bugün SEO helper'ın **hiç testi yok**): canonical normalizasyonu
   (query/hash atılıyor mu, host zorlanıyor mu, trailing-slash tutarlılığı), `robots` override +
   cleanup'ta geri yükleme, JSON-LD ekleme/temizleme (`data-seo-jsonld` node'ları birikmemeli),
   `render-complete` event'inin dispatch edildiği, iki ardışık `applySeo`'nun meta biriktirmediği.

**Not (P2, backlog):** `applySeo` `render-complete`'i **mount anında** dispatch ediyor; async veri
yüklenen dinamik sayfalarda (`BlogPostPage`, `DiasporaDetailPage`, `CommercialDocumentPage`,
`IndependentProfilePage`) prerender iskeleti yakalayabilir. Davranış Faz D pilotunda ölçülüp
düzeltilir.

---

### Batch 4 — P1: sitemap doğruluğu ve drift koruması

**Dosyalar:** [scripts/generate-sitemap.mjs](../../scripts/generate-sitemap.mjs), yeni
`scripts/generate-sitemap.test.mjs`

1. **`/cadde`'yi `STATIC_ROUTES`'tan çıkar**
   ([generate-sitemap.mjs:51](../../scripts/generate-sitemap.mjs#L51)) — `RequireAuth` +
   `RequireFeature(caddeAccess)` arkasında. Neden'i yorumla (script'te `/tools/:slug` için aynı
   gerekçe zaten yazılı).
2. **PostgREST 1000 satır kesmesi.** Beş dinamik fetcher (`blog_posts`, `surveys`,
   `marquee_items`, `catalog_items`, `independent_profiles`) sayfalama yapmıyor; 1000'i aşan
   tabloda sitemap **sessizce eksik** üretilir. Bu tuzak bu projede daha önce yaşandı
   (`v_command_center_facets`, 2026-08-04). Ortak `fetchAllRows(endpoint, headers)` helper'ı ile
   `Range` başlıklı sayfalama ekle; kaç satır çekildiğini logla.
3. **Anket filtresi drift'i — doğrulandı, hatalı olan taraf sitemap.**
   [surveys.ts:24-25](../../src/lib/surveys.ts#L24-L25) hem `starts_at` hem `ends_at` penceresini
   uyguluyor; sitemap yalnız `starts_at`'i uyguluyor → **süresi dolmuş anketler sitemap'te
   kalıyor.** Düzeltme: `params.append("or", "(ends_at.is.null,ends_at.gte.<now>)")` — iki ayrı
   `or` parametresi PostgREST tarafında AND'lenir (supabase-js zincirlenmiş `.or()` ile aynı
   davranış). `URLSearchParams` constructor'ı tekrar eden anahtarı yutar, `append` kullan.
4. **Eksik public rota denetimi:** `/campaign/vlogger`, `/campaign/blogger`, `/19051919/harita`,
   `/190519idea`, `/190519memory`, `/addcom` sitemap'te yok. Her biri için önce
   (a) gerçekten public mi, (b) `useSeo` ile `canonicalPath` set ediyor mu, (c) thin content mi —
   doğrula; **yalnız üçünü de geçenleri ekle**, gerekçeyi rapora yaz.
5. **Anti-drift testi (asıl kalıcı değer):** `App.tsx` kaynağını parse edip, `STATIC_ROUTES`
   içindeki hiçbir path'in `RequireAuth`/`RequireFeature` sarmalında veya `<Navigate>` redirect'i
   olmadığını doğrulayan test. Ayrıca: duplicate `<loc>` yok, XML escape doğru, `SITE_DATE`
   ile deterministik çıktı.

---

### Batch 4b — GEO: `llms.txt` doğruluk düzeltmesi

**Dosya:** `public/llms.txt` (mevcut ve git'te izleniyor — **yeni dosya oluşturulmayacak**)

Dosya **zaten var** ve answer-engine'lere sunulan tek yapılandırılmış içerik haritası. Denetimde
ciddi ölü/yanlış bağlantılar bulundu:

1. `https://corteqs.net/blog` → bu bir **redirect** (`/radar/rehberler`). Doğrudan hedefe çevir.
2. `/#hakkinda`, `/#sss`, `/#kategoriler`, `/#ilgi`, `/#destek`, `/#elci`, `/#blogger` çapaları
   eski `Index` sayfasına ait; `Index` bugün `/landingtrial`'da ve **`noindex`**. Ana sayfa
   artık `LandingTrialPage`. **Her çapayı `LandingTrialPage` DOM'unda doğrula**; karşılığı
   yoksa çıkar veya gerçek bölüme yönlendir. (Ölü çapa = AI motorunu var olmayan içeriğe
   yönlendirmek.)
3. Eksik public rotalar ekle: `/radar`, `/radar/rehberler`, `/anket`, `/commercial`, `/lansman`,
   `/campaign`, `/legal/*`, `/kurulus/<slug>`.
4. **Dokunulmayacak (B-2 kuralı gereği):** "164 ülkede 8,8 milyon", "2026'da Istanbul merkezli",
   "$1.000 / $10.000 kurucu katkısı" gibi doğrulanamayan iddialar — `index.html` JSON-LD'siyle
   aynı politika: **rapora yaz, değiştirme.**

Ayrım net: **ölü bağlantı/çapa = olgusal hata, düzeltilir. Sayısal/ticari iddia = ürün kararı,
raporlanır.**

---

### Batch 5 — P1: ölü kod + script hijyeni

1. **`src/pages/MapSearch.tsx`** (257 satır) → var olmayan `@/lib/mapEntities`'i import ediyor,
   hiçbir route'a bağlı değil. **`tsc --noEmit` hatasının kaynaklarından biri.**
2. **`src/pages/PostGenerator.tsx`** (371 satır) → `html-to-image` paketi `package.json`'da **yok**,
   hiçbir route'a bağlı değil.
   Her ikisi için: import/route/dynamic-import/test/script referansı taraması → temizse `git rm`.
   `src/lib/dashboard/workspace-doc-pages.tsx:422,424` bunları **metin olarak** listeliyor;
   o doküman satırları da güncellenir.
   > CLAUDE.md'nin B2 maddesindeki `@/lib/radarNews` iddiası **yanlış** — gerçek modül
   > `radarNewsPipeline.ts` ve mevcut. Sadece doküman düzeltilecek.
3. **`package.json` lokal yol sızıntısı:** `import:doctors:dortmund` script'i
   `c:\Users\<kullanıcı>\OneDrive - …\Desktop\…` mutlak yolunu ve kullanıcı adını içeriyor.
   `--csv` argümanını zorunlu CLI parametresine çevir, yol kaldırılsın.
4. `name: "vite_react_shadcn_ts"` → gerçek proje adı; `description` ve `engines.node` (>=22,
   Dockerfile `node:22-alpine` ile hizalı) ekle.

---

### Batch 6 — Dokümantasyon: source-of-truth senkronu

**Dosyalar:** [CLAUDE.md](../../CLAUDE.md), [README.md](../../README.md),
[ARCHITECTURE.md](../../ARCHITECTURE.md), [docs/README.md](../README.md)

Yukarıdaki baseline tablosundaki **her bayat iddia** gerçek sayıyla değiştirilir. Kritik olanlar:

- **"`server.mjs` production runtime"** → *"Prod runtime nginx'tir (Dockerfile → nginx.conf.template).
  `server.mjs` yerel/nixpacks yoludur. SEO davranışı nginx'e yazılır."* (P0 yanlış yönlendirme)
- Migration: 221 → **352, konum `supabase/migrations/applied/`**
- Edge Functions: 5 → **7**, olmayan `chat-register` çıkarılır, README'deki deploy talimatları
  gerçek fonksiyon adlarıyla güncellenir
- "Kökte yalnız 4 doküman" → gerçek: 5 `.md` + `rapor.html`; `SONDURUM.md` ya kurala dahil edilir
  ya `docs/`'a taşınır (**karar kullanıcının** — plan bunu backlog'a yazar, taşımaz)
- Known Limitations B1 (types.ts), B3 (AdminMembersPage.test), B4 (AdminLayout 741 satır) →
  **çözülmüş/geçersiz**, kapatılır. B5 sayısı 39 → 26.
- Yeni "Değişmez sözleşmeler" maddesi: *redirect eklerken `src/lib/redirects.ts` + nginx +
  App.tsx üçü birlikte güncellenir; test drift'i yakalar.*

**Rapor dosyaları** (tek kopya):
```
docs/audits/2026-08-04-repository-health-audit.md
docs/audits/2026-08-04-seo-geo-audit.md
docs/audits/2026-08-04-documentation-audit.md
docs/plans/2026-08-04-modernization-backlog.md
docs/history/2026-08-04-modernization-change-report.md
```

---

## Uygulanmayacak, backlog'a yazılacak (ürün kararı / yüksek risk)

| # | Konu | Neden ertelendi |
|---|---|---|
| B-1 | `index.html` JSON-LD kapsamı: 12 soruluk `FAQPage`, `Offer` (€99), sabit `dateModified: 2026-07-06`, `BreadcrumbList` **tüm rotalarda** miras alınıyor; sayfada olmayan FAQ için rich-result iddiası | **Kullanıcı kararı: dokunma, raporla** |
| B-2 | Doğrulanamayan iddialar: "164 ülkede 8.8 milyon", `foundingDate: 2026`, `foundingLocation: Istanbul`, iki kurucu `Person` kaydı | Gerçeklik doğrulaması ürün/hukuk kararı |
| B-3 | Geçersiz `SearchAction` (google.com/search?q=site:), serbest `SpeakableSpecification`, `meta keywords` | B-1 ile aynı dosya |
| B-4 | Gerçek HTTP 404 (soft-404'ün tam çözümü) | Sunucu tarafı route bilgisi gerekir; prerender/SSR kararı |
| B-5 | AI crawler politikası: `robots.txt` eğitim botlarına (GPTBot, CCBot, Google-Extended, Bytespider) izin veriyor | Ürün/lisans kararı |
| B-6 | `Suspense fallback={null}` → lazy chunk yüklenirken boş ekran; LCP ve bot deneyimi | Görsel karar + ölçüm gerekir |
| B-7 | Bundle: `recharts`, `d3-geo`, `framer-motion` kullanım haritası, `manualChunks` yok, `vite.config.ts`'te ikinci entry (`lansman/index.html`) | Faz A build ölçümü olmadan körlemesine dokunulmaz |
| B-8 | 112 dosya >300 satır (`ProfilePage.tsx` 2511, `CommandCenterManager.tsx` 1987, `AddWhatsAppPage.tsx` 1611) | Faz D pilotu dışında kalanlar |
| B-9 | 83 `supabase.from(` + 42 `supabase.rpc(` component içinde; 92 `as any` | Kademeli, domain bazlı |
| B-10 | `SONDURUM.md` (26 KB) kök konumu | Doküman düzeni kararı kullanıcının |
| B-11 | **`public/burak-stripe-rehberi.html`** git'te izleniyor ve `https://corteqs.net/burak-stripe-rehberi.html` adresinde **herkese açık** servis ediliyor; `robots.txt` yalnız `/admin`'i engelliyor → dahili rehber taranabilir durumda | İçeriğin gerçekten public olup olmadığı ürün kararı; silme/taşıma/`noindex` seçenekleri raporda |
| B-12 | **`public/` içinde ~78 MB video**: `footer-community.mp4` 48 MB, `hero-people.mp4` 11 MB, `hero-network.mp4` 7.9 MB, `whatmaskot.mp4` 5.4 MB, `herovideo.mp4` 3.5 MB, `earth-night.webm` 2.9 MB. Hepsi Docker imajına giriyor ve aynı origin'den servis ediliyor | LCP/bant genişliği etkisi büyük ama çözüm (CDN, poster+lazy, kodek, kaldırma) görsel/ürün kararı |
| B-13 | Şüpheli yinelenen/atıl görseller: `sweet.png` (586 KB) + `sweet.jpg` (310 KB), `last.png`/`newbg.png` (745 KB), `og-image.png` + `og-image-new.jpg`, `denemeremake.png`, `yeniinffffffff.png`, `0000000000000000almanya101-…png` | Kullanım taraması yapılıp raporlanır; silme onayla |

---

## Faz D — Clean Code pilot domain: **public içerik sayfaları**

Tek domain seçildi: `RadarHubPage` · `BlogPostPage` · `DiasporaDetailPage` ·
`CommercialDocumentPage` · `IndependentProfilePage`.

**Seçim gerekçesi:** (a) hepsi auth'suz ve DB yazmıyor → düşük risk; (b) her biri kendi
`applySeo` + kendi veri çekimini tekrarlıyor → gerçek duplication; (c) Batch 3'teki
"render-complete veri gelmeden atılıyor" sorunu tam burada yaşanıyor → SEO çalışmasıyla aynı
hedefe hizmet eder; (d) çıktısı kullanıcıya ve bota doğrudan görünür; (e) test edilebilir.

Yapılacak: ortak `usePublicContentSeo` (veri geldikten sonra SEO uygula + bulunamayan içerikte
`noindex`), veri erişimini `src/lib/*-api.ts` katmanına çek, React Query key factory, hata
normalizasyonu, testler. **Bu faz Batch 1-6 yeşil olmadan başlamaz.**

---

## Doğrulama

**Faz A (başlangıç) ve Faz F (final) aynı komut seti, sonuçlar tabloyla karşılaştırılır:**

```bash
npm run verify:text
npm run lint
npm run test
npx tsc -p tsconfig.app.json --noEmit
npm run build
```

**Batch'e özel doğrulama:**

- **Batch 1-2 (nginx):** `docker build -t corteqs-local .` → konteyneri çalıştır → `curl -D -` ile
  `/`, `/robots.txt`, `/assets/*.js`, `/hakkimizda`, `/blog?utm=x` kontrol et. Tarayıcıda
  `http://localhost` aç, **konsolda CSP ihlali olmamalı**, fontlar yüklenmeli.
- **Batch 3:** `npm run test -- src/lib/seo.test.ts src/App.notfound-seo.test.tsx`
- **Batch 4:** `npm run test -- scripts/generate-sitemap.test.mjs` ve
  `SITE_DATE=2026-08-04 npm run generate:sitemap` → üretilen `public/sitemap.xml`'i mevcut
  canlı sürümle (107 URL) diff'le; `/cadde` gitmiş olmalı.
- **Batch 4b:** `public/llms.txt` içindeki her URL/çapa için hedefin gerçekten var olduğunu
  doğrula (rota tablosu + `LandingTrialPage` DOM'u).
- **Batch 5:** `npx tsc -p tsconfig.app.json --noEmit` hata sayısı düşmeli.
- **`verify:release` uyumu (kontrol edildi):**
  [verify-release.mjs](../../scripts/verify-release.mjs) yalnız HTTP status + content-type
  doğruluyor ve `redirect: "follow"` kullanıyor; asset yollarını `/admin/muhasebe` HTML'inden
  `<script type="module" crossorigin>` regex'iyle çıkarıyor. Batch 1'in eklediği
  `<script src="/analytics.js" defer>` bu regex'i bozmaz ve `/admin/*` yeni 301'lerin kapsamında
  değil → **script değişiklik gerektirmiyor.**
- **E2E (opsiyonel, ortam hazırsa):** `npm run test:e2e` — mevcut 5 spec regresyon kontrolü.

**Yapılmayacaklar (kullanıcı talimatı):** commit, push, PR, branch değişimi, deploy, canlı
Supabase yazımı, migration çalıştırma, RLS değişikliği, Edge Function deploy.

---

## Batch boyutları

| Batch | Dosya | Tahmini diff | Risk |
|---|---|---|---|
| 1 — nginx başlık + CSP | ~3 | S | **Orta** (deploy sonrası konsol doğrulaması şart) |
| 2 — nginx redirect/runtime | ~5 | M | Orta |
| 3 — SEO helper + 404 | ~4 | S | Düşük |
| 4 — sitemap | ~2 | M | Düşük |
| 4b — llms.txt | 1 | XS | Düşük |
| 5 — ölü kod + script | ~5 | S | Düşük |
| 6 — dokümantasyon + raporlar | ~10 | L | Yok |

Her batch'ten sonra hedefli test; kırmızıysa sonraki batch'e geçilmez.

---

## Gerçekleşen

> **Durum: Batch 1–6 uygulandı (2026-08-04).** Faz D uygulanmadı — backlog'da.
> Tam ayrıntı: [docs/history/2026-08-04-modernization-change-report.md](../history/2026-08-04-modernization-change-report.md)

### Önce / sonra

| Ölçüm | Faz A | Faz F | Değişim |
|---|---|---|---|
| `verify:text` | exit 0 — 1307 dosya | exit 0 — 1308 dosya | +1 (`public/analytics.js`) |
| `lint` | 1280 problem (1060 error) | 1275 problem (1055 error) | −5 error |
| `tsc --noEmit` | **103 hata** | **98 hata** | −5 |
| `test` | *ölçülmedi* | 1416/1417 geçti | 1 flaky timeout (regresyon değil) |
| `build` | exit 0 | exit 0 (37.5 sn) | — |
| `sitemap.xml` | 107 URL | 108 URL | −`/cadde`, +2 kampanya |
| Test dosyası | 198 | 202 | **+40 test** |

### Plandan sapmalar

1. **Ölü kod 2 değil 5 dosyaydı.** Plan `MapSearch.tsx` ve `PostGenerator.tsx`'i öngörmüştü;
   baseline `tsc` çıktısı üç tane daha ortaya çıkardı (`CityNews.tsx` → `@/lib/diasporaBlogLinks`,
   `WhatsAppGroupLanding.tsx` + `WhatsAppGroups.tsx` → `@/lib/whatsappLandings`). Aynı kanıt
   standardıyla (0 import + eksik modül) kullanıcı onayı alınarak silindi.
2. **Eksik rota denetimi 6 adaydan yalnız 2'sini geçirdi** (`/campaign/vlogger`,
   `/campaign/blogger`). Diğer 4'ünün reddedilme gerekçesi change-report'ta tablo hâlinde.
3. **CSP tek kaynağa alındı** (`map $host $corteqs_csp`) — plan "her location'da tekrarla"
   diyordu; başlıklar tekrarlandı ama politika metni tek yerde tutuldu. Değişken adı
   `$csp` değil `$corteqs_csp`: nginx imajının `20-envsubst-on-templates.sh` scripti
   template'i `envsubst`'tan geçirdiği için genel bir ad aynı adlı ortam değişkeniyle
   çakışıp politikayı sessizce boşaltabilirdi.
4. **`server.mjs`'in `legacyRedirectMap`'i de hizalandı** (4 → 15). Plan yalnız yorum
   eklemeyi istiyordu; liste eksikliği yerel/nixpacks yolunda gerçek bir davranış farkıydı.

### Açık risk — konteyner doğrulaması yapılamadı

Batch 1–2'nin kabul kriteri `docker build` + `curl` idi; **Rancher Desktop kapalı olduğu
için çalıştırılamadı.** Yerine `nginx.conf.template` metni test ve bağımsız syntax denetimiyle
doğrulandı (blok dengesi tamam; 2 `server`, 23 `location`, 17 `return 301`, 6 CSP `add_header`).
Bu, çalışan nginx'in davranışını kanıtlamaz. **Deploy öncesi curl listesi ve deploy sonrası
CSP konsol kontrolü zorunludur** — komutlar change-report'ta.
