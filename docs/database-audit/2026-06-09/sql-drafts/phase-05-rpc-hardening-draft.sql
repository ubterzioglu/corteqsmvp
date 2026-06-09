-- ============================================================
-- DRAFT ONLY - DO NOT EXECUTE AUTOMATICALLY
-- Human review, backup and staging verification are required.
-- ============================================================
--
-- PHASE 05 — RPC / FUNCTION HARDENING (proposals only)
-- Project: injprdrsklkxgnaiixzh  | Schema: public
--
-- *** POSITIVE FINDING — NO ACTION NEEDED ***
-- All application SECURITY DEFINER functions ALREADY pin search_path
-- (0 violations found in the live audit). DO NOT add SET search_path here —
-- it is already correct. This phase is ONLY about:
--   (1) EXECUTE-grant tightening (admin_* RPCs must not be anon-executable), and
--   (2) an admin-check verification checklist.
-- ============================================================


-- ============================================================
-- SECTION 1 — EXECUTE grant tightening
-- ============================================================
--
-- PATTERN / PRINCIPLE:
--   * Supabase grants EXECUTE on public functions to anon + authenticated by
--     default (PostgREST exposes them as RPC). Functions that perform admin/
--     privileged work (admin_*, *_admin, anything mutating roles/features) must
--     NOT be callable by anon, and ideally only by authenticated callers that
--     pass an internal is_admin() check.
--   * Pinned search_path (already done) protects SECURITY DEFINER bodies, but it
--     does NOT restrict WHO can call the function. Grants do that.
--
-- INSPECT — privileged-looking functions and who can EXECUTE them (READ-ONLY, may run):
SELECT p.proname,
       pg_get_function_identity_arguments(p.oid) AS args,
       p.prosecdef                                AS is_security_definer,
       r.grantee,
       r.privilege_type
FROM   pg_proc p
JOIN   pg_namespace n ON n.oid = p.pronamespace
LEFT   JOIN information_schema.role_routine_grants r
       ON r.routine_schema = n.nspname
      AND r.routine_name   = p.proname
WHERE  n.nspname = 'public'
  AND  (p.proname ILIKE 'admin\_%' ESCAPE '\'
        OR p.proname ILIKE '%\_admin' ESCAPE '\'
        OR p.proname ILIKE '%role%'
        OR p.proname ILIKE '%feature%')
ORDER  BY p.proname, r.grantee;
--
-- LIST anon-executable functions specifically (READ-ONLY, may run) — the review set:
SELECT p.proname, pg_get_function_identity_arguments(p.oid) AS args
FROM   pg_proc p
JOIN   pg_namespace n ON n.oid = p.pronamespace
WHERE  n.nspname = 'public'
  AND  has_function_privilege('anon', p.oid, 'EXECUTE')
ORDER  BY p.proname;
--
-- ------------------------------------------------------------
-- PROPOSED — revoke anon EXECUTE on privileged RPCs (COMMENTED OUT).
-- Replace <admin_function>(<arg types>) with the exact identity from the queries
-- above (overloads each need their own REVOKE with full signature).
--
-- Examples (illustrative — substitute real signatures from the inspection output):
-- -- REVOKE EXECUTE ON FUNCTION public.admin_set_user_role(uuid, uuid) FROM anon;
-- -- REVOKE EXECUTE ON FUNCTION public.admin_delete_member(uuid)        FROM anon;
-- -- REVOKE EXECUTE ON FUNCTION public.admin_toggle_feature(text, bool) FROM anon;
--
-- For functions that should be authenticated-but-admin-gated, keep authenticated
-- EXECUTE and ensure the body enforces the check (see Section 2). Revoke anon only:
-- -- REVOKE EXECUTE ON FUNCTION public.<privileged_fn>(<args>) FROM anon;
--
-- DO NOT revoke EXECUTE from is_admin() / is_moderator() / get_current_user_features():
-- those are intentionally callable (they self-scope to auth.uid()) and are used in
-- RLS predicates — revoking would break policies.
--
-- Risk:     revoking EXECUTE from anon on a function that an anonymous flow actually
--           calls will 404/permission-error that flow — verify in staging against
--           the app's anonymous paths before applying.
-- Rollback: GRANT EXECUTE ON FUNCTION public.<fn>(<args>) TO anon;


-- ============================================================
-- SECTION 2 — Admin-check verification CHECKLIST (comments only)
-- ============================================================
-- For every privileged RPC identified above, a reviewer should confirm:
--
--   [ ] The function body performs an explicit authorization check early, e.g.:
--         IF NOT public.is_admin() THEN
--           RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
--         END IF;
--       (Grants alone are not enough — a SECURITY DEFINER fn runs as owner.)
--
--   [ ] is_admin() / is_moderator() are themselves SECURITY DEFINER with a pinned
--       search_path (CONFIRMED already pinned across the codebase — positive finding)
--       and self-scope to auth.uid() (no caller-supplied user id trusted).
--
--   [ ] No privileged function trusts a caller-supplied user_id/role_id without
--       re-checking is_admin() (prevents privilege escalation via RPC arguments).
--
--   [ ] anon has NO EXECUTE on any admin_* / role-mutating / feature-mutating RPC
--       (verified by the "anon-executable functions" query in Section 1).
--
--   [ ] SECURITY DEFINER functions are owned by a role with exactly the privileges
--       they need — not a superuser-equivalent — limiting blast radius.
--
--   [ ] Error messages from privileged RPCs do not leak existence/sensitive data
--       to unauthorized callers (return generic 'forbidden').
--
-- VERIFY function security flags + search_path pinning (READ-ONLY, may run) —
-- this should show prosecdef=true functions all carrying a search_path in proconfig:
SELECT p.proname,
       p.prosecdef                        AS is_security_definer,
       p.proconfig                        AS settings   -- expect search_path=... present
FROM   pg_proc p
JOIN   pg_namespace n ON n.oid = p.pronamespace
WHERE  n.nspname = 'public'
  AND  p.prosecdef = true
ORDER  BY p.proname;
--
-- EXPECTED: every row's `settings` contains a search_path entry. (Audit confirmed
-- 0 violations.) If any row shows NULL settings, THAT is a regression to fix —
-- but as of this audit, none do. No search_path change is proposed in this phase.
-- ============================================================
