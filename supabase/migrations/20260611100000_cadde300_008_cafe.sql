-- Cadde 3.0 Faz 4 (1/1): Cafe modülü — şema genişletme + entry policy RPC'leri.
-- Spec §9.4 (şema), §7.3 (giriş kuralları), §13 (modül davranışı).
--
-- * cadde_cafes: slug/theme/entry_mode(open|approval|referral)/referral_code_hash/
--   entry_question/capacity/external_links/archived_at (+ diaspora_key, Faz 8 öncesi default 'tr').
-- * cadde_cafe_members: status(pending|approved|rejected)/answer/joined_at/approved_at/by.
-- * cadde_posts: cafe_id + visibility(public|cafe) — cafe feed'i Faz 4'te açılır.
-- * Kullanıcı cafe oluşturma/katılma yalnız security-definer RPC ile (direct insert policy'leri
--   kaldırılır); admin paneli için admin INSERT policy eklenir (post'lardaki Faz 2 bug fix'inin aynısı:
--   eski self-insert policy admin'in demo cafe eklemesini RLS'e takıyordu).
-- * D-06: günlük limitler ürün kararına kadar cadde_settings'ten okunur (değiştirilebilir).
-- * Telefon koşulları (§7.3) cadde_phone_required() flag'ine bağlıdır — D-03 stub'da flag false
--   olduğundan telefon şartları devre dışı kalır; flag açılınca otomatik devreye girer.
-- * Davet kodu plain saklanmaz: sha256 hash (extensions.digest; search_path'e extensions eklenir).
-- RPC hata kodları frontend'de cadde-rules.ts haritasıyla Türkçe mesaja çevrilir.

begin;

-- ── 1. cadde_cafes genişletme ────────────────────────────────────────────────
alter table public.cadde_cafes
  add column if not exists diaspora_key text not null default 'tr',
  add column if not exists slug text,
  add column if not exists theme_key text,
  add column if not exists entry_mode text not null default 'open',
  add column if not exists referral_code_hash text,
  add column if not exists entry_question text,
  add column if not exists capacity integer,
  add column if not exists external_links jsonb not null default '[]'::jsonb,
  add column if not exists archived_at timestamptz;

do $$ begin
  alter table public.cadde_cafes
    add constraint cadde_cafes_entry_mode_check check (entry_mode in ('open', 'approval', 'referral'));
exception when duplicate_object then null; end $$;

do $$ begin
  alter table public.cadde_cafes
    add constraint cadde_cafes_time_check check (ends_at > starts_at);
exception when duplicate_object then null; end $$;

do $$ begin
  alter table public.cadde_cafes
    add constraint cadde_cafes_capacity_check check (capacity is null or capacity > 0);
exception when duplicate_object then null; end $$;

create unique index if not exists cadde_cafes_slug_uidx
  on public.cadde_cafes (slug) where slug is not null;

-- ── 2. cadde_cafe_members genişletme ─────────────────────────────────────────
alter table public.cadde_cafe_members
  add column if not exists status text not null default 'approved',
  add column if not exists answer text,
  add column if not exists joined_at timestamptz not null default now(),
  add column if not exists approved_at timestamptz,
  add column if not exists approved_by uuid references auth.users(id);

do $$ begin
  alter table public.cadde_cafe_members
    add constraint cadde_cafe_members_status_check check (status in ('pending', 'approved', 'rejected'));
exception when duplicate_object then null; end $$;

update public.cadde_cafe_members
set joined_at = created_at
where joined_at is distinct from created_at;

update public.cadde_cafe_members
set approved_at = created_at
where status = 'approved' and approved_at is null;

create index if not exists cadde_cafe_members_status_idx
  on public.cadde_cafe_members (cafe_id, status);

-- ── 3. cadde_posts cafe alanları ─────────────────────────────────────────────
alter table public.cadde_posts
  add column if not exists cafe_id uuid references public.cadde_cafes(id) on delete cascade,
  add column if not exists visibility text not null default 'public';

do $$ begin
  alter table public.cadde_posts
    add constraint cadde_posts_visibility_check check (visibility in ('public', 'cafe'));
exception when duplicate_object then null; end $$;

create index if not exists cadde_posts_cafe_idx
  on public.cadde_posts (cafe_id, created_at desc) where cafe_id is not null;

-- Ana feed cafe-içi postları göstermesin (list_cadde_feed_v1 ayrıca visibility filtreler).
-- Mevcut postlar visibility='public' default'uyla doğru kalır.

-- ── 4. D-06 limit ayarları (ürün kararıyla güncellenebilir) ──────────────────
insert into public.cadde_settings (key, value) values
  ('cadde.cafe.daily_join_limit', '10'::jsonb),
  ('cadde.cafe.daily_create_limit', '3'::jsonb),
  ('cadde.cafe.max_duration_hours', '6'::jsonb)
on conflict (key) do nothing;

create or replace function public.cadde_setting_int(p_key text, p_default integer)
returns integer
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select (value #>> '{}')::integer from public.cadde_settings where key = p_key),
    p_default
  );
$$;

-- ── 5. Giriş policy helper'ı (§7.3 truth table) ──────────────────────────────
-- Dönüş: null = katılabilir; aksi halde RPC hata kodu.
-- TS aynası: src/lib/cadde-rules.ts canJoinCafeRule — birini değiştiren diğerini günceller.
create or replace function public.can_join_cadde_cafe(uid uuid, p_cafe_id uuid)
returns text
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_cafe public.cadde_cafes%rowtype;
  v_is_tr_cafe boolean;
  v_phone_ok boolean;
  v_tr_phone_ok boolean;
  v_approved_count integer;
begin
  if uid is null then return 'cadde_auth_required'; end if;

  select * into v_cafe from public.cadde_cafes where id = p_cafe_id;
  if v_cafe.id is null or v_cafe.status <> 'published' or v_cafe.content_mode <> 'real' then
    return 'cadde_cafe_not_found';
  end if;

  if v_cafe.archived_at is not null or not v_cafe.is_active then
    return 'cadde_cafe_archived';
  end if;

  if now() >= v_cafe.ends_at then
    return 'cadde_cafe_ended';
  end if;

  if public.is_admin(uid) or public.is_moderator(uid) then
    return null; -- kapasite dahil override
  end if;

  if v_cafe.capacity is not null then
    select count(*) into v_approved_count
    from public.cadde_cafe_members
    where cafe_id = v_cafe.id and status = 'approved';
    if v_approved_count >= v_cafe.capacity then
      return 'cadde_cafe_full';
    end if;
  end if;

  -- Telefon şartları yalnız flag açıkken uygulanır (D-03 stub: kapalı).
  if public.cadde_phone_required() then
    v_phone_ok := public.is_phone_verified(uid);
    if not v_phone_ok then
      return 'phone_verification_required';
    end if;
  end if;

  v_is_tr_cafe := not v_cafe.is_bridge and v_cafe.country_id in (
    select id from public.cadde_countries where code = 'TR'
  );

  if v_is_tr_cafe then
    if not public.is_tr_resident(uid) then
      return 'cadde_cafe_tr_only';
    end if;
    if public.cadde_phone_required() then
      select (uv.phone_country_code = 'TR' or uv.phone_e164 like '+90%') into v_tr_phone_ok
      from public.user_verifications uv where uv.user_id = uid;
      if not coalesce(v_tr_phone_ok, false) then
        return 'cadde_cafe_tr_only';
      end if;
    end if;
  end if;

  return null;
end;
$$;

-- ── 6. create_cadde_cafe_v1 ──────────────────────────────────────────────────
create or replace function public.create_cadde_cafe_v1(
  p_title text,
  p_summary text,
  p_theme_key text,
  p_country text,
  p_city text,
  p_is_bridge boolean,
  p_entry_mode text,
  p_referral_code text default null,
  p_entry_question text default null,
  p_starts_at timestamptz default null,
  p_ends_at timestamptz default null,
  p_capacity integer default null,
  p_external_links jsonb default '[]'::jsonb
)
returns uuid
language plpgsql
volatile
security definer
set search_path = public, extensions
as $$
declare
  v_uid uuid := auth.uid();
  v_title text := trim(coalesce(p_title, ''));
  v_summary text := trim(coalesce(p_summary, ''));
  v_theme text := nullif(trim(coalesce(p_theme_key, '')), '');
  v_referral text := nullif(trim(coalesce(p_referral_code, '')), '');
  v_question text := nullif(trim(coalesce(p_entry_question, '')), '');
  v_starts timestamptz := coalesce(p_starts_at, now());
  v_ends timestamptz;
  v_max_hours integer := public.cadde_setting_int('cadde.cafe.max_duration_hours', 6);
  v_country_id uuid;
  v_city_id uuid;
  v_cafe_id uuid;
  v_slug text;
  v_today_count integer;
begin
  if v_uid is null then
    raise exception 'cadde_auth_required';
  end if;

  if not public.is_cadde_profile_complete(v_uid) then
    if public.cadde_phone_required() and not public.is_phone_verified(v_uid) then
      raise exception 'phone_verification_required';
    end if;
    raise exception 'cadde_profile_incomplete';
  end if;

  if not public.has_cadde_feature(v_uid, 'cadde.cafe.create') then
    raise exception 'cadde_cafe_permission_denied';
  end if;

  if length(v_title) < 3 or length(v_title) > 80 then
    raise exception 'cadde_invalid_cafe_title';
  end if;

  if length(v_summary) < 1 or length(v_summary) > 500 then
    raise exception 'cadde_invalid_cafe_summary';
  end if;

  if p_entry_mode not in ('open', 'approval', 'referral') then
    raise exception 'cadde_invalid_entry_mode';
  end if;

  if p_entry_mode = 'referral' and (v_referral is null or length(v_referral) < 4) then
    raise exception 'cadde_cafe_referral_code_required';
  end if;

  if p_entry_mode = 'approval' and v_question is null then
    raise exception 'cadde_cafe_question_required';
  end if;

  v_ends := coalesce(p_ends_at, v_starts + interval '2 hours');
  if v_ends <= v_starts then
    raise exception 'cadde_invalid_cafe_time';
  end if;
  if v_ends > v_starts + make_interval(hours => v_max_hours) then
    raise exception 'cadde_cafe_duration_exceeded';
  end if;

  if p_capacity is not null and p_capacity < 1 then
    raise exception 'cadde_invalid_cafe_capacity';
  end if;

  -- D-06: günlük cafe açma limiti (admin/mod muaf).
  if not (public.is_admin(v_uid) or public.is_moderator(v_uid)) then
    select count(*) into v_today_count
    from public.cadde_cafes
    where host_user_id = v_uid and created_at > now() - interval '24 hours';
    if v_today_count >= public.cadde_setting_int('cadde.cafe.daily_create_limit', 3) then
      raise exception 'cadde_rate_limit';
    end if;
  end if;

  select c.id into v_country_id
  from public.cadde_countries c
  where c.name = nullif(trim(coalesce(p_country, '')), '') and c.is_active = true
  limit 1;

  select ci.id into v_city_id
  from public.cadde_cities ci
  where ci.name = nullif(trim(coalesce(p_city, '')), '')
    and (v_country_id is null or ci.country_id = v_country_id)
    and ci.is_active = true
  limit 1;

  v_slug := trim(both '-' from regexp_replace(lower(v_title), '[^a-z0-9]+', '-', 'g'));
  v_slug := nullif(v_slug, '') || '-' || substr(md5(gen_random_uuid()::text), 1, 6);

  insert into public.cadde_cafes (
    host_user_id, title, summary, country_id, city_id,
    content_mode, status, is_bridge, is_free,
    starts_at, ends_at, is_active,
    slug, theme_key, entry_mode, referral_code_hash, entry_question,
    capacity, external_links
  )
  values (
    v_uid, v_title, v_summary, v_country_id, v_city_id,
    'real', 'published', coalesce(p_is_bridge, false), true,
    v_starts, v_ends, true,
    v_slug, v_theme, p_entry_mode,
    case when v_referral is not null then encode(digest(upper(v_referral), 'sha256'), 'hex') end,
    v_question, p_capacity, coalesce(p_external_links, '[]'::jsonb)
  )
  returning id into v_cafe_id;

  -- Cafe sahibi otomatik approved üye olur (spec §13.3).
  insert into public.cadde_cafe_members (cafe_id, user_id, status, approved_at, approved_by)
  values (v_cafe_id, v_uid, 'approved', now(), v_uid)
  on conflict (cafe_id, user_id) do nothing;

  return v_cafe_id;
end;
$$;

-- ── 7. join_cadde_cafe_v1 ────────────────────────────────────────────────────
create or replace function public.join_cadde_cafe_v1(
  p_cafe_id uuid,
  p_referral_code text default null,
  p_answer text default null
)
returns jsonb
language plpgsql
volatile
security definer
set search_path = public, extensions
as $$
declare
  v_uid uuid := auth.uid();
  v_cafe public.cadde_cafes%rowtype;
  v_policy_error text;
  v_existing public.cadde_cafe_members%rowtype;
  v_answer text := nullif(trim(coalesce(p_answer, '')), '');
  v_referral text := nullif(trim(coalesce(p_referral_code, '')), '');
  v_today_joins integer;
  v_member_id uuid;
  v_status text;
begin
  if v_uid is null then
    raise exception 'cadde_auth_required';
  end if;

  if not public.is_cadde_profile_complete(v_uid) then
    if public.cadde_phone_required() and not public.is_phone_verified(v_uid) then
      raise exception 'phone_verification_required';
    end if;
    raise exception 'cadde_profile_incomplete';
  end if;

  if not public.has_cadde_feature(v_uid, 'cadde.cafe.join') then
    raise exception 'cadde_cafe_join_permission_denied';
  end if;

  select * into v_existing
  from public.cadde_cafe_members
  where cafe_id = p_cafe_id and user_id = v_uid;

  if v_existing.id is not null then
    if v_existing.status = 'rejected' then
      raise exception 'cadde_cafe_join_denied';
    end if;
    -- approved/pending: idempotent
    return jsonb_build_object('memberId', v_existing.id, 'status', v_existing.status);
  end if;

  v_policy_error := public.can_join_cadde_cafe(v_uid, p_cafe_id);
  if v_policy_error is not null then
    raise exception '%', v_policy_error;
  end if;

  -- D-06: günlük katılım limiti (admin/mod muaf).
  if not (public.is_admin(v_uid) or public.is_moderator(v_uid)) then
    select count(*) into v_today_joins
    from public.cadde_cafe_members
    where user_id = v_uid and joined_at > now() - interval '24 hours';
    if v_today_joins >= public.cadde_setting_int('cadde.cafe.daily_join_limit', 10) then
      raise exception 'cadde_rate_limit';
    end if;
  end if;

  select * into v_cafe from public.cadde_cafes where id = p_cafe_id;

  if v_cafe.entry_mode = 'referral' then
    if v_referral is null
       or v_cafe.referral_code_hash is distinct from encode(digest(upper(v_referral), 'sha256'), 'hex') then
      raise exception 'cadde_cafe_invalid_referral';
    end if;
    v_status := 'approved';
  elsif v_cafe.entry_mode = 'approval' then
    if v_answer is null then
      raise exception 'cadde_cafe_answer_required';
    end if;
    v_status := 'pending';
  else
    v_status := 'approved';
  end if;

  insert into public.cadde_cafe_members (cafe_id, user_id, status, answer, approved_at, approved_by)
  values (
    p_cafe_id, v_uid, v_status, v_answer,
    case when v_status = 'approved' then now() end,
    case when v_status = 'approved' then v_uid end
  )
  returning id into v_member_id;

  return jsonb_build_object('memberId', v_member_id, 'status', v_status);
end;
$$;

-- ── 8. approve_cadde_cafe_member_v1 ──────────────────────────────────────────
create or replace function public.approve_cadde_cafe_member_v1(
  p_member_id uuid,
  p_approve boolean
)
returns void
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_member public.cadde_cafe_members%rowtype;
  v_cafe public.cadde_cafes%rowtype;
  v_approved_count integer;
begin
  if v_uid is null then
    raise exception 'cadde_auth_required';
  end if;

  select * into v_member from public.cadde_cafe_members where id = p_member_id;
  if v_member.id is null then
    raise exception 'cadde_cafe_member_not_found';
  end if;

  select * into v_cafe from public.cadde_cafes where id = v_member.cafe_id;

  if v_cafe.host_user_id is distinct from v_uid
     and not (public.is_admin(v_uid) or public.is_moderator(v_uid)) then
    raise exception 'cadde_cafe_owner_required';
  end if;

  if v_member.status <> 'pending' then
    raise exception 'cadde_cafe_not_pending';
  end if;

  if p_approve and v_cafe.capacity is not null then
    select count(*) into v_approved_count
    from public.cadde_cafe_members
    where cafe_id = v_cafe.id and status = 'approved';
    if v_approved_count >= v_cafe.capacity then
      raise exception 'cadde_cafe_full';
    end if;
  end if;

  update public.cadde_cafe_members
  set status = case when p_approve then 'approved' else 'rejected' end,
      approved_at = case when p_approve then now() end,
      approved_by = v_uid
  where id = p_member_id;
end;
$$;

-- ── 9. archive_cadde_cafe_v1 ─────────────────────────────────────────────────
create or replace function public.archive_cadde_cafe_v1(p_cafe_id uuid)
returns void
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_cafe public.cadde_cafes%rowtype;
begin
  if v_uid is null then
    raise exception 'cadde_auth_required';
  end if;

  select * into v_cafe from public.cadde_cafes where id = p_cafe_id;
  if v_cafe.id is null then
    raise exception 'cadde_cafe_not_found';
  end if;

  if v_cafe.host_user_id is distinct from v_uid
     and not (public.is_admin(v_uid) or public.is_moderator(v_uid)) then
    raise exception 'cadde_cafe_owner_required';
  end if;

  update public.cadde_cafes
  set archived_at = coalesce(archived_at, now()), is_active = false
  where id = p_cafe_id;
end;
$$;

-- ── 10. create_cadde_post_v1: cafe post desteği (p_cafe_id) ──────────────────
-- Eski 8 parametreli imza kaldırılır; yeni parametre default'lu olduğundan
-- mevcut çağrılar çalışmaya devam eder.
drop function if exists public.create_cadde_post_v1(text, text, text, text, text, boolean, text, text[]);

create or replace function public.create_cadde_post_v1(
  p_post_type text,
  p_title text,
  p_body text,
  p_country text,
  p_city text,
  p_is_bridge boolean,
  p_need_category text default null,
  p_interests text[] default null,
  p_cafe_id uuid default null
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
  v_title text := nullif(trim(coalesce(p_title, '')), '');
  v_need text := nullif(trim(coalesce(p_need_category, '')), '');
  v_interests text[] := coalesce(p_interests, '{}');
  v_country_id uuid;
  v_city_id uuid;
  v_is_privileged boolean;
  v_post_id uuid;
  v_valid_count int;
  v_cafe public.cadde_cafes%rowtype;
  v_is_cafe_member boolean;
begin
  if v_uid is null then
    raise exception 'cadde_auth_required';
  end if;

  if not public.is_cadde_profile_complete(v_uid) then
    if public.cadde_phone_required() and not public.is_phone_verified(v_uid) then
      raise exception 'phone_verification_required';
    end if;
    raise exception 'cadde_profile_incomplete';
  end if;

  if not public.has_cadde_feature(v_uid, 'cadde.post.create') then
    raise exception 'cadde_post_permission_denied';
  end if;

  if p_post_type not in ('text', 'question', 'offer', 'event') then
    raise exception 'cadde_invalid_post_type';
  end if;

  if length(v_body) < 1 or length(v_body) > 4000 then
    raise exception 'cadde_invalid_body';
  end if;

  if v_title is not null and length(v_title) > 160 then
    raise exception 'cadde_invalid_title';
  end if;

  -- Etiketler: en fazla 3, hepsi aktif katalog anahtarı olmalı (spec §12.2 P0).
  v_interests := (select coalesce(array_agg(distinct k), '{}') from unnest(v_interests) k where trim(k) <> '');
  if cardinality(v_interests) > 3 then
    raise exception 'cadde_invalid_interests';
  end if;
  if cardinality(v_interests) > 0 then
    select count(*) into v_valid_count
    from public.cadde_interest_catalog c
    where c.key = any(v_interests) and c.is_active = true;
    if v_valid_count <> cardinality(v_interests) then
      raise exception 'cadde_invalid_interests';
    end if;
  end if;

  if v_need is not null and not exists (
    select 1 from public.cadde_interest_catalog c where c.key = v_need and c.is_active = true
  ) then
    raise exception 'cadde_invalid_need_category';
  end if;

  v_is_privileged := public.is_admin(v_uid) or public.is_moderator(v_uid);

  -- Cafe postu: oda canlı olmalı + yazar approved üye/host/admin; geo cafe'den miras alınır.
  if p_cafe_id is not null then
    select * into v_cafe from public.cadde_cafes where id = p_cafe_id;
    if v_cafe.id is null or v_cafe.status <> 'published' or v_cafe.content_mode <> 'real' then
      raise exception 'cadde_cafe_not_found';
    end if;
    if v_cafe.archived_at is not null or not v_cafe.is_active then
      raise exception 'cadde_cafe_archived';
    end if;
    if now() >= v_cafe.ends_at then
      raise exception 'cadde_cafe_ended';
    end if;

    v_is_cafe_member := exists (
      select 1 from public.cadde_cafe_members
      where cafe_id = p_cafe_id and user_id = v_uid and status = 'approved'
    );
    if not (v_is_cafe_member or v_cafe.host_user_id = v_uid or v_is_privileged) then
      raise exception 'cadde_cafe_membership_required';
    end if;

    insert into public.cadde_posts (
      author_user_id, content_mode, status, post_type,
      title, body, country_id, city_id, is_bridge,
      need_category, published_at, cafe_id, visibility
    )
    values (
      v_uid, 'real', 'published', p_post_type,
      v_title, v_body, v_cafe.country_id, v_cafe.city_id, v_cafe.is_bridge,
      v_need, now(), p_cafe_id, 'cafe'
    )
    returning id into v_post_id;

    insert into public.cadde_post_interests (post_id, interest_key)
    select v_post_id, k from unnest(v_interests) k;

    return v_post_id;
  end if;

  select c.id into v_country_id
  from public.cadde_countries c
  where c.name = nullif(trim(coalesce(p_country, '')), '') and c.is_active = true
  limit 1;

  select ci.id into v_city_id
  from public.cadde_cities ci
  where ci.name = nullif(trim(coalesce(p_city, '')), '')
    and (v_country_id is null or ci.country_id = v_country_id)
    and ci.is_active = true
  limit 1;

  if p_is_bridge and not public.can_post_kopru(v_uid) then
    raise exception 'cadde_bridge_permission_denied';
  end if;

  -- CKS §7.1: TR yerleşik kullanıcı normal Cadde'de yalnız @Türkiye'ye paylaşır.
  if not p_is_bridge
     and public.is_tr_resident(v_uid)
     and not v_is_privileged
     and (v_country_id is null
          or v_country_id not in (select id from public.cadde_countries where code = 'TR')) then
    raise exception 'cadde_tr_scope_restricted';
  end if;

  insert into public.cadde_posts (
    author_user_id, content_mode, status, post_type,
    title, body, country_id, city_id, is_bridge,
    need_category, published_at
  )
  values (
    v_uid, 'real', 'published', p_post_type,
    v_title, v_body, v_country_id, v_city_id, coalesce(p_is_bridge, false),
    v_need, now()
  )
  returning id into v_post_id;

  insert into public.cadde_post_interests (post_id, interest_key)
  select v_post_id, k from unnest(v_interests) k;

  return v_post_id;
end;
$$;

-- ── 11. list_cadde_feed_v1 ana akışta cafe-içi postları gizlesin ─────────────
-- (007'deki fonksiyonun base CTE'sine visibility filtresi eklenmiş tam yeniden tanımı yerine
-- yalnız WHERE koşulu değişiyor — fonksiyon gövdesi 007 ile birebir + visibility='public'.)
create or replace function public.list_cadde_feed_v1(
  p_filters jsonb default '{}'::jsonb,
  p_cursor jsonb default null,
  p_limit integer default 20
)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_limit int := least(greatest(coalesce(p_limit, 20), 1), 50);
  v_filter_countries text[];
  v_filter_cities text[];
  v_filter_interests text[];
  v_bridge boolean := coalesce((p_filters ->> 'bridge')::boolean, false);
  v_country_ids uuid[];
  v_city_ids uuid[];
  v_viewer_country_id uuid;
  v_viewer_city_id uuid;
  v_scope text;
  v_viewer_interests text[];
  v_avg numeric;
  v_cur_band int := (p_cursor ->> 'band')::int;
  v_cur_score numeric := (p_cursor ->> 'score')::numeric;
  v_cur_rand int := (p_cursor ->> 'rand')::int;
  v_cur_id uuid := (p_cursor ->> 'id')::uuid;
  v_all jsonb;
  v_total int;
  v_items jsonb;
  v_next jsonb := null;
  v_last jsonb;
begin
  if v_uid is null then
    return jsonb_build_object('items', '[]'::jsonb, 'nextCursor', null);
  end if;

  select coalesce(array_agg(x), '{}') into v_filter_countries
  from jsonb_array_elements_text(coalesce(p_filters -> 'countries', '[]'::jsonb)) x
  where trim(x) <> '';

  select coalesce(array_agg(x), '{}') into v_filter_cities
  from jsonb_array_elements_text(coalesce(p_filters -> 'cities', '[]'::jsonb)) x
  where trim(x) <> '';

  select coalesce(array_agg(x), '{}') into v_filter_interests
  from jsonb_array_elements_text(coalesce(p_filters -> 'interests', '[]'::jsonb)) x
  where trim(x) <> '';

  select coalesce(array_agg(c.id), '{}') into v_country_ids
  from public.cadde_countries c
  where c.is_active = true and c.name = any(v_filter_countries);

  select coalesce(array_agg(ci.id), '{}') into v_city_ids
  from public.cadde_cities ci
  where ci.is_active = true
    and ci.name = any(v_filter_cities)
    and (cardinality(v_country_ids) = 0 or ci.country_id = any(v_country_ids));

  select c.id into v_viewer_country_id
  from public.cadde_countries c
  where c.is_active = true
    and lower(c.name) = lower(coalesce(nullif(trim(public.cadde_attr_text(v_uid, 'country')), ''), '~'))
  limit 1;

  select ci.id into v_viewer_city_id
  from public.cadde_cities ci
  where ci.is_active = true
    and lower(ci.name) = lower(coalesce(nullif(trim(public.cadde_attr_text(v_uid, 'city')), ''), '~'))
    and (v_viewer_country_id is null or ci.country_id = v_viewer_country_id)
  limit 1;

  v_scope := coalesce(
    nullif(trim(public.cadde_attr_text(v_uid, 'city')), ''),
    nullif(trim(public.cadde_attr_text(v_uid, 'country')), ''),
    'global'
  );

  select coalesce(array_agg(interest_key), '{}') into v_viewer_interests
  from public.user_cadde_interests
  where user_id = v_uid;

  select coalesce(avg(engagement_score), 0) into v_avg
  from public.cadde_posts
  where content_mode = 'real' and status = 'published' and visibility = 'public'
    and coalesce(published_at, created_at) > now() - interval '7 days';

  with base as (
    select p.*
    from public.cadde_posts p
    where p.content_mode = 'real'
      and p.status = 'published'
      and p.visibility = 'public'
      and (not v_bridge or p.is_bridge)
      and (cardinality(v_country_ids) = 0 or p.country_id = any(v_country_ids))
      and (cardinality(v_city_ids) = 0 or p.city_id = any(v_city_ids))
      and (cardinality(v_filter_interests) = 0 or exists (
        select 1 from public.cadde_post_interests pi
        where pi.post_id = p.id and pi.interest_key = any(v_filter_interests)
      ))
  ),
  scored as (
    select
      b.*,
      cn.name as country_name,
      ct.name as city_name,
      same_city,
      same_country,
      need_match,
      interest_overlap,
      case
        when same_city and need_match then 1
        when same_city then 2
        when same_country then 3
        when v_avg > 0 and b.engagement_score >= 2 * v_avg then 4
        when v_avg > 0 and b.engagement_score >= 1.5 * v_avg then 5
        else 6
      end as band,
      (case when same_city then 100 when same_country then 60 else 0 end)
      + (case when v_bridge and b.is_bridge then 50 else 0 end)
      + (case when need_match then 40 else 0 end)
      + least(interest_overlap * 8, 32)
      + (case
           when not same_city and not same_country and v_avg > 0 and b.engagement_score >= 2 * v_avg then 35
           when not same_city and not same_country and v_avg > 0 and b.engagement_score >= 1.5 * v_avg then 20
           else 0
         end)
      + (case when b.pinned then 120 else 0 end)
      + (case
           when now() - coalesce(b.published_at, b.created_at) <= interval '6 hours' then 25
           when now() - coalesce(b.published_at, b.created_at) <= interval '24 hours' then 15
           when now() - coalesce(b.published_at, b.created_at) <= interval '7 days' then 5
           else 0
         end) as score,
      hashtext(b.id::text || to_char(current_date, 'YYYY-MM-DD') || v_scope) as rand
    from base b
    left join public.cadde_countries cn on cn.id = b.country_id
    left join public.cadde_cities ct on ct.id = b.city_id
    cross join lateral (
      select
        (v_viewer_city_id is not null and b.city_id = v_viewer_city_id) as same_city,
        (v_viewer_country_id is not null and b.country_id = v_viewer_country_id) as same_country,
        (b.need_category is not null and b.need_category = any(v_viewer_interests)) as need_match,
        (select count(*)::int from public.cadde_post_interests pi
         where pi.post_id = b.id and pi.interest_key = any(v_viewer_interests)) as interest_overlap
    ) flags
  ),
  page as (
    select *
    from scored s
    where p_cursor is null
       or (s.band > v_cur_band)
       or (s.band = v_cur_band and s.score < v_cur_score)
       or (s.band = v_cur_band and s.score = v_cur_score and s.rand > v_cur_rand)
       or (s.band = v_cur_band and s.score = v_cur_score and s.rand = v_cur_rand and s.id > v_cur_id)
    order by s.band asc, s.score desc, s.rand asc, s.id asc
    limit v_limit + 1
  )
  select
    coalesce(jsonb_agg(jsonb_build_object(
      'id', pg.id,
      'author_user_id', pg.author_user_id,
      'author_name_override', pg.author_name_override,
      'author_role', pg.author_role,
      'author_avatar_url', pg.author_avatar_url,
      'content_mode', pg.content_mode,
      'status', pg.status,
      'post_type', pg.post_type,
      'title', pg.title,
      'body', pg.body,
      'country_id', pg.country_id,
      'city_id', pg.city_id,
      'country_name', pg.country_name,
      'city_name', pg.city_name,
      'is_bridge', pg.is_bridge,
      'pinned', pg.pinned,
      'created_at', pg.created_at,
      'published_at', pg.published_at,
      'need_category', pg.need_category,
      'engagement_score', pg.engagement_score,
      'interests', coalesce((
        select jsonb_agg(pi.interest_key order by pi.interest_key)
        from public.cadde_post_interests pi where pi.post_id = pg.id
      ), '[]'::jsonb),
      'band', pg.band,
      'score', pg.score,
      'rand', pg.rand
    ) order by pg.band asc, pg.score desc, pg.rand asc, pg.id asc), '[]'::jsonb),
    count(*)
  into v_all, v_total
  from page pg;

  if v_total > v_limit then
    select coalesce(jsonb_agg(e.value order by e.ordinality), '[]'::jsonb)
    into v_items
    from jsonb_array_elements(v_all) with ordinality e
    where e.ordinality <= v_limit;

    v_last := v_all -> (v_limit - 1);
    v_next := jsonb_build_object(
      'band', v_last -> 'band',
      'score', v_last -> 'score',
      'rand', v_last -> 'rand',
      'id', v_last -> 'id'
    );
  else
    v_items := v_all;
  end if;

  return jsonb_build_object('items', v_items, 'nextCursor', v_next);
end;
$$;

-- ── 12. RLS: kullanıcı cafe oluşturma/katılma RPC'ye taşınır ─────────────────
drop policy if exists "cadde cafes self insert" on public.cadde_cafes;

create policy "cadde cafes admin insert"
on public.cadde_cafes for insert
with check (public.is_admin_user(auth.uid()));

drop policy if exists "cadde cafe members self insert" on public.cadde_cafe_members;
-- self delete (cafe'den ayrılma) ve authenticated read policy'leri korunur.

-- ── 13. Grant'ler ────────────────────────────────────────────────────────────
revoke all on function public.cadde_setting_int(text, integer) from public, anon;
revoke all on function public.can_join_cadde_cafe(uuid, uuid) from public, anon;
revoke all on function public.create_cadde_cafe_v1(text, text, text, text, text, boolean, text, text, text, timestamptz, timestamptz, integer, jsonb) from public, anon;
revoke all on function public.join_cadde_cafe_v1(uuid, text, text) from public, anon;
revoke all on function public.approve_cadde_cafe_member_v1(uuid, boolean) from public, anon;
revoke all on function public.archive_cadde_cafe_v1(uuid) from public, anon;
revoke all on function public.create_cadde_post_v1(text, text, text, text, text, boolean, text, text[], uuid) from public, anon;

grant execute on function public.can_join_cadde_cafe(uuid, uuid) to authenticated;
grant execute on function public.create_cadde_cafe_v1(text, text, text, text, text, boolean, text, text, text, timestamptz, timestamptz, integer, jsonb) to authenticated;
grant execute on function public.join_cadde_cafe_v1(uuid, text, text) to authenticated;
grant execute on function public.approve_cadde_cafe_member_v1(uuid, boolean) to authenticated;
grant execute on function public.archive_cadde_cafe_v1(uuid) to authenticated;
grant execute on function public.create_cadde_post_v1(text, text, text, text, text, boolean, text, text[], uuid) to authenticated;

commit;
