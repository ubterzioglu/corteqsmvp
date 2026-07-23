
-- Add ambassador to app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'ambassador';

-- Create city ambassador applications table
CREATE TABLE public.city_ambassador_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  full_name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  city text NOT NULL,
  country text NOT NULL,
  reach_count integer,
  reach_description text,
  organized_events text,
  known_professionals text,
  first_week_plan text,
  weekly_hours text,
  motivation text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.city_ambassador_applications ENABLE ROW LEVEL SECURITY;

-- Users can create their own applications
CREATE POLICY "Users can create own applications"
  ON public.city_ambassador_applications
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can view own applications
CREATE POLICY "Users can view own applications"
  ON public.city_ambassador_applications
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Admins can view all applications
CREATE POLICY "Admins can view all applications"
  ON public.city_ambassador_applications
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Admins can update applications
CREATE POLICY "Admins can update applications"
  ON public.city_ambassador_applications
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
