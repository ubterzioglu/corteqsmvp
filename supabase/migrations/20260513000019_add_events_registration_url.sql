-- events registration_url column
-- Source: referans 20260510110939

ALTER TABLE public.events ADD COLUMN IF NOT EXISTS registration_url text;
COMMENT ON COLUMN public.events.registration_url IS 'External RSVP/registration link (Google Form, Eventbrite, etc.)';
