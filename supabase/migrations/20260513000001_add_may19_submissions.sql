-- may19_submissions table + may19-uploads bucket
-- Source: referans 20260507190822

CREATE TABLE IF NOT EXISTS public.may19_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind text NOT NULL CHECK (kind IN ('map_pin','idea','moment','livestream')),
  status text NOT NULL DEFAULT 'pending',
  user_id uuid,
  full_name text,
  email text,
  phone text,
  country text,
  city text,
  social_handle text,
  title text,
  description text,
  message text,
  link text,
  attachment_urls text[] DEFAULT '{}'::text[],
  show_on_map boolean DEFAULT true,
  consent boolean DEFAULT false,
  livestream_participation text,
  livestream_time_slot text,
  livestream_topic text,
  bio text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_may19_kind ON public.may19_submissions(kind);
CREATE INDEX IF NOT EXISTS idx_may19_created ON public.may19_submissions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_may19_status ON public.may19_submissions(status);

ALTER TABLE public.may19_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anyone can submit may19"
  ON public.may19_submissions FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "approved map pins are public"
  ON public.may19_submissions FOR SELECT TO anon, authenticated
  USING (kind = 'map_pin' AND status = 'approved' AND show_on_map = true);

CREATE POLICY "admins view all may19"
  ON public.may19_submissions FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "admins update may19"
  ON public.may19_submissions FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "admins delete may19"
  ON public.may19_submissions FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER may19_set_updated_at
  BEFORE UPDATE ON public.may19_submissions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO storage.buckets (id, name, public)
VALUES ('may19-uploads', 'may19-uploads', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "anyone upload may19"
  ON storage.objects FOR INSERT TO anon, authenticated
  WITH CHECK (bucket_id = 'may19-uploads');

CREATE POLICY "anyone read may19"
  ON storage.objects FOR SELECT TO anon, authenticated
  USING (bucket_id = 'may19-uploads');
