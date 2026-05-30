ALTER TABLE public.submissions
  ADD COLUMN IF NOT EXISTS contact_phone_reached BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS contact_whatsapp_reached BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS contact_instagram_reached BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS contact_email_reached BOOLEAN NOT NULL DEFAULT false;
