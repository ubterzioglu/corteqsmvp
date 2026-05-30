BEGIN;

CREATE OR REPLACE FUNCTION public.validate_and_bind_referral_code(
  input_code TEXT,
  reference_time TIMESTAMPTZ DEFAULT now()
)
RETURNS TABLE (
  status TEXT,
  referral_code_id UUID,
  message TEXT,
  normalized_code TEXT
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
      NULL::TEXT;
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
      candidate_code;
    RETURN;
  END IF;

  IF NOT code_row.is_active OR NOT code_row.source_is_active OR NOT code_row.group_is_active OR NOT code_row.type_is_active THEN
    RETURN QUERY
    SELECT
      'inactive'::TEXT,
      NULL::UUID,
      'Referral code is inactive.'::TEXT,
      NULL::TEXT;
    RETURN;
  END IF;

  IF reference_date < code_row.valid_from THEN
    RETURN QUERY
    SELECT
      'out_of_window'::TEXT,
      NULL::UUID,
      'Referral code is not active yet.'::TEXT,
      NULL::TEXT;
    RETURN;
  END IF;

  IF reference_date > code_row.valid_until THEN
    RETURN QUERY
    SELECT
      'expired'::TEXT,
      NULL::UUID,
      'Referral code is expired.'::TEXT,
      NULL::TEXT;
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    'valid'::TEXT,
    code_row.id,
    'Referral code is valid.'::TEXT,
    code_row.code;
END;
$$;

COMMIT;
