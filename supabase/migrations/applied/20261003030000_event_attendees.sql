-- M04 · Topluluk Motoru Faz 1: event_attendees + join/leave RPC'leri
--
-- ═══ KAPSAM (plan Faz 1 madde 3) ═══
--   • `event_attendees (event_id, user_id)` PK · `created_at` · `status`
--     (`going|cancelled`) — iptal satırı SİLİNMEZ, `cancelled`'a döner
--     (yeniden katılım tek upsert; denetim izi kalır).
--   • RLS: kendi kaydını yazar/günceller/siler; SAHİP + admin okur; kullanıcı
--     kendi satırını okur (düğme durumu). SAYAÇ istemciye satırlarla DEĞİL
--     aggregate RPC ile gider (`event_attendee_count`) — katılımcı listesi
--     mahremiyet yüzeyi açmaz.
--   • `join_event_v1` / `leave_event_v1`: `max_attendees` kontrolü SQL'DE ve
--     etkinlik satırı `for update` ile KİLİTLENİR (istemci kontrolü yarış
--     durumudur — plan notu birebir).
--
-- ═══ KARARLAR ═══
--   • Yalnız `published` etkinliğe katılım (pending/hidden/rejected'e katılım
--     anlamsız; onay bekleyen etkinlikte düğme hiç görünmeyecek — M06).
--   • Kapak: `max_attendees NULL` = sınırsız (mevcut semantik). Dolu kapağa
--     katılım → `event_attendee_limit` (P0001 — M02 `event_active_limit` ile
--     aynı errcode ailesi; M05 hata haritası ikisini de Türkçeleştirir).
--   • `cancelled` satırlar kapasite SAYMAZ (count status='going').
--   • Yeni hata kodları: event_attendee_auth_required yerine M02'nin
--     `event_auth_required`'ı YENİDEN kullanılır (kod ailesi tek); yeni olanlar
--     `event_not_found`, `event_not_published`, `event_attendee_limit` ve
--     `event_attendee_not_joined` (katılmamış kullanıcının iptali sessiz no-op
--     DEĞİL — UI yanlış durumu ancak böyle düzeltir).
--   • Sayaç RPC'si anon'a AÇIK (etkinlik detayını ziyaretçi de görüyor —
--     "Anyone can view published events" politikasıyla tutarlı); viewer_status
--     girişsiz çağrıda null.
--
-- ═══ SALT EKLEME ═══
-- Yeni tablo + yeni fonksiyonlar; mevcut hiçbir şey değişmez.

begin;

-- ── 1) Tablo ────────────────────────────────────────────────────────────────

create table if not exists public.event_attendees (
  event_id uuid not null references public.events(id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  status text not null default 'going' check (status in ('going', 'cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (event_id, user_id)
);

comment on table public.event_attendees is
  'Etkinlik katılımcıları (M04): (event_id,user_id) tekil; iptal satırı silinmez '
  'cancelled olur (yeniden katılım upsert, denetim izi kalır). Sayaç istemciye '
  'satırlarla değil event_attendee_count aggregate RPC''siyle gider.';

create index if not exists event_attendees_event_status_idx
  on public.event_attendees (event_id, status);

alter table public.event_attendees enable row level security;

drop policy if exists event_attendees_select_own_owner on public.event_attendees;
create policy event_attendees_select_own_owner on public.event_attendees
  for select to authenticated
  using (
    user_id = auth.uid()
    or public.is_admin(auth.uid())
    or exists (
      select 1 from public.events e
      where e.id = event_id and e.user_id = auth.uid()
    )
  );

-- Doğrudan yazma yolları (RPC dışı) yalnız kendi satırına — RPC security
-- definer zaten bypass eder; politikalar savunma derinliği.
drop policy if exists event_attendees_insert_own on public.event_attendees;
create policy event_attendees_insert_own on public.event_attendees
  for insert to authenticated
  with check (user_id = auth.uid() and status = 'going');

drop policy if exists event_attendees_update_own on public.event_attendees;
create policy event_attendees_update_own on public.event_attendees
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists event_attendees_delete_own on public.event_attendees;
create policy event_attendees_delete_own on public.event_attendees
  for delete to authenticated
  using (user_id = auth.uid());

-- ── 2) Aggregate sayaç RPC'si (satır değil, sayı) ───────────────────────────

create or replace function public.event_attendee_count(p_event_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_max integer;
  v_status text;
  v_count integer;
begin
  select max_attendees into v_max
  from public.events
  where id = p_event_id;
  if not found then
    raise exception 'event_not_found';
  end if;

  select count(*) into v_count
  from public.event_attendees
  where event_id = p_event_id and status = 'going';

  select a.status into v_status
  from public.event_attendees a
  where a.event_id = p_event_id and a.user_id = auth.uid();

  return jsonb_build_object(
    'going_count', v_count,
    'max_attendees', v_max,
    'is_full', (v_max is not null and v_count >= v_max),
    'viewer_status', v_status);
end;
$$;

comment on function public.event_attendee_count(uuid) is
  'Katılım sayacı (M04): aggregate RPC — istemci katılımcı SATIRLARINI görmez. '
  'anon+açık (detay ziyaretçiye de açık); viewer_status girişsiz çağrıda null.';

revoke all on function public.event_attendee_count(uuid) from public;
grant execute on function public.event_attendee_count(uuid) to anon, authenticated;

-- ── 3) join_event_v1 — kapasite SQL'de, satır kilitli ───────────────────────

create or replace function public.join_event_v1(p_event_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_event record;
  v_count integer;
begin
  if v_uid is null then
    raise exception 'event_auth_required';
  end if;

  -- KİLİT: eşzamanlı iki join aynı anda sayarsa kapak aşılır (istemci kontrolü
  -- yarış durumudur — plan notu). Etkinlik satırı for update ile alınır.
  select status, max_attendees into v_event
  from public.events
  where id = p_event_id
  for update;
  if not found then
    raise exception 'event_not_found';
  end if;
  if v_event.status <> 'published' then
    raise exception 'event_not_published';
  end if;

  -- İptal edilmiş kayıt yeniden katılımda canlanır (upsert).
  insert into public.event_attendees (event_id, user_id, status)
  values (p_event_id, v_uid, 'going')
  on conflict (event_id, user_id) do update
     set status = 'going', updated_at = now();

  select count(*) into v_count
  from public.event_attendees
  where event_id = p_event_id and status = 'going';

  if v_event.max_attendees is not null and v_count > v_event.max_attendees then
    -- Kapak aşıldı: kendi katılımını geri al ve reddet (kilit bizde, sayım kesin).
    update public.event_attendees
       set status = 'cancelled', updated_at = now()
     where event_id = p_event_id and user_id = v_uid;
    raise exception 'event_attendee_limit' using errcode = 'P0001';
  end if;

  return jsonb_build_object(
    'event_id', p_event_id,
    'viewer_status', 'going',
    'going_count', v_count,
    'is_full', (v_event.max_attendees is not null and v_count >= v_event.max_attendees));
end;
$$;

comment on function public.join_event_v1(uuid) is
  'Etkinliğe katılım (M04): yalnız published; kapasite kontrolü SQL''de ve '
  'etkinlik satırı for update KİLİTLİ (yarış yok). Dolu kapakta kendi satırını '
  'geri alır + event_attendee_limit (P0001). İptal sonrası yeniden katılım upsert.';

revoke all on function public.join_event_v1(uuid) from public, anon;
grant execute on function public.join_event_v1(uuid) to authenticated;

-- ── 4) leave_event_v1 ───────────────────────────────────────────────────────

create or replace function public.leave_event_v1(p_event_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_count integer;
begin
  if v_uid is null then
    raise exception 'event_auth_required';
  end if;

  update public.event_attendees
     set status = 'cancelled', updated_at = now()
   where event_id = p_event_id and user_id = v_uid and status = 'going';
  if not found then
    raise exception 'event_attendee_not_joined';
  end if;

  select count(*) into v_count
  from public.event_attendees
  where event_id = p_event_id and status = 'going';

  return jsonb_build_object(
    'event_id', p_event_id,
    'viewer_status', 'cancelled',
    'going_count', v_count);
end;
$$;

comment on function public.leave_event_v1(uuid) is
  'Katılım iptali (M04): satır SİLİNMEZ, cancelled olur (denetim izi). Katılmamış '
  'kullanıcının iptali event_attendee_not_joined (sessiz no-op değil — UI yanlış '
  'durumu düzeltir).';

revoke all on function public.leave_event_v1(uuid) from public, anon;
grant execute on function public.leave_event_v1(uuid) to authenticated;

commit;
