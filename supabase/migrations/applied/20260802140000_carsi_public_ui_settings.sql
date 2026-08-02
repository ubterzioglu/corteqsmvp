-- ============================================================
-- Purpose:                Public read access for Çarşı UI flags.
-- Module:                 CADDE / ÇARŞI
-- Risk level:             low (two non-sensitive product flags only)
--
-- `cadde_settings` is intentionally private. The Cadde client, however, reads
-- these two Çarşı UI flags directly so the product team can toggle them without
-- a deploy. Keep the table closed except for the public rows the UI needs.
-- ============================================================

BEGIN;

ALTER TABLE public.cadde_settings ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON TABLE public.cadde_settings TO anon, authenticated;

DROP POLICY IF EXISTS cadde_settings_public_read_carsi_ui_flags ON public.cadde_settings;
CREATE POLICY cadde_settings_public_read_carsi_ui_flags
  ON public.cadde_settings
  FOR SELECT
  TO anon, authenticated
  USING (key IN ('cadde.carsi.visible', 'cadde.carsi.paid_mode'));

COMMIT;
