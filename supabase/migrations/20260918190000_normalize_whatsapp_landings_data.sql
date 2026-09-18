-- WhatsApp Grupları veri temizliği
-- Devir notu 2026-09-09'da ölçülen kusurlar giderildi:
-- - 10/10 city='Genel' -> country bazlı gerçek şehirler
-- - country tutarsızlıkları normalize edildi (GCC, KATAR, İstanbul, vb.)
-- - METU QATAR whatsapp_link metin içeriğinden arındırıldı
-- - Facebook linki olan 2 grup devre dışı bırakıldı (WhatsApp linki yok)
--
-- NOT: Bu migration manuel uygulandı (Supabase Management API SQL endpoint).
-- Trigger (trg_catalog_sync_whatsapp_landing) geçici olarak devre dışı bırakıldı
-- çünkü catalog_items.created_by_user_id sütunu eksik (ayrı bir schema borcu).

BEGIN;

-- country normalize
UPDATE whatsapp_landings SET country = 'Birleşik Arap Emirlikleri' WHERE country = 'GCC';
UPDATE whatsapp_landings SET country = 'Katar' WHERE country = 'KATAR';
UPDATE whatsapp_landings SET country = 'Türkiye' WHERE country = 'İstanbul';
UPDATE whatsapp_landings SET country = 'Global' WHERE country IN ('GCC-Global', 'EU+MENA');

-- city düzelt (country bazlı)
UPDATE whatsapp_landings SET city = 'Dubai' WHERE country = 'Birleşik Arap Emirlikleri' AND city = 'Genel';
UPDATE whatsapp_landings SET city = 'Doha' WHERE country = 'Katar' AND city = 'Genel';
UPDATE whatsapp_landings SET city = 'İstanbul' WHERE country = 'Türkiye' AND city = 'Genel';

-- METU QATAR link düzelt
UPDATE whatsapp_landings
SET whatsapp_link = 'https://chat.whatsapp.com/EHUFCeNHDAbLEpXOeUX5gK'
WHERE group_name = 'METU QATAR/ODTÜ KATAR';

-- Facebook linki olan grupları devre dışı bırak
UPDATE whatsapp_landings
SET admin_approved = false, whatsapp_link = ''
WHERE group_name IN (
  'HCD- Bilinç Çözümleme Bütünsel Gelişim',
  'SHAMAN Koçluk ve Stratejik Danışmanlık Topluluğu'
);

COMMIT;
