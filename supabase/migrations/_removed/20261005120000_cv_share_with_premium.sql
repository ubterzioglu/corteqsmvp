-- B2 · CV paylaşım anahtarı (sahibin rızasıyla Premium görüntüleme).
--
-- Kaynak: docs/plans/qwen-sirali/01-tek-plan-kalan-isler.md §2.1
--
-- user_profile_attributes tablosunda yeni anahtar: cv_share_with_premium
-- Varsayılan KAPALI (false). Sahibe "CV'mi Premium üyeler görebilsin" seçeneği.
--
-- ⚠️ Bu migration YALNIZCA yeni attribute key'i tanımlar.
-- UI'da anahtar ProfilePage.tsx'te gösterilir.
-- Edge function `member-cv-link` bu anahtarı kontrol eder.

begin;

-- Yeni attribute key için varsayılan değer YOK (her kullanıcı için ayrı satır açılır).
-- UI'da anahtar açıldığında insert, kapatıldığında update yapılır.

-- Yorum: Bu key'in anlamı
comment on column public.user_profile_attributes.key is
  'Profil öznitelik anahtarı. cv_share_with_premium: Kullanıcı CV''sini Premium üyelerle paylaşmayı kabul eder (varsayılan kapalı).';

commit;
