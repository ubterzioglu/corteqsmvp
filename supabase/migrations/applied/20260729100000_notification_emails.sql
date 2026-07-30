-- Bildirim e-postaları: yeni üye kaydı + admin güncellemeleri (abonelik tabanlı).
--
-- Mimari (outbox deseni):
--   auth.users trigger'ı / sync:admin-updates script'i  ──►  notification_email_outbox
--   outbox  ──►  send-notification-emails Edge Function  ──►  Resend  ──►  aboneler
--
-- Outbox tek gerçek kaynaktır. dedupe_key UNIQUE kısıtı hem "aynı üye için iki kez mail"
-- hem de "aynı güncelleme kaydını iki kez yollama" durumunu imkânsız kılar; tetikleyici
-- (pg_net poke / admin panel butonu / pg_cron) başarısız olsa bile kayıt kaybolmaz.
--
-- Erişim modeli cadde_settings desenini izler (20260610180000_cadde300_001_user_verifications):
-- üç tablo da client'a tamamen kapalıdır (RLS açık + policy YOK + grant revoke); okuma/yazma
-- yalnız aşağıdaki security-definer RPC'ler üzerinden yapılır.

begin;

-- ── 1. Tablolar ──────────────────────────────────────────────────────────────

-- Global anahtarlar + dispatcher config (URL/secret deploy sonrası ELLE doldurulur,
-- migration'a yazılmaz).
create table if not exists public.notification_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null
);

comment on table public.notification_settings is
  'Bildirim e-postası ayarları. email.*.enabled anahtarları admin panelinden yönetilir; dispatch.url / dispatch.secret deploy sonrası elle doldurulur (client erişimi yoktur).';

-- Kişi bazlı abonelik. Satırın varlığı yetki DEĞİLDİR — gönderim anında is_moderator()
-- yeniden kontrol edilir, böylece yetkisi alınan eski admin mail almaya devam etmez.
create table if not exists public.admin_notification_subscriptions (
  user_id uuid primary key references auth.users(id) on delete cascade,
  new_member_email boolean not null default false,
  admin_update_email boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.admin_notification_subscriptions is
  'Admin/moderator başına e-posta bildirim tercihi. Gönderim anında is_moderator() ile yeniden süzülür.';

-- Kuyruk + gönderim logu.
create table if not exists public.notification_email_outbox (
  id uuid primary key default gen_random_uuid(),
  event_type text not null check (event_type in ('new_member', 'admin_update')),
  dedupe_key text not null unique,
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'pending' check (status in ('pending', 'sent', 'failed', 'skipped')),
  attempts integer not null default 0,
  last_error text,
  recipient_count integer,
  created_at timestamptz not null default now(),
  claimed_at timestamptz,
  sent_at timestamptz
);

comment on table public.notification_email_outbox is
  'Bildirim e-postası kuyruğu. dedupe_key: new_member:<user_id> | admin_update:<entry_id>. UNIQUE kısıtı çift gönderimi imkânsız kılar.';

create index if not exists notification_email_outbox_pending_idx
  on public.notification_email_outbox (status, created_at)
  where status = 'pending';

create index if not exists notification_email_outbox_created_idx
  on public.notification_email_outbox (created_at desc);

-- ── 2. Erişim: hepsi private (deny-all) ──────────────────────────────────────

alter table public.notification_settings enable row level security;
alter table public.admin_notification_subscriptions enable row level security;
alter table public.notification_email_outbox enable row level security;

revoke all on table public.notification_settings from anon, authenticated;
revoke all on table public.admin_notification_subscriptions from anon, authenticated;
revoke all on table public.notification_email_outbox from anon, authenticated;

grant all on table public.notification_settings to service_role;
grant all on table public.admin_notification_subscriptions to service_role;
grant all on table public.notification_email_outbox to service_role;

-- Anahtarlar KAPALI başlar: deploy anında istenmeyen mail yağmurunu engeller.
insert into public.notification_settings (key, value)
values
  ('email.new_member.enabled', 'false'::jsonb),
  ('email.admin_update.enabled', 'false'::jsonb)
on conflict (key) do nothing;

-- ── 3. Yardımcılar ───────────────────────────────────────────────────────────

create or replace function public.notification_setting_enabled(p_key text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((value #>> '{}')::boolean, false)
  from public.notification_settings
  where key = p_key;
$$;

revoke all on function public.notification_setting_enabled(text) from public, anon;

-- Dispatcher'ı dürter (anlık gönderim). pg_net yoksa veya config boşsa SESSİZCE atlar —
-- kayıt outbox'ta 'pending' kalır, admin panelindeki buton ya da cron drenajı yapar.
create or replace function public.poke_notification_dispatcher()
returns void
language plpgsql
volatile
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

  select value #>> '{}' into v_url from public.notification_settings where key = 'dispatch.url';
  select value #>> '{}' into v_secret from public.notification_settings where key = 'dispatch.secret';

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
  -- Dürtme asla çağıranı (özellikle auth.users trigger'ını) bozmamalı.
  raise notice 'poke_notification_dispatcher atlandi: %', sqlerrm;
end;
$$;

revoke all on function public.poke_notification_dispatcher() from public, anon, authenticated;

-- ── 4. Yeni üye trigger'ı ────────────────────────────────────────────────────

-- DİKKAT: auth.users trigger'ı Supabase auth servisinin transaction'ında çalışır.
-- Hata fırlatırsa KULLANICI HİÇ KAYIT OLAMAZ. Bu yüzden gövdenin tamamı
-- `exception when others then return new` ile sarılıdır — bildirim asla kaydı bloklamaz.
--
-- Yalnız e-posta DOĞRULANDIĞINDA kuyruğa düşer (INSERT'te dolu gelirse OAuth kaydıdır):
-- doğrulanmamış/sahte kayıtlar mail üretmez.
create or replace function public.enqueue_new_member_notification()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_should_notify boolean := false;
begin
  if tg_op = 'INSERT' then
    v_should_notify := new.email_confirmed_at is not null;
  elsif tg_op = 'UPDATE' then
    v_should_notify := old.email_confirmed_at is null and new.email_confirmed_at is not null;
  end if;

  if not v_should_notify or new.email is null then
    return new;
  end if;

  insert into public.notification_email_outbox (event_type, dedupe_key, payload)
  values (
    'new_member',
    'new_member:' || new.id::text,
    jsonb_build_object(
      'user_id', new.id::text,
      'email', new.email::text,
      'provider', coalesce(new.raw_app_meta_data ->> 'provider', 'email'),
      'created_at', coalesce(new.created_at, now())
    )
  )
  on conflict (dedupe_key) do nothing;

  perform public.poke_notification_dispatcher();

  return new;
exception when others then
  return new;
end;
$$;

-- Mevcut on_auth_user_created_assign_role trigger'ına DOKUNULMAZ — bu ayrı bir trigger'dır.
drop trigger if exists on_auth_user_created_notify_email on auth.users;
create trigger on_auth_user_created_notify_email
after insert or update of email_confirmed_at on auth.users
for each row execute function public.enqueue_new_member_notification();

-- ── 5. Admin panel RPC'leri ──────────────────────────────────────────────────

-- Sayfanın tamamını tek çağrıda doldurur: yetki, global anahtarlar, kendi aboneliği,
-- bekleyen sayısı ve son 20 gönderim kaydı.
create or replace function public.get_admin_notification_state()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_sub public.admin_notification_subscriptions%rowtype;
  v_recent jsonb;
begin
  if v_uid is null or not public.is_moderator(v_uid) then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  select * into v_sub
  from public.admin_notification_subscriptions
  where user_id = v_uid;

  select coalesce(jsonb_agg(to_jsonb(x) order by x.created_at desc), '[]'::jsonb)
  into v_recent
  from (
    select id, event_type, status, recipient_count, last_error, created_at, sent_at, payload
    from public.notification_email_outbox
    order by created_at desc
    limit 20
  ) x;

  return jsonb_build_object(
    'isAdmin', public.is_admin(v_uid),
    'newMemberEnabled', public.notification_setting_enabled('email.new_member.enabled'),
    'adminUpdateEnabled', public.notification_setting_enabled('email.admin_update.enabled'),
    'myNewMemberEmail', coalesce(v_sub.new_member_email, false),
    'myAdminUpdateEmail', coalesce(v_sub.admin_update_email, false),
    'pendingCount', (select count(*) from public.notification_email_outbox where status = 'pending'),
    'recent', v_recent
  );
end;
$$;

revoke all on function public.get_admin_notification_state() from public, anon;
grant execute on function public.get_admin_notification_state() to authenticated;

-- Global anahtar — yalnız admin. p_key ALLOWLIST'lidir: dispatch.secret gibi hassas
-- satırların panelden ezilmesi mümkün değildir.
create or replace function public.set_notification_setting(p_key text, p_enabled boolean)
returns boolean
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null or not public.is_admin(v_uid) then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  if p_key not in ('email.new_member.enabled', 'email.admin_update.enabled') then
    raise exception 'unknown_setting_key' using errcode = '22023';
  end if;

  insert into public.notification_settings (key, value, updated_at, updated_by)
  values (p_key, to_jsonb(coalesce(p_enabled, false)), now(), v_uid)
  on conflict (key) do update
    set value = excluded.value,
        updated_at = now(),
        updated_by = excluded.updated_by;

  return coalesce(p_enabled, false);
end;
$$;

revoke all on function public.set_notification_setting(text, boolean) from public, anon;
grant execute on function public.set_notification_setting(text, boolean) to authenticated;

-- Kişisel abonelik — çağıran yalnız KENDİ satırını yazabilir (user_id parametresi yoktur).
create or replace function public.set_my_notification_subscription(
  p_new_member boolean,
  p_admin_update boolean
)
returns jsonb
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_new_member boolean := coalesce(p_new_member, false);
  v_admin_update boolean := coalesce(p_admin_update, false);
begin
  if v_uid is null or not public.is_moderator(v_uid) then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  insert into public.admin_notification_subscriptions (user_id, new_member_email, admin_update_email)
  values (v_uid, v_new_member, v_admin_update)
  on conflict (user_id) do update
    set new_member_email = excluded.new_member_email,
        admin_update_email = excluded.admin_update_email,
        updated_at = now();

  return jsonb_build_object(
    'myNewMemberEmail', v_new_member,
    'myAdminUpdateEmail', v_admin_update
  );
end;
$$;

revoke all on function public.set_my_notification_subscription(boolean, boolean) from public, anon;
grant execute on function public.set_my_notification_subscription(boolean, boolean) to authenticated;

-- ── 6. Gönderim tarafı (service_role) ────────────────────────────────────────

-- Alıcı listesi: ilgili tercihi açık VE hâlâ moderator olan kullanıcılar.
-- auth.users.email = varchar(255) → ::text cast ZORUNLU (bkz. 20260615160000).
create or replace function public.admin_get_notification_subscribers(p_event_type text)
returns table (user_id uuid, email text)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if p_event_type not in ('new_member', 'admin_update') then
    raise exception 'unknown_event_type' using errcode = '22023';
  end if;

  return query
  select s.user_id, au.email::text
  from public.admin_notification_subscriptions s
  join auth.users au on au.id = s.user_id
  where au.email is not null
    and public.is_moderator(s.user_id)
    and case p_event_type
      when 'new_member' then s.new_member_email
      else s.admin_update_email
    end;
end;
$$;

revoke all on function public.admin_get_notification_subscribers(text) from public, anon, authenticated;
grant execute on function public.admin_get_notification_subscribers(text) to service_role;

-- Atomik kuyruk devralma. `for update skip locked` iki dispatcher'ın (pg_net poke +
-- panel butonu + cron) aynı satırı almasını imkânsız kılar; çift mail atılmaz.
-- claimed_at 5 dakikadan eskiyse kayıt yeniden devralınabilir → çöken bir gönderim
-- kuyruğu sonsuza dek kilitlemez. attempts >= 5 olanlar kalıcı olarak elenir.
create or replace function public.claim_notification_emails(p_limit integer default 50)
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
      order by c.created_at
      limit greatest(coalesce(p_limit, 50), 1)
      for update skip locked
    )
    returning o.*
  )
  select * from claimed;
end;
$$;

revoke all on function public.claim_notification_emails(integer) from public, anon, authenticated;
grant execute on function public.claim_notification_emails(integer) to service_role;

-- ── 7. pg_cron emniyet ağı (opsiyonel) ───────────────────────────────────────
-- pg_net poke anlık gönderimi sağlar; bu cron yalnız takılı kalan kayıtları toplar.
-- Eklenti yoksa migration HATA VERMEZ (cadde300_014 deseni) — panel butonu yedektir.

do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    perform cron.schedule(
      'notification-email-drain',
      '*/15 * * * *',
      'select public.poke_notification_dispatcher()'
    );
    raise notice 'pg_cron bulundu: notification-email-drain 15 dakikada bir zamanlandi.';
  else
    raise notice 'pg_cron yok: anlik gonderim pg_net poke ile, yedek olarak admin panel butonu kullanilir.';
  end if;
exception when others then
  raise notice 'pg_cron zamanlamasi atlandi: %', sqlerrm;
end $$;

commit;
