-- Cadde: "Akışın nasıl şekilleniyor?" kartının veri kaynağı (get_cadde_feed_reach_v1)
-- =============================================================================
-- NEDEN: `list_cadde_feed_v1` görünürlük kapısı üyeye HİÇBİR YERDE anlatılmıyor.
-- Üye, Türkiye dışındaki bir paylaşımı neden görmediğini ya da kendi paylaşımının
-- neden yayılmadığını bilmiyor; "sistem bozuk" algısı buradan doğuyor.
-- Ölçüm (06.08.2026, canlı, 158 hesap — Antalya/Türkiye hedefli 0 etkileşimli post):
--   aynı şehir 3 · aynı ülke 41 · konumu çözülemeyen 46 · GÖREMEZ 68
-- Yani üyelerin %43'ü postu göremiyor ve bu tasarımın kendisi. Kart bunu görünür kılar.
--
-- BU MIGRATION ÜÇ ŞEY YAPAR:
--   1. `cadde_resolve_location_text(country_text, city_text)` — çözümleme mantığı
--      uid'den AYRIŞTIRILIR. Gövde 20260805120000'den birebir taşındı, tek fark
--      (d) dalındaki join yönü (aşağıdaki performans notu).
--   2. `cadde_resolve_viewer_location(uid)` — artık (1)'i çağıran ince sarmalayıcı.
--      DAVRANIŞ DEĞİŞMEZ; `list_cadde_feed_v1` dokunulmadan çalışmaya devam eder.
--      Amaç tek kaynak: kart ile feed aynı çözümleyiciyi kullanır, ayrışamazlar.
--   3. `get_cadde_feed_reach_v1()` — kartın okuduğu RPC.
--
-- ⚠️ PERFORMANS (CLAUDE.md, 05.08 kesintisi): üretim örneği 904 MB RAM ve
-- `geo_cities` 76.990 satır. Bu dosyadaki hiçbir sorgu satır başına fonksiyonu
-- büyük tabloya UYGULAMAZ:
--   * Sayım DISTINCT-FIRST: 158 üye için değil, ~80 tekil (ülke, şehir) çifti için
--     çözümleme yapılır, sonra üyelere geri join edilir.
--   * (1)'deki şehir köprüsü artık `cadde_cities` (55 satır) tarafından SÜRÜLÜR;
--     20260805120000'de `geo_cities` sürücü konumdaydı ve planner seq scan seçerse
--     76.990 satırda fold çalıştırma riski taşıyordu. Sonuç kümesi aynı.
--
-- AYNA SÖZLEŞMESİ (CLAUDE.md): eşikler ve dallar `src/lib/cadde-reach.ts` içinde
-- aynalanır; `src/lib/cadde-reach.test.ts` bu dosyanın metnini okuyup drift'i yakalar.
-- =============================================================================

begin;

set local statement_timeout = '60s';

-- -----------------------------------------------------------------------------
-- 1) Metin -> katalog id çözümleyici (tek kaynak)
-- -----------------------------------------------------------------------------
create or replace function public.cadde_resolve_location_text(
  p_country_text text,
  p_city_text text,
  out out_country_id uuid,
  out out_city_id uuid
)
    language plpgsql
    stable
    security definer
    set search_path to 'public'
    as $fn$
declare
  v_country_text text := nullif(trim(coalesce(p_country_text, '')), '');
  v_city_text    text := nullif(trim(coalesce(p_city_text, '')), '');
  v_geo_country_id uuid;
begin
  -- (a) Cadde kataloğunda ada göre, aksan-toleranslı.
  select c.id into out_country_id
  from public.cadde_countries c
  where c.is_active
    and public.cadde_fold_text(c.name) = public.cadde_fold_text(coalesce(v_country_text, '~'))
  limit 1;

  -- (b) Bulunamazsa geo köprüsü: ad VEYA ISO kodu. geo_countries 251 satır — güvenli.
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
  --     bilinçli, 20260805120000 ile aynı: ülkesi bozuk ama şehri katalogda olan üye
  --     (ör. `Qatar`/`Doha`) şehri üzerinden içerik görmeye devam eder.
  select ci.id into out_city_id
  from public.cadde_cities ci
  where ci.is_active
    and public.cadde_fold_text(ci.name) = public.cadde_fold_text(coalesce(v_city_text, '~'))
    and (out_country_id is null or ci.country_id = out_country_id)
  limit 1;

  -- (d) Şehir için geo köprüsü. SÜRÜCÜ TABLO `cadde_cities` (55) — geo_cities'e
  --     yalnız PK üzerinden gidilir, fold en fazla 55 kez çalışır.
  if out_city_id is null and v_city_text is not null then
    select cc.id into out_city_id
    from public.cadde_cities cc
    join public.geo_cities g on g.id = cc.geo_city_id and g.is_active
    where cc.is_active
      and cc.geo_city_id is not null
      and public.cadde_fold_text(g.name) = public.cadde_fold_text(v_city_text)
      and (out_country_id is null or cc.country_id = out_country_id)
    limit 1;
  end if;
end;
$fn$;

comment on function public.cadde_resolve_location_text(text, text) is
  'Serbest metin ülke/şehir -> Cadde katalog id. Önce cadde_* adları, sonra geo_* köprüsü. cadde_resolve_viewer_location ve get_cadde_feed_reach_v1 bunu kullanır (tek kaynak).';

revoke all on function public.cadde_resolve_location_text(text, text) from public;
grant all on function public.cadde_resolve_location_text(text, text) to authenticated;
grant all on function public.cadde_resolve_location_text(text, text) to service_role;

-- -----------------------------------------------------------------------------
-- 2) Mevcut izleyici çözümleyicisi artık (1)'i çağırır — davranış birebir korunur
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
begin
  select r.out_country_id, r.out_city_id
    into out_country_id, out_city_id
  from public.cadde_resolve_location_text(
    public.cadde_attr_text(p_uid, 'country'),
    public.cadde_attr_text(p_uid, 'city')
  ) r;
end;
$fn$;

comment on function public.cadde_resolve_viewer_location(uuid) is
  'Profil ülke/şehir metnini Cadde katalog id''lerine çevirir. Gövde cadde_resolve_location_text''e taşındı (20260806140000); list_cadde_feed_v1 için davranış değişmedi.';

-- -----------------------------------------------------------------------------
-- 3) Kartın veri kaynağı
-- -----------------------------------------------------------------------------
create or replace function public.get_cadde_feed_reach_v1()
    returns jsonb
    language plpgsql
    stable
    security definer
    set search_path to 'public'
    as $fn$
declare
  v_uid uuid := auth.uid();
  v_country_id uuid;
  v_city_id uuid;
  v_country_name text;
  v_city_name text;
  v_raw_country text;
  v_raw_city text;
  v_members int := 0;
  v_same_city int := 0;
  v_same_country int := 0;
  v_unresolved int := 0;
begin
  if v_uid is null then
    return jsonb_build_object('signedIn', false);
  end if;

  select r.out_country_id, r.out_city_id into v_country_id, v_city_id
  from public.cadde_resolve_viewer_location(v_uid) r;

  v_raw_country := nullif(trim(coalesce(public.cadde_attr_text(v_uid, 'country'), '')), '');
  v_raw_city    := nullif(trim(coalesce(public.cadde_attr_text(v_uid, 'city'), '')), '');

  select c.name into v_country_name from public.cadde_countries c where c.id = v_country_id;
  select ci.name into v_city_name  from public.cadde_cities ci where ci.id = v_city_id;

  -- DISTINCT-FIRST sayım. Kategoriler birbirini DIŞLAR ve list_cadde_feed_v1
  -- görünürlük kapısının dal sırasıyla aynıdır: şehir -> ülke -> çözülemeyen.
  with ham as (
    select u.id as uid,
           nullif(btrim(max(case when a.key = 'country' then upa.value_text end)), '') as ulke,
           nullif(btrim(max(case when a.key = 'city'    then upa.value_text end)), '') as sehir
    from auth.users u
    left join public.user_profile_attributes upa on upa.user_id = u.id
    left join public.afs_attributes a on a.id = upa.attribute_id and a.key in ('country', 'city')
    group by u.id
  ),
  tekil as (
    select distinct ulke, sehir from ham
  ),
  cozum as (
    select t.ulke, t.sehir, r.out_country_id as ulke_id, r.out_city_id as sehir_id
    from tekil t
    cross join lateral public.cadde_resolve_location_text(t.ulke, t.sehir) r
  )
  select
    count(*),
    count(*) filter (where v_city_id is not null and c.sehir_id = v_city_id),
    count(*) filter (where (v_city_id is null or c.sehir_id is distinct from v_city_id)
                       and v_country_id is not null and c.ulke_id = v_country_id),
    count(*) filter (where c.ulke_id is null and c.sehir_id is null)
  into v_members, v_same_city, v_same_country, v_unresolved
  from ham h
  join cozum c
    on c.ulke is not distinct from h.ulke
   and c.sehir is not distinct from h.sehir;

  return jsonb_build_object(
    'signedIn', true,
    'resolved', (v_country_id is not null or v_city_id is not null),
    'countryName', v_country_name,
    'cityName', v_city_name,
    'rawCountry', v_raw_country,
    'rawCity', v_raw_city,
    'reach', jsonb_build_object(
      'sameCity', v_same_city,
      'sameCountry', v_same_country,
      'unresolved', v_unresolved,
      'total', v_same_city + v_same_country + v_unresolved,
      'members', v_members
    ),
    'thresholds', jsonb_build_object(
      'enabled', public.cadde_setting_bool('cadde.global.enabled', true),
      'minReactions', public.cadde_setting_int('cadde.global.min_reactions', 10),
      'minComments', public.cadde_setting_int('cadde.global.min_comments', 5),
      'minShares', public.cadde_setting_int('cadde.global.min_shares', 10)
    )
  );
end;
$fn$;

comment on function public.get_cadde_feed_reach_v1() is
  'Cadde "Akışın nasıl şekilleniyor?" kartı: izleyicinin çözülmüş konumu + paylaşımının potansiyel erişimi (kaç üyenin akışına girebilir) + global eşik ayarları. Sayım distinct-first, geo_cities''e satır başına fonksiyon uygulanmaz.';

revoke all on function public.get_cadde_feed_reach_v1() from public;
grant all on function public.get_cadde_feed_reach_v1() to authenticated;
grant all on function public.get_cadde_feed_reach_v1() to service_role;

-- -----------------------------------------------------------------------------
-- 4) SÜRÜM KAYDI — işin kendisiyle aynı transaction'da (dört kez unutuldu, bkz. CLAUDE.md)
-- -----------------------------------------------------------------------------
insert into supabase_migrations.schema_migrations (version, name)
values ('20260806140000', 'cadde_feed_reach_rpc')
on conflict (version) do nothing;

commit;

-- Geri alma: get_cadde_feed_reach_v1 ve cadde_resolve_location_text DROP edilir,
-- cadde_resolve_viewer_location gövdesi 20260805120000'den geri yüklenir.
