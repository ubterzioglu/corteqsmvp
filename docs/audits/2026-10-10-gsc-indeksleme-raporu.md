# GSC "Seitenindexierung" raporları — triyaj (2026-10-10)

Search Console'un 04.10.2026 güncellemeli altı raporu. Her URL sınıfı 10.10.2026'da canlıda
`curl` ile ölçüldü (Googlebot UA'sıyla prerender çıktısı dahil).

## Sonuç

**Tek gerçek arıza: `http://` adresleri 404.** Kalanın çoğu doğru davranış.

| Rapor | Sınıf | Ölçüm | Karar |
|---|---|---|---|
| 404 (9) | `http://corteqs.net/`, `http://www.corteqs.net/` | 404, gövde `404 page not found` (text/plain) = **Traefik varsayılanı**; istek nginx'e ulaşmıyor | **Coolify'da HTTP→HTTPS yönlendirmesi açılmalı** (repo değişikliği gerekmez) |
| 404 | `/addwa` `/hakkimizda` `/campaign/founding-1000` `/blog` | 301 → `https://…` | 05.10 SG03 (`absolute_redirect off`) öncesi tarama. Kapandı |
| 404 | `/commercial` | 200 | Eski tarama (09.07) |
| noindex (37) | `/tools/*` (18) | RequireAuth → login noindex | Bilinçli — `2026-07-28-tools-noindex-karari.md` |
| noindex | `/login?…` (~20) | noindex | Doğru; profil/dizin giriş CTA'larına `rel="nofollow"` eklendi |
| noindex | `/cadde`, süresi dolmuş anket, `mvp.` login | noindex | Doğru |
| noindex | `/dunya-kupasi`, `/dunya-kupasi/kayit` | 200 + NotFound kabuğu (soft-404) | **301 → `/campaign`** (redirects.ts + nginx + server.mjs) |
| Başka kanonik (22) | `/addcom?group=`, `/directory?role=`, `/tools/`, `/lansman/`, `mvp.`/`www.` | canonical doğru hedefte | Doğru |
| Yönlendirme (5) | `www.` adresleri | 301 → apex | Doğru |
| Kopya (2) | `/blog/ingiltere-vatandaslik`, `/blog/almanya-oturum-izni` | Prerender'da self-canonical + `index, follow` | İçerik: ülke×konu şablon yazıları, `ingiltere-vatandaslik` 227 kelime |
| Tarandı-eklenmedi (4) | 2 grup katalog sayfası, `/commercial/influencer-partner` | ince içerik | İçerik işi. `globe.corteqs.net/favicon.ico` yok sayılır |

## Search Console'da hangi düğmeye basılır

- **404 raporu:** Coolify düzeltmesi yayınlanıp `curl -sI http://corteqs.net/` 301/308 dönünce
  "Doğrulamayı başlat" — basılabilir.
- **noindex raporu:** BASMA. `/tools/*` ve `/login` bilerek noindex; doğrulama başarısız olur.
- **Başka kanonik / Yönlendirme:** bilgi amaçlı, basma.
- **Kopya / Tarandı-eklenmedi:** içerik genişletildikten sonra tek tek "URL denetimi → Dizine eklenmeyi iste".

## Doğrulama komutları

```bash
curl -sI http://corteqs.net/ | head -3          # 301/308 → https://corteqs.net/
curl -sI http://www.corteqs.net/ | head -3      # → https
curl -sI https://corteqs.net/dunya-kupasi | grep -i location   # /campaign
```
