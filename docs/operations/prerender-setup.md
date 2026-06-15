# Prerender (SEO/GEO) Kurulum Rehberi — Coolify

> CorteQS bir SPA'dır; arama motorları/AI botları boş `<div id="root">` görür.
> `server.mjs` bot user-agent'larını bir prerender servisine proxy'ler ve dolu HTML döner.
> `PRERENDER_URL` set edilene kadar katman **no-op**'tur (insan ziyaretçiler hiç etkilenmez).

## Kodun container'dan beklentisi (ÖNEMLİ)

`server.mjs` istek URL'ini şöyle kurar:

```
GET  <PRERENDER_URL>/<encodeURIComponent("https://corteqs.net" + path)>
```

Örnek: bot `/blog/almanya-giris-ulasim` isterse → server şuna GET atar:
```
https://prerender.corteqs.net/https%3A%2F%2Fcorteqs.net%2Fblog%2Falmanya-giris-ulasim
```

Bu, **prerender.io (prerender/prerender)** servisinin yerleşik formatıdır: kök URL'in sonuna
hedef URL eklenir. **Bu yüzden self-hosted `prerender/prerender` Docker imajını öneriyorum**
(Rendertron `/render/<url>` formatı kullanır ve kodla birebir uyumlu DEĞİLDİR — onu seçersen
PRERENDER_URL'i `https://host/render` yapman gerekir ama prerender.io daha sorunsuz).

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
   (Token İSTEMİYORUZ — self-host'ta auth yok; `PRERENDER_TOKEN` boş kalacak.)
6. Deploy et. Sağlık kontrolü:
   ```
   curl "https://prerender.corteqs.net/https://corteqs.net/blog/almanya-giris-ulasim"
   ```
   → İçinde `<title>CorteQS Blog | ...` ve blog içeriği olan DOLU HTML dönmeli
   (birkaç saniye sürebilir; Chromium sayfayı render ediyor).

> Not: Prerender container'ı dışarıdan herkese açık olacak. İstersen Coolify'da IP allowlist
> ya da basic-auth ekleyebilirsin; o durumda `PRERENDER_TOKEN` yerine kendi auth'unu kurman gerekir
> (kod `X-Prerender-Token` header'ı destekliyor — prerender.io plugin'lerinden biriyle eşleştirilebilir).

---

## Adım 2 — Ana uygulamaya (corteqs.net) env ekle

Coolify'da **CorteQS uygulamasının** (server.mjs çalıştıran) Environment Variables bölümüne:

```
PRERENDER_URL=https://prerender.corteqs.net
PRERENDER_CANONICAL_HOST=corteqs.net
PRERENDER_TOKEN=
```

- `PRERENDER_URL` → Adım 1'deki container'ın kök adresi. **Sonuna `/render` EKLEME** (kod hedef URL'i kendisi ekler).
- `PRERENDER_TOKEN` → boş bırak (self-host).
- Kaydet → **CorteQS uygulamasını yeniden başlat/redeploy et** (env runtime'da okunuyor).

---

## Adım 3 — Doğrula (deploy sonrası)

```bash
# 1) Bot User-Agent → DOLU prerendered HTML + X-Prerendered: 1 header dönmeli
curl -s -D - -A "GPTBot" https://corteqs.net/blog/almanya-giris-ulasim | head -40

# 2) Normal tarayıcı UA → boş SPA kabuğu (prerender ETMEMELI)
curl -s -A "Mozilla/5.0" https://corteqs.net/blog/almanya-giris-ulasim | grep -c "root"

# 3) Google bot da çalışmalı
curl -s -A "Googlebot" https://corteqs.net/founders | grep -o "<title>[^<]*</title>"
```

Beklenen:
- (1) yanıtında `X-Prerendered: 1` header'ı ve gerçek `<title>`/içerik.
- (2) sadece `<div id="root">` (boş kabuk).
- Prerender container ÇÖKERSE: bot istekleri yine de normal SPA kabuğuna düşer (kod graceful
  fallback yapar, asla 5xx vermez). Yani prerender bozulursa site bozulmaz.

---

## Adım 4 — Google Search Console

1. Deploy + prerender doğrulandıktan SONRA:
   GSC → Sitemaps → `sitemap.xml` ekle (73 URL).
2. Birkaç blog URL'ini **URL Inspection → Test Live URL → View Crawled Page** ile aç;
   prerendered HTML'i (dolu içerik) gördüğünü doğrula.

---

## Sorun giderme

| Belirti | Sebep / Çözüm |
|---|---|
| Bot isteği hâlâ boş kabuk dönüyor | `PRERENDER_URL` set değil ya da yanlış host. Coolify env'i kontrol et, uygulamayı redeploy et. |
| `X-Prerendered` header yok | server.mjs prerender'a gidemedi (timeout/4xx) → graceful fallback. Container sağlığını Adım 1 curl ile test et. |
| Container curl'ü boş/hatalı | Chromium başlatılamıyor olabilir — imajın Chromium içerdiğinden emin ol (`tvanro/prerender-alpine` dene). |
| Yavaş (>20sn) | `prerenderTimeoutMs=20000`. Container'a daha çok worker/memory ver ya da `MEMORY_CACHE=1` ile cache'le. |
| `/admin` veya statik dosyalar prerender'a gidiyor | Gitmemeli (kod hariç tutuyor). Gidiyorsa server.mjs güncel değil. |
```
