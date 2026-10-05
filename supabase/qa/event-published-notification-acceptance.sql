-- A15 · event-published-notification kabul testi
--
-- KABUL:
--   K1: notification_email_outbox CHECK listesine event_published eklendi
--   K2: notification_settings anahtarı var (email.event_published.enabled)
--   K3: enqueue_event_published_notification fonksiyonu var, security definer
--   K4: trg_events_after_publish trigger var
--   K5: Trigger fonksiyonu approval_source='backfill_auto' için enqueue YAPMAZ

begin;

-- K1: Outbox CHECK
do $$
declare
  v_checkdef text;
begin
  select pg_get_constraintdef(oid) into v_checkdef
  from pg_constraint
  where conrelid = 'public.notification_email_outbox'::regclass
    and contype = 'c'
    and pg_get_constraintdef(oid) like '%event_type%';
  assert v_checkdef is not null, 'K1 BAŞARISIZ: event_type CHECK bulunamadı';
  assert v_checkdef like '%event_published%',
    'K1 BAŞARISIZ: CHECK listesinde event_published yok';
  raise notice 'K1 OK: event_published outbox CHECK listesinde';
end $$;

-- K2: Ayar anahtarı
do $$
begin
  assert exists (
    select 1 from public.notification_settings
    where key = 'email.event_published.enabled'
  ), 'K2 BAŞARISIZ: email.event_published.enabled ayarı yok';
  raise notice 'K2 OK: notification_settings anahtarı var';
end $$;

-- K3: enqueue fonksiyonu
do $$
declare
  v_secdef boolean;
begin
  select prosecdef into v_secdef
  from pg_proc
  where proname = 'enqueue_event_published_notification';
  assert found, 'K3 BAŞARISIZ: enqueue_event_published_notification yok';
  assert v_secdef = true, 'K3 BAŞARISIZ: security definer değil';
  raise notice 'K3 OK: enqueue fonksiyonu security definer';
end $$;

-- K4: Trigger var
do $$
begin
  assert exists (
    select 1 from pg_trigger
    where tgname = 'trg_events_after_publish'
  ), 'K4 BAŞARISIZ: trg_events_after_publish trigger yok';
  raise notice 'K4 OK: Trigger var';
end $$;

-- K5: Trigger fonksiyonu backfill_auto kontrolü
do $$
declare
  v_src text;
begin
  select pg_get_functiondef(oid) into v_src
  from pg_proc
  where proname = 'trg_events_after_publish';
  assert v_src like '%backfill_auto%',
    'K5 BAŞARISIZ: trigger fonksiyonunda backfill_auto kontrolü yok';
  raise notice 'K5 OK: Trigger backfill_auto kontrolü yapıyor';
end $$;

rollback;
