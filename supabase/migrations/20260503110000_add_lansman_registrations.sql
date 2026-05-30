CREATE TABLE IF NOT EXISTS public.lansman_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  initials TEXT,
  phone TEXT NOT NULL,
  linkedin TEXT NULL,
  instagram TEXT NULL,
  twitter TEXT NULL,
  website TEXT NULL,
  description TEXT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'lansman_status_check'
      AND conrelid = 'public.lansman_registrations'::regclass
  ) THEN
    ALTER TABLE public.lansman_registrations
      ADD CONSTRAINT lansman_status_check
      CHECK (status IN ('pending', 'approved', 'rejected'));
  END IF;
END
$$;

CREATE INDEX IF NOT EXISTS lansman_registrations_status_idx
  ON public.lansman_registrations (status);

CREATE INDEX IF NOT EXISTS lansman_registrations_created_at_idx
  ON public.lansman_registrations (created_at DESC);

REVOKE ALL ON public.lansman_registrations FROM anon;
REVOKE ALL ON public.lansman_registrations FROM authenticated;

ALTER TABLE public.lansman_registrations ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'lansman_registrations'
      AND policyname = 'Anyone can insert lansman registrations'
  ) THEN
    CREATE POLICY "Anyone can insert lansman registrations"
      ON public.lansman_registrations
      FOR INSERT
      TO anon, authenticated
      WITH CHECK (true);
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'lansman_registrations'
      AND policyname = 'Public pending lansman select'
  ) THEN
    CREATE POLICY "Public pending lansman select"
      ON public.lansman_registrations
      FOR SELECT
      TO anon, authenticated
      USING (status = 'pending');
  END IF;
END
$$;

GRANT INSERT ON public.lansman_registrations TO anon, authenticated;
REVOKE SELECT, UPDATE ON public.lansman_registrations FROM anon, authenticated;

CREATE OR REPLACE VIEW public.lansman_pending_public AS
SELECT
  id,
  initials,
  status,
  created_at
FROM public.lansman_registrations
WHERE status = 'pending';

GRANT SELECT ON public.lansman_pending_public TO anon, authenticated;

COMMENT ON TABLE public.lansman_registrations IS
  'MVP lansman registrations table. Public insert is allowed. Admin reads/updates should be handled via backend or edge function instead of frontend-only auth.';
