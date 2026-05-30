-- generated_posts table + post-archive storage bucket
-- Source: referans 20260507102432

CREATE TABLE IF NOT EXISTS public.generated_posts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_by uuid NOT NULL,
  template_type text NOT NULL,
  recipient_name text NOT NULL,
  tagline text,
  expertise text,
  logo_url text,
  image_url text NOT NULL,
  thumbnail_url text,
  platforms text[] NOT NULL DEFAULT '{}',
  share_text text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.generated_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all generated posts"
  ON public.generated_posts FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert generated posts"
  ON public.generated_posts FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) AND auth.uid() = created_by);

CREATE POLICY "Admins can delete generated posts"
  ON public.generated_posts FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX IF NOT EXISTS idx_generated_posts_created_at ON public.generated_posts(created_at DESC);

INSERT INTO storage.buckets (id, name, public)
VALUES ('post-archive', 'post-archive', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public can view post archive"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'post-archive');

CREATE POLICY "Admins can upload to post archive"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'post-archive' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete from post archive"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'post-archive' AND has_role(auth.uid(), 'admin'::app_role));
