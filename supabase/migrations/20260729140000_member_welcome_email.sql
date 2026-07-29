-- Üyeye giden hoş geldin e-postası (member_welcome).
--
-- 20260729100000_notification_emails.sql ile kurulan outbox altyapısına ÜÇÜNCÜ bir olay
-- tipi ekler. Yeni tablo/boru hattı yoktur; dedupe_key UNIQUE, claim_notification_emails
-- (`for update skip locked`), retry ve panel logu olduğu gibi miras alınır.
--
-- Mevcut iki tipten TEK yapısal farkı alıcısıdır:
--   new_member / admin_update → alıcı, abone olan admin/moderator'lardır
--   member_welcome            → alıcı, üyenin KENDİSİDİR (payload.email)
-- Bu yüzden admin_get_notification_subscribers'a hiç uğramaz ve o fonksiyon değişmez.
--
-- Anahtar KAPALI başlar; panelden "örnek mail" ile göz kontrolü yapıldıktan sonra açılır.
-- Geçmiş üyelere backfill YAPILMAZ: trigger yalnız yeni doğrulama geçişlerinde çalışır.

begin;

-- ── 1. event_type CHECK'ini genişlet ─────────────────────────────────────────
-- Constraint tabloda inline tanımlandığı için adı PostgreSQL tarafından üretilmişti.
-- Ada güvenmek yerine event_type'a değen tüm CHECK'ler taranıp düşürülür; aksi halde
-- eski kısıt ayakta kalır ve 'member_welcome' INSERT'leri sessizce reddedilir.
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
  check (event_type in ('new_member', 'admin_update', 'member_welcome'));

comment on table public.notification_email_outbox is
  'Bildirim e-postası kuyruğu. dedupe_key: new_member:<user_id> | admin_update:<entry_id> | member_welcome:<user_id>. UNIQUE kısıtı çift gönderimi imkânsız kılar.';

-- ── 2. Genel anahtar (kapalı başlar) ─────────────────────────────────────────

insert into public.notification_settings (key, value)
values ('email.member_welcome.enabled', 'false'::jsonb)
on conflict (key) do nothing;

-- ── 3. Panelden yazılabilir anahtarlar listesine ekle ────────────────────────
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
    'email.member_welcome.enabled'
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

-- ── 4. Trigger: aynı olayda iki kuyruk satırı ────────────────────────────────
--
-- DİKKAT (değişmedi, korunması ZORUNLU): bu fonksiyon auth.users trigger'ı olarak
-- Supabase auth servisinin transaction'ında çalışır. Hata fırlatırsa KULLANICI HİÇ
-- KAYIT OLAMAZ. Gövde bu yüzden `exception when others then return new` ile sarılıdır.
--
-- Değişen: artık admin bildirimine EK OLARAK üyenin kendi hoş geldin satırı da yazılır.
-- İki INSERT de `on conflict (dedupe_key) do nothing` ile korunur; trigger yeniden
-- tetiklense bile ikinci bir mail üretilmez.
create or replace function public.enqueue_new_member_notification()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_should_notify boolean := false;
  v_full_name text;
begin
  if tg_op = 'INSERT' then
    v_should_notify := new.email_confirmed_at is not null;
  elsif tg_op = 'UPDATE' then
    v_should_notify := old.email_confirmed_at is null and new.email_confirmed_at is not null;
  end if;

  if not v_should_notify or new.email is null then
    return new;
  end if;

  -- Google/OAuth kayıtlarında dolu gelir; e-posta+şifre kayıtlarında genelde NULL'dır.
  -- Şablon isim yoksa nötr hitaba düşer, e-postadan isim türetmez.
  v_full_name := nullif(trim(coalesce(
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'name'
  )), '');

  -- (a) Adminlere "yeni üye kaydoldu" bildirimi — mevcut davranış.
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

  -- (b) Üyenin kendisine hoş geldin maili — yeni.
  insert into public.notification_email_outbox (event_type, dedupe_key, payload)
  values (
    'member_welcome',
    'member_welcome:' || new.id::text,
    jsonb_build_object(
      'user_id', new.id::text,
      'email', new.email::text,
      'full_name', v_full_name,
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

-- ── 5. Panel durumu: üçüncü anahtarı da döndür ───────────────────────────────
-- Kişisel abonelik alanları DEĞİŞMEZ: hoş geldin maili üyeye gider, admin abone olmaz.
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
    'myNewMemberEmail', coalesce(v_sub.new_member_email, false),
    'myAdminUpdateEmail', coalesce(v_sub.admin_update_email, false),
    'pendingCount', (select count(*) from public.notification_email_outbox where status = 'pending'),
    'recent', v_recent
  );
end;
$$;

revoke all on function public.get_admin_notification_state() from public, anon;
grant execute on function public.get_admin_notification_state() to authenticated;

commit;
