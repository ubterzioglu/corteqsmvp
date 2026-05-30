CREATE TABLE IF NOT EXISTS public.whatsapp_landings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  slug TEXT NOT NULL UNIQUE,
  group_name TEXT NOT NULL,
  category TEXT NOT NULL,
  country TEXT NOT NULL,
  city TEXT NOT NULL,
  mode TEXT NOT NULL DEFAULT 'text',
  hero_image TEXT NULL,
  tagline TEXT NULL,
  call_to_action_text TEXT NULL,
  conditions TEXT NULL,
  whatsapp_link TEXT NOT NULL,
  admin_name TEXT NULL,
  admin_contact TEXT NULL,
  description TEXT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  rejection_reason TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'whatsapp_landings_category_check'
      AND conrelid = 'public.whatsapp_landings'::regclass
  ) THEN
    ALTER TABLE public.whatsapp_landings
      ADD CONSTRAINT whatsapp_landings_category_check
      CHECK (category IN ('alumni', 'hobi', 'is', 'doktor', 'yatirim', 'girisim', 'akademik', 'dayanisma', 'diger'));
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'whatsapp_landings_mode_check'
      AND conrelid = 'public.whatsapp_landings'::regclass
  ) THEN
    ALTER TABLE public.whatsapp_landings
      ADD CONSTRAINT whatsapp_landings_mode_check
      CHECK (mode IN ('visual', 'text'));
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'whatsapp_landings_status_check'
      AND conrelid = 'public.whatsapp_landings'::regclass
  ) THEN
    ALTER TABLE public.whatsapp_landings
      ADD CONSTRAINT whatsapp_landings_status_check
      CHECK (status IN ('pending', 'approved', 'rejected'));
  END IF;
END
$$;

CREATE INDEX IF NOT EXISTS whatsapp_landings_status_idx
  ON public.whatsapp_landings (status);

CREATE INDEX IF NOT EXISTS whatsapp_landings_slug_idx
  ON public.whatsapp_landings (slug);

CREATE INDEX IF NOT EXISTS whatsapp_landings_created_at_idx
  ON public.whatsapp_landings (created_at DESC);

ALTER TABLE public.whatsapp_landings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public approved whatsapp landings select" ON public.whatsapp_landings;
CREATE POLICY "Public approved whatsapp landings select"
  ON public.whatsapp_landings
  FOR SELECT
  TO anon, authenticated
  USING (status = 'approved');

DROP POLICY IF EXISTS "Authenticated users can insert whatsapp landings" ON public.whatsapp_landings;
CREATE POLICY "Authenticated users can insert whatsapp landings"
  ON public.whatsapp_landings
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Owners can select own whatsapp landings" ON public.whatsapp_landings;
CREATE POLICY "Owners can select own whatsapp landings"
  ON public.whatsapp_landings
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Owners can delete own whatsapp landings" ON public.whatsapp_landings;
CREATE POLICY "Owners can delete own whatsapp landings"
  ON public.whatsapp_landings
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can manage whatsapp landings" ON public.whatsapp_landings;
CREATE POLICY "Admins can manage whatsapp landings"
  ON public.whatsapp_landings
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.admin_users
      WHERE admin_users.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.admin_users
      WHERE admin_users.user_id = auth.uid()
    )
  );

GRANT SELECT ON public.whatsapp_landings TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.whatsapp_landings TO authenticated;

CREATE TABLE IF NOT EXISTS public.whatsapp_join_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  landing_id UUID NOT NULL REFERENCES public.whatsapp_landings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NULL,
  note TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS whatsapp_join_requests_landing_id_idx
  ON public.whatsapp_join_requests (landing_id);

CREATE INDEX IF NOT EXISTS whatsapp_join_requests_created_at_idx
  ON public.whatsapp_join_requests (created_at DESC);

ALTER TABLE public.whatsapp_join_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can insert whatsapp join requests" ON public.whatsapp_join_requests;
CREATE POLICY "Authenticated users can insert whatsapp join requests"
  ON public.whatsapp_join_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Owners can select own whatsapp join requests" ON public.whatsapp_join_requests;
CREATE POLICY "Owners can select own whatsapp join requests"
  ON public.whatsapp_join_requests
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can manage whatsapp join requests" ON public.whatsapp_join_requests;
CREATE POLICY "Admins can manage whatsapp join requests"
  ON public.whatsapp_join_requests
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.admin_users
      WHERE admin_users.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.admin_users
      WHERE admin_users.user_id = auth.uid()
    )
  );

GRANT INSERT, SELECT ON public.whatsapp_join_requests TO authenticated;
