# Dizin ve Arama Planı

### Batch 0 — Anonim RPC
- `search_directory_catalog` RPC’sini anonim erişime aç.
- Sayfalı ve PII’siz sonuç döndür.
- Görünürlük ve yönetici elemesini koru.
**Çıkış:** Anonim kullanıcı güvenli sonuç alıyor.

### Batch 1 — Dizin bağlantıları
- `/directory` sitemap’te kalsın.
- İnsanlar kartını ve giriş sonrası `next` akışını test et.
**Çıkış:** Dizin bağlantıları aynı sözleşmede.

### Batch 2 — Normalizasyon
- Aramayı `catalog_search_documents` üzerine taşı.
- `lower(unaccent(...))` uygula.
- Tam eşleşmeleri üste sırala.
**Çıkış:** Türkçe/ek kaynaklı boş sonuçlar azalıyor.

### Batch 3 — Güvenlik testi
- B20 yönetici elemesini ve PII sızıntısı yokluğunu test et.
- Sayaç ve sonuç filtrelerini eşitle.
**Çıkış:** Güvenlik ve sayaç tutarlı.

### Batch 4 — Veri kalitesi
- 61 bekleyen uzman kaydını değerlendir.
- Uygun kayıtları yayınla, şehir/kategori boşluklarını azalt.
**Çıkış:** Arama veri açısından anlamlı.

### Batch 5 — Kapsam genişletme
- Blog, etkinlik, rehber, Cadde, anket, şehir elçisi, işletme, konsolosluk ve `/tools` kaynaklarını ekle.
- Verisiz İş İlanları çipini kaldır veya bağla.
**Çıkış:** Site araması katalog profilleriyle sınırlı değil.
