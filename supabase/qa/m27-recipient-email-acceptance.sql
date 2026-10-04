-- M27 · alıcı-email çözümü kabulü (mig 20261004180000 — G23 deseni).
-- M25 kabulü (10/10) kill switch/dedupe/ içerik kurallarını zaten kilitler; bu
-- dosya YENİ davranışı kilitler: payload.email SQL'de çözülür · maili OLMAYAN
-- takipçiye satır YAZILMAZ (gönderilemeyene kuyruk satırı açma — skip gürültüsü
-- ve "no_recipient_email" mezarlığı üretme). Geri alınan işlem.
-- 📌 Gerçek GÖNDERİM kanıtı (sent+sent_at) KALANLAR'da: bu betik rollback'lidir,
-- SMTP'ye dokunmaz; drenaj ölçümü M27 canlı turunda ayrıca yapıldı.
\set ON_ERROR_STOP on
begin;

update public.notification_settings set value='true'::jsonb
 where key='email.weekly_city_digest.enabled';

insert into auth.users (id, email) values
  ('00000000-0000-4000-8000-0000000000a1', 'm27-maili-var@test.local'),
  ('00000000-0000-4000-8000-0000000000a2', ''),
  ('00000000-0000-4000-8000-0000000000a3', 'm27-iceriksiz@test.local');
insert into public.user_city_follows (user_id, city_id) values
  ('00000000-0000-4000-8000-0000000000a1', 'c7c1381a-7451-492e-bdaa-86b033b477b2'),
  ('00000000-0000-4000-8000-0000000000a2', 'c7c1381a-7451-492e-bdaa-86b033b477b2'),
  -- a3: maili VAR ama şehrinde taze içerik YOK (içerik filtresi kilidi — M25
  -- kabulü bu davranışı kendi dosyasını `\i` ile yeniden uyguladığı için CANLI
  -- fonksiyonda MUTASYON DEDEKTÖRÜ OLAMAZ; kilit burada, canlı fonksiyonda).
  ('00000000-0000-4000-8000-0000000000a3', (select id from public.geo_cities where is_active and id <> 'c7c1381a-7451-492e-bdaa-86b033b477b2' order by sort_order, name limit 1));
insert into public.recommendation_requests
  (user_id, title, body, category_slug, country, city, status, diaspora_key)
values
  ('00000000-0000-4000-8000-0000000000a1', 'M27 kabul talebi', 'Test', 'm27', 'DE', 'Dortmund', 'open', 'tr');

create temp table r(no int, ad text, sonuc text) on commit drop;

do $x$
declare n int; v_email text; n2 int;
begin
  -- K1: enqueue maili OLAN takipçiye TEK satır yazar (mailsiz ELENEREK).
  select public.enqueue_weekly_city_digest() into n;
  insert into r select 1,'K1 enqueue 1 satir (mailsiz takipci elendi)',
    case when n=1 then 'GECTI' else '!!! DUSTU: '||coalesce(n::text,'null') end;

  -- K2: payload.email SQL'de cozuldu (dogru adres).
  select payload->>'email' into v_email from notification_email_outbox
   where dedupe_key like 'weekly_city_digest:00000000-0000-4000-8000-0000000000a1:%';
  insert into r select 2,'K2 payload.email = takipcinin adresi (SQL cozumu)',
    case when v_email='m27-maili-var@test.local' then 'GECTI'
         else '!!! DUSTU: '||coalesce(v_email,'null') end;

  -- K3: maili olmayana satir YOK (G23: gonderilemeyene kuyruk acilmaz).
  select count(*) into n2 from notification_email_outbox
   where dedupe_key like 'weekly_city_digest:00000000-0000-4000-8000-0000000000a2:%';
  insert into r select 3,'K3 mailsiz takipciye satir YOK',
    case when n2=0 then 'GECTI' else '!!! DUSTU: '||n2 end;

  -- K4: dedupe — ayni hafta ikinci cagri 0.
  select public.enqueue_weekly_city_digest() into n;
  insert into r select 4,'K4 dedupe: ikinci enqueue 0',
    case when n=0 then 'GECTI' else '!!! DUSTU: '||n end;

  -- K5: kill switch KAPALI -> 0 (bu turda yine olculur — regresyon kilidi).
  update public.notification_settings set value='false'::jsonb
   where key='email.weekly_city_digest.enabled';
  delete from notification_email_outbox where dedupe_key like 'weekly_city_digest:%a1:%';
  select public.enqueue_weekly_city_digest() into n;
  insert into r select 5,'K5 kill switch KAPALI -> 0 satir',
    case when n=0 then 'GECTI' else '!!! DUSTU: '||n end;

  -- K6: İÇERİK FİLTRESİ (canlı fonksiyonda): maili+takibi olan ama şehrinde
  -- taze içerik OLMAYAN a3'e satır YOK (G23: boş özet maili atılmaz).
  update public.notification_settings set value='true'::jsonb
   where key='email.weekly_city_digest.enabled';
  select count(*) into n2 from notification_email_outbox
   where dedupe_key like 'weekly_city_digest:00000000-0000-4000-8000-0000000000a3:%';
  insert into r select 6,'K6 iceriksiz sehir takipcisine satir YOK (bos ozet maili atilmaz)',
    case when n2=0 then 'GECTI' else '!!! DUSTU: '||n2 end;
  update public.notification_settings set value='false'::jsonb
   where key='email.weekly_city_digest.enabled';
end $x$;

\echo '============ M27 EMAIL-COZUM KABULU (K1-K5) ============'
select * from r order by no;
select case when count(*) filter (where sonuc like 'GECTI%')=count(*)
            then 'TUMU GECTI: '||count(*)::text
            else '!!! '||(count(*) filter (where sonuc not like 'GECTI%'))::text||' DUSTU' end as ozet
from r;
rollback;
\echo '== ROLLBACK =='
select 'CANLI temiz' as ad,
  case when (select count(*) from auth.users where email like 'm27-%@test.local')=0
        and (select count(*) from user_city_follows where user_id::text like '00000000-0000-4000-8000-0000000000a%')=0
        and (select count(*) from notification_email_outbox where dedupe_key ~ 'weekly_city_digest:00000000-0000-4000-8000-0000000000a[123]:')=0
        and (select value::text from notification_settings where key='email.weekly_city_digest.enabled')='false'
       then 'GECTI' else '!!! DUSTU' end as sonuc;
