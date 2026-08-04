# Depo Sağlığı Denetimi — 2026-08-04

**Depo:** `C:/temp_private/corteqs/corteqs_fin` (branch: `main`)
**Kapsam:** depo düzeyinde sağlık — ölçülen metrikler, ölü kod, paket hijyeni, tip/lint durumu,
test kapsamı, depo düzeyindeki riskler.
**Yöntem:** her sayı bu oturumda çalıştırılarak ölçüldü. Tahmin edilen değer yok; ölçülmemiş
olan yerlerde "ölçülmedi" yazar.

---

## 1. Özet

Depo çalışır durumda: `npm run build` exit 0, `npm run verify:text` 1307 dosyada UTF-8 denetimini
geçiyor, tsc hata sayısı 103'ten 98'e düştü. Fonksiyonel bir kırılma bulunmadı.

Buna karşılık üç sınıf sorun ölçüldü:

1. **Dokümantasyon ile gerçeklik ayrışmış.** `CLAUDE.md` içindeki envanter sayıları (migration,
   Edge Function, dosya sayıları) ve "Known Limitations" listesinin yarısı bayat. En kritik olanı
   bir *çalışma zamanı* iddiası: doküman prod runtime'ı `server.mjs` sanıyor, gerçekte nginx.
   Bu, güvenlik başlıkları ve yönlendirmelerin yanlış yerde aranmasına yol açıyordu.
2. **Ölü kod ve hijyen borcu.** Hiçbir route'a bağlı olmayan, var olmayan modülleri import eden
   5 sayfa dosyası; `package.json`'da varsayılan şablon adı; bir script içinde mutlak yol
   biçiminde gizlilik sızıntısı.
3. **Depo ağırlığı ve teknik borç.** `public/` altında ~78 MB video, şüpheli yinelenen görseller,
   herkese açık servis edilen bir dahili rehber HTML'i, 112 dosya >300 satır, 89 `as any`,
   1280 lint problemi.

Olumlu bulgu: hassas dosyaların hiçbiri git'te izlenmiyor ve `.gitignore` bunları kapsıyor
(bkz. Bulgu 8).

---

## 2. Ölçülen metrikler

### 2.1 Dokümante edilen değer ile ölçülen gerçek

`CLAUDE.md` içindeki iddialar, bu oturumda ölçülen değerlere karşı:

| Konu | `CLAUDE.md` iddiası | Ölçülen gerçek | Durum |
|---|---|---|---|
| Prod runtime | "`server.mjs` Production runtime" | nginx (`FROM nginx:1.27-alpine`) | **Yanlış — P0** |
| Migration sayısı | 221 | 352 (`supabase/migrations/applied/`) | Bayat |
| Edge Function sayısı | 5 (`chat-register` dahil) | 7 (`chat-register` yok) | Bayat |
| Kök doküman sayısı | "yalnız 4 doküman" | 5 `.md` + `rapor.html` | Bayat |
| page `.tsx` | 150 (65 admin) | 209 | Bayat |
| component | 269 | 429 | Bayat |
| lib modülü | 81 | 278 | Bayat |
| `App.tsx` | ~300 satır, ~75 `lazy()` | 283 satır, 51 `lazy()` | Kısmen bayat |
| B1: `types.ts` bayat, ~164 tsc hatası | Açık sorun | **Çözülmüş** (98 hata, başka sınıf) | Bayat |
| B2: `@/lib/radarNews` eksik | Açık sorun | Modül adı `radarNewsPipeline.ts`, **mevcut** | Yanlış |
| B2: `@/lib/mapEntities`, `html-to-image` | Açık sorun | **Doğruydu** — bu çalışmada silindi | Kapandı |
| B3: `AdminMembersPage.test.tsx` bozuk | Açık sorun | Dosya artık yok/geçersiz | Bayat |
| B4: `AdminLayout.tsx` 741 satır | Açık sorun | **Çözülmüş** — 6 satırlık barrel | Bayat |
| B5: `@/contexts/AuthContext` importu | ~39 dosya | 21 dosya | Bayat |
| B7: `as any` | ~103 | 89 | Bayat |

**KANIT (runtime):** `Dockerfile` içinde `FROM nginx:1.27-alpine` ve `nginx.conf.template`
dosyasının `/etc/nginx/templates/default.conf.template` olarak kopyalanması. Canlı doğrulama:
`Server: nginx/1.27.5`, `https://corteqs.net/hakkimizda` → 200 (301 değil),
`https://www.corteqs.net/` → 200 (apex'e 301 değil). `server.mjs` yalnızca `npm run start` ve
nixpacks yolunda çalışır.

### 2.2 Çalışma öncesi → çalışma sonrası (değişen ölçümler)

| Ölçüm | Önce | Sonra | Not |
|---|---|---|---|
| `tsc -p tsconfig.app.json --noEmit` hata | 103 | 98 | 5 ölü sayfanın silinmesiyle |
| Ölü sayfa dosyası (import edilmeyen) | 5 | 0 | Bulgu 2 |
| Sitemap URL sayısı | 107 | 108 | `/cadde` çıktı; 2 kampanya rotası girdi |
| `public/llms.txt` ölü çapa | 7 | 0 | Batch 4b |
| `server.mjs` legacy redirect maddesi | 4 | 15 | Tek kaynakla hizalandı |
| nginx CSP kaynağı | yok | `map $host $corteqs_csp` (tek kaynak) | Bulgu 1 |
| `src/lib/redirects.ts` | yok | var (14 statik + 2 dinamik) | Tek kaynak |

### 2.3 Mevcut durum (değişiklikler uygulandıktan sonra)

| Metrik | Değer |
|---|---|
| `src` altında `.ts`/`.tsx` | 989 |
| pages / components / lib | 209 / 429 / 278 |
| Test dosyası | 202 (src 190, scripts 9, supabase 3, workers 4) + 18 Playwright `.spec.ts` |
| Migration | 352 (hepsi `supabase/migrations/applied/`; kökte 0 `.sql`) |
| Edge Function | 7 |
| Kök `.md` | 5 (`AGENT_CONTEXT`, `ARCHITECTURE`, `CLAUDE`, `README`, `SONDURUM`) + `rapor.html` |
| `App.tsx` | 283 satır, 51 `lazy()` |
| `src/components/admin/AdminLayout.tsx` | 6 satır (barrel) |
| `@/contexts/AuthContext` importu | 21 dosya |
| `as any` | 89 |
| `src` altında `console.log` | 0 |
| `tsc --noEmit` | 98 hata |
| `npm run lint` | 1280 problem (1060 error, 220 warning) |
| `npm run verify:text` | geçiyor (1307 dosya UTF-8) |
| `npm run build` | exit 0 |

Edge Function listesi: `find-matches`, `lansman-admin`, `radar-news-scan`,
`relocation-notifications`, `send-notification-emails`, `send-submission-email`,
`submit-survey-response`.

---

## 3. Bulgular

Önem sırasına göre. Her bulguda **KANIT** satırı, ölçüme ya da dosya içeriğine dayanır.

### Bulgu 1 — [P0] Güvenlik başlıkları uygulamanın tamamında düşüyordu

nginx'te `add_header` **kalıtılmaz**: kendi `add_header`'ı olan bir `location`, üst bloktaki tüm
`add_header` direktiflerini iptal eder. `location /` → `try_files` → `/index.html` internal
redirect'i `location = /index.html`'e düşüyordu; oradaki `Cache-Control` `add_header`'ı server
bloğundaki 8 güvenlik başlığını birden düşürüyordu.

Sonuç: SPA kabuğunu servis eden her istek — **login ve admin dahil** — CSP'siz ve clickjacking
korumasız gidiyordu.

> **KANIT:** `https://corteqs.net/robots.txt` yanıtında 8 güvenlik başlığı var, `/` yanıtında 0.
> Fark, `location = /index.html` içindeki `add_header Cache-Control` direktifi.

**Durum:** düzeltildi (bkz. 4.1). Konteyner doğrulaması yapılamadı (bkz. Bölüm 5).

### Bulgu 2 — [P1] Beş ölü sayfa dosyası, var olmayan modülleri import ediyordu

Aşağıdaki dosyaların hepsi sıfır yerden import ediliyordu, hiçbir route'a bağlı değildi ve
depoda bulunmayan modülleri import ediyordu. tsc hatalarının 5'i bunlardan geliyordu.

| Silinen dosya | Eksik bağımlılık |
|---|---|
| `src/pages/MapSearch.tsx` | `@/lib/mapEntities` (yok) |
| `src/pages/PostGenerator.tsx` | `html-to-image` (`package.json`'da yok) |
| `src/pages/CityNews.tsx` | `@/lib/diasporaBlogLinks` (yok) |
| `src/pages/WhatsAppGroupLanding.tsx` | `@/lib/whatsappLandings` (yok) |
| `src/pages/WhatsAppGroups.tsx` | `@/lib/whatsappLandings` (yok) |

> **KANIT:** İki bağımsız kanıt zinciri kullanıldı. (a) Her dosya adı için depo genelinde import
> araması yapıldı — sıfır referans. (b) Baseline `tsc -p tsconfig.app.json --noEmit` çıktısında
> beş dosya da "cannot find module" hatasıyla listeleniyordu; silme sonrası hata sayısı 103 → 98'e
> düştü ve `npm run build` exit 0 verdi.

Not: modernizasyon planı bunlardan yalnızca 2'sini (`mapEntities`, `html-to-image`) öngörmüştü;
diğer 3'ü baseline tsc çıktısını okurken bulundu ve kullanıcı onayıyla silindi. Ders: "bilinen
sorunlar" listesi kaynak değil, ipucu — asıl kaynak derleyici çıktısı.

### Bulgu 3 — [P1] `package.json` içinde gizlilik sızıntısı

`import:doctors:dortmund` scripti, kullanıcının makinesindeki mutlak yolu gömülü tutuyordu:

```
c:\Users\baris-terzioglu\OneDrive - adesso Group\Desktop\...
```

Bu satır git geçmişinde **kullanıcı adı + işveren adı** taşıyor ve depo public'e açıldığında
ifşa olur. Ayrıca script başka bir makinede zaten çalışmaz.

> **KANIT:** `package.json` `scripts` bloğundaki komut dizesi. İlgili script CSV yolu verilmediğinde
> zaten `"--csv gerekli."` hatasıyla çıkıyor, yani sabit yol işlevsel olarak gereksizdi.

**Durum:** düzeltildi — `--csv` artık zorunlu CLI parametresi, mutlak yol kaldırıldı.

### Bulgu 4 — [P2] `package.json` kimlik alanları şablon varsayılanında kalmış

`name` alanı `vite_react_shadcn_ts` idi; `description` ve `engines` alanları yoktu. Bu, Node
sürümü uyuşmazlıklarını sessizleştirir ve depo kimliğini belirsiz bırakır.

> **KANIT:** `package.json` içeriği. `name` alanı Vite + shadcn şablonunun üretim varsayılanı.

**Durum:** düzeltildi — `name: corteqs-mvp`, `description` eklendi, `engines.node >= 22` eklendi.

### Bulgu 5 — [P1] Yönlendirme listesi üç yerde ayrı ayrı tutuluyordu

Legacy yönlendirmeler `App.tsx` içinde 14 client-side `<Navigate>`, `server.mjs` içinde 4 madde
(prod'da ölü kod), nginx'te ise hiç yoktu. Yani prod'da eski URL'ler **hiçbir 301 almıyordu**;
tarayıcı önce SPA kabuğunu indiriyor, sonra client-side yönlendiriyordu. Arama motoru için bu
kalıcı yönlendirme sinyali değildir.

> **KANIT:** Üç dosyanın karşılaştırılması: `src/App.tsx` `<Navigate>` sayısı 14,
> `server.mjs` `legacyRedirectMap` 4 madde, `nginx.conf.template` 0 redirect location'ı.
> Prod runtime nginx olduğu için (Bulgu 1'in kanıtı) `server.mjs`'teki liste hiç çalışmıyordu.

**Durum:** düzeltildi — `src/lib/redirects.ts` tek kaynak oldu; nginx'e 15 `location = ... return 301`
+ 1 regex redirect eklendi; drift `src/lib/redirects.test.ts` ile kilitlendi.

### Bulgu 6 — [P1] Canonical URL query string ve host sızdırıyordu

`src/lib/seo.ts` içindeki `resolveCanonical()`, `canonicalPath` verilmediğinde
`window.location.href` döndürüyordu. İki ayrı hata:

1. Query ve hash canonical'a sızıyordu — `/directory?city=Berlin&page=2` gibi **her filtre
   kombinasyonu self-canonical** oluyordu (sonsuz yinelenen URL uzayı).
2. Canonical host, isteğin geldiği host'tan alınıyordu — `www.`, `mvp.` veya `localhost`
   canonical olarak yazılabiliyordu.

> **KANIT:** `src/lib/seo.ts` içindeki `resolveCanonical()` gövdesi. Ayrıca `www.corteqs.net`
> canlıda 200 dönüyor (apex'e 301 değil), yani ikinci senaryo teorik değil.

**Durum:** düzeltildi — `SEO_CANONICAL_ORIGIN` + `window.location.pathname`, `normalizePath()` ile
kök dışı trailing slash temizliği. 17 test eklendi.

### Bulgu 7 — [P1] `public/llms.txt` içindeki 7 çapanın hepsi ölüydü

`#hakkinda #sss #kategoriler #ilgi #destek #elci #blogger` çapalarının tamamı eski `Index`
sayfasına aitti. `Index` bugün `/landingtrial` altında ve **noindex**. Ana sayfa artık
`LandingTrialPage` ve DOM'unda yalnızca `id="main"` ile `id="landingtrial-atlas"` var.

Ayrıca `https://corteqs.net/blog` bir redirect'ti — `llms.txt` doğrudan hedefi değil,
yönlendirmeyi listeliyordu.

> **KANIT:** `LandingTrialPage` DOM'undaki `id` niteliklerinin sayımı: 2 (`main`, `landingtrial-atlas`).
> `llms.txt`'teki 7 çapanın hiçbiri bu ikisiyle eşleşmiyor.

**Durum:** düzeltildi — ölü çapalar gerçek sayfalara yönlendirildi, `/blog` doğrudan
`/radar/rehberler`'e çevrildi, eksik public rotalar eklendi. Tüm URL'ler `App.tsx` route tablosuna
karşı doğrulandı: hepsi geçerli, hiçbiri redirect değil.

### Bulgu 8 — [OLUMLU] Hassas dosyalar git'te izlenmiyor

Depo düzeyinde denetlenen hassas dosyaların hiçbiri git tarafından izlenmiyor ve `.gitignore`
hepsini kapsıyor:

| Dosya / desen | `.gitignore` kaydı | İzleniyor mu |
|---|---|---|
| `.env`, `.env.local`, `.env.*.local` | var (`# Environment files`) | Hayır |
| `.secretdb` | var | Hayır |
| `walast.txt`, `*.wa-export.txt` | var (2026-08-02 kuralı) | Hayır |
| `secret.md`, `secret_ignore.md`, `remote.env.generated` | var (`# Secrets`) | Hayır |
| `supabase/.env`, `env-config.js` | var | Hayır |
| `*.pem`, `*.key`, `*.crt` | var (`# TLS certificates`) | Hayır |

> **KANIT:** `.gitignore` içeriği ile git izleme durumunun karşılaştırılması. `walast.txt` kuralı
> 2026-08-02'de yaşanan olay sonrasında eklenmiş ve yorum satırıyla gerekçelendirilmiş — sızıntı
> önleme kültürünün depoda karşılığı var.

Bu, denetimin tek net olumlu bulgusu. Ancak bkz. Bulgu 9: `.gitignore` **git'i** koruyor,
**`public/`'i** korumuyor.

### Bulgu 9 — [P1] Dahili rehber herkese açık servis ediliyor

`public/burak-stripe-rehberi.html` git'te izleniyor ve
`https://corteqs.net/burak-stripe-rehberi.html` adresinde **kimlik doğrulamasız** servis ediliyor.
`robots.txt` yalnızca `/admin`'i engelliyor, bu dosyayı engellemiyor.

> **KANIT:** Dosya `public/` altında ve git'te izleniyor; `public/` içeriği nginx tarafından
> statik olarak servis edilir. `robots.txt` `Disallow` listesinde yalnız `/admin` var.

**Durum:** düzeltilmedi — içerik hassasiyeti kararı kullanıcıya ait (backlog B-11). Seçenekler:
(a) dosyayı kaldır, (b) `robots.txt`'e ekle (indekslemeyi engeller, erişimi değil),
(c) nginx'te `location = /burak-stripe-rehberi.html { return 404; }`.

### Bulgu 10 — [P2] `public/` altında ~78 MB video Docker imajına giriyor

| Dosya | Boyut |
|---|---|
| `footer-community.mp4` | 48 MB |
| `hero-people.mp4` | 11 MB |
| `hero-network.mp4` | 7.9 MB |
| `whatmaskot.mp4` | 5.4 MB |
| `herovideo.mp4` | 3.5 MB |
| `earth-night.webm` | 2.9 MB |

Hepsi `public/` altında olduğu için Vite tarafından dokunulmadan `dist/`'e kopyalanır ve Docker
imajına girer. Bu, her deploy'da imaj boyutu ve build süresi maliyeti demektir; ayrıca CDN
olmadan doğrudan origin'den servis edilirler.

> **KANIT:** `public/` dizininin boyut dökümü. `public/` Vite'ta işlenmeyen kopyala-geç dizinidir.

**Durum:** düzeltilmedi (backlog B-12). Çözüm yönü: video varlıklarını Supabase Storage veya bir
CDN'e taşıyıp imajdan çıkarmak.

### Bulgu 11 — [P2] Şüpheli yinelenen görseller

`sweet.png` (586 KB) + `sweet.jpg` (310 KB); `last.png` / `newbg.png` (ikisi de 745 KB — **aynı
boyut**, yüksek olasılıkla aynı dosya); `og-image.png` + `og-image-new.jpg`; ayrıca
`denemeremake.png` ve `yeniinffffffff.png` gibi geçici isimli dosyalar.

> **KANIT:** Dosya boyutu listesi. `last.png` ve `newbg.png`'nin bayt boyutunun bire bir aynı
> olması yineleme için güçlü bir işaret; hash karşılaştırması **yapılmadı**.

**Durum:** düzeltilmedi (backlog B-13). Önce hash karşılaştırması, sonra referans araması,
sonra silme.

### Bulgu 12 — [P2] Tip ve lint borcu

- `tsc -p tsconfig.app.json --noEmit`: **98 hata**. Sınıflandırma: varyant/accent tipleri,
  `ProfilePage` boolean atamaları, artık var olmayan `role_taxonomy_rules` tablosuna referans.
  Bunların hiçbiri eski B1 maddesindeki "`types.ts` bayat" nedeninden kaynaklanmıyor — `types.ts`
  güncel (`cadde_posts`, `revision_request*` tanımlı).
- `npm run lint`: **1280 problem (1060 error, 220 warning)**. Çoğunluğu `no-explicit-any`.
  Bu sayı bu çalışmadan önce de aynıydı; bu çalışmanın ürettiği bir regresyon değil.
- `as any`: 89 kullanım. Component içinde 83 `supabase.from(` + 42 `supabase.rpc(` — yani veri
  erişimi hâlâ `*-api.ts` katmanında toplanmamış.
- 112 dosya >300 satır. En büyükler: `ProfilePage.tsx` 2511, `CommandCenterManager.tsx` 1987,
  `AddWhatsAppPage.tsx` 1611.

> **KANIT:** `tsc -p tsconfig.app.json --noEmit` ve `npm run lint` çıktıları; depo genelinde
> `as any`, `supabase.from(`, `supabase.rpc(` sayımları ve satır sayısı dökümü.

**Durum:** düzeltilmedi (backlog B-7, B-8, B-9 + yeni lint kalemi). `tsconfig` bilinçli olarak
gevşek (`strict: false`); bu bir hata değil, kabul edilmiş bir ödünleşim — ancak 1060 lint
error'un içinde gerçek bir hatanın gizlenme riski yüksektir.

---

## 4. Yapılanlar

### 4.1 nginx güvenlik başlıkları + CSP

Güvenlik başlıkları 5 `location`'da tekrarlandı (`= /env-config.js`, `= /index.html`,
`= /api/chat`, `/assets/`, `= /__prerender_internal`) + server bloğu. CSP tek kaynağa alındı
(`map $host $corteqs_csp`); değişken adı, nginx imajının `20-envsubst-on-templates.sh` scripti
template'i `envsubst`'tan geçirdiği için çakışmaya karşı daraltıldı.

CSP allowlist'i mevcut üçüncü taraflara açıldı: `googletagmanager`, `analytics.ahrefs.com`,
`clarity.ms`, `fonts.googleapis.com`, `fonts.gstatic.com`, `google-analytics`, `c.bing.com`.

`script-src`'de `'unsafe-inline'` **yok**: `index.html`'deki iki inline script (gtag config +
Clarity yükleyici) yeni `public/analytics.js` dosyasına taşındı ve `defer` ile yükleniyor.

`X-Robots-Tag: index, follow` blanket header'ı kaldırıldı — 404 kabuğunda `NotFound`'un
`noindex`'ini gölgeliyordu.

### 4.2 nginx'i tek runtime kaynağı yapma

- `src/lib/redirects.ts` oluşturuldu: `LEGACY_REDIRECTS` (14 statik) +
  `DYNAMIC_LEGACY_REDIRECTS` (2 dinamik). `App.tsx` route'ları artık bu tablodan üretiyor.
- `nginx.conf.template`'e 15 `location = ... return 301 ...$is_args$args` (query string korunur)
  + `/whatsapp-groups/(.+)` regex 301 eklendi.
- `www.` / `mvp.` → apex 301 için ayrı server bloğu.
- Prerender'dan `/admin` ve `/api` hariç tutuldu (`map $uri $prerender_excluded` + birleşik map).
- `/api/chat`'e `limit_req_zone ragchat 12r/m burst=4 nodelay` eklendi.
- `server.mjs`'e "PROD RUNTIME DEĞİLDİR" başlık yorumu eklendi; `legacyRedirectMap` 4 → 15 maddeye
  hizalandı.

### 4.3 SEO helper + 404 noindex

`resolveCanonical()` düzeltildi (Bulgu 6). `NotFound.tsx` artık `useSeo` ile
`robots: "noindex, follow"` yazıyor — soft-404'lerin indekslenmesini durdurur. Her 404'te konsola
kırmızı hata basan `console.error` kaldırıldı.

### 4.4 Sitemap doğruluğu

- `/cadde` `STATIC_ROUTES`'tan çıkarıldı — `RequireAuth` + `RequireFeature(caddeAccess)` arkasında
  olmasına rağmen canlı sitemap'te 107 URL içinde duruyordu.
- `/campaign/vlogger` ve `/campaign/blogger` eklendi. Denetlenen 6 aday rotadan yalnızca bu ikisi
  üç kriteri de geçti (public + `useSeo`/`canonicalPath` + thin content değil). Eklenmeyenler:
  `/19051919/harita` ve `/190519memory` (thin içerik), `/190519idea` ve `/addcom`
  (`useSeo`/`canonicalPath` tanımlamıyor).
- **PostgREST 1000 satır sessiz kesmesi:** ortak `fetchAllRows()` helper'ı ile `Range` başlıklı
  sayfalama eklendi; 5 dinamik fetcher (`blog_posts`, `surveys`, `marquee_items`, `catalog_items`,
  `independent_profiles`) bunu kullanıyor.
- **Anket filtresi drift'i:** `src/lib/surveys.ts` hem `starts_at` hem `ends_at` penceresini
  uyguluyordu, sitemap yalnız `starts_at`'i uyguluyordu → süresi dolmuş anketler sitemap'te
  kalıyordu. İki ayrı `or` parametresi append edildi (PostgREST bunları AND'ler).

**Ölçülen sonuç:** sitemap 107 → 108 URL. Çıkan: `/cadde`. Eklenen: `/campaign/vlogger`,
`/campaign/blogger`.

### 4.5 llms.txt doğruluk düzeltmesi

Bulgu 7'deki 7 ölü çapa gerçek sayfalara yönlendirildi: şehir elçisi → `/commercial/ambassador`,
blogger → `/campaign/blogger`, destekçi → `/founding-1000`, kategoriler → `/directory`.
Eksik public rotalar eklendi (`/radar`, `/anket`, `/commercial`, `/lansman`, `/campaign`,
`/legal/*` 7 sayfa, `/kurulus/<slug>`, `/iletisim`, `/campaign/vlogger`).

**Dokunulmadı (ürün kararı, yalnızca raporlanır):** "164 ülkede 8,8 milyon", "2026'da İstanbul
merkezli", "$1.000 / $10.000 kurucu katkısı" iddiaları.

### 4.6 Ölü kod + script hijyeni

Bulgu 2'deki 5 sayfa silindi; Bulgu 3 ve 4'teki `package.json` düzeltmeleri yapıldı.
`src/lib/dashboard/workspace-doc-pages.tsx` içindeki metin referansları güncellendi.

### 4.7 Test kapsamı — 40 yeni test

Bu çalışmada eklenen testlerin tamamı **drift kilidi** niteliğinde: bir dosyada yapılan değişikliğin
başka bir dosyada karşılığı yoksa test kırılır.

| Dosya | Test | Neyi kilitliyor |
|---|---|---|
| `src/lib/redirects.test.ts` | 10 | `redirects.ts` ↔ `nginx.conf.template` drift'i; CSP tekrar sayısı; `unsafe-inline` yokluğu; `X-Robots-Tag`'in geri gelmemesi |
| `src/lib/seo.test.ts` | 17 | SEO helper davranışı — **bu modülün ilk testleri** |
| `src/App.notfound-seo.test.tsx` | 4 | 404 sayfasının `noindex` yazması |
| `scripts/generate-sitemap.test.mjs` | 9 | `App.tsx`'i parse ederek `STATIC_ROUTES`'ta auth arkasında rota veya redirect kaynağı olmamasını |
| **Toplam** | **40** | |

`src/lib/seo.ts` bu çalışmadan önce **tamamen testsizdi**; canonical hatası (Bulgu 6) bu yüzden
uzun süre fark edilmemiş olabilir.

---

## 5. Açık riskler

### 5.1 Doğrulanamayan: konteyner davranışı

Batch 1 ve 2'nin plandaki kabul kriteri "docker build + curl ile başlık/301 kontrolü"dür.
**Rancher Desktop kapalı olduğu için docker daemon'a bağlanılamadı → konteyner doğrulaması
yapılmadı.**

Yerine `src/lib/redirects.test.ts`, `nginx.conf.template` dosyasının *metnini* denetliyor
(location'lar, 301 hedefleri, CSP tekrar sayısı, `unsafe-inline` yokluğu). Bu gerçek bir
doğrulamadır ama **çalışan nginx'in davranışını kanıtlamaz.**

> **Deploy sonrası zorunlu adımlar:**
> 1. Tarayıcı konsolunda CSP ihlali (`Refused to load...`) kontrolü — özellikle GA, Clarity,
>    Ahrefs ve Google Fonts.
> 2. `curl -I https://corteqs.net/` ile 8 güvenlik başlığının **kök adreste** göründüğünün
>    doğrulanması.
> 3. `curl -I https://www.corteqs.net/` → 301, ve eski legacy URL'lerden 2-3 örnekte 301 kontrolü.

### 5.2 Backlog'a yazılan, uygulanmayan maddeler

| Kod | Madde | Neden uygulanmadı |
|---|---|---|
| B-1 | `index.html` JSON-LD kapsamı: 12 soruluk `FAQPage` (sayfada FAQ var ama çapasız), `Offer` (99 EUR), sabit `dateModified: 2026-07-06`, `BreadcrumbList` tüm rotalarda miras alınıyor | Kullanıcı kararı: dokunma, raporla |
| B-2 | Doğrulanamayan iddialar: "164 ülkede 8,8 milyon", `foundingDate` 2026, `foundingLocation` İstanbul, iki kurucu `Person` kaydı | Ürün/hukuk kararı |
| B-3 | Geçersiz `SearchAction` (hedefi `google.com/search?q=site:`), serbest `SpeakableSpecification`, meta `keywords` | Ürün kararı |
| B-4 | Gerçek HTTP 404 (soft-404'ün tam çözümü) | Sunucu tarafı route bilgisi gerekir — mimari değişiklik |
| B-5 | AI crawler politikası: `robots.txt` GPTBot, CCBot, Google-Extended, Bytespider'a izin veriyor | Ürün kararı |
| B-6 | `Suspense fallback={null}` → lazy chunk yüklenirken boş ekran; LCP etkisi | Ayrı UX çalışması |
| B-7 | Bundle: `recharts`, `d3-geo`, `framer-motion` kullanım haritası yok, `manualChunks` yok, `vite.config.ts`'te ikinci entry (`lansman/index.html`); 98 kalan tsc hatası da buraya ait | Yüksek risk, ayrı çalışma |
| B-8 | 112 dosya >300 satır (`ProfilePage.tsx` 2511, `CommandCenterManager.tsx` 1987, `AddWhatsAppPage.tsx` 1611) | Yüksek risk refactor |
| B-9 | 83 `supabase.from(` + 42 `supabase.rpc(` component içinde; 89 `as any` | Yüksek risk refactor |
| B-10 | `SONDURUM.md` (26 KB) kök konumu — "kökte 4 doküman" kuralını bozuyor | Doküman düzeni kullanıcı kararı |
| B-11 | `public/burak-stripe-rehberi.html` herkese açık (Bulgu 9) | İçerik hassasiyeti kullanıcı kararı |
| B-12 | `public/` altında ~78 MB video (Bulgu 10) | Varlık taşıma kararı |
| B-13 | Şüpheli yinelenen görseller (Bulgu 11) | Önce hash doğrulaması gerek |
| YENİ | `npm run lint` 1280 problem (1060 error) — çoğu `no-explicit-any` | Ayrı temizlik kalemi |

### 5.3 Süreç riski: dokümantasyon güveni

Bu denetimin en tekrar edilebilir bulgusu, bulguların kendisi değil **nasıl bulunduğu**:
`CLAUDE.md`'nin "Known Limitations" listesindeki 7 maddeden 4'ü artık geçersizdi (B1, B3, B4
çözülmüş; B2 kısmen yanlış), 2'sinin sayıları bayattı (B5, B7). Aynı anda, listede hiç yer
almayan bir P0 (Bulgu 1) canlıda etkindi.

**Sonuç:** doküman ipucudur, kaynak değildir. Her denetim turunda envanter sayıları ve runtime
iddiaları yeniden ölçülmelidir. Bu raporun 2.1 tablosu bir sonraki tur için baseline'dır.

---

## 6. Referanslar

Bu denetimde okunan/değiştirilen dosyalar:

```
C:/temp_private/corteqs/corteqs_fin/nginx.conf.template
C:/temp_private/corteqs/corteqs_fin/Dockerfile
C:/temp_private/corteqs/corteqs_fin/server.mjs
C:/temp_private/corteqs/corteqs_fin/package.json
C:/temp_private/corteqs/corteqs_fin/.gitignore
C:/temp_private/corteqs/corteqs_fin/CLAUDE.md
C:/temp_private/corteqs/corteqs_fin/index.html
C:/temp_private/corteqs/corteqs_fin/src/App.tsx
C:/temp_private/corteqs/corteqs_fin/src/lib/redirects.ts
C:/temp_private/corteqs/corteqs_fin/src/lib/redirects.test.ts
C:/temp_private/corteqs/corteqs_fin/src/lib/seo.ts
C:/temp_private/corteqs/corteqs_fin/src/lib/seo.test.ts
C:/temp_private/corteqs/corteqs_fin/src/lib/surveys.ts
C:/temp_private/corteqs/corteqs_fin/src/App.notfound-seo.test.tsx
C:/temp_private/corteqs/corteqs_fin/src/pages/NotFound.tsx
C:/temp_private/corteqs/corteqs_fin/src/lib/dashboard/workspace-doc-pages.tsx
C:/temp_private/corteqs/corteqs_fin/scripts/generate-sitemap.mjs
C:/temp_private/corteqs/corteqs_fin/scripts/generate-sitemap.test.mjs
C:/temp_private/corteqs/corteqs_fin/public/llms.txt
C:/temp_private/corteqs/corteqs_fin/public/analytics.js
```

Silinen dosyalar: `src/pages/MapSearch.tsx`, `src/pages/PostGenerator.tsx`,
`src/pages/CityNews.tsx`, `src/pages/WhatsAppGroupLanding.tsx`, `src/pages/WhatsAppGroups.tsx`.

---

*Rapor tarihi: 2026-08-04. Tüm sayılar bu tarihte ölçülmüştür. Ölçülmeyen değerler açıkça
"ölçülmedi" olarak işaretlenmiştir.*
