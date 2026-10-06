# SE1 · A10 SEO/GEO Doğrulama Raporu

> Tarih: 5 Ekim 2026

## 1. AI Keşif Dosyaları

### Dosyalar var mı?

| Dosya | public/ | dist/ |
|---|---|---|
| `ai/summary.json` | ✓ | ✓ |
| `ai/faq.json` | ✓ | ✓ |
| `.well-known/ai.txt` | ✓ | ✓ |

**Sonuç:** ✓ Dosyalar mevcut ve build sırasında dist/'e kopyalanıyor.

### faq.json index.html FAQPage'den betikle üretildi mi?

**Hayır.** faq.json elle yazıldı (3 soru). index.html'de FAQPage JSON-LD var (12 soru) ama betikle üretim YOK.

**Öneri:** İleride betikle üretim eklenebilir ama şu anki haliyle çalışıyor.

### Rakam yasağı ("164 ülke / 8,8 milyon")

```bash
grep -r "164 ülke" public/ai/
grep -r "8,8 milyon" public/ai/
```

**Sonuç:** ✓ Rakam yok.

---

## 2. nginx SPA Fallback Kontrolü

### /ai/ ve /.well-known/ SPA fallback'e düşüyor mu?

> ⚠️ **DÜZELTME (6 Ekim 2026):** Bu bölümün ilk hâli "EVET — düşüyor" diyordu ve özel
> location önerisi yapıyordu. İkisi de yanlıştı; aşağıdaki öneri **UYGULANMAMALIDIR**.

**HAYIR — düşmez.** Uzantılı yollar için `nginx.conf.template`'te zaten ayrı bir blok var:

```nginx
location ~* \.[a-z0-9]+$ {
  try_files $uri =404;
}
```

`/ai/summary.json`, `/ai/faq.json` ve `/.well-known/ai.txt` bir dosya uzantısıyla bittiği için
`location /` (SPA fallback: `try_files $uri $uri/ /index.html`) yerine **bu blok** eşleşir:

- dosya `dist/`'te varsa doğrudan sunulur,
- yoksa **404** döner (`/index.html`'e DÜŞMEZ — uzantılı eksik dosya "200 + HTML" olmaz).

Bu blokta kendi `add_header`'ı olmadığı için server bloğundaki 8 güvenlik başlığı **miras alınır**.
`Content-Type` nginx'in `mime.types`'ından gelir (`.json` → `application/json`,
`.txt` → `text/plain`).

**Test hâlâ gerekli (deploy sonrası):** `curl -I https://corteqs.net/ai/summary.json` →
`200` + `Content-Type: application/json` + güvenlik başlıkları; eksik bir dosya (`/ai/yok.json`) → `404`.

### ❌ Önceki "Değişiklik Önerisi" — UYGULAMA

```nginx
# YAPMA
location /ai/ {
  add_header Content-Type application/json;
  try_files $uri =404;
}
```

Neden zararlı:

1. **nginx'te `add_header` KALITILMAZ** (CLAUDE.md "Değişmez sözleşmeler" md.2): kendi `add_header`'ı olan bir
   location üst bloktaki **tüm** güvenlik başlıklarını (CSP, X-Frame-Options, HSTS…) iptal eder. `/ai/`
   yanıtları başlıksız çıkardı. `src/lib/redirects.test.ts` bu sınıfı artık yakalar (add_header içeren her
   location 8 başlığı tam taşımalı).
2. `add_header Content-Type …` ayrıca ikinci bir `Content-Type` başlığı ekler (mime.types'ın verdiğine ek).
3. Gerek yok: yukarıdaki mevcut blok işi zaten yapıyor.

Charset gerekiyorsa (`llms.txt`/`ai.txt` Türkçe karakter) çözüm **server bloğunda `charset utf-8;`**
direktifidir (`add_header` değil) — bkz. `docs/plans/2026-10-06-seo-geo-cleancode-kalan-plan.md` S8.

---

## 3. Build Sonrası

```bash
npm run build
```

**Sonuç:** ✓ Başarılı (35 sn)

**Not:** `public/sitemap.xml` build sırasında değişiyorsa `git checkout -- public/sitemap.xml` çalıştır.

---

## Özet

| Kontrol | Durum |
|---|---|
| AI dosyaları public/'de var | ✓ |
| AI dosyaları dist/'de var | ✓ |
| Rakam yasağı | ✓ Temiz |
| faq.json betikle üretim | ✗ Elle yazıldı (kabul edilebilir) |
| nginx SPA fallback | ⚠️ Test gerekli (deploy sonrası) |

**Sonraki adım:** Deploy sonrası `curl -I` ile kontrol et.
