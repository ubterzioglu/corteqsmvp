-- M02 · Topluluk Motoru Faz 1: etkinlik ilk-onay kuralı + ayarlar + create_event_v1
--
-- ═══ KAPSAM (plan Faz 1, madde 1-2 + T1) ═══
--   • `events.approval_source` ('auto'|'admin') — kaydın NİYE yayında olduğu
--     SQL'den cevaplanabilir olsun.
--   • `event_settings` (cadde_settings/group_settings deseni): aktif limit +
--     bireysel-rol anahtarı. Ürün kararı = SQL update, kod değişikliği değil.
--   • `create_event_v1` security definer — TEK yazma yolu:
--       ilk etkinlik (bireysel rol, daha önce published yok) → 'pending' +
--         approval_requests'e 'event_create' satırı;
--       sonrası (veya bireysel-dışı rol) → 'published' + approval_source='auto';
--       aynı anda en fazla `events.active_limit` (2) aktif etkinlik
--         (published && event_date >= current_date) → errcode P0001,
--         mesaj 'event_active_limit'.
--
-- ═══ KARARLAR ═══
--   • T1 bu migration'da KAPANMAZ — o M03'ün işi (INSERT politikası + status
--     trigger'ı). Bu batch'te RPC hazır; M05 istemciyi RPC'ye geçirir; M03
--     doğrudan PostgREST yazımını kapatır. Sıra bilinçli: önce alternatif yol
--     kurulur, sonra eski yol kapanır (canlı form kırılmasın).
--   • user_id İSTEMCİDEN ALINMAZ — auth.uid() (mevcut istemci kendi userId'sini
--     geçiriyor; RPC'de bu yüzey kapanır).
--   • "Bireysel" tanımı `events.first_approval_bireysel_key` ayarından (varsayılan
--     'User_DiasporaMember' — G13 ölçümü: 175/175 kullanıcının rolü bu). Rolü
--     farklı/çoklu olan (kurumsal) hesap ilk etkinlikte de otomatik yayınlanır.
--     K10(a) sonrası yükseltme alanlar da bu muafiyete girer.
--   • approval_source='admin' YAZMAZ — pending satır admin onaylayınca admin
--     onay yolu (M08 panel hızlı eylemleri) 'admin' basar. Bugünkü AdminEventsPage
--     status'u doğrudan güncelliyor; M08'e dek approval_source null kalabilir
--     (null = "kaynak belirsiz/eski yol").
--   • approval_requests satırı: request_type='event_create' (CHECK'te ZATEN var —
--     ölçüldü), target_entity_type='event', payload {event_id, title}.
--   • Limit hesabı YALNIZ published + gelecekteki event_date; pending ilk
--     etkinlik limiti yemez (kullanıcı onay beklerken ikinciyi taslaklayabilir —
--     ama ikinci de pending kalır, çünkü published'i yok).
--
-- ═══ SALT EKLEME ═══
-- Kolon ekler (if not exists), tablo ekler; hiçbir şey düşürmez/değiştirmez.

begin;

-- ── 1) approval_source kolonu ────────────────────────────────────────────────

alter table public.events
  add column if not exists approval_source text;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'events_approval_source_check'
      and conrelid = 'public.events'::regclass
  ) then
    alter table public.events
      add constraint events_approval_source_check
      check (approval_source in ('auto', 'admin'));
  end if;
end $$;

comment on column public.events.approval_source is
  'Kayıt neden yayında? auto = ilk-onay kuralı geçti (create_event_v1), '
  'admin = moderatör onayladı (M08 onay yolu yazar), null = eski yol/belirsiz.';

-- ── 2) event_settings (cadde_settings deseni) ───────────────────────────────

create table if not exists public.event_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now(),
  updated_by uuid
);

comment on table public.event_settings is
  'Etkinlik motoru eşikleri (M02, G09/cadde_settings doktrini): her eşik bir '
  'satır, kodda sabit YOK. Ürün kararları SQL update ile değişir.';

alter table public.event_settings enable row level security;
revoke all on table public.event_settings from public, anon, authenticated;

insert into public.event_settings (key, value)
values
  ('events.active_limit', '2'::jsonb),                          -- plan Faz 1: "en fazla 2 aktif"
  ('events.first_approval_bireysel_key', '"User_DiasporaMember"'::jsonb) -- ⚠️ ürün kararı
on conflict (key) do nothing;

create or replace function public.event_setting_int(p_key text, p_default integer)
returns integer
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select (value #>> '{}')::integer from public.event_settings where key = p_key),
    p_default);
$$;

create or replace function public.event_setting_text(p_key text, p_default text)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select value #>> '{}' from public.event_settings where key = p_key),
    p_default);
$$;

revoke all on function public.event_setting_int(text, integer) from public, anon;
revoke all on function public.event_setting_text(text, text) from public, anon;
grant execute on function public.event_setting_int(text, integer) to authenticated;
grant execute on function public.event_setting_text(text, text) to authenticated;

-- ── 3) create_event_v1 — tek yazma yolu ─────────────────────────────────────

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
  v_role_key text;
  v_bireysel boolean;
  v_has_prior boolean;
  v_auto boolean;
  v_status text;
  v_active integer;
  v_limit integer;
  v_id uuid;
begin
  if v_uid is null then
    raise exception 'event_auth_required';
  end if;
  if coalesce(btrim(p_title), '') = '' or coalesce(btrim(p_description), '') = ''
     or coalesce(btrim(p_category), '') = '' or coalesce(btrim(p_type), '') = ''
     or p_event_date is null then
    raise exception 'event_field_required';
  end if;

  -- Aktif etkinlik limiti (published + bugünden ileri) — insert'ten ÖNCE.
  v_limit := public.event_setting_int('events.active_limit', 2);
  select count(*) into v_active
  from public.events
  where user_id = v_uid
    and status = 'published'
    and event_date >= current_date;
  if v_active >= v_limit then
    raise exception 'event_active_limit' using errcode = 'P0001';
  end if;

  -- İlk-onay kuralı: bireysel rol + daha önce published etkinliği YOK → pending.
  select r.key into v_role_key
  from public.user_role_assignments a
  join public.roles r on r.id = a.role_id
  where a.user_id = v_uid
  limit 1;
  v_bireysel := (v_role_key is null
                 or v_role_key = public.event_setting_text('events.first_approval_bireysel_key', 'User_DiasporaMember'));
  select exists (
    select 1 from public.events where user_id = v_uid and status = 'published'
  ) into v_has_prior;
  v_auto := (not v_bireysel) or v_has_prior;
  v_status := case when v_auto then 'published' else 'pending' end;

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
    false, v_status, case when v_auto then 'auto' else null end
  )
  returning id into v_id;

  if v_status = 'pending' then
    insert into public.approval_requests
      (user_id, request_type, payload, status, target_entity_type, target_entity_id)
    values
      (v_uid, 'event_create',
       jsonb_build_object('event_id', v_id, 'title', btrim(p_title)),
       'pending', 'event', v_id);
  end if;

  return jsonb_build_object(
    'event_id', v_id,
    'status', v_status,
    'approval_source', case when v_auto then 'auto' else null end);
end;
$$;

comment on function public.create_event_v1(text, text, text, text, date, time, time, text, text, text, text, numeric, integer, text, text[], text, text, text, text) is
  'Etkinlik oluşturmanın TEK yolu (M02): ilk etkinlik (bireysel rol) pending + '
  'approval_requests(event_create); sonrası/bireysel-dışı rol published + '
  'approval_source=auto. Aktif limit event_settings''ten (varsayılan 2) — aşım '
  'event_active_limit (P0001). user_id auth.uid()''den, istemciden ALINMAZ. '
  'M03: doğrudan PostgREST INSERT''i kapanır (T1). M05: istemci bu RPC''ye geçer.';

revoke all on function public.create_event_v1(text, text, text, text, date, time, time, text, text, text, text, numeric, integer, text, text[], text, text, text, text) from public, anon;
grant execute on function public.create_event_v1(text, text, text, text, date, time, time, text, text, text, text, numeric, integer, text, text[], text, text, text, text) to authenticated;

commit;
