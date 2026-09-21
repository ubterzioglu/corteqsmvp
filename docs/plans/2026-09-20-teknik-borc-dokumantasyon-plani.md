# Teknik Borç ve Dokümantasyon Planı

### Batch 0 — Etkinlik borçları
- `events.type`/`events.status` CHECK kısıtlarını değerlendir.
- Eksik timezone, DST ve ters saat uyarılarını ele al.
**Çıkış:** Etkinlik riskleri karara bağlandı.

### Batch 1 — Relocation borçları
- Rate-limit TOCTOU, RLS fazlalıkları ve `updated_at` trigger ihtiyacını ele al.
**Çıkış:** Riskler düzeltildi veya kayıtlı karara bağlandı.

### Batch 2 — Doküman senkronu
- `CLAUDE.md` sayılarını güncelle.
- Edge function listesini canlıyla eşitle.
- Supabase çıkış dokümanlarını uygun zamanda taşı.
**Çıkış:** Dokümantasyon canlıyla uyumlu.

### Batch 3 — Depo hijyeni
- `walast.txt`/`.secretdb` dosyalarını depo dışına al.
- Reference klasörlerinin kullanımını ölç.
- `platform-safety-core.md` kararını ver.
**Çıkış:** Hassas/bayat dokümanlar güvenli.

### Batch 4 — Cadde karakterizasyonu
- Karakterizasyon testleri ekle.
- Testler yeşilken parçalı refactor yap.
- AuthProvider B6 istisnasını belgele.
**Çıkış:** Cadde refactor’u korunuyor.
