-- A15 · "Etkinliğiniz yayında" e-postası (5 parçalı hat)
--
-- Kaynak: docs/plans/2026-10-05-plan-8-urun-istegi.md A15
-- CLAUDE.md kariyer md.8 kuralı: biri eksikse hata yok, mail gitmez.
--
-- Beş parça:
--   1. notification_email_outbox CHECK listesine event_published EKLENİR
--   2. notification_settings anahtarı: email.event_published.enabled
--   3. Enqueue: create_event_v1 (yayın anında) + pending→published trigger
--   4. Alıcı e-postası auth.users'tan SQL'de (edge auth admin API canlıda 401 verdi)
--   5. dedupe_key='event_published:'||id
--
-- Edge tarafı: SETTING_KEY_BY_EVENT + buildEmail kolu + directEvents
-- (_shared/emails/event-published.ts). Maile dosya yolu/imzalı bağlantı KONMAZ;
-- link https://corteqs.net/events/<id>?share=1.

begin;

-- ── 1) outbox event_type CHECK genişlet ──────────────────────────────────────
do $$
declare
  v_conname text;
begin
  select con.conname into v_conname
  from pg_constraint con
  where con.conrelid = 'public.notification_email_outbox'::regclass
    and con.contype = 'c'
    and pg_get_constraintdef(con.oid) like '%event_type%';
  if v_conname is null then
    raise exception 'notification_email_outbox event_type CHECK bulunamadi';
  end if;
  execute format('alter table public.notification_email_outbox drop constraint %I', v_conname);
end $$;

alter table public.notification_email_outbox
  add constraint notification_email_outbox_event_type_check
  check (event_type = any (array[
    'new_member','admin_update','member_welcome','revision_request',
    'revision_request_completed','relocation_tool_report','relocation_tool_abandonment',
    'radar_scan_digest','career_application','group_submission_received','group_published',
    'group_rejected','group_ownership_verified','group_post_pending','group_link_dead',
    'group_score_badge','group_strike_warning',
    'recommendation_match',
    'event_published'  -- A15
  ]::text[]));

-- ── 2) global ayar anahtarı ──────────────────────────────────────────────────
insert into public.notification_settings (key, value)
values ('email.event_published.enabled', 'true'::jsonb)
on conflict (key) do nothing;

-- ── 3) enqueue fonksiyonu ────────────────────────────────────────────────────
-- Tek bir etkinlik için outbox satırı yazar. Idempotent (dedupe_key ile).
-- Alıcı e-postası auth.users'tan SQL'de çekilir (edge auth admin API canlıda 401 verdi).
create or replace function public.enqueue_event_published_notification(p_event_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_email text;
  v_dedupe_key text;
begin
  -- Etkinlik sahibini bul
  select user_id into v_user_id
  from public.events
  where id = p_event_id;

  if v_user_id is null then
    return; -- Etkinlik yok, sessizce çık
  end if;

  -- Alıcı e-postasını auth.users'tan çek
  select email into v_email
  from auth.users
  where id = v_user_id;

  if v_email is null then
    return; -- E-posta yok, sessizce çık
  end if;

  -- Dedupe anahtarı: aynı etkinlik için tek satır
  v_dedupe_key := 'event_published:' || p_event_id::text;

  -- Outbox'a yaz (çakışma varsa sessizce atla)
  insert into public.notification_email_outbox (
    event_type, recipient_email, payload, dedupe_key
  ) values (
    'event_published',
    v_email,
    jsonb_build_object('event_id', p_event_id),
    v_dedupe_key
  )
  on conflict (dedupe_key) do nothing;

  -- Dispatcher'ı tetikle (varsa)
  if exists (select 1 from pg_proc where proname = 'poke_notification_dispatcher') then
    perform public.poke_notification_dispatcher();
  end if;
end;
$$;

comment on function public.enqueue_event_published_notification(uuid) is
  'A15: Etkinlik yayınlandığında sahibine "Etkinliğiniz yayında" e-postası kuyruğa alır. '
  'Idempotent (dedupe_key ile). Alıcı e-postası auth.users''tan SQL''de çekilir.';

revoke all on function public.enqueue_event_published_notification(uuid) from public, anon;
grant execute on function public.enqueue_event_published_notification(uuid) to authenticated;

-- ── 4) create_event_v1'den enqueue çağrısı ───────────────────────────────────
-- A13 migration'ı create_event_v1'i zaten güncelledi. Şimdi enqueue çağrısı ekliyoruz.
-- create_event_v1'in sonuna "perform public.enqueue_event_published_notification(v_id);" ekleyeceğiz.
-- Ancak A13 migration'ı zaten create_event_v1'i tanımladı, bu migration'da yeniden tanımlamak yerine
-- trigger kullanacağız (daha temiz).

-- ── 5) Trigger: events status='published' olunca enqueue ─────────────────────
-- Bu trigger hem create_event_v1 (yeni etkinlik) hem de admin onayı (pending→published) kapsar.
create or replace function public.trg_events_after_publish()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Yalnız status='published' olunca tetiklenir
  if new.status = 'published' and (old is null or old.status is distinct from 'published') then
    perform public.enqueue_event_published_notification(new.id);
  end if;
  return new;
end;
$$;

drop trigger if exists trg_events_after_publish on public.events;
create trigger trg_events_after_publish
after insert or update of status on public.events
for each row
execute function public.trg_events_after_publish();

comment on function public.trg_events_after_publish() is
  'A15: events tablosunda status=''published'' olunca enqueue tetikler. '
  'Hem yeni etkinlik (insert) hem admin onayı (update pending→published) kapsar.';

-- ── 6) A13'teki backfill_auto ile yayınlanan etkinlikler için mail YAZMA ─────
-- Plan: "Toplu işlemde corteqs.skip_* bayrağı: A13'teki eski pending yayınlaması mail üretmesin."
-- A13 migration'ı approval_source='backfill_auto' ile yayınladı. Bu migration'dan önceki etkinlikler
-- için mail gitmemesi gerekiyor. Trigger'ı eklerken dikkat: A13 migration'ı zaten çalıştı, bu migration
-- çalıştığında eski pending→published dönüşümü yok. Yine de güvenlik için: approval_source='backfill_auto'
-- olan etkinlikler için enqueue YAPMA.
-- Ancak trigger AFTER INSERT OR UPDATE, A13 migration'ı zaten UPDATE yaptı, bu migration'dan ÖNCE.
-- Yani bu migration çalıştığında eski etkinlikler zaten published, trigger tetiklenmez.
-- Yine de güvenlik için trigger fonksiyonunda kontrol ekleyelim.

create or replace function public.trg_events_after_publish()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Yalnız status='published' olunca tetiklenir
  if new.status = 'published' and (old is null or old.status is distinct from 'published') then
    -- A13 backfill_auto ile yayınlanan etkinlikler için mail YAZMA
    if new.approval_source is distinct from 'backfill_auto' then
      perform public.enqueue_event_published_notification(new.id);
    end if;
  end if;
  return new;
end;
$$;

commit;
