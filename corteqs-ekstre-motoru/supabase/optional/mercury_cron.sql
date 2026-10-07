-- Mercury senkronunu saatlik çalıştırma (Mercury sanal kart geldikten sonra uygulayın)
-- Gerekli uzantılar: pg_cron, pg_net  (Supabase > Database > Extensions)
-- <PROJECT_REF> = injprdrsklkxgnaiixzh ; <CRON_SECRET> = edge function sırlarındaki CRON_SECRET ile aynı değer
-- Sırrı düz metin yazmamak için Vault kullanın:
--   select vault.create_secret('<CRON_SECRET>', 'mercury_cron_secret');

select cron.schedule(
  'mercury-sync-hourly',
  '7 * * * *',
  $$
  select net.http_post(
    url     := 'https://injprdrsklkxgnaiixzh.supabase.co/functions/v1/mercury-sync',
    headers := jsonb_build_object(
      'content-type', 'application/json',
      'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'mercury_cron_secret')
    ),
    body    := '{}'::jsonb
  );
  $$
);

-- Durdurmak için:  select cron.unschedule('mercury-sync-hourly');
