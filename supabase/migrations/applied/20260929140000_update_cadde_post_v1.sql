-- update_cadde_post_v1 — Cadde gönderisi düzenleme RPC (A11b)
-- ============================================================================
--
-- ✅ 2026-09-29'da CANLIYA UYGULANDI ve doğrulandı:
--    CREATE FUNCTION · prosecdef=t ölçüldü · REVOKE/GRANT uygulandı ·
--    smoke test: authenticated rolünde auth.uid() null → `cadde_auth_required`
--    fırlattı (ölçüldü) · `schema_migrations` 20260929140000 ·
--    `npm run check:migrations` → sapma yok · YENİ hata kodu YOK (hepsi haritada).
--    Uygulandığı için `docs/operations/`ten buraya TAŞINDI.
--
-- Amaç: gönderi SAHİBİ (veya admin/moderatör) kendi gönderisini düzenleyebilsin.
-- `applied/` altında update_cadde_post deseninde migration YOKTU (27.09 ölçümü).
--
-- ⚠️ HEDEF EŞLEŞTİRMESİ (KALANLAR A11b): `c.name = country_name` gibi ÇIPLAK AD
--   eşleştirmesi YASAK — profil konumu serbest metin (`Türkiye` vs katalog
--   `Turkiye`); bu kusur 104 üyeyi etkilemişti (20260805130000 dersi). Çözümleme,
--   create_cadde_post_v2'deki CTE'nin BİREBİR kopyasıdır: `cadde_fold_text`
--   (lower+unaccent+trim) + geo_countries/geo_cities köprüsü.
--
-- SEMANTİK — "null = dokunma":
--   p_title/p_body            : null ise mevcut değer korunur
--   p_media/p_interests/      : null ise dokunulmaz; verilirse TAMAMİ değiştirilir
--     p_need_category/p_targets (need_category '' ile TEMİZLENİR)
--   p_mentions                : null ise mention'lara dokunulmaz (gövde düzenlemesi
--                               mevcut mention'ları SİLMEZ); verilirse senkronlanır
--   Hashtag'ler her durumda yeni gövdeden yeniden senkronlanır (cadde_sync_post_hashtags).
--
-- KAPSAM DIŞI: post_type, is_bridge, cafe_id, diaspora_key, visibility DEĞİŞMEZ.
--   Cafe gönderisinde (cafe_id dolu) hedefler cafe'den türediği için p_targets yok
--   sayılır (yalnız title/body/media/interests/need_category/mentions düzenlenir).
--
-- YETKİ (A11a ile aynı): sahip veya admin/moderatör; hidden gönderi "yok" sayılır.
-- HATA KODLARI: tümü MEVCUT (cadde_post_owner_required A11a'da haritaya eklendi) —
--   yeni kod YOK, cadde-rules.ts değişmez.
--
-- UYGULAMA:
--   1) psql -f <bu dosya>   (PowerShell satır yapıştırma — Türkçe bozulur)
--   2) supabase/migrations/applied/20260929140000_update_cadde_post_v1.sql olarak taşı
--   3) schema_migrations kaydı at (version 20260929140000)
--   4) npm run check:migrations → sapma yok
-- ============================================================================

create or replace function public.update_cadde_post_v1(
  p_post_id uuid,
  p_title text default null,
  p_body text default null,
  p_media jsonb default null,
  p_interests text[] default null,
  p_need_category text default null,
  p_targets jsonb default null,
  p_mentions jsonb default null
)
returns void
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_post public.cadde_posts%rowtype;
  v_is_privileged boolean;
  v_body text;
  v_title text;
  v_media jsonb;
  v_need text;
  v_interests text[];
  v_valid_count int;
  v_targets_applied boolean := false;
  v_resolved_targets jsonb := '[]'::jsonb;
  v_first_target jsonb;
  v_country_id uuid;
  v_city_id uuid;
  v_target_count int := 0;
  v_raw_target_count int := 0;
  v_invalid_target_count int := 0;
  v_has_non_tr_target boolean := false;
begin
  if v_uid is null then
    raise exception 'cadde_auth_required';
  end if;

  if public.is_cadde_banned(v_uid) then
    raise exception 'cadde_banned';
  end if;

  select * into v_post
  from public.cadde_posts
  where id = p_post_id and status <> 'hidden';

  if not found then
    raise exception 'cadde_post_not_found';
  end if;

  v_is_privileged := public.is_admin(v_uid) or public.is_moderator(v_uid);

  if v_post.author_user_id is distinct from v_uid and not v_is_privileged then
    raise exception 'cadde_post_owner_required';
  end if;

  -- ── başlık / gövde / medya ────────────────────────────────────────────────
  v_body := trim(coalesce(p_body, v_post.body, ''));
  v_media := coalesce(p_media, v_post.media, '[]'::jsonb);
  v_media := public.cadde_validate_media(v_media);

  -- create ile aynı kural: medya varsa gövde boş olabilir, yoksa zorunlu.
  if jsonb_array_length(v_media) = 0 and length(v_body) < 1 then
    raise exception 'cadde_invalid_body';
  end if;
  if length(v_body) > 4000 then
    raise exception 'cadde_invalid_body';
  end if;

  v_title := case
    when p_title is null then v_post.title
    else nullif(trim(p_title), '')
  end;
  if v_title is not null and length(v_title) > 160 then
    raise exception 'cadde_invalid_title';
  end if;

  -- ── interests (verilirse tam değişim) ─────────────────────────────────────
  if p_interests is not null then
    v_interests := (
      select coalesce(array_agg(distinct k), '{}')
      from unnest(p_interests) k
      where trim(k) <> ''
    );
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

    delete from public.cadde_post_interests where post_id = p_post_id;
    insert into public.cadde_post_interests (post_id, interest_key)
    select p_post_id, k from unnest(v_interests) k;
  end if;

  -- ── need_category ('' ile temizlenir) ─────────────────────────────────────
  if p_need_category is not null then
    v_need := nullif(trim(p_need_category), '');
    if v_need is not null and not exists (
      select 1 from public.cadde_interest_catalog c where c.key = v_need and c.is_active = true
    ) then
      raise exception 'cadde_invalid_need_category';
    end if;
  else
    v_need := v_post.need_category;
  end if;

  -- ── targets (yalnız cafe-olmayan gönderide; fold eşleştirmesi ŞART) ───────
  if p_targets is not null and v_post.cafe_id is null then
    if jsonb_typeof(p_targets) <> 'array' or jsonb_array_length(p_targets) = 0 then
      raise exception 'cadde_invalid_targets';
    end if;

    -- create_cadde_post_v2'deki çözümlemenin BİREBİR kopyası (20260805130000):
    -- çıplak ad eşleştirmesi YOK; cadde_fold_text + geo köprüsü.
    -- `... is not null` korumaları şart: cadde_fold_text(NULL) '' döner.
    with raw as (
      select
        e.ordinality,
        nullif(trim(coalesce(e.value ->> 'country', '')), '') as country_name,
        nullif(trim(coalesce(e.value ->> 'city', '')), '') as city_name
      from jsonb_array_elements(p_targets) with ordinality as e(value, ordinality)
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

    -- TR yerleşik + köprü değil + TR dışı hedef → create ile aynı kısıt.
    if not v_post.is_bridge
       and public.is_tr_resident(v_uid)
       and not v_is_privileged
       and v_has_non_tr_target then
      raise exception 'cadde_tr_scope_restricted';
    end if;

    v_targets_applied := true;
  end if;

  -- ── ana satır ──────────────────────────────────────────────────────────────
  update public.cadde_posts
  set title = v_title,
      body = v_body,
      media = v_media,
      need_category = v_need,
      country_id = case when v_targets_applied then v_country_id else country_id end,
      city_id = case when v_targets_applied then v_city_id else city_id end,
      updated_at = now()
  where id = p_post_id;

  if v_targets_applied then
    delete from public.cadde_post_targets where post_id = p_post_id;
    insert into public.cadde_post_targets (post_id, country_id, city_id)
    select
      p_post_id,
      (target.value ->> 'country_id')::uuid,
      nullif(target.value ->> 'city_id', '')::uuid
    from jsonb_array_elements(v_resolved_targets) as target(value)
    on conflict do nothing;
  end if;

  -- Hashtag'ler gövdeden türer → her düzenlemede yeniden senkron.
  perform public.cadde_sync_post_hashtags(p_post_id, v_body);

  -- Mention'lar yalnız açıkça verildiyse senkronlanır: null = mevcutlar korunur
  -- (gövde düzenlemesi mention'ları sessizce silmesin).
  if p_mentions is not null then
    perform public.cadde_sync_post_mentions(
      p_post_id, p_mentions, v_uid, coalesce(v_title, left(v_body, 120))
    );
  end if;
end;
$$;

revoke all on function public.update_cadde_post_v1(uuid, text, text, jsonb, text[], text, jsonb, jsonb) from public, anon;
grant execute on function public.update_cadde_post_v1(uuid, text, text, jsonb, text[], text, jsonb, jsonb) to authenticated;

comment on function public.update_cadde_post_v1(uuid, text, text, jsonb, text[], text, jsonb, jsonb) is
  'Cadde gönderisini düzenler (sahip veya admin/moderatör). null=dokunma semantiği; hedef çözümlemesi cadde_fold_text ile (çıplak ad eşleştirmesi YASAK, 20260805130000 dersi). A11b.';

-- ============================================================================
-- GERİ ALMA
-- ============================================================================
-- drop function if exists public.update_cadde_post_v1(uuid, text, text, jsonb, text[], text, jsonb, jsonb);
