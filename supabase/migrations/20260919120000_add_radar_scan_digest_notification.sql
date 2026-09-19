-- Radar tarama özeti bildirimi için migration
-- 2026-09-19: radar_scan_digest event tipi eklendi

-- 1. notification_email_outbox tablosuna örnek kayıt (eğer tablo varsa)
-- Not: Bu migration manuel uygulanabilir, tablo yapısı zaten mevcut.

-- 2. admin_notification_subscriptions tablosuna radar_scan_digest için default kayıt ekle
-- Tüm adminler otomatik abone olacak (kullanıcı kararı: "tüm adminler")
INSERT INTO admin_notification_subscriptions (user_id, event_type, is_enabled, created_at)
SELECT
  id AS user_id,
  'radar_scan_digest' AS event_type,
  true AS is_enabled,
  now() AS created_at
FROM profiles
WHERE is_admin = true
ON CONFLICT (user_id, event_type) DO NOTHING;

-- 3. notification_settings tablosuna radar_scan_digest için default ayar ekle
INSERT INTO notification_settings (setting_key, setting_value, updated_at)
VALUES
  ('email.radar_scan_digest.enabled', 'true', now())
ON CONFLICT (setting_key) DO UPDATE
SET setting_value = EXCLUDED.setting_value, updated_at = now();
