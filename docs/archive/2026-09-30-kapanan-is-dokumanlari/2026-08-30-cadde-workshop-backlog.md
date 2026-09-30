# Cadde Workshop — Ayrı Backlog Fazı

Bu belge 30 Ağustos 2026 Cadde workshop çalışmasında bilinçli olarak aktif teslim kapsamı dışında bırakılan maddelerin uygulama kapılarını kaydeder. Bir maddenin burada planlanması `ubt_done` veya `burak_done` onayı anlamına gelmez.

## Telefon doğrulama ve erişim epic'i (`m33`, `m34`, `m95`)

- `cadde.phone_verification_required` varsayılanı `false` kalır.
- Uygulama öncesi SMS/OTP sağlayıcısı, maliyet/rate-limit politikası, mevcut kullanıcı backfill'i, destek akışı ve rollback anahtarı onaylanır.
- Bayrak açıldığında doğrulanmış `+90` kullanıcı yalnız Köprü kapsamını; doğrulanmış diğer kullanıcılar ülke, şehir ve Köprü kapsamlarını kullanır. Admin/moderatör mevcut override davranışını korur.
- Kabul kapısı: SQL ve TypeScript truth-table testleri, kademeli aktivasyon, hata/OTP metriği ve tek ayarla geri dönüş.

## Juke Box ürün keşfi (`m50`)

- Kaynak ve lisans modeli, oda senkronizasyonu, host kontrolleri, moderasyon, kalıcılık ve mobil veri tüketimi ayrı ürün dokümanında kararlaştırılır.
- Bu kararlar onaylanmadan şema, medya entegrasyonu veya mühendislik tahmini yapılmaz.

## Akış otomatik yenileme kararı (`m89`)

- Mevcut “N yeni paylaşım” çipi ve kullanıcının kontrollü yenilemesi korunur.
- Otomatik yenileme yeniden açılırsa tam sayfa reload kullanılmaz; yalnız ilgili React Query feed anahtarı invalidate/refetch edilir ve açık composer/yorum taslakları korunur.

## Video altyapısı epic'i (`m94`)

- Mevcut beta davranışı ve ayarı değiştirilmez; madde açık kalır.
- Kendi storage/CDN, transcoding, zararlı içerik taraması, moderasyon ve maliyet sınırları kararlaştırılmadan “tamamlandı” sayılmaz.
- Kabul kapısı: gerçek cihazlarda yükleme/oynatma, boyut ve format sınırları, başarısız upload temizliği ve staging E2E.

## OAuth proje markalaması (`m97`)

- Uygulama içindeki markalı `/login` ekranı korunur.
- Google Cloud consent ekranında uygulama adı/logo/destek alanı; Supabase tarafında site URL ve redirect domainleri yönetim panelinden doğrulanır.
- Kabul kanıtı, production olmayan OAuth denemesi ve consent ekranı ekran görüntüsüdür.

## Pano formatı ürün keşfi (`m101`)

- Referans görünüm, Cadde yerleşimi, içerik alanları, CTA, süre ve ölçüm gereksinimleri ürün dokümanında sabitlenir.
- Onaylanan format önce mevcut `cadde_promotion_*` placement modeline eşlenir; karşılanamayan somut gereksinim yoksa yeni şema açılmaz.
