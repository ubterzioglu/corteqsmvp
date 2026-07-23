-- Add backer/donation fields to submissions for Onursal Kurucular programi.

ALTER TABLE public.submissions
  ADD COLUMN IF NOT EXISTS company_name TEXT,
  ADD COLUMN IF NOT EXISTS donation_amount INTEGER,
  ADD COLUMN IF NOT EXISTS donation_currency TEXT,
  ADD COLUMN IF NOT EXISTS whatsapp_interest BOOLEAN DEFAULT false;
