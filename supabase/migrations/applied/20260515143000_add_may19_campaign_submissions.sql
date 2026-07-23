CREATE TABLE IF NOT EXISTS public.may19_campaign_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kind TEXT NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  country TEXT NOT NULL,
  city TEXT NOT NULL,
  social_handle TEXT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  message TEXT NULL,
  link TEXT NULL,
  consent BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'pending',
  review_notes TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'may19_campaign_submissions_kind_check'
      AND conrelid = 'public.may19_campaign_submissions'::regclass
  ) THEN
    ALTER TABLE public.may19_campaign_submissions
      ADD CONSTRAINT may19_campaign_submissions_kind_check
      CHECK (kind IN ('idea', 'moment'));
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'may19_campaign_submissions_status_check'
      AND conrelid = 'public.may19_campaign_submissions'::regclass
  ) THEN
    ALTER TABLE public.may19_campaign_submissions
      ADD CONSTRAINT may19_campaign_submissions_status_check
      CHECK (status IN ('pending', 'approved', 'rejected'));
  END IF;
END
$$;

CREATE INDEX IF NOT EXISTS may19_campaign_submissions_kind_idx
  ON public.may19_campaign_submissions (kind);

CREATE INDEX IF NOT EXISTS may19_campaign_submissions_status_idx
  ON public.may19_campaign_submissions (status);

CREATE INDEX IF NOT EXISTS may19_campaign_submissions_created_at_idx
  ON public.may19_campaign_submissions (created_at DESC);

ALTER TABLE public.may19_campaign_submissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public may19 campaign submissions insert" ON public.may19_campaign_submissions;
CREATE POLICY "Public may19 campaign submissions insert"
  ON public.may19_campaign_submissions
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (consent = true);

DROP POLICY IF EXISTS "Admins can manage may19 campaign submissions" ON public.may19_campaign_submissions;
CREATE POLICY "Admins can manage may19 campaign submissions"
  ON public.may19_campaign_submissions
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.admin_users
      WHERE admin_users.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.admin_users
      WHERE admin_users.user_id = auth.uid()
    )
  );

GRANT INSERT ON public.may19_campaign_submissions TO anon, authenticated;
GRANT SELECT, UPDATE, DELETE ON public.may19_campaign_submissions TO authenticated;
