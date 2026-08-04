# Dokümantasyon Denetimi — 2026-08-04

**Kapsam:** `CLAUDE.md`, `AGENT_CONTEXT.md`, `ARCHITECTURE.md`, `public/llms.txt`,
`package.json` metaverisi ve `server.mjs` başlık yorumları.
**Amaç:** ana dokümanlardaki her iddiayı repo/canlı sistem üzerinde ölçerek doğrulamak;
bayat olanı bayat, yanlış olanı yanlış olarak işaretlemek.
**Yöntem:** her satır dosya sayımı, `tsc`/`lint`/`build` çıktısı, `Dockerfile` içeriği veya
canlı HTTP yanıtı ile karşılaştırıldı. Tahmine dayalı hiçbir değer bu rapora girmedi;
ölçülemeyen kalemler "ölçülmedi" olarak yazıldı.

Bu denetim, aynı gün yapılan modernizasyon çalışmasının parçasıdır. Değişiklik raporunu
`docs/plans/2026-08-04-modernization-plan.md` ile birlikte okuyun.

---

## 1. Yönetici özeti

| Sınıf | Adet | Açıklama |
|---|---|---|
| Aktif zararlı yanlış (P0) | 1 | `server.mjs` "production runtime" iddiası |
| Bayat sayı / metrik | 6 | dosya sayıları, migration, Edge Function, App.tsx, kök doküman |
| Kapanmış ama açık duran madde | 4 | Known Limitations B1, B3, B4 + B2'nin bir parçası |
| Yanlış teşhis edilmiş madde | 1 | B2'deki `@/lib/radarNews` iddiası |
| Sayısı şişirilmiş açık madde | 2 | B5 (39 → 21), B7 (~103 → 89) |
| Ölü bağlantı / çapa (`llms.txt`) | 7 çapa + 1 redirect | hepsi düzeltildi |

En önemli bulgu bir sayı sapması değil, bir **mimari yanlış tarifi**dir: dokümantasyon
üretim çalışma zamanını yanlış bileşen olarak gösteriyordu ve bu yanlış, ölçülebilir
üretim etkisi yaratmıştı (Bölüm 2).

---

## 2. P0 — "server.mjs Production Runtime" iddiası

### 2.1 Doküman ne diyordu

`CLAUDE.md` → *Important Constraints & Immovable Parts* → madde 3:

```
3. **`server.mjs` Runtime** (Coolify deployment):
   - Generates `/env-config.js` from env vars at startup
   - Proxies `/api/chat` to `rag.corteqs.net`
   - Serves SPA with fallback — keep this behavior
```

Ayrıca *Critical Files* tablosunda:

```
| `server.mjs` | Production runtime; env injection via `/env-config.js` |
```

### 2.2 Gerçek ne

Üretimde uygulama **nginx** ile servis ediliyor. Kanıt `Dockerfile`:

```dockerfile
FROM node:22-alpine AS build
...
RUN npm run build

FROM nginx:1.27-alpine

COPY nginx.conf.template /etc/nginx/templates/default.conf.template
COPY docker-entrypoint-env.sh /docker-entrypoint.d/40-env-config.sh
COPY --from=build /app/dist /usr/share/nginx/html
```

İkinci aşamada `node` imajı tamamen terk ediliyor. Nihai imajda Node çalışma zamanı yok;
`server.mjs` dosyası `dist/` içinde bile değil. `server.mjs` **yalnızca** iki yolda
çalışır: `npm run start` (yerel) ve nixpacks yapılandırması.

Canlı doğrulama (`https://corteqs.net`):

| Ölçüm | Sonuç | Anlamı |
|---|---|---|
| `Server` yanıt başlığı | `nginx/1.27.5` | runtime nginx, Node değil |
| `GET /hakkimizda` | `200` | `server.mjs`'teki 301 haritası devrede değil |
| `GET https://www.corteqs.net/` | `200` | www → apex 301'i devrede değil |

### 2.3 Neden "aktif zararlı", sadece "bayat" değil

Bayat bir metrik yanlış bir sayı gösterir; okuyan kişi yanlış bir tahmin yapar.
Bu iddia ise okuyanı **yanlış dosyayı düzenlemeye** yönlendiriyordu ve düzenleme
sessizce hiçbir şey yapmıyordu — ne test kırılıyor, ne uyarı çıkıyordu.

Bu tam olarak gerçekleşti. `server.mjs` içinde üretim için yazılmış, üretimde **hiç
çalışmamış** dört ayrı davranış vardı:

| Davranış | `server.mjs`'te var mı | Üretimde etkin mi |
|---|---|---|
| Legacy 301 yönlendirmeleri (`legacyRedirectMap`) | Evet (4 madde) | **Hayır** |
| `www.` / `mvp.` → apex 301 | Evet | **Hayır** |
| `/api/chat` rate limit (12 istek/dk) | Evet | **Hayır** |
| Prerender katmanı + `/admin` istisnası | Evet | **Hayır** |

Sonuç SEO tarafında ölçülebilirdi: `/hakkimizda` gibi eski URL'ler 301 yerine 200 + SPA
kabuğu döndürüyordu, yani arama motoru için "iki ayrı sayfa, aynı içerik" görünümü
oluşuyordu. Yönlendirme sinyali hedefe hiç ulaşmıyordu.

### 2.4 Alınan aksiyon

1. Yönlendirme tablosu tek kaynağa taşındı: `src/lib/redirects.ts`
   (`LEGACY_REDIRECTS` 14 statik + `DYNAMIC_LEGACY_REDIRECTS` 2 dinamik).
2. `nginx.conf.template`'e 15 adet `location = … return 301 …$is_args$args` +
   `/whatsapp-groups/(.+)` regex 301 eklendi; `www.`/`mvp.` → apex için ayrı server bloğu
   yazıldı; `/api/chat` için `limit_req_zone ragchat 12r/m burst=4 nodelay` eklendi;
   prerender'dan `/admin` ve `/api` hariç tutuldu.
3. `server.mjs` dosyasının ilk satırlarına kalıcı uyarı yazıldı:

```js
// YEREL / NIXPACKS SUNUCUSU — PROD RUNTIME DEĞİLDİR.
//
// Prod'da uygulama nginx ile servis edilir (Dockerfile → nginx:1.27-alpine +
// nginx.conf.template). Bu dosya yalnızca `npm run start` ve nixpacks yolunda
// çalışır. 2026-08-04'e kadar CLAUDE.md bunu "production runtime" diye tarif
// ediyordu; ...
// SEO/yönlendirme/başlık davranışını BURAYA değil nginx.conf.template'e ekle.
```

4. `server.mjs` içindeki `legacyRedirectMap` 4 → 15 maddeye hizalandı (yerel/nixpacks
   yolunun üretimden sapmaması için).
5. `src/lib/redirects.test.ts` (10 test) `redirects.ts` ↔ `nginx.conf.template`
   ayrışmasını build zamanında kırıyor.

### 2.5 Aynı kök nedenin ikinci sonucu — güvenlik başlıkları

Aynı yanlış tarif, güvenlik başlıklarının hiç denetlenmemesine de yol açmıştı.
nginx'te `add_header` **kalıtılmaz**: kendi `add_header`'ı olan bir `location`, üst
bloktaki tüm `add_header`'ları iptal eder. `location /` → `try_files` → `/index.html`
internal redirect'i `location = /index.html`'e düşüyor ve oradaki tek bir
`Cache-Control` başlığı, server bloğundaki 8 güvenlik başlığını birden düşürüyordu.

Ölçülen durum: `/robots.txt` adresinde 8 güvenlik başlığı **vardı**, `/` adresinde
**0 tanesi** yoktu. Yani login ve admin dahil tüm uygulama CSP'siz ve clickjacking
korumasız servis ediliyordu.

Düzeltme: güvenlik başlıkları 5 `location`'da (`= /env-config.js`, `= /index.html`,
`= /api/chat`, `/assets/`, `= /__prerender_internal`) + server bloğunda tekrarlandı;
CSP tek kaynağa alındı (`map $host $corteqs_csp`); `script-src`'de `'unsafe-inline'`
kullanılmadı — `index.html`'deki iki inline script `public/analytics.js`'e taşındı.

---

## 3. Bayat metrikler — iddia vs. ölçüm

Tüm ölçümler 2026-08-04 tarihinde, aynı gün yapılan değişiklikler **uygulandıktan sonra**
alınmıştır.

| # | Doküman iddiası (kaynak) | Ölçülen gerçek | Sapma |
|---|---|---|---|
| M-1 | "150 page `.tsx` (65 admin), 269 components, 81 lib modules" (`CLAUDE.md` Key Metrics) | pages **209**, components **429**, lib **278** | +39 % / +59 % / +243 % |
| M-2 | "**221** Supabase migrations" | **352** — hepsi `supabase/migrations/applied/` altında; repo kökündeki `supabase/migrations/` içinde **0** adet `.sql` var | +59 % ve **konum da yanlış** |
| M-3 | "**5** Edge Functions: `chat-register`, `find-matches`, `lansman-admin`, `send-submission-email`, `submit-survey-response`" | **7**: `find-matches`, `lansman-admin`, `radar-news-scan`, `relocation-notifications`, `send-notification-emails`, `send-submission-email`, `submit-survey-response` | 2 eksik + var olmayan `chat-register` listeleniyor |
| M-4 | "kökte yalnız 4 doküman" | **5** `.md` (`AGENT_CONTEXT.md`, `ARCHITECTURE.md`, `CLAUDE.md`, `README.md`, `SONDURUM.md`) + `rapor.html` | `README.md` ve `SONDURUM.md` sayılmamış |
| M-5 | "App.tsx ~300 satır, ~75 `lazy()`" | **283** satır, **51** `lazy()` | satır ~doğru, `lazy()` %47 şişik |
| M-6 | "Deployed via Docker (Coolify) with runtime environment injection" | Doğru ama eksik: injection `docker-entrypoint-env.sh` → `/docker-entrypoint.d/40-env-config.sh` üzerinden nginx entrypoint'inde yapılıyor, `server.mjs` üzerinden değil | mekanizma yanlış atfedilmiş |

M-3'teki `chat-register` özellikle dikkat çekicidir: doküman **var olmayan** bir Edge
Function'ı isimle listeliyordu. Bu, metriklerin bir noktada elle yazılıp bir daha hiç
doğrulanmadığının doğrudan kanıtıdır.

### 3.1 Doğru çıkan iddialar

Denetim yalnızca hataları değil, doğrulanan maddeleri de kaydeder:

| İddia | Durum |
|---|---|
| TypeScript relaxed strict mode (bilinçli tercih) | Doğru |
| `@/*` → `src/*` path alias (tsconfig, vite, vitest) | Doğru |
| Tek Supabase client (`src/integrations/supabase/client.ts`), `src/lib/supabase.ts` yok | Doğru |
| `src/contexts/AuthContext.tsx` orphan değil, backward-compat shim | Doğru |
| `userIsAdmin()` → `is_admin()` RPC; `admin_users` tablosu düşürülmüş | Doğru |
| Türkçe metin kuralları (`trIncludes`/`trUpper`, CSV BOM, `npm run verify:text`) | Doğru — `verify:text` 1307 dosyayı UTF-8 doğruladı |
| SEO kilitli URL listesi | Doğru |

---

## 4. Known Limitations B1–B7 — madde madde kapanış

`CLAUDE.md` → *Known Limitations & Refactor Opportunities* bölümü, 7 maddeden **4'ünü**
yanlış veya çoktan çözülmüş olarak listeliyordu.

### B1 — "Generated `supabase/types.ts` out of sync → ~164 tsc errors" → **ÇÖZÜLMÜŞ**

Doküman bunu "highest priority" olarak işaretliyordu. Ölçüm: `types.ts` güncel —
`cadde_posts`, `revision_request*` tabloları tanımlı.
`npx tsc -p tsconfig.app.json --noEmit` çalışma öncesi **103**, çalışma sonrası **98**
hata veriyor. kalan 98 hatanın hiçbiri types.ts senkronizasyonu kaynaklı değil; tamamen
başka sınıflar:

- varyant / accent tip uyuşmazlıkları
- `ProfilePage` içindeki boolean atamaları
- `role_taxonomy_rules` — şemada var olmayan tabloya referans

**Sonuç:** B1 kapatılır. kalan 98 hata yeni backlog maddesi **B-7**'ye (bundle/tip
temizliği) taşındı. B1'in "164 hata" rakamı 2026-06-15'te zaten çözülmüştü
(bkz. proje hafızası: *Types Regen B1 ÇÖZÜLDÜ 2026-06-15*) — doküman 7 hafta boyunca
kapanmış bir maddeyi en yüksek öncelik olarak göstermeye devam etti.

### B2 — "Broken imports: `@/lib/mapEntities`, `@/lib/radarNews`, `html-to-image`" → **KISMEN YANLIŞ, kalanı kapatıldı**

Üç iddiadan **biri yanlış teşhisti**:

| İddia | Doğru mu | Kanıt |
|---|---|---|
| `@/lib/radarNews` eksik | **HAYIR — yanlış** | Modülün gerçek adı `radarNewsPipeline.ts` ve dosya mevcut. Doküman modül adını yanlış yazmış, ardından "eksik" diye raporlamış. Var olmayan bir soruna karşı bir bakım maddesi açılmış. |
| `@/lib/mapEntities` eksik | Evet | `src/pages/MapSearch.tsx` bu modülü import ediyordu, modül yok |
| `html-to-image` eksik | Evet | `src/pages/PostGenerator.tsx` bu paketi import ediyordu, `package.json`'da yok |

Doğru çıkan iki iddianın kaynağı olan sayfalar bu çalışmada silindi. Silinen 5 sayfanın
**hepsi sıfır yerden import ediliyordu ve hiçbir route'a bağlı değildi**:

```
src/pages/MapSearch.tsx             → @/lib/mapEntities yok
src/pages/PostGenerator.tsx         → html-to-image paketi yok
src/pages/CityNews.tsx              → @/lib/diasporaBlogLinks yok
src/pages/WhatsAppGroupLanding.tsx  → @/lib/whatsappLandings yok
src/pages/WhatsAppGroups.tsx        → @/lib/whatsappLandings yok
```

Not: Doküman bunlardan yalnız 2'sini biliyordu. Diğer 3'ü baseline `tsc` çıktısından
çıktı — yani gerçek durum dokümanda yazandan daha kötüydü. Silme sonrası tsc hatası
103 → 98'e düştü.

**Sonuç:** B2 kapatılır; "runtime crash risk" nitelemesi de yanlıştı, çünkü hiçbiri
route'a bağlı değildi ve bundle'a girmiyordu.

### B3 — "`AdminMembersPage.test.tsx` broken" → **GEÇERSİZ**

Adı geçen test dosyası artık yok / geçerli değil. Madde referans bütünlüğünü kaybetmiş.
**Sonuç:** B3 kapatılır.

### B4 — "`AdminLayout.tsx` still large (741 lines) → split" → **ÇÖZÜLMÜŞ**

Ölçüm: `src/components/admin/AdminLayout.tsx` = **6 satır**. Dosya artık yalnızca bir
barrel; gerçek uygulama alt bileşenlere bölünmüş.
**Sonuç:** B4 kapatılır.

### B5 — "~39 imports of `@/contexts/AuthContext`" → **AÇIK, ama sayı yanlış**

Ölçüm: `@/contexts/AuthContext` import eden dosya sayısı **21**.
Madde geçerli (shim hâlâ duruyor), sayı güncellenmeli: 39 → 21.

### B6 — "Mixed data fetching" → **AÇIK, ölçülüp sayısallaştırıldı**

Doküman bunu niteliksel bırakmıştı. Ölçüm: component içinde **83** adet
`supabase.from(` + **42** adet `supabase.rpc(` çağrısı.
Madde geçerli; yeni backlog **B-9**'a sayısal hedefle taşındı.

### B7 — "~103 `as any`" → **AÇIK, sayı yanlış**

Ölçüm: **89**. Madde geçerli, sayı güncellenmeli: ~103 → 89.

Bu maddeye bitişik olarak, dokümanda hiç geçmeyen bir bulgu eklendi:
`npm run lint` **1280 problem (1060 error, 220 warning)** üretiyor — çoğu
`no-explicit-any`. Bu, bu çalışmayla ilgisiz mevcut durumdur ve ayrı bir temizlik
kalemidir. Dokümanın "ESLint: minimal rules, loose style" ifadesi bu hacmi hiç
ima etmiyordu.

### B1–B7 özet tablosu

| Madde | Doküman durumu | Denetim sonucu | Aksiyon |
|---|---|---|---|
| B1 | Açık, "highest priority", 164 hata | Çözülmüş (kalan 98 hata farklı sınıf) | **Kapat**, kalanı B-7'ye taşı |
| B2 | Açık, 3 kırık import, "runtime crash risk" | 1 iddia yanlış (`radarNews`), 2'si doğru ve giderildi | **Kapat** |
| B3 | Açık | Referans edilen dosya yok | **Kapat** |
| B4 | Açık, 741 satır | 6 satırlık barrel | **Kapat** |
| B5 | Açık, ~39 import | Açık, 21 import | **Güncelle** |
| B6 | Açık, niteliksel | Açık, 83 `from(` + 42 `rpc(` | **Güncelle + sayısallaştır** |
| B7 | Açık, ~103 `as any` | Açık, 89 `as any` (+ 1280 lint problemi) | **Güncelle + genişlet** |

---

## 5. `public/llms.txt` — 7 ölü çapa

`llms.txt` LLM tarayıcılarına sunulan yönlendirme dosyasıdır; içindeki her bağlantı
gerçek bir hedefe gitmelidir.

**Bulgu:** dosyadaki 7 çapanın (`#hakkinda`, `#sss`, `#kategoriler`, `#ilgi`, `#destek`,
`#elci`, `#blogger`) **hepsi ölüydü**. Hepsi eski `Index` sayfasına aitti; `Index` bugün
`/landingtrial` yolunda ve `noindex`. Ana sayfa artık `LandingTrialPage` ve DOM'unda
yalnızca `id="main"` ve `id="landingtrial-atlas"` var (ölçüldü).

Ayrıca `https://corteqs.net/blog` bir **redirect**ti; `llms.txt` doğrudan hedef yerine
yönlendirme URL'sini gösteriyordu.

**Düzeltme:**

| Ölü çapa | Yeni hedef |
|---|---|
| şehir elçisi (`#elci`) | `/commercial/ambassador` |
| blogger (`#blogger`) | `/campaign/blogger` |
| destekçi (`#destek`) | `/founding-1000` |
| kategoriler (`#kategoriler`) | `/directory` |
| `/blog` (redirect) | `/radar/rehberler` (doğrudan hedef) |

Eksik public rotalar eklendi: `/radar`, `/anket`, `/commercial`, `/lansman`, `/campaign`,
`/legal/*` (7 sayfa), `/kurulus/<slug>`, `/iletisim`, `/campaign/vlogger`.
Tüm URL'ler `src/App.tsx` route tablosuna karşı doğrulandı — hepsi geçerli, hiçbiri
redirect değil.

**Dokunulmayan (ürün kararı, yalnız raporlanır):** "164 ülkede 8,8 milyon",
"2026'da İstanbul merkezli", "$1.000 / $10.000 kurucu katkısı" iddiaları.
Bunlar dokümantasyon hatası değil, doğrulanmamış pazarlama iddialarıdır; karar
kullanıcınındır (backlog B-2).

---

## 6. `package.json` metaverisi — gizlilik sızıntısı dahil

| Alan | Önce | Sonra |
|---|---|---|
| `name` | `vite_react_shadcn_ts` (şablon artığı) | `corteqs-mvp` |
| `description` | yok | eklendi |
| `engines.node` | yok | `>=22` (Dockerfile `node:22-alpine` ile hizalı) |

**Gizlilik bulgusu:** `import:doctors:dortmund` script'i mutlak bir yerel yol
içeriyordu — `c:\Users\baris-terzioglu\OneDrive - adesso Group\Desktop\...`.
Bu, kullanıcı adını ve işveren adını git geçmişine yazıyordu. Script artık `--csv`
parametresini zorunlu CLI argümanı olarak alıyor (script zaten `"--csv gerekli."`
hatasını üretiyordu, yani gömülü yol hiçbir işlev de görmüyordu).

---

## 7. Doğrulanamayan — dürüst kayıt

Modernizasyon çalışmasının Batch 1 ve Batch 2 kabul kriteri
"`docker build` + `curl` ile başlık ve 301 kontrolü" idi.
**Rancher Desktop kapalı olduğu için docker daemon'a bağlanılamadı → konteyner
doğrulaması YAPILMADI.**

Yerine `src/lib/redirects.test.ts`, `nginx.conf.template` dosyasının **metnini**
denetliyor: `location` blokları, 301 hedefleri, CSP tekrar sayısı, `'unsafe-inline'`
yokluğu, `X-Robots-Tag`'in geri gelmemesi. Bu gerçek bir doğrulamadır — ancak çalışan
nginx'in davranışını kanıtlamaz, yalnızca yapılandırmanın içeriğini kanıtlar.

**Deploy sonrası zorunlu adım:** tarayıcı konsolunda CSP ihlali kontrolü
(`/`, `/login`, `/admin`, `/cadde`) ve `curl -I` ile 301 doğrulaması.

---

## 8. Dokümantasyon çürümesini önleme

Bu denetimin bulguları rastgele değil. Hepsi tek bir yapısal nedenden geliyor:
**dokümandaki hiçbir iddianın makine tarafından doğrulanan bir karşılığı yoktu.**
Sayılar elle yazıldı, doğru oldukları gün doğruydu, ertesi gün sessizce bayatladı.
Bir sayı bayatlayınca hiçbir şey kırılmadı — bu yüzden kimse fark etmedi.

Çözüm iki katmanlıdır: (a) drift'i teste bağlamak, (b) elle yazılan metriği
yeniden ölçülebilir komuta bağlamak.

### 8.1 Değişmez sözleşmeler (testle korunanlar)

Bu sözleşmeler bilinçli olarak "test kırılsın" diye kuruldu. Testi atlatmak için değil,
**ikinci yeri güncellemek** için tasarlandılar.

#### S-1 — Yönlendirme sözleşmesi

> Bir legacy yönlendirme eklerken **üç yer birlikte** güncellenir:
> `src/lib/redirects.ts` (tek kaynak) → `nginx.conf.template` (`return 301`) →
> `src/App.tsx` (client-side savunma katmanı, tablodan otomatik üretilir).

`src/lib/redirects.ts` başındaki yorum bu sözleşmeyi dosyanın kendisine yazar:

```ts
// DEĞİŞMEZ SÖZLEŞME: buraya bir madde eklerken nginx.conf.template'e de karşılık gelen
// `return 301` satırını ekle. src/lib/redirects.test.ts ikisinin ayrışmasını yakalar ve
// build'i kırar — testi atlatmak için değil, ikinci yeri güncellemek için tasarlandı.
```

Koruyucu: `src/lib/redirects.test.ts` (10 test) — `redirects.ts` ↔ `nginx.conf.template`
ayrışması, CSP tekrar sayısı, `'unsafe-inline'` yokluğu, `X-Robots-Tag`'in geri gelmemesi.

Katman ayrımı bilinçlidir ve dokümante edilmiştir: nginx 301'i prod'da ilk sırada
devreye girer (SEO sinyali burada); `App.tsx`'teki `<Navigate>` yalnızca nginx'in
devrede olmadığı yollarda (dev server, nixpacks, client-side gezinme) çalışır.
**İkisi de kalmalı.**

#### S-2 — Sitemap sözleşmesi

> `STATIC_ROUTES` içine bir rota eklenirse, o rota (1) public olmalı,
> (2) `useSeo`/`canonicalPath` tanımlamalı, (3) thin content olmamalı.

Koruyucu: `scripts/generate-sitemap.test.mjs` (9 test) — `src/App.tsx`'i parse ederek
`STATIC_ROUTES`'ta auth arkasında rota veya redirect kaynağı olmadığını doğrular.

Bu sözleşme uygulandığında `/cadde` sitemap'ten düştü (`RequireAuth` +
`RequireFeature(caddeAccess)` arkasındaydı ama canlı sitemap'te 107 URL içinde
duruyordu). `/campaign/vlogger` ve `/campaign/blogger` eklendi. Denetlenen 6 aday
rotadan yalnız bu ikisi üç kriteri de geçti. Sonuç: **107 → 108 URL**.

#### S-3 — SEO canonical sözleşmesi

> Canonical URL host'u **asla** mevcut host'tan türetilmez; `SEO_CANONICAL_ORIGIN`
> sabitinden gelir. Query ve hash canonical'a **girmez**.

Koruyucu: `src/lib/seo.test.ts` (17 test — bu helper'ın ilk testleri) +
`src/App.notfound-seo.test.tsx` (4 test).

Eski davranış `window.location.href` döndürüyordu; bu iki hata üretiyordu:
her filtre kombinasyonu (`/directory?city=Berlin&page=2`) self-canonical oluyordu ve
canonical host `www.`/`mvp.`/`localhost` olabiliyordu.

#### S-4 — Türkçe metin sözleşmesi (mevcut, korunur)

> Kullanıcıya görünen Türkçe metinlerde `src/lib/text-normalization.ts` kullanılır.
> Koruyucu: `npm run verify:text` (`predev`/`prebuild`/`prelint`/`pretest`'te otomatik).

Bu sözleşme zaten çalışıyordu ve bu denetimde **hiç ihlal bulunmadı** (1307 dosya
UTF-8 doğrulandı). Diğer sözleşmelerin şablonu budur: doğru davranışı bir komuta bağla,
komutu build'e bağla.

### 8.2 Metriklerin yeniden ölçümü

`CLAUDE.md` Key Metrics bölümüne aşağıdaki komut bloğu eklenmeli. Bir metrik
güncellenecekse **komut yeniden çalıştırılır**, hafızadan yazılmaz.

```bash
# --- Kod tabanı büyüklüğü ---
find src -type f \( -name "*.ts" -o -name "*.tsx" \) | wc -l   # toplam src dosyası
find src/pages      -type f -name "*.tsx" | wc -l              # pages
find src/components -type f \( -name "*.ts" -o -name "*.tsx" \) | wc -l   # components
find src/lib        -type f \( -name "*.ts" -o -name "*.tsx" \) | wc -l   # lib

# --- Testler ---
find src scripts supabase workers -type f -name "*.test.*" | wc -l
find . -path ./node_modules -prune -o -name "*.spec.ts" -print | wc -l   # Playwright

# --- Veritabanı / fonksiyonlar ---
find supabase/migrations -name "*.sql" | wc -l            # TOPLAM (applied dahil)
find supabase/migrations -maxdepth 1 -name "*.sql" | wc -l # kökte bekleyen (olmalı: 0)
ls supabase/functions                                      # Edge Function listesi

# --- Dokümantasyon düzeni ---
ls *.md                                                    # kök doküman sayısı

# --- Routing ---
wc -l < src/App.tsx
grep -c "lazy(" src/App.tsx

# --- Teknik borç göstergeleri ---
grep -rl "@/contexts/AuthContext" src | wc -l    # auth shim import sayısı (B5)
grep -ro "as any" src | wc -l                    # (B7)
grep -rn "console\.log" src | wc -l              # olmalı: 0
grep -ro "supabase\.from(" src/components src/pages | wc -l   # (B6/B-9)
grep -ro "supabase\.rpc("  src/components src/pages | wc -l   # (B6/B-9)

# --- Kapılar ---
npx tsc -p tsconfig.app.json --noEmit    # tip hatası sayısı
npm run lint                             # problem sayısı
npm run verify:text                      # UTF-8 / mojibake
npm run test                             # sözleşme testleri dahil
npm run build                            # exit 0 olmalı

# --- Sitemap ---
node scripts/generate-sitemap.mjs
grep -c "<loc>" public/sitemap.xml
```

### 8.3 Kural önerileri

1. **Sayı yazarken tarih ve komut yaz.** `CLAUDE.md` Key Metrics bloğu
   "Key Metrics (ölçüm: `<komut>`, tarih: YYYY-MM-DD)" formatına geçmeli.
   Tarihsiz sayı, geçersiz sayıdır.
2. **Known Limitations maddesi kapanışı zorunlu.** Bir madde çözüldüğünde aynı PR'da
   dokümandan silinir. B1 ve B4'ün 7 hafta boyunca "açık" durması bu kuralın
   yokluğundandır.
3. **Mimari iddialar dosyanın kendisine yazılır.** "Bu dosya prod'da çalışmaz" bilgisi
   `CLAUDE.md`'de değil, `server.mjs`'in ilk satırında durmalı — çünkü orayı düzenleyen
   kişi `CLAUDE.md`'yi o an okumaz. Bu yapıldı.
4. **Var olmayan bir şeyi listelemek, eksik listelemekten kötüdür.** `chat-register`
   (olmayan Edge Function) ve `@/lib/radarNews` (yanlış modül adı) örnekleri, elle
   tutulan listelerin yalnızca bayatlamakla kalmayıp **uydurma** üretebildiğini gösteriyor.
   Liste tutmak yerine listeyi üreten komutu yazın.
5. **Bir bakım maddesi açmadan önce iddiayı ölçün.** B2'nin `radarNews` kalemi hiç var
   olmamış bir soruna karşı açılmıştı; 3 gerçek ölü sayfayı ise hiç görmemişti.

---

## 9. Güncellenmesi gereken doküman satırları (eylem listesi)

| Dosya | Bölüm | Aksiyon |
|---|---|---|
| `CLAUDE.md` | Key Metrics | M-1…M-5 sayılarını güncelle; ölçüm komutu + tarih ekle |
| `CLAUDE.md` | Important Constraints md. 3 | `server.mjs Runtime` → `nginx Runtime`; env injection'ı `docker-entrypoint-env.sh`'a atfet |
| `CLAUDE.md` | Critical Files tablosu | `server.mjs` satırını "yerel/nixpacks, prod değil" olarak düzelt; `nginx.conf.template` ve `src/lib/redirects.ts` satırlarını ekle |
| `CLAUDE.md` | Database & Migrations | 221 → 352; migration konumunu `applied/` olarak yaz |
| `CLAUDE.md` | Edge Functions | 5 → 7; `chat-register`'ı kaldır, 3 yeni fonksiyonu ekle |
| `CLAUDE.md` | Doküman düzeni notu | "4 doküman" → 5 `.md` + `rapor.html` (veya `SONDURUM.md` `docs/` altına taşınsın — backlog B-10) |
| `CLAUDE.md` | Known Limitations | B1/B2/B3/B4 sil; B5/B6/B7 sayılarını güncelle; lint 1280 problemini ekle |
| `CLAUDE.md` | (yeni) Sözleşmeler | S-1…S-4 değişmez sözleşmelerini ekle |
| `ARCHITECTURE.md` | runtime bölümü | nginx katmanını (301'ler, CSP, rate limit, prerender istisnası) belgele |
| `AGENT_CONTEXT.md` | hızlı bağlam | server.mjs/nginx düzeltmesini yansıt |

---

## 10. Sonuç

Denetlenen dokümantasyonun **niteliksel** kısmı (mimari desenler, Cadde kuralları, rol
sistemi, Türkçe metin kuralları, SEO kilitli URL'ler) büyük ölçüde doğru ve değerlidir.
Çürüyen kısım **niceliksel ve altyapısal** kısımdır: elle yazılmış sayılar ve tek bir
yanlış runtime tarifi.

Sayı sapmaları can sıkıcıdır ama zararsızdır. Runtime tarifi zararlıydı: dört ayrı
üretim davranışının (301'ler, www yönlendirmesi, rate limit, prerender istisnası)
hiç çalışmamasına ve tüm uygulamanın güvenlik başlıksız servis edilmesine yol açtı —
ve hiçbir test, hiçbir uyarı bunu yakalamadı.

Alınan asıl ders bir sayıyı düzeltmek değil: **dokümantasyondaki her önemli iddianın
ya bir testi ya da bir yeniden ölçüm komutu olmalı.** Bölüm 8'deki sözleşmeler ve
komut bloğu bu boşluğu kapatmak için kuruldu.

---

*Denetim tarihi: 2026-08-04 · Kapsam: `CLAUDE.md`, `ARCHITECTURE.md`, `AGENT_CONTEXT.md`,
`public/llms.txt`, `package.json`, `server.mjs` · Ölçüm ortamı: Windows 11, Node 22,
repo `main` @ 77bd9f1 + çalışma dizini değişiklikleri*
