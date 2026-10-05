-- B8 · Haftalık şehir özeti admin toggle
--
-- Karar: 5 Ekim 2026 — kullanıcı onayı alındı.
-- Admin panelinde haftalık şehir özetini açıp kapama tuşu eklenecek.
--
-- Değişiklikler:
-- 1. get_admin_notification_state RPC'ye weeklyCityDigestEnabled ekle
-- 2. set_notification_setting allowlist'ine email.weekly_city_digest.enabled ekle

begin;

-- 1. get_admin_notification_state güncelle
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
    'radarScanDigestEnabled', public.notification_setting_enabled('email.radar_scan_digest.enabled'),
    'weeklyCityDigestEnabled', public.notification_setting_enabled('email.weekly_city_digest.enabled'),
    'myNewMemberEmail', coalesce(v_sub.new_member_email, false),
    'myAdminUpdateEmail', coalesce(v_sub.admin_update_email, false),
    'myRevisionRequestEmail', coalesce(v_sub.revision_request_email, false),
    'myRadarScanDigestEmail', coalesce(v_sub.radar_scan_digest_email, false),
    'pendingCount', (select count(*) from public.notification_email_outbox where status = 'pending'),
    'recent', v_recent
  );
end;
$$;

-- 2. set_notification_setting allowlist güncelle
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
    'email.revision_request.enabled',
    'email.radar_scan_digest.enabled',
    'email.weekly_city_digest.enabled'
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

comment on function public.get_admin_notification_state() is
  'B8: weeklyCityDigestEnabled eklendi. Admin panelinde haftalık şehir özeti toggle.';

commit;
