# Relocation Modülü Planı

### Batch 0 — Rota smoke testi
- `/relocation` aç, header bağlantısını ve `?move=` oluşumunu kontrol et.
**Çıkış:** Ana akış açılıyor.

### Batch 1 — Plan devamlılığı
- Sayfayı yenile ve çoklu plan geçişini test et.
**Çıkış:** Plan kaybolmuyor.

### Batch 2 — Asistan
- Asistan sorusu, yanıtı, hata durumu ve CSP konsolunu test et.
**Çıkış:** Edge function bağlantısı çalışıyor.

### Batch 3 — Seed provası
- Seed şablonunu doldur, UTF-8 kontrol et, `BEGIN ... ROLLBACK` çalıştır.
**Çıkış:** Seed gerçek çalıştırmaya hazır.

### Batch 4 — Seed uygulaması
- Seed’i uygula, dört tabloyu ve sekmelerin görünürlüğünü doğrula.
**Çıkış:** Maliyet/belge içerikleri görünür.

### Batch 5 — Eksik sekme kararı
- İşletmeler, Okullar ve Hoşgeldin Paketi veri kaynağını belirle.
- Mock veri ekleme.
**Çıkış:** Eksik sekmeler karara bağlandı.
