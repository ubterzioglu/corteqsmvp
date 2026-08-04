-- notify_followers() + follower notification triggers on events/job_listings/cafes
-- Source: referans 20260512080857

CREATE OR REPLACE FUNCTION public.notify_followers(
  _author_id uuid, _type text, _title text, _message text, _related_id uuid
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.notifications (user_id, type, title, message, related_id)
  SELECT uf.follower_id, _type, _title, _message, _related_id
  FROM public.user_follows uf WHERE uf.following_id = _author_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.notify_followers_on_event()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_author_name text;
BEGIN
  IF NEW.status <> 'published' THEN RETURN NEW; END IF;
  SELECT COALESCE(full_name, 'Takip ettiğin kişi') INTO v_author_name FROM public.profiles WHERE id = NEW.user_id;
  PERFORM public.notify_followers(NEW.user_id, 'follow_event',
    'Yeni etkinlik: ' || NEW.title,
    v_author_name || ' yeni bir etkinlik yayınladı (' || COALESCE(NEW.city, NEW.country, 'Online') || ', ' || NEW.event_date::text || ').',
    NEW.id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_followers_on_event ON public.events;
CREATE TRIGGER trg_notify_followers_on_event
  AFTER INSERT ON public.events FOR EACH ROW EXECUTE FUNCTION public.notify_followers_on_event();

CREATE OR REPLACE FUNCTION public.notify_followers_on_job()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_author_name text;
BEGIN
  IF NEW.status <> 'published' THEN RETURN NEW; END IF;
  SELECT COALESCE(NEW.business_name, full_name, 'Takip ettiğin işletme') INTO v_author_name FROM public.profiles WHERE id = NEW.user_id;
  PERFORM public.notify_followers(NEW.user_id, 'follow_job',
    'Yeni iş ilanı: ' || NEW.title,
    v_author_name || ' yeni bir ' || COALESCE(NEW.employment_type,'iş') || ' ilanı yayınladı' || CASE WHEN NEW.city IS NOT NULL THEN ' (' || NEW.city || ')' ELSE '' END || '.',
    NEW.id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_followers_on_job ON public.job_listings;
CREATE TRIGGER trg_notify_followers_on_job
  AFTER INSERT ON public.job_listings FOR EACH ROW EXECUTE FUNCTION public.notify_followers_on_job();

CREATE OR REPLACE FUNCTION public.notify_followers_on_cafe()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_author_name text;
BEGIN
  SELECT COALESCE(full_name, 'Takip ettiğin kişi') INTO v_author_name FROM public.profiles WHERE id = NEW.created_by;
  PERFORM public.notify_followers(NEW.created_by, 'follow_cafe',
    'Yeni cafe açıldı: ' || NEW.name,
    v_author_name || ' "' || NEW.name || '" cafe''sini açtı (' || COALESCE(NEW.city || ' · ', '') || COALESCE(NEW.theme, NEW.kind) || ').',
    NEW.id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_followers_on_cafe ON public.cafes;
CREATE TRIGGER trg_notify_followers_on_cafe
  AFTER INSERT ON public.cafes FOR EACH ROW EXECUTE FUNCTION public.notify_followers_on_cafe();
