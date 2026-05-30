
-- Remove daily cafe join limit
DROP FUNCTION IF EXISTS public.enforce_daily_cafe_join() CASCADE;

-- Enforce max 3 cafes opened per user per day
CREATE OR REPLACE FUNCTION public.enforce_daily_cafe_open_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count integer;
BEGIN
  IF NEW.created_by IS NULL THEN
    RETURN NEW;
  END IF;
  SELECT COUNT(*) INTO v_count
  FROM public.cafes
  WHERE created_by = NEW.created_by
    AND created_at > now() - interval '24 hours';
  IF v_count >= 3 THEN
    RAISE EXCEPTION 'daily_cafe_open_limit' USING HINT = 'Günde en fazla 3 cafe açabilirsin.';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_daily_cafe_open_limit ON public.cafes;
CREATE TRIGGER trg_enforce_daily_cafe_open_limit
BEFORE INSERT ON public.cafes
FOR EACH ROW
EXECUTE FUNCTION public.enforce_daily_cafe_open_limit();
