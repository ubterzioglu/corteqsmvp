-- Cadde V1 (4/6): mention'a görünen etiket.
--
-- cadde_post_mentions yalnız (type, id) tutuyordu. Gövdedeki "@Ayşe Kaya" metnini hangi
-- mention satırına bağlayacağımızı bilmenin tek güvenilir yolu etiketi de saklamak:
-- sıraya güvenmek (n. @ → n. mention) kullanıcı metni düzenleyince kırılır.
--
-- display_label composer'ın seçim anında yazdığı görünen addır; hedef sonradan adını
-- değiştirse bile paylaşımdaki metin değişmez (tarihsel doğruluk).

begin;

alter table public.cadde_post_mentions
  add column if not exists display_label text;

comment on column public.cadde_post_mentions.display_label is
  'Paylaşım anındaki görünen ad. Gövdedeki @metni bu satıra eşlemek için; hedefin güncel adı değil.';

-- p_mentions artık [{"type":..., "id":..., "label":"Ayşe Kaya"}] kabul eder.
create or replace function public.cadde_sync_post_mentions(
  p_post_id uuid,
  p_mentions jsonb,
  p_author_user_id uuid,
  p_post_title text
)
returns integer
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_max int := public.cadde_setting_int('cadde.mention.max_per_post', 10);
  v_item jsonb;
  v_type text;
  v_id uuid;
  v_label text;
  v_count int := 0;
  v_notify_user uuid;
  v_manager record;
  v_preview text := left(coalesce(nullif(p_post_title, ''), 'Bir paylaşımda senden söz edildi'), 120);
begin
  delete from public.cadde_post_mentions where post_id = p_post_id;

  if p_mentions is null or jsonb_typeof(p_mentions) <> 'array' then
    return 0;
  end if;

  if jsonb_array_length(p_mentions) > v_max then
    raise exception 'cadde_mention_limit';
  end if;

  for v_item in select value from jsonb_array_elements(p_mentions) loop
    v_type := v_item ->> 'type';
    v_label := nullif(trim(coalesce(v_item ->> 'label', '')), '');
    begin
      v_id := (v_item ->> 'id')::uuid;
    exception when others then
      continue;
    end;

    if v_type not in ('user', 'catalog_item', 'cafe', 'carsi_item') or v_id is null then
      continue;
    end if;

    v_notify_user := null;

    if v_type = 'user' then
      if not exists (select 1 from auth.users where id = v_id) then continue; end if;
      v_notify_user := v_id;

    elsif v_type = 'cafe' then
      select host_user_id into v_notify_user
      from public.cadde_cafes
      where id = v_id and status = 'published' and archived_at is null;
      if not found then continue; end if;

    elsif v_type = 'carsi_item' then
      select owner_user_id into v_notify_user
      from public.carsi_items
      where id = v_id and status = 'published' and moderation_status = 'approved' and deleted_at is null;
      if not found then continue; end if;

    elsif v_type = 'catalog_item' then
      if not exists (select 1 from public.catalog_items where id = v_id and status = 'published') then
        continue;
      end if;
    end if;

    insert into public.cadde_post_mentions (post_id, target_type, target_id, display_label)
    values (p_post_id, v_type, v_id, v_label)
    on conflict (post_id, target_type, target_id) do update set display_label = excluded.display_label;

    v_count := v_count + 1;

    if v_notify_user is not null and v_notify_user is distinct from p_author_user_id then
      perform public.cadde_notify(
        v_notify_user, p_author_user_id, 'cadde.post.mentioned',
        'Bir paylaşımda senden söz edildi', v_preview,
        'post', p_post_id, jsonb_build_object('targetType', v_type)
      );
    end if;

    if v_type = 'catalog_item' then
      for v_manager in
        select user_id from public.catalog_item_managers
        where item_id = v_id and status = 'active' and user_id is distinct from p_author_user_id
      loop
        perform public.cadde_notify(
          v_manager.user_id, p_author_user_id, 'cadde.post.mentioned',
          'Bir paylaşımda işletmenden söz edildi', v_preview,
          'post', p_post_id, jsonb_build_object('targetType', v_type, 'itemId', v_id)
        );
      end loop;
    end if;
  end loop;

  return v_count;
end;
$$;

revoke all on function public.cadde_sync_post_mentions(uuid, jsonb, uuid, text) from public, anon, authenticated;


-- ── list_cadde_feed_v1: mentions çıktısına 'label' ───────────────────────────
-- Canlı tanımdan türetildi; yalnız mention jsonb'sine label eklendi.
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
  v_hashtag text := public.cadde_normalize_tag(coalesce(p_filters ->> 'hashtag', ''));
  v_feed_scope text := lower(coalesce(nullif(trim(coalesce(p_filters ->> 'scope', '')), ''), 'all'));
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
      and (
        case
          when v_feed_scope = 'cafes' then
            p.visibility = 'cafe' and exists (
              select 1 from public.cadde_cafe_members m
              where m.cafe_id = p.cafe_id and m.user_id = v_uid and m.status = 'approved'
            )
          else p.visibility = 'public'
        end
      )
      and (v_hashtag = '' or exists (
        select 1 from public.cadde_post_hashtags ph
        where ph.post_id = p.id and ph.tag = v_hashtag
      ))
      -- Faz 2'ye bırakılan kapsamlar (nearby/following/jobs) 'all' gibi davranır.
      and (
        case v_feed_scope
          when 'city' then v_viewer_city_id is not null and p.city_id = v_viewer_city_id
          when 'country' then v_viewer_country_id is not null and p.country_id = v_viewer_country_id
          when 'events' then p.post_type = 'event'
          else true
        end
      )
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
      'hashtags', coalesce((
        select jsonb_agg(jsonb_build_object('tag', ph.tag, 'displayTag', h.display_tag) order by ph.tag)
        from public.cadde_post_hashtags ph
        join public.cadde_hashtags h on h.tag = ph.tag
        where ph.post_id = pg.id
      ), '[]'::jsonb),
      'mentions', coalesce((
        select jsonb_agg(jsonb_build_object('type', pm.target_type, 'id', pm.target_id, 'label', pm.display_label) order by pm.target_type, pm.target_id)
        from public.cadde_post_mentions pm where pm.post_id = pg.id
      ), '[]'::jsonb),
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
