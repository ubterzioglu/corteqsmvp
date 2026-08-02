begin;

create table if not exists public.cadde_post_targets (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.cadde_posts(id) on delete cascade,
  country_id uuid not null references public.cadde_countries(id),
  city_id uuid references public.cadde_cities(id),
  created_at timestamptz not null default now()
);

create unique index if not exists cadde_post_targets_unique_target
  on public.cadde_post_targets (post_id, country_id, coalesce(city_id, '00000000-0000-0000-0000-000000000000'::uuid));

create index if not exists cadde_post_targets_country_city_idx
  on public.cadde_post_targets (country_id, city_id, post_id);

alter table public.cadde_post_targets enable row level security;

insert into public.cadde_post_targets (post_id, country_id, city_id)
select p.id, p.country_id, p.city_id
from public.cadde_posts p
where p.country_id is not null
on conflict do nothing;

insert into public.cadde_settings (key, value)
values ('cadde.post.multi_target_requires_premium', 'true'::jsonb)
on conflict (key) do update set value = excluded.value;

create or replace function public.create_cadde_post_v2(
  p_post_type text,
  p_title text,
  p_body text,
  p_country text,
  p_city text,
  p_is_bridge boolean,
  p_need_category text default null::text,
  p_interests text[] default null::text[],
  p_cafe_id uuid default null::uuid,
  p_diaspora_key text default 'tr'::text,
  p_media jsonb default '[]'::jsonb,
  p_mentions jsonb default '[]'::jsonb,
  p_targets jsonb default '[]'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_uid uuid := auth.uid();
  v_body text := trim(coalesce(p_body, ''));
  v_title text := nullif(trim(coalesce(p_title, '')), '');
  v_need text := nullif(trim(coalesce(p_need_category, '')), '');
  v_interests text[] := coalesce(p_interests, '{}');
  v_diaspora text := coalesce(nullif(trim(coalesce(p_diaspora_key, '')), ''), 'tr');
  v_media jsonb := coalesce(p_media, '[]'::jsonb);
  v_targets jsonb := coalesce(p_targets, '[]'::jsonb);
  v_resolved_targets jsonb := '[]'::jsonb;
  v_first_target jsonb;
  v_country_id uuid;
  v_city_id uuid;
  v_is_privileged boolean;
  v_post_id uuid;
  v_valid_count int;
  v_target_count int := 0;
  v_raw_target_count int := 0;
  v_invalid_target_count int := 0;
  v_has_non_tr_target boolean := false;
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

    if v_cafe.country_id is not null then
      insert into public.cadde_post_targets (post_id, country_id, city_id)
      values (v_post_id, v_cafe.country_id, v_cafe.city_id)
      on conflict do nothing;
    end if;

    insert into public.cadde_post_interests (post_id, interest_key)
    select v_post_id, k from unnest(v_interests) k;

    perform public.cadde_sync_post_hashtags(v_post_id, v_body);
    perform public.cadde_sync_post_mentions(v_post_id, p_mentions, v_uid, coalesce(v_title, left(v_body, 120)));

    return v_post_id;
  end if;

  if jsonb_typeof(v_targets) <> 'array' then
    raise exception 'cadde_invalid_targets';
  end if;

  if jsonb_array_length(v_targets) = 0 then
    v_targets := jsonb_build_array(jsonb_build_object('country', p_country, 'city', p_city));
  end if;

  with raw as (
    select
      e.ordinality,
      nullif(trim(coalesce(e.value ->> 'country', '')), '') as country_name,
      nullif(trim(coalesce(e.value ->> 'city', '')), '') as city_name
    from jsonb_array_elements(v_targets) with ordinality as e(value, ordinality)
  ),
  resolved_raw as (
    select
      r.ordinality,
      r.country_name,
      r.city_name,
      c.id as country_id,
      ci.id as city_id,
      c.code as country_code
    from raw r
    left join public.cadde_countries c on c.name = r.country_name and c.is_active = true
    left join public.cadde_cities ci on ci.name = r.city_name and ci.is_active = true and ci.country_id = c.id
  ),
  invalid as (
    select count(*)::int as invalid_count
    from resolved_raw
    where country_name is null
       or country_id is null
       or (city_name is not null and city_id is null)
  ),
  dedup as (
    select country_id, city_id, country_code, min(ordinality) as ordinality
    from resolved_raw
    where country_id is not null and (city_name is null or city_id is not null)
    group by country_id, city_id, country_code
  )
  select
    (select count(*)::int from raw),
    (select invalid_count from invalid),
    coalesce(jsonb_agg(
      jsonb_build_object('country_id', d.country_id, 'city_id', d.city_id, 'country_code', d.country_code)
      order by d.ordinality
    ), '[]'::jsonb),
    count(*)::int,
    coalesce(bool_or(d.country_code <> 'TR'), false)
  into v_raw_target_count, v_invalid_target_count, v_resolved_targets, v_target_count, v_has_non_tr_target
  from dedup d;

  if v_raw_target_count < 1 or v_invalid_target_count > 0 or v_target_count < 1 or v_target_count > 2 then
    raise exception 'cadde_invalid_targets';
  end if;

  if v_target_count > 1
     and public.cadde_setting_bool('cadde.post.multi_target_requires_premium', true)
     and not v_is_privileged
     and not public.has_cadde_feature(v_uid, 'cadde.post.multi_target') then
    raise exception 'cadde_multi_target_premium_required';
  end if;

  v_first_target := v_resolved_targets -> 0;
  v_country_id := (v_first_target ->> 'country_id')::uuid;
  v_city_id := nullif(v_first_target ->> 'city_id', '')::uuid;

  if p_is_bridge and not public.can_post_kopru(v_uid) then
    raise exception 'cadde_bridge_permission_denied';
  end if;

  if not p_is_bridge
     and public.is_tr_resident(v_uid)
     and not v_is_privileged
     and v_has_non_tr_target then
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

  insert into public.cadde_post_targets (post_id, country_id, city_id)
  select
    v_post_id,
    (target.value ->> 'country_id')::uuid,
    nullif(target.value ->> 'city_id', '')::uuid
  from jsonb_array_elements(v_resolved_targets) as target(value)
  on conflict do nothing;

  insert into public.cadde_post_interests (post_id, interest_key)
  select v_post_id, k from unnest(v_interests) k;

  perform public.cadde_sync_post_hashtags(v_post_id, v_body);
  perform public.cadde_sync_post_mentions(v_post_id, p_mentions, v_uid, coalesce(v_title, left(v_body, 120)));

  return v_post_id;
end;
$function$;

revoke all on function public.create_cadde_post_v2(text,text,text,text,text,boolean,text,text[],uuid,text,jsonb,jsonb,jsonb) from public, anon;
grant execute on function public.create_cadde_post_v2(text,text,text,text,text,boolean,text,text[],uuid,text,jsonb,jsonb,jsonb) to authenticated;

create or replace function public.list_cadde_feed_v1(p_filters jsonb default '{}'::jsonb, p_cursor jsonb default null::jsonb, p_limit integer default 20)
returns jsonb
language plpgsql
stable
security definer
set search_path to 'public'
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
      and (
        case v_feed_scope
          when 'city' then v_viewer_city_id is not null and (
            p.city_id = v_viewer_city_id
            or exists (select 1 from public.cadde_post_targets t where t.post_id = p.id and t.city_id = v_viewer_city_id)
          )
          when 'country' then v_viewer_country_id is not null and (
            p.country_id = v_viewer_country_id
            or exists (select 1 from public.cadde_post_targets t where t.post_id = p.id and t.country_id = v_viewer_country_id)
          )
          when 'events' then p.post_type = 'event'
          else true
        end
      )
      and p.diaspora_key = v_diaspora
      and (not v_bridge or p.is_bridge)
      and (
        cardinality(v_country_ids) = 0
        or p.country_id = any(v_country_ids)
        or exists (select 1 from public.cadde_post_targets t where t.post_id = p.id and t.country_id = any(v_country_ids))
      )
      and (
        cardinality(v_city_ids) = 0
        or p.city_id = any(v_city_ids)
        or exists (select 1 from public.cadde_post_targets t where t.post_id = p.id and t.city_id = any(v_city_ids))
      )
      and (
        v_feed_scope in ('city', 'country', 'events', 'cafes')
        or cardinality(v_country_ids) > 0
        or cardinality(v_city_ids) > 0
        or (v_viewer_city_id is not null and (
          p.city_id = v_viewer_city_id
          or exists (select 1 from public.cadde_post_targets t where t.post_id = p.id and t.city_id = v_viewer_city_id)
        ))
        or (v_viewer_country_id is not null and (
          p.country_id = v_viewer_country_id
          or exists (select 1 from public.cadde_post_targets t where t.post_id = p.id and t.country_id = v_viewer_country_id)
        ))
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
        (v_viewer_city_id is not null and (
          b.city_id = v_viewer_city_id
          or exists (select 1 from public.cadde_post_targets t where t.post_id = b.id and t.city_id = v_viewer_city_id)
        )) as same_city,
        (v_viewer_country_id is not null and (
          b.country_id = v_viewer_country_id
          or exists (select 1 from public.cadde_post_targets t where t.post_id = b.id and t.country_id = v_viewer_country_id)
        )) as same_country,
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
      'targets', coalesce((
        select jsonb_agg(jsonb_build_object(
          'country_id', t.country_id,
          'city_id', t.city_id,
          'country_name', target_country.name,
          'city_name', target_city.name
        ) order by target_country.name, target_city.name nulls first)
        from public.cadde_post_targets t
        join public.cadde_countries target_country on target_country.id = t.country_id
        left join public.cadde_cities target_city on target_city.id = t.city_id
        where t.post_id = pg.id
      ), '[]'::jsonb),
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

revoke all on function public.list_cadde_feed_v1(jsonb,jsonb,integer) from public, anon;
grant execute on function public.list_cadde_feed_v1(jsonb,jsonb,integer) to authenticated;

commit;
