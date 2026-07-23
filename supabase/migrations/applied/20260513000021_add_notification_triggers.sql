-- notification triggers: appointments, job_applications, founding_1000, contact_messages, user_connections
-- Source: referans 20260511171028, 20260512084007, 20260512095045, 20260512095751, 20260512115822

CREATE OR REPLACE FUNCTION public.notify_provider_on_appointment()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.notifications (user_id, type, title, message, related_id)
  VALUES (NEW.provider_id, 'appointment_request', 'Yeni Randevu Talebi',
    COALESCE(NEW.client_name, 'Bir kullanıcı') || ' ' || to_char(NEW.scheduled_at AT TIME ZONE 'UTC', 'DD Mon YYYY HH24:MI') || ' UTC için ' || NEW.duration_minutes || ' dk randevu talep etti.',
    NEW.id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_appointment_created ON public.appointments;
CREATE TRIGGER on_appointment_created
  AFTER INSERT ON public.appointments FOR EACH ROW EXECUTE FUNCTION public.notify_provider_on_appointment();

CREATE OR REPLACE FUNCTION public.notify_owner_on_job_application()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_owner uuid; v_title text;
BEGIN
  SELECT user_id, title INTO v_owner, v_title FROM public.job_listings WHERE id = NEW.listing_id;
  IF v_owner IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, type, title, message, related_id)
    VALUES (v_owner, 'job_application', 'Yeni iş başvurusu: ' || COALESCE(v_title, 'İlan'),
      COALESCE(NEW.applicant_name, 'Bir aday') || ' "' || COALESCE(v_title, 'ilanına') || '" başvuru gönderdi.', NEW.id);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_on_job_application ON public.job_applications;
CREATE TRIGGER trg_notify_on_job_application
  AFTER INSERT ON public.job_applications FOR EACH ROW EXECUTE FUNCTION public.notify_owner_on_job_application();

CREATE OR REPLACE FUNCTION public.notify_admins_founding_1000()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.notifications (user_id, type, title, message, related_id)
  SELECT ur.user_id, 'founding_1000_signup', 'Yeni Founding 1000 kaydi',
    COALESCE(NEW.full_name, NEW.email, 'Bir kullanici') || ' (' || NEW.account_type || ') Founding 1000 programina kaydoldu.', NEW.id
  FROM public.user_roles ur WHERE ur.role = 'admin'::app_role;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_admins_founding_1000 ON public.founding_1000_signups;
CREATE TRIGGER trg_notify_admins_founding_1000
  AFTER INSERT ON public.founding_1000_signups FOR EACH ROW EXECUTE FUNCTION public.notify_admins_founding_1000();

CREATE OR REPLACE FUNCTION public.notify_admins_contact_message()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.notifications (user_id, type, title, message, related_id)
  SELECT ur.user_id, 'contact_message', 'Yeni iletisim mesaji',
    NEW.full_name || ' (' || NEW.email || ') - ' || COALESCE(NEW.city, '') ||
      CASE WHEN NEW.city IS NOT NULL AND NEW.country IS NOT NULL THEN ', ' ELSE '' END ||
      COALESCE(NEW.country, ''), NEW.id
  FROM public.user_roles ur WHERE ur.role = 'admin'::app_role;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_admins_contact_message ON public.contact_messages;
CREATE TRIGGER trg_notify_admins_contact_message
  AFTER INSERT ON public.contact_messages FOR EACH ROW EXECUTE FUNCTION public.notify_admins_contact_message();

CREATE OR REPLACE FUNCTION public.notify_on_connection_request()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_name text;
BEGIN
  IF TG_OP = 'INSERT' THEN
    SELECT COALESCE(full_name, 'Bir kullanıcı') INTO v_name FROM public.profiles WHERE id = NEW.requester_id;
    INSERT INTO public.notifications (user_id, type, title, message, related_id)
    VALUES (NEW.recipient_id, 'connection_request', 'Yeni Bağlantı İsteği',
      v_name || ' seninle bağlantı kurmak istiyor.', NEW.id);
  ELSIF TG_OP = 'UPDATE' AND NEW.status = 'accepted' AND OLD.status <> 'accepted' THEN
    SELECT COALESCE(full_name, 'Karşı taraf') INTO v_name FROM public.profiles WHERE id = NEW.recipient_id;
    INSERT INTO public.notifications (user_id, type, title, message, related_id)
    VALUES (NEW.requester_id, 'connection_accepted', 'Bağlantı Kabul Edildi',
      v_name || ' bağlantı isteğini kabul etti.', NEW.id);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_on_connection_request ON public.user_connections;
CREATE TRIGGER trg_notify_on_connection_request
  AFTER INSERT OR UPDATE ON public.user_connections FOR EACH ROW EXECUTE FUNCTION public.notify_on_connection_request();
