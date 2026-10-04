-- M25 — Haftalık şehir özeti, Migration 2: `enqueue_weekly_city_digest()` + pg_cron.
--
-- ── ÖLÇÜM (04.10, yazmadan önce) ────────────────────────────────────────────
--   events.city ......................... **text** (country/city/location hepsi text)
--   recommendation_requests.city ........ **text**, status ∈ open|answered|closed
--   user_city_follows.city_id ........... **uuid FK → geo_cities** (M24)
--   pg_cron ............................. 12 aktif iş · `notification-email-drain` */15
--   Son 7 günde: 0 yayımlanmış etkinlik · 0 tavsiye · 0 takip (henüz yüzey yok)
--
-- 🔴 BU BATCH'İN ASIL ZORLUĞU — İKİ AYRI KONUM TEMSİLİ:
--    Takip tarafı `geo_cities`'e FK (M24, bilinçli), içerik tarafı SERBEST METİN.
--    Ham `=` ile eşleştirmek `Münih` ≠ `München` ≠ `munih` üçlüsünü ıskalardı —
--    Cadde'de aylarca sessiz kusur üreten durumun birebir aynısı (CLAUDE.md
--    Cadde bölümü, "fold-insensitive eşleşme" olayı).
--    Bu yüzden eşleşme `catalog_search_normalize()` (= lower(unaccent(...)))
--    üzerinden yapılır. ⚠️ Yine de SÖZLÜK farkını (Münih↔München) kapatmaz;
--    o veri işidir (Cadde'de `20260805140000` ile elle onarılmıştı). Özet bu
--    yüzden eşleşmeyen şehri SESSİZCE atlamaz — `payload.unmatched_cities`
--    alanına yazar ki kusur görünür olsun.
--
-- ⚠️ 1 GB RAM: `geo_cities` 76.992 satır. Normalleştirme ASLA tüm tabloya
--    uygulanmaz; önce `user_city_follows` ile sınırlanır (bugün 0, tavan
--    `weekly_city_digest.max_follows_per_user`=10 × üye sayısı).
--
-- ⚠️ G23 DERSİ: içeriği olmayan üyeye SATIR AÇILMAZ. Boş özet maili, maili
--    tamamen değersizleştirir ve spam şikâyeti üretir.
--
-- ⚠️ G22/G17 DERSİ: kill switch `email.weekly_city_digest.enabled` (M24'te
--    `false` doğdu). Bayrak kapalıyken fonksiyon 0 döner ve HİÇBİR ŞEY yazmaz.
--    Cron bugünden kurulur ama bayrak açılana kadar etkisizdir.

create or replace function public.enqueue_weekly_city_digest()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_enabled boolean;
  v_week    text := to_char(now() at time zone 'UTC', 'IYYY"-W"IW');
  v_count   integer := 0;
begin
  -- Kill switch. Kapalıyken sessizce 0 — cron'un koşması zarar vermez.
  select coalesce((value #>> '{}')::boolean, false) into v_enabled
    from public.notification_settings
   where key = 'email.weekly_city_digest.enabled';

  if not coalesce(v_enabled, false) then
    return 0;
  end if;

  with takip as (
    -- Takip edilen şehirler. geo_cities'e JOIN burada ve YALNIZ burada olur;
    -- normalleştirme bu küçük kümeye uygulanır, 76.992 satıra DEĞİL.
    select f.user_id,
           c.name                                   as city_name,
           public.catalog_search_normalize(c.name)  as city_norm
      from public.user_city_follows f
      join public.geo_cities c on c.id = f.city_id
  ),
  yeni_etkinlik as (
    select public.catalog_search_normalize(e.city) as city_norm,
           e.id, e.title
      from public.events e
     where e.status = 'published'
       and e.created_at > now() - interval '7 days'
       and nullif(btrim(coalesce(e.city, '')), '') is not null
  ),
  yeni_tavsiye as (
    select public.catalog_search_normalize(rr.city) as city_norm,
           rr.id, rr.title
      from public.recommendation_requests rr
     where rr.status = 'open'
       and rr.created_at > now() - interval '7 days'
       and nullif(btrim(coalesce(rr.city, '')), '') is not null
  ),
  kullanici_ozeti as (
    select t.user_id,
           jsonb_agg(distinct jsonb_build_object('city', t.city_name)) as cities,
           coalesce(jsonb_agg(distinct jsonb_build_object('id', e.id, 'title', e.title))
                    filter (where e.id is not null), '[]'::jsonb)      as events,
           coalesce(jsonb_agg(distinct jsonb_build_object('id', r.id, 'title', r.title))
                    filter (where r.id is not null), '[]'::jsonb)      as recommendations,
           -- Eşleşmeyen şehirleri GÖRÜNÜR yap (sözlük farkı sessizce yutulmasın).
           coalesce(jsonb_agg(distinct t.city_name)
                    filter (where e.id is null and r.id is null), '[]'::jsonb) as unmatched_cities
      from takip t
      left join yeni_etkinlik e on e.city_norm = t.city_norm
      left join yeni_tavsiye  r on r.city_norm = t.city_norm
     group by t.user_id
  )
  insert into public.notification_email_outbox (event_type, dedupe_key, payload, status)
  select 'weekly_city_digest',
         'weekly_city_digest:' || k.user_id::text || ':' || v_week,
         jsonb_build_object(
           'user_id', k.user_id,
           'week',    v_week,
           'cities',  k.cities,
           'events',  k.events,
           'recommendations', k.recommendations,
           'unmatched_cities', k.unmatched_cities
         ),
         'pending'
    from kullanici_ozeti k
   -- İÇERİĞİ OLMAYANA SATIR AÇILMAZ (G23 dersi).
   where jsonb_array_length(k.events) > 0
      or jsonb_array_length(k.recommendations) > 0
   on conflict (dedupe_key) do nothing;

  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

comment on function public.enqueue_weekly_city_digest() is
  'Haftalık şehir özetini outbox''a yazar (kullanıcı başına TEK satır, '
  'dedupe_key = user_id + ISO hafta). İçeriği olmayan üyeye satır AÇMAZ. '
  '`email.weekly_city_digest.enabled` kapalıyken 0 döner. Şehir eşleşmesi '
  'catalog_search_normalize üzerinden yapılır — ham `=` KULLANMA.';

revoke all on function public.enqueue_weekly_city_digest() from public, anon, authenticated;

-- ── pg_cron: haftada bir, pazartesi 05:00 UTC ───────────────────────────────
-- Gönderimi mevcut `notification-email-drain` (*/15) yapar; bu iş yalnız
-- kuyruğa yazar. ⚠️ "cron yeşil" KANIT DEĞİLDİR (Radar dersi) — M27 gerçek
-- outbox satırını ve dolu `sent_at`'i ölçecek.
select cron.unschedule('weekly-city-digest')
 where exists (select 1 from cron.job where jobname = 'weekly-city-digest');

select cron.schedule(
  'weekly-city-digest',
  '0 5 * * 1',
  $cron$ select public.enqueue_weekly_city_digest(); $cron$
);
