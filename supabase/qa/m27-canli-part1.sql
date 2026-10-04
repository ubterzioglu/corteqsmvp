-- M27 · Faz 4 CANLI doğrulama — BÖLÜM 1: tohum + anahtar AÇ + elle enqueue.
--
-- 🔴 "cron yeşil" KANIT DEĞİL (Radar dersi 28.09/30.09): kanıt = gerçek outbox
-- satırı + drenaj sonrası status='sent' + DOLU sent_at + BOŞ last_error (BÖLÜM 2).
-- 🔴 Gerçek üyelere YAN ETKİ YOK: tohum tavsiye satırı DOĞRUDAN insert edilir
-- (RPC yolu recommendation_match maili tetiklerdi — Dortmund'lu gerçek üyeler
-- spamlenirdi). Takip canlıda 0'dı; özeti YALNIZ test kullanıcısı alır.
-- 🔴 Alıcı GERÇEK posta kutusu: Gmail plus-adresleme (burakakcakanat+m27test@
-- gmail.com → Burak'ın kutusuna düşer) — "gerçek mail test hesabına ulaştı"
-- kabulü sahte adresle değil GERÇEK gönderimle ölçülür.
-- ⚠️ Anahtar (email.weekly_city_digest.enabled) bu bölümde AÇILIR; drenaj
-- ölçümünden sonra BÖLÜM 2'de KAPALI'ya döndürülür (G22/G17: açma İNSAN kararı).
\set ON_ERROR_STOP on
begin;

-- Önceki koşu kalıntısı (idempotent başlangıç).
delete from public.notification_email_outbox where dedupe_key like 'weekly_city_digest:00000000-0000-4000-8000-000000000027:%';
delete from public.recommendation_requests where user_id='00000000-0000-4000-8000-000000000027';
delete from public.user_city_follows where user_id='00000000-0000-4000-8000-000000000027';
delete from auth.users where id='00000000-0000-4000-8000-000000000027';

-- Test üyesi (sabit uuid; GERÇEK posta kutusuna plus-adresle teslim).
insert into auth.users (id, email)
values ('00000000-0000-4000-8000-000000000027', 'burakakcakanat+m27test@gmail.com');

-- Takip: Dortmund (geo_cities FK — M24 şeması).
insert into public.user_city_follows (user_id, city_id)
values ('00000000-0000-4000-8000-000000000027', 'c7c1381a-7451-492e-bdaa-86b033b477b2');

-- Taze tavsiye talebi (Dortmund, open, şimdi) — DOĞRUDAN insert (yan etki yok).
insert into public.recommendation_requests
  (user_id, title, body, category_slug, country, city, status, diaspora_key)
values
  ('00000000-0000-4000-8000-000000000027',
   'M27 özet doğrulama talebi',
   'Haftalık şehir özeti canlı doğrulaması — ölçüm sonrası silinecek.',
   'm27ozet', 'DE', 'Dortmund', 'open', 'tr');

-- Kill switch GEÇİCİ açık (bölüm 2'de kapatılır).
update public.notification_settings set value='true'::jsonb
 where key='email.weekly_city_digest.enabled';

commit;

\echo '== BOLUM 1a: ilk enqueue (1 satir beklenir) =='
select public.enqueue_weekly_city_digest() as ilk_enqueue;

\echo '== BOLUM 1b: ikinci enqueue (dedupe — 0 beklenir) =='
select public.enqueue_weekly_city_digest() as ikinci_enqueue;

\echo '== BOLUM 1c: outbox satiri olcumu =='
select event_type, status, dedupe_key,
       payload->>'week' as hafta,
       payload->'cities' as sehirler,
       jsonb_array_length(payload->'recommendations') as tavsiye_n,
       jsonb_array_length(payload->'events') as etkinlik_n,
       (payload ? 'email') as payload_email_var -- FALSE olmali (M25 kurali)
from public.notification_email_outbox
where dedupe_key like 'weekly_city_digest:00000000-0000-4000-8000-000000000027:%';
