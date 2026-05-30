-- mentor columns + phone_verified + phone_verifications
-- Source: referans 20260511161800 + 20260512084757
-- NOTE: handle_new_user() replacement is SKIPPED

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_volunteer_mentor boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS mentor_topics text,
  ADD COLUMN IF NOT EXISTS mentor_weekly_hours text;

CREATE INDEX IF NOT EXISTS idx_profiles_is_volunteer_mentor
  ON public.profiles (is_volunteer_mentor) WHERE is_volunteer_mentor = true;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS phone_verified boolean NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS public.phone_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  phone text NOT NULL,
  code text NOT NULL,
  expires_at timestamptz NOT NULL,
  verified_at timestamptz,
  attempts integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_phone_verifications_user ON public.phone_verifications(user_id, created_at DESC);

ALTER TABLE public.phone_verifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create own verifications"
  ON public.phone_verifications FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read own verifications"
  ON public.phone_verifications FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can update own verifications"
  ON public.phone_verifications FOR UPDATE TO authenticated USING (auth.uid() = user_id);
