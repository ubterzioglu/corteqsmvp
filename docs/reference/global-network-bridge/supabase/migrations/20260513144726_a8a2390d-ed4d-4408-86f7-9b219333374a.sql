
-- Add social_links jsonb column to profiles for storing social media account URLs
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS social_links jsonb NOT NULL DEFAULT '{}'::jsonb;

-- Backfill: anyone who has country + city + phone_verified should be onboarding_completed
UPDATE public.profiles
   SET onboarding_completed = true
 WHERE onboarding_completed = false
   AND country IS NOT NULL AND country <> ''
   AND city IS NOT NULL AND city <> ''
   AND phone_verified = true;
