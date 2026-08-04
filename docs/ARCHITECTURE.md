# CorteQS — Sistem Mimarisi (Tek Ana Doküman)

> **Bu, projenin TEK bakımlı mimari dokümanıdır.** Mimari bir karar değiştiğinde burası güncellenir.
> Eski mimari dokümanlar `docs/archive/architecture/` altında dondurulmuştur (AI_TECHNICAL_REFERENCE,
> SISTEM_MIMARI, PROJECT_TECHNICAL_OVERVIEW vb. — tarihsel referans, bakımı yapılmaz).
> **Güncelleme:** 2026-08-04 · Runtime/SEO modernizasyonu (nginx tek runtime kaynağı, güvenlik
> başlıkları + CSP, `src/lib/redirects.ts` tek yönlendirme kaynağı, canonical/sitemap düzeltmeleri).
> Önceki büyük güncelleme: 2026-06-11 · Cadde 3.0 E2E rebuild (Faz 0–9 + kuyruk) ve kök temizliği.
>
> Hızlı bağlam için: `docs/AGENT_CONTEXT.md` · Kurallar: `CLAUDE.md` (kök) · Durum panosu: `docs/status/rapor.html` · Doc indeksi: `docs/README.md`

---

## 1. Genel Bakış

**CorteQS** — Türk diasporası topluluk platformu. Tek SPA içinde: kurumsal landing, üye dizini +
katalog, **Cadde** (sosyal akış + Cafe + Çarşı + Tanıtım), anketler, muhasebe, workspace ve admin paneli.

```
React 18 + Vite 5 (SWC)  ·  TypeScript (strict KAPALI — bilinçli)  ·  Tailwind + shadcn/ui
@tanstack/react-query 5  ·  react-router-dom 7  ·  zod + react-hook-form
Supabase: Postgres + RLS + security-definer RPC'ler + Auth + Realtime + 7 Edge Function
Deploy: Docker/Coolify → npm run build → nginx 1.27-alpine (301'ler + güvenlik başlıkları + CSP +
        prerender proxy + RAG proxy + SPA fallback).  server.mjs PROD RUNTIME DEĞİLDİR — bkz. §6.
Canlı: corteqs.net · Supabase proje: injprdrsklkxgnaiixzh
```

Ölçülen büyüklük (2026-08-04): `src` altında 989 `.ts/.tsx` — 209 sayfa, 429 component, 278 lib
modülü; 202 test dosyası + 18 Playwright `.spec.ts`; 352 migration; 7 Edge Function.

**Temel mimari ilke:** Kural DB'de yaşar. Yazma işlemleri security-definer RPC'lerden geçer,
RLS okumayı sınırlar; frontend yalnız yol gösterir (Zod ilk hat, Türkçe hata mesajları).

---

## 2. Frontend Mimarisi

### 2.1 Route ağacı

- `src/App.tsx` — tüm public + cadde rotaları (51 `lazy()` ile code-split, 283 satır).
- `src/pages/admin/routes.tsx` — `/admin` alt ağacının tamamı (AdminLayout + RequireAuth).
  `src/components/admin/AdminLayout.tsx` artık yalnızca 6 satırlık bir barrel'dır; gerçek layout
  alt bileşenlere bölünmüştür.
- Modül alt ağaçları **routes.tsx deseniyle** ayrışır: `pages/admin/muhasebe/routes.tsx` (referans),
  `pages/admin/cadde/routes.tsx` (cadde admin: index/promotions/moderation/carsi).
- **Legacy yönlendirmeler App.tsx'te elle yazılmaz** — `src/lib/redirects.ts` tablosundan üretilir
  (§6.4). Yeni bir eski URL'yi emekliye ayırırken önce o dosyaya, sonra `nginx.conf.template`'e ekle.
- **SEO kilitli path'ler değiştirilemez:** `/lansman`, `/cadde` (+alt rotaları), `/19051919`,
  `/anket`, `/commercial/<slug>`, `/founders`, `/directory`, `/iletisim`.
- **Commercial dokümanlar SPA rotasıdır:** `/commercial/<slug>` içeriği `src/content/commercial/*.html`
  fragmanlarından `CommercialDocumentPage` ile render edilir — fragmanlar TEK içerik kaynağıdır.
  Kökteki `info-*.html` dosyaları ve extract adımı kaldırıldı; `vite.config.ts` yalnızca eski
  `*.html` URL'leri için **statik 301 stub'ları** emit eder. `lansman/index.html` ayrı build
  input'tur. **Bu mantığa dokunma.**

### 2.2 Katmanlama (feature başına)

```
lib/<modul>-api.ts        → Supabase okuma + RPC mutation sarmalayıcıları
lib/<modul>-schemas.ts    → Zod sınır doğrulaması (Türkçe mesajlı)
lib/<modul>-types.ts      → Row + domain tipleri
lib/<modul>-query-keys.ts → React Query anahtar fabrikaları (prefix-invalidation kökleri)
components/<modul>/       → UI kapsülü     pages/<modul>/ → sayfalar (+routes.tsx)
```
Referans uygulamalar: `muhasebe-*` (ilk örnek) ve `cadde-*` (en kapsamlı/güncel örnek).
Yeni kodda component içi `supabase.from()` YOK — `*-api.ts` + React Query.

### 2.3 Auth

- Canonical: `src/components/auth/` (AuthProvider, `useAuth`, RequireAuth, RequireFeature).
  Yeni kod **yalnız** `@/components/auth/useAuth` import eder.
- `src/contexts/AuthContext.tsx` geriye-uyum shim'idir (canonical'a delege; 21 eski import) — B5'te kalkacak.
- Yetki zinciri: Supabase Auth → session context → `RequireAuth` (route) → `RequireFeature`/
  `useFeatureFlags` (feature) → DB'de `is_admin()`/`is_moderator()`/`has_cadde_feature()`.

### 2.4 Her public sayfanın borcu

Public bir sayfa eklerken üç şey zorunludur — detay §6.5:
`useSeo({ canonicalPath })` (canonical + prerender'ın beklediği `render-complete` olayı) ·
sitemap `STATIC_ROUTES` kriterlerine uygunluk kontrolü · yeni bir eski URL emekliye ayrılıyorsa
`src/lib/redirects.ts` + `nginx.conf.template` (§6.4).

---

## 3. Kimlik, Rol ve AFS Modeli (canlı 2026-06-09)

Tek sistem; legacy `profiles`/`user_profiles`/`admin_users`/`role_feature_defaults` DROP edildi.

```
auth.users → user_role_assignments (user↔rol, TEK yer) → roles (76 FLAT rol, 75 aktif; aile/parent YOK
                                                          — User_Standard 2026-06-11'de User_DiasporaMember'a konsolide, pasif)
user_profile_attributes  → tüm profil verisi attribute olarak (afs_attributes sözlüğü, 53)
user_feature_overrides   → kullanıcı bazlı feature istisnası
AFS kuralları: role_attributes / role_features / role_sections  (afs_features 42, afs_sections 7)
Feature çözümleme: override > role_features default > false   (cadde tarafında + ban kill-switch)
```

**Katalog:** `catalog_items` (+roles/+attribute_values/+claims/+managers + ~15 uydu tablo) —
item-type/`*_details` sistemi kaldırıldı. Claim akışı: submit RPC → admin onay → manager kaydı.
Detay raporlar: `docs/catalog-role-afs-rebuild/`.

**Profil presentation config katmanı (2026-06-12):** `src/lib/profile-presentation.ts` —
flat rol anahtarından yalnızca *görsel* profil kararlarını çözer (accent, hero varyantı,
primary CTA önceliği, section sırası). Public profil view-model'i ve `/profile` editörü aynı
resolver'ı kullanır; tanımsız roller generic fallback alır. Şu an tek özel config
`Experimental_2` premium pilotudur (`experimental-2-premium`); yeni role premium görünüm
vermek = config'e entry eklemek. Yetki/visibility kuralları bu katmana TAŞINMAZ.
Plan/detay: `docs/plans/profile-premium-experimental-2-pilot.md`.

---

## 4. Cadde 3.0 (E2E rebuild — canlı 2026-06-11)

Şehir bazlı diaspora sosyal platformu. 6 alt modül, ~30 RPC, 14 migration (`cadde300_001–014`,
canlı son sürüm `20260611160000`). Kapanış raporu: `docs/cadde-300/change-report.md`.

### 4.1 Modüller

| Modül | Özet |
|---|---|
| **Profil kapısı** | `get_cadde_actor_context()` tek RPC; ülke+şehir (+flag açıksa telefon) eksikse blur + CTA. Fail-open UI, enforce DB'de. |
| **Feed + ranking** | `list_cadde_feed_v1`: CKS band A–F + skor + `hashtext` deterministik random + keyset cursor. Çoklu geo filtre URL'de (`?country=A,B`). İlgi alanları (13'lük katalog) band-A eşleşmesini besler. "Yeni post" chip'i (60 sn sayım; stream yok). |
| **Köprü** | TR↔diaspora ortak akışı. Truth table: diaspora=serbest; TR bireysel=`indiv_relocating`; TR kurumsal=`digital_community_enabled`; admin override. TR yerleşik normal Cadde'de yalnız @Türkiye'ye paylaşır. |
| **Cafe** | Süreli odalar (1–6 saat): entry_mode `open/approval/referral` (kod sha256 hash), kapasite, üye onay paneli, read-only arşiv, cafe-içi feed (`visibility='cafe'` — ana akışa sızmaz), kapanış-yaklaşıyor bildirimi (pg_cron `*/10`). |
| **Çarşı** | U2U pazar: 7 kategori, 30 gün ilan ömrü, aktif ilan limiti (ayarlardan), pasife al/yayına al/sil, "ilanınla ilgilenildi" bildirimi. **Tanıtım'dan tamamen ayrı (D-01).** |
| **Tanıtım** | Sponsorlu görünürlük: kampanya (pending→admin onayı→tarih aralığında yayın), 6 placement, zorunlu "Sponsorlu" rozeti, 4 organik postta 1 kart (feed'de kampanya başına max 2), impression/click (saatlik abuse limiti — aşımda sessiz false). Şehir Elçisi yalnız ücretsiz highlight. |
| **Bildirim + moderasyon** | Üretim yalnız `cadde_notify` definer'ından; realtime yalnız `user_id=eq.<uid>` kanalı. Şikayet→kuyruk→`admin_moderate_cadde_entity_v1` (dismiss/hide/publish/ban ±, audit'li). Otomatik içerik taraması trigger'la kuyruğa düşürür (yayını engellemez). |
| **Çoklu diaspora** | `diaspora_key (tr/in/cn/ph)` tüm içerik tablolarında; feed/promotion RPC'leri eşitlik filtresi uygular — diasporalar arası sızıntı yok. `useCaddeDiasporaKey()` (provider'sız 'tr' fallback). |

### 4.2 Değişmez sözleşmeler

1. **RPC-only mutation** — cadde içerik tablolarında kullanıcıya açık INSERT policy yok.
2. **SQL↔TS aynaları** (testli; birini değiştiren diğerini günceller):
   `can_post_kopru` ↔ `src/lib/cadde-rules.ts` · `list_cadde_feed_v1` ↔ `cadde-ranking.ts` ·
   `can_join_cadde_cafe` ↔ `canJoinCafeRule`. Otomatik tarama regex'i ↔ `CAFE_NAME_BLOCKLIST`.
3. **Ban kill-switch** `has_cadde_feature` içinde — yeni yazma RPC'leri otomatik kapsanır.
4. **`cadde_settings`** — tüm limit/flag'ler (telefon zorunluluğu D-03, cafe 3/gün–10/gün–6saat,
   çarşı 5 ilan–30 gün, yorum 5/dk, reaksiyon 30/dk, rapor 10/gün) SQL update'iyle değişir.
5. **Hata kodları** `cadde_*` sabitleri → `cadde-rules.ts` Türkçe haritası (yeni kod eklersen haritaya da ekle).
6. `user_verifications` dışa kapalı telefon truth source'udur; ham `phone` attribute'u doğrulama sayılmaz.

### 4.3 Legacy durumu (Faz 9)

`feed_posts / feed_likes / cafes / cafe_memberships / user_follows`: yazma kapalı, policy'siz,
COMMENT'li; 7 legacy trigger silindi; 22 dead frontend dosyası kaldırıldı.
**DROP süreci (karar 2026-06-11: bekle-gözle):** deploy → 1–2 hafta log gözlemi → karar dokümanı →
DROP migration (`user_follows` 1 satır R-06 notuyla). Bu tablolara yeniden policy/grant açılmaz.

---

## 5. Veritabanı Operasyonları

- **Migration konumu ve sayısı:** 352 migration, hepsi `supabase/migrations/applied/` altında.
  Repo kökündeki `supabase/migrations/` dizininde 0 adet `.sql` vardır — yeni bir migration
  ararken `applied/` alt klasörüne bak.
- **Migration kuralı:** silme/yeniden sıralama yok — yalnız yeni dosya, artan timestamp.
  Canlı son sürümü her zaman doğrula: `select max(version) from supabase_migrations.schema_migrations`.
  Dosyanın uygulanmış olması `schema_migrations` kaydının var olduğu anlamına gelmez; ikisi ayrı
  ayrı doğrulanır.
- **Bu makinede Docker yok** → `supabase db push/reset` çalışmaz. Uygulama: psql (IPv4 pooler
  `aws-1-eu-west-2.pooler.supabase.com:5432`, user `postgres.injprdrsklkxgnaiixzh`, şifre
  `.env.local → SUPABASE_DB_PASSWORD`, `PGCLIENTENCODING=UTF8`) + `schema_migrations`'a manuel INSERT.
- **Types regen (B1 — ÇÖZÜLDÜ):** `src/integrations/supabase/types.ts` güncel (cadde ve
  revision_request tabloları tanımlı). Yenilemek gerekirse:
  `npx supabase gen types typescript --project-id injprdrsklkxgnaiixzh` — geçerli
  `SUPABASE_ACCESS_TOKEN` gerekir. `tsc -p tsconfig.app.json --noEmit` bugün **98 hata**
  döner ve bunların hiçbiri types.ts kaynaklı değildir (varyant/accent tipleri, ProfilePage
  boolean atamaları, mevcut olmayan `role_taxonomy_rules` tablosu).
- **Edge Function (7):** `find-matches`, `lansman-admin`, `radar-news-scan`,
  `relocation-notifications`, `send-notification-emails`, `send-submission-email`,
  `submit-survey-response`.
- pg_cron canlıda kurulu; `cadde-cafe-expiring` işi `*/10 * * * *`.

---

## 6. Deploy & Runtime

### 6.1 Çalışma zamanı topolojisi — iki ayrı yol

| Ortam | Runtime | Nasıl seçilir |
|---|---|---|
| **Prod (Coolify / Docker)** | **nginx 1.27-alpine** | `Dockerfile` → `FROM nginx:1.27-alpine`; `nginx.conf.template` imaja `/etc/nginx/templates/default.conf.template` olarak kopyalanır, nginx imajının `20-envsubst-on-templates.sh` scripti `envsubst`'tan geçirir. |
| **Yerel / nixpacks** | `node server.mjs` | Yalnız `npm run start` ve nixpacks yolunda çalışır. |

> **`server.mjs` PROD RUNTIME DEĞİLDİR.** Uzun süre öyle sanıldı ve maliyeti şuydu: sadece
> server.mjs'te tanımlı olan 301 yönlendirmeleri, www→apex birleştirmesi ve `/api/chat`
> rate-limit'i canlıda hiç devrede olmadı (kanıt: `Server: nginx/1.27.5`, `/hakkimizda` → 200,
> `https://www.corteqs.net/` → 200). **Runtime davranışı değiştiren her değişiklik
> `nginx.conf.template`'e yazılır**; server.mjs yalnızca yerel eşdeğerliği korumak için
> hizalanır (dosyanın başındaki uyarı yorumuna bak).

Kaynak: `Dockerfile` · `nginx.conf.template` · `server.mjs` (yerel) · `src/lib/redirects.ts` (tablo).

### 6.2 İstek akışı (prod, nginx)

```
istek
 └─ host www.corteqs.net / mvp.corteqs.net?  → 301 https://corteqs.net$request_uri   (ayrı server bloğu)
 └─ eski URL mü? (location = /hakkimizda, /blog, /auth, … 15 adet)
        → 301 hedef$is_args$args            (query string KORUNUR)
    /whatsapp-groups/<id>                    → 301 /addcom?group=<id>   (regex location)
 └─ POST /api/chat?  → limit_req ragchat 12r/m burst=4 nodelay
        → yalnız POST + application/json (aksi 405 / 415)
        → proxy_pass https://rag.corteqs.net/api/chat  (Authorization sunucu tarafında eklenir)
 └─ uzantılı statik dosya (~* \.[a-z0-9]+$) → try_files $uri =404
        /assets/  → immutable 1 yıl cache · /index.html, /env-config.js → no-store
 └─ location /
        bot user-agent VE $uri /admin|/api DEĞİL VE PRERENDER_URL dolu?
              → internal rewrite /__prerender_internal
                 → proxy_pass <PRERENDER_URL>/https%3A%2F%2Fcorteqs.net<path>
                 → hata/timeout: error_page 5xx =200 /index.html  (graceful, asla 5xx)
        değilse → try_files $uri $uri/ /index.html   (SPA fallback)
```

Prerender'da `/admin` ve `/api` **map ile dışlanır** (`$prerender_excluded`) — auth arkasındaki
paneli prerender servisine göndermek hem anlamsız hem maliyetlidir. `$is_bot` ile
`$prerender_excluded` tek bir birleşik map'te (`"1:0"`) çarpıştırılır; `__PRERENDER_URL__` boşsa
entrypoint bunu `0` yapar ve prerender no-op olur.

### 6.3 Güvenlik başlıkları + CSP — tekrarlar kopya değildir

**nginx'te `add_header` KALITILMAZ.** Kendi `add_header`'ı olan bir location, üst bloktaki *tüm*
`add_header`'ları iptal eder. Bu yüzden 8 güvenlik başlığı server bloğunun yanı sıra kendi
Cache-Control'ünü ekleyen **5 location'da tek tek tekrarlanır**: `= /env-config.js`,
`= /index.html`, `= /api/chat`, `/assets/`, `= /__prerender_internal`.

> Bu tekrar 2026-08-04'ten önce yoktu. Sonuç: `location /` → `try_files` → `/index.html` internal
> redirect'i `location = /index.html`'e düşüyor, oradaki Cache-Control `add_header`'ı server
> bloğundaki 8 başlığı birden düşürüyordu. `/robots.txt`'te başlıklar görünürken `/` adresinde
> sıfır başlık dönüyordu — yani login ve admin dahil **tüm uygulama CSP'siz ve clickjacking
> korumasız** servis ediliyordu. **Yeni bir location eklerken içinde `add_header` varsa güvenlik
> bloğunu da kopyala.**

- **CSP tek kaynaktır:** `map $host $corteqs_csp` (değişken adı `envsubst` çakışmasına karşı
  daraltılmıştır). Bir üçüncü taraf host'una izin verirken beş ayrı yeri güncelleme riski yoktur.
- **`script-src`'de `'unsafe-inline'` YOKTUR ve eklenmemelidir.** `index.html`'deki gtag config ve
  Clarity yükleyicisi bu yüzden `public/analytics.js`'e taşındı (defer ile yüklenir). Yeni script
  eklerken host'u `script-src`'e (gerekiyorsa `connect-src`/`img-src`'e) ekle, inline yazma.
- `style-src`'deki `'unsafe-inline'` bilinçlidir (Tailwind/shadcn runtime inline style üretir);
  kaldırmak nonce altyapısı ister — bugün yok.
- **`X-Robots-Tag: index, follow` blanket header'ı kaldırıldı** — 404 kabuğunda NotFound'un
  noindex'ini gölgeliyordu. Geri ekleme.

### 6.4 Yönlendirme katmanı — `src/lib/redirects.ts` tek kaynak

Eski URL listesi üç ayrı yerde farklı içerikle duruyordu (App.tsx 14 madde, server.mjs 4 madde,
nginx 0 madde). Artık **tek kaynak `src/lib/redirects.ts`**: `LEGACY_REDIRECTS` (14 statik) +
`DYNAMIC_LEGACY_REDIRECTS` (2 dinamik).

| Tüketici | Rolü |
|---|---|
| `nginx.conf.template` | **Gerçek 301'ler** (15 `location =` + `/whatsapp-groups/(.+)` regex). Botların ve tarayıcıların gördüğü tek doğru sinyal. |
| `src/App.tsx` | Client-side savunma: tablodan `<Navigate>` route'ları üretilir (SPA içi geçişler ve nginx atlanan yollar için). |
| `server.mjs` | Yerel/nixpacks yolu; `legacyRedirectMap` 15 maddeye hizalandı. |

`src/lib/redirects.test.ts` (10 test) drift'i **build'i kırarak** kilitler: her tablo maddesinin
nginx karşılığı, 301 hedefleri, CSP tekrar sayısı, `script-src`'de `'unsafe-inline'` yokluğu ve
`X-Robots-Tag`'in geri gelmemiş olması. Bir yönlendirme eklerken **önce `redirects.ts`, sonra
`nginx.conf.template`** — test aksini kabul etmez.

### 6.5 SEO / GEO katmanı

**Canonical (`src/lib/seo.ts`).** `resolveCanonical()` artık **sabit origin + yalnız pathname**
kullanır: `SEO_CANONICAL_ORIGIN` (`https://corteqs.net`) + `normalizePath(window.location.pathname)`
(kök dışındaki trailing slash atılır). Önceden `window.location.href` dönüyordu; iki hata birden
üretiyordu — (1) query + hash canonical'a sızıyor, her filtre kombinasyonu self-canonical oluyordu
(`/directory?city=Berlin&page=2`), (2) canonical host mevcut host'tan geliyordu (`www.`/`mvp.`/
`localhost`). Sayfaya özel canonical için `useSeo({ canonicalPath })` ver.
Testler: `src/lib/seo.test.ts` (17 test — bu helper'ın ilk testleri).

**Prerender sözleşmesi.** `seo.ts` meta yazımını bitirince `document.dispatchEvent(new Event(
"render-complete"))` yayınlar. Prerender servisi sayfayı **bu olaya kadar** bekler; `useSeo`
çağırmayan bir public sayfa prerender'a yarım DOM verir. **Public bir sayfa eklerken `useSeo`
zorunludur.**

**404 / soft-404.** `NotFound.tsx` `useSeo` ile `robots: "noindex, follow"` yazar — SPA fallback
gerçek HTTP 404 dönemediği için soft-404'lerin indekslenmesini bu durdurur. Her 404'te kırmızı
`console.error` basan davranış kaldırıldı. Testler: `src/App.notfound-seo.test.tsx` (4 test).
*(Gerçek sunucu tarafı 404 backlog'dadır — route bilgisi nginx'te yok.)*

**Sitemap (`scripts/generate-sitemap.mjs`, `prebuild` ile otomatik koşar → `public/sitemap.xml`).**
`STATIC_ROUTES`'a bir rota **ancak üç kriteri birden geçerse** girer:
1. gerçekten public (auth/`RequireAuth`/`RequireFeature` arkasında değil),
2. `useSeo` + `canonicalPath` tanımlıyor,
3. thin content değil (tek dış link butonu, boş form kabuğu vb. sayılmaz).

Bu kural gereği `/cadde` çıkarıldı (`RequireAuth` + `RequireFeature(caddeAccess)` arkasında),
`/campaign/vlogger` ve `/campaign/blogger` eklendi; `/19051919/harita`, `/190519memory`,
`/190519idea`, `/addcom` **bilinçli olarak eklenmedi**. Ölçülen sonuç: 107 → **108 URL**.
Dinamik fetcher'lar (blog_posts, surveys, marquee_items, catalog_items, independent_profiles)
ortak `fetchAllRows()` üzerinden **Range başlıklı sayfalama** yapar — PostgREST'in 1000 satır
sessiz kesmesi buradaydı. Anket penceresi `src/lib/surveys.ts` ile aynı: hem `starts_at` hem
`ends_at` uygulanır (iki ayrı `or` parametresi; PostgREST bunları AND'ler).
`scripts/generate-sitemap.test.mjs` (9 test) `App.tsx`'i parse ederek `STATIC_ROUTES`'ta auth
arkasında rota veya redirect kaynağı bulunmadığını doğrular.

**`public/llms.txt` (GEO).** LLM/AI crawler'lara yönelik insan okunur site haritası — sitemap.xml'in
makine değil *model* karşılığı. Kural: **her URL App.tsx route tablosunda var olmalı ve redirect
olmamalı**; çapa (`#...`) verilecekse hedef sayfanın DOM'unda o `id` gerçekten bulunmalı. 2026-08-04
denetiminde 7 çapanın hepsi ölüydü (eski Index sayfasına aitti; Index bugün `/landingtrial`'da ve
noindex) ve `/blog` bir redirect'ti — gerçek hedeflere çevrildi.

### 6.6 Env & doğrulama

```
Build-time env: VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY / VITE_SUPABASE_PROJECT_ID
Runtime-only (frontend'e gitmez): SUPABASE_SERVICE_ROLE_KEY, RAG_API_SECRET
Runtime env injection: /env-config.js (Coolify; no-store)
nginx template placeholder'ları: __PRERENDER_URL__, __PRERENDER_CANONICAL_HOST__, __RAG_API_SECRET__
Doğrulama: BASE_URL=https://corteqs.net npm run verify:release
```

Pre-hook: `verify:text` (encoding bekçisi) `src/public/docs/scripts` tarar — `docs/archive`,
`docs/reference`, `docs/docu` arşiv klasörleri taramadan muaftır. `prebuild` ayrıca
`generate:sitemap` koşar.

> **Deploy sonrası zorunlu kontrol:** nginx değişiklikleri konteyner içinde doğrulanmadı
> (2026-08-04'te docker daemon kapalıydı; yerine `redirects.test.ts` template *metnini* denetliyor).
> İlk deploy'dan sonra tarayıcı konsolunda **CSP ihlali** olup olmadığına ve `/hakkimizda`,
> `https://www.corteqs.net/` gerçekten 301 dönüyor mu diye **bak**.

---

## 7. Test Stratejisi

- **Vitest** (unit + component, jsdom): 202 test dosyası (src 190, scripts 9, supabase 3,
  workers 4) — SQL↔TS ayna truth table'ları, cursor tekrar/kayıp, Zod sınırları, sayfa smoke'ları.
  Tek dosya: `npm run test -- <path>`.
- **Drift kilitleri** (bunlar bilerek "test" değil "sözleşme bekçisi"dir; kırılırsa iki tarafı da
  güncelle): `src/lib/redirects.test.ts` (redirects.ts ↔ nginx.conf.template + CSP kuralları),
  `scripts/generate-sitemap.test.mjs` (STATIC_ROUTES ↔ App.tsx route tablosu),
  `src/lib/cadde-rules` ayna testleri (SQL ↔ TS).
- **Playwright** yapılandırılmış: 18 `.spec.ts`; persona matrisi (spec §22.4) açık kalem.
- Tam `npm run lint` bugün **1280 problem (1060 error, 220 warning)** ile exit 1 döner
  (çoğu `no-explicit-any`; B7 backlog) — **kendi dosyalarını hedefli `npx eslint <dosyalar>` ile
  doğrula.** `tsc -p tsconfig.app.json --noEmit`: 98 hata (§5).

---

## 8. Doküman Haritası

| Nerede | Ne |
|---|---|
| **Kök (yalnız 2 `.md`)** | `CLAUDE.md` (agent kuralları — Claude Code kökten okur) · `README.md` (kurulum/deploy). 2026-08-04 kök temizliğinde diğer dokümanlar `docs/` altına taşındı: `docs/ARCHITECTURE.md` (bu dosya) · `docs/AGENT_CONTEXT.md` (hızlı bağlam) · `docs/status/rapor.html` (durum panosu) · `docs/history/SONDURUM.md` (faz durumu) |
| `docs/cadde-300/` | Cadde 3.0 spec + envanter + devir notu + faz dokümanları + **change-report.md** |
| `docs/plans/` | Aktif planlar (admin-v2 masterplan + handoff dahil) |
| `docs/catalog-role-afs-rebuild/` | AFS rebuild raporları (00–14) |
| `docs/archive/` | Dondurulmuş içerik: eski mimari dokümanlar, kök temizliği arşivi (`root-2026-06-11/`), DB yedekleri (`backups/`), eski cleanup'lar, import araçları |
| `docs/reference/` | Referans repo kopyaları (global-network-bridge) |
| `docs/docu/`, `docs/assets/` | Eski docu klasörü + arşiv görselleri |
| `docs/README.md` | docs ağacının indeksi |
