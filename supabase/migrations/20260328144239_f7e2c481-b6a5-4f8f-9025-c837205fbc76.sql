
-- Add 'business' to app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'business';

-- Add onboarding_completed flag to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS onboarding_completed boolean NOT NULL DEFAULT false;

-- Add account_type to profiles for quick access (mirrors primary role)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS account_type text;
