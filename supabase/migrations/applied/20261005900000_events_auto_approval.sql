-- A13 · Etkinlik otomatik onay — ilk-onay kuralı kaldırıldı
--
-- Kaynak: docs/plans/2026-10-05-plan-8-urun-istegi.md A13
-- Değişiklik: Tüm etkinlikler otomatik published olur (ilk-onay kuralı YOK).
-- approval_requests(event_create) yazımı kaldırıldı.
-- Aktif limit (2) ve event_date >= current_date kuralı aynen kalır.

begin;

-- ── 1. Ayar: events.first_approval_required = false ──────────────────────────
-- Ürün anahtarı: SQL update ile geri alınabilir.
insert into public.event_settings (key, value)
values ('events.first_approval_required', 'false'::jsonb)
on conflict (key) do update
set value = excluded.value, updated_at = now();

-- ── 2. create_event_v1 — OTOMATİK ONAY ───────────────────────────────────────
-- İlk-onay kuralı KALDIRILDI. Tüm etkinlikler published + approval_source='auto'.
-- approval_requests yazımı KALDIRILDI.
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

  -- A13: Aktif etkinlik limiti (published + bugünden ileri) — insert'ten ÖNCE.
  v_limit := public.event_setting_int('events.active_limit', 2);
  select count(*) into v_active
  from public.events
  where user_id = v_uid
    and status = 'published'
    and event_date >= current_date;
  if v_active >= v_limit then
    raise exception 'event_active_limit' using errcode = 'P0001';
  end if;

  -- A13: Tüm etkinlikler OTOMATİK published (ilk-onay kuralı YOK).
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
    false, 'published', 'auto'
  )
  returning id into v_id;

  -- A13: approval_requests yazımı KALDIRILDI (otomatik onay).

  return jsonb_build_object(
    'event_id', v_id,
    'status', 'published',
    'approval_source', 'auto');
end;
$$;

comment on function public.create_event_v1(text, text, text, text, date, time, time, text, text, text, text, numeric, integer, text, text[], text, text, text, text) is
  'A13: Etkinlik oluşturmanın TEK yolu. Tüm etkinlikler OTOMATİK published (ilk-onay kuralı KALDIRILDI). '
  'approval_requests yazımı KALDIRILDI. Aktif limit event_settings''ten (varsayılan 2) — aşım '
  'event_active_limit (P0001). user_id auth.uid()''den, istemciden ALINMAZ. '
  'M03: doğrudan PostgREST INSERT''i kapanır (T1). M05: istemci bu RPC''ye geçer.';

revoke all on function public.create_event_v1(text, text, text, text, date, time, time, text, text, text, text, numeric, integer, text, text[], text, text, text, text) from public, anon;
grant execute on function public.create_event_v1(text, text, text, text, date, time, time, text, text, text, text, numeric, integer, text, text[], text, text, text, text) to authenticated;

-- ── 3. Canlıda hâlâ pending kalan events satırları ────────────────────────────
-- Backfill UPDATE bu migration'da YOK — ayrı operasyon SQL'i:
-- docs/operations/2026-10-05-etkinlik-bekleyenleri-yayinla.sql
-- (A1.5: migration'dan çıkarıldı, manuel çalıştırma §B8)

comment on column public.events.approval_source is
  'A13: auto = otomatik onay (create_event_v1), backfill_auto = migration ile geriye dönük yayınlama, '
  'admin = yönetici onayı (eski akış).';

commit;
