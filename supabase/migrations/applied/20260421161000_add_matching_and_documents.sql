ALTER TABLE public.submissions
  ADD COLUMN IF NOT EXISTS document_url text,
  ADD COLUMN IF NOT EXISTS document_name text,
  ADD COLUMN IF NOT EXISTS offers_needs text,
  ADD COLUMN IF NOT EXISTS documents jsonb NOT NULL DEFAULT '[]'::jsonb;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'submission-documents',
  'submission-documents',
  true,
  10485760,
  ARRAY[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/jpeg',
    'image/png',
    'image/webp'
  ]
)
ON CONFLICT (id) DO UPDATE
SET public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Anyone can upload submission documents" ON storage.objects;
CREATE POLICY "Anyone can upload submission documents"
  ON storage.objects
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (bucket_id = 'submission-documents');

DROP POLICY IF EXISTS "Anyone can read submission documents" ON storage.objects;
CREATE POLICY "Anyone can read submission documents"
  ON storage.objects
  FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'submission-documents');

CREATE TABLE IF NOT EXISTS public.matches (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  source_submission_id uuid NOT NULL REFERENCES public.submissions(id) ON DELETE CASCADE,
  matched_submission_id uuid NOT NULL REFERENCES public.submissions(id) ON DELETE CASCADE,
  match_type text NOT NULL DEFAULT 'offer-need',
  match_score numeric,
  match_reason text,
  notified_source boolean NOT NULL DEFAULT false,
  notified_target boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (source_submission_id, matched_submission_id)
);

CREATE INDEX IF NOT EXISTS idx_matches_source ON public.matches(source_submission_id);
CREATE INDEX IF NOT EXISTS idx_matches_target ON public.matches(matched_submission_id);

ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can read matches" ON public.matches;
CREATE POLICY "Authenticated users can read matches"
ON public.matches
FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "System can create matches" ON public.matches;
