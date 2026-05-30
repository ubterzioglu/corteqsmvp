
-- Cafes table
CREATE TABLE public.cafes (
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

CREATE UNIQUE INDEX cafes_name_unique_lower ON public.cafes (lower(name));
CREATE INDEX cafes_active_idx ON public.cafes (closes_at);
CREATE INDEX cafes_country_city_idx ON public.cafes (country, city);

ALTER TABLE public.cafes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view cafes" ON public.cafes
  FOR SELECT USING (true);
CREATE POLICY "Authenticated can create cafes" ON public.cafes
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Owner can update cafe" ON public.cafes
  FOR UPDATE TO authenticated USING (auth.uid() = created_by);
CREATE POLICY "Owner can delete cafe" ON public.cafes
  FOR DELETE TO authenticated USING (auth.uid() = created_by);

-- Cafe memberships
CREATE TABLE public.cafe_memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cafe_id uuid NOT NULL REFERENCES public.cafes(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  joined_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (cafe_id, user_id)
);

CREATE INDEX cafe_memberships_user_idx ON public.cafe_memberships (user_id, joined_at DESC);

ALTER TABLE public.cafe_memberships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view memberships" ON public.cafe_memberships
  FOR SELECT USING (true);
CREATE POLICY "Users can join as themselves" ON public.cafe_memberships
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can leave own membership" ON public.cafe_memberships
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Daily-1 join enforcement trigger
CREATE OR REPLACE FUNCTION public.enforce_daily_cafe_join()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.cafe_memberships
    WHERE user_id = NEW.user_id
      AND cafe_id <> NEW.cafe_id
      AND joined_at > now() - interval '24 hours'
  ) THEN
    RAISE EXCEPTION 'daily_cafe_limit' USING HINT = 'Bir gün içinde sadece bir cafe''ye katılabilirsiniz.';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER enforce_daily_cafe_join_trg
  BEFORE INSERT ON public.cafe_memberships
  FOR EACH ROW EXECUTE FUNCTION public.enforce_daily_cafe_join();

-- feed_posts.cafe_id
ALTER TABLE public.feed_posts ADD COLUMN cafe_id uuid REFERENCES public.cafes(id) ON DELETE CASCADE;
CREATE INDEX feed_posts_cafe_idx ON public.feed_posts (cafe_id, created_at DESC);
