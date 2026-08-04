-- job_listings table
-- Source: referans 20260511153059

CREATE TABLE IF NOT EXISTS public.job_listings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  business_name text,
  title text NOT NULL,
  department text,
  employment_type text NOT NULL DEFAULT 'Tam Zamanlı',
  location_type text NOT NULL DEFAULT 'office',
  country text,
  city text,
  location text,
  salary_min numeric,
  salary_max numeric,
  currency text NOT NULL DEFAULT 'EUR',
  description text,
  requirements text,
  package text NOT NULL DEFAULT 'basic',
  total_price numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'published',
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.job_listings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view published listings"
  ON public.job_listings FOR SELECT USING (status = 'published');

CREATE POLICY "Owners can view own listings"
  ON public.job_listings FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all listings"
  ON public.job_listings FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Owners can insert own listings"
  ON public.job_listings FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Owners can update own listings"
  ON public.job_listings FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Admins can update listings"
  ON public.job_listings FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Owners can delete own listings"
  ON public.job_listings FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER update_job_listings_updated_at
  BEFORE UPDATE ON public.job_listings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_job_listings_country_city ON public.job_listings(country, city);
CREATE INDEX IF NOT EXISTS idx_job_listings_status ON public.job_listings(status);
CREATE INDEX IF NOT EXISTS idx_job_listings_user ON public.job_listings(user_id);
