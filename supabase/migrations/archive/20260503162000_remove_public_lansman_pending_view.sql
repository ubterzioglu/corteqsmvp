DROP VIEW IF EXISTS public.lansman_pending_public;

DROP POLICY IF EXISTS "Public pending lansman select"
  ON public.lansman_registrations;

REVOKE SELECT ON public.lansman_registrations FROM anon, authenticated;
