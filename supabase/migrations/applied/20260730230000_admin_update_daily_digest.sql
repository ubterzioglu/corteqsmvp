-- Admin güncelleme mailleri: anlık tekil gönderimden GÜNLÜK ÖZETE geçiş (karar 2026-07-30).
--
-- Sorun: panele giren her kayıt commit anında ayrı mail oluyordu (30 Temmuz: 13 ayrı mail).
-- Çözüm: admin_update satırları kuyruğa girerken deliver_after = bir sonraki 18:00
-- (Europe/Berlin) alır; claim fonksiyonu vadesi gelmemiş satırı devralmaz. Mevcut 15 dk'lık
-- notification-email-drain pg_cron işi özeti 18:00-18:15 arasında gönderir — YENİ CRON GEREKMEZ.
-- Dispatcher aynı claim'de gelen tüm admin_update satırlarını TEK mailde birleştirir
-- (send-notification-emails + _shared/emails/admin-update-digest.ts). Abone başına gönderim
-- yine tek tek yapılır; değişen yalnız kayıtların tek zarfa girmesidir.
-- new_member / member_welcome tipleri ANLIK kalır (deliver_after = now() varsayılanı).
--
-- Panel "Şimdi gönder" butonu p_force = true ile vadesi gelmemiş satırları da boşaltabilir.

begin;

-- ── 1. deliver_after kolonu ──────────────────────────────────────────────────

alter table public.notification_email_outbox
  add column if not exists deliver_after timestamptz not null default now();

comment on column public.notification_email_outbox.deliver_after is
  'Bu andan önce claim edilemez (p_force hariç). admin_update satırlarını trigger bir sonraki 18:00 Europe/Berlin''e kurar; diğer tipler now() varsayılanıyla anlık kalır.';

-- ── 2. Bir sonraki özet zamanı ───────────────────────────────────────────────
-- Saat 18:00 Europe/Berlin'den önceyse bugün 18:00, değilse yarın 18:00. DST geçiş
-- günlerinde de tanımlıdır (geçişler gece 02:00-03:00 aralığında olur, 18:00 her gün vardır).

create or replace function public.next_admin_digest_time()
returns timestamptz
language sql
stable
set search_path = public
as $$
  select case
    when (now() at time zone 'Europe/Berlin')::time < time '18:00'
      then ((now() at time zone 'Europe/Berlin')::date + time '18:00') at time zone 'Europe/Berlin'
    else (((now() at time zone 'Europe/Berlin')::date + 1) + time '18:00') at time zone 'Europe/Berlin'
  end
$$;

revoke all on function public.next_admin_digest_time() from public, anon, authenticated;
grant execute on function public.next_admin_digest_time() to service_role;

-- ── 3. Trigger: admin_update satırları özete ertelenir ───────────────────────
-- DB tarafında yapılır ki sync-admin-updates.mjs dışındaki olası yazarlar da (elle INSERT,
-- gelecekteki araçlar) aynı davranışı otomatik alsın. Seed satırları 'skipped' geldiği
-- için koşula girmez; girseler de gönderilmedikleri için zararı olmazdı.

create or replace function public.defer_admin_update_notification()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.event_type = 'admin_update' and new.status = 'pending' then
    new.deliver_after := public.next_admin_digest_time();
  end if;
  return new;
end;
$$;

drop trigger if exists defer_admin_update_notification on public.notification_email_outbox;
create trigger defer_admin_update_notification
before insert on public.notification_email_outbox
for each row execute function public.defer_admin_update_notification();

-- ── 4. claim: vadesi gelmeyeni devralma + panel için p_force ─────────────────
-- İmza değiştiği için önce DROP zorunlu: aynı adla iki overload kalırsa PostgREST
-- rpc('claim_notification_emails') çağrısı belirsizlik (300) hatası verir.

drop function if exists public.claim_notification_emails(integer);

create or replace function public.claim_notification_emails(
  p_limit integer default 50,
  p_force boolean default false
)
returns setof public.notification_email_outbox
language plpgsql
volatile
security definer
set search_path = public
as $$
begin
  return query
  with claimed as (
    update public.notification_email_outbox o
    set claimed_at = now(),
        attempts = o.attempts + 1
    where o.id in (
      select c.id
      from public.notification_email_outbox c
      where c.status = 'pending'
        and c.attempts < 5
        and (c.claimed_at is null or c.claimed_at < now() - interval '5 minutes')
        and (p_force or c.deliver_after <= now())
      order by c.created_at
      limit greatest(coalesce(p_limit, 50), 1)
      for update skip locked
    )
    returning o.*
  )
  select * from claimed;
end;
$$;

revoke all on function public.claim_notification_emails(integer, boolean) from public, anon, authenticated;
grant execute on function public.claim_notification_emails(integer, boolean) to service_role;

commit;
