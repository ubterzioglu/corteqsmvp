
-- 1) hide_business_name on job_listings
ALTER TABLE public.job_listings
  ADD COLUMN IF NOT EXISTS hide_business_name boolean NOT NULL DEFAULT false;

-- 2) job_applications table
CREATE TABLE IF NOT EXISTS public.job_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL,
  applicant_id uuid NOT NULL,
  applicant_name text,
  applicant_email text,
  applicant_phone text,
  message text,
  attachment_url text,
  attachment_name text,
  link_url text,
  status text NOT NULL DEFAULT 'submitted',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Applicants can create own applications"
  ON public.job_applications FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = applicant_id);

CREATE POLICY "Applicants can view own applications"
  ON public.job_applications FOR SELECT
  TO authenticated
  USING (auth.uid() = applicant_id);

CREATE POLICY "Listing owner can view applications"
  ON public.job_applications FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.job_listings jl
    WHERE jl.id = job_applications.listing_id
      AND jl.user_id = auth.uid()
  ));

CREATE POLICY "Listing owner can update applications"
  ON public.job_applications FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.job_listings jl
    WHERE jl.id = job_applications.listing_id
      AND jl.user_id = auth.uid()
  ));

CREATE TRIGGER update_job_applications_updated_at
  BEFORE UPDATE ON public.job_applications
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3) Notify listing owner on new application
CREATE OR REPLACE FUNCTION public.notify_owner_on_job_application()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_owner uuid;
  v_title text;
BEGIN
  SELECT user_id, title INTO v_owner, v_title
  FROM public.job_listings WHERE id = NEW.listing_id;

  IF v_owner IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, type, title, message, related_id)
    VALUES (
      v_owner,
      'job_application',
      '📩 Yeni iş başvurusu: ' || COALESCE(v_title, 'İlan'),
      COALESCE(NEW.applicant_name, 'Bir aday') || ' "' || COALESCE(v_title, 'ilanına') || '" başvuru gönderdi.',
      NEW.id
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_on_job_application
  AFTER INSERT ON public.job_applications
  FOR EACH ROW EXECUTE FUNCTION public.notify_owner_on_job_application();

-- 4) Storage bucket (private, 5MB)
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('job-applications', 'job-applications', false, 5242880)
ON CONFLICT (id) DO UPDATE SET file_size_limit = 5242880, public = false;

CREATE POLICY "Applicants can upload to own folder"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'job-applications'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Applicants can read own files"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'job-applications'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
