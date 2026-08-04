ALTER TABLE public.submissions
  ADD COLUMN IF NOT EXISTS referral_source TEXT,
  ADD COLUMN IF NOT EXISTS referral_detail TEXT,
  ADD COLUMN IF NOT EXISTS referral_code TEXT;
