-- ============================================================
-- Purpose:                Restore admin direct-table access to referral_* tables.
-- Module:                 REFERRAL (admin panel — /admin/referral + sources/groups/types)
-- Risk level:             low (re-grants table privileges to `authenticated`, but RLS still
--                         gates every row to admins via public.is_admin(auth.uid()))
--
-- Background / regression:
--   Migration 20260609031000_referral_wa_grant_hardening REVOKEd ALL grants on the referral_*
--   tables from anon/authenticated, on the documented precondition "0 frontend .from() refs;
--   app reaches these tables ONLY via SECURITY DEFINER RPCs". That precondition is FALSE for
--   the admin panel: src/lib/admin/admin-referral-api.ts and src/pages/admin/AdminReferralPage.tsx
--   read AND write these tables directly via supabase.from(...). With RLS ON + zero policies +
--   revoked grants, the logged-in admin got HTTP 403 on every SELECT — empty Source/Group/Type
--   dropdowns and an empty "Üretilen Referral Kodları" list.
--
--   This migration re-grants the table privileges the admin client needs and adds
--   admin-scoped RLS policies so rows are only ever visible/writable to admins. The
--   SECURITY DEFINER RPC access path (validate_and_bind_referral_code, etc.) is unaffected
--   (definer bypasses both grants and RLS). anon stays fully denied (no grant, no policy).
--
--   It also replaces the stale DELETE policy on referral_codes that referenced the
--   DROPPED public.admin_users table (dropped in 20260609003000) — that policy could no
--   longer evaluate. The canonical admin check is the public.is_admin(auth.uid()) RPC.
--
-- Rollback:               DROP the policies below and REVOKE the grants (see bottom).
-- Estimated lock impact:  negligible (ACL + policy DDL).
-- Manual verification:    as an admin, /admin/referral dropdowns populate and existing codes
--                         list; create/edit/toggle/delete a code works; as a non-admin the
--                         same SELECTs return 0 rows (not 403).
-- ============================================================

BEGIN;

-- 1) Re-grant the privileges the admin browser client uses. RLS (below) is the real gate;
--    without a base grant PostgREST returns 403 before RLS is even evaluated.
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'referral_sources','referral_groups','referral_types','referral_codes'
  ] LOOP
    IF to_regclass('public.' || t) IS NOT NULL THEN
      EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.%I TO authenticated;', t);
    END IF;
  END LOOP;
END $$;

-- 2) Admin-scoped RLS policies. referral_sources / referral_groups / referral_types need
--    SELECT (dropdowns + management pages) + INSERT/UPDATE (create / rename / toggle active).
--    referral_codes additionally needs DELETE (hard delete of unused codes).

-- referral_sources
DROP POLICY IF EXISTS "referral_sources_admin_select" ON public.referral_sources;
CREATE POLICY "referral_sources_admin_select"
  ON public.referral_sources FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "referral_sources_admin_insert" ON public.referral_sources;
CREATE POLICY "referral_sources_admin_insert"
  ON public.referral_sources FOR INSERT TO authenticated
  WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "referral_sources_admin_update" ON public.referral_sources;
CREATE POLICY "referral_sources_admin_update"
  ON public.referral_sources FOR UPDATE TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- referral_groups
DROP POLICY IF EXISTS "referral_groups_admin_select" ON public.referral_groups;
CREATE POLICY "referral_groups_admin_select"
  ON public.referral_groups FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "referral_groups_admin_insert" ON public.referral_groups;
CREATE POLICY "referral_groups_admin_insert"
  ON public.referral_groups FOR INSERT TO authenticated
  WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "referral_groups_admin_update" ON public.referral_groups;
CREATE POLICY "referral_groups_admin_update"
  ON public.referral_groups FOR UPDATE TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- referral_types
DROP POLICY IF EXISTS "referral_types_admin_select" ON public.referral_types;
CREATE POLICY "referral_types_admin_select"
  ON public.referral_types FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "referral_types_admin_insert" ON public.referral_types;
CREATE POLICY "referral_types_admin_insert"
  ON public.referral_types FOR INSERT TO authenticated
  WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "referral_types_admin_update" ON public.referral_types;
CREATE POLICY "referral_types_admin_update"
  ON public.referral_types FOR UPDATE TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- referral_codes (SELECT / INSERT / UPDATE / DELETE)
DROP POLICY IF EXISTS "referral_codes_admin_select" ON public.referral_codes;
CREATE POLICY "referral_codes_admin_select"
  ON public.referral_codes FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "referral_codes_admin_insert" ON public.referral_codes;
CREATE POLICY "referral_codes_admin_insert"
  ON public.referral_codes FOR INSERT TO authenticated
  WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "referral_codes_admin_update" ON public.referral_codes;
CREATE POLICY "referral_codes_admin_update"
  ON public.referral_codes FOR UPDATE TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- Replace the stale DELETE policy that referenced the dropped public.admin_users table.
DROP POLICY IF EXISTS "Admin users can delete referral codes" ON public.referral_codes;
DROP POLICY IF EXISTS "referral_codes_admin_delete" ON public.referral_codes;
CREATE POLICY "referral_codes_admin_delete"
  ON public.referral_codes FOR DELETE TO authenticated
  USING (public.is_admin(auth.uid()));

COMMIT;

-- ------------------------------------------------------------
-- ROLLBACK:
--   BEGIN;
--   DROP POLICY IF EXISTS "referral_sources_admin_select" ON public.referral_sources;
--   DROP POLICY IF EXISTS "referral_sources_admin_insert" ON public.referral_sources;
--   DROP POLICY IF EXISTS "referral_sources_admin_update" ON public.referral_sources;
--   DROP POLICY IF EXISTS "referral_groups_admin_select"  ON public.referral_groups;
--   DROP POLICY IF EXISTS "referral_groups_admin_insert"  ON public.referral_groups;
--   DROP POLICY IF EXISTS "referral_groups_admin_update"  ON public.referral_groups;
--   DROP POLICY IF EXISTS "referral_types_admin_select"   ON public.referral_types;
--   DROP POLICY IF EXISTS "referral_types_admin_insert"   ON public.referral_types;
--   DROP POLICY IF EXISTS "referral_types_admin_update"   ON public.referral_types;
--   DROP POLICY IF EXISTS "referral_codes_admin_select"   ON public.referral_codes;
--   DROP POLICY IF EXISTS "referral_codes_admin_insert"   ON public.referral_codes;
--   DROP POLICY IF EXISTS "referral_codes_admin_update"   ON public.referral_codes;
--   DROP POLICY IF EXISTS "referral_codes_admin_delete"   ON public.referral_codes;
--   DO $$ DECLARE t text; BEGIN
--     FOREACH t IN ARRAY ARRAY['referral_sources','referral_groups','referral_types','referral_codes'] LOOP
--       EXECUTE format('REVOKE ALL ON TABLE public.%I FROM authenticated;', t);
--     END LOOP; END $$;
--   COMMIT;
-- ------------------------------------------------------------
