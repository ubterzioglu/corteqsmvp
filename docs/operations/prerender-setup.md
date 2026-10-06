# Prerender (SEO/GEO) Kurulum Rehberi — Coolify

> CorteQS bir SPA'dır; arama motorları/AI botları boş `<div id="root">` görür.
> **Üretimde bot tespiti ve prerender proxy'si nginx'te yapılır** (`nginx.conf.template`);
> `server.mjs` üretimde ÇALIŞMAZ. Bot user-agent'ları prerender servisine yönlendirilir ve dolu HTML döner.
> `PRERENDER_URL` set edilene kadar katman **no-op**'tur (insan ziyaretçiler hiç etkilenmez).
>
> ⚠️ **Eski sürüm bu belgede "server.mjs bot user-agent'larını proxy'ler" diyordu — yanlış.**
> Üretim runtime'ı `Dockerfile` → `nginx:1.27-alpine`'dir. Prerender davranışını değiştirmek için
> `server.mjs` DEĞİL `nginx.conf.template` düzenlenir (CLAUDE.md "Production runtime is nginx").
> `server.mjs` yalnız yerel `npm run start` ve nixpacks yolu içindir; bot listesi iki yerde tutulur ve
> hizalı kalmalıdır (aşağıda "Bot listesi").

## Akış (gerçek)

```
bot isteği ──► nginx  map $http_user_agent $is_bot          (UA eşleşir mi?)
                      map $uri $prerender_excluded          (/admin, /api hariç)
                      map "$is_bot:$prerender_excluded" $prerender_target
                              │  "1:0" → PRERENDER_URL      aksi → 0 (no-op)
                      location /  ── $prerender_target != 0 ──► rewrite ^ /__prerender_internal
                      location = /__prerender_internal (internal)
                              GET <PRERENDER_URL>/https%3A%2F%2F<PRERENDER_CANONICAL_HOST><request_uri>
                              yanıta  X-Prerendered: 1  eklenir
                              prerender 5xx verirse  error_page 500 502 503 504 =200 /index.html
```

- İstek URL'i **şema encoded** kurulur (`https%3A%2F%2F…`): prerender.io ham `https://` ile 400 verir.
  Bu, **prerender.io / `prerender/prerender`** servisinin yerleşik formatıdır; Rendertron
  (`/render/<url>`) ile uyumlu DEĞİLDİR. `PRERENDER_URL`'e **`/render` EKLEME**.
- Prerender çökerse bot yine normal SPA kabuğunu alır, **asla 5xx** görmez (graceful fallback).
- `PRERENDER_URL` ve `PRERENDER_CANONICAL_HOST` **konteyner açılışında** `docker-entrypoint-env.sh`
  tarafından nginx şablonuna `sed` ile işlenir → değiştirince uygulamayı **yeniden başlatmak/redeploy
  etmek** şarttır (runtime'da okunmaz, nginx reload etmez).
- ⚠️ nginx yolu `X-Prerender-Token` başlığını **göndermez**. Token yalnız `server.mjs` yolunda vardı;
  üretimde token gerektiren bir prerender servisi (prerender.io bulutu) bu kurulumla çalışmaz.
  Bu yüzden self-host (token'sız) servis kullanılır ve **dışarıdan açık kalır** — erişimi ağ
  düzeyinde (Coolify IP allowlist) kısıtla.

---

## Adım 1 — Coolify'da prerender container'ı oluştur

Coolify panelinde:

1. **+ New Resource → Docker Image** (veya "Service").
2. Image: `prerendercloud/prerender-server` **veya** klasik `prerender/prerender`
   (alttaki en yaygın self-host imajı):
   ```
   Image: ghcr.io/prerender/prerender-docker:latest
   ```
   (Alternatif kanıtlanmış imaj: `tvanro/prerender-alpine:latest` — Chromium dahil, hafif.)
3. **Port:** container içi `3000` (prerender varsayılanı). Coolify'a expose et.
4. **Domain:** Coolify'da bu servise bir alt alan adı bağla, örn:
   ```
   prerender.corteqs.net
   ```
   (DNS: `prerender` A/CNAME kaydını Coolify sunucusuna yönlendir. SSL'i Coolify Let's Encrypt halleder.)
5. **Environment (container'ın kendi env'i):**
   ```
   MEMORY_CACHE=1
   PRERENDER_NUM_WORKERS=2
   ```
   (Token İSTEMİYORUZ — self-host'ta auth yok; yukarıdaki nginx notuna bak.)
6. Deploy et. Sağlık kontrolü:
   ```
   curl "https://prerender.corteqs.net/https://corteqs.net/blog/almanya-giris-ulasim"
   ```
   → İçinde `<title>CorteQS Blog | ...` ve blog içeriği olan DOLU HTML dönmeli
   (birkaç saniye sürebilir; Chromium sayfayı render ediyor).

---

## Adım 2 — Ana uygulamaya (corteqs.net) env ekle

Coolify'da **CorteQS uygulamasının** (nginx imajı) Environment Variables bölümüne:

```
PRERENDER_URL=https://prerender.corteqs.net
PRERENDER_CANONICAL_HOST=corteqs.net
```

- `PRERENDER_URL` → Adım 1'deki container'ın kök adresi. **Sonuna `/render` EKLEME.**
- `PRERENDER_CANONICAL_HOST` → prerender'a iletilen hedef host (varsayılan `corteqs.net`).
  `www.`/`mvp.` değil **apex** olmalı; yoksa prerender yanlış host'u render eder.
- `PRERENDER_TOKEN` **kullanılmaz** (nginx yolunda yok).
- Kaydet → **uygulamayı yeniden başlat/redeploy et** (değerler konteyner açılışında şablona işlenir).

---

## Adım 3 — Doğrula (deploy sonrası)

```bash
# 1) Bot User-Agent → DOLU prerendered HTML + X-Prerendered: 1 header dönmeli
curl -s -D - -A "GPTBot" https://corteqs.net/blog/almanya-giris-ulasim | head -40

# 2) Normal tarayıcı UA → boş SPA kabuğu (prerender ETMEMELİ, X-Prerendered YOK)
curl -s -D - -A "Mozilla/5.0" https://corteqs.net/blog/almanya-giris-ulasim | grep -ci "x-prerendered"

# 3) Google bot da çalışmalı
curl -s -A "Googlebot" https://corteqs.net/founders | grep -o "<title>[^<]*</title>"

# 4) Prerender yoluna giden yanıt GÜVENLİK BAŞLIKLARINI da taşımalı (add_header kalıtılmaz)
curl -s -D - -o /dev/null -A "GPTBot" https://corteqs.net/ | grep -i "content-security-policy\|x-frame-options"
```

Beklenen:
- (1) yanıtında `X-Prerendered: 1` header'ı ve gerçek `<title>`/içerik.
- (2) `0` (başlık yok).
- (4) CSP ve `X-Frame-Options` görünmeli. `/__prerender_internal` kendi `add_header`'ına sahip
  olduğu için güvenlik başlıklarını **tekrarlar**; bu tekrar silinirse bot yanıtlarında sessizce düşer
  (`src/lib/redirects.test.ts` bunu kilitler).
- Prerender container ÇÖKERSE: bot istekleri yine de normal SPA kabuğuna düşer, asla 5xx vermez.

İlk paylaşımda soğuk-render gecikmesini önlemek için cache ısıtma betiği vardır:
`npm run warm:prerender` (sitemap'teki tüm URL'leri bot UA'sıyla bir kez çağırır). **Hiçbir deploy
adımına bağlı değildir** — deploy sonrası elle çalıştır ya da Coolify post-deploy komutuna ekle.

---

## Bot listesi

Hangi user-agent'ların prerender alacağı `nginx.conf.template` içindeki `map $http_user_agent $is_bot`
tarafından belirlenir; `server.mjs` içindeki `botUserAgentPattern` ile **hizalı tutulur**.
Bugün listede olmayan bazı arama/cevap botları (örn. `duckassistbot`, `mistralai-user`,
`meta-externalfetcher`, `bingpreview`, `google-inspectiontool`, `petalbot`) boş SPA kabuğu görür.
Eklemek bir strateji kararıdır (robots.txt AI politikasından AYRI); karar verilince iki yeri birlikte
güncelle ve `redirects.test.ts`'e iddia ekle.

---

## Adım 4 — Google Search Console

1. Deploy + prerender doğrulandıktan SONRA: GSC → Sitemaps → `sitemap.xml` ekle.
   (URL sayısını bu belgeye yazma — sitemap Supabase'ten dinamik üretilir ve değişir.)
2. Birkaç blog URL'ini **URL Inspection → Test Live URL → View Crawled Page** ile aç;
   prerendered HTML'i (dolu içerik) gördüğünü doğrula.

---

## Sorun giderme

| Belirti | Sebep / Çözüm |
|---|---|
| Bot isteği hâlâ boş kabuk dönüyor | `PRERENDER_URL` set değil/yanlış host **ya da uygulama env sonrası yeniden başlatılmadı** (değerler konteyner açılışında işlenir). `$is_bot` listesinde olmayan bir UA da boş kabuk görür. |
| `X-Prerendered` header yok | Bot UA eşleşmedi, yol `/admin`/`/api` (bilerek hariç) ya da prerender servisi 5xx verdi → nginx SPA kabuğuna düştü. Container sağlığını Adım 1 curl ile test et. |
| Container curl'ü boş/hatalı | Chromium başlatılamıyor olabilir — imajın Chromium içerdiğinden emin ol (`tvanro/prerender-alpine` dene). |
| Yavaş (>25 sn) | nginx `proxy_read_timeout 25s`; aşılırsa SPA kabuğuna düşer. Container'a daha çok worker/memory ver ya da `MEMORY_CACHE=1`; `npm run warm:prerender` ile ısıt. |
| Bot yanıtında CSP/`X-Frame-Options` yok | `/__prerender_internal` location'ındaki `add_header` güvenlik bloğu silinmiş (add_header kalıtılmaz). `redirects.test.ts` düşmeli. |
| Değişikliğin "etkisi yok" | `server.mjs`'i düzenlemiş olabilirsin; üretimde o dosya çalışmaz — `nginx.conf.template`'i düzenle. |
