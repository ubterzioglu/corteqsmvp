-- M25 kabul testi (geri alınan işlem).
\set ON_ERROR_STOP on
begin;

create temp table r(no int, ad text, sonuc text) on commit drop;

insert into r select 0,'ONCE · outboxta weekly_city_digest satiri',
  (select count(*)::text from notification_email_outbox where event_type='weekly_city_digest');

\i supabase/migrations/applied/20261004130000_weekly_city_digest.sql

create temp table fx(k text primary key, v uuid) on commit drop;
insert into auth.users(id,email) values
  (gen_random_uuid(),'m25-dolu@test.local'),
  (gen_random_uuid(),'m25-bos@test.local');
insert into fx select split_part(email,'@',1), id from auth.users where email like 'm25-%@test.local';

-- Iki gercek sehir al
insert into fx select 'sehir1', id from geo_cities where is_active order by sort_order, name limit 1;
insert into fx select 'sehir2', id from (select id from geo_cities where is_active order by sort_order, name offset 1 limit 1) s;

insert into user_city_follows(user_id, city_id)
  values ((select v from fx where k='m25-dolu'), (select v from fx where k='sehir1')),
         ((select v from fx where k='m25-bos'),  (select v from fx where k='sehir2'));

-- sehir1 icin icerik uret; sehir adini BUYUK HARFE cevirerek yaz ki
-- normalizasyon gercekten sinansin (ham `=` ile eslesmezdi).
insert into events(id, user_id, title, description, category, event_date, status, city, country, type)
select gen_random_uuid(), (select v from fx where k='m25-dolu'), 'M25 Etkinlik',
       'kabul testi kaydi', 'egitim', current_date + 7, 'published',
       upper((select name from geo_cities where id=(select v from fx where k='sehir1'))),
       'Almanya', 'online';

insert into r select 1,'K1 kill switch KAPALI iken 0 doner ve satir yazmaz',
  case when public.enqueue_weekly_city_digest() = 0
        and (select count(*) from notification_email_outbox where event_type='weekly_city_digest')=0
       then 'GECTI' else '!!! DUSTU' end;

-- Bayragi ac
update notification_settings set value='true'::jsonb where key='email.weekly_city_digest.enabled';

create temp table sonuc(n int) on commit drop;
insert into sonuc select public.enqueue_weekly_city_digest();

insert into r select 2,'K2 bayrak ACIK: icerigi olan uyeye TEK satir',
  case when (select n from sonuc)=1 then 'GECTI' else '!!! DUSTU: '||(select n from sonuc)::text end;

insert into r select 3,'K3 icerigi OLMAYAN uyeye satir ACILMADI (G23 dersi)',
  case when not exists (select 1 from notification_email_outbox
        where event_type='weekly_city_digest'
          and payload->>'user_id' = (select v from fx where k='m25-bos')::text)
       then 'GECTI' else '!!! DUSTU' end;

insert into r select 4,'K4 normalizasyon calisti (BUYUK HARFLI sehir eslesti)',
  case when (select jsonb_array_length(payload->'events') from notification_email_outbox
             where event_type='weekly_city_digest'
               and payload->>'user_id'=(select v from fx where k='m25-dolu')::text) = 1
       then 'GECTI' else '!!! DUSTU' end;

insert into r select 5,'K5 dedupe: ayni hafta ikinci cagri satir EKLEMEZ',
  case when public.enqueue_weekly_city_digest() = 0
        and (select count(*) from notification_email_outbox where event_type='weekly_city_digest')=1
       then 'GECTI' else '!!! DUSTU' end;

insert into r select 6,'K6 dedupe_key ISO hafta iceriyor',
  case when (select dedupe_key from notification_email_outbox where event_type='weekly_city_digest' limit 1)
            like 'weekly_city_digest:%:'||to_char(now() at time zone 'UTC','IYYY"-W"IW')
       then 'GECTI' else '!!! DUSTU' end;

insert into r select 7,'K7 payload haftayi ve sehirleri tasiyor',
  case when (select payload ? 'week' and payload ? 'cities' and payload ? 'unmatched_cities'
             from notification_email_outbox where event_type='weekly_city_digest' limit 1)
       then 'GECTI' else '!!! DUSTU' end;

insert into r select 8,'K8 cron isi kuruldu (haftalik)',
  case when exists (select 1 from cron.job where jobname='weekly-city-digest' and schedule='0 5 * * 1')
       then 'GECTI' else '!!! DUSTU' end;

insert into r select 9,'K9 anon ve authenticated CAGIRAMAZ',
  case when not has_function_privilege('anon','public.enqueue_weekly_city_digest()','execute')
        and not has_function_privilege('authenticated','public.enqueue_weekly_city_digest()','execute')
       then 'GECTI' else '!!! DUSTU' end;

insert into r select 10,'K10 outbox tipi gecerli (M24 CHECK genislemesi calisiyor)',
  case when (select event_type from notification_email_outbox
             where event_type='weekly_city_digest' limit 1)='weekly_city_digest'
       then 'GECTI' else '!!! DUSTU' end;

\echo ''
\echo '============ M25 KABUL ============'
select * from r order by no;
select case when count(*) filter (where sonuc like 'GECTI%' or no=0)=count(*)
            then 'TUMU GECTI: '||(count(*)-1)::text
            else '!!! '||(count(*) filter (where sonuc not like 'GECTI%' and no<>0))::text||' DUSTU' end as ozet
from r;

rollback;
\echo '== ROLLBACK =='
