-- Cadde 3.0 Faz 3 (1/3): İlgi alanı kataloğu + kullanıcı/post ilgi eşlemeleri +
-- cadde_posts ranking kolonları (need_category, engagement_score, published_at).
-- * Katalog public read (referans listesi, cadde_countries gibi).
-- * user_cadde_interests: kullanıcı yalnız kendi satırlarını yönetir (self-scoped tercih;
--   reactions/comments ile aynı sınıf — RPC zorunluluğu yok).
-- * cadde_post_interests: yazma yalnız create_cadde_post_v1 RPC'si + admin; okuma authenticated.
-- * engagement_score reaksiyon (+1) ve yorum (+2) trigger'larıyla beslenir (band D/E ölçümü).
-- Spec: §9.6 şemalar, §12 hedefleme, §11 band/skor girdileri.

begin;

-- ── Katalog + seed (spec §9.6 / §12.1) ──────────────────────────────────────
create table if not exists public.cadde_interest_catalog (
  key text primary key,
  label_tr text not null,
  sort_order int not null default 0,
  is_active boolean not null default true
);

insert into public.cadde_interest_catalog (key, label_tr, sort_order) values
  ('networking',       'Networking',      10),
  ('new_arrival',      'Yeni Geldim',     20),
  ('family_children',  'Aile & Çocuk',    30),
  ('career',           'Kariyer',         40),
  ('entrepreneurship', 'Girişimcilik',    50),
  ('education',        'Eğitim',          60),
  ('technology',       'Teknoloji',       70),
  ('arts_culture',     'Sanat & Kültür',  80),
  ('sports',           'Spor',            90),
  ('food',             'Yemek',          100),
  ('travel',           'Seyahat',        110),
  ('volunteering',     'Gönüllülük',     120),
  ('mentorship',       'Mentorluk',      130)
on conflict (key) do nothing;

create table if not exists public.user_cadde_interests (
  user_id uuid not null references auth.users(id) on delete cascade,
  interest_key text not null references public.cadde_interest_catalog(key),
  weight smallint not null default 1,
  created_at timestamptz not null default now(),
  primary key (user_id, interest_key)
);

create table if not exists public.cadde_post_interests (
  post_id uuid not null references public.cadde_posts(id) on delete cascade,
  interest_key text not null references public.cadde_interest_catalog(key),
  primary key (post_id, interest_key)
);

create index if not exists user_cadde_interests_key_idx on public.user_cadde_interests (interest_key);
create index if not exists cadde_post_interests_key_idx on public.cadde_post_interests (interest_key);

-- ── RLS ─────────────────────────────────────────────────────────────────────
alter table public.cadde_interest_catalog enable row level security;
alter table public.user_cadde_interests enable row level security;
alter table public.cadde_post_interests enable row level security;

drop policy if exists "cadde interest catalog public read" on public.cadde_interest_catalog;
create policy "cadde interest catalog public read"
on public.cadde_interest_catalog for select
to anon, authenticated
using (is_active = true);

drop policy if exists "user cadde interests self select" on public.user_cadde_interests;
create policy "user cadde interests self select"
on public.user_cadde_interests for select
using (auth.uid() = user_id or public.is_admin_user(auth.uid()));

drop policy if exists "user cadde interests self insert" on public.user_cadde_interests;
create policy "user cadde interests self insert"
on public.user_cadde_interests for insert
with check (auth.uid() = user_id);

drop policy if exists "user cadde interests self update" on public.user_cadde_interests;
create policy "user cadde interests self update"
on public.user_cadde_interests for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "user cadde interests self delete" on public.user_cadde_interests;
create policy "user cadde interests self delete"
on public.user_cadde_interests for delete
using (auth.uid() = user_id);

drop policy if exists "cadde post interests authenticated read" on public.cadde_post_interests;
create policy "cadde post interests authenticated read"
on public.cadde_post_interests for select
using (auth.uid() is not null);

-- Kullanıcı yazması yalnız create_cadde_post_v1 (security definer) üzerinden;
-- admin panel etiketlemesi için admin write açık.
drop policy if exists "cadde post interests admin write" on public.cadde_post_interests;
create policy "cadde post interests admin write"
on public.cadde_post_interests for all
using (public.is_admin_user(auth.uid()))
with check (public.is_admin_user(auth.uid()));

-- ── cadde_posts ranking kolonları ───────────────────────────────────────────
alter table public.cadde_posts
  add column if not exists need_category text references public.cadde_interest_catalog(key),
  add column if not exists engagement_score numeric not null default 0,
  add column if not exists published_at timestamptz;

update public.cadde_posts
set published_at = created_at
where published_at is null and status = 'published';

create index if not exists cadde_posts_feed_idx
  on public.cadde_posts (content_mode, status, is_bridge, country_id, city_id);
create index if not exists cadde_posts_published_at_idx
  on public.cadde_posts (published_at desc);

-- ── engagement_score trigger'ları (band D/E ölçülebilirliği) ────────────────
create or replace function public.cadde_touch_engagement()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_post_id uuid := coalesce(new.post_id, old.post_id);
  v_delta numeric := case when tg_table_name = 'cadde_post_comments' then 2 else 1 end;
begin
  if tg_op = 'DELETE' then
    v_delta := -v_delta;
  end if;
  update public.cadde_posts
  set engagement_score = greatest(engagement_score + v_delta, 0)
  where id = v_post_id;
  return coalesce(new, old);
end;
$$;

drop trigger if exists trg_cadde_reaction_engagement on public.cadde_post_reactions;
create trigger trg_cadde_reaction_engagement
after insert or delete on public.cadde_post_reactions
for each row execute function public.cadde_touch_engagement();

drop trigger if exists trg_cadde_comment_engagement on public.cadde_post_comments;
create trigger trg_cadde_comment_engagement
after insert or delete on public.cadde_post_comments
for each row execute function public.cadde_touch_engagement();

-- Mevcut (seed/demo) içerik için backfill: reaksiyon*1 + yorum*2.
update public.cadde_posts p
set engagement_score =
  (select count(*)::numeric from public.cadde_post_reactions r where r.post_id = p.id)
  + 2 * (select count(*)::numeric from public.cadde_post_comments c where c.post_id = p.id);

-- ── create_cadde_post_v1: need_category + interests (1-3) parametreleri ─────
-- Eski 6 parametreli imza kaldırılır (overload belirsizliği olmasın diye);
-- yeni imzada son iki parametre default'lu olduğundan eski çağrılar da çalışır.
drop function if exists public.create_cadde_post_v1(text, text, text, text, text, boolean);

create or replace function public.create_cadde_post_v1(
  p_post_type text,
  p_title text,
  p_body text,
  p_country text,
  p_city text,
  p_is_bridge boolean,
  p_need_category text default null,
  p_interests text[] default null
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

  v_is_privileged := public.is_admin(v_uid) or public.is_moderator(v_uid);

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

revoke all on function public.create_cadde_post_v1(text, text, text, text, text, boolean, text, text[]) from public, anon;
grant execute on function public.create_cadde_post_v1(text, text, text, text, text, boolean, text, text[]) to authenticated;

commit;
