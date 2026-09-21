# Public Rotalar ve Sitemap Planı

### Batch 0 — Rota smoke testi
- `/city-ambassadors`, `/consultants`, `/businesses`, `/isletme/:slug` rotalarını aç.
**Çıkış:** Dört rota çalışıyor.

### Batch 1 — Demo işaretleri
- İşletmeler DEMO bandını ve ana sayfa rozetini kontrol et.
- `demo-pages.ts` / `App.tsx` path eşleşmesini doğrula.
**Çıkış:** Demo işaretleri doğru.

### Batch 2 — Sitemap
- `npm run generate:sitemap` çalıştır.
- Public rotaları ve demo işletme istisnasını kontrol et.
**Çıkış:** Sitemap tutarlı.

### Batch 3 — Kırık bağlantı
- `/radio/:id/song-request` düğmesini düzelt veya kaldır.
**Çıkış:** Kırık bağlantı kalmadı.
