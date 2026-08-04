-- Restrict submission reads to explicit admin users and add review metadata.

CREATE TABLE public.admin_users (
  user_id UUID NOT NULL PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own admin membership"
  ON public.admin_users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Authenticated users can read submissions" ON public.submissions;

ALTER TABLE public.submissions
  ADD COLUMN status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'archived')),
  ADD COLUMN notes TEXT,
  ADD COLUMN reviewed_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN reviewed_by UUID REFERENCES public.admin_users(user_id);

CREATE INDEX submissions_created_at_idx ON public.submissions (created_at DESC);
CREATE INDEX submissions_form_type_idx ON public.submissions (form_type);
CREATE INDEX submissions_category_idx ON public.submissions (category);
CREATE INDEX submissions_status_idx ON public.submissions (status);

CREATE POLICY "Admin users can read submissions"
  ON public.submissions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.admin_users admin
      WHERE admin.user_id = auth.uid()
    )
  );

CREATE POLICY "Admin users can update submissions"
  ON public.submissions
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.admin_users admin
      WHERE admin.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.admin_users admin
      WHERE admin.user_id = auth.uid()
    )
  );
