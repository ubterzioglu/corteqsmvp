
-- 1) Profile field additions
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS tag_line text,
  ADD COLUMN IF NOT EXISTS bio text,
  ADD COLUMN IF NOT EXISTS birth_date date,
  ADD COLUMN IF NOT EXISTS founded_year integer,
  ADD COLUMN IF NOT EXISTS theme text,
  ADD COLUMN IF NOT EXISTS business_subtype text,
  ADD COLUMN IF NOT EXISTS websites jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS whatsapp_cta_enabled boolean NOT NULL DEFAULT false;

-- Length validation trigger for tag_line (25 chars)
CREATE OR REPLACE FUNCTION public.validate_profile_fields()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.tag_line IS NOT NULL AND char_length(NEW.tag_line) > 25 THEN
    RAISE EXCEPTION 'tag_line_too_long' USING HINT = 'Tag line en fazla 25 karakter olmalı.';
  END IF;
  IF NEW.bio IS NOT NULL AND char_length(NEW.bio) > 3000 THEN
    RAISE EXCEPTION 'bio_too_long';
  END IF;
  IF NEW.business_subtype IS NOT NULL AND NEW.business_subtype NOT IN ('startup','online','classic') THEN
    RAISE EXCEPTION 'invalid_business_subtype';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_validate_fields ON public.profiles;
CREATE TRIGGER profiles_validate_fields
BEFORE INSERT OR UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.validate_profile_fields();

-- 2) Ambassador applications queue
CREATE TABLE IF NOT EXISTS public.ambassador_applications (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  full_name text NOT NULL,
  email text NOT NULL,
  phone text,
  country text,
  city text,
  motivation text,
  status text NOT NULL DEFAULT 'pending',
  decided_by uuid,
  decided_at timestamptz,
  admin_note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.ambassador_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create own ambassador application"
  ON public.ambassador_applications FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own ambassador application"
  ON public.ambassador_applications FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Admins view all ambassador applications"
  ON public.ambassador_applications FOR SELECT
  TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins update ambassador applications"
  ON public.ambassador_applications FOR UPDATE
  TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER ambassador_applications_updated_at
BEFORE UPDATE ON public.ambassador_applications
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger: when admin approves, generate referral code on profile
CREATE OR REPLACE FUNCTION public.process_ambassador_approval()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status <> 'approved') THEN
    UPDATE public.profiles
       SET ambassador_referral_code = COALESCE(NULLIF(ambassador_referral_code,''), public.generate_ambassador_referral_code())
     WHERE id = NEW.user_id;
    -- ensure ambassador role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.user_id, 'ambassador'::app_role)
    ON CONFLICT DO NOTHING;
    -- notify user
    INSERT INTO public.notifications (user_id, type, title, message, related_id)
    VALUES (NEW.user_id, 'ambassador_approved', '🏅 Şehir Elçisi başvurun onaylandı',
      'Tebrikler! Referans kodun profilinde aktif edildi.', NEW.id);
  ELSIF NEW.status = 'rejected' AND (OLD.status IS NULL OR OLD.status <> 'rejected') THEN
    INSERT INTO public.notifications (user_id, type, title, message, related_id)
    VALUES (NEW.user_id, 'ambassador_rejected', 'Şehir Elçisi başvuru durumu',
      COALESCE('Başvurun şu sebeple onaylanmadı: ' || NEW.admin_note, 'Başvurun bu seferlik onaylanmadı.'), NEW.id);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS ambassador_applications_process ON public.ambassador_applications;
CREATE TRIGGER ambassador_applications_process
AFTER UPDATE ON public.ambassador_applications
FOR EACH ROW EXECUTE FUNCTION public.process_ambassador_approval();

-- Notify admins on new ambassador application
CREATE OR REPLACE FUNCTION public.notify_admins_ambassador_application()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.notifications (user_id, type, title, message, related_id)
  SELECT ur.user_id, 'ambassador_application',
         '🏛️ Yeni Şehir Elçisi başvurusu',
         COALESCE(NEW.full_name,'Bir kullanıcı') || ' (' || COALESCE(NEW.city,'?') || ', ' || COALESCE(NEW.country,'?') || ') başvurdu.',
         NEW.id
  FROM public.user_roles ur
  WHERE ur.role = 'admin'::app_role;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS ambassador_applications_notify ON public.ambassador_applications;
CREATE TRIGGER ambassador_applications_notify
AFTER INSERT ON public.ambassador_applications
FOR EACH ROW EXECUTE FUNCTION public.notify_admins_ambassador_application();

-- 3) Presentations storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('presentations','presentations', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Presentations are publicly readable"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'presentations');

CREATE POLICY "Users can upload own presentations"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'presentations' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update own presentations"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'presentations' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own presentations"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'presentations' AND auth.uid()::text = (storage.foldername(name))[1]);
