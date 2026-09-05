-- Cadde — paylaşım hedefini geo KÖPRÜSÜ üzerinden de çöz (form kataloğu ↔ Cadde kataloğu).
--
-- SORUN (canlıda ölçüldü 2026-09-05): profil formu ülkeyi `geo_countries`'ten seçtiriyor
-- (SearchableCountrySelect → useGeo), Cadde ise `cadde_countries` ile eşleştiriyor.
-- İki katalog AYNI ülkeye FARKLI ad veriyor:
--     geo_countries "ABD"        ↔ cadde_countries "Amerika Birlesik Devletleri"
--     geo_countries "İngiltere"  ↔ cadde_countries "Birlesik Krallik"
-- 20260805130000 eşleştirmeyi `cadde_fold_text` ile aksan/kasa duyarsız yapmıştı; ama bunlar
-- yazım varyantı DEĞİL, FARKLI KELİMELER — fold da eşleştiremez. Sonuç: bu üyelerin
-- country_id'si NULL kalıyor, `create_cadde_post_v2` `cadde_invalid_targets` fırlatıyor,
-- yani üye HİÇ paylaşım yapamıyor. Canlı ölçüm: ABD 4 + İngiltere 2 = 6 üye kapalı.
-- (Çözülemeyen kalan 16 değer gerçek ülke değil: "Belirtilmedi" 14 — eski WhatsApp-bot
-- kaydı, CLAUDE.md'de yazılı — artı "De" ve "a" çöp girdileri.)
--
-- ÇÖZÜM: veriyi elle onarmak yerine KÖPRÜYÜ kullan. `cadde_countries.geo_country_id`
-- canlıda 22/22 DOLU. Join artık iki yoldan eşleşiyor: (a) katalog adının kendisi,
-- (b) o katalog satırının bağlı olduğu geo adı. Tek tek ad onarımından üstündür: bugünkü
-- 6 üyeyi değil, formun ürettiği HER eş-adı kalıcı kapatır — 2026-08-05'te elle onarılan
-- 21 değerin tekrarını önler.
--
-- Fonksiyonun geri kalanı canlı gövdenin BİREBİR kopyasıdır (`pg_get_functiondef`);
-- davranış değişikliği YALNIZCA iki join bloğundadır.
--
-- Performans notu: `geo_cities` 76.990 satırdır ve CLAUDE.md satır-başına-fonksiyon
-- taramasını yasaklar. Buradaki `exists` önce `gc.id = ci.geo_city_id` ile birincil
-- anahtardan TEK satır bulur; fold yalnız o satıra uygulanır, tarama yoktur.
CREATE OR REPLACE FUNCTION public.create_cadde_post_v2(p_post_type text, p_title text, p_body text, p_country text, p_city text, p_is_bridge boolean, p_need_category text DEFAULT NULL::text, p_interests text[] DEFAULT NULL::text[], p_cafe_id uuid DEFAULT NULL::uuid, p_diaspora_key text DEFAULT 'tr'::text, p_media jsonb DEFAULT '[]'::jsonb, p_mentions jsonb DEFAULT '[]'::jsonb, p_targets jsonb DEFAULT '[]'::jsonb)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
    -- ↓↓↓ 20260805130000 — TEK DAVRANIŞ DEĞİŞİKLİĞİ: birebir isim yerine fold eşleşmesi.
    -- Profil attribute'u `Türkiye` iken katalog `Turkiye` tutuyor; okuma tarafı zaten
    -- cadde_fold_text kullanıyordu, yazma tarafı burada hizalanıyor.
    -- `... is not null` korumaları şart: cadde_fold_text(NULL) boş string döner,
    -- birebir karşılaştırma ise NULL'da hiç eşleşmezdi. Koruma olmadan hedefi
    -- boş bırakılmış bir satır, katalogdaki boş adlı bir kayda eşleşebilirdi.
    left join public.cadde_countries c
      on r.country_name is not null
     and c.is_active = true
     and (
       public.cadde_fold_text(c.name) = public.cadde_fold_text(r.country_name)
       or exists (
         select 1
         from public.geo_countries g
         where g.id = c.geo_country_id
           and public.cadde_fold_text(g.name) = public.cadde_fold_text(r.country_name)
       )
     )
    left join public.cadde_cities ci
      on r.city_name is not null
     and ci.is_active = true
     and ci.country_id = c.id
     and (
       public.cadde_fold_text(ci.name) = public.cadde_fold_text(r.city_name)
       or exists (
         select 1
         from public.geo_cities gc
         where gc.id = ci.geo_city_id
           and public.cadde_fold_text(gc.name) = public.cadde_fold_text(r.city_name)
       )
     )
    -- ↑↑↑ değişiklik burada biter
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

-- Doğrulama: köprü sonrası ABD ve İngiltere çözülmeli, çöp değer çözülmemeli.
do $verify$
declare
  v_abd uuid;
  v_ing uuid;
  v_cop uuid;
begin
  select c.id into v_abd from public.cadde_countries c
  where c.is_active and (public.cadde_fold_text(c.name) = public.cadde_fold_text('ABD')
    or exists (select 1 from public.geo_countries g where g.id = c.geo_country_id
               and public.cadde_fold_text(g.name) = public.cadde_fold_text('ABD')));

  select c.id into v_ing from public.cadde_countries c
  where c.is_active and (public.cadde_fold_text(c.name) = public.cadde_fold_text('İngiltere')
    or exists (select 1 from public.geo_countries g where g.id = c.geo_country_id
               and public.cadde_fold_text(g.name) = public.cadde_fold_text('İngiltere')));

  select c.id into v_cop from public.cadde_countries c
  where c.is_active and (public.cadde_fold_text(c.name) = public.cadde_fold_text('Belirtilmedi')
    or exists (select 1 from public.geo_countries g where g.id = c.geo_country_id
               and public.cadde_fold_text(g.name) = public.cadde_fold_text('Belirtilmedi')));

  if v_abd is null then raise exception 'Kopru sonrasi ABD hala cozulemiyor.'; end if;
  if v_ing is null then raise exception 'Kopru sonrasi Ingiltere hala cozulemiyor.'; end if;
  if v_cop is not null then raise exception 'Cop deger Belirtilmedi bir ulkeye eslesti.'; end if;
end
$verify$;