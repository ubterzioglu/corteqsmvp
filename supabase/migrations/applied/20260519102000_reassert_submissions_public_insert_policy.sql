BEGIN;

ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can submit a registration" ON public.submissions;
CREATE POLICY "Anyone can submit a registration"
  ON public.submissions
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

GRANT INSERT ON TABLE public.submissions TO anon, authenticated;

COMMIT;
