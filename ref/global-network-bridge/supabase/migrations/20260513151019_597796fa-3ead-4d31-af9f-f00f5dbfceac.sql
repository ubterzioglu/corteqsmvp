
-- Add media column to feed_posts (array of {type, url})
ALTER TABLE public.feed_posts ADD COLUMN IF NOT EXISTS media jsonb NOT NULL DEFAULT '[]'::jsonb;

-- Allow authenticated users to upload to post-archive bucket under their own folder
CREATE POLICY "Users can upload own feed media"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'post-archive'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete own feed media"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'post-archive'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
