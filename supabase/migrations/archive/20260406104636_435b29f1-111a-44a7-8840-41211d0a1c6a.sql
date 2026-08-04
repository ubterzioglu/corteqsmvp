-- Create submissions table for all form registrations
CREATE TABLE public.submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  form_type TEXT NOT NULL DEFAULT 'register',
  category TEXT,
  fullname TEXT NOT NULL,
  country TEXT NOT NULL,
  city TEXT NOT NULL,
  business TEXT,
  field TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  description TEXT,
  contest_interest BOOLEAN DEFAULT false,
  linkedin TEXT,
  instagram TEXT,
  tiktok TEXT,
  facebook TEXT,
  twitter TEXT,
  website TEXT,
  consent BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert (public form)
CREATE POLICY "Anyone can submit a registration"
  ON public.submissions
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Only authenticated users can read (admin)
CREATE POLICY "Authenticated users can read submissions"
  ON public.submissions
  FOR SELECT
  TO authenticated
  USING (true);