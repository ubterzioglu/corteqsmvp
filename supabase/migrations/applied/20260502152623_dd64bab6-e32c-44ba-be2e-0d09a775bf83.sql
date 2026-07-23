CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TABLE public.whatsapp_landings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  slug text NOT NULL UNIQUE,
  group_name text NOT NULL,
  category text NOT NULL CHECK (category IN ('alumni','hobi','is','doktor')),
  country text NOT NULL,
  city text NOT NULL,
  mode text NOT NULL DEFAULT 'visual' CHECK (mode IN ('visual','text')),
  hero_image text,
  tagline text,
  call_to_action_text text,
  conditions text,
  whatsapp_link text NOT NULL,
  admin_name text,
  admin_contact text,
  description text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  rejection_reason text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.whatsapp_landings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view approved landings"
ON public.whatsapp_landings FOR SELECT
TO anon, authenticated
USING (status = 'approved');

CREATE POLICY "Users can view own landings"
ON public.whatsapp_landings FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all landings"
ON public.whatsapp_landings FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can create own landings"
ON public.whatsapp_landings FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own landings"
ON public.whatsapp_landings FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can update all landings"
ON public.whatsapp_landings FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete landings"
ON public.whatsapp_landings FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_whatsapp_landings_updated_at
BEFORE UPDATE ON public.whatsapp_landings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_whatsapp_landings_status ON public.whatsapp_landings(status);
CREATE INDEX idx_whatsapp_landings_slug ON public.whatsapp_landings(slug);
CREATE INDEX idx_whatsapp_landings_user_id ON public.whatsapp_landings(user_id);