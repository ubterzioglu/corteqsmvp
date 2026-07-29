-- Cadde V1 (1/6): paylaşımlara medya (çoklu görsel + video).
--
-- cadde_posts'ta medya kolonu YOKTU — feed yalnız metin taşıyordu. Bu migration:
--   * `media jsonb` kolonu + şekil/sayı CHECK'i
--   * `cadde_validate_media` — limitleri cadde_settings'ten okuyan doğrulayıcı
--   * `create_cadde_post_v1` + p_media (hem geo hem cafe paylaşım yolunda)
--   * `list_cadde_feed_v1` çıktısına 'media'
--
-- media şekli: [{"kind":"image"|"video","url":"https://…","path":"uid/post/…",
--               "width":123,"height":456}]
-- `path` bucket içi yoldur; silme/temizlik için URL'den türetilemez, saklanır.
--
-- Limitler koda değil cadde_settings'e yazılıdır (mig 000): cadde.media.max_images,
-- cadde.media.video_enabled. TS aynası: src/lib/cadde-media.ts CADDE_MEDIA_LIMITS +
-- src/lib/cadde-schemas.ts caddeMediaSchema — birini değiştiren diğerini de günceller.
--
-- NOT (imza yönetimi): PostgREST'in "Could not choose the best candidate function"
-- (PGRST203) hatasına düşmemek için ÖNCE mevcut 10 parametreli imza drop edilir, SONRA
-- 11 parametreli hali kurulur. Repo deseni budur (bkz. mig 005/008/012).

begin;

-- ── 1. Kolon ─────────────────────────────────────────────────────────────────
alter table public.cadde_posts
  add column if not exists media jsonb not null default '[]'::jsonb;

do $$ begin
  alter table public.cadde_posts
    add constraint cadde_posts_media_check check (
      jsonb_typeof(media) = 'array' and jsonb_array_length(media) <= 5
    );
exception when duplicate_object then null; end $$;

comment on column public.cadde_posts.media is
  'Paylaşım medyası: [{kind:image|video, url, path, width?, height?}]. En fazla 4 görsel + 1 video; doğrulama cadde_validate_media içinde.';

-- ── 2. Doğrulayıcı ───────────────────────────────────────────────────────────
create or replace function public.cadde_validate_media(p_media jsonb)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_media jsonb := coalesce(p_media, '[]'::jsonb);
  v_item jsonb;
  v_kind text;
  v_url text;
  v_images int := 0;
  v_videos int := 0;
  v_max_images int := public.cadde_setting_int('cadde.media.max_images', 4);
  v_video_enabled boolean := public.cadde_setting_bool('cadde.media.video_enabled', true);
begin
  if jsonb_typeof(v_media) <> 'array' then
    raise exception 'cadde_invalid_media';
  end if;

  for v_item in select value from jsonb_array_elements(v_media) loop
    v_kind := v_item ->> 'kind';
    v_url := v_item ->> 'url';

    if v_kind not in ('image', 'video') then
      raise exception 'cadde_invalid_media';
    end if;

    -- Yalnız https kabul edilir; http karışık içerik uyarısı üretir ve bucket zaten https servis eder.
    if v_url is null or v_url !~ '^https://' then
      raise exception 'cadde_invalid_media';
    end if;

    if nullif(trim(coalesce(v_item ->> 'path', '')), '') is null then
      raise exception 'cadde_invalid_media';
    end if;

    if v_kind = 'image' then
      v_images := v_images + 1;
    else
      v_videos := v_videos + 1;
    end if;
  end loop;

  if v_images > v_max_images then
    raise exception 'cadde_media_limit';
  end if;

  if v_videos > 1 then
    raise exception 'cadde_media_limit';
  end if;

  if v_videos > 0 and not v_video_enabled then
    raise exception 'cadde_video_disabled';
  end if;

  return v_media;
end;
$$;

revoke all on function public.cadde_validate_media(jsonb) from public, anon;
grant execute on function public.cadde_validate_media(jsonb) to authenticated;

-- ── 3. create_cadde_post_v1 + p_media ────────────────────────────────────────
-- Gövde canlıdaki 10 parametreli sürümün BİREBİR kopyasıdır; tek fark v_media
-- doğrulaması ve iki INSERT'e media kolonunun eklenmesidir.
drop function if exists public.create_cadde_post_v1(text, text, text, text, text, boolean, text, text[], uuid, text);

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
  p_diaspora_key text default 'tr',
  p_media jsonb default '[]'::jsonb
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
  v_media jsonb := coalesce(p_media, '[]'::jsonb);
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

  -- Medya varsa gövde zorunluluğu gevşer: salt görsel/video paylaşımı meşrudur.
  if jsonb_array_length(v_media) = 0 and length(v_body) < 1 then
    raise exception 'cadde_invalid_body';
  end if;
  if length(v_body) > 4000 then
    raise exception 'cadde_invalid_body';
  end if;

  if v_title is not null and length(v_title) > 160 then
    raise exception 'cadde_invalid_title';
  end if;

  v_media := public.cadde_validate_media(v_media);

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
      need_category, published_at, cafe_id, visibility, diaspora_key, media
    )
    values (
      v_uid, 'real', 'published', p_post_type,
      v_title, v_body, v_cafe.country_id, v_cafe.city_id, v_cafe.is_bridge,
      v_need, now(), p_cafe_id, 'cafe', v_cafe.diaspora_key, v_media
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
    need_category, published_at, diaspora_key, media
  )
  values (
    v_uid, 'real', 'published', p_post_type,
    v_title, v_body, v_country_id, v_city_id, coalesce(p_is_bridge, false),
    v_need, now(), v_diaspora, v_media
  )
  returning id into v_post_id;

  insert into public.cadde_post_interests (post_id, interest_key)
  select v_post_id, k from unnest(v_interests) k;

  return v_post_id;
end;
$$;

revoke all on function public.create_cadde_post_v1(text, text, text, text, text, boolean, text, text[], uuid, text, jsonb) from public, anon;
grant execute on function public.create_cadde_post_v1(text, text, text, text, text, boolean, text, text[], uuid, text, jsonb) to authenticated;


-- ── 4. list_cadde_feed_v1 çıktısına 'media' ──────────────────────────────────
-- Tanım canlıdan alınıp YALNIZ jsonb_build_object'e 'media' eklenerek yeniden
-- kurulur (elle kopyalamak yerine türetildi — sıralama/skor mantığı birebir korunur).
CREATE OR REPLACE FUNCTION public.list_cadde_feed_v1(p_filters jsonb DEFAULT '{}'::jsonb, p_cursor jsonb DEFAULT NULL::jsonb, p_limit integer DEFAULT 20)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
      'media', pg.media,
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
$function$;

revoke all on function public.list_cadde_feed_v1(jsonb, jsonb, integer) from public, anon;
grant execute on function public.list_cadde_feed_v1(jsonb, jsonb, integer) to authenticated;

commit;
