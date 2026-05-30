-- cafe seed data (relocation + expo per country)
-- Source: referans 20260511135018 (seed only)

DO $$
DECLARE
  v_admin uuid;
  v_country text;
  v_countries text[] := ARRAY['Türkiye','Almanya','Hollanda','Birleşik Krallık','Amerika Birleşik Devletleri','Fransa','Belçika','Avusturya','İsviçre','Kanada'];
BEGIN
  SELECT user_id INTO v_admin FROM public.user_roles WHERE role = 'admin' LIMIT 1;
  IF v_admin IS NULL THEN RETURN; END IF;
  FOREACH v_country IN ARRAY v_countries LOOP
    INSERT INTO public.cafes (name, theme, country, city, linkedin_url, created_by, opens_at, closes_at, duration_hours, kind, open_entry, capacity)
    VALUES ('Relocation Cafe – ' || v_country, 'Genel', v_country, NULL, 'https://linkedin.com', v_admin, now(), '2099-01-01'::timestamptz, 0, 'relocation', true, NULL)
    ON CONFLICT DO NOTHING;
    INSERT INTO public.cafes (name, theme, country, city, linkedin_url, created_by, opens_at, closes_at, duration_hours, kind, open_entry, capacity)
    VALUES ('Expo Cafe – ' || v_country, 'İşletmeler', v_country, NULL, 'https://linkedin.com', v_admin, now(), '2099-01-01'::timestamptz, 0, 'expo', true, NULL)
    ON CONFLICT DO NOTHING;
  END LOOP;
END $$;
