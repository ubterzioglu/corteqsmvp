
CREATE TABLE public.whatsapp_join_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  landing_id uuid NOT NULL REFERENCES public.whatsapp_landings(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  full_name text,
  email text,
  phone text,
  note text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.whatsapp_join_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create own join requests"
  ON public.whatsapp_join_requests FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own join requests"
  ON public.whatsapp_join_requests FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all join requests"
  ON public.whatsapp_join_requests FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update join requests"
  ON public.whatsapp_join_requests FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER trg_whatsapp_join_requests_updated_at
  BEFORE UPDATE ON public.whatsapp_join_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.notify_admins_whatsapp_join()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_group_name text;
BEGIN
  SELECT group_name INTO v_group_name FROM public.whatsapp_landings WHERE id = NEW.landing_id;

  INSERT INTO public.notifications (user_id, type, title, message, related_id)
  SELECT ur.user_id,
         'whatsapp_join_request',
         'Yeni WhatsApp grubu giriş talebi',
         COALESCE(NEW.full_name, 'Bir kullanıcı') || ' "' || COALESCE(v_group_name, 'WhatsApp grubu') || '" grubuna katılmak istiyor.',
         NEW.id
  FROM public.user_roles ur
  WHERE ur.role = 'admin'::app_role;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_admins_whatsapp_join
  AFTER INSERT ON public.whatsapp_join_requests
  FOR EACH ROW EXECUTE FUNCTION public.notify_admins_whatsapp_join();
