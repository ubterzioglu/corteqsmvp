ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS address text,
  ADD COLUMN IF NOT EXISTS show_on_map boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS business_name text,
  ADD COLUMN IF NOT EXISTS business_sector text,
  ADD COLUMN IF NOT EXISTS business_website text,
  ADD COLUMN IF NOT EXISTS business_description text;

CREATE TABLE IF NOT EXISTS public.profile_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL,
  viewer_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_profile_views_profile ON public.profile_views(profile_id);

ALTER TABLE public.profile_views ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can record a profile view" ON public.profile_views;
CREATE POLICY "Anyone can record a profile view"
  ON public.profile_views FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Owners can read their views" ON public.profile_views;
CREATE POLICY "Owners can read their views"
  ON public.profile_views FOR SELECT
  USING (auth.uid() = profile_id);
