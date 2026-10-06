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

**EVET — düşüyor.**

nginx.conf.template'te `/ai/` ve `/.well-known/` için özel location bloğu YOK. Genel SPA fallback:

```nginx
location / {
  ...
  try_files $uri $uri/ /index.html;
}
```

Bu, `/ai/summary.json` ve `/.well-known/ai.txt` istekleri:
1. Önce dosyayı arar (`$uri`)
2. Bulamazsa dizin olarak arar (`$uri/`)
3. O da yoksa `/index.html`'e yönlendirir

**Sorun:** Dosyalar dist/'de var ama nginx `try_files` sırasıyla önce dosyayı bulmalı. Eğer dosya varsa SPA fallback'e düşmez.

**Test gerekli:** Deploy sonrası `curl -I https://corteqs.net/ai/summary.json` ile kontrol edilmeli.

### Değişiklik Önerisi (gerekirse)

Eğer SPA fallback'e düşüyorsa, özel location blokları eklenebilir:

```nginx
location /ai/ {
  add_header Content-Type application/json;
  try_files $uri =404;
}

location /.well-known/ {
  try_files $uri =404;
}
```

**Uygulama:** §B9'da deploy sonrası test edilecek, gerekirse eklenecek.

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
