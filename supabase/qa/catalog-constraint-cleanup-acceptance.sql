-- Katalog kısıt temizliği — kabul testi (geri alınan işlem).
-- Çalıştırma: psql ... -f supabase/qa/catalog-constraint-cleanup-acceptance.sql
\set ON_ERROR_STOP on
begin;

create temp table r(no int, ad text, sonuc text) on commit drop;
create temp table fx(k text primary key, v uuid) on commit drop;

insert into auth.users(id,email) values (gen_random_uuid(),'kisit-kabul@test.local');
insert into fx select 'u', id from auth.users where email='kisit-kabul@test.local';
insert into catalog_items(id,slug,title,item_type,platform_role_key)
  values (gen_random_uuid(),'kisit-kabul','KISIT','organization','Organization_AssociationFoundation');
insert into fx select 'it', id from catalog_items where slug='kisit-kabul';

-- Bir rol değerinin yazılabilirliğini ölçer (satırı bırakmaz).
create or replace function pg_temp.rol_yazilabilir(p_rol text) returns boolean
language plpgsql as $f$
declare ok boolean := true;
begin
  insert into public.catalog_item_managers(item_id,user_id,role,status)
  values ((select v from fx where k='it'),(select v from fx where k='u'),p_rol,'active');
  delete from public.catalog_item_managers where item_id=(select v from fx where k='it');
  return ok;
exception when check_violation then return false;
end $f$;

-- ── ÖNCE: çelişki hâlâ duruyor mu? (migration uygulanmadan önce çalıştırılırsa) ──
insert into r select 0,'ÖNCE · ölçüm: admin yazılabilir mi',
  case when pg_temp.rol_yazilabilir('admin') then 'temizlik ZATEN yapılmış' else 'çelişki duruyor (beklenen)' end;

\i supabase/migrations/applied/20261003110000_catalog_constraint_cleanup.sql

-- ── SONRA ────────────────────────────────────────────────────────────────────
insert into r select 1,'K1 eski adlı role kısıtı DÜŞTÜ',
  case when not exists (select 1 from pg_constraint
        where conrelid='public.catalog_item_managers'::regclass
          and conname='catalog_item_memberships_role_check') then 'GECTI' else '!!! DUSTU' end;

insert into r select 2,'K2 yeni adlı role kısıtı DURUYOR',
  case when exists (select 1 from pg_constraint
        where conrelid='public.catalog_item_managers'::regclass
          and conname='catalog_item_managers_role_chk') then 'GECTI' else '!!! DUSTU' end;

insert into r select 3,'K3 mükerrer status kısıtı DÜŞTÜ',
  case when not exists (select 1 from pg_constraint
        where conrelid='public.catalog_item_claims'::regclass
          and conname='catalog_claim_requests_status_check') then 'GECTI' else '!!! DUSTU' end;

insert into r select 4,'K4 kalan status kısıtı DURUYOR',
  case when exists (select 1 from pg_constraint
        where conrelid='public.catalog_item_claims'::regclass
          and conname='catalog_item_claims_status_chk') then 'GECTI' else '!!! DUSTU' end;

insert into r select 5,'K5 role üzerinde artık TEK kısıt var',
  case when (select count(*) from pg_constraint c
             join pg_attribute a on a.attrelid=c.conrelid and a.attnum=c.conkey[1]
             where c.conrelid='public.catalog_item_managers'::regclass
               and c.contype='c' and a.attname='role')=1 then 'GECTI' else '!!! DUSTU' end;

-- Davranış: bugün yazılabilen YAZILABİLİR kalmalı, amaçlananlar AÇILMALI,
-- amaçlanmayanlar REDDEDİLMEYE DEVAM etmeli.
insert into r select 6,'K6 owner hâlâ yazılabilir (gerileme yok)',
  case when pg_temp.rol_yazilabilir('owner') then 'GECTI' else '!!! DUSTU' end;
insert into r select 7,'K7 editor hâlâ yazılabilir (gerileme yok)',
  case when pg_temp.rol_yazilabilir('editor') then 'GECTI' else '!!! DUSTU' end;
insert into r select 8,'K8 admin ARTIK yazılabilir (çelişki kalktı)',
  case when pg_temp.rol_yazilabilir('admin') then 'GECTI' else '!!! DUSTU' end;
insert into r select 9,'K9 moderator ARTIK yazılabilir',
  case when pg_temp.rol_yazilabilir('moderator') then 'GECTI' else '!!! DUSTU' end;
insert into r select 10,'K10 manager hâlâ reddediliyor (davranış DEĞİŞMEDİ)',
  case when not pg_temp.rol_yazilabilir('manager') then 'GECTI' else '!!! DUSTU' end;
insert into r select 11,'K11 contributor hâlâ reddediliyor',
  case when not pg_temp.rol_yazilabilir('contributor') then 'GECTI' else '!!! DUSTU' end;
insert into r select 12,'K12 viewer hâlâ reddediliyor',
  case when not pg_temp.rol_yazilabilir('viewer') then 'GECTI' else '!!! DUSTU' end;
insert into r select 13,'K13 uydurma değer reddediliyor (kısıt hâlâ iş görüyor)',
  case when not pg_temp.rol_yazilabilir('kralice') then 'GECTI' else '!!! DUSTU' end;

-- ⚠️ todo_items çifti ÇELİŞKİ DEĞİL, tamamlayıcı — silinmemiş olmalı.
insert into r select 14,'K14 todo_items.konu çifti DOKUNULMADAN duruyor',
  case when (select count(*) from pg_constraint
             where conrelid='public.todo_items'::regclass and contype='c'
               and conname in ('todo_items_konu_check','todo_items_konu_length_check'))=2
       then 'GECTI' else '!!! DUSTU' end;

insert into r select 15,'K15 mevcut 187 yönetici satırı bozulmadı',
  case when (select count(*) from catalog_item_managers
             where role not in ('owner','admin','editor','moderator'))=0 then 'GECTI' else '!!! DUSTU' end;

\echo ''
\echo '============ KATALOG KISIT TEMİZLİĞİ — KABUL ============'
select * from r order by no;
select case when count(*) filter (where sonuc like 'GECTI%' or no=0)=count(*)
            then 'TUMU GECTI: '||(count(*)-1)::text
            else '!!! '||(count(*) filter (where sonuc not like 'GECTI%' and no<>0))::text||' DUSTU' end as ozet
from r;

rollback;
\echo '== ROLLBACK — canlida iz birakilmadi =='
