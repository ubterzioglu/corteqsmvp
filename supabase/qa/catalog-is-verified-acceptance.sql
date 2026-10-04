-- `catalog_items.is_verified` türetilmiş alan — kabul testi (geri alınan işlem).
\set ON_ERROR_STOP on
begin;

create temp table r(no int, ad text, sonuc text) on commit drop;

-- ÖNCE: ayrışma var mı?
insert into r select 0,'ONCE · ayrisan kayit sayisi',
  (select count(*)::text from catalog_items
   where is_verified is distinct from (verification_status='verified'))||' adet';

\i supabase/migrations/applied/20261004100000_catalog_is_verified_derived.sql

insert into r select 1,'K1 ayrisma SIFIRLANDI',
  case when (select count(*) from catalog_items
             where is_verified is distinct from (verification_status='verified'))=0
       then 'GECTI' else '!!! DUSTU' end;

insert into r select 2,'K2 trigger kuruldu',
  case when exists (select 1 from pg_trigger t join pg_class c on c.oid=t.tgrelid
        where c.relname='catalog_items' and t.tgname='trg_catalog_items_sync_is_verified'
          and not t.tgisinternal) then 'GECTI' else '!!! DUSTU' end;

insert into r select 3,'K3 kayit sayisi degismedi (hicbir satir silinmedi)',
  case when (select count(*) from catalog_items)=651 then 'GECTI'
       else '!!! DUSTU: '||(select count(*) from catalog_items)::text end;

-- Davranış testleri — kendi kurgumuz üzerinde.
create temp table fx(k text primary key, v uuid) on commit drop;
insert into catalog_items(id,slug,title,item_type,platform_role_key,verification_status)
  values (gen_random_uuid(),'isver-kabul','ISVER','organization','Organization_AssociationFoundation','unverified');
insert into fx select 'it', id from catalog_items where slug='isver-kabul';

insert into r select 4,'K4 INSERT: unverified -> is_verified false',
  case when (select is_verified from catalog_items where slug='isver-kabul')=false
       then 'GECTI' else '!!! DUSTU' end;

-- G07'nin yaptigi sey: yalniz verification_status yaziyor.
update catalog_items set verification_status='verified' where slug='isver-kabul';
insert into r select 5,'K5 G07 yolu: status verified -> is_verified TRUE (ASIL KUSUR)',
  case when (select is_verified from catalog_items where slug='isver-kabul')=true
       then 'GECTI' else '!!! DUSTU' end;

update catalog_items set verification_status='claimed' where slug='isver-kabul';
insert into r select 6,'K6 geri alinabilir: claimed -> is_verified false',
  case when (select is_verified from catalog_items where slug='isver-kabul')=false
       then 'GECTI' else '!!! DUSTU' end;

-- Elle yanlis yazma denemesi.
update catalog_items set is_verified=true where slug='isver-kabul';
insert into r select 7,'K7 elle is_verified=true YOK SAYILIR (status claimed)',
  case when (select is_verified from catalog_items where slug='isver-kabul')=false
       then 'GECTI' else '!!! DUSTU' end;

update catalog_items set verification_status='verified', is_verified=false where slug='isver-kabul';
insert into r select 8,'K8 celiskili yazimda status KAZANIR',
  case when (select is_verified from catalog_items where slug='isver-kabul')=true
       then 'GECTI' else '!!! DUSTU' end;

insert into catalog_items(id,slug,title,item_type,platform_role_key,verification_status,is_verified)
  values (gen_random_uuid(),'isver-kabul2','ISVER2','organization','Organization_AssociationFoundation','unverified',true);
insert into r select 9,'K9 INSERT''te de elle deger yok sayilir',
  case when (select is_verified from catalog_items where slug='isver-kabul2')=false
       then 'GECTI' else '!!! DUSTU' end;

-- Halka yanlis rozet gosteren iki grup duzeldi mi?
insert into r select 10,'K10 iki grubun yanlis rozeti kalkti',
  case when (select count(*) from catalog_items
             where slug in ('hcd-bilinc-cozumleme-butunsel-gelisim-genel',
                            'shaman-kocluk-ve-stratejik-danismanlik-toplulugu-genel')
               and is_verified)=0 then 'GECTI' else '!!! DUSTU' end;

insert into r select 11,'K11 gercek verified kayitlar KORUNDU',
  case when (select count(*) from catalog_items where verification_status='verified' and is_verified)
            = (select count(*) from catalog_items where verification_status='verified')
       then 'GECTI' else '!!! DUSTU' end;

\echo ''
\echo '======== is_verified TURETILMIS ALAN — KABUL ========'
select * from r order by no;
select case when count(*) filter (where sonuc like 'GECTI%' or no=0)=count(*)
            then 'TUMU GECTI: '||(count(*)-1)::text
            else '!!! '||(count(*) filter (where sonuc not like 'GECTI%' and no<>0))::text||' DUSTU' end as ozet
from r;

rollback;
\echo '== ROLLBACK =='
