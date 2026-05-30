-- cafes + cafe_memberships tables
-- Source: referans 20260511132859

CREATE TABLE IF NOT EXISTS public.cafes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  theme text NOT NULL,
  country text,
  city text,
  linkedin_url text NOT NULL,
  extra_links jsonb DEFAULT '[]'::jsonb,
  created_by uuid NOT NULL,
  opens_at timestamptz NOT NULL DEFAULT now(),
  closes_at timestamptz NOT NULL,
  duration_hours integer NOT NULL DEFAULT 2,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS cafes_name_unique_lower ON public.cafes (lower(name));
CREATE INDEX IF NOT EXISTS cafes_active_idx ON public.cafes (closes_at);
CREATE INDEX IF NOT EXISTS cafes_country_city_idx ON public.cafes (country, city);

ALTER TABLE public.cafes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view cafes" ON public.cafes FOR SELECT USING (true);
CREATE POLICY "Authenticated can create cafes" ON public.cafes FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Owner can update cafe" ON public.cafes FOR UPDATE TO authenticated USING (auth.uid() = created_by);
CREATE POLICY "Owner can delete cafe" ON public.cafes FOR DELETE TO authenticated USING (auth.uid() = created_by);

CREATE TABLE IF NOT EXISTS public.cafe_memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cafe_id uuid NOT NULL REFERENCES public.cafes(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  joined_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (cafe_id, user_id)
);

CREATE INDEX IF NOT EXISTS cafe_memberships_user_idx ON public.cafe_memberships (user_id, joined_at DESC);

ALTER TABLE public.cafe_memberships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view memberships" ON public.cafe_memberships FOR SELECT USING (true);
CREATE POLICY "Users can join as themselves" ON public.cafe_memberships FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can leave own membership" ON public.cafe_memberships FOR DELETE TO authenticated USING (auth.uid() = user_id);

ALTER TABLE public.feed_posts ADD COLUMN IF NOT EXISTS cafe_id uuid REFERENCES public.cafes(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS feed_posts_cafe_idx ON public.feed_posts (cafe_id, created_at DESC);
