-- profiles CV/presentation + address/business columns + user-documents bucket
-- Source: referans 20260510094434 + 20260511142813

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS cv_path text,
  ADD COLUMN IF NOT EXISTS cv_name text,
  ADD COLUMN IF NOT EXISTS presentation_path text,
  ADD COLUMN IF NOT EXISTS presentation_name text,
  ADD COLUMN IF NOT EXISTS address text,
  ADD COLUMN IF NOT EXISTS show_on_map boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS business_name text,
  ADD COLUMN IF NOT EXISTS business_sector text,
  ADD COLUMN IF NOT EXISTS business_website text,
  ADD COLUMN IF NOT EXISTS business_description text;

INSERT INTO storage.buckets (id, name, public)
VALUES ('user-documents', 'user-documents', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Users can read own documents"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'user-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload own documents"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'user-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update own documents"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'user-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own documents"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'user-documents' AND auth.uid()::text = (storage.foldername(name))[1]);
