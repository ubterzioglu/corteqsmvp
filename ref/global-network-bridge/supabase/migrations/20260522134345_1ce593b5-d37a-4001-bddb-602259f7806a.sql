
CREATE EXTENSION IF NOT EXISTS pg_cron;

CREATE OR REPLACE FUNCTION public.notify_birthday_followers()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_today date := (now() at time zone 'UTC')::date;
BEGIN
  INSERT INTO public.notifications (user_id, type, title, message, related_id)
  SELECT
    uf.follower_id,
    'follow_birthday',
    '🎂 Bugün ' || COALESCE(p.full_name, 'takip ettiğin kişinin') || ' doğum günü!',
    'Takip ettiğin ' || COALESCE(p.full_name, 'kişi') || ' bugün doğum gününü kutluyor. Bir mesaj göndererek günü güzelleştirebilirsin.',
    p.id
  FROM public.profiles p
  JOIN public.user_follows uf ON uf.following_id = p.id
  WHERE p.birth_date IS NOT NULL
    AND p.birthday_reminder_enabled = true
    AND EXTRACT(MONTH FROM p.birth_date) = EXTRACT(MONTH FROM v_today)
    AND EXTRACT(DAY   FROM p.birth_date) = EXTRACT(DAY   FROM v_today)
    AND NOT EXISTS (
      SELECT 1 FROM public.notifications n
      WHERE n.user_id = uf.follower_id
        AND n.type = 'follow_birthday'
        AND n.related_id = p.id
        AND n.created_at::date = v_today
    );
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'notify_birthday_followers_daily') THEN
    PERFORM cron.schedule(
      'notify_birthday_followers_daily',
      '0 8 * * *',
      $cron$ SELECT public.notify_birthday_followers(); $cron$
    );
  END IF;
END $$;
