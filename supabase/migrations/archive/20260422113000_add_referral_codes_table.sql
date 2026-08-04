CREATE TABLE IF NOT EXISTS public.referral_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  code_prefix TEXT NOT NULL,
  type_key TEXT NOT NULL,
  type_char TEXT NOT NULL,
  source_key TEXT NOT NULL,
  source_char TEXT NOT NULL,
  referral_date DATE NOT NULL,
  month_char TEXT NOT NULL,
  year_short TEXT NOT NULL,
  random_part TEXT NOT NULL,
  check_char TEXT NOT NULL,
  note TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_used BOOLEAN NOT NULL DEFAULT false,
  used_by UUID REFERENCES public.admin_users(user_id) ON DELETE SET NULL,
  used_at TIMESTAMPTZ,
  created_by UUID REFERENCES public.admin_users(user_id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS referral_codes_code_idx
  ON public.referral_codes (code);

CREATE INDEX IF NOT EXISTS referral_codes_created_at_idx
  ON public.referral_codes (created_at DESC);

CREATE INDEX IF NOT EXISTS referral_codes_type_source_date_idx
  ON public.referral_codes (type_key, source_key, referral_date);

ALTER TABLE public.referral_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin users can read referral codes"
  ON public.referral_codes
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.admin_users admin
      WHERE admin.user_id = auth.uid()
    )
  );

CREATE POLICY "Admin users can insert referral codes"
  ON public.referral_codes
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.admin_users admin
      WHERE admin.user_id = auth.uid()
    )
  );

CREATE POLICY "Admin users can update referral codes"
  ON public.referral_codes
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
