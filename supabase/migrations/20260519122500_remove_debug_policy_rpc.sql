BEGIN;

REVOKE EXECUTE ON FUNCTION public.debug_submissions_policies() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.debug_request_context() FROM anon, authenticated;

DROP FUNCTION IF EXISTS public.debug_submissions_policies();
DROP FUNCTION IF EXISTS public.debug_request_context();

COMMIT;
