ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS organizer_type text NOT NULL DEFAULT 'community';

CREATE INDEX IF NOT EXISTS idx_events_organizer_type ON public.events(organizer_type);