CREATE TABLE public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null,
  country text,
  city text,
  message text,
  status text not null default 'new',
  created_at timestamptz not null default now()
);

ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit contact message"
  ON public.contact_messages FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    char_length(full_name) BETWEEN 1 AND 120
    AND char_length(email) BETWEEN 3 AND 254
    AND email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
    AND (country IS NULL OR char_length(country) <= 80)
    AND (city IS NULL OR char_length(city) <= 80)
    AND (message IS NULL OR char_length(message) <= 2000)
  );

CREATE POLICY "Admins read contact messages"
  ON public.contact_messages FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins update contact messages"
  ON public.contact_messages FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins delete contact messages"
  ON public.contact_messages FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.notify_admins_contact_message()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.notifications (user_id, type, title, message, related_id)
  SELECT ur.user_id,
         'contact_message',
         'Yeni iletisim mesaji',
         NEW.full_name || ' (' || NEW.email || ') - ' ||
           COALESCE(NEW.city, '') ||
           CASE WHEN NEW.city IS NOT NULL AND NEW.country IS NOT NULL THEN ', ' ELSE '' END ||
           COALESCE(NEW.country, ''),
         NEW.id
  FROM public.user_roles ur
  WHERE ur.role = 'admin'::app_role;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_admins_contact_message
AFTER INSERT ON public.contact_messages
FOR EACH ROW EXECUTE FUNCTION public.notify_admins_contact_message();