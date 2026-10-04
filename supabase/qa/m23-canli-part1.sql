-- M23 · Faz 2 CANLI doğrulama — BÖLÜM 1: canlı ölçüm verisi (test üyesi + talep
-- + ilgi kaydı + outbox test satırı [admin adresi, KR09/G23 deseni]).
-- ⚠️ Bu betik CANLIYA yazar; ölçüm tamamlanınca m23-part4 (temizlik) koşulur.
-- Talep BİLEREK eşleşmeyen geo ile açılır (ZZ/M23TestSehir) — gerçek üyelere
-- bildirim TETİKLENMEZ; gerçek gönderim outbox test satırıyla ÖLÇÜLÜR (alıcı
-- admin adresi). RPC-yazma yolu (create → eşleşen pro'ya satır) M22 kabulünde
-- K6 ile rollback'te ölçüldü; burada CANLI RPC çağrısının kendisi ölçülür.
\set ON_ERROR_STOP on

begin;

-- Önceki koşu kalıntısı varsa temizle (idempotent başlangıç).
delete from public.notification_email_outbox where dedupe_key like 'm23-canli%';
delete from auth.users where email = 'm23-uye@test.local';

-- Test üyesi (sabit uuid — sonraki bölümler aynı id'yi kullanır).
insert into auth.users (id, email)
values ('00000000-0000-4000-8000-000000000023', 'm23-uye@test.local');

-- Üye oturumu simülasyonu (transaction-scoped; commit sonrası etkisi yok).
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-000000000023"}', true);

-- (2) ÜYE TALEP AÇIYOR — canlı RPC çağrısı (eşleşmeyen geo → 0 bildirim satırı).
select public.create_recommendation_request_v1(
  'M23 doğrulama talebi',
  'Faz 2 canlı doğrulama talebi — ölçüm tamamlandığında silinecek.',
  'm23dogrulama', 'ZZ', 'M23TestSehir', 'tr'
) as olusan_talep_id;

-- (4) KİLİTLİ KUTU KAYDI — canlı RPC çağrısı (feature_interest 'pro.inbox').
select public.register_feature_interest('pro.inbox') as ilgi_sonucu;

-- (3) Bildirim GÖNDERİM ölçümü için outbox test satırı — alıcı ADMIN adresi
-- (gerçek üye spamlenmez; G23 "8 test satırı (admin adresi)" deseni).
insert into public.notification_email_outbox (event_type, dedupe_key, payload)
values (
  'recommendation_match',
  'm23-canli-dogrulama-1',
  jsonb_build_object(
    'email', 'burakakcakanat@gmail.com',
    'pro_name', 'M23 Test Profesyoneli',
    'request_id', (select id from public.recommendation_requests
                    where user_id = '00000000-0000-4000-8000-000000000023' limit 1),
    'request_title', 'M23 doğrulama talebi',
    'request_city', 'M23TestSehir',
    'request_country', 'ZZ'
  )
);

commit;

\echo '== BOLUM 1 olcumleri (canli) =='
select 'OLCUM2-talep' as ne, id::text, status, city, country, category_slug
from public.recommendation_requests
where user_id = '00000000-0000-4000-8000-000000000023';

select 'OLCUM4-ilgi' as ne, feature_key, user_id::text
from public.feature_interest
where user_id = '00000000-0000-4000-8000-000000000023';

select 'OLCUM3-outbox-bekliyor' as ne, event_type, status, dedupe_key, (payload->>'email') as alici
from public.notification_email_outbox
where dedupe_key = 'm23-canli-dogrulama-1';

-- Eşleşmeyen talep GERÇEK üyelere bildirim tetiklemedi (spam yok ölçümü).
select 'OLCUM2-yan-etki-0' as ne, count(*) as talep_rpc_uretimi_satir
from public.notification_email_outbox
where event_type = 'recommendation_match'
  and dedupe_key <> 'm23-canli-dogrulama-1'
  and payload->>'request_title' = 'M23 doğrulama talebi';
