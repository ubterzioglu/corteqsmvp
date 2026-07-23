BEGIN;

CREATE OR REPLACE FUNCTION public.debug_submissions_policies()
RETURNS TABLE (
  policyname text,
  permissive text,
  roles text,
  cmd text,
  qual text,
  with_check text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
  SELECT
    p.policyname::text,
    p.permissive::text,
    array_to_string(p.roles, ',')::text AS roles,
    p.cmd::text,
    p.qual,
    p.with_check
  FROM pg_policies p
  WHERE p.schemaname = 'public'
    AND p.tablename = 'submissions'
  ORDER BY p.cmd, p.policyname;
$$;

GRANT EXECUTE ON FUNCTION public.debug_submissions_policies() TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.debug_request_context()
RETURNS TABLE (
  db_user text,
  jwt_role text,
  jwt_sub text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
  SELECT
    current_user::text,
    auth.role()::text,
    auth.uid()::text;
$$;

GRANT EXECUTE ON FUNCTION public.debug_request_context() TO anon, authenticated;

COMMIT;
