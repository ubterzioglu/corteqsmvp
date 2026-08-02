-- ============================================================
-- Purpose:                Çarşı görünürlük anahtarı (workshop m39-m40, redesign F10).
-- Module:                 CADDE / ÇARŞI
-- Risk level:             low (tek ayar satırı; kod tarafı okunamazsa GİZLİ varsayar)
--
-- Karar (workshop 30 Tem): "Çarşı linki şimdilik gizlenecek/inaktif; yerine
-- 'Diaspora'nın ikinci el pazarı Çarşı yakında' bloğu." Ürün konuşması yapılmadan
-- link verilmeyecek. Geri açmak DEPLOY GEREKTİRMEZ:
--   update cadde_settings set value='true' where key='cadde.carsi.visible';
--
-- ON CONFLICT DO NOTHING: migration yeniden koşarsa elle açılmış anahtarı EZMEZ.
-- Rollback:               delete from cadde_settings where key='cadde.carsi.visible';
-- ============================================================

BEGIN;

INSERT INTO public.cadde_settings (key, value)
VALUES ('cadde.carsi.visible', 'false'::jsonb)
ON CONFLICT (key) DO NOTHING;

COMMIT;
