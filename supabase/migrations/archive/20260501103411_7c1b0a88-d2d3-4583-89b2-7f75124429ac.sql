-- Add new columns to interest_registrations for LP4-style form
ALTER TABLE public.interest_registrations
  ADD COLUMN IF NOT EXISTS organization TEXT,
  ADD COLUMN IF NOT EXISTS interest_area TEXT,
  ADD COLUMN IF NOT EXISTS supply_demand TEXT,
  ADD COLUMN IF NOT EXISTS heard_from TEXT,
  ADD COLUMN IF NOT EXISTS attachment_urls TEXT[] DEFAULT '{}'::text[];

-- Create private bucket for interest form uploads (CV, presentations, one-pagers)
INSERT INTO storage.buckets (id, name, public)
VALUES ('interest-uploads', 'interest-uploads', false)
ON CONFLICT (id) DO NOTHING;

-- Anyone (anon + authenticated) can upload to interest-uploads bucket
CREATE POLICY "Anyone can upload interest files"
ON storage.objects FOR INSERT
TO anon, authenticated
WITH CHECK (bucket_id = 'interest-uploads');

-- Only admins can read uploaded interest files
CREATE POLICY "Admins can read interest files"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'interest-uploads' AND public.has_role(auth.uid(), 'admin'));