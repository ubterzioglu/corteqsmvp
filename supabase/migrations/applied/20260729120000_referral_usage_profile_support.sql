-- ============================================================
-- Purpose:                referral_code_usages tablosuna profil kaynaklı kullanım desteği +
--                         RLS/grant onarımı (admin "Kullanımlar" listesi 403 alıyordu).
-- Module:                 REFERRAL (profil doğrulama planı B08 —
--                         docs/plans/2026-07-29-profil-referral-dogrulama-admin-kullanim.md §1)
-- Risk level:             low-medium (41 mevcut satır dokunulmadan geçer; yeni kolonlar NULL/default;
--                         grant yalnız SELECT, RLS her satırı admin ya da satır sahibiyle sınırlar)
--
-- Background / regression:
--   Eski "Admin users can read referral code usages" politikası DÜŞÜRÜLMÜŞ public.admin_users
--   tablosuna bakıyordu; 20260615120000 diğer 4 referral tablosunu onardı, bu tabloyu atladı.
--   Sonuç: RLS açık + 0 politika + authenticated'a 0 grant → PostgREST 403,
--   AdminReferralPage hatayı sessizce yutuyor, "Kullanımlar" hep boş.
--
-- PLANDAN BİLİNÇLİ SAPMA (kritik):
--   Plan, referral_code_usages_submission_id_key UNIQUE constraint'ini düşürüp yerine
--   `WHERE submission_id IS NOT NULL` partial unique index koymayı öneriyordu. YAPILMADI:
--   submissions trigger'ı sade `ON CONFLICT (submission_id)` kullanıyor
--   (applied/20260422170000_referral_groups_and_validation.sql:333) ve PostgreSQL,
--   predicate'siz ON CONFLICT hedefine partial unique index'i arbiter olarak SEÇEMEZ —
--   çevirseydik her ön kayıt formu INSERT'i "there is no unique or exclusion constraint
--   matching the ON CONFLICT specification" ile patlardı. UNIQUE constraint'te NULL'lar
--   zaten çakışmaz (NULLS DISTINCT): submission_id NULL olan profil satırları sınırsız
--   olabilir, trigger davranışı birebir korunur. Planın amacı (trigger bozulmasın) bu
--   yolla partial index'ten DAHA sağlam karşılanıyor.
--
-- Rollback:               DROP POLICY referral_code_usages_admin_select / _self_select;
--                         REVOKE SELECT ... FROM authenticated;
--                         ALTER TABLE ... DROP CONSTRAINT referral_code_usages_origin_xor_check;
--                         ALTER TABLE ... DROP CONSTRAINT referral_code_usages_source_check;
--                         DROP INDEX referral_code_usages_user_id_key;
--                         ALTER TABLE ... DROP COLUMN user_id, DROP COLUMN source;
--                         ALTER TABLE ... ALTER COLUMN submission_id SET NOT NULL;
-- Estimated lock impact:  negligible (41 satırlık tablo; ADD CONSTRAINT validasyonu anlık).
-- Manual verification:    bkz. plan §Doğrulama — pg_policy'de 2 politika,
--                         role_table_grants'ta authenticated→SELECT, 41 satır değişmeden.
-- ============================================================

BEGIN;

-- 1) submission_id artık opsiyonel: profil kaynaklı satırlarda NULL olacak.
ALTER TABLE public.referral_code_usages
  ALTER COLUMN submission_id DROP NOT NULL;

-- 2) Yeni kolonlar: profil kullanımının sahibi + kaynak ayrımı.
ALTER TABLE public.referral_code_usages
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users (id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'submission';

-- 3) CHECK'ler (idempotent): kaynak değeri + kaynak/kolon tutarlılığı (XOR).
--    Mevcut 41 satır: submission_id dolu, user_id NULL, source 'submission' → ilk dala uyar.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM pg_constraint
    WHERE conrelid = 'public.referral_code_usages'::regclass
      AND conname = 'referral_code_usages_source_check'
  ) THEN
    ALTER TABLE public.referral_code_usages
      ADD CONSTRAINT referral_code_usages_source_check
      CHECK (source IN ('submission', 'profile'));
  END IF;

  IF NOT EXISTS (
    SELECT FROM pg_constraint
    WHERE conrelid = 'public.referral_code_usages'::regclass
      AND conname = 'referral_code_usages_origin_xor_check'
  ) THEN
    ALTER TABLE public.referral_code_usages
      ADD CONSTRAINT referral_code_usages_origin_xor_check
      CHECK (
        (submission_id IS NOT NULL AND user_id IS NULL AND source = 'submission')
        OR (submission_id IS NULL AND user_id IS NOT NULL AND source = 'profile')
      );
  END IF;
END $$;

-- 4) "Bir kullanıcı = tek referral kodu" — kilit kararının DB garantisi.
CREATE UNIQUE INDEX IF NOT EXISTS referral_code_usages_user_id_key
  ON public.referral_code_usages (user_id)
  WHERE user_id IS NOT NULL;

-- 5) Grant + RLS onarımı — 20260615120000 deseni (public.is_admin(auth.uid())).
--    INSERT/UPDATE politikası bilinçli YOK: yazma yalnız SECURITY DEFINER fonksiyonlardan.
GRANT SELECT ON public.referral_code_usages TO authenticated;

DROP POLICY IF EXISTS "Admin users can read referral code usages" ON public.referral_code_usages;

CREATE POLICY referral_code_usages_admin_select ON public.referral_code_usages
  FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));

-- Profilin kendi kilit durumunu okuyabilmesi için: herkes yalnız kendi satırını görür.
CREATE POLICY referral_code_usages_self_select ON public.referral_code_usages
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

COMMENT ON COLUMN public.referral_code_usages.user_id IS
  'Profilden doğrulanan kullanımın sahibi (source=profile iken dolu; ön kayıt satırlarında NULL).';
COMMENT ON COLUMN public.referral_code_usages.source IS
  'Kullanım kaynağı: submission (ön kayıt trigger''ı) | profile (update_profile_attribute).';

COMMIT;
