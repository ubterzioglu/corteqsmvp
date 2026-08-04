-- Revizyon isteği bildirimi (revision_request).
--
-- 20260729100000_notification_emails.sql ile kurulan outbox altyapısına DÖRDÜNCÜ bir olay
-- tipi ekler. Şablon: 20260729140000_member_welcome_email.sql. Yeni tablo/boru hattı/cron
-- YOKTUR; dedupe_key UNIQUE, claim_notification_emails (`for update skip locked`), retry ve
-- panel logu olduğu gibi miras alınır.
--
-- Akış:
--   revision_requests INSERT
--     → enqueue_revision_request_notification() trigger'ı
--       → notification_email_outbox satırı (event_type = 'revision_request')
--         → poke_notification_dispatcher() [pg_net, mevcut]
--           → send-notification-emails Edge Function → Zoho SMTP → abone moderator'lar
--
-- Alıcı modeli new_member/admin_update ile AYNIDIR (abone olan moderator'lar), member_welcome
-- gibi payload'dan gelmez. Bu yüzden Edge Function'daki resolveRecipients() değişmez.
--
-- Zamanlama ANLIKTIR (karar 2026-08-04): admin_update'in 18:00 özetine girmez, deliver_after
-- now() varsayılanında kalır. Revizyon talepleri elle tek tek girildiği için doğal olan budur.
--
-- Anahtar KAPALI başlar; panelden açılana kadar kimseye mail gitmez.

begin;

-- ── 1. event_type CHECK'ini genişlet ─────────────────────────────────────────
-- Constraint adı PostgreSQL tarafından üretilmiş olabilir (tabloda inline tanımlıydı).
-- Ada güvenmek yerine event_type'a değen tüm CHECK'ler taranıp düşürülür; aksi halde eski
-- kısıt ayakta kalır ve 'revision_request' INSERT'leri sessizce reddedilir.
do $$
declare
  v_constraint record;
begin
  for v_constraint in
    select conname
    from pg_constraint
    where conrelid = 'public.notification_email_outbox'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) like '%event_type%'
  loop
    execute format(
      'alter table public.notification_email_outbox drop constraint %I',
      v_constraint.conname
    );
  end loop;
end $$;

alter table public.notification_email_outbox
  add constraint notification_email_outbox_event_type_check
  check (event_type in ('new_member', 'admin_update', 'member_welcome', 'revision_request'));

comment on table public.notification_email_outbox is
  'Bildirim e-postası kuyruğu. dedupe_key: new_member:<user_id> | admin_update:<entry_id> | member_welcome:<user_id> | revision_request:<request_id>. UNIQUE kısıtı çift gönderimi imkânsız kılar.';

-- ── 2. Genel anahtar (kapalı başlar) ─────────────────────────────────────────

insert into public.notification_settings (key, value)
values ('email.revision_request.enabled', 'false'::jsonb)
on conflict (key) do nothing;

-- ── 3. Kişisel abonelik kolonu ───────────────────────────────────────────────
-- new_member/admin_update ile aynı model: satırın varlığı yetki DEĞİLDİR, gönderim anında
-- is_moderator() yeniden kontrol edilir (bkz. admin_get_notification_subscribers).

alter table public.admin_notification_subscriptions
  add column if not exists revision_request_email boolean not null default false;

comment on column public.admin_notification_subscriptions.revision_request_email is
  'Admin panelinde yeni revizyon isteği açıldığında mail almak isteyen moderator tercihi.';

-- ── 4. Trigger: yeni talep → kuyruk ──────────────────────────────────────────
--
-- security definer: auth.users'tan yazarın e-postasını okumak için gerekli.
-- auth.users.email varchar(255)'tir → ::text cast ZORUNLU (bkz. mig 20260615160000).
--
-- Gövde `exception when others then return new` ile sarılıdır (auth.users trigger'ındaki
-- aynı savunma): bildirim altyapısı çökse bile revizyon talebi kaydedilir.
--
-- Toplu seed kaçışı: `set local corteqs.skip_revision_notify = 'on'` diyen bir transaction
-- içindeki INSERT'ler kuyruğa hiç düşmez. 51 maddelik MVP seed'i gibi toplu girişlerde mail
-- yağmurunu bu şekilde önle.

create or replace function public.enqueue_revision_request_notification()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_author text;
begin
  if coalesce(current_setting('corteqs.skip_revision_notify', true), '') = 'on' then
    return new;
  end if;

  -- Soft-delete edilmiş olarak eklenen satır (seed/geri yükleme) bildirim üretmez.
  if new.deleted_at is not null then
    return new;
  end if;

  select au.email::text into v_author
  from auth.users au
  where au.id = new.created_by;

  insert into public.notification_email_outbox (event_type, dedupe_key, payload)
  values (
    'revision_request',
    'revision_request:' || new.id::text,
    jsonb_build_object(
      'request_id', new.id::text,
      'title', new.title,
      'detail', new.detail,
      'status', new.status,
      'priority', new.priority,
      'area_label', new.area_label,
      'author_email', v_author,
      'created_at', coalesce(new.created_at, now())
    )
  )
  on conflict (dedupe_key) do nothing;

  perform public.poke_notification_dispatcher();

  return new;
exception when others then
  -- Bildirim ASLA talebin kaydedilmesini bloklamaz.
  return new;
end;
$$;

drop trigger if exists on_revision_request_created_notify on public.revision_requests;
create trigger on_revision_request_created_notify
after insert on public.revision_requests
for each row execute function public.enqueue_revision_request_notification();

-- ── 5. Panelden yazılabilir anahtarlar listesine ekle ────────────────────────
-- p_key allowlist'i korunur: dispatch.secret gibi hassas satırlar panelden ezilemez.

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

  if p_key not in (
    'email.new_member.enabled',
    'email.admin_update.enabled',
    'email.member_welcome.enabled',
    'email.revision_request.enabled'
  ) then
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

-- ── 6. Kişisel abonelik RPC'si: üçüncü parametre ─────────────────────────────
-- İmza değiştiği için önce DROP ZORUNLU: aynı adla iki overload kalırsa PostgREST
-- rpc('set_my_notification_subscription') çağrısı belirsizlik (300) hatası verir
-- (bkz. mig 20260730230000'deki claim_notification_emails dersi).

drop function if exists public.set_my_notification_subscription(boolean, boolean);

create or replace function public.set_my_notification_subscription(
  p_new_member boolean,
  p_admin_update boolean,
  p_revision_request boolean default false
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
  v_revision_request boolean := coalesce(p_revision_request, false);
begin
  if v_uid is null or not public.is_moderator(v_uid) then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  insert into public.admin_notification_subscriptions (
    user_id, new_member_email, admin_update_email, revision_request_email
  )
  values (v_uid, v_new_member, v_admin_update, v_revision_request)
  on conflict (user_id) do update
    set new_member_email = excluded.new_member_email,
        admin_update_email = excluded.admin_update_email,
        revision_request_email = excluded.revision_request_email,
        updated_at = now();

  return jsonb_build_object(
    'myNewMemberEmail', v_new_member,
    'myAdminUpdateEmail', v_admin_update,
    'myRevisionRequestEmail', v_revision_request
  );
end;
$$;

revoke all on function public.set_my_notification_subscription(boolean, boolean, boolean) from public, anon;
grant execute on function public.set_my_notification_subscription(boolean, boolean, boolean) to authenticated;

-- ── 7. Alıcı listesi: yeni olay tipi ─────────────────────────────────────────
-- auth.users.email = varchar(255) → ::text cast ZORUNLU (bkz. 20260615160000).

create or replace function public.admin_get_notification_subscribers(p_event_type text)
returns table (user_id uuid, email text)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if p_event_type not in ('new_member', 'admin_update', 'revision_request') then
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
      when 'revision_request' then s.revision_request_email
      else s.admin_update_email
    end;
end;
$$;

revoke all on function public.admin_get_notification_subscribers(text) from public, anon, authenticated;
grant execute on function public.admin_get_notification_subscribers(text) to service_role;

-- ── 8. Panel durumu: dördüncü anahtar + kişisel tercih ───────────────────────

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
    'memberWelcomeEnabled', public.notification_setting_enabled('email.member_welcome.enabled'),
    'revisionRequestEnabled', public.notification_setting_enabled('email.revision_request.enabled'),
    'myNewMemberEmail', coalesce(v_sub.new_member_email, false),
    'myAdminUpdateEmail', coalesce(v_sub.admin_update_email, false),
    'myRevisionRequestEmail', coalesce(v_sub.revision_request_email, false),
    'pendingCount', (select count(*) from public.notification_email_outbox where status = 'pending'),
    'recent', v_recent
  );
end;
$$;

revoke all on function public.get_admin_notification_state() from public, anon;
grant execute on function public.get_admin_notification_state() to authenticated;

-- ── 9. İki alıcıyı otomatik abone et ─────────────────────────────────────────
-- Karar 2026-08-04: kimse panelden bir şey açmadan mail aksın. Tercih panelden her an
-- kapatılabilir; bu blok yalnız başlangıç durumunu kurar.
--
-- SESSİZ BAŞARISIZLIK YOK: hesap bulunamazsa ya da moderator değilse raise notice ile
-- uyarır — migration çıktısı canlıya uygularken OKUNMALIDIR. Bu savunma canlıda işe yaradı:
-- ilk uygulamada liste 'corteqssocial@gmail.com' diyordu, öyle bir auth.users kaydı YOK
-- (o adres yalnız iletişim adresi). Yönetici hesabının gerçek adresi ubterzioglu@gmail.com.

do $$
declare
  v_email text;
  v_uid uuid;
begin
  foreach v_email in array array['ubterzioglu@gmail.com', 'burakakcakanat@gmail.com']
  loop
    select id into v_uid from auth.users where lower(email) = lower(v_email) limit 1;

    if v_uid is null then
      raise notice 'ABONE EDILEMEDI: % adresli hesap yok.', v_email;
      continue;
    end if;

    if not public.is_moderator(v_uid) then
      raise notice 'DIKKAT: % moderator degil -> abonelik yazildi ama gonderim aninda suzulur, MAIL GITMEZ.', v_email;
    end if;

    insert into public.admin_notification_subscriptions (user_id, revision_request_email)
    values (v_uid, true)
    on conflict (user_id) do update
      set revision_request_email = true,
          updated_at = now();

    raise notice 'ABONE EDILDI: % (revision_request).', v_email;
  end loop;
end $$;

commit;
