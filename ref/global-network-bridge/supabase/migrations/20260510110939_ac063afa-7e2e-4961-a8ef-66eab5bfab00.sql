ALTER TABLE public.events ADD COLUMN IF NOT EXISTS registration_url TEXT;
COMMENT ON COLUMN public.events.registration_url IS 'External RSVP/registration link (Google Form, Eventbrite, etc.)';