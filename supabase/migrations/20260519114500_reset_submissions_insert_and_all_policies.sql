BEGIN;

ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE
  p record;
BEGIN
  FOR p IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'submissions'
      AND cmd IN ('INSERT', 'ALL')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.submissions', p.policyname);
  END LOOP;
END $$;

CREATE POLICY "submissions_public_insert"
  ON public.submissions
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

GRANT INSERT ON TABLE public.submissions TO anon, authenticated;

COMMIT;
