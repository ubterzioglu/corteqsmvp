-- G13 · Dijital Gruplar: sahiplik doğrulama (`group_claims`) + guard genişletme
--
-- ═══ KAPSAM ═══
-- Tasarım §3.B (sahiplik) + §3.C (sahibin kaldırma isteğinin sahiplik önkoşulu)
-- + plan G13. İki yol:
--   1. KOD YOLU: `CQ`+4 hane, `groups.claim_code_ttl_minutes` (10 dk) geçerli,
--      aynı grup için AKTİF TEK kod. Kullanıcı kodu platformdaki grup adının
--      sonuna ekler; `group-claim-verify` edge function adı SUNUCU TARAFINDA
--      okur (G08 kural 1: tarayıcıdan asla) ve sonucu SERVICE_ROLE ile
--      `group_claim_record_verification`'a yazar. `claim_attempt_limit` (3) /
--      `claim_attempt_window_minutes` (10) — deneme tükenince durum `rejected`,
--      ekran görüntüsü yolu açık kalır.
--   2. EKRAN GÖRÜNTÜSÜ YOLU (yedek): private kovaya yükleme → `claim_pending`
--      → moderatör kuyruğu → `admin_review_group_claim`.
-- Doğrulanınca: `ownership='verified'` + `owner_user_id` + platforma göre
-- `Community_WhatsAppAdmin/_TelegramAdmin/_DiscordAdmin` rolü.
--
-- ═══ ÖLÇÜLEN GERÇEKLER (02.10, canlı) ═══
--   • `user_role_assignments` PK = (user_id) → kullanıcı başına TEK rol.
--     Mevcut rol EZİLMEZ: atlanır ve `role_skipped_reason`'a yazılır (plan G13
--     "akış netleştirilir" maddesinin kararı). Aynı rol zaten varsa `role_assigned`.
--   • `Community_WhatsAppAdmin` / `_TelegramAdmin` / `_DiscordAdmin` rolleri MEVCUT.
--   • 🔴 `Users can update own landings` UPDATE politikası CANLI: kullanıcı kendi
--     satırına `ownership='verified'` YAZABİLİRDİ (kendini doğrulama!). G12 guard'ı
--     yalnız `listing_status` koruyordu → bu migration guard'ı `ownership`,
--     `owner_user_id` ve motor alanlarına genişletir.
--   • Uygulama kodunun doğrudan `.update()` çağrıları yalnız legacy/içerik
--     alanlarına (status · rejection_reason · tagline · group_name) — ölçüldü
--     (src/lib/whatsapp-landings.ts), genişletilmiş guard onları ENGELLEMEZ.
--
-- ═══ DEĞERLERİN KAYNAĞI ═══
-- CQ+4 hane · 10 dk · 3 deneme · 10 dk pencere · yedek yol ekran görüntüsü ·
-- verified gruba yeni talep → moderatöre, OTOMATİK DEVİR YOK: tasarım §3.B.
-- Eşikler G09 doktriniyle `group_settings`'ten okunur (kodda sabit yok).
-- ⚠️ `groups.claim_start_daily_limit` PAKETTE YOK — G09'daki `otp_rate_limits`
-- gibi AJAN İHTİYATI (günde 10 talep/kullanıcı); kullanıcı teyidi G05'le birlikte.
--
-- ═══ G08 KURALLARI ═══
-- Davet linki HİÇBİR yere yazılmaz (kural 8): `group_claims` ve `group_invite_reads`
-- link kolonu TAŞIMAZ; edge function linki DB'den okur, yanıtına koymaz.
-- Okunan ad "öneri"dir, kayıtlı adla tam eşitlik ARANMAZ (kural 3-4): kod araması
-- ad içinde `CQ####` desenine bakar, ad farkı ret sebebi değildir.
-- `invalid`/`unknown` deneme SAYMAZ (kural 5: tek başarısızlık durum değiştirmez).

begin;

-- ── 1) Sahiplik talepleri ───────────────────────────────────────────────────

create table if not exists public.group_claims (
  id uuid primary key default gen_random_uuid(),
  landing_id uuid not null references public.whatsapp_landings(id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  method text not null check (method in ('code', 'screenshot')),
  code text check (code is null or code ~ '^CQ[0-9]{4}$'),
  code_expires_at timestamptz,
  attempt_count integer not null default 0,
  last_attempt_at timestamptz,
  status text not null default 'pending'
    check (status in ('pending', 'verified', 'rejected', 'expired')),
  -- Grup talep anında zaten `verified` ise: moderatör kuyruğunda yarışan talep
  -- olarak işaretlenir (otomatik devir YOK, tasarım §3.B.6; sahip bildirimi G23).
  is_contested boolean not null default false,
  screenshot_path text,
  -- Edge function'ın davet sayfasından okuduğu ad (moderatöre yardım, G08 kural 4).
  -- ⚠️ Davet LİNKİ buraya asla yazılmaz (G08 kural 8).
  platform_name_read text,
  role_assigned boolean not null default false,
  role_skipped_reason text,
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  review_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.group_claims is
  'Grup sahipliği talepleri (G13, tasarım §3.B). Yazma yolu yalnız RPC''ler: '
  'group_claim_start_code · group_claim_submit_screenshot · '
  'group_claim_record_verification (service_role) · admin_review_group_claim. '
  'Davet linki bu tabloda SAKLANMAZ.';

-- Aynı grup için aktif TEK kod (tasarım §3.B.1)
create unique index if not exists group_claims_one_active_code_per_group
  on public.group_claims (landing_id)
  where status = 'pending' and method = 'code';

-- Aynı kullanıcı aynı gruba aynı anda TEK açık talep açabilir
create unique index if not exists group_claims_one_pending_per_user
  on public.group_claims (user_id, landing_id)
  where status = 'pending';

create index if not exists group_claims_moderator_queue_idx
  on public.group_claims (status, created_at)
  where status = 'pending';

drop trigger if exists trg_group_claims_updated_at on public.group_claims;
create trigger trg_group_claims_updated_at
  before update on public.group_claims
  for each row execute function public.update_updated_at_column();

alter table public.group_claims enable row level security;
revoke all on table public.group_claims from anon, authenticated;
grant select on table public.group_claims to authenticated;

drop policy if exists group_claims_select_own on public.group_claims;
create policy group_claims_select_own on public.group_claims
  for select to authenticated
  using (user_id = auth.uid() or public.is_admin(auth.uid()));

-- ── 2) Sunucu tarafı okuma denetimi (G08 kural 6/8: ölçüm + link YOK) ───────

create table if not exists public.group_invite_reads (
  id bigint generated always as identity primary key,
  landing_id uuid not null references public.whatsapp_landings(id) on delete cascade,
  platform text not null check (platform in ('whatsapp', 'telegram', 'discord')),
  result text not null check (result in ('ok', 'invalid', 'unknown')),
  name_read text,
  read_at timestamptz not null default now()
);

comment on table public.group_invite_reads is
  'Davet sayfası sunucu-tarafı okuma denetimi (G13). G22 boş-ad oranı izlemesi '
  've G18 önbellek temeli. ⚠️ Davet linki SAKLANMAZ (G08 kural 8) — yalnız '
  'landing_id, platform, sonuç ve okunan ad.';

create index if not exists group_invite_reads_landing_idx
  on public.group_invite_reads (landing_id, read_at desc);

alter table public.group_invite_reads enable row level security;
revoke all on table public.group_invite_reads from anon, authenticated;

-- ── 3) Günlük talep sınırı ayarı (⚠️ pakette sayı YOK — ajan ihtiyatı) ──────

insert into public.group_settings (key, value)
values ('groups.claim_start_daily_limit', '10'::jsonb)
on conflict (key) do nothing;

-- ── 4) Ekran görüntüsü kovası (private, career-applications deseni) ─────────

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
select
  'group-claim-screenshots',
  'group-claim-screenshots',
  false,
  10485760,
  array['image/png', 'image/jpeg', 'image/webp', 'application/pdf']
where not exists (select 1 from storage.buckets where id = 'group-claim-screenshots');

-- Yükleme: yalnız kendi klasörüne, yalnız screenshot-* deseni.
-- `application/octet-stream` bilerek YOK (career deseni: her şeyi kabul eden MIME).
drop policy if exists "group claim screenshots upload" on storage.objects;
create policy "group claim screenshots upload"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'group-claim-screenshots'
    and (storage.foldername(name))[1] = auth.uid()::text
    and name ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/screenshot-[A-Za-z0-9._-]{1,120}$'
  );

-- Okuma: kendi klasörü VEYA admin (moderatör incelemesi).
drop policy if exists "group claim screenshots read" on storage.objects;
create policy "group claim screenshots read"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'group-claim-screenshots'
    and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin(auth.uid()))
  );

-- Silme: yalnız admin (kanıt korunur).
drop policy if exists "group claim screenshots admin delete" on storage.objects;
create policy "group claim screenshots admin delete"
  on storage.objects for delete to authenticated
  using (bucket_id = 'group-claim-screenshots' and public.is_admin(auth.uid()));

-- ── 5) Kod yolu: talep başlat ───────────────────────────────────────────────

create or replace function public.group_claim_start_code(p_landing_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_ownership text;
  v_existing public.group_claims%rowtype;
  v_limit integer;
  v_created_24h integer;
  v_ttl integer;
  v_code text;
  v_id uuid;
  v_expires timestamptz;
begin
  if v_uid is null then
    raise exception 'group_claim_auth_required';
  end if;

  select ownership into v_ownership
  from public.whatsapp_landings
  where id = p_landing_id
  for update;
  if not found then
    raise exception 'group_not_found';
  end if;

  -- Verified grup kod yoluna KAPALI: otomatik devir YOK, yol ekran görüntüsü +
  -- moderatör (tasarım §3.B.6).
  if v_ownership = 'verified' then
    raise exception 'group_already_verified';
  end if;

  -- Kullanıcı başına günlük talep sınırı (eşik group_settings'ten)
  v_limit := public.group_setting_int('groups.claim_start_daily_limit', 10);
  select count(*) into v_created_24h
  from public.group_claims
  where user_id = v_uid and created_at > now() - interval '24 hours';
  if v_created_24h >= v_limit then
    raise exception 'group_claim_rate_limited';
  end if;

  -- Süresi dolan aktif kodu tembel düşür
  update public.group_claims
     set status = 'expired'
   where landing_id = p_landing_id and method = 'code' and status = 'pending'
     and code_expires_at < now();

  -- Idempotent: aynı kullanıcının aktif kodu varsa aynen dön
  select * into v_existing
  from public.group_claims
  where landing_id = p_landing_id and user_id = v_uid and status = 'pending'
  limit 1;
  if found then
    if v_existing.method = 'code' then
      return jsonb_build_object(
        'claim_id', v_existing.id, 'code', v_existing.code,
        'expires_at', v_existing.code_expires_at, 'reused', true);
    end if;
    raise exception 'group_claim_already_pending';
  end if;

  -- Aynı grup için aktif TEK kod: başkasının aktif kodu düşürülür
  update public.group_claims
     set status = 'expired',
         review_note = trim(coalesce(review_note || ' | ', '') || 'Yeni kod talebi eskisini düşürdü')
   where landing_id = p_landing_id and method = 'code' and status = 'pending';

  v_ttl := public.group_setting_int('groups.claim_code_ttl_minutes', 10);
  v_code := 'CQ' || lpad((floor(random() * 10000))::integer::text, 4, '0');
  v_expires := now() + (interval '1 minute' * v_ttl);

  insert into public.group_claims (landing_id, user_id, method, code, code_expires_at, status)
  values (p_landing_id, v_uid, 'code', v_code, v_expires, 'pending')
  returning id into v_id;

  return jsonb_build_object(
    'claim_id', v_id, 'code', v_code, 'expires_at', v_expires, 'reused', false);
end;
$$;

comment on function public.group_claim_start_code(uuid) is
  'Sahiplik kod talebi başlatır (G13, tasarım §3.B): CQ+4 hane, TTL '
  'groups.claim_code_ttl_minutes, grup başına aktif tek kod. Verified grupta '
  'group_already_verified — yol ekran görüntüsü + moderatör.';

revoke all on function public.group_claim_start_code(uuid) from public, anon;
grant execute on function public.group_claim_start_code(uuid) to authenticated;

-- ── 6) Ekran görüntüsü yolu: talep gönder ───────────────────────────────────

create or replace function public.group_claim_submit_screenshot(
  p_landing_id uuid,
  p_screenshot_path text,
  p_note text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_ownership text;
  v_limit integer;
  v_created_24h integer;
  v_contested boolean;
  v_id uuid;
begin
  if v_uid is null then
    raise exception 'group_claim_auth_required';
  end if;

  -- Kova anahtarı kullanıcının KENDİ klasöründe olmalı (storage politikasıyla aynı desen)
  if p_screenshot_path is null
     or split_part(p_screenshot_path, '/', 1) <> v_uid::text then
    raise exception 'group_claim_path_forbidden';
  end if;

  select ownership into v_ownership
  from public.whatsapp_landings
  where id = p_landing_id;
  if not found then
    raise exception 'group_not_found';
  end if;

  if exists (
    select 1 from public.group_claims
    where user_id = v_uid and landing_id = p_landing_id and status = 'pending'
  ) then
    raise exception 'group_claim_already_pending';
  end if;

  v_limit := public.group_setting_int('groups.claim_start_daily_limit', 10);
  select count(*) into v_created_24h
  from public.group_claims
  where user_id = v_uid and created_at > now() - interval '24 hours';
  if v_created_24h >= v_limit then
    raise exception 'group_claim_rate_limited';
  end if;

  v_contested := (v_ownership = 'verified');

  insert into public.group_claims
    (landing_id, user_id, method, status, screenshot_path, review_note, is_contested)
  values
    (p_landing_id, v_uid, 'screenshot', 'pending', p_screenshot_path, p_note, v_contested)
  returning id into v_id;

  return v_id;
end;
$$;

comment on function public.group_claim_submit_screenshot(uuid, text, text) is
  'Ekran görüntüsüyle sahiplik talebi (G13 yedek yol): moderatör kuyruğuna düşer. '
  'Grup zaten verified ise is_contested=true — otomatik devir YOK. Sahip '
  'bilgilendirme G23''te.';

revoke all on function public.group_claim_submit_screenshot(uuid, text, text) from public, anon;
grant execute on function public.group_claim_submit_screenshot(uuid, text, text) to authenticated;

-- ── 7) Doğrulama sonucu kaydı — YALNIZ SERVICE_ROLE ─────────────────────────

create or replace function public.group_claim_record_verification(
  p_claim_id uuid,
  p_code_found boolean,
  p_name_read text default null,
  p_read_result text default 'ok'
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_claim public.group_claims%rowtype;
  v_platform text;
  v_attempt_limit integer;
  v_window_minutes integer;
  v_attempts integer;
begin
  if p_read_result not in ('ok', 'invalid', 'unknown') then
    raise exception 'group_claim_invalid_read_result';
  end if;

  select * into v_claim
  from public.group_claims
  where id = p_claim_id
  for update;
  if not found then
    raise exception 'group_claim_not_found';
  end if;
  if v_claim.method <> 'code' or v_claim.status <> 'pending' then
    raise exception 'group_claim_not_verifiable';
  end if;

  select platform into v_platform
  from public.whatsapp_landings
  where id = v_claim.landing_id;

  -- Denetim izi: okunan ad + sonuç. Davet linki YAZILMAZ (G08 kural 8).
  insert into public.group_invite_reads (landing_id, platform, result, name_read)
  values (v_claim.landing_id, v_platform, p_read_result, p_name_read);

  if p_name_read is not null and v_claim.platform_name_read is distinct from p_name_read then
    update public.group_claims
       set platform_name_read = p_name_read
     where id = p_claim_id;
  end if;

  if v_claim.code_expires_at < now() then
    update public.group_claims set status = 'expired' where id = p_claim_id;
    return jsonb_build_object('result', 'expired');
  end if;

  -- Link ölü ya da okunamadı: deneme SAYILMAZ (G08 kural 5)
  if p_read_result = 'invalid' then
    return jsonb_build_object('result', 'invalid_link');
  end if;
  if p_read_result = 'unknown' then
    return jsonb_build_object('result', 'unknown');
  end if;

  if p_code_found then
    perform public.group_claim_apply_verified(p_claim_id);
    return jsonb_build_object('result', 'verified');
  end if;

  -- Yanlış kod: pencere içinde deneme sayacı
  v_attempt_limit := public.group_setting_int('groups.claim_attempt_limit', 3);
  v_window_minutes := public.group_setting_int('groups.claim_attempt_window_minutes', 10);

  if v_claim.last_attempt_at is null
     or v_claim.last_attempt_at < now() - (interval '1 minute' * v_window_minutes) then
    v_attempts := 1;
  else
    v_attempts := v_claim.attempt_count + 1;
  end if;

  if v_attempts >= v_attempt_limit then
    update public.group_claims
       set attempt_count = v_attempts,
           last_attempt_at = now(),
           status = 'rejected',
           review_note = trim(coalesce(review_note || ' | ', '')
             || 'Kod denemeleri tükendi (' || v_attempts || '/' || v_attempt_limit
             || ') — ekran görüntüsü yolu açık.')
     where id = p_claim_id;
    return jsonb_build_object('result', 'not_found', 'attempts_left', 0, 'exhausted', true);
  end if;

  update public.group_claims
     set attempt_count = v_attempts, last_attempt_at = now()
   where id = p_claim_id;
  return jsonb_build_object('result', 'not_found', 'attempts_left', v_attempt_limit - v_attempts, 'exhausted', false);
end;
$$;

comment on function public.group_claim_record_verification(uuid, boolean, text, text) is
  'Edge function''ın (group-claim-verify) doğrulama sonucunu işler. YALNIZ '
  'service_role çağırabilir — authenticated''a AÇILMAZ, yoksa kullanıcı '
  'code_found=true''yu kendi yazardı. invalid/unknown deneme saymaz (G08 kural 5).';

revoke all on function public.group_claim_record_verification(uuid, boolean, text, text)
  from public, anon, authenticated;
grant execute on function public.group_claim_record_verification(uuid, boolean, text, text)
  to service_role;

-- ── 8) İç yardımcı: doğrulanmış talebi uygula ───────────────────────────────

create or replace function public.group_claim_apply_verified(p_claim_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_claim public.group_claims%rowtype;
  v_platform text;
  v_role_key text;
  v_role_id uuid;
  v_existing_role_id uuid;
  v_existing_role_key text;
  v_has_role boolean;
begin
  select * into v_claim
  from public.group_claims
  where id = p_claim_id
  for update;
  if not found or v_claim.status <> 'pending' then
    raise exception 'group_claim_not_verifiable';
  end if;

  select platform into v_platform
  from public.whatsapp_landings
  where id = v_claim.landing_id;

  update public.group_claims
     set status = 'verified', reviewed_at = coalesce(reviewed_at, now())
   where id = p_claim_id;

  -- Sahiplik: G12/G13 guard bayrağıyla (ownership doğrudan yazıma kapalı)
  perform set_config('group_status.via_rpc', 'on', true);
  update public.whatsapp_landings
     set ownership = 'verified',
         owner_user_id = v_claim.user_id
   where id = v_claim.landing_id;
  perform set_config('group_status.via_rpc', '', true);

  -- Rol ataması: platforma göre Community_*Admin (tasarım §3.B.4).
  -- ⚠️ user_role_assignments PK = (user_id): TEK rol. Mevcut rol EZİLMEZ.
  v_role_key := case v_platform
    when 'telegram' then 'Community_TelegramAdmin'
    when 'discord' then 'Community_DiscordAdmin'
    else 'Community_WhatsAppAdmin'
  end;

  select id into v_role_id
  from public.roles
  where key = v_role_key and deleted_at is null;

  select ura.role_id, r.key into v_existing_role_id, v_existing_role_key
  from public.user_role_assignments ura
  join public.roles r on r.id = ura.role_id
  where ura.user_id = v_claim.user_id;
  v_has_role := found;

  if v_has_role and v_existing_role_id = v_role_id then
    update public.group_claims set role_assigned = true where id = p_claim_id;
  elsif v_has_role then
    update public.group_claims
       set role_assigned = false,
           role_skipped_reason = 'Kullanıcının rolü var: ' || v_existing_role_key
             || ' (PK tek rol; ezilmedi)'
     where id = p_claim_id;
  elsif v_role_id is not null then
    insert into public.user_role_assignments (user_id, role_id)
    values (v_claim.user_id, v_role_id);
    update public.group_claims set role_assigned = true where id = p_claim_id;
  else
    update public.group_claims
       set role_assigned = false,
           role_skipped_reason = 'Rol bulunamadı: ' || v_role_key
     where id = p_claim_id;
  end if;
end;
$$;

comment on function public.group_claim_apply_verified(uuid) is
  'İÇ yardımcı: talebi verified yapar, ownership+owner_user_id yazar (guard '
  'bayrağıyla), platform rolünü atar (mevcut rolü EZMEZ). Doğrudan çağrılamaz: '
  'tüm rollerden revoke''li, yalnız security-definer sahiplerinden çalışır.';

revoke all on function public.group_claim_apply_verified(uuid)
  from public, anon, authenticated, service_role;

-- ── 9) Moderatör kararı ─────────────────────────────────────────────────────

create or replace function public.admin_review_group_claim(
  p_claim_id uuid,
  p_decision text,
  p_note text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_claim public.group_claims%rowtype;
begin
  if not public.is_admin(v_uid) then
    raise exception 'group_claim_forbidden';
  end if;
  if p_decision is null or p_decision not in ('approve', 'reject') then
    raise exception 'group_claim_invalid_decision';
  end if;

  select * into v_claim
  from public.group_claims
  where id = p_claim_id
  for update;
  if not found then
    raise exception 'group_claim_not_found';
  end if;
  if v_claim.status <> 'pending' then
    raise exception 'group_claim_not_reviewable';
  end if;

  if p_decision = 'reject' then
    update public.group_claims
       set status = 'rejected',
           reviewed_by = v_uid,
           reviewed_at = now(),
           review_note = trim(coalesce(review_note || ' | ', '') || coalesce(p_note, ''))
     where id = p_claim_id;
    return jsonb_build_object('result', 'rejected');
  end if;

  update public.group_claims
     set reviewed_by = v_uid,
         review_note = trim(coalesce(review_note || ' | ', '') || coalesce(p_note, ''))
   where id = p_claim_id;

  perform public.group_claim_apply_verified(p_claim_id);
  return jsonb_build_object('result', 'verified');
end;
$$;

comment on function public.admin_review_group_claim(uuid, text, text) is
  'Moderatör kararı (G13): approve → group_claim_apply_verified (ekran görüntüsü '
  'yolu ve yarışan talepler); reject → status=rejected. Ekran G24''te.';

revoke all on function public.admin_review_group_claim(uuid, text, text) from public, anon;
grant execute on function public.admin_review_group_claim(uuid, text, text) to authenticated;

-- ── 10) Guard v2: ownership + motor alanları da korunur ─────────────────────
--
-- 🔴 Ölçüldü (02.10): `Users can update own landings` politikası canlı — kendi
-- grubuna `ownership='verified'` yazabilirdi. G12 guard'ı yalnız listing_status
-- koruyordu. Fonksiyon ADI bilerek korunuyor (trigger yerinde kalır; drop/create
-- yerine atomik create-or-replace), kapsam yorumla belgeleniyor.

create or replace function public.whatsapp_landings_guard_listing_status()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  -- RPC yolu: transaction-local bayrak açıksa izin ver (set_group_status_v1,
  -- group_claim_apply_verified ve migration betikleri açar)
  if coalesce(current_setting('group_status.via_rpc', true), '') = 'on' then
    return new;
  end if;

  -- Eski paket legacy `status`'ü ve içerik alanlarını (tagline, group_name…)
  -- günceller; bunlar SERBEST. Yalnız korunan alanlar değişiyorsa engelle.
  if new.listing_status is distinct from old.listing_status then
    raise exception 'group_status_direct_update_forbidden';
  end if;

  -- G13: sahiplik yalnız sahiplik akışıyla yazılır (kendini doğrulama kapatıldı)
  if new.ownership is distinct from old.ownership
     or new.owner_user_id is distinct from old.owner_user_id then
    raise exception 'group_ownership_direct_update_forbidden';
  end if;

  -- G13: motorun sahip olduğu sayaçlar/yaşam döngüsü alanları (G15/G22 bunları
  -- zamanlanmış görevlerle yazar; kullanıcı karışamaz)
  if new.hidden_reason is distinct from old.hidden_reason
     or new.submitted_as_admin is distinct from old.submitted_as_admin
     or new.review_flags is distinct from old.review_flags
     or new.strike_count is distinct from old.strike_count
     or new.published_at is distinct from old.published_at
     or new.suspended_until is distinct from old.suspended_until
     or new.owner_renewal_due is distinct from old.owner_renewal_due
     or new.link_fail_count is distinct from old.link_fail_count
     or new.link_checked_at is distinct from old.link_checked_at
     or new.invite_code is distinct from old.invite_code
     or new.platform is distinct from old.platform then
    raise exception 'group_engine_field_direct_update_forbidden';
  end if;

  return new;
end;
$$;

comment on function public.whatsapp_landings_guard_listing_status() is
  'whatsapp_landings motor alanlarını doğrudan update''e karşı korur. Kapsam: '
  'listing_status (G12) + ownership/owner_user_id + motor sayaçları (G13). Ad '
  'tarihsel (G12); trigger trg_guard_listing_status yerinde. İçerik/legacy '
  'alanları (status, tagline, group_name, description…) SERBESTTİR.';

commit;
