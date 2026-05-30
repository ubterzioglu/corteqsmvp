ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_volunteer_mentor boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS mentor_topics text,
  ADD COLUMN IF NOT EXISTS mentor_weekly_hours text;

CREATE INDEX IF NOT EXISTS idx_profiles_is_volunteer_mentor
  ON public.profiles (is_volunteer_mentor) WHERE is_volunteer_mentor = true;