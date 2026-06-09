-- ============================================================
-- Purpose:                Remove broad anon/authenticated CRUD grants on referral_* and wa_* tables
--                         (RLS is ON but they had 0 policies + full table grants = latent misconfiguration)
-- Module:                 REFERRAL, WHATSAPP_COMMUNITIES
-- Risk level:             low-medium (app reaches these tables ONLY via SECURITY DEFINER RPCs, not direct .from())
-- Preconditions:          0 frontend .from() refs on all 9 tables; each table referenced inside definer RPC bodies
--                         (referral_codes:35, referral_code_usages:14, referral_groups:11, referral_sources:11,
--                          referral_types:11, wa_messages:8, wa_tasks:9, wa_users:12). Definer RPCs bypass these grants.
-- Rollback:               Re-GRANT the privileges (see bottom).
-- Estimated lock impact:  negligible (ACL change)
-- Manual verification:    after apply, verify referral binding flow (validate_and_bind_referral_code,
--                         submissions_apply_referral_code) and WhatsApp flows still work — they run as definer.
-- ============================================================

-- These tables have RLS ENABLED with ZERO policies. With RLS on + no policy, anon/authenticated are
-- already denied row access; the broad table GRANTS were dead but dangerous (a future permissive policy
-- would instantly expose them). Revoking aligns privilege with actual access path (definer RPCs).

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'referral_codes','referral_code_usages','referral_codes_legacy','referral_groups',
    'referral_sources','referral_types','wa_messages','wa_tasks','wa_users'
  ] LOOP
    -- Replay-safety (2026-06-09): wa_* tables live only in the production DB
    -- (created outside this migration history), so skip any table that is not
    -- present. No-op on production where all tables exist.
    IF to_regclass('public.' || t) IS NOT NULL THEN
      EXECUTE format('REVOKE ALL ON TABLE public.%I FROM anon;', t);
      EXECUTE format('REVOKE ALL ON TABLE public.%I FROM authenticated;', t);
    END IF;
  END LOOP;
END $$;

-- service_role retains full access (used by edge functions / admin tooling). Owner/definer RPCs unaffected.

-- ------------------------------------------------------------
-- ROLLBACK (only if a direct-access path was missed):
--   DO $$ DECLARE t text; BEGIN
--     FOREACH t IN ARRAY ARRAY['referral_codes','referral_code_usages','referral_codes_legacy',
--       'referral_groups','referral_sources','referral_types','wa_messages','wa_tasks','wa_users'] LOOP
--       EXECUTE format('GRANT SELECT,INSERT,UPDATE,DELETE ON TABLE public.%I TO authenticated;', t);
--     END LOOP; END $$;
-- ------------------------------------------------------------
