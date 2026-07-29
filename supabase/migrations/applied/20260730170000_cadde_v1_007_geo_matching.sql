-- Cadde V1 (7/7): şehir/ülke eşleştirmesinin onarımı + geo kataloğunun kendini beslemesi.
--
-- BULGU (2026-07-30, canlıda ölçüldü): 110 üyenin şehri var, feed'in şehir eşleştirmesi
-- bunlardan yalnız 12'sini (%11) çözebiliyordu. İki bağımsız neden:
--
--   1. TÜRKÇE İ HATASI (mevcut list_cadde_feed_v1'de):
--      lower('İstanbul') = 'i̇stanbul' (i + U+0307) ≠ lower('Istanbul') = 'istanbul'
--      En kalabalık grup olan 13 İstanbul üyesi eşleşmiyordu. Ülke tarafında da aynı:
--      üye "Türkiye" yazıyor, katalogda "Turkiye" duruyor.
--      → Eşleştirme lower(unaccent(...)) ile yapılır (hashtag normalizasyonuyla aynı ders).
--
--   2. KATALOG BOŞLUĞU: geo_cities'te 76.990 şehir varken cadde_cities'te 6 tane vardı.
--      Doha (9 üye), Ankara (6), İzmir (4), Antalya (3), Frankfurt, Düsseldorf, Dortmund,
--      Magdeburg… hiçbiri yoktu. Katalog 2026-06'da elle 6 şehirle tohumlanmış ve bir daha
--      büyümemiş; mevcut sync RPC'si admin'in tek tek ülke+şehir listesi girmesini istiyor.
--      → Üyelerin gerçekten yaşadığı şehirler geo kataloğundan backfill edilir VE
--        profil kaydında kendini besleyen bir trigger eklenir, tekrar çürümesin.
--
-- ETKİ: same_city bandı üyelerin %89'unda hiç ateşlenmiyordu (feed ranking'inin birincil
-- sinyali) ve "Şehrim" kapsamı bu üyelerde BOŞ akış döndürüyordu.
--
-- KAPSAM DIŞI (bilinçli): "Qatar/Katar", "Deutschland/Almanya" gibi ÇEVİRİ farkları.
-- Bunlar aksan sorunu değil veri girişi sorunu — çözümü profilde serbest metin yerine
-- ülke seçici kullanmak. Bu migration onları çözmez, sayısını raporlar.

begin;

-- ── 1. Ortak katlama yardımcısı ──────────────────────────────────────────────
-- Türkçe-güvenli karşılaştırma anahtarı. cadde_normalize_tag'den farkı: boşlukları ve
-- noktalamayı KORUR (şehir adları "New York" gibi boşluk içerir).
create or replace function public.cadde_fold_text(p_text text)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select lower(unaccent(trim(coalesce(p_text, ''))));
$$;

revoke all on function public.cadde_fold_text(text) from public, anon;
grant execute on function public.cadde_fold_text(text) to authenticated;

-- ── 2. Üye şehrini geo kataloğundan Cadde kataloğuna taşıyan fonksiyon ───────
-- Ülke ve şehir ADIYLA gelir (profil attribute'ları serbest metin). Bulunamayan
-- sessizce atlanır — profil kaydını asla düşürmemeli.
create or replace function public.cadde_ensure_geo_city(p_country_name text, p_city_name text)
returns uuid
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_country text := trim(coalesce(p_country_name, ''));
  v_city text := trim(coalesce(p_city_name, ''));
  v_geo_country public.geo_countries%rowtype;
  v_geo_city_id uuid;
  v_country_id uuid;
  v_city_id uuid;
  v_timezone text;
begin
  if v_city = '' or lower(v_city) in ('belirtilmedi', '-') then
    return null;
  end if;

  -- Zaten Cadde kataloğunda mı? (aksan-toleranslı)
  select ci.id into v_city_id
  from public.cadde_cities ci
  where ci.is_active and public.cadde_fold_text(ci.name) = public.cadde_fold_text(v_city)
  limit 1;
  if v_city_id is not null then
    return v_city_id;
  end if;

  -- Ülkeyi geo kataloğunda bul (ad veya kod ile, aksan-toleranslı).
  if v_country <> '' then
    select * into v_geo_country
    from public.geo_countries
    where is_active
      and (public.cadde_fold_text(name) = public.cadde_fold_text(v_country)
           or lower(code) = lower(v_country))
    limit 1;
  end if;

  -- Şehri geo kataloğunda bul; ülke çözülemediyse ada göre global ara.
  -- NOT: skaler ve %rowtype tek SELECT INTO'da birlikte doldurulamaz — iki adım.
  if v_geo_country.id is not null then
    select g.id into v_geo_city_id
    from public.geo_cities g
    where g.is_active and g.country_id = v_geo_country.id
      and public.cadde_fold_text(g.name) = public.cadde_fold_text(v_city)
    limit 1;
  else
    declare
      v_fallback_country_id uuid;
    begin
      select g.id, g.country_id into v_geo_city_id, v_fallback_country_id
      from public.geo_cities g
      where g.is_active and public.cadde_fold_text(g.name) = public.cadde_fold_text(v_city)
      limit 1;

      if v_fallback_country_id is not null then
        select * into v_geo_country from public.geo_countries where id = v_fallback_country_id;
      end if;
    end;
  end if;

  if v_geo_city_id is null or v_geo_country.id is null then
    return null;
  end if;

  -- Cadde ülkesi yoksa aç.
  select id into v_country_id
  from public.cadde_countries
  where geo_country_id = v_geo_country.id or code = v_geo_country.code
  limit 1;

  if v_country_id is null then
    insert into public.cadde_countries (code, name, sort_order, is_active, geo_country_id)
    values (
      v_geo_country.code,
      v_geo_country.name,
      coalesce((select max(sort_order) + 10 from public.cadde_countries), 10),
      true,
      v_geo_country.id
    )
    returning id into v_country_id;
  end if;

  -- Zaman dilimi: geo_cities'te timezone YOK. Aynı ülkedeki mevcut bir şehirden
  -- devral (Türkiye'nin tüm şehirleri Europe/Istanbul); yoksa UTC.
  select ci.timezone into v_timezone
  from public.cadde_cities ci
  where ci.country_id = v_country_id and ci.timezone is not null and ci.timezone <> 'UTC'
  limit 1;

  insert into public.cadde_cities (country_id, name, timezone, sort_order, is_active, geo_city_id)
  values (
    v_country_id,
    v_city,
    coalesce(v_timezone, 'UTC'),
    coalesce((select max(sort_order) + 10 from public.cadde_cities where country_id = v_country_id), 10),
    true,
    v_geo_city_id
  )
  on conflict (geo_city_id) where geo_city_id is not null do nothing
  returning id into v_city_id;

  return v_city_id;
end;
$$;

revoke all on function public.cadde_ensure_geo_city(text, text) from public, anon;

-- ── 3. Backfill: üyelerin gerçekten yaşadığı şehirler ───────────────────────
do $$
declare
  v_row record;
  v_added int := 0;
  v_missed int := 0;
begin
  for v_row in
    select distinct
      (select upa2.value_text
       from public.user_profile_attributes upa2
       join public.afs_attributes a2 on a2.id = upa2.attribute_id
       where a2.key = 'country' and upa2.user_id = upa.user_id
       limit 1) as country,
      upa.value_text as city
    from public.user_profile_attributes upa
    join public.afs_attributes a on a.id = upa.attribute_id
    where a.key = 'city'
      and coalesce(upa.value_text, '') not in ('', 'Belirtilmedi', '-')
  loop
    if public.cadde_ensure_geo_city(v_row.country, v_row.city) is null then
      v_missed := v_missed + 1;
    else
      v_added := v_added + 1;
    end if;
  end loop;
  raise notice 'BACKFILL: cozulen=% cozulemeyen=%', v_added, v_missed;
end $$;

-- ── 4. Kendini besleyen trigger ─────────────────────────────────────────────
-- Üye profiline şehir yazdığında katalog kendiliğinden büyür; katalog bir daha
-- elle bakım gerektirmez. Hata profil kaydını ASLA düşürmez.
create or replace function public.cadde_profile_city_sync()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_key text;
  v_country text;
begin
  select key into v_key from public.afs_attributes where id = new.attribute_id;
  if v_key is distinct from 'city' then
    return new;
  end if;

  select upa.value_text into v_country
  from public.user_profile_attributes upa
  join public.afs_attributes a on a.id = upa.attribute_id
  where a.key = 'country' and upa.user_id = new.user_id
  limit 1;

  begin
    perform public.cadde_ensure_geo_city(v_country, new.value_text);
  exception when others then
    -- Katalog büyümesi profil kaydından daha az önemli; sessizce geç.
    raise notice 'cadde_profile_city_sync atlandi: %', sqlerrm;
  end;

  return new;
end;
$$;

drop trigger if exists trg_cadde_profile_city_sync on public.user_profile_attributes;
create trigger trg_cadde_profile_city_sync
after insert or update of value_text on public.user_profile_attributes
for each row execute function public.cadde_profile_city_sync();


-- ── 5. list_cadde_feed_v1: viewer ülke/şehir çözümlemesi aksan-toleranslı ───
-- Tek değişiklik: lower(...) → public.cadde_fold_text(...) iki eşleştirmede.
-- Bu satırlar yüzünden profil şehri "İstanbul" olan 13 üye katalogdaki "Istanbul"
-- ile eşleşmiyordu; same_city bandı hiç ateşlenmiyordu.
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
