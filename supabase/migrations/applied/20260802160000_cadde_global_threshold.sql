-- F21 / m8+m11: Cadde global çıkış eşiği.
-- reaction_count = F15 sonrası negatifsiz 5'li tepki setinin tamamı.

begin;

alter table public.cadde_posts
  add column if not exists reaction_count integer not null default 0,
  add column if not exists comment_count integer not null default 0;

update public.cadde_posts p
set reaction_count = coalesce(r.count, 0)
from (
  select post_id, count(*)::integer as count
  from public.cadde_post_reactions
  group by post_id
) r
where p.id = r.post_id;

update public.cadde_posts p
set comment_count = coalesce(c.count, 0)
from (
  select post_id, count(*)::integer as count
  from public.cadde_post_comments
  group by post_id
) c
where p.id = c.post_id;

update public.cadde_posts p
set reaction_count = 0
where not exists (select 1 from public.cadde_post_reactions r where r.post_id = p.id);

update public.cadde_posts p
set comment_count = 0
where not exists (select 1 from public.cadde_post_comments c where c.post_id = p.id);

create or replace function public.cadde_touch_engagement_counts()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_post_id uuid := coalesce(new.post_id, old.post_id);
  v_delta integer := case when tg_op = 'DELETE' then -1 else 1 end;
begin
  if tg_table_name = 'cadde_post_reactions' then
    update public.cadde_posts
    set reaction_count = greatest(reaction_count + v_delta, 0)
    where id = v_post_id;
  elsif tg_table_name = 'cadde_post_comments' then
    update public.cadde_posts
    set comment_count = greatest(comment_count + v_delta, 0)
    where id = v_post_id;
  end if;

  return coalesce(new, old);
end;
$$;

drop trigger if exists trg_cadde_reaction_counts on public.cadde_post_reactions;
create trigger trg_cadde_reaction_counts
after insert or delete on public.cadde_post_reactions
for each row execute function public.cadde_touch_engagement_counts();

drop trigger if exists trg_cadde_comment_counts on public.cadde_post_comments;
create trigger trg_cadde_comment_counts
after insert or delete on public.cadde_post_comments
for each row execute function public.cadde_touch_engagement_counts();

insert into public.cadde_settings (key, value)
values
  ('cadde.global.enabled', 'true'::jsonb),
  ('cadde.global.min_reactions', '10'::jsonb),
  ('cadde.global.min_comments', '5'::jsonb),
  ('cadde.global.min_shares', '10'::jsonb)
on conflict (key) do update set value = excluded.value;

create or replace function public.list_cadde_feed_v1(p_filters jsonb default '{}'::jsonb, p_cursor jsonb default null::jsonb, p_limit integer default 20)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $function$
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
  v_global_enabled boolean := public.cadde_setting_bool('cadde.global.enabled', true);
  v_global_min_reactions int := public.cadde_setting_int('cadde.global.min_reactions', 10);
  v_global_min_comments int := public.cadde_setting_int('cadde.global.min_comments', 5);
  v_global_min_shares int := public.cadde_setting_int('cadde.global.min_shares', 10);
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
    and public.cadde_fold_text(c.name) = public.cadde_fold_text(coalesce(nullif(trim(public.cadde_attr_text(v_uid, 'country')), ''), '~'))
  limit 1;

  select ci.id into v_viewer_city_id
  from public.cadde_cities ci
  where ci.is_active = true
    and public.cadde_fold_text(ci.name) = public.cadde_fold_text(coalesce(nullif(trim(public.cadde_attr_text(v_uid, 'city')), ''), '~'))
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
      and (
        v_feed_scope in ('city', 'country', 'events', 'cafes')
        or cardinality(v_country_ids) > 0
        or cardinality(v_city_ids) > 0
        or (v_viewer_city_id is not null and p.city_id = v_viewer_city_id)
        or (v_viewer_country_id is not null and p.country_id = v_viewer_country_id)
        or (
          v_global_enabled
          and (
            p.reaction_count >= v_global_min_reactions
            or p.comment_count >= v_global_min_comments
            or coalesce(p.share_count, 0) >= v_global_min_shares
          )
        )
      )
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
      'reaction_count', pg.reaction_count,
      'comment_count', pg.comment_count,
      'share_count', pg.share_count,
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
