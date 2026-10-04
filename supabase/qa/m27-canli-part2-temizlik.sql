-- M27 · BÖLÜM 2: ölçüm tamam — anahtar KAPALI'ya döndürülür + tohum temizliği.
-- 🔴 G22/G17: otomatik hat KAPALI doğar; doğrulama bitti, anahtarın AÇILMASI
-- İNSAN kararına sunulur (admin-updates kaydı + KALANLAR kanıt satırı).
-- ⚠️ M23 dersi: auth.users insert'i ASENKRON katalog üretir — temizlik iki
-- geçişli doğrulanır (kalıntı sorgusu sonda).
\set ON_ERROR_STOP on
begin;

-- Anahtar KAPALI'ya (doğrulama sırasında GEÇİCİ açılmıştı).
update public.notification_settings set value='false'::jsonb
 where key='email.weekly_city_digest.enabled';

-- Tohum verisi silinir (KR09 deseni: kanıt = ölçülmüş sayılar, satırlar değil).
delete from public.notification_email_outbox
 where dedupe_key like 'weekly_city_digest:00000000-0000-4000-8000-000000000027:%';
delete from public.recommendation_requests
 where user_id='00000000-0000-4000-8000-000000000027';
delete from public.user_city_follows
 where user_id='00000000-0000-4000-8000-000000000027';

-- Test kullanıcısının otomatik kataloğu (senkron parça).
create temp table m27items on commit drop as
select item_id from public.catalog_item_managers
 where user_id='00000000-0000-4000-8000-000000000027';
delete from public.catalog_search_documents where item_id in (select item_id from m27items);
delete from public.catalog_item_managers where user_id='00000000-0000-4000-8000-000000000027';
delete from public.catalog_items where id in (select item_id from m27items);

delete from auth.users where id='00000000-0000-4000-8000-000000000027';

commit;

\echo '== BOLUM 2 kalinti dogrulamasi (hepsi 0 olmali) =='
select 'anahtar' as ne, value::text from public.notification_settings
 where key='email.weekly_city_digest.enabled'
union all select 'kalan takip', count(*)::text from public.user_city_follows
 where user_id='00000000-0000-4000-8000-000000000027'
union all select 'kalan talep', count(*)::text from public.recommendation_requests
 where user_id='00000000-0000-4000-8000-000000000027'
union all select 'kalan outbox', count(*)::text from public.notification_email_outbox
 where dedupe_key like 'weekly_city_digest:00000000%'
union all select 'kalan kullanici', count(*)::text from auth.users
 where id='00000000-0000-4000-8000-000000000027'
union all select 'kalan katalog', count(*)::text from public.catalog_item_managers
 where user_id='00000000-0000-4000-8000-000000000027';
