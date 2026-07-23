
CREATE TABLE public.events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'yüz yüze',
  event_date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  country TEXT,
  city TEXT,
  location TEXT,
  online_url TEXT,
  price NUMERIC DEFAULT 0,
  max_attendees INTEGER,
  cover_image TEXT,
  tags TEXT[] DEFAULT '{}',
  organizer_name TEXT,
  featured BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'published',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view published events"
ON public.events FOR SELECT
TO anon, authenticated
USING (status = 'published');

CREATE POLICY "Users can view own events"
ON public.events FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can create own events"
ON public.events FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own events"
ON public.events FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own events"
ON public.events FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all events"
ON public.events FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_events_updated_at
BEFORE UPDATE ON public.events
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_events_date ON public.events(event_date);
CREATE INDEX idx_events_country_city ON public.events(country, city);
CREATE INDEX idx_events_user ON public.events(user_id);
