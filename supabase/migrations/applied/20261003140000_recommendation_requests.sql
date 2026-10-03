-- M17 · Faz 2 (Tavsiye İste) — Migration 1: tablolar + RPC-only yazma + ban kill-switch.
--
-- ═══ KURALLAR (plan Faz 2 + Cadde deseni) ═══
--   • Yeni topluluk içerik tablosu `diaspora_key` TAŞIR + CHECK (CLAUDE.md kuralı);
--     geçerli değerler Cadde ile AYNI: 'tr','in','cn','ph' (cadde_posts_diaspora_check).
--   • YAZMA YALNIZ security-definer RPC (Cadde "RPC-only mutations"): tablo RLS açık,
--     SELECT serbest (topluluk içeriği herkese açık), INSERT/UPDATE/DELETE grant'ları
--     anon+authenticated'tan GERİ ALINIR + write policy YOK → yalnız owner (RPC) yazar.
--   • 🔴 BAN KILL-SWITCH TEK NOKTADAN: `is_cadde_banned(uid)` (has_cadde_feature deseni).
--     Yeni yazma yolları (create/answer) bu merkezi kontrolü çağırır → banlı kullanıcı
--     OTOMATİK reddedilir (M17 kabulü bunu ölçer).
--   • claim/status İSTEMCİDEN ALINMAZ: status gövdede 'open'; is_professional gövdede
--     katalogdan TÜRETİLİR (istemci gönderemez).
--   • Hata kodları `recommendation_*` (M19'da TS çift yönlü harita + ayna testi).
--
-- M18 (match_recommendation_professionals) ve M19+ (kod) bu tabloların üstüne kurulur.

begin;

-- ── Tablolar ────────────────────────────────────────────────────────────────
create table if not exists public.recommendation_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  body text not null,
  category_slug text,
  country text,
  city text,
  status text not null default 'open',
  diaspora_key text not null default 'tr',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint recommendation_requests_status_check
    check (status = any (array['open','answered','closed'])),
  constraint recommendation_requests_diaspora_check
    check (diaspora_key = any (array['tr','in','cn','ph']))
);

create table if not exists public.recommendation_answers (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.recommendation_requests(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  body text not null,
  is_professional boolean not null default false,
  created_at timestamptz not null default now(),
  -- Bir kullanıcı aynı talebe BİR kez yanıt verir (çift yanıt/oy şişirme yok).
  constraint recommendation_answers_unique_per_user unique (request_id, user_id)
);

create index if not exists recommendation_requests_status_created_idx
  on public.recommendation_requests (status, created_at desc);
create index if not exists recommendation_requests_diaspora_idx
  on public.recommendation_requests (diaspora_key);
create index if not exists recommendation_requests_category_idx
  on public.recommendation_requests (category_slug);
create index if not exists recommendation_answers_request_idx
  on public.recommendation_answers (request_id);

-- ── RLS: SELECT serbest (topluluk içeriği), YAZMA yalnız RPC ─────────────────
alter table public.recommendation_requests enable row level security;
alter table public.recommendation_answers  enable row level security;

drop policy if exists recommendation_requests_read on public.recommendation_requests;
create policy recommendation_requests_read on public.recommendation_requests
  for select to anon, authenticated using (true);
drop policy if exists recommendation_answers_read on public.recommendation_answers;
create policy recommendation_answers_read on public.recommendation_answers
  for select to anon, authenticated using (true);

-- Yazma grant'larını geri al: doğrudan INSERT/UPDATE/DELETE YOK, yalnız owner
-- (security-definer RPC) yazar. (Supabase default grant'ları geri alınmalı.)
revoke insert, update, delete on public.recommendation_requests from anon, authenticated;
revoke insert, update, delete on public.recommendation_answers  from anon, authenticated;
grant select on public.recommendation_requests to anon, authenticated;
grant select on public.recommendation_answers  to anon, authenticated;

-- ── RPC 1: talep oluştur (tek yazma yolu) ───────────────────────────────────
create or replace function public.create_recommendation_request_v1(
  p_title text,
  p_body text,
  p_category_slug text default null,
  p_country text default null,
  p_city text default null,
  p_diaspora_key text default 'tr'
)
returns uuid
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_title text := nullif(trim(coalesce(p_title, '')), '');
  v_body text := trim(coalesce(p_body, ''));
  v_diaspora text := coalesce(nullif(trim(coalesce(p_diaspora_key, '')), ''), 'tr');
  v_category text := nullif(trim(coalesce(p_category_slug, '')), '');
  v_id uuid;
begin
  if v_uid is null then
    raise exception 'recommendation_auth_required';
  end if;

  -- 🔴 BAN KILL-SWITCH (tek nokta): banlı kullanıcı otomatik reddedilir.
  if public.is_cadde_banned(v_uid) then
    raise exception 'recommendation_banned';
  end if;

  if v_diaspora not in ('tr','in','cn','ph') then
    raise exception 'recommendation_invalid_diaspora';
  end if;
  if v_title is null or length(v_title) > 160 then
    raise exception 'recommendation_invalid_title';
  end if;
  if length(v_body) < 1 or length(v_body) > 4000 then
    raise exception 'recommendation_invalid_body';
  end if;

  insert into public.recommendation_requests
    (user_id, title, body, category_slug, country, city, status, diaspora_key)
  values
    (v_uid, v_title, v_body, v_category, nullif(trim(coalesce(p_country,'')),''),
     nullif(trim(coalesce(p_city,'')),''), 'open', v_diaspora)
  returning id into v_id;

  return v_id;
end;
$$;

-- ── RPC 2: yanıt ver (tek yazma yolu) ───────────────────────────────────────
create or replace function public.answer_recommendation_v1(
  p_request_id uuid,
  p_body text
)
returns uuid
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_body text := trim(coalesce(p_body, ''));
  v_req public.recommendation_requests%rowtype;
  v_is_professional boolean;
  v_id uuid;
begin
  if v_uid is null then
    raise exception 'recommendation_auth_required';
  end if;

  if public.is_cadde_banned(v_uid) then
    raise exception 'recommendation_banned';
  end if;

  select * into v_req from public.recommendation_requests where id = p_request_id for update;
  if v_req.id is null then
    raise exception 'recommendation_request_not_found';
  end if;
  if v_req.status = 'closed' then
    raise exception 'recommendation_request_closed';
  end if;

  if length(v_body) < 1 or length(v_body) > 4000 then
    raise exception 'recommendation_invalid_body';
  end if;

  -- is_professional İSTEMCİDEN ALINMAZ — katalogdan TÜRETİLİR: kullanıcının yayınlı
  -- üye kaydı (meslek profesyoneli) var mı? (M18 eşleştirmesi bunu kullanır.)
  select exists (
    select 1
    from public.catalog_item_managers m
    join public.catalog_items ci on ci.id = m.item_id
    where m.user_id = v_uid and m.status = 'active'
      and ci.item_type = 'member' and ci.status = 'published'
      and coalesce(ci.is_placeholder, false) = false
  ) into v_is_professional;

  insert into public.recommendation_answers
    (request_id, user_id, body, is_professional)
  values
    (p_request_id, v_uid, v_body, v_is_professional)
  returning id into v_id;

  -- İlk yanıtla talep 'open' → 'answered' (kapalıysa zaten yukarıda reddedildi).
  if v_req.status = 'open' then
    update public.recommendation_requests
       set status = 'answered', updated_at = now()
     where id = p_request_id;
  end if;

  return v_id;
end;
$$;

comment on function public.create_recommendation_request_v1(text,text,text,text,text,text) is
  'M17: tavsiye talebi oluştur (tek yazma yolu). ban kill-switch is_cadde_banned · '
  'status GÖVDEDE open · diaspora CHECK (tr/in/cn/ph). recommendation_* hata kodları.';
comment on function public.answer_recommendation_v1(uuid,text) is
  'M17: tavsiye talebine yanıt (tek yazma yolu). ban kill-switch · is_professional '
  'KATALOGDAN türetilir (istemci gönderemez) · ilk yanıtta open→answered · kapalı '
  'talebe yanıt YOK (recommendation_request_closed).';

-- ── Grant'lar: RPC'ler authenticated'a açık, anon'a kapalı (yazma üye işi) ───
revoke all on function public.create_recommendation_request_v1(text,text,text,text,text,text) from public, anon;
revoke all on function public.answer_recommendation_v1(uuid,text) from public, anon;
grant execute on function public.create_recommendation_request_v1(text,text,text,text,text,text) to authenticated;
grant execute on function public.answer_recommendation_v1(uuid,text) to authenticated;

commit;
