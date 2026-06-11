-- Cadde 3.0 Faz 8 (1/1): Çoklu diaspora — diaspora_key ayrımı (spec §16).
-- cadde_cafes (008), carsi_items (009), cadde_promotion_placements (010) diaspora_key'i
-- ZATEN taşıyor; bu migration yalnız cadde_posts'a kolonu ekler ve RPC'leri diaspora-farkındalı
-- yapar. Geçerli anahtarlar: tr/in/cn/ph (DiasporaContext ile birebir); default 'tr'
-- (mevcut tüm içerik TR diasporasıdır). Kural (spec §16.1): bir diaspora'nın içeriği
-- diğerinin akışına ASLA sızmaz — feed/promotion RPC'leri eşitlik filtresi uygular;
-- cafe/carsi listeleri istemcide eq filtresiyle daraltılır (RLS değişmez).

begin;

-- ── 1. cadde_posts.diaspora_key ──────────────────────────────────────────────
alter table public.cadde_posts
  add column if not exists diaspora_key text not null default 'tr';

do $$ begin
  alter table public.cadde_posts
    add constraint cadde_posts_diaspora_check check (diaspora_key in ('tr', 'in', 'cn', 'ph'));
exception when duplicate_object then null; end $$;

create index if not exists cadde_posts_diaspora_idx on public.cadde_posts (diaspora_key);

-- Aynı kontrolü diğer tablolara da (kolonlar Faz 4-6'da check'siz eklenmişti).
do $$ begin
  alter table public.cadde_cafes
    add constraint cadde_cafes_diaspora_check check (diaspora_key in ('tr', 'in', 'cn', 'ph'));
exception when duplicate_object then null; end $$;

do $$ begin
  alter table public.carsi_items
    add constraint carsi_items_diaspora_check check (diaspora_key in ('tr', 'in', 'cn', 'ph'));
exception when duplicate_object then null; end $$;

do $$ begin
  alter table public.cadde_promotion_placements
    add constraint cadde_promotion_placements_diaspora_check check (diaspora_key in ('tr', 'in', 'cn', 'ph'));
exception when duplicate_object then null; end $$;

-- ── 2. create_cadde_post_v1: p_diaspora_key (cafe postu cafe'den miras alır) ─
drop function if exists public.create_cadde_post_v1(text, text, text, text, text, boolean, text, text[], uuid);

create or replace function public.create_cadde_post_v1(
  p_post_type text,
  p_title text,
  p_body text,
  p_country text,
  p_city text,
  p_is_bridge boolean,
  p_need_category text default null,
  p_interests text[] default null,
  p_cafe_id uuid default null,
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
  v_body text := trim(coalesce(p_body, ''));
  v_title text := nullif(trim(coalesce(p_title, '')), '');
  v_need text := nullif(trim(coalesce(p_need_category, '')), '');
  v_interests text[] := coalesce(p_interests, '{}');
  v_diaspora text := coalesce(nullif(trim(coalesce(p_diaspora_key, '')), ''), 'tr');
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

  if public.is_cadde_banned(v_uid) then
    raise exception 'cadde_banned';
  end if;

  if v_diaspora not in ('tr', 'in', 'cn', 'ph') then
    raise exception 'cadde_invalid_diaspora';
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
      need_category, published_at, cafe_id, visibility, diaspora_key
    )
    values (
      v_uid, 'real', 'published', p_post_type,
      v_title, v_body, v_cafe.country_id, v_cafe.city_id, v_cafe.is_bridge,
      v_need, now(), p_cafe_id, 'cafe', v_cafe.diaspora_key
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
    need_category, published_at, diaspora_key
  )
  values (
    v_uid, 'real', 'published', p_post_type,
    v_title, v_body, v_country_id, v_city_id, coalesce(p_is_bridge, false),
    v_need, now(), v_diaspora
  )
  returning id into v_post_id;

  insert into public.cadde_post_interests (post_id, interest_key)
  select v_post_id, k from unnest(v_interests) k;

  return v_post_id;
end;
$$;

revoke all on function public.create_cadde_post_v1(text, text, text, text, text, boolean, text, text[], uuid, text) from public, anon;
grant execute on function public.create_cadde_post_v1(text, text, text, text, text, boolean, text, text[], uuid, text) to authenticated;

-- ── 3. list_cadde_feed_v1: diaspora filtresi (p_filters->>'diaspora', default 'tr') ──
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
  v_diaspora text := coalesce(nullif(trim(coalesce(p_filters ->> 'diaspora', '')), ''), 'tr');
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
    and diaspora_key = v_diaspora
    and coalesce(published_at, created_at) > now() - interval '7 days';

  with base as (
    select p.*
    from public.cadde_posts p
    where p.content_mode = 'real'
      and p.status = 'published'
      and p.visibility = 'public'
      and p.diaspora_key = v_diaspora
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

-- ── 4. list_cadde_promotions_v1: placement diaspora filtresi ─────────────────
create or replace function public.list_cadde_promotions_v1(
  p_placement_key text,
  p_filters jsonb default '{}'::jsonb,
  p_limit integer default 5
)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_limit int := least(greatest(coalesce(p_limit, 5), 1), 20);
  v_diaspora text := coalesce(nullif(trim(coalesce(p_filters ->> 'diaspora', '')), ''), 'tr');
  v_filter_countries text[];
  v_filter_cities text[];
  v_country_ids uuid[];
  v_city_ids uuid[];
  v_items jsonb;
begin
  if v_uid is null then
    return '[]'::jsonb;
  end if;

  select coalesce(array_agg(x), '{}') into v_filter_countries
  from jsonb_array_elements_text(coalesce(p_filters -> 'countries', '[]'::jsonb)) x
  where trim(x) <> '';

  select coalesce(array_agg(x), '{}') into v_filter_cities
  from jsonb_array_elements_text(coalesce(p_filters -> 'cities', '[]'::jsonb)) x
  where trim(x) <> '';

  select coalesce(array_agg(c.id), '{}') into v_country_ids
  from public.cadde_countries c
  where c.is_active = true and c.name = any(v_filter_countries);

  select coalesce(array_agg(ci.id), '{}') into v_city_ids
  from public.cadde_cities ci
  where ci.is_active = true
    and ci.name = any(v_filter_cities)
    and (cardinality(v_country_ids) = 0 or ci.country_id = any(v_country_ids));

  select coalesce(jsonb_agg(card), '[]'::jsonb) into v_items
  from (
    select jsonb_build_object(
      'campaignId', c.id,
      'placementKey', pl.placement_key,
      'campaignType', c.campaign_type,
      'title', c.title,
      'description', c.description,
      'targetUrl', c.target_url,
      'imageUrl', c.image_url
    ) as card
    from public.cadde_promotion_campaigns c
    join public.cadde_promotion_placements pl on pl.campaign_id = c.id
    where c.status = 'approved'
      and (c.starts_at is null or c.starts_at <= now())
      and (c.ends_at is null or c.ends_at > now())
      and pl.placement_key = p_placement_key
      and pl.diaspora_key = v_diaspora
      and (cardinality(v_country_ids) = 0 or pl.country_id is null or pl.country_id = any(v_country_ids))
      and (cardinality(v_city_ids) = 0 or pl.city_id is null or pl.city_id = any(v_city_ids))
    order by pl.sort_order asc, c.approved_at desc
    limit v_limit
  ) cards;

  return v_items;
end;
$$;

-- ── 5. create_cadde_cafe_v1 + create_carsi_item_v1: p_diaspora_key ───────────
drop function if exists public.create_cadde_cafe_v1(text, text, text, text, text, boolean, text, text, text, timestamptz, timestamptz, integer, jsonb);

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
  p_external_links jsonb default '[]'::jsonb,
  p_diaspora_key text default 'tr'
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
  v_diaspora text := coalesce(nullif(trim(coalesce(p_diaspora_key, '')), ''), 'tr');
  v_country_id uuid;
  v_city_id uuid;
  v_cafe_id uuid;
  v_slug text;
  v_today_count integer;
begin
  if v_uid is null then
    raise exception 'cadde_auth_required';
  end if;

  if v_diaspora not in ('tr', 'in', 'cn', 'ph') then
    raise exception 'cadde_invalid_diaspora';
  end if;

  if not public.is_cadde_profile_complete(v_uid) then
    if public.cadde_phone_required() and not public.is_phone_verified(v_uid) then
      raise exception 'phone_verification_required';
    end if;
    raise exception 'cadde_profile_incomplete';
  end if;

  if not public.has_cadde_feature(v_uid, 'cadde.cafe.create') then
    if public.is_cadde_banned(v_uid) then
      raise exception 'cadde_banned';
    end if;
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
    capacity, external_links, diaspora_key
  )
  values (
    v_uid, v_title, v_summary, v_country_id, v_city_id,
    'real', 'published', coalesce(p_is_bridge, false), true,
    v_starts, v_ends, true,
    v_slug, v_theme, p_entry_mode,
    case when v_referral is not null then encode(digest(upper(v_referral), 'sha256'), 'hex') end,
    v_question, p_capacity, coalesce(p_external_links, '[]'::jsonb), v_diaspora
  )
  returning id into v_cafe_id;

  insert into public.cadde_cafe_members (cafe_id, user_id, status, approved_at, approved_by)
  values (v_cafe_id, v_uid, 'approved', now(), v_uid)
  on conflict (cafe_id, user_id) do nothing;

  return v_cafe_id;
end;
$$;

revoke all on function public.create_cadde_cafe_v1(text, text, text, text, text, boolean, text, text, text, timestamptz, timestamptz, integer, jsonb, text) from public, anon;
grant execute on function public.create_cadde_cafe_v1(text, text, text, text, text, boolean, text, text, text, timestamptz, timestamptz, integer, jsonb, text) to authenticated;

drop function if exists public.create_carsi_item_v1(text, text, text, numeric, text, text, text, text[], text);

create or replace function public.create_carsi_item_v1(
  p_category_key text,
  p_title text,
  p_description text,
  p_price_amount numeric default null,
  p_price_currency text default null,
  p_country text default null,
  p_city text default null,
  p_image_urls text[] default '{}',
  p_contact_mode text default 'platform',
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
  v_title text := trim(coalesce(p_title, ''));
  v_description text := trim(coalesce(p_description, ''));
  v_currency text := upper(nullif(trim(coalesce(p_price_currency, '')), ''));
  v_images text[] := coalesce(p_image_urls, '{}');
  v_diaspora text := coalesce(nullif(trim(coalesce(p_diaspora_key, '')), ''), 'tr');
  v_country_id uuid;
  v_city_id uuid;
  v_active_count integer;
  v_item_id uuid;
  v_url text;
begin
  if v_uid is null then
    raise exception 'cadde_auth_required';
  end if;

  if v_diaspora not in ('tr', 'in', 'cn', 'ph') then
    raise exception 'cadde_invalid_diaspora';
  end if;

  if not public.is_cadde_profile_complete(v_uid) then
    if public.cadde_phone_required() and not public.is_phone_verified(v_uid) then
      raise exception 'phone_verification_required';
    end if;
    raise exception 'cadde_profile_incomplete';
  end if;

  if not public.has_cadde_feature(v_uid, 'cadde.carsi.create') then
    if public.is_cadde_banned(v_uid) then
      raise exception 'cadde_banned';
    end if;
    raise exception 'cadde_carsi_permission_denied';
  end if;

  if not exists (select 1 from public.carsi_categories where key = p_category_key and is_active = true) then
    raise exception 'cadde_invalid_carsi_category';
  end if;

  if length(v_title) < 3 or length(v_title) > 100 then
    raise exception 'cadde_invalid_carsi_title';
  end if;

  if length(v_description) < 1 or length(v_description) > 2000 then
    raise exception 'cadde_invalid_carsi_description';
  end if;

  if p_price_amount is not null and p_price_amount < 0 then
    raise exception 'cadde_invalid_carsi_price';
  end if;

  if v_currency is not null and v_currency !~ '^[A-Z]{3}$' then
    raise exception 'cadde_invalid_carsi_currency';
  end if;

  if p_contact_mode not in ('platform', 'phone', 'email') then
    raise exception 'cadde_invalid_carsi_contact_mode';
  end if;

  if cardinality(v_images) > 6 then
    raise exception 'cadde_invalid_carsi_image';
  end if;
  foreach v_url in array v_images loop
    if v_url !~ '^https?://' then
      raise exception 'cadde_invalid_carsi_image';
    end if;
  end loop;

  if not (public.is_admin(v_uid) or public.is_moderator(v_uid)) then
    select count(*) into v_active_count
    from public.carsi_items
    where owner_user_id = v_uid
      and deleted_at is null
      and status in ('draft', 'published', 'paused')
      and (expires_at is null or expires_at > now());
    if v_active_count >= public.cadde_setting_int('cadde.carsi.active_item_limit', 5) then
      raise exception 'cadde_carsi_item_limit';
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

  insert into public.carsi_items (
    owner_user_id, category_key, title, description,
    price_amount, price_currency, country_id, city_id,
    image_urls, contact_mode, status, moderation_status, expires_at, diaspora_key
  )
  values (
    v_uid, p_category_key, v_title, v_description,
    p_price_amount, v_currency, v_country_id, v_city_id,
    v_images, p_contact_mode, 'published', 'approved',
    now() + make_interval(days => public.cadde_setting_int('cadde.carsi.default_expiry_days', 30)),
    v_diaspora
  )
  returning id into v_item_id;

  return v_item_id;
end;
$$;

revoke all on function public.create_carsi_item_v1(text, text, text, numeric, text, text, text, text[], text, text) from public, anon;
grant execute on function public.create_carsi_item_v1(text, text, text, numeric, text, text, text, text[], text, text) to authenticated;

-- ── 6. Tanıtım placement'ları: kampanya oluştururken diaspora ────────────────
-- create_cadde_promotion_campaign_v1 imzası AYNI kalır; placement jsonb'sindeki
-- opsiyonel "diaspora" alanı okunur (default 'tr').
create or replace function public.create_cadde_promotion_campaign_v1(
  p_campaign_type text,
  p_title text,
  p_description text,
  p_target_url text,
  p_image_url text default null,
  p_starts_at timestamptz default null,
  p_ends_at timestamptz default null,
  p_placements jsonb default '[]'::jsonb
)
returns uuid
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_title text := trim(coalesce(p_title, ''));
  v_description text := trim(coalesce(p_description, ''));
  v_target_url text := trim(coalesce(p_target_url, ''));
  v_image_url text := nullif(trim(coalesce(p_image_url, '')), '');
  v_is_highlight boolean := p_campaign_type = 'city_highlight';
  v_campaign_id uuid;
  v_placement jsonb;
  v_placement_key text;
  v_placement_diaspora text;
  v_country_id uuid;
  v_city_id uuid;
  v_placement_count int := 0;
  v_sort int := 0;
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

  if v_is_highlight then
    if not (public.has_cadde_feature(v_uid, 'cadde.city.highlight_free')
            or public.has_cadde_feature(v_uid, 'cadde.promotion.create')) then
      raise exception 'cadde_promotion_permission_denied';
    end if;
  else
    if not public.has_cadde_feature(v_uid, 'cadde.promotion.create') then
      raise exception 'cadde_promotion_permission_denied';
    end if;
  end if;

  if p_campaign_type not in ('business', 'consultant', 'event', 'community', 'city_highlight') then
    raise exception 'cadde_invalid_promotion_type';
  end if;

  if length(v_title) < 3 or length(v_title) > 100 then
    raise exception 'cadde_invalid_promotion_title';
  end if;

  if length(v_description) < 1 or length(v_description) > 500 then
    raise exception 'cadde_invalid_promotion_description';
  end if;

  if v_target_url !~ '^(https?://|/)' then
    raise exception 'cadde_invalid_promotion_url';
  end if;

  if v_image_url is not null and v_image_url !~ '^https?://' then
    raise exception 'cadde_invalid_promotion_url';
  end if;

  if p_starts_at is not null and p_ends_at is not null and p_ends_at <= p_starts_at then
    raise exception 'cadde_invalid_promotion_dates';
  end if;

  insert into public.cadde_promotion_campaigns (
    owner_user_id, campaign_type, title, description, target_url, image_url,
    status, starts_at, ends_at
  )
  values (
    v_uid, p_campaign_type, v_title, v_description, v_target_url, v_image_url,
    'pending', p_starts_at, p_ends_at
  )
  returning id into v_campaign_id;

  for v_placement in select * from jsonb_array_elements(coalesce(p_placements, '[]'::jsonb)) loop
    v_placement_key := trim(coalesce(v_placement ->> 'key', ''));
    v_placement_diaspora := coalesce(nullif(trim(coalesce(v_placement ->> 'diaspora', '')), ''), 'tr');

    if v_placement_diaspora not in ('tr', 'in', 'cn', 'ph') then
      raise exception 'cadde_invalid_diaspora';
    end if;

    if not exists (
      select 1 from public.cadde_promotion_placement_catalog
      where key = v_placement_key and is_active = true
    ) then
      raise exception 'cadde_invalid_placement';
    end if;

    if v_is_highlight and v_placement_key <> 'city-ambassador-highlight' then
      raise exception 'cadde_invalid_placement';
    end if;

    if v_placement_key = 'homepage-ai-bar'
       and p_starts_at is not null and p_ends_at is not null
       and p_ends_at > p_starts_at + interval '3 months' then
      raise exception 'cadde_invalid_promotion_dates';
    end if;

    select c.id into v_country_id
    from public.cadde_countries c
    where c.name = nullif(trim(coalesce(v_placement ->> 'country', '')), '') and c.is_active = true
    limit 1;

    select ci.id into v_city_id
    from public.cadde_cities ci
    where ci.name = nullif(trim(coalesce(v_placement ->> 'city', '')), '')
      and (v_country_id is null or ci.country_id = v_country_id)
      and ci.is_active = true
    limit 1;

    insert into public.cadde_promotion_placements (campaign_id, placement_key, country_id, city_id, diaspora_key, theme_keys, sort_order)
    select
      v_campaign_id,
      v_placement_key,
      v_country_id,
      v_city_id,
      v_placement_diaspora,
      coalesce((select array_agg(t) from jsonb_array_elements_text(coalesce(v_placement -> 'themeKeys', '[]'::jsonb)) t), '{}'),
      v_sort;

    v_sort := v_sort + 1;
    v_placement_count := v_placement_count + 1;
  end loop;

  if v_placement_count = 0 or v_placement_count > 6 then
    raise exception 'cadde_invalid_placement';
  end if;

  return v_campaign_id;
end;
$$;

commit;
