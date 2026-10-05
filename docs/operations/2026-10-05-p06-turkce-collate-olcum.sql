-- P06 · Türkçe collate ölçümü — SALT-OKUNUR (yazma yok, büyük tablo yok)
-- Çalıştır: PGCLIENTENCODING=UTF8 psql ... -f docs/operations/2026-10-05-p06-turkce-collate-olcum.sql
-- Neden: A08c (29.09) yalnız TEK HARF çiftleri ölçtü (c<ç, s<ş …). ICU en_US Türkçe harfleri
-- AYRI HARF değil, AKSANLI varyant sayar; fark tek harfte görünmez, KELİMEDE görünür
-- ("Cuma" < "Çay" Türkçede doğru, en_US'te tersi). Bu dosya kelime çiftleriyle ölçer.
\pset pager off

select datname, datcollate, datlocprovider, datcollversion
  from pg_database where datname = current_database();
select collname, collprovider from pg_collation
 where collname in ('tr-TR-x-icu', 'en-US-x-icu') order by 1;

-- Türkçe doğru sıra: her çiftte SOL < SAĞ olmalı
with p(a, b) as (values
  ('Cuma', 'Çay'), ('Su', 'Şeker'), ('Ok', 'Ödül'), ('Uzun', 'Ümit'),
  ('Gaz', 'Ğa'), ('ılık', 'ip'), ('Isparta', 'İzmir'))
select a, b,
       (a < b)                             as varsayilan_dogru,
       (a collate "tr-TR-x-icu" < b collate "tr-TR-x-icu") as tr_icu_dogru
  from p;

-- Küçük gerçek tablo (54 satır): varsayılan ile tr-TR-x-icu kaç satırda ayrışıyor
select count(*) as satir,
       count(*) filter (where r_def <> r_tr) as farkli_konum
  from (select name,
               row_number() over (order by name) as r_def,
               row_number() over (order by name collate "tr-TR-x-icu") as r_tr
          from cadde_cities) x;
