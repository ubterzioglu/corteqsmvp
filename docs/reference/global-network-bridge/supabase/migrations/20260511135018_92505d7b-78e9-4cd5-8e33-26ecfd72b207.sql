
-- Add new cafe columns
ALTER TABLE public.cafes
  ADD COLUMN IF NOT EXISTS kind text NOT NULL DEFAULT 'community',
  ADD COLUMN IF NOT EXISTS open_entry boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS entry_question text,
  ADD COLUMN IF NOT EXISTS capacity integer,
  ADD COLUMN IF NOT EXISTS member_count integer NOT NULL DEFAULT 0;

ALTER TABLE public.cafes
  ADD CONSTRAINT cafes_kind_check CHECK (kind IN ('community','relocation','expo'));

-- Cafe memberships extras
ALTER TABLE public.cafe_memberships
  ADD COLUMN IF NOT EXISTS answer text,
  ADD COLUMN IF NOT EXISTS approved boolean NOT NULL DEFAULT true;

-- Allow cafe owner to update memberships (approve/reject)
CREATE POLICY "Cafe owners can update memberships"
  ON public.cafe_memberships FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.cafes c WHERE c.id = cafe_memberships.cafe_id AND c.created_by = auth.uid()));

CREATE POLICY "Cafe owners can delete memberships"
  ON public.cafe_memberships FOR DELETE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.cafes c WHERE c.id = cafe_memberships.cafe_id AND c.created_by = auth.uid()));

-- Update daily-join trigger: skip system cafes (relocation/expo)
CREATE OR REPLACE FUNCTION public.enforce_daily_cafe_join()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_kind text;
BEGIN
  SELECT kind INTO v_kind FROM public.cafes WHERE id = NEW.cafe_id;
  IF v_kind IN ('relocation','expo') THEN
    RETURN NEW;
  END IF;
  IF EXISTS (
    SELECT 1 FROM public.cafe_memberships cm
    JOIN public.cafes c ON c.id = cm.cafe_id
    WHERE cm.user_id = NEW.user_id
      AND cm.cafe_id <> NEW.cafe_id
      AND cm.joined_at > now() - interval '24 hours'
      AND c.kind = 'community'
  ) THEN
    RAISE EXCEPTION 'daily_cafe_limit' USING HINT = 'Bir gün içinde sadece bir community cafe''ye katılabilirsiniz.';
  END IF;
  RETURN NEW;
END;
$$;

-- Capacity enforcement
CREATE OR REPLACE FUNCTION public.enforce_cafe_capacity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_cap integer;
  v_count integer;
BEGIN
  SELECT capacity, member_count INTO v_cap, v_count FROM public.cafes WHERE id = NEW.cafe_id;
  IF v_cap IS NOT NULL AND v_count >= v_cap THEN
    RAISE EXCEPTION 'cafe_full' USING HINT = 'Cafe doldu.';
  END IF;
  RETURN NEW;
END;
$$;

-- TR phone restriction: TR users only join relocation/expo
CREATE OR REPLACE FUNCTION public.enforce_tr_phone_restriction()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_phone text;
  v_kind text;
BEGIN
  SELECT kind INTO v_kind FROM public.cafes WHERE id = NEW.cafe_id;
  IF v_kind IN ('relocation','expo') THEN
    RETURN NEW;
  END IF;
  SELECT phone INTO v_phone FROM public.profiles WHERE id = NEW.user_id;
  IF v_phone IS NOT NULL AND (v_phone LIKE '+90%' OR v_phone LIKE '0090%') THEN
    RAISE EXCEPTION 'tr_phone_restricted' USING HINT = 'TR numarası yalnızca Relocation/Expo cafelerine katılabilir.';
  END IF;
  RETURN NEW;
END;
$$;

-- Member count maintenance
CREATE OR REPLACE FUNCTION public.update_cafe_member_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.cafes SET member_count = member_count + 1 WHERE id = NEW.cafe_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.cafes SET member_count = GREATEST(0, member_count - 1) WHERE id = OLD.cafe_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

-- Drop existing daily trigger if any, then re-attach all
DROP TRIGGER IF EXISTS trg_enforce_daily_cafe_join ON public.cafe_memberships;
DROP TRIGGER IF EXISTS trg_enforce_cafe_capacity ON public.cafe_memberships;
DROP TRIGGER IF EXISTS trg_enforce_tr_phone_restriction ON public.cafe_memberships;
DROP TRIGGER IF EXISTS trg_update_cafe_member_count_ins ON public.cafe_memberships;
DROP TRIGGER IF EXISTS trg_update_cafe_member_count_del ON public.cafe_memberships;

CREATE TRIGGER trg_enforce_tr_phone_restriction
  BEFORE INSERT ON public.cafe_memberships
  FOR EACH ROW EXECUTE FUNCTION public.enforce_tr_phone_restriction();

CREATE TRIGGER trg_enforce_daily_cafe_join
  BEFORE INSERT ON public.cafe_memberships
  FOR EACH ROW EXECUTE FUNCTION public.enforce_daily_cafe_join();

CREATE TRIGGER trg_enforce_cafe_capacity
  BEFORE INSERT ON public.cafe_memberships
  FOR EACH ROW EXECUTE FUNCTION public.enforce_cafe_capacity();

CREATE TRIGGER trg_update_cafe_member_count_ins
  AFTER INSERT ON public.cafe_memberships
  FOR EACH ROW EXECUTE FUNCTION public.update_cafe_member_count();

CREATE TRIGGER trg_update_cafe_member_count_del
  AFTER DELETE ON public.cafe_memberships
  FOR EACH ROW EXECUTE FUNCTION public.update_cafe_member_count();

-- Backfill member_count
UPDATE public.cafes c SET member_count = (SELECT COUNT(*) FROM public.cafe_memberships m WHERE m.cafe_id = c.id);

-- Set capacity on existing community cafes by duration
UPDATE public.cafes SET capacity = CASE WHEN duration_hours >= 4 THEN 300 ELSE 100 END
  WHERE capacity IS NULL AND kind = 'community';

-- Seed system cafes (Relocation + Expo) per country, owned by first admin user
DO $$
DECLARE
  v_admin uuid;
  v_country text;
  v_countries text[] := ARRAY['Türkiye','Almanya','Hollanda','Birleşik Krallık','Amerika Birleşik Devletleri','Fransa','Belçika','Avusturya','İsviçre','Kanada'];
BEGIN
  SELECT user_id INTO v_admin FROM public.user_roles WHERE role = 'admin' LIMIT 1;
  IF v_admin IS NULL THEN
    RETURN;
  END IF;
  FOREACH v_country IN ARRAY v_countries LOOP
    INSERT INTO public.cafes (name, theme, country, city, linkedin_url, created_by, opens_at, closes_at, duration_hours, kind, open_entry, capacity)
    VALUES ('Relocation Cafe – ' || v_country, 'Genel', v_country, NULL, 'https://linkedin.com', v_admin, now(), '2099-01-01'::timestamptz, 0, 'relocation', true, NULL)
    ON CONFLICT DO NOTHING;
    INSERT INTO public.cafes (name, theme, country, city, linkedin_url, created_by, opens_at, closes_at, duration_hours, kind, open_entry, capacity)
    VALUES ('Expo Cafe – ' || v_country, 'İşletmeler', v_country, NULL, 'https://linkedin.com', v_admin, now(), '2099-01-01'::timestamptz, 0, 'expo', true, NULL)
    ON CONFLICT DO NOTHING;
  END LOOP;
END $$;
