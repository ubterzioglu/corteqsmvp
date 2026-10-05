-- B8 · Etkinlik onay sistemi geri alındı
--
-- Karar: 5 Ekim 2026 — kullanıcı onayı alındı.
-- A13'ün tersi: Etkinlikler otomatik yayınlanmasın, admin onayından geçsin.
--
-- Değişiklikler:
-- 1. event_settings.first_approval_required = true
-- 2. create_event_v1 fonksiyonu geri alındı (ilk etkinlik pending, sonrakiler published)
-- 3. approval_requests tablosuna yazım geri geldi
--
-- NOT: A13 migration'ı (20261005900000) hâlâ mevcut, bu migration onu override ediyor.

begin;

-- 1. Ayarı true yap
insert into public.event_settings (key, value)
values ('events.first_approval_required', 'true'::jsonb)
on conflict (key) do update
set value = excluded.value, updated_at = now();

-- 2. create_event_v1 fonksiyonunu geri al
create or replace function public.create_event_v1(
  p_title text,
  p_description text,
  p_category text,
  p_type text,
  p_event_date date,
  p_start_time time default null,
  p_end_time time default null,
  p_country text default null,
  p_city text default null,
  p_location text default null,
  p_online_url text default null,
  p_price numeric default null,
  p_max_attendees integer default null,
  p_cover_image text default null,
  p_tags text[] default null,
  p_organizer_name text default null,
  p_organizer_type text default 'bireysel',
  p_registration_url text default null,
  p_timezone text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_active integer;
  v_limit integer;
  v_id uuid;
  v_status text;
  v_approval_source text;
  v_first_approval_required boolean;
  v_has_published boolean;
begin
  -- Giriş kontrolü
  if v_uid is null then
    raise exception 'event_auth_required';
  end if;
  if coalesce(btrim(p_title), '') = '' or coalesce(btrim(p_description), '') = ''
     or coalesce(btrim(p_category), '') = '' or coalesce(btrim(p_type), '') = ''
     or p_event_date is null then
    raise exception 'event_field_required';
  end if;

  -- Aktif etkinlik limiti kontrolü
  v_limit := public.event_setting_int('events.active_limit', 2);
  select count(*) into v_active
  from public.events
  where user_id = v_uid
    and status = 'published'
    and event_date >= current_date;
  if v_active >= v_limit then
    raise exception 'event_active_limit' using errcode = 'P0001';
  end if;

  -- İlk onay kuralı kontrolü
  select value::boolean into v_first_approval_required
  from public.event_settings
  where key = 'events.first_approval_required';

  -- Kullanıcının daha önce published etkinliği var mı?
  select exists (
    select 1 from public.events
    where user_id = v_uid and status = 'published'
  ) into v_has_published;

  -- Durum belirleme
  if v_first_approval_required and not v_has_published then
    -- İlk etkinlik: pending (admin onayı gerekli)
    v_status := 'pending';
    v_approval_source := null;
  else
    -- Sonraki etkinlikler: otomatik published
    v_status := 'published';
    v_approval_source := 'auto';
  end if;

  -- Etkinlik ekle
  insert into public.events (
    user_id, title, description, category, type, event_date, start_time, end_time,
    country, city, location, online_url, price, max_attendees, cover_image, tags,
    organizer_name, organizer_type, registration_url, timezone,
    featured, status, approval_source
  ) values (
    v_uid, btrim(p_title), btrim(p_description), btrim(p_category), btrim(p_type),
    p_event_date, p_start_time, p_end_time,
    p_country, p_city, p_location, p_online_url, p_price, p_max_attendees, p_cover_image,
    case when p_tags is not null and array_length(p_tags, 1) > 0 then p_tags else null end,
    p_organizer_name, p_organizer_type, p_registration_url, p_timezone,
    false, v_status, v_approval_source
  )
  returning id into v_id;

  -- İlk etkinlikse approval_requests'e ekle
  if v_status = 'pending' then
    insert into public.approval_requests (
      request_type, target_entity_type, target_entity_id, requester_id, payload
    ) values (
      'event_create', 'event', v_id, v_uid,
      jsonb_build_object('event_id', v_id, 'title', p_title)
    );
  end if;

  return jsonb_build_object(
    'event_id', v_id,
    'status', v_status,
    'approval_source', v_approval_source);
end;
$$;

comment on function public.create_event_v1(text, text, text, text, date, time, time, text, text, text, text, numeric, integer, text, text[], text, text, text, text) is
  'B8: Etkinlik oluşturma. İlk etkinlik pending (admin onayı gerekli), sonrakiler otomatik published. '
  'events.first_approval_required ayarı ile kontrol edilir. Aktif limit event_settings''ten (varsayılan 2).';

commit;
