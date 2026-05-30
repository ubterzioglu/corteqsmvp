ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS languages_spoken text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS countries_lived jsonb NOT NULL DEFAULT '[]'::jsonb;