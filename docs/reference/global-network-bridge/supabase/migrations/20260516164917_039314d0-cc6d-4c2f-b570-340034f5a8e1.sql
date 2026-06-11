
-- Extra metadata on WhatsApp landings (admin-curated)
ALTER TABLE public.whatsapp_landings
  ADD COLUMN IF NOT EXISTS theme text,
  ADD COLUMN IF NOT EXISTS member_count integer,
  ADD COLUMN IF NOT EXISTS central_country text,
  ADD COLUMN IF NOT EXISTS central_city text,
  ADD COLUMN IF NOT EXISTS primary_language text,
  ADD COLUMN IF NOT EXISTS founded_year integer,
  ADD COLUMN IF NOT EXISTS accept_form_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS accept_form_questions text;

-- Member-submitted simple link requests (no landing page)
CREATE TABLE IF NOT EXISTS public.whatsapp_link_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  submitter_name text,
  submitter_contact text,
  whatsapp_link text NOT NULL,
  group_name text,
  category text,
  country text,
  city text,
  note text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','listed')),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.whatsapp_link_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit link request"
  ON public.whatsapp_link_requests FOR INSERT TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Submitter can view own link request"
  ON public.whatsapp_link_requests FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view link requests"
  ON public.whatsapp_link_requests FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update link requests"
  ON public.whatsapp_link_requests FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete link requests"
  ON public.whatsapp_link_requests FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX IF NOT EXISTS idx_wlr_status ON public.whatsapp_link_requests(status);
CREATE INDEX IF NOT EXISTS idx_wlr_created ON public.whatsapp_link_requests(created_at DESC);

CREATE OR REPLACE FUNCTION public.notify_admins_whatsapp_link_request()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.notifications (user_id, type, title, message, related_id)
  SELECT ur.user_id,
         'whatsapp_link_request',
         'Yeni WhatsApp grup linki paylaşıldı',
         'Böyle bir talep var — "' || COALESCE(NEW.group_name, 'WhatsApp grubu') ||
         '" grubunu listelemek ister misin? Link: ' || NEW.whatsapp_link,
         NEW.id
  FROM public.user_roles ur
  WHERE ur.role = 'admin'::app_role;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_admins_link_request ON public.whatsapp_link_requests;
CREATE TRIGGER trg_notify_admins_link_request
  AFTER INSERT ON public.whatsapp_link_requests
  FOR EACH ROW EXECUTE FUNCTION public.notify_admins_whatsapp_link_request();

-- Likes
CREATE TABLE IF NOT EXISTS public.whatsapp_landing_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  landing_id uuid NOT NULL REFERENCES public.whatsapp_landings(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (landing_id, user_id)
);
ALTER TABLE public.whatsapp_landing_likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read landing likes" ON public.whatsapp_landing_likes
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Users can like" ON public.whatsapp_landing_likes
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unlike" ON public.whatsapp_landing_likes
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Follows
CREATE TABLE IF NOT EXISTS public.whatsapp_landing_follows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  landing_id uuid NOT NULL REFERENCES public.whatsapp_landings(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (landing_id, user_id)
);
ALTER TABLE public.whatsapp_landing_follows ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read landing follows" ON public.whatsapp_landing_follows
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Users can follow landing" ON public.whatsapp_landing_follows
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unfollow landing" ON public.whatsapp_landing_follows
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Comments
CREATE TABLE IF NOT EXISTS public.whatsapp_landing_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  landing_id uuid NOT NULL REFERENCES public.whatsapp_landings(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  body text NOT NULL CHECK (char_length(body) <= 1000),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.whatsapp_landing_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read landing comments" ON public.whatsapp_landing_comments
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Users can comment" ON public.whatsapp_landing_comments
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users edit own comments" ON public.whatsapp_landing_comments
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users delete own comments" ON public.whatsapp_landing_comments
  FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins delete comments" ON public.whatsapp_landing_comments
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX IF NOT EXISTS idx_wlc_landing ON public.whatsapp_landing_comments(landing_id, created_at DESC);
