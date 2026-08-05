-- Cadde workshop panosu — UBT onay kutularının toplu işaretlenmesi (05.08.2026)
--
-- NEDEN BU DOSYA VAR: ajan canlı veritabanına YAZAMIYOR (izin sınıflandırıcısı hem
-- psql UPDATE'ini hem PostgREST PATCH'ini reddediyor). Aynı işi panelden elle de
-- yapabilirsin: /admin/workshop/cadde → ilgili maddenin UBT kutusu. Bu dosya yalnız
-- 28 kutuyu tek seferde işaretlemek içindir.
--
-- Çalıştırma (Türkçe karakter komut satırından geçmez, dosyadan okut):
--   psql "$CONN" -v ON_ERROR_STOP=1 -f docs/operations/2026-08-05-workshop-ubt-isaretleme.sql
--
-- Geri alma: aşağıdaki listeyi kullanarak
--   update public.workshop_items set ubt_done = false, ubt_done_at = null
--   where workshop_key = 'cadde' and item_no in (<liste>);
--
-- ─────────────────────────────────────────────────────────────────────────────
-- KAPSAM: 4 Ağustos'ta main'e giren ama panoda hiç işaretlenmemiş 28 madde.
-- (Panoda WS2'nin TAMAMI boş duruyor: 08-02'de 43, 08-03'te 1, 08-04'te 4 madde
--  işaretlenmiş, 57 ve sonrasında tek bir işaret yok — çünkü 4 Ağustos'ta da canlı
--  DB yazımı engellenmişti.)
--
--   m49, 51, 52, 53, 80, 81, 98, 99   commit 1fbf47a  (bilgi balonları, CorteQS Çarşı
--                                     adlandırması, şehir adlı boş kafe mesajı, Enter
--                                     satır atlar, reklam alanı metinleri)
--   m66, 67, 68, 69                   commit 165fb91  (kafe kartı kompakt satır + akordeon)
--   m86, 87, 88                       commit 9e129f1  (konum seçiminin açıklaması,
--                                     tek "Yakında gelecek özellikler" alanı)
--   m82, 83, 84, 85                   commit a04c4f9  (kontrast +%10-15, akış öncelikli yerleşim)
--   m62, 63, 64                       commit b736b3a  (emoji bozulması, yükleme donması,
--                                     gömülü görsel)
--   m57, 59, 60, 61                   commit a63bceb  (kafe içi yorum, görsel, bağlantı, emoji)
--   m65, 73                           daha önce yapılmış, yalnız doğrulandı
--                                     (CaddeCafeIcon mevcut; global akışa doğrudan
--                                      paylaşım kapalı)
--
-- BİLİNÇLİ OLARAK DIŞARIDA BIRAKILANLAR — işaretleme, çalışmıyorlar:
--   m71  "paylaşım profildeki ülkenin akışında gösterilecek" — 5 Ağustos ölçümü bunun
--        ÇALIŞMADIĞINI kanıtladı: profilde "Türkiye", tabloda "Turkiye" yazdığı için
--        38 üye hiç paylaşım yapamıyor. (Eski notta "bitti" yazıyordu, yanlıştı.)
--   m72  canlı cadde_settings güncellemesi gerekiyor, o da engellendi.
--   m75, 76  "Paylaşım gönderilemedi" — bugün yalnız teşhis yarısı kapandı, düzeltme
--        kullanıcı kararıyla ertelendi.
--   m78, m79  şehir/ülke temizliği — migration YAZILDI ama canlıya UYGULANMADI.
--   m50 (JUKE BOX), m58 (kafe sohbet akışı), m70 (kafe filtresi) — karar bekliyor.
--
-- NOT: bu 28 maddenin kodu main'de, ama Coolify deploy'u hâlâ bekliyor —
-- pano "yapıldı" derken canlı sitede henüz görünmüyor olabilir.
-- ─────────────────────────────────────────────────────────────────────────────

begin;

update public.workshop_items
set ubt_done = true,
    ubt_done_at = now()
where workshop_key = 'cadde'
  and deleted_at is null
  and ubt_done = false
  and item_no in (
    49, 51, 52, 53,
    57, 59, 60, 61,
    62, 63, 64, 65,
    66, 67, 68, 69,
    73,
    80, 81, 82, 83, 84, 85,
    86, 87, 88,
    98, 99
  );

-- Beklenen: 28 satır. Farklıysa commit etmeden önce sebebini araştır.
select count(*) filter (where ubt_done) as ubt_isaretli,
       count(*)                        as toplam
from public.workshop_items
where workshop_key = 'cadde' and deleted_at is null;

commit;
