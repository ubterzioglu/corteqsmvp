-- Radar gunluk tarama ozeti bildirimi - mevcut abonelik mimarisine baglanir.
--
-- Bu dosyanin ILK hali uygulanamazdi; dort ayri uydurma sema referansi iceriyordu:
--   - FROM profiles WHERE is_admin = true  -> profiles tablosu 2026-06-09'da DROP edildi
--   - admin_notification_subscriptions (event_type, is_enabled) -> bu sutunlar yok;
--     tablo user_id PK + olay basina boolean sutun modelini kullanir
--   - ON CONFLICT (user_id, event_type) -> boyle bir kisit yok (PK yalniz user_id)
--   - notification_settings (setting_key, setting_value) -> gercek sutunlar key / value (jsonb)
-- Hicbiri canliya uygulanmamisti; dosya bastan yazildi.
--
-- Model: diger uc bildirim tipiyle (new_member / admin_update / revision_request) birebir ayni.

begin;

-- 1) Abonelik sutunu
alter table public.admin_notification_subscriptions
  add column if not exists radar_scan_digest_email boolean not null default false;

comment on column public.admin_notification_subscriptions.radar_scan_digest_email is
  'Radar gunluk tarama ozeti maili aboneligi. Varsayilan false; mevcut aboneler bu migration ile acildi.';

-- Mevcut abone satirlarini ac (karar: "tum adminler").
-- Yeni satirlar default false ile gelir, panelden acilir.
update public.admin_notification_subscriptions
set radar_scan_digest_email = true, updated_at = now()
where radar_scan_digest_email = false;

-- 2) Global anahtar (value jsonb'dir, metin degil)
insert into public.notification_settings (key, value, updated_at)
values ('email.radar_scan_digest.enabled', to_jsonb(true), now())
on conflict (key) do nothing;

-- 3) Abone cozumleyici RPC - yeni olay tipini tani
create or replace function public.admin_get_notification_subscribers(p_event_type text)
returns table(user_id uuid, email text)
language plpgsql
stable security definer
set search_path to 'public'
as $function$
begin
  if p_event_type not in ('new_member', 'admin_update', 'revision_request', 'radar_scan_digest') then
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
      when 'radar_scan_digest' then s.radar_scan_digest_email
      else s.admin_update_email
    end;
end;
$function$;

-- 4) Global anahtar allowlist'i
create or replace function public.set_notification_setting(p_key text, p_enabled boolean)
returns boolean
language plpgsql
security definer
set search_path to 'public'
as $function$
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
    'email.revision_request.enabled',
    'email.radar_scan_digest.enabled'
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
$function$;

-- 5) Kisisel abonelik yazici.
-- ESKI 3 parametreli imza DUSURULUR: yeni parametre DEFAULT'lu eklenseydi PostgREST
-- 3 adli argumanla cagrildiginda iki asiri yuku ayirt edemez ve 300 (ambiguous) doner.
drop function if exists public.set_my_notification_subscription(boolean, boolean, boolean);

create or replace function public.set_my_notification_subscription(
  p_new_member boolean,
  p_admin_update boolean,
  p_revision_request boolean default false,
  p_radar_scan_digest boolean default false
)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_uid uuid := auth.uid();
  v_new_member boolean := coalesce(p_new_member, false);
  v_admin_update boolean := coalesce(p_admin_update, false);
  v_revision_request boolean := coalesce(p_revision_request, false);
  v_radar_scan_digest boolean := coalesce(p_radar_scan_digest, false);
begin
  if v_uid is null or not public.is_moderator(v_uid) then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  insert into public.admin_notification_subscriptions (
    user_id, new_member_email, admin_update_email, revision_request_email, radar_scan_digest_email
  )
  values (v_uid, v_new_member, v_admin_update, v_revision_request, v_radar_scan_digest)
  on conflict (user_id) do update
    set new_member_email = excluded.new_member_email,
        admin_update_email = excluded.admin_update_email,
        revision_request_email = excluded.revision_request_email,
        radar_scan_digest_email = excluded.radar_scan_digest_email,
        updated_at = now();

  return jsonb_build_object(
    'myNewMemberEmail', v_new_member,
    'myAdminUpdateEmail', v_admin_update,
    'myRevisionRequestEmail', v_revision_request,
    'myRadarScanDigestEmail', v_radar_scan_digest
  );
end;
$function$;

grant execute on function public.set_my_notification_subscription(boolean, boolean, boolean, boolean)
  to authenticated, service_role;

-- 6) Panel durumu
create or replace function public.get_admin_notification_state()
returns jsonb
language plpgsql
stable security definer
set search_path to 'public'
as $function$
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
    'radarScanDigestEnabled', public.notification_setting_enabled('email.radar_scan_digest.enabled'),
    'myNewMemberEmail', coalesce(v_sub.new_member_email, false),
    'myAdminUpdateEmail', coalesce(v_sub.admin_update_email, false),
    'myRevisionRequestEmail', coalesce(v_sub.revision_request_email, false),
    'myRadarScanDigestEmail', coalesce(v_sub.radar_scan_digest_email, false),
    'pendingCount', (select count(*) from public.notification_email_outbox where status = 'pending'),
    'recent', v_recent
  );
end;
$function$;

commit;
