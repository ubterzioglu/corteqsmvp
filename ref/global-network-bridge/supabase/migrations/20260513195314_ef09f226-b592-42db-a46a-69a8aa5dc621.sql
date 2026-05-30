ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS business_license_path text,
ADD COLUMN IF NOT EXISTS business_license_name text,
ADD COLUMN IF NOT EXISTS business_license_uploaded_at timestamptz,
ADD COLUMN IF NOT EXISTS business_license_status text NOT NULL DEFAULT 'not_uploaded',
ADD COLUMN IF NOT EXISTS business_license_admin_note text;