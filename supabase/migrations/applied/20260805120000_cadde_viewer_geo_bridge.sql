-- Cadde: izleyici konum çözümlemesini geo köprüsüne taşı + kör izleyici emniyet supabı
-- =============================================================================
-- SORUN (ölçüm 2026-08-05, canlı 156 hesap):
-- `list_cadde_feed_v1` izleyicinin profil ülke/şehir METNİNİ `cadde_countries` /
-- `cadde_cities` adlarıyla karşılaştırıyordu. Eşleşme yoksa ve filtre de seçilmemişse
-- akış sessizce boş dönüyordu — hata yok, boş ekran. 49 hesap bu durumdaydı.
--
-- Kök neden iki ayrı coğrafya kaynağının METİNLE eşleştirilmesi:
--   * `geo_countries` (251) / `geo_cities` (76.878) — profil dropdown'ını besleyen
--     global referans (SearchableCountrySelect -> useGeoCountries -> src/lib/geo.ts).
--   * `cadde_countries` (18) / `cadde_cities` (51) — Cadde'nin admin kontrollü küçük
--     kataloğu; feed bunu okur.
-- İki listenin adları 2 yerde ayrışıyor: `İngiltere` <-> `Birlesik Krallik` ve
-- `ABD` <-> `Amerika Birlesik Devletleri`. Yani profil dropdown'ından bu iki değeri
-- seçen HER üye — bugünküler ve gelecekteki tüm yeni üyeler — ülke düzeyinde kör
-- kalıyordu. Bu bir veri hatası değil, mimari hata.
--
-- Köprü ZATEN KURULU ama kullanılmıyordu: `cadde_countries.geo_country_id` 18/18 dolu,
-- `cadde_cities.geo_city_id` 50/51 dolu.
--
-- BU MIGRATION ÜÇ ŞEY YAPAR:
--   1. `cadde_resolve_viewer_location()` — çözümlemeyi tek yere alır; önce bugünkü ad
--      eşleşmesi (davranış korunur), bulunamazsa geo köprüsü.
--   2. `list_cadde_feed_v1` — çözümlemeyi yardımcıya devreder ve görünürlük kapısına
--      "konumu hiç çözülemeyen izleyici" dalı ekler. Band/skor matematiğine DOKUNULMAZ.
--   3. Backfill — mevcut üyelerin (ülke, şehir) çiftleri için VAR OLAN
--      `cadde_ensure_geo_city()` çağrılır; eksik katalog satırları bağlarıyla açılır.
--
-- NOT: (3)'teki mekanizma yeni kayıtlar için zaten çalışıyor
-- (`trg_cadde_profile_city_sync` trigger'ı). Kör hesaplar o trigger'dan ÖNCE yazılmış
-- eski satırlar; backfill tam olarak o boşluğu kapatır.
--
-- AYNA SÖZLEŞMESİ (CLAUDE.md): `list_cadde_feed_v1` <-> `src/lib/cadde-ranking.ts`.
-- Aşağıdaki (2)'deki yeni kapı dalı `isCaddeGlobalEligible` aynasında da vardır.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1) Tek noktadan izleyici konum çözümlemesi
-- -----------------------------------------------------------------------------
create or replace function public.cadde_resolve_viewer_location(
  p_uid uuid,
  out out_country_id uuid,
  out out_city_id uuid
)
    language plpgsql
    stable
    security definer
    set search_path to 'public'
    as $fn$
declare
  v_country_text text := nullif(trim(coalesce(public.cadde_attr_text(p_uid, 'country'), '')), '');
  v_city_text    text := nullif(trim(coalesce(public.cadde_attr_text(p_uid, 'city'), '')), '');
  v_geo_country_id uuid;
begin
  -- (a) Bugünkü yol: Cadde kataloğunda ada göre, aksan-toleranslı. Değişmedi —
  --     hâlihazırda çözülen 88 üyenin davranışı birebir korunur.
  select c.id into out_country_id
  from public.cadde_countries c
  where c.is_active
    and public.cadde_fold_text(c.name) = public.cadde_fold_text(coalesce(v_country_text, '~'))
  limit 1;

  -- (b) Bulunamazsa geo köprüsü. Arama deseni `cadde_ensure_geo_city`'den birebir
  --     alındı: ad VEYA ISO kodu, aksan-toleranslı.
  if out_country_id is null and v_country_text is not null then
    select g.id into v_geo_country_id
    from public.geo_countries g
    where g.is_active
      and (public.cadde_fold_text(g.name) = public.cadde_fold_text(v_country_text)
           or lower(g.code) = lower(v_country_text))
    limit 1;

    if v_geo_country_id is not null then
      select c.id into out_country_id
      from public.cadde_countries c
      where c.is_active and c.geo_country_id = v_geo_country_id
      limit 1;
    end if;
  end if;

  -- (c) Şehir: Cadde kataloğunda ada göre. Ülke çözülemediyse ülke koşulu ATLANIR —
  --     bu bilinçli ve eski davranışın aynısı: ülkesi bozuk ama şehri katalogda olan
  --     üye (ör. `Qatar`/`Doha`) şehri üzerinden içerik görmeye devam eder.
  select ci.id into out_city_id
  from public.cadde_cities ci
  where ci.is_active
    and public.cadde_fold_text(ci.name) = public.cadde_fold_text(coalesce(v_city_text, '~'))
    and (out_country_id is null or ci.country_id = out_country_id)
  limit 1;

  -- (d) Şehir için geo köprüsü.
  if out_city_id is null and v_city_text is not null then
    select cc.id into out_city_id
    from public.geo_cities g
    join public.cadde_cities cc on cc.geo_city_id = g.id and cc.is_active
    where g.is_active
      and public.cadde_fold_text(g.name) = public.cadde_fold_text(v_city_text)
      and (out_country_id is null or cc.country_id = out_country_id)
    limit 1;
  end if;
end;
$fn$;

comment on function public.cadde_resolve_viewer_location(uuid) is
  'Profil ülke/şehir metnini Cadde kataloğu id''lerine çevirir. Önce cadde_* adları, sonra geo_* köprüsü (geo_country_id/geo_city_id). list_cadde_feed_v1 bunu kullanır.';

revoke all on function public.cadde_resolve_viewer_location(uuid) from public;
grant all on function public.cadde_resolve_viewer_location(uuid) to authenticated;
grant all on function public.cadde_resolve_viewer_location(uuid) to service_role;

-- -----------------------------------------------------------------------------
-- 2) Feed: çözümlemeyi devret + kör izleyici dalı
--    (gövde canlı `pg_get_functiondef` çıktısından alındı; yalnız iki nokta değişti)
-- -----------------------------------------------------------------------------
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

  -- DEĞİŞTİ (20260805120000): ad eşleşmesi buradan çıkarıldı, tek noktaya alındı.
  -- Yardımcı önce aynı ad eşleşmesini dener (davranış korunur), bulamazsa geo
  -- köprüsünü kullanır — `İngiltere` -> `Birlesik Krallik` sınıfı böyle kapanır.
  select r.out_country_id, r.out_city_id
    into v_viewer_country_id, v_viewer_city_id
  from public.cadde_resolve_viewer_location(v_uid) r;

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
        -- EKLENDİ (20260805120000) — emniyet supabı. İzleyicinin NE şehri NE ülkesi
        -- çözülemiyorsa (profilde 'Belirtilmedi' gibi geçersiz bir değer var, ya da
        -- ülke/şehir hiç girilmemiş) aşağıdaki dalların hepsi kapalı kalıyor ve akış
        -- SESSİZCE boş dönüyordu — hata mesajı yok, kullanıcı sistemi bozuk sanıyor.
        -- Böyle bir izleyiciye global eşik aranmadan içerik gösterilir. Konumu
        -- çözülen izleyiciler bu daldan etkilenmez, sıralama da değişmez.
        or (v_viewer_city_id is null and v_viewer_country_id is null)
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

-- -----------------------------------------------------------------------------
-- 3) Backfill: mevcut üyelerin şehirlerini Cadde kataloğuna bağla
--    Yeni mantık YOK — var olan cadde_ensure_geo_city çağrılır. Fonksiyon
--    'belirtilmedi' ve '-' değerlerini bilinçli atlar; o hesaplar (2)'deki emniyet
--    supabıyla kurtulur.
-- -----------------------------------------------------------------------------
do $backfill$
declare
  r record;
  v_ok int := 0;
  v_skip int := 0;
begin
  for r in
    select distinct
      nullif(trim(public.cadde_attr_text(u.id, 'country')), '') as country_name,
      nullif(trim(public.cadde_attr_text(u.id, 'city')), '')    as city_name
    from auth.users u
  loop
    if r.city_name is null then
      v_skip := v_skip + 1;
      continue;
    end if;

    begin
      if public.cadde_ensure_geo_city(r.country_name, r.city_name) is null then
        v_skip := v_skip + 1;
      else
        v_ok := v_ok + 1;
      end if;
    exception when others then
      -- Katalog büyümesi migration'ı düşürmemeli (trigger'daki aynı gerekçe).
      v_skip := v_skip + 1;
      raise notice 'backfill atlandi (% / %): %', r.country_name, r.city_name, sqlerrm;
    end;
  end loop;

  raise notice 'cadde_ensure_geo_city backfill: % cozuldu, % atlandi', v_ok, v_skip;
end
$backfill$;
