
CREATE TABLE public.appointments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_id UUID NOT NULL,
  provider_kind TEXT NOT NULL DEFAULT 'consultant',
  client_id UUID NOT NULL,
  client_name TEXT,
  client_email TEXT,
  client_timezone TEXT NOT NULL,
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 30,
  topic TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  meeting_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_appointments_provider ON public.appointments(provider_id, scheduled_at);
CREATE INDEX idx_appointments_client ON public.appointments(client_id, scheduled_at);

CREATE POLICY "Provider or client can view their appointments"
ON public.appointments FOR SELECT TO authenticated
USING (auth.uid() = provider_id OR auth.uid() = client_id);

CREATE POLICY "Authenticated users can request appointments"
ON public.appointments FOR INSERT TO authenticated
WITH CHECK (auth.uid() = client_id);

CREATE POLICY "Provider or client can update their appointments"
ON public.appointments FOR UPDATE TO authenticated
USING (auth.uid() = provider_id OR auth.uid() = client_id);

CREATE POLICY "Provider or client can delete their appointments"
ON public.appointments FOR DELETE TO authenticated
USING (auth.uid() = provider_id OR auth.uid() = client_id);

CREATE TRIGGER update_appointments_updated_at
BEFORE UPDATE ON public.appointments
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Notify provider on new appointment request
CREATE OR REPLACE FUNCTION public.notify_provider_on_appointment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.notifications (user_id, type, title, message, related_id)
  VALUES (
    NEW.provider_id,
    'appointment_request',
    'Yeni Randevu Talebi',
    COALESCE(NEW.client_name, 'Bir kullanıcı') || ' ' ||
      to_char(NEW.scheduled_at AT TIME ZONE 'UTC', 'DD Mon YYYY HH24:MI') || ' UTC için ' ||
      NEW.duration_minutes || ' dk randevu talep etti.',
    NEW.id
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_appointment_created
AFTER INSERT ON public.appointments
FOR EACH ROW EXECUTE FUNCTION public.notify_provider_on_appointment();
