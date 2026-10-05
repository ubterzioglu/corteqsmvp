# SG · SEO/GEO planı — canlı ölçüme dayalı (5 Ekim 2026)

> Devir notu "SG01–SG08 plan hazır" diyordu; **dosya repoda yoktu** (`grep SG01` yalnız devir
> notunda çıkıyordu). Bu plan sıfırdan, **5 Ekim canlı ölçümüyle** yazıldı. Uydurma madde
> yok: her satırın yanında ölçüm var. Karar 8: `index.html` JSON-LD'ye **DOKUNULMAZ** (§4).
> Kaynaklar: `docs/audits/2026-08-04-seo-geo-audit.md` · `docs/history/completed-plans/corteqs-seo-geo-plan-v2.md`
> · `docs/plans/2026-09-20-public-rotalar-sitemap-plani.md` (kapalı).

## 0 · Yöntem

`https://corteqs.net` üzerinde salt-okunur HTTP: iki User-Agent (Chrome = insan, Googlebot =
nginx'in prerender'a yönlendirdiği bot yolu), `robots.txt`, `sitemap.xml` (413 URL'nin 34'ü
örneklendi), 15 rota, yönlendirme zincirleri (`curl -I`, `curl -L -v`), güvenlik başlıkları.
Betik: oturum scratchpad'i `sg_measure.py`.

## 1 · Sağlam olanlar (ölçüldü, iş YOK)

| Konu | Ölçüm |
|---|---|
| `robots.txt` | 200 · `Disallow: /admin` · `Sitemap:` satırı doğru |
| Sitemap | 200 `text/xml` · **413 URL** · hepsi `https://corteqs.net` · tekrar 0 · sonda `/` 0 · 413/413 `lastmod` |
| Sitemap örneklemi (Googlebot) | 34 URL'nin **32'si** 200 + tek canonical = kendisi + noindex yok (kalan 2 → SG01) |
| Canonical (bot yolu) | `/` `/directory` `/kariyer` `/pricing` `/events` `/addcom` `/tavsiye` `/liderlik` `/founders` → kendisi |
| 404 kabuğu (bot) | `/bu-sayfa-yok…` → `noindex, follow` + "Sayfa bulunamadı" (HTTP 200 — SPA sınırı, bilinçli erteleme) |
| `www.corteqs.net` | 301 → `https://corteqs.net/` |
| Güvenlik başlıkları | `/`, SPA rotası, `/assets/*.js`, 301 yanıtları: CSP · HSTS · XFO · nosniff · Referrer · Permissions tam |
| `/cadde` (bot) | giriş ekranı, `noindex, nofollow` — flag arkasında, sitemap'te YOK (doğru) |
| hreflang | hiçbir sayfada yok — site tek dil (`<html lang="tr">`); **kusur değil** |

## 2 · Ölçülmüş kusurlar

| ID | Kusur | Kanıt (05.10) | Önem | Durum |
|---|---|---|---|---|
| **SG01** | 🔴 **`/commercial` sonsuz döngü** | `/commercial` → 301 `/commercial/` (dizin var) → `dist/commercial/index.html` = `meta refresh 0;url=/commercial` → tekrar 301… SPA'daki `CommercialIndexPage` hiç açılmaz. Sitemap'te ilan edilmiş, bot 307 alıyor. Kök: `9769db08` (18.07) dizin-403'ü stub ile "çözdü", döngü üretti | yüksek | **bu turda düzeltildi** (nginx, §3) |
| **SG02** | `/lansman` canonical'ı yönlendiriyor | sayfa canonical'ı `https://corteqs.net/lansman`, sitemap `/lansman`, ama URL 301 → `/lansman/` (dizin `dist/lansman/`). SEO-kilitli URL | orta | **düzeltildi** (nginx, §3) |
| **SG03** | Tüm nginx yönlendirmeleri **`http://`** Location veriyor | `/blog` → `Location: http://corteqs.net/radar/rehberler` · `/lansman` → `http://corteqs.net/lansman/`. `http://corteqs.net/*` **404** dönüyor (TLS sonlandıran vekil http'yi yönlendirmiyor). Tarayıcı aynı 301'deki HSTS başlığıyla kurtarıyor (`curl -v`: "Switched from HTTP to HTTPS due to HSTS"); HSTS uygulamayan istemci/tarayıcı ilk ziyarette **404**'e düşer | orta | **düzeltildi** (`absolute_redirect off`, §3) |
| **SG04** | `http://corteqs.net/` ve `http://www.corteqs.net/` **404** | `curl -I` 404, Location yok. nginx değil, önündeki vekil (Coolify/Traefik) | orta | 🔴 **kullanıcı** (Coolify'da HTTP→HTTPS yönlendirmesi) |
| **SG05** | `mvp.corteqs.net` 200 — ESKİ derleme | apex'e 301 olması gerekirken 200; ham HTML'de sabit `rel=canonical https://corteqs.net/` var (9093a5e öncesi kod). nginx bloğu doğru (`server_name www… mvp…` → 301) → istek bu konteynere ulaşmıyor, ayrı/eski bir uygulama | düşük (canonical apex'i gösteriyor) | 🔴 **kullanıcı** (Coolify'da eski uygulamayı kapat ya da alan adını bu uygulamaya bağla) |
| **SG06** | `/anket` SEO yazmıyor | bot: canonical YOK, başlık ana sayfanınki. `ab29c80b` (20.09) "dokuz sayfa kapatıldı" dedi ama `SurveysPage.tsx`'e yalnız **import** ekledi, `useSeo(...)` çağrısı hiç yazılmadı. Sitemap'te ilan edilmiş | orta | **düzeltildi** (+ sözleşme testi, §3) |
| **SG07** | Olmayan blog yazısı soft-404 | `/blog/bu-yazi-yok-sg` (bot) → 200 + `index, follow` + ana sayfa başlığı. `BlogPostPage` bulunamadı dalında `applySeo` yok | düşük-orta | **düzeltildi** (§3) |
| SG08 | Sitemap'te olmayan public sayfalar | `/addcom` `/tavsiye` `/liderlik` bot'ta canonical + `index` ama sitemap'te YOK | düşük | ⏸️ **yapılmadı** — sitemap 3 kriterinin (c) "thin content" yargısı insan kararı (`/liderlik` boş liderlik tablosu olabilir) |
| SG09 | `BlogPostPage` "Tüm yazılar" bağlantısı `/blog`'a gidiyor | `/blog` 301 → `/radar/rehberler`; iç bağlantı yönlendirmeden geçiyor | düşük | ⏸️ yapılmadı (ayrı küçük iş) |

## 3 · Bu turda yapılan düzeltmeler

- **SG01+SG02+SG03 (nginx):** `nginx.conf.template` server bloğuna `absolute_redirect off;`
  (Location göreli → istemcinin şeması korunur) + `location = /lansman` (dizin yönlendirmesi
  olmadan `lansman/index.html`) + `location = /commercial` (dizin yönlendirmesi olmadan SPA
  kabuğu). İkisi de `location /`'daki prerender kapısını aynen taşır; kendi `add_header`'ları
  YOK (server başlıklarını miras alır — "add_header KALITILMAZ" kuralı ihlal edilmedi).
  `redirects.test.ts`'e üç iddia eklendi (gevşetme yok).
- **SG06+SG07 (frontend):** `SurveysPage` → `useSeo(PAGE_SEO.surveys, [])`; `BlogPostPage`
  bulunamadı dalı → `robots: "noindex, follow"`. Sözleşme: `use-seo-deps-contract.test.ts`'e
  "useSeo'yu import eden sayfa onu ÇAĞIRIR" iddiası (SG06 sınıfı).
- ⚠️ nginx değişikliği **çalışan nginx'te doğrulanamaz** (docker yok, yalnız metin testi) →
  deploy sonrası §5 komutları kullanıcı-adımları dosyasında.

## 4 · YALNIZ RAPOR — `index.html` JSON-LD (karar 8: DOKUNULMAZ)

Ölçüldü (`index.html`, 05.10), değiştirilmedi:
- `FAQPage` · **12** `Question`
- `Offer` ×2 — `price "0"` ve **`price "99"`** (karar 9'a göre ürün modeli `/pricing` 3 kademe
  abonelik; 99 € ayrı kampanya — JSON-LD bununla çelişiyor)
- sabit `"dateModified": "2026-07-06"`
- doğrulanamayan iddia: **"164 ülkede 8.8 milyon Türk diasporası"**
- `foundingDate` · `SearchAction` · `SpeakableSpecification` · `meta keywords` · `BreadcrumbList`
  (her rotaya miras kalıyor)
- `robots.txt` AI tarayıcılarına açık (GPTBot, CCBot, Google-Extended, Bytespider …) —
  CLAUDE.md "kullanıcı kararıyla ertelendi"
- Gerçek HTTP 404 (SPA 200 döner) — sunucu tarafı rota bilgisi ister, ertelendi

## 5 · Deploy sonrası doğrulama (kullanıcı/ajan)

```bash
curl -s -I https://corteqs.net/blog      | grep -i '^location'   # beklenen: /radar/rehberler (göreli, http:// YOK)
curl -s -o /dev/null -w '%{http_code}\n' https://corteqs.net/lansman      # 200 (301 DEĞİL)
curl -s -o /dev/null -w '%{http_code}\n' https://corteqs.net/commercial   # 200 (301 DEĞİL)
curl -s -I https://corteqs.net/lansman   | grep -i -E 'content-security|strict-transport'  # ikisi de VAR
curl -s -A Googlebot/2.1 https://corteqs.net/anket | grep -o 'rel="canonical"[^>]*'      # /anket
curl -s -A Googlebot/2.1 https://corteqs.net/blog/olmayan-yazi | grep -o 'name="robots"[^>]*>' # noindex
curl -s -I http://corteqs.net/            # SG04 düzelince 301 → https
curl -s -I https://mvp.corteqs.net/       # SG05 düzelince 301 → https://corteqs.net/
```
