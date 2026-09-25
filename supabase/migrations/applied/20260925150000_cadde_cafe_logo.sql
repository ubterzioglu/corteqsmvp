-- ============================================================
-- Purpose: m135 — Kafe logosu yükleme desteği
--          Kullanıcı kendi kafesi için logo görseli yükleyebilir
-- Risk:    Düşük. Yalnız kolon eklenir, mevcut veriler etkilenmez.
-- Access:  RLS politikaları mevcut (yalnız host güncelleyebilir).
-- Rollback: ALTER TABLE ... DROP COLUMN IF EXISTS logo_url;
-- ============================================================

BEGIN;

-- cadde_cafes tablosuna logo_url kolonu ekle
ALTER TABLE public.cadde_cafes
ADD COLUMN IF NOT EXISTS logo_url text;

-- Yorum ekle
COMMENT ON COLUMN public.cadde_cafes.logo_url IS
  'm135: Kafe logosu görsel URL''si. Kullanıcı kendi kafesi için yükleyebilir.';

-- Doğrulama
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'cadde_cafes'
      AND column_name = 'logo_url'
  ) THEN
    RAISE EXCEPTION 'logo_url kolonu eklenemedi';
  END IF;
  
  RAISE NOTICE 'm135: cadde_cafes.logo_url kolonu eklendi';
END $$;

COMMIT;
