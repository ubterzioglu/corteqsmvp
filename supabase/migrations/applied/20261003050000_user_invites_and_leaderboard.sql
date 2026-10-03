-- M11 · Topluluk Motoru Faz 3: davet tabloları + RPC'ler + rozet ayarları
--
-- ═══ KAPSAM (plan Faz 3) ═══
--   • `user_invites` — üye başına TEK davet kodu; alfabe `referral-codes.ts`
--     SAFE_CHARS ile BİREBİR (karıştırılabilir harf yok: I/O/0/1 yok).
--     ⚠️ Mevcut `referral_codes` tablosu admin'in PAZARLAMA kodu — dokunulmadı.
--   • `user_invite_redemptions` — `invited_user_id` BENZERSİZ (bir üye bir kez
--     sayılır); satır SİLİNMEZ (yazma yalnız RPC).
--   • `get_or_create_my_invite_code()` · `redeem_invite_code(p_code)` ·
--     `get_invite_leaderboard(p_limit)`.
--   • `invite_settings` + rozet eşikleri VERİDEN (M02/event_settings deseni —
--     koda gömülmez). ⚠️ Eşik SAYILARI ajan ihtiyatıdır (paket "3 davet"
--     satırını söyler, kademe sayılarını söylemez): 3/10/25 — ürün kararı
--     SQL update ile değişir. Rozet ETİKETLERİ istemcide eşiklerden türetilir
--     (DB'de uydurma metin tutulmaz).
--
-- ═══ LİDERLİK SIZINTI ÜÇLÜSÜ (AI korpus vakası — SQL'DE elenir) ═══
--   1. `is_directory_visible=false` roller (Süper Admin vb. — canlıda 5 üye
--      kaydı bu sınıfta, ölçüldü)
--   2. `is_placeholder` / `[PLACEHOLDER]` başlıklı katalog kayıtları (77 kayıt
--      ölçülmüştü, 22.09)
--   3. admin hesaplar (`is_admin` — B20 dersi: TS guard'a güvenme, SQL'de ele)
--   Ayrıca: katalog kaydı OLMAYAN davetçi listede görünmez (ad gösterecek
--   dizin-görünür kayıt yoksa satır da yok — yarım kimlik sızdırmaktansa hiç
--   gösterme).
--
-- ═══ ANONİM LİDERLİK (plan Faz 3 doğrulama notu) ═══
--   `get_invite_leaderboard` anon'a AÇIK ve gövdesinde auth kontrolü YOK —
--   ikisi M12'de AYRI AYRI doğrulanır (dizin araması vakası deseni). Dönen
--   veri zaten dizin-görünür ad + sayı (yeni PII yüzeyi yok).
--
-- ═══ SALT EKLEME ═══
-- Yeni tablo/fonksiyon/ayar; mevcut hiçbir şeye dokunmaz (referral_codes dahil).

begin;

-- ── 1) Tablolar ─────────────────────────────────────────────────────────────

create table if not exists public.user_invites (
  code text primary key,
  owner_user_id uuid not null unique default auth.uid() references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

comment on table public.user_invites is
  'Üye davet kodları (M11): üye başına TEK kod (owner unique). Alfabe SAFE_CHARS '
  '(referral-codes.ts aynası — sözleşme testi kilitler). referral_codes (admin '
  'pazarlama kodu) ile KARIŞTIRMA.';

create table if not exists public.user_invite_redemptions (
  id uuid primary key default gen_random_uuid(),
  code text not null references public.user_invites(code) on delete cascade,
  invited_user_id uuid not null unique references auth.users(id) on delete cascade,
  redeemed_at timestamptz not null default now()
);

comment on table public.user_invite_redemptions is
  'Davet kullanımları (M11): invited_user_id BENZERSİZ — bir üye bir kez sayılır. '
  'Yazma yalnız redeem_invite_code RPC''si; satır silinmez (kanıt).';

create index if not exists user_invite_redemptions_code_idx
  on public.user_invite_redemptions (code);

alter table public.user_invites enable row level security;
alter table public.user_invite_redemptions enable row level security;
revoke all on table public.user_invites from anon, authenticated;
revoke all on table public.user_invite_redemptions from anon, authenticated;

-- Kendi kodunu/kendi kullanımını okuma açık (UI durum gösterir); yazma YOK.
drop policy if exists user_invites_select_own on public.user_invites;
create policy user_invites_select_own on public.user_invites
  for select to authenticated
  using (owner_user_id = auth.uid() or public.is_admin(auth.uid()));

drop policy if exists invite_redemptions_select_own on public.user_invite_redemptions;
create policy invite_redemptions_select_own on public.user_invite_redemptions
  for select to authenticated
  using (invited_user_id = auth.uid() or public.is_admin(auth.uid()));

-- ── 2) Ayarlar (rozet eşikleri VERİDEN) ─────────────────────────────────────

create table if not exists public.invite_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now(),
  updated_by uuid
);

comment on table public.invite_settings is
  'Davet motoru eşikleri (M11, event_settings deseni). invites.badge_tiers ⚠️ '
  'AJAN İHTİYATI: 3/10/25 — paket "3 davet" satırını söyler, kademeleri '
  'söylemez; ürün kararı SQL update.';

alter table public.invite_settings enable row level security;
revoke all on table public.invite_settings from public, anon, authenticated;

insert into public.invite_settings (key, value)
values
  ('invites.badge_tiers', '[3, 10, 25]'::jsonb),
  ('invites.leaderboard_limit', '20'::jsonb)
on conflict (key) do nothing;

create or replace function public.invite_setting_json(p_key text, p_default jsonb)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select value from public.invite_settings where key = p_key), p_default);
$$;

revoke all on function public.invite_setting_json(text, jsonb) from public, anon, authenticated;

-- ── 3) Kod üretimi/bulma ────────────────────────────────────────────────────

create or replace function public.get_or_create_my_invite_code()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_existing text;
  v_code text;
  v_i integer;
  v_ch integer;
begin
  if v_uid is null then
    raise exception 'invite_auth_required';
  end if;

  select code into v_existing from public.user_invites where owner_user_id = v_uid;
  if v_existing is not null then
    return jsonb_build_object('code', v_existing, 'created', false);
  end if;

  -- Alfabe SAFE_CHARS birebir (referral-codes.ts — ayna testi kilitler):
  -- karıştırılabilir I/O/0/1 YOK.
  loop
    v_code := '';
    for v_i in 1..6 loop
      v_ch := 1 + floor(random() * 32)::integer;
      v_code := v_code || substr('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', v_ch, 1);
    end loop;
    exit when not exists (select 1 from public.user_invites where code = v_code);
  end loop;

  insert into public.user_invites (code, owner_user_id) values (v_code, v_uid)
  on conflict (owner_user_id) do nothing;

  select code into v_existing from public.user_invites where owner_user_id = v_uid;
  return jsonb_build_object('code', v_existing, 'created', true);
end;
$$;

comment on function public.get_or_create_my_invite_code() is
  'Üyenin davet kodu (M11): yoksa üretir (6 hane, SAFE_CHARS alfabesi), varsa '
  'aynı kodu döner — idempotent. Owner unique: ikinci kod üretilemez.';

revoke all on function public.get_or_create_my_invite_code() from public, anon;
grant execute on function public.get_or_create_my_invite_code() to authenticated;

-- ── 4) Kod kullanımı (kayıt akışı M13'te bağlanır) ──────────────────────────

create or replace function public.redeem_invite_code(p_code text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_code text := upper(btrim(coalesce(p_code, '')));
  v_owner uuid;
  v_rows integer;
begin
  if v_uid is null then
    raise exception 'invite_auth_required';
  end if;

  select owner_user_id into v_owner
  from public.user_invites
  where code = v_code;
  if not found then
    raise exception 'invite_code_not_found';
  end if;
  if v_owner = v_uid then
    raise exception 'invite_self_not_allowed';
  end if;

  insert into public.user_invite_redemptions (code, invited_user_id)
  values (v_code, v_uid)
  on conflict (invited_user_id) do nothing;
  get diagnostics v_rows = row_count;

  if v_rows > 0 then
    return jsonb_build_object('redeemed', true, 'already', false);
  end if;
  -- Kullanıcı daha önce başka bir kodu kullanmış — bir üye BİR kez sayılır.
  return jsonb_build_object('redeemed', true, 'already', true);
end;
$$;

comment on function public.redeem_invite_code(text) is
  'Davet kodu kullanımı (M11): invited_user_id BENZERSİZ — bir üye ikinci kez '
  'sayılmaz (already:true). Kendi kodunu kullanma reddedilir. Bilinmeyen kod '
  'invite_code_not_found (uydurma kod denemesi ayırt edilir).';

revoke all on function public.redeem_invite_code(text) from public, anon;
grant execute on function public.redeem_invite_code(text) to authenticated;

-- ── 5) Liderlik tablosu (anon açık — gövdede auth YOK, M12 doğrular) ────────

create or replace function public.get_invite_leaderboard(p_limit integer default null)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  with counts as (
    select i.owner_user_id, count(*) as invite_count
    from public.user_invites i
    join public.user_invite_redemptions r on r.code = i.code
    group by i.owner_user_id
    having count(*) > 0
  ),
  visible as (
    select
      c.owner_user_id,
      c.invite_count,
      ci.title as display_name,
      ci.slug
    from counts c
    join public.catalog_item_managers m
      on m.user_id = c.owner_user_id and m.status = 'active'
    join public.catalog_items ci
      on ci.id = m.item_id
     and ci.item_type = 'member'
     and ci.status = 'published'
     and ci.visibility = 'public'
     -- SIZINTI 2: placeholder kayıtlar (77 kayıt, 22.09 ölçümü)
     and ci.is_placeholder = false
     and ci.title not like '[PLACEHOLDER]%'
    join public.roles rl
      on rl.key = ci.platform_role_key
     -- SIZINTI 1: dizinde görünmeyen roller (Süper Admin vb.)
     and rl.is_directory_visible = true
    -- SIZINTI 3: admin hesaplar (B20 dersi — TS guard'a bırakma)
    where not coalesce(public.is_admin(c.owner_user_id), false)
  )
  select jsonb_build_object(
    'entries', coalesce((
      select jsonb_agg(jsonb_build_object(
               'display_name', v.display_name,
               'slug', v.slug,
               'invite_count', v.invite_count
             ) order by v.invite_count desc, v.display_name)
      from (select * from visible order by invite_count desc, display_name
            limit greatest(coalesce(
              p_limit,
              (public.invite_setting_json('invites.leaderboard_limit', '20'::jsonb) #>> '{}')::integer
            ), 1)) v
    ), '[]'::jsonb),
    'badge_tiers', public.invite_setting_json('invites.badge_tiers', '[3, 10, 25]'::jsonb)
  );
$$;

comment on function public.get_invite_leaderboard(integer) is
  'Davet liderliği (M11): dizin görünürlük kuralları SQL''de birebir — '
  'is_directory_visible=false rol, [PLACEHOLDER]/is_placeholder kayıt ve admin '
  'HESAP elenir (AI korpus sızıntı üçlüsü). Katalog kaydı olmayan davetçi '
  'listelenmez. Anon+açık, gövdede auth YOK (M12 doğrulama notu). Eşikler '
  'invite_settings''ten.';

revoke all on function public.get_invite_leaderboard(integer) from public;
grant execute on function public.get_invite_leaderboard(integer) to anon, authenticated;

commit;
