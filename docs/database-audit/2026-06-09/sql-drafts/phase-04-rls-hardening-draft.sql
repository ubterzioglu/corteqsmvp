-- ============================================================
-- DRAFT ONLY - DO NOT EXECUTE AUTOMATICALLY
-- Human review, backup and staging verification are required.
-- ============================================================
--
-- PHASE 04 — RLS HARDENING (proposals only)  *** HIGHEST PRIORITY ***
-- Project: injprdrsklkxgnaiixzh  | Schema: public
--
-- Scope:
--   A. _member_backup_20260609  — P0: RLS DISABLED + full anon/authenticated CRUD.
--   B. 9 tables — RLS ENABLED but ZERO policies, yet broad anon/authenticated grants.
--   C. 4 muhasebe views — missing security_invoker=on (may bypass RLS of expenses/incomes).
--
-- RULES:
--   * Every REVOKE / CREATE POLICY / ALTER is COMMENTED OUT.
--   * We DO NOT DROP any existing policy.
--   * Comparative format: CURRENT (as comments) vs PROPOSED (commented SQL).
--   * Apply Section A FIRST — it is a live data-exposure risk.
-- ============================================================


-- ============================================================
-- SECTION A — _member_backup_20260609  (P0 DATA EXPOSURE)
-- ============================================================
--
-- CURRENT STATE (confirmed live):
--   * Table public._member_backup_20260609 holds a backup of member data.
--   * RLS is DISABLED.
--   * Grants: SELECT, INSERT, UPDATE, DELETE, TRUNCATE to BOTH anon AND authenticated.
--   * => Any anonymous visitor can read AND modify/delete a copy of member data.
--   * Rows are FK-free (a detached backup), so removing access breaks no app FK.
--
-- INSPECT CURRENT GRANTS (READ-ONLY — may run):
SELECT grantee, privilege_type
FROM   information_schema.role_table_grants
WHERE  table_schema = 'public'
  AND  table_name   = '_member_backup_20260609'
ORDER  BY grantee, privilege_type;
--
-- CONFIRM RLS STATE (READ-ONLY — may run):
SELECT relname, relrowsecurity AS rls_enabled, relforcerowsecurity AS rls_forced
FROM   pg_class
WHERE  oid = 'public._member_backup_20260609'::regclass;
--
-- ------------------------------------------------------------
-- PROPOSED REMEDIATION (COMMENTED OUT) — pick ONE strategy after review:
--
-- STRATEGY 1 (preferred): the backup does not belong in `public`. Move it out of
-- reach of the API roles entirely. (Author as reviewed migration; back it up first.)
--   -- 1a. Revoke all API access immediately:
--   -- REVOKE ALL ON public._member_backup_20260609 FROM anon;
--   -- REVOKE ALL ON public._member_backup_20260609 FROM authenticated;
--   -- 1b. Enable RLS as defence-in-depth (deny-all once no policy exists):
--   -- ALTER TABLE public._member_backup_20260609 ENABLE ROW LEVEL SECURITY;
--   -- 1c. Relocate out of the API-exposed schema (e.g. a private `backup` schema):
--   -- CREATE SCHEMA IF NOT EXISTS backup;  -- not exposed to PostgREST
--   -- ALTER TABLE public._member_backup_20260609 SET SCHEMA backup;
--
-- STRATEGY 2 (if the backup has served its purpose): export then DROP — see phase-06.
--
-- Risk:     REVOKE is immediate and reversible. ALTER ... SET SCHEMA takes a brief
--           ACCESS EXCLUSIVE lock (table is a backup, low traffic — acceptable).
-- Rollback: re-GRANT the prior privileges / move table back to public if needed:
--   -- GRANT SELECT, INSERT, UPDATE, DELETE, TRUNCATE ON <table> TO anon, authenticated;  -- (NOT recommended)


-- ============================================================
-- SECTION B — RLS ENABLED, ZERO POLICIES, broad grants (9 tables)
-- ============================================================
-- Tables:
--   referral_codes, referral_code_usages, referral_codes_legacy,
--   referral_groups, referral_sources, referral_types,
--   wa_messages, wa_tasks, wa_users
--
-- CURRENT STATE (confirmed):
--   * RLS ENABLED on each → with ZERO policies, RLS denies all → effectively
--     deny-all TODAY (RLS "saves" the table).
--   * BUT each still GRANTs broad CRUD to anon/authenticated.
--   * LATENT RISK: the moment someone adds a permissive policy, OR disables RLS,
--     the broad grants leak data. Defence-in-depth = tighten grants now.
--
-- INSPECT CURRENT STATE (READ-ONLY — may run):
SELECT t.relname,
       t.relrowsecurity AS rls_enabled,
       (SELECT count(*) FROM pg_policy p WHERE p.polrelid = t.oid) AS policy_count
FROM   pg_class t
WHERE  t.relnamespace = 'public'::regnamespace
  AND  t.relname IN ('referral_codes','referral_code_usages','referral_codes_legacy',
                     'referral_groups','referral_sources','referral_types',
                     'wa_messages','wa_tasks','wa_users')
ORDER  BY t.relname;
--
-- CURRENT GRANTS (READ-ONLY — may run):
SELECT table_name, grantee, privilege_type
FROM   information_schema.role_table_grants
WHERE  table_schema = 'public'
  AND  table_name IN ('referral_codes','referral_code_usages','referral_codes_legacy',
                      'referral_groups','referral_sources','referral_types',
                      'wa_messages','wa_tasks','wa_users')
ORDER  BY table_name, grantee, privilege_type;
--
-- ------------------------------------------------------------
-- PROPOSED — tighten grants (COMMENTED OUT).
-- Step 1: remove anon access from all 9 (none of these should be reachable
-- anonymously). Keep authenticated grants ONLY if a real app path needs them; if
-- access is admin-only, also revoke from authenticated and rely on explicit policies.
--
-- -- REVOKE ALL ON public.referral_codes          FROM anon;
-- -- REVOKE ALL ON public.referral_code_usages     FROM anon;
-- -- REVOKE ALL ON public.referral_codes_legacy    FROM anon;
-- -- REVOKE ALL ON public.referral_groups          FROM anon;
-- -- REVOKE ALL ON public.referral_sources         FROM anon;
-- -- REVOKE ALL ON public.referral_types           FROM anon;
-- -- REVOKE ALL ON public.wa_messages              FROM anon;
-- -- REVOKE ALL ON public.wa_tasks                 FROM anon;
-- -- REVOKE ALL ON public.wa_users                 FROM anon;
--
-- Step 2 (optional, recommended): add EXPLICIT owner/admin policies so that if RLS
-- is ever relied upon for access (rather than just deny-all), behavior is intentional.
-- Example owner-scoped read for a referral table that has a user_id column:
--
-- -- CREATE POLICY referral_codes_owner_select ON public.referral_codes
-- --   FOR SELECT TO authenticated
-- --   USING (user_id = auth.uid());
--
-- Example admin-only full access (uses the canonical is_admin() RPC):
--
-- -- CREATE POLICY wa_messages_admin_all ON public.wa_messages
-- --   FOR ALL TO authenticated
-- --   USING (public.is_admin())
-- --   WITH CHECK (public.is_admin());
--
-- *** DO NOT DROP any existing policy. These tables currently have none, so only
--     CREATE is relevant here. Verify with the policy_count query above. ***
--
-- Risk:     REVOKE from anon is safe IF no anonymous path uses these tables — verify
--           in staging with the app's anon flows. Adding a policy while RLS is enabled
--           can OPEN access that was previously deny-all — review predicates carefully.
-- Rollback: re-GRANT the removed privileges; DROP POLICY <name> ON <table>;


-- ============================================================
-- SECTION C — Muhasebe views missing security_invoker=on
-- ============================================================
-- Views: v_muhasebe_kpi, v_muhasebe_by_person, v_muhasebe_by_category,
--        v_muhasebe_cashflow_monthly
--
-- CURRENT STATE (confirmed):
--   * Each view reads from expenses / incomes (RLS-protected financial tables).
--   * security_invoker is NOT set → the view executes with the VIEW OWNER's rights,
--     so it can BYPASS the RLS of expenses/incomes for the querying user.
--   * Postgres 15+ supports security_invoker=on so the view honors the CALLER's RLS.
--
-- INSPECT (READ-ONLY — may run): look for 'security_invoker=on' in reloptions.
SELECT c.relname AS view_name, c.reloptions
FROM   pg_class c
WHERE  c.relnamespace = 'public'::regnamespace
  AND  c.relkind = 'v'
  AND  c.relname IN ('v_muhasebe_kpi','v_muhasebe_by_person',
                     'v_muhasebe_by_category','v_muhasebe_cashflow_monthly');
--
-- ------------------------------------------------------------
-- PROPOSED (COMMENTED OUT) — apply ONLY after confirming intended access.
-- WARNING: enabling security_invoker may REMOVE data from results for non-admin
-- callers (they will now see only rows their own RLS allows). Confirm the dashboards
-- that consume these views are admin-gated or that reduced visibility is intended.
--
-- -- ALTER VIEW public.v_muhasebe_kpi              SET (security_invoker = on);
-- -- ALTER VIEW public.v_muhasebe_by_person        SET (security_invoker = on);
-- -- ALTER VIEW public.v_muhasebe_by_category      SET (security_invoker = on);
-- -- ALTER VIEW public.v_muhasebe_cashflow_monthly SET (security_invoker = on);
--
-- Risk:     low lock (metadata), but BEHAVIOR change — financial figures may drop
--           for non-privileged users. Test the muhasebe dashboard end-to-end in staging.
-- Rollback: ALTER VIEW <view> SET (security_invoker = off);
-- ============================================================
