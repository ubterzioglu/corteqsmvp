-- Allow TR users to join community cafes
DROP TRIGGER IF EXISTS enforce_tr_phone_restriction ON public.cafe_memberships;

-- Add audience configuration columns to cafes
ALTER TABLE public.cafes
  ADD COLUMN IF NOT EXISTS continent text,
  ADD COLUMN IF NOT EXISTS audience_scope text NOT NULL DEFAULT 'everyone',
  ADD COLUMN IF NOT EXISTS referral_code text;