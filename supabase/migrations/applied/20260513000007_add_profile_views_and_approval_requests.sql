-- profile_views table + is_verified/hiring_mode on profiles
-- Source: referans 20260511151424 + 20260511142813

CREATE TABLE IF NOT EXISTS public.profile_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL,
  viewer_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_profile_views_profile ON public.profile_views(profile_id);

ALTER TABLE public.profile_views ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can record a profile view" ON public.profile_views;
CREATE POLICY "Anyone can record a profile view"
  ON public.profile_views FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Owners can read their views" ON public.profile_views;
CREATE POLICY "Owners can read their views"
  ON public.profile_views FOR SELECT USING (auth.uid() = profile_id);

CREATE TABLE IF NOT EXISTS public.approval_requests (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  request_type text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'pending',
  admin_note text,
  decided_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  decided_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.approval_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own approval requests"
  ON public.approval_requests FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can create own approval requests"
  ON public.approval_requests FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all approval requests"
  ON public.approval_requests FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update approval requests"
  ON public.approval_requests FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER set_approval_requests_updated_at
  BEFORE UPDATE ON public.approval_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_approval_requests_status ON public.approval_requests(status);
CREATE INDEX IF NOT EXISTS idx_approval_requests_user ON public.approval_requests(user_id);

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_verified boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS hiring_mode boolean NOT NULL DEFAULT false;
