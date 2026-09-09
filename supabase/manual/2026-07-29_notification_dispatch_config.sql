-- Bildirim dispatcher config: DB'den Edge Function'a pg_net ile anlik poke atabilmek icin
-- gereken URL + paylasilan sir. Sir generic notification_settings tablosuna degil,
-- Supabase Vault'a sifreli olarak yazilir.
--
-- Sir bu dosyaya YAZILMAZ. psql degiskeni olarak disaridan gecilir, psql :'secret' sozdizimi
-- degeri guvenli bir SQL literaline cevirir:
--
--   $env:NOTIFY_DISPATCH_SECRET = "<supabase secrets set ile ayni deger>"
--   psql "$env:SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -v secret="$env:NOTIFY_DISPATCH_SECRET" `
--     -f supabase\manual\2026-07-29_notification_dispatch_config.sql
--
-- Sir yalnizca security-definer poke_notification_dispatcher() tarafindan Vault'tan okunur.

\if :{?secret}
\else
  \echo 'HATA: -v secret="..." verilmedi. Ustteki kullanim ornegine bak.'
  \quit 1
\endif

-- Yer tutucu / bos / cok kisa deger korumasi. Yanlis bir sir sessizce yazilirsa pg_net
-- poke'lari 401 alir ve bildirimler sebebi belirsiz sekilde 'pending'de birikir.
-- Sir'i elle YAZMA; .env.local'den okut:  -v secret="$env:NOTIFY_DISPATCH_SECRET"
select
  case
    when length(trim(:'secret')) < 12 then 'true'
    when :'secret' ~* '(placeholder|change.?me|secret_here|buraya_?yaz|xxxx)' then 'true'
    else 'false'
  end as durdur,
  case
    when length(trim(:'secret')) < 12
      then 'HATA: sir yalnizca ' || length(trim(:'secret')) || ' karakter - kaba kuvvete acik.'
    else 'HATA: sir yer tutucu metin gibi gorunuyor. .env.local icindeki gercek degeri kullan.'
  end as hata_mesaji
\gset

\if :durdur
  \echo :hata_mesaji
  \echo 'Dogru kullanim: -v secret="$env:NOTIFY_DISPATCH_SECRET" (once .env.local yuklenmeli)'
  \quit 1
\endif

begin;

insert into public.notification_settings (key, value)
values ('dispatch.url', to_jsonb('https://injprdrsklkxgnaiixzh.supabase.co/functions/v1/send-notification-emails'::text))
on conflict (key) do update
  set value = excluded.value,
      updated_at = now();

select id as dispatch_secret_id
from vault.decrypted_secrets
where name = 'notification_dispatch_secret'
order by created_at desc
limit 1
\gset

\if :{?dispatch_secret_id}
  select vault.update_secret(
    :'dispatch_secret_id'::uuid,
    :'secret',
    'notification_dispatch_secret',
    'DB to send-notification-emails shared dispatch credential'
  );
\else
  select vault.create_secret(
    :'secret',
    'notification_dispatch_secret',
    'DB to send-notification-emails shared dispatch credential'
  );
\endif

delete from public.notification_settings where key = 'dispatch.secret';

commit;

\echo '--- config yazildi (sir gosterilmez) ---'
select key, value #>> '{}' as deger
from public.notification_settings
where key = 'dispatch.url'
order by key;

select name, '***' || length(decrypted_secret)::text || ' karakter***' as deger
from vault.decrypted_secrets
where name = 'notification_dispatch_secret';
