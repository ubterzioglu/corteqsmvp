-- M27 · weekly_city_digest alıcı çözümü SQL'e taşınır (G23 deseni) — CANLI
-- doğrulamanın bulduğu gerçek kusurun düzeltmesi.
--
-- ═══ ÖLÇÜLEN KUSUR (04.10, M27 canlı turu) ═══
-- M26'da alıcı edge tarafında `admin.auth.admin.getUserById(payload.user_id)`
-- ile çözülüyordu (M25 payload'ı email taşımıyordu). CANLI drenajda satır
-- `no_recipient_email` ile SKIP düştü — kullanıcı satırı TAMAMLANMIŞ (aud/role/
-- instance_id/created_at dolu, email var) olduğu halde. Sebep: ortamdaki
-- `sb_secret_*` anahtarı GoTrue admin uçlarında REDDEDİLİYOR ("Forbidden use
-- of secret API key" 401 — curl ile de ölçüldü). PostgREST/RPC çağrıları aynı
-- anahtarla ÇALIŞIYOR (claim/update akıyor), yalnız auth.admin API'si kapalı.
--
-- ═══ ÇÖZÜM: G23'ÜN KANITLI DESENİ ═══
-- `enqueue_group_notification` alıcı mailini SQL'de `auth.users`'tan çözer ve
-- payload'a koyar; o hat G23'te 8/8 `sent` ölçtü, M22 recommendation_match aynı
-- desenle M23'te `sent+sent_at` ölçtü. weekly_city_digest aynı desene geçer:
--   • email ENQUEUE ANINDA auth.users'tan çözülür (join), payload'a yazılır
--   • maili OLMAYAN takipçiye satır YAZILMAZ (G23 kuralı: gönderilemeyene kuyruk
--     satırı açma — drenajda skip gürültüsü üretme)
--   • KALAN HER ŞEY M25 ile birebir: kill switch · dedupe (user_id+ISO hafta) ·
--     içeriği olmayana satır YOK · catalog_search_normalize eşleşmesi ·
--     unmatched_cities görünürlüğü · limit/direnç kuralları.
-- M25 kabulü (weekly-city-digest-acceptance.sql 10/10) ek alanla KIRILMAZ
-- (alan yokluğunu değil varlığını kilitler) — yeniden koşulup doğrulanır.
--
-- ⚠️ Edge tarafı aynı batch'te güncellenir: weekly_city_digest `directEvents`'e
-- girer (payload.email yolu), getUserById dalı KALDIRILIR + edge DEPLOY edilir
-- (M23 dersi: commit ≠ canlı).

begin;

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
    -- Takip edilen şehirler + ALICI MAILİ (SQL'de çözülür — G23 deseni;
    -- edge'in auth.admin API'si sb_secret anahtarıyla ÇALIŞMIYOR, M27 ölçümü).
    -- geo_cities JOIN'i YALNIZ burada; normalleştirme bu küçük kümeye uygulanır,
    -- 76.992 satıra DEĞİL (1 GB RAM kuralı).
    select f.user_id,
           au.email                                 as email,
           c.name                                   as city_name,
           public.catalog_search_normalize(c.name)  as city_norm
      from public.user_city_follows f
      join public.geo_cities c on c.id = f.city_id
      join auth.users au on au.id = f.user_id
     where au.email is not null and btrim(au.email) <> ''  -- mailsiz satır YAZILMAZ (G23)
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
           max(t.email) as email,
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
           'email',   k.email,   -- M27: alıcı SQL'de çözülür (G23 deseni)
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
  'dedupe_key = user_id + ISO hafta). İçeriği olmayana ve MAILİ olmayana satır '
  'AÇMAZ. email ENQUEUE ANINDA auth.users''tan çözülür (M27: edge auth.admin '
  'API''si sb_secret anahtarıyla çalışmıyor — G23 desenine geçildi). '
  '`email.weekly_city_digest.enabled` kapalıyken 0 döner. Şehir eşleşmesi '
  'catalog_search_normalize üzerinden — ham `=` KULLANMA.';

commit;
