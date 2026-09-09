-- Move the DB -> Edge Function dispatch credential out of the generic settings table.
-- The Edge Function already reads the matching value from NOTIFY_DISPATCH_SECRET.
-- PostgreSQL keeps its copy encrypted in Supabase Vault so pg_net can add the header.

do $$
declare
  v_legacy_secret text;
  v_secret_id uuid;
begin
  select value #>> '{}'
    into v_legacy_secret
  from public.notification_settings
  where key = 'dispatch.secret';

  select id
    into v_secret_id
  from vault.decrypted_secrets
  where name = 'notification_dispatch_secret'
  order by created_at desc
  limit 1;

  if coalesce(v_legacy_secret, '') <> '' then
    if v_secret_id is null then
      perform vault.create_secret(
        v_legacy_secret,
        'notification_dispatch_secret',
        'DB to send-notification-emails shared dispatch credential'
      );
    else
      perform vault.update_secret(
        v_secret_id,
        v_legacy_secret,
        'notification_dispatch_secret',
        'DB to send-notification-emails shared dispatch credential'
      );
    end if;
  elsif v_secret_id is null then
    raise exception 'notification_dispatch_secret_missing';
  end if;
end
$$;

create or replace function public.poke_notification_dispatcher()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_url text;
  v_secret text;
begin
  if not exists (select 1 from pg_extension where extname = 'pg_net') then
    return;
  end if;

  select value #>> '{}'
    into v_url
  from public.notification_settings
  where key = 'dispatch.url';

  select decrypted_secret
    into v_secret
  from vault.decrypted_secrets
  where name = 'notification_dispatch_secret'
  order by created_at desc
  limit 1;

  if coalesce(v_url, '') = '' or coalesce(v_secret, '') = '' then
    return;
  end if;

  perform net.http_post(
    url := v_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-dispatch-secret', v_secret
    ),
    body := jsonb_build_object('source', 'db')
  );
exception when others then
  -- Notification delivery must never break the transaction that enqueued it.
  raise notice 'poke_notification_dispatcher atlandi: %', sqlerrm;
end;
$$;

delete from public.notification_settings
where key = 'dispatch.secret';

comment on table public.notification_settings is
  'Bildirim e-postası ayarları. email.*.enabled anahtarları admin panelinden yönetilir; dispatch.url deploy sonrası elle doldurulur. Paylaşılan dispatch sırrı Supabase Vault içinde notification_dispatch_secret adıyla saklanır.';
