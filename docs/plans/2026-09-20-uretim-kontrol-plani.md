# Çalışma Alanı ve Üretim Kontrol Planı

### Batch 0a — Çalışma alanı durumu ✅
- `git status` ve staged index'i kontrol et.
**Çıkış:** İlgisiz WIP veya başka migration karışmıyor.

### Batch 0b — Değişiklik ayrıştırma ✅
- Events, relocation, arama ve dokümantasyon değişikliklerini ayır.
**Çıkış:** Her değişiklik kategorisine atanmış.

### Batch 1a — Yerel release çalıştırma ✅
- `npm run verify:release` çalıştır.
**Çıkış:** Yerel release yeşil.

### Batch 1b — Yerel asset doğrulama ✅
- Built asset ve muhasebe chunk'larını doğrula.
**Çıkış:** Tüm chunk'lar tutarlı.

### Batch 2a — Canlı release çalıştırma ✅
- `BASE_URL=https://corteqs.net npm run verify:release` çalıştır.
**Çıkış:** Canlı release yeşil.

### Batch 2b — Canlı asset doğrulama ✅
- Canlı JS/CSS asset'lerinin erişilebilirliğini kontrol et.
**Çıkış:** Tüm remote asset'ler erişilebilir.

### Batch 3a — Güvenlik başlığı toplama ✅
- `curl -I https://corteqs.net/` çalıştır.
**Çıkış:** Response başlıkları alındı.

### Batch 3b — Güvenlik başlığı doğrulama ✅
- CSP, HSTS, X-Frame-Options, Referrer-Policy ve nosniff başlıklarını kontrol et.
**Çıkış:** Nginx başlıkları ve CSP temiz.
