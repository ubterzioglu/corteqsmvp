# Platform Safety Core

Bu çekirdek Cadde'nin mevcut moderasyonunu değiştirmez; yeni yüzeylerin aynı temel
sözleşmeyle raporlama, izolasyon, kullanıcı kısıtı ve audit uygulayabilmesini sağlar.
Cadde köprüsü ayrı ve geri alınabilir bir batch'tir.

## Sözleşme

- `report_safety_subject(surface, subject_type, subject_id, reason, details)`:
  authenticated kullanıcı için günde 20 rapor sınırı, aynı açık konu için idempotent
  reporter kaydı ve tek aktif case üretir.
- `safety_subject_is_visible(...)`: ürün read path'i `false` dönen içeriği sunmaz.
- `is_safety_actor_restricted(scope, user_id, restriction_type)`: ürün write path'i
  `true` dönen aktörün işlemini DB seviyesinde reddeder. Kullanıcı yalnız kendisini,
  admin her kullanıcıyı kontrol edebilir.
- `admin_moderate_safety_case(...)`: review, isolate, restore, remove, resolve,
  kullanıcı kısıtlama ve kısıt kaldırma aksiyonlarını tek transaction'da uygular.
- Her karar hem immutable `safety_audit_events` hem ortak `admin_audit_logs` içine
  yazılır. Client tabloları değiştiremez; adminler yalnız okuyabilir.

## Küçük entegrasyon batch'leri

1. Yüzey kayıt oluşturma RPC'sine `is_safety_actor_restricted` kapısını ekle.
2. Liste/detail RPC'sine `safety_subject_is_visible` filtresini ekle.
3. UI rapor aksiyonunu `report_safety_subject` ile bağla.
4. Ortak admin case kuyruğunda yüzeyi filtrele; isolate/restore/resolve kabulünü test et.
5. Ancak dört kapı da geçtiğinde o yüzeyin eski özel moderasyon kuyruğunu retire et.

İlk adaylar: katalog yorumları, WhatsApp topluluk ilanları ve mesajlaşma. Cadde özel
tabloları/RPC'leri, aynı kabul testleriyle bridge edilmeden silinmez veya yeniden
yazılmaz.
