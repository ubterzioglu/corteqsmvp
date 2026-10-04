-- Herkese açık yüzey tripwire'ı — `public` şemasındaki tabloların anon erişimi.
--
-- NEDEN VAR: 04.10.2026'da `_submission_backfill_log_20260609` tablosunun
-- RLS'siz ve `anon`'a açık olduğu bulundu. 938 satır üye `user_id`'si ve
-- `detail` içindeki `<telefon>@wa.local` e-postaları, her sayfanın
-- `env-config.js`'indeki anon anahtarıyla ANONİM olarak okunabiliyordu
-- (gerçek istekle doğrulandı: HTTP 200, `Content-Range: 0-937/938`).
--
-- Kök neden: tablo tek seferlik bir göçün denetim günlüğü olarak yaratıldı,
-- RLS hiç açılmadı ve "geçici tablo da PostgREST'ten görünür" düşünülmedi.
-- Bu betik o sınıfı kalıcı olarak görünür kılar.
--
-- Kullanım: psql ... -f supabase/qa/public-exposure-tripwire.sql
-- Çıktı boşsa temiz. Dolu dönen her satır İNCELENMELİDİR.

\echo '=== A) RLS KAPALI + anon erisimi OLAN tablolar (en tehlikeli sinif) ==='
\echo '    Beklenen: yalnizca spatial_ref_sys (PostGIS referans verisi, hassas degil)'
select c.relname as tablo,
       has_table_privilege('anon', c.oid,'select') as oku,
       has_table_privilege('anon', c.oid,'insert') as yaz,
       has_table_privilege('anon', c.oid,'update') as guncelle,
       has_table_privilege('anon', c.oid,'delete') as sil,
       (select n_live_tup from pg_stat_user_tables s where s.relname=c.relname) as yaklasik_satir
  from pg_class c join pg_namespace n on n.oid=c.relnamespace
 where n.nspname='public' and c.relkind='r' and not c.relrowsecurity
   and (has_table_privilege('anon', c.oid,'select')
     or has_table_privilege('anon', c.oid,'insert')
     or has_table_privilege('anon', c.oid,'update')
     or has_table_privilege('anon', c.oid,'delete'))
 order by 1;

\echo ''
\echo '=== B) Adi gecici/yedek gorunen ama RLS KAPALI olan tablolar ==='
\echo '    (_bak_, _backup, _tmp, tarih ekli ...) — sizan tablo tam bu sinifti'
select c.relname as tablo, c.relrowsecurity as rls_acik
  from pg_class c join pg_namespace n on n.oid=c.relnamespace
 where n.nspname='public' and c.relkind='r'
   and (c.relname like '\_%' or c.relname like '%backup%' or c.relname like '%\_bak%'
        or c.relname ~ '_20[0-9]{6}$')
   and not c.relrowsecurity
 order by 1;

\echo ''
\echo '=== C) anon YAZMA yetkisi + RLS KAPALI (anonim veri bozabilir) ==='
select c.relname as tablo
  from pg_class c join pg_namespace n on n.oid=c.relnamespace
 where n.nspname='public' and c.relkind='r' and not c.relrowsecurity
   and (has_table_privilege('anon', c.oid,'insert')
     or has_table_privilege('anon', c.oid,'update')
     or has_table_privilege('anon', c.oid,'delete'))
 order by 1;

\echo ''
\echo '=== D) OZET ==='
select count(*) filter (where c.relrowsecurity)                                  as rls_acik,
       count(*) filter (where not c.relrowsecurity)                              as rls_kapali,
       count(*) filter (where not c.relrowsecurity
                          and has_table_privilege('anon', c.oid,'select'))       as RISK_rls_yok_anon_okur,
       count(*)                                                                  as toplam_tablo
  from pg_class c join pg_namespace n on n.oid=c.relnamespace
 where n.nspname='public' and c.relkind='r';
