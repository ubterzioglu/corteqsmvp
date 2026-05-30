DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'referral_codes'
  ) AND EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'referral_codes' AND column_name = 'source_key'
  ) THEN
    IF EXISTS (
      SELECT 1
      FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'referral_codes_legacy'
    ) THEN
      EXECUTE 'DROP TABLE public.referral_codes_legacy';
    END IF;
    EXECUTE 'ALTER TABLE public.referral_codes RENAME TO referral_codes_legacy';
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.referral_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT referral_sources_code_format CHECK (code ~ '^[A-Z]{2}$')
);

CREATE TABLE IF NOT EXISTS public.referral_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT referral_types_code_format CHECK (code ~ '^[A-Z]{2}$')
);

INSERT INTO public.referral_sources (name, code)
VALUES
  ('WhatsApp', 'WA'),
  ('Instagram', 'IG'),
  ('LinkedIn', 'LI')
ON CONFLICT (code) DO NOTHING;

INSERT INTO public.referral_types (name, code)
VALUES
  ('Normal', 'NM'),
  ('Partner', 'PT'),
  ('Campaign', 'CM'),
  ('Test', 'TS')
ON CONFLICT (code) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.referral_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  source_id UUID NOT NULL REFERENCES public.referral_sources(id),
  type_id UUID NOT NULL REFERENCES public.referral_types(id),
  source_code TEXT NOT NULL,
  type_code TEXT NOT NULL,
  month_num INTEGER NOT NULL CHECK (month_num BETWEEN 1 AND 12),
  year_short TEXT NOT NULL CHECK (year_short ~ '^[0-9]{2}$'),
  random_part TEXT NOT NULL,
  note TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_used BOOLEAN NOT NULL DEFAULT false,
  used_at TIMESTAMPTZ,
  created_by UUID REFERENCES public.admin_users(user_id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS referral_codes_code_idx
  ON public.referral_codes (code);

CREATE INDEX IF NOT EXISTS referral_codes_lookup_idx
  ON public.referral_codes (source_id, type_id, created_at DESC);

CREATE INDEX IF NOT EXISTS referral_codes_usage_idx
  ON public.referral_codes (is_active, is_used);

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'referral_codes_legacy'
  ) THEN
    INSERT INTO public.referral_codes (
      code,
      source_id,
      type_id,
      source_code,
      type_code,
      month_num,
      year_short,
      random_part,
      note,
      is_active,
      is_used,
      used_at,
      created_by,
      created_at
    )
    SELECT
      legacy.code,
      source_match.id,
      type_match.id,
      source_match.code,
      type_match.code,
      COALESCE(EXTRACT(MONTH FROM legacy.referral_date)::INT, 1),
      COALESCE(TO_CHAR(legacy.referral_date, 'YY'), RIGHT(REGEXP_REPLACE(legacy.code, '^.*?([0-9]{2})-[A-Z2-9]+$', '\1'), 2)),
      COALESCE(REGEXP_REPLACE(legacy.code, '^.*-([A-Z2-9]+)$', '\1'), legacy.random_part),
      legacy.note,
      COALESCE(legacy.is_active, true),
      COALESCE(legacy.is_used, false),
      legacy.used_at,
      legacy.created_by,
      COALESCE(legacy.created_at, now())
    FROM public.referral_codes_legacy legacy
    JOIN LATERAL (
      SELECT rs.id, rs.code
      FROM public.referral_sources rs
      WHERE rs.code = CASE
        WHEN legacy.source_key = 'whatsapp' THEN 'WA'
        WHEN legacy.source_key = 'instagram' THEN 'IG'
        WHEN legacy.source_key = 'linkedin' THEN 'LI'
        ELSE 'LI'
      END
      LIMIT 1
    ) AS source_match ON true
    JOIN LATERAL (
      SELECT rt.id, rt.code
      FROM public.referral_types rt
      WHERE rt.code = CASE
        WHEN legacy.type_key = 'normal' THEN 'NM'
        WHEN legacy.type_key = 'partner' THEN 'PT'
        WHEN legacy.type_key = 'campaign' THEN 'CM'
        ELSE 'TS'
      END
      LIMIT 1
    ) AS type_match ON true
    ON CONFLICT (code) DO NOTHING;
  END IF;
END $$;

ALTER TABLE public.referral_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_codes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin users can read referral sources" ON public.referral_sources;
DROP POLICY IF EXISTS "Admin users can insert referral sources" ON public.referral_sources;
DROP POLICY IF EXISTS "Admin users can update referral sources" ON public.referral_sources;
DROP POLICY IF EXISTS "Admin users can read referral types" ON public.referral_types;
DROP POLICY IF EXISTS "Admin users can insert referral types" ON public.referral_types;
DROP POLICY IF EXISTS "Admin users can update referral types" ON public.referral_types;
DROP POLICY IF EXISTS "Admin users can read referral codes" ON public.referral_codes;
DROP POLICY IF EXISTS "Admin users can insert referral codes" ON public.referral_codes;
DROP POLICY IF EXISTS "Admin users can update referral codes" ON public.referral_codes;

CREATE POLICY "Admin users can read referral sources"
  ON public.referral_sources
  FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.admin_users admin WHERE admin.user_id = auth.uid()));

CREATE POLICY "Admin users can insert referral sources"
  ON public.referral_sources
  FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.admin_users admin WHERE admin.user_id = auth.uid()));

CREATE POLICY "Admin users can update referral sources"
  ON public.referral_sources
  FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.admin_users admin WHERE admin.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.admin_users admin WHERE admin.user_id = auth.uid()));

CREATE POLICY "Admin users can read referral types"
  ON public.referral_types
  FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.admin_users admin WHERE admin.user_id = auth.uid()));

CREATE POLICY "Admin users can insert referral types"
  ON public.referral_types
  FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.admin_users admin WHERE admin.user_id = auth.uid()));

CREATE POLICY "Admin users can update referral types"
  ON public.referral_types
  FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.admin_users admin WHERE admin.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.admin_users admin WHERE admin.user_id = auth.uid()));

CREATE POLICY "Admin users can read referral codes"
  ON public.referral_codes
  FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.admin_users admin WHERE admin.user_id = auth.uid()));

CREATE POLICY "Admin users can insert referral codes"
  ON public.referral_codes
  FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.admin_users admin WHERE admin.user_id = auth.uid()));

CREATE POLICY "Admin users can update referral codes"
  ON public.referral_codes
  FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.admin_users admin WHERE admin.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.admin_users admin WHERE admin.user_id = auth.uid()));
