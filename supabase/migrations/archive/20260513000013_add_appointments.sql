-- appointments table
-- Source: referans 20260511171028

CREATE TABLE IF NOT EXISTS public.appointments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_id uuid NOT NULL,
  provider_kind text NOT NULL DEFAULT 'consultant',
  client_id uuid NOT NULL,
  client_name text,
  client_email text,
  client_timezone text NOT NULL,
  scheduled_at timestamptz NOT NULL,
  duration_minutes integer NOT NULL DEFAULT 30,
  topic text,
  notes text,
  status text NOT NULL DEFAULT 'pending',
  meeting_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_appointments_provider ON public.appointments(provider_id, scheduled_at);
CREATE INDEX IF NOT EXISTS idx_appointments_client ON public.appointments(client_id, scheduled_at);

CREATE POLICY "Provider or client can view their appointments"
  ON public.appointments FOR SELECT TO authenticated
  USING (auth.uid() = provider_id OR auth.uid() = client_id);

CREATE POLICY "Authenticated users can request appointments"
  ON public.appointments FOR INSERT TO authenticated WITH CHECK (auth.uid() = client_id);

CREATE POLICY "Provider or client can update their appointments"
  ON public.appointments FOR UPDATE TO authenticated
  USING (auth.uid() = provider_id OR auth.uid() = client_id);

CREATE POLICY "Provider or client can delete their appointments"
  ON public.appointments FOR DELETE TO authenticated
  USING (auth.uid() = provider_id OR auth.uid() = client_id);

CREATE TRIGGER update_appointments_updated_at
  BEFORE UPDATE ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
