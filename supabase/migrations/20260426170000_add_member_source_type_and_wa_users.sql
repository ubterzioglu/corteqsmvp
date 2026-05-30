CREATE TABLE IF NOT EXISTS public.wa_users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  wa_id TEXT,
  city TEXT,
  current_step TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE,
  name TEXT,
  surname TEXT,
  country TEXT,
  category TEXT,
  note TEXT,
  funnel_interest TEXT,
  organization TEXT,
  occupation_interest TEXT,
  email TEXT,
  phone TEXT,
  discovery_source TEXT,
  referral_code TEXT,
  whatsapp_group_interest BOOLEAN,
  privacy_consent BOOLEAN,
  registration_status TEXT,
  registration_completed_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE public.submissions
  ADD COLUMN IF NOT EXISTS source_type TEXT NOT NULL DEFAULT 'form';

ALTER TABLE public.wa_users
  ADD COLUMN IF NOT EXISTS source_type TEXT NOT NULL DEFAULT 'wa';

UPDATE public.submissions
SET source_type = 'chatbot'
WHERE referral_source = 'ai-chat'
  AND source_type = 'form';

UPDATE public.wa_users
SET source_type = 'wa'
WHERE source_type IS NULL
   OR source_type <> 'wa';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'submissions_source_type_check'
      AND conrelid = 'public.submissions'::regclass
  ) THEN
    ALTER TABLE public.submissions
      ADD CONSTRAINT submissions_source_type_check
      CHECK (source_type IN ('form', 'chatbot'));
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'wa_users_source_type_check'
      AND conrelid = 'public.wa_users'::regclass
  ) THEN
    ALTER TABLE public.wa_users
      ADD CONSTRAINT wa_users_source_type_check
      CHECK (source_type = 'wa');
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS submissions_source_type_idx
  ON public.submissions (source_type);

CREATE INDEX IF NOT EXISTS wa_users_created_at_idx
  ON public.wa_users (created_at DESC);

CREATE INDEX IF NOT EXISTS wa_users_source_type_idx
  ON public.wa_users (source_type);
