-- M23 · BÖLÜM 4: canlı ölçüm temizliği (KR09/G23 deseni — ölçüm bitti, test
-- satırları silinir; kanıt KALANLAR'daki ölçülmüş sayılardır).
\set ON_ERROR_STOP on
begin;

-- Test üyesinin otomatik kataloğu (auth.users trigger'ı üretir) — önce bağ bulunur.
create temp table m23items on commit drop as
select item_id from public.catalog_item_managers
where user_id = '00000000-0000-4000-8000-000000000023';

delete from public.catalog_search_documents where item_id in (select item_id from m23items);
delete from public.catalog_item_managers where user_id = '00000000-0000-4000-8000-000000000023';
delete from public.catalog_items where id in (select item_id from m23items);

-- Outbox test satırı (status='sent' ölçüldü) + test üyesi (cascade: talep + ilgi).
delete from public.notification_email_outbox where dedupe_key like 'm23-canli%';
delete from auth.users where id = '00000000-0000-4000-8000-000000000023';

commit;

\echo '== BOLUM 4 kalinti dogrulamasi (hepsi 0 olmali) =='
select 'kalan talep' as ne, count(*) from public.recommendation_requests
where user_id='00000000-0000-4000-8000-000000000023' or title='M23 doğrulama talebi'
union all
select 'kalan ilgi', count(*) from public.feature_interest
where user_id='00000000-0000-4000-8000-000000000023'
union all
select 'kalan outbox', count(*) from public.notification_email_outbox where dedupe_key like 'm23-canli%'
union all
select 'kalan kullanici', count(*) from auth.users where email='m23-uye@test.local'
union all
select 'kalan katalog', count(*) from public.catalog_item_managers
where user_id='00000000-0000-4000-8000-000000000023';

-- ⚠️ ÖLÇÜLEN TUZAK (04.10): auth.users insert'i TETİKLESENKRON bir katalog
-- profili üretir ("CorteQS Üyesi", slug member-<uid>); silme anında YALNIZ
-- senkron olan yakalanır, asenkron öğe temizlikten SONRA ortaya çıkabilir.
-- Kalıntı 'kalan katalog' > 0 gösterirse aşağıdaki blok ikinci geçiş olarak
-- koşulur (M23'te bir kez gerekti — 6/6 kalıntı 0'a düştü):
--   begin;
--   delete from catalog_search_documents where item_id in
--     (select item_id from catalog_item_managers where user_id='00000000-0000-4000-8000-000000000023');
--   delete from catalog_items where id in
--     (select item_id from catalog_item_managers where user_id='00000000-0000-4000-8000-000000000023');
--   delete from catalog_item_managers where user_id='00000000-0000-4000-8000-000000000023';
--   commit;
