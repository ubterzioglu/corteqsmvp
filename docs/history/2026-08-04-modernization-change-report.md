# Modernizasyon Değişiklik Raporu — 2026-08-04

> Uygulanan plan: [docs/plans/2026-08-04-modernization-plan.md](../plans/2026-08-04-modernization-plan.md)
> Kapsam: Batch 1–6 + Faz A/F doğrulaması. Faz D (clean code pilotu) uygulanmadı — backlog'da.
> **Commit / push / deploy / canlı DB yazımı YAPILMADI** (planın kendi kısıtı).

## Özet

Plan üç P0 bulgusu üzerine kuruluydu ve üçü de doğrulandı:

1. **Prod runtime nginx'tir, `server.mjs` değil.** `server.mjs`'teki legacy 301 haritası,
   www→apex yönlendirmesi, `/api/chat` rate-limit'i ve `/admin` prerender istisnası canlıda
   hiç devrede değildi.
2. **HTML sayfalarında tüm güvenlik başlıkları düşüyordu.** nginx'te `add_header`
   kalıtılmaz; kendi `add_header`'ı olan bir `location` üstteki hepsini iptal eder.
   `/robots.txt` 8 güvenlik başlığı döndürürken `/` sıfır döndürüyordu.
3. **Soft 404 + sitemap drift.** Olmayan rota 200 + `index, follow` ile servis ediliyordu;
   auth arkasındaki `/cadde` sitemap'te duruyordu.

Üçü de kapatıldı. Ayrıca planın öngörmediği iki bulgu çıktı: **üç ek ölü sayfa** (baseline
`tsc` çıktısında görüldü) ve **`package.json`'da kullanıcı + işveren adı içeren mutlak yol**.

## Önce / sonra

| Ölçüm | Faz A (başlangıç) | Faz F (final) | Değişim |
|---|---|---|---|
| `npm run verify:text` | exit 0 — 1307 dosya | exit 0 — 1308 dosya | +1 (`public/analytics.js`) |
| `npm run lint` | 1280 problem (1060 error, 220 warning) | 1275 problem (1055 error, 220 warning) | −5 error |
| `npx tsc --noEmit` | **103 hata** | **98 hata** | −5 |
| `npm run test` | ölçülmedi (bkz. not) | 1416/1417 geçti | 1 flaky timeout |
| `npm run build` | exit 0 | exit 0 (37.5 sn) | değişmedi |
| `public/sitemap.xml` | 107 URL | 108 URL | −`/cadde`, +2 kampanya |
| Test dosyası | 198 | 202 | +4 dosya / +40 test |

**Not — baseline test ölçümü alınmadı.** Faz A'da `verify:text`, `lint`, `tsc` ve `build`
çalıştırıldı; `npm run test` atlandı. Bu yüzden aşağıdaki tek kırmızı testin "önce de kırmızı
mıydı" karşılaştırması yapılamıyor. Nedensellik başka yolla kapatıldı (bkz. sonraki başlık).

> **Ölçüm metodolojisi düzeltmesi.** Bu raporun ilk sürümünde `tsc` sayıları **21 → 16**
> yazıyordu. Yanlıştı: ölçüm `npx tsc … | Select-Object -Last 30` ile alınmıştı, yani
> çıktının yalnızca **son 30 satırı** sayılmıştı. Çok satırlı TS hataları (overload
> listeleri) nedeniyle bu, hata sayısını ciddi biçimde eksik gösterdi. Tam sayım
> (`Select-String 'error TS'` ile filtreleyip `.Count`) gerçek değerleri verdi: **98**.
> Baseline, silinen 5 dosyanın her birinin tam 1 `Cannot find module` hatası vermesinden
> hareketle **103**. Ders: kesilen çıktı üzerinden metrik raporlanmaz — sayım her zaman
> filtrelenmiş tam çıktı üzerinden yapılmalı.
>
> Bu düzeltme **hiçbir kod sonucunu değiştirmez**: hata atfı ayrıca kontrol edildi ve bu
> çalışmada eklenen/değiştirilen dosyaların (`redirects.ts`, `seo.ts`, `NotFound.tsx`,
> `App.tsx`, 4 yeni test dosyası) **hiçbirinde `tsc` hatası yok**.

### Tek kırmızı test: `src/pages/ProfilePage.test.tsx`

Tam suite koşusunda bir test 15 sn zaman aşımına takıldı. **Bu çalışmanın regresyonu değildir:**

- `ProfilePage.tsx`, bu çalışmada değiştirilen `src/lib/seo.ts`, `src/lib/redirects.ts` ve
  `src/pages/NotFound.tsx` modüllerinin **hiçbirini import etmiyor** (ölçüldü: 0 referans).
- `ProfilePage.test.tsx` SEO/canonical/robots davranışına hiç bakmıyor (0 eşleşme).
- İzole koşuda **11/11 yeşil**; sorunlu test 1299 ms sürüyor (limitin ~%9'u).
- Hata türü assertion değil, **timeout**.
- `vitest.config.ts` bu senaryoyu zaten belgeliyor: "Tam suite paralel yük altında …
  eşzamanlı koşuda 40 test kırmızı, izole 21/21 yeşil". Tam suite koşusunda `environment`
  toplamı 2358 sn — makine yükü kaynaklı.

## Batch'ler

### Batch 1 — nginx güvenlik başlıkları + CSP (P0)

**Kök neden:** `location /` → `try_files` → `/index.html` internal redirect'i
`location = /index.html`'e düşüyor; oradaki `Cache-Control` `add_header`'ı server bloğundaki
8 güvenlik başlığını birden iptal ediyordu. Tüm uygulama — login ve admin dahil — CSP'siz ve
clickjacking korumasız servis ediliyordu.

- Güvenlik başlıkları kendi `add_header`'ı olan **5 location**'da tekrarlandı
  (`= /env-config.js`, `= /index.html`, `= /api/chat`, `/assets/`, `= /__prerender_internal`)
  + server bloğu = **6 kopya**. Tekrarın nedeni dosyada yorumla sabitlendi.
- CSP tek kaynağa alındı: `map $host $corteqs_csp`. Değişken adı bilinçli olarak daraltıldı —
  nginx imajının `20-envsubst-on-templates.sh` scripti template'i `envsubst`'tan geçirir ve
  genel bir ad (`$csp`) aynı adlı bir ortam değişkeniyle çakışıp politikayı **sessizce
  boşaltabilirdi**.
- CSP allowlist'i mevcut üçüncü taraflara açıldı: `googletagmanager`, `analytics.ahrefs.com`,
  `clarity.ms`, `fonts.googleapis.com`, `fonts.gstatic.com`, `google-analytics`, `c.bing.com`.
- **`script-src`'de `'unsafe-inline'` YOK.** `index.html`'deki iki inline script (gtag config
  + Clarity yükleyici) yeni `public/analytics.js` dosyasına taşındı, `defer` ile yükleniyor.
- Blanket `X-Robots-Tag: index, follow` kaldırıldı — statik dosyalarda anlamsızdı ve 404
  kabuğunda `NotFound`'un `noindex`'ini gölgeliyordu.

### Batch 2 — nginx'i tek runtime kaynağı yapma (P0/P1)

Yönlendirme listesi üç yerde ayrı duruyordu: `App.tsx` 14 madde, `server.mjs` 4 madde
(prod'da ölü), nginx 0 madde.

- Yeni **`src/lib/redirects.ts`** tek kaynak: `LEGACY_REDIRECTS` (14 statik) +
  `DYNAMIC_LEGACY_REDIRECTS` (`/auth`, `/whatsapp-groups/:id`).
- `App.tsx` route'ları artık bu tablodan üretiyor; dağınık `<Navigate>` satırları kaldırıldı.
- nginx'e **15 `location = … return 301 …$is_args$args`** (query string korunur) +
  `/whatsapp-groups/(.+)` regex 301 eklendi.
- **www./mvp. → apex 301** için ayrı `server` bloğu.
- Prerender'dan `/admin` ve `/api` hariç tutuldu (`map $uri $prerender_excluded` + birleşik map).
- `/api/chat`'e `limit_req_zone ragchat 12r/m burst=4 nodelay` — `server.mjs`'teki sınırla hizalı.
- `server.mjs` başına **"PROD RUNTIME DEĞİLDİR"** uyarısı; `legacyRedirectMap` 4 → 15 maddeye
  hizalandı (yerel/nixpacks yolu için).

### Batch 3 — SEO helper + 404 noindex (P1)

- `resolveCanonical()` `canonicalPath` verilmediğinde `window.location.href` döndürüyordu →
  (a) query + hash canonical'a sızıyordu (`/directory?city=Berlin&page=2` gibi **her filtre
  kombinasyonu kendini canonical ilan ediyordu**), (b) canonical host mevcut host'tan
  geliyordu (`www.`/`mvp.`/`localhost`). Düzeltme: `SEO_CANONICAL_ORIGIN` + `pathname`,
  ayrıca `normalizePath()` ile kök dışı trailing slash normalize edildi.
- `NotFound.tsx` artık `robots: "noindex, follow"` yazıyor; her 404'te konsola kırmızı hata
  basan `console.error` kaldırıldı.

### Batch 4 — sitemap doğruluğu (P1)

- `/cadde` `STATIC_ROUTES`'tan çıkarıldı (`RequireAuth` + `RequireFeature(caddeAccess)`).
- **PostgREST 1000 satır sessiz kesmesi:** ortak `fetchAllRows()` helper'ı `Range` başlıklı
  sayfalama yapıyor; 5 dinamik fetcher bunu kullanıyor. Bu tuzak projede daha önce yaşandı
  (`v_command_center_facets`, 2026-08-04).
- **Anket filtresi drift'i:** `src/lib/surveys.ts` hem `starts_at` hem `ends_at` penceresini
  uyguluyordu, sitemap yalnız `starts_at`'i uyguluyordu → süresi dolmuş anketler sitemap'te
  kalıyordu. İki ayrı `or` parametresi `append` edildi (PostgREST bunları AND'ler).
- **Eksik rota denetimi — 6 adaydan 2'si eklendi.** Kriter: public + `useSeo`/`canonicalPath`
  + thin content değil.

  | Rota | Karar | Gerekçe |
  |---|---|---|
  | `/campaign/vlogger` | **eklendi** | public, canonical var, 375 satır içerik |
  | `/campaign/blogger` | **eklendi** | public, canonical var, 462 satır içerik |
  | `/19051919/harita` | reddedildi | içerik tek bir dış link butonu (`globe.corteqs.net`) |
  | `/190519memory` | reddedildi | içerik gönderim formu — thin |
  | `/190519idea` | reddedildi | `useSeo`/`canonicalPath` tanımlamıyor |
  | `/addcom` | reddedildi | `useSeo`/`canonicalPath` tanımlamıyor |

### Batch 4b — llms.txt (GEO)

`public/llms.txt` answer-engine'lere sunulan tek yapılandırılmış içerik haritasıydı ve
**7 çapasının hepsi ölüydü** (`#hakkinda`, `#sss`, `#kategoriler`, `#ilgi`, `#destek`,
`#elci`, `#blogger`). Bu çapalar eski `Index` sayfasına aitti; `Index` bugün `/landingtrial`
adresinde ve `noindex`. Ana sayfa artık `LandingTrialPage` ve DOM'unda yalnızca `id="main"`
ve `id="landingtrial-atlas"` var (ölçüldü).

- Ölü çapalar gerçek sayfalara yönlendirildi (şehir elçisi → `/commercial/ambassador`,
  blogger → `/campaign/blogger`, destekçi → `/founding-1000`, kategoriler → `/directory`).
- `https://corteqs.net/blog` bir **redirect**'ti; doğrudan hedefe (`/radar/rehberler`) çevrildi.
- Eksik public rotalar eklendi (`/radar`, `/anket`, `/commercial`, `/lansman`, `/campaign`,
  7 adet `/legal/*`, `/kurulus/<slug>`, `/iletisim`, kampanya sayfaları).
- Tüm URL'ler `App.tsx` route tablosuna karşı doğrulandı: hepsi geçerli, hiçbiri redirect değil.
- **Dokunulmadı** (ürün kararı, backlog B-2): "164 ülkede 8,8 milyon", "2026'da Istanbul
  merkezli", "$1.000 / $10.000 kurucu katkısı".

### Batch 5 — ölü kod + script hijyeni

**5 ölü sayfa silindi.** Hepsi aynı kanıt standardını karşıladı: sıfır import, hiçbir route'a
bağlı değil, var olmayan modülü import ediyor (yani zaten çalışmıyorlardı).

| Dosya | Eksik bağımlılık | Planda öngörülmüş müydü |
|---|---|---|
| `src/pages/MapSearch.tsx` | `@/lib/mapEntities` | evet |
| `src/pages/PostGenerator.tsx` | `html-to-image` (paket yok) | evet |
| `src/pages/CityNews.tsx` | `@/lib/diasporaBlogLinks` | **hayır** |
| `src/pages/WhatsAppGroupLanding.tsx` | `@/lib/whatsappLandings` | **hayır** |
| `src/pages/WhatsAppGroups.tsx` | `@/lib/whatsappLandings` | **hayır** |

Son üçü baseline `tsc` çıktısında bulundu ve kullanıcı onayıyla silindi.

**`package.json` gizlilik sızıntısı:** `import:doctors:dortmund` scripti
`c:\Users\baris-terzioglu\OneDrive - adesso Group\Desktop\…` mutlak yolunu içeriyordu —
kullanıcı adı **ve işveren adı** git geçmişinde. `--csv` artık zorunlu CLI parametresi
(script zaten `--csv gerekli.` hatası veriyor). Ayrıca `name` `vite_react_shadcn_ts` →
`corteqs-mvp`, `description` ve `engines.node >=22` eklendi.

## Yeni testler — 40 test, 4 dosya

Bu çalışmanın kalıcı değeri düzeltmelerden çok **düzeltmeleri kilitleyen testler**:

| Dosya | Test | Neyi kilitliyor |
|---|---|---|
| `src/lib/redirects.test.ts` | 10 | `redirects.ts` ↔ `nginx.conf.template` drift'i, CSP tekrar sayısı, `unsafe-inline` yokluğu, `X-Robots-Tag`'in geri gelmemesi, redirect zinciri/döngüsü |
| `src/lib/seo.test.ts` | 17 | canonical query/hash sızıntısı, host sabitleme, trailing slash, robots override + cleanup, JSON-LD birikmesi, `render-complete` |
| `src/App.notfound-seo.test.tsx` | 4 | 404'ün `noindex, follow` yazması, global robots'un bozulmaması |
| `scripts/generate-sitemap.test.mjs` | 9 | `STATIC_ROUTES`'ta auth arkası rota / redirect kaynağı olmaması, XML escape, determinizm |

`src/lib/seo.ts`'in bu çalışmadan önce **hiç testi yoktu** — sitedeki her sayfanın
title/canonical/robots/JSON-LD'sini yazmasına rağmen.

## Doğrulanmayan — deploy öncesi zorunlu

Planın Batch 1–2 kabul kriteri `docker build` + konteynerde `curl -D -` ile başlık/301
kontrolüydü. **Rancher Desktop kapalı olduğu için docker daemon'a bağlanılamadı; konteyner
doğrulaması YAPILMADI.**

Yerine yapılanlar (gerçek ama yetersiz):

- `src/lib/redirects.test.ts` `nginx.conf.template` **metnini** denetliyor: location'lar,
  301 hedefleri, `$is_args$args`, CSP tekrar sayısı (6), `unsafe-inline` yokluğu.
- Bağımsız syntax denetimi: blok dengesi tamam, 2 `server`, 23 `location`, 17 `return 301`,
  6 CSP `add_header`, tüm yapısal öğeler yerinde.

Bunlar çalışan nginx'in davranışını **kanıtlamaz**. Deploy sonrası zorunlu kontrol listesi:

```bash
curl -sD - https://corteqs.net/            -o /dev/null   # 8 güvenlik başlığı dönmeli
curl -sD - https://corteqs.net/robots.txt  -o /dev/null   # aynı başlıklar
curl -sD - https://corteqs.net/assets/<hash>.js -o /dev/null
curl -sD - https://corteqs.net/hakkimizda  -o /dev/null   # 301 → /founders
curl -sD - "https://corteqs.net/blog?utm=x" -o /dev/null  # 301 → /radar/rehberler?utm=x
curl -sD - https://www.corteqs.net/        -o /dev/null   # 301 → https://corteqs.net/
```

**Tarayıcı konsolunda tek bir CSP ihlali bile olmamalı** — fontlar yüklenmeli, GA/Clarity/
Ahrefs istek atabilmeli. İhlal görülürse ilgili host'u `nginx.conf.template` içindeki
`$corteqs_csp` map'ine ekle; `'unsafe-inline'` ekleme.

> Riski düşürmek isterseniz CSP'yi bir tur `Content-Security-Policy-Report-Only` olarak
> yayınlayıp konsolu izleyin, sonra zorunlu moda geçirin.

## Değiştirilen dosyalar

**Yeni:** `public/analytics.js` · `src/lib/redirects.ts` · `src/lib/redirects.test.ts` ·
`src/lib/seo.test.ts` · `src/App.notfound-seo.test.tsx` · `scripts/generate-sitemap.test.mjs` ·
`docs/audits/*` (3) · `docs/plans/2026-08-04-modernization-backlog.md` · bu rapor

**Değişen:** `nginx.conf.template` · `index.html` · `server.mjs` · `package.json` ·
`src/App.tsx` · `src/lib/seo.ts` · `src/pages/NotFound.tsx` ·
`src/lib/dashboard/workspace-doc-pages.tsx` · `scripts/generate-sitemap.mjs` ·
`public/llms.txt` · `public/sitemap.xml` · `CLAUDE.md` · `README.md` · `ARCHITECTURE.md` ·
`docs/README.md`

**Silinen:** `src/pages/MapSearch.tsx` · `src/pages/PostGenerator.tsx` ·
`src/pages/CityNews.tsx` · `src/pages/WhatsAppGroupLanding.tsx` · `src/pages/WhatsAppGroups.tsx`

## Sıradaki iş

Ayrıntı: [docs/plans/2026-08-04-modernization-backlog.md](../plans/2026-08-04-modernization-backlog.md)

1. **Konteyner doğrulaması** (yukarıdaki curl listesi) — deploy öncesi.
2. **CSP konsol kontrolü** — deploy sonrası, zorunlu.
3. Ürün kararı bekleyenler: B-1/B-2/B-3 (JSON-LD iddiaları), B-5 (AI crawler politikası),
   B-10 (`SONDURUM.md` konumu), **B-11 (`public/burak-stripe-rehberi.html` herkese açık —
   doğrulandı: git'te izleniyor, `robots.txt` yalnız `/admin`'i engelliyor)**.
4. Teknik borç: 98 `tsc` hatası, 1275 lint problemi, B-6…B-9.
5. Varlık ağırlığı: B-12 (**ölçüldü: `public/` içinde 77 MB video**, en büyüğü
   `footer-community.mp4` 47 MB), B-13 (yinelenen görseller).
6. Faz D — clean code pilotu (public içerik sayfaları).
