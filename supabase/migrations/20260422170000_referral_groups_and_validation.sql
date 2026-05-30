BEGIN;

CREATE TABLE IF NOT EXISTS public.referral_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT referral_groups_code_format CHECK (code ~ '^[A-Z]{2}$')
);

INSERT INTO public.referral_groups (name, code)
VALUES ('Genel', 'GN')
ON CONFLICT (code) DO NOTHING;

ALTER TABLE public.referral_codes
  ADD COLUMN IF NOT EXISTS group_id UUID REFERENCES public.referral_groups(id),
  ADD COLUMN IF NOT EXISTS group_code TEXT,
  ADD COLUMN IF NOT EXISTS valid_from DATE,
  ADD COLUMN IF NOT EXISTS valid_until DATE,
  ADD COLUMN IF NOT EXISTS usage_count INTEGER NOT NULL DEFAULT 0;

DO $$
DECLARE
  default_group_id UUID;
BEGIN
  SELECT id INTO default_group_id
  FROM public.referral_groups
  WHERE code = 'GN'
  LIMIT 1;

  IF default_group_id IS NULL THEN
    INSERT INTO public.referral_groups (name, code)
    VALUES ('Genel', 'GN')
    RETURNING id INTO default_group_id;
  END IF;

  UPDATE public.referral_codes
  SET
    group_id = COALESCE(group_id, default_group_id),
    group_code = COALESCE(group_code, 'GN'),
    valid_from = COALESCE(valid_from, COALESCE(created_at::date, CURRENT_DATE)),
    valid_until = COALESCE(valid_until, COALESCE(created_at::date, CURRENT_DATE) + INTERVAL '1 year'),
    usage_count = COALESCE(usage_count, 0)
  WHERE group_id IS NULL
    OR group_code IS NULL
    OR valid_from IS NULL
    OR valid_until IS NULL
    OR usage_count IS NULL;
END $$;

ALTER TABLE public.referral_codes
  ALTER COLUMN group_id SET NOT NULL,
  ALTER COLUMN group_code SET NOT NULL,
  ALTER COLUMN valid_from SET NOT NULL,
  ALTER COLUMN valid_until SET NOT NULL;

ALTER TABLE public.referral_codes
  DROP CONSTRAINT IF EXISTS referral_codes_valid_window;

ALTER TABLE public.referral_codes
  ADD CONSTRAINT referral_codes_valid_window CHECK (valid_until >= valid_from);

CREATE INDEX IF NOT EXISTS referral_codes_group_lookup_idx
  ON public.referral_codes (group_id, valid_from, valid_until);

CREATE INDEX IF NOT EXISTS referral_codes_usage_count_idx
  ON public.referral_codes (usage_count DESC, used_at DESC NULLS LAST);

ALTER TABLE public.submissions
  ADD COLUMN IF NOT EXISTS referral_code_id UUID REFERENCES public.referral_codes(id);

CREATE INDEX IF NOT EXISTS submissions_referral_code_id_idx
  ON public.submissions (referral_code_id);

UPDATE public.submissions AS submissions
SET referral_code_id = referral_codes.id
FROM public.referral_codes AS referral_codes
WHERE submissions.referral_code_id IS NULL
  AND submissions.referral_code IS NOT NULL
  AND BTRIM(submissions.referral_code) <> ''
  AND UPPER(BTRIM(submissions.referral_code)) = UPPER(referral_codes.code);

CREATE TABLE IF NOT EXISTS public.referral_code_usages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referral_code_id UUID NOT NULL REFERENCES public.referral_codes(id) ON DELETE CASCADE,
  submission_id UUID NOT NULL REFERENCES public.submissions(id) ON DELETE CASCADE,
  used_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  full_name TEXT,
  email TEXT,
  UNIQUE (submission_id)
);

CREATE INDEX IF NOT EXISTS referral_code_usages_referral_idx
  ON public.referral_code_usages (referral_code_id, used_at DESC);

ALTER TABLE public.referral_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_code_usages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin users can read referral groups" ON public.referral_groups;
DROP POLICY IF EXISTS "Admin users can insert referral groups" ON public.referral_groups;
DROP POLICY IF EXISTS "Admin users can update referral groups" ON public.referral_groups;
DROP POLICY IF EXISTS "Admin users can read referral code usages" ON public.referral_code_usages;

CREATE POLICY "Admin users can read referral groups"
  ON public.referral_groups
  FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.admin_users admin WHERE admin.user_id = auth.uid()));

CREATE POLICY "Admin users can insert referral groups"
  ON public.referral_groups
  FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.admin_users admin WHERE admin.user_id = auth.uid()));

CREATE POLICY "Admin users can update referral groups"
  ON public.referral_groups
  FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.admin_users admin WHERE admin.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.admin_users admin WHERE admin.user_id = auth.uid()));

CREATE POLICY "Admin users can read referral code usages"
  ON public.referral_code_usages
  FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.admin_users admin WHERE admin.user_id = auth.uid()));

CREATE OR REPLACE FUNCTION public.validate_and_bind_referral_code(
  input_code TEXT,
  reference_time TIMESTAMPTZ DEFAULT now()
)
RETURNS TABLE (
  status TEXT,
  referral_code_id UUID,
  message TEXT,
  normalized_code TEXT,
  source_code TEXT,
  group_code TEXT,
  type_code TEXT,
  valid_from DATE,
  valid_until DATE
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  candidate_code TEXT := UPPER(BTRIM(COALESCE(input_code, '')));
  reference_date DATE := COALESCE(reference_time, now())::date;
  code_row RECORD;
BEGIN
  IF candidate_code = '' THEN
    RETURN QUERY
    SELECT
      'missing'::TEXT,
      NULL::UUID,
      'Referral code is empty.'::TEXT,
      NULL::TEXT,
      NULL::TEXT,
      NULL::TEXT,
      NULL::TEXT,
      NULL::DATE,
      NULL::DATE;
    RETURN;
  END IF;

  SELECT
    referral_codes.id,
    referral_codes.code,
    referral_codes.is_active,
    referral_codes.source_code,
    referral_codes.group_code,
    referral_codes.type_code,
    referral_codes.valid_from,
    referral_codes.valid_until,
    referral_sources.is_active AS source_is_active,
    referral_groups.is_active AS group_is_active,
    referral_types.is_active AS type_is_active
  INTO code_row
  FROM public.referral_codes AS referral_codes
  JOIN public.referral_sources AS referral_sources ON referral_sources.id = referral_codes.source_id
  JOIN public.referral_groups AS referral_groups ON referral_groups.id = referral_codes.group_id
  JOIN public.referral_types AS referral_types ON referral_types.id = referral_codes.type_id
  WHERE UPPER(referral_codes.code) = candidate_code
  ORDER BY referral_codes.created_at DESC
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN QUERY
    SELECT
      'not_found'::TEXT,
      NULL::UUID,
      'Referral code not found.'::TEXT,
      candidate_code,
      NULL::TEXT,
      NULL::TEXT,
      NULL::TEXT,
      NULL::DATE,
      NULL::DATE;
    RETURN;
  END IF;

  IF NOT code_row.is_active OR NOT code_row.source_is_active OR NOT code_row.group_is_active OR NOT code_row.type_is_active THEN
    RETURN QUERY
    SELECT
      'inactive'::TEXT,
      code_row.id,
      'Referral code is inactive.'::TEXT,
      code_row.code,
      code_row.source_code,
      code_row.group_code,
      code_row.type_code,
      code_row.valid_from,
      code_row.valid_until;
    RETURN;
  END IF;

  IF reference_date < code_row.valid_from THEN
    RETURN QUERY
    SELECT
      'out_of_window'::TEXT,
      code_row.id,
      'Referral code is not active yet.'::TEXT,
      code_row.code,
      code_row.source_code,
      code_row.group_code,
      code_row.type_code,
      code_row.valid_from,
      code_row.valid_until;
    RETURN;
  END IF;

  IF reference_date > code_row.valid_until THEN
    RETURN QUERY
    SELECT
      'expired'::TEXT,
      code_row.id,
      'Referral code is expired.'::TEXT,
      code_row.code,
      code_row.source_code,
      code_row.group_code,
      code_row.type_code,
      code_row.valid_from,
      code_row.valid_until;
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    'valid'::TEXT,
    code_row.id,
    'Referral code is valid.'::TEXT,
    code_row.code,
    code_row.source_code,
    code_row.group_code,
    code_row.type_code,
    code_row.valid_from,
    code_row.valid_until;
END;
$$;

GRANT EXECUTE ON FUNCTION public.validate_and_bind_referral_code(TEXT, TIMESTAMPTZ) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.submissions_apply_referral_code()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  validation_result RECORD;
  normalized_referral_code TEXT;
BEGIN
  IF NEW.id IS NULL THEN
    NEW.id := gen_random_uuid();
  END IF;

  IF NEW.referral_code IS NULL OR BTRIM(NEW.referral_code) = '' THEN
    NEW.referral_code := NULL;
    NEW.referral_code_id := NULL;
    RETURN NEW;
  END IF;

  normalized_referral_code := UPPER(BTRIM(NEW.referral_code));

  SELECT * INTO validation_result
  FROM public.validate_and_bind_referral_code(normalized_referral_code, COALESCE(NEW.created_at, now()))
  LIMIT 1;

  IF validation_result.status IS DISTINCT FROM 'valid' THEN
    RAISE EXCEPTION USING
      ERRCODE = 'P0001',
      MESSAGE = COALESCE(validation_result.message, 'Referral code is invalid.'),
      DETAIL = COALESCE(validation_result.status, 'invalid_referral_code'),
      HINT = 'Use a valid and active referral code within its date range.';
  END IF;

  NEW.referral_code := validation_result.normalized_code;
  NEW.referral_code_id := validation_result.referral_code_id;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.submissions_log_referral_usage()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.referral_code_id IS NULL THEN
    RETURN NEW;
  END IF;

  UPDATE public.referral_codes
  SET
    usage_count = COALESCE(usage_count, 0) + 1,
    is_used = true,
    used_at = GREATEST(COALESCE(used_at, TIMESTAMPTZ 'epoch'), COALESCE(NEW.created_at, now()))
  WHERE id = NEW.referral_code_id;

  INSERT INTO public.referral_code_usages (referral_code_id, submission_id, used_at, full_name, email)
  VALUES (
    NEW.referral_code_id,
    NEW.id,
    COALESCE(NEW.created_at, now()),
    NEW.fullname,
    NEW.email
  )
  ON CONFLICT (submission_id) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS submissions_apply_referral_code_trigger ON public.submissions;
CREATE TRIGGER submissions_apply_referral_code_trigger
  BEFORE INSERT ON public.submissions
  FOR EACH ROW
  EXECUTE FUNCTION public.submissions_apply_referral_code();

DROP TRIGGER IF EXISTS submissions_log_referral_usage_trigger ON public.submissions;
CREATE TRIGGER submissions_log_referral_usage_trigger
  AFTER INSERT ON public.submissions
  FOR EACH ROW
  EXECUTE FUNCTION public.submissions_log_referral_usage();

COMMIT;
