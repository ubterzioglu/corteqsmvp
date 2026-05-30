-- ambassador referral columns + referral functions/triggers
-- Source: referans 20260512100721

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS ambassador_referral_code text UNIQUE,
  ADD COLUMN IF NOT EXISTS referred_by_code text,
  ADD COLUMN IF NOT EXISTS referral_discount_pct integer NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_profiles_referred_by_code ON public.profiles(referred_by_code);

CREATE OR REPLACE FUNCTION public.generate_ambassador_referral_code()
RETURNS text LANGUAGE plpgsql AS $$
DECLARE
  v_code text;
  v_exists boolean;
BEGIN
  LOOP
    v_code := 'AMB-' || upper(substring(md5(random()::text || clock_timestamp()::text) for 6));
    SELECT EXISTS(SELECT 1 FROM public.profiles WHERE ambassador_referral_code = v_code) INTO v_exists;
    EXIT WHEN NOT v_exists;
  END LOOP;
  RETURN v_code;
END;
$$;

CREATE OR REPLACE FUNCTION public.assign_ambassador_referral_code()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.role::text = 'ambassador' THEN
    UPDATE public.profiles
       SET ambassador_referral_code = public.generate_ambassador_referral_code()
     WHERE id = NEW.user_id
       AND (ambassador_referral_code IS NULL OR ambassador_referral_code = '');
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_assign_ambassador_referral_code ON public.user_roles;
CREATE TRIGGER trg_assign_ambassador_referral_code
  AFTER INSERT ON public.user_roles
  FOR EACH ROW EXECUTE FUNCTION public.assign_ambassador_referral_code();

CREATE OR REPLACE FUNCTION public.apply_referral_discount()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_match uuid;
BEGIN
  IF NEW.referred_by_code IS NOT NULL AND NEW.referred_by_code <> '' THEN
    SELECT id INTO v_match FROM public.profiles WHERE ambassador_referral_code = NEW.referred_by_code LIMIT 1;
    IF v_match IS NOT NULL AND v_match <> NEW.id THEN
      NEW.referral_discount_pct := 5;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_apply_referral_discount ON public.profiles;
CREATE TRIGGER trg_apply_referral_discount
  BEFORE INSERT OR UPDATE OF referred_by_code ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.apply_referral_discount();
