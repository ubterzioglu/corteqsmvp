-- founding_1000_signups table
-- Source: referans 20260512095045

CREATE TABLE IF NOT EXISTS public.founding_1000_signups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  account_type text NOT NULL,
  full_name text,
  email text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id)
);

ALTER TABLE public.founding_1000_signups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own founding signup"
  ON public.founding_1000_signups FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own founding signup or admins all"
  ON public.founding_1000_signups FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update founding signups"
  ON public.founding_1000_signups FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete founding signups"
  ON public.founding_1000_signups FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
