-- ============================================================
-- Purpose:                Close P0 exposure on _member_backup_20260609 (RLS off + full anon/auth grants)
-- Module:                 AUTH_PROFILE
-- Risk level:             low (lock-down only; no data change; app never reads this backup via .from() or RPC)
-- Preconditions:          Table holds 14 backup rows; zero .from() references in frontend; not referenced by any RPC body
-- Rollback:               See bottom (re-grant + disable RLS) — only if a process unexpectedly depended on anon access
-- Data migration required: no
-- Estimated lock impact:  negligible (ACL + relrowsecurity flag on a 14-row table)
-- Manual verification:    after apply, anon/authenticated should have no privileges; RLS enabled
-- ============================================================

-- Evidence (read-only, already confirmed during audit):
--   * RLS was DISABLED and anon/authenticated had DELETE,INSERT,SELECT,UPDATE,TRUNCATE,REFERENCES,TRIGGER
--   * 14 rows of member backup data => anonymous read/write of member PII = data exposure
--   * 0 frontend .from() refs, 0 RPC body refs => safe to lock down

REVOKE ALL ON TABLE public._member_backup_20260609 FROM anon;
REVOKE ALL ON TABLE public._member_backup_20260609 FROM authenticated;

-- Enable RLS with NO policies => default deny for anon/authenticated.
-- service_role and table owner (definer functions / admin tooling) still bypass RLS.
ALTER TABLE public._member_backup_20260609 ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------
-- ROLLBACK (do NOT run unless lock-down caused a regression):
--   ALTER TABLE public._member_backup_20260609 DISABLE ROW LEVEL SECURITY;
--   GRANT SELECT ON TABLE public._member_backup_20260609 TO authenticated;
-- ------------------------------------------------------------
