-- cafe columns (kind, capacity, etc.) + cafe triggers + member_count functions
-- Source: referans 20260511135018 + 20260512122224

ALTER TABLE public.cafes
  ADD COLUMN IF NOT EXISTS kind text NOT NULL DEFAULT 'community',
  ADD COLUMN IF NOT EXISTS open_entry boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS entry_question text,
  ADD COLUMN IF NOT EXISTS capacity integer,
  ADD COLUMN IF NOT EXISTS member_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS continent text,
  ADD COLUMN IF NOT EXISTS audience_scope text NOT NULL DEFAULT 'everyone',
  ADD COLUMN IF NOT EXISTS referral_code text;

ALTER TABLE public.cafes DROP CONSTRAINT IF EXISTS cafes_kind_check;
ALTER TABLE public.cafes ADD CONSTRAINT cafes_kind_check CHECK (kind IN ('community','relocation','expo'));

ALTER TABLE public.cafe_memberships
  ADD COLUMN IF NOT EXISTS answer text,
  ADD COLUMN IF NOT EXISTS approved boolean NOT NULL DEFAULT true;

CREATE POLICY "Cafe owners can update memberships"
  ON public.cafe_memberships FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.cafes c WHERE c.id = cafe_memberships.cafe_id AND c.created_by = auth.uid()));

CREATE POLICY "Cafe owners can delete memberships"
  ON public.cafe_memberships FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.cafes c WHERE c.id = cafe_memberships.cafe_id AND c.created_by = auth.uid()));

CREATE OR REPLACE FUNCTION public.enforce_daily_cafe_join()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_kind text;
BEGIN
  SELECT kind INTO v_kind FROM public.cafes WHERE id = NEW.cafe_id;
  IF v_kind IN ('relocation','expo') THEN RETURN NEW; END IF;
  IF EXISTS (
    SELECT 1 FROM public.cafe_memberships cm JOIN public.cafes c ON c.id = cm.cafe_id
    WHERE cm.user_id = NEW.user_id AND cm.cafe_id <> NEW.cafe_id
      AND cm.joined_at > now() - interval '24 hours' AND c.kind = 'community'
  ) THEN RAISE EXCEPTION 'daily_cafe_limit' USING HINT = 'Bir gün içinde sadece bir community cafe''ye katılabilirsiniz.';
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.enforce_cafe_capacity()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_cap integer; v_count integer;
BEGIN
  SELECT capacity, member_count INTO v_cap, v_count FROM public.cafes WHERE id = NEW.cafe_id;
  IF v_cap IS NOT NULL AND v_count >= v_cap THEN
    RAISE EXCEPTION 'cafe_full' USING HINT = 'Cafe doldu.';
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_cafe_member_count()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
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

DROP TRIGGER IF EXISTS trg_enforce_daily_cafe_join ON public.cafe_memberships;
DROP TRIGGER IF EXISTS trg_enforce_cafe_capacity ON public.cafe_memberships;
DROP TRIGGER IF EXISTS trg_update_cafe_member_count_ins ON public.cafe_memberships;
DROP TRIGGER IF EXISTS trg_update_cafe_member_count_del ON public.cafe_memberships;

CREATE TRIGGER trg_enforce_daily_cafe_join
  BEFORE INSERT ON public.cafe_memberships FOR EACH ROW EXECUTE FUNCTION public.enforce_daily_cafe_join();
CREATE TRIGGER trg_enforce_cafe_capacity
  BEFORE INSERT ON public.cafe_memberships FOR EACH ROW EXECUTE FUNCTION public.enforce_cafe_capacity();
CREATE TRIGGER trg_update_cafe_member_count_ins
  AFTER INSERT ON public.cafe_memberships FOR EACH ROW EXECUTE FUNCTION public.update_cafe_member_count();
CREATE TRIGGER trg_update_cafe_member_count_del
  AFTER DELETE ON public.cafe_memberships FOR EACH ROW EXECUTE FUNCTION public.update_cafe_member_count();
