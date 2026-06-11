CREATE TABLE public.founding_1000_signups (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  account_type text not null,
  full_name text,
  email text,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  unique (user_id)
);

ALTER TABLE public.founding_1000_signups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own founding signup"
  ON public.founding_1000_signups FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own founding signup or admins all"
  ON public.founding_1000_signups FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update founding signups"
  ON public.founding_1000_signups FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete founding signups"
  ON public.founding_1000_signups FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.notify_admins_founding_1000()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.notifications (user_id, type, title, message, related_id)
  SELECT ur.user_id,
         'founding_1000_signup',
         'Yeni Founding 1000 kaydi',
         COALESCE(NEW.full_name, NEW.email, 'Bir kullanici') || ' (' || NEW.account_type || ') Founding 1000 programina kaydoldu.',
         NEW.id
  FROM public.user_roles ur
  WHERE ur.role = 'admin'::app_role;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_admins_founding_1000
AFTER INSERT ON public.founding_1000_signups
FOR EACH ROW EXECUTE FUNCTION public.notify_admins_founding_1000();