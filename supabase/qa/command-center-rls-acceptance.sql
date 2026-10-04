-- `command_center_items` RLS kapatma — kabul testi (geri alınan işlem).
\set ON_ERROR_STOP on
begin;

create temp table r(no int, ad text, sonuc text) on commit drop;

insert into r select 0,'ONCE · acik politika sayisi (anon iceren)',
  (select count(*)::text from pg_policies
   where tablename='command_center_items' and roles::text like '%anon%');

\i supabase/migrations/applied/20261004170000_command_center_rls_lockdown.sql

insert into r select 1,'K1 anon iceren politika KALMADI',
  case when (select count(*) from pg_policies
             where tablename='command_center_items' and roles::text like '%anon%')=0
       then 'GECTI' else '!!! DUSTU' end;

insert into r select 2,'K2 admin politikalari DURUYOR (okuma + yazma)',
  case when (select count(*) from pg_policies
             where tablename='command_center_items'
               and policyname in ('command_center_items_select_admin',
                                  'command_center_items_write_admin'))=2
       then 'GECTI' else '!!! DUSTU' end;

insert into r select 3,'K3 RLS hala ACIK',
  case when (select relrowsecurity from pg_class where oid='public.command_center_items'::regclass)
       then 'GECTI' else '!!! DUSTU' end;

insert into r select 4,'K4 hicbir satir silinmedi (1761)',
  case when (select count(*) from command_center_items)=1761 then 'GECTI'
       else '!!! DUSTU: '||(select count(*) from command_center_items)::text end;

insert into r select 5,'K5 facets view anon grant CEKILDI',
  case when not has_table_privilege('anon','public.v_command_center_facets','select')
       then 'GECTI' else '!!! DUSTU' end;

-- ── Rol davranisi: RLS'i gercekten uygulayan rolle sina ─────────────────────
-- ⚠️ Kimlikler rol degisiminden ONCE psql degiskenine alinmali: `authenticated`
--    rolu gecici tablolari okuyamaz (ilk kosuda "permission denied for table fx").
insert into auth.users(id,email) values (gen_random_uuid(),'cc-uye@test.local');
select id as uye_id from auth.users where email='cc-uye@test.local' \gset
select ura.user_id as admin_id from user_role_assignments ura
  join roles rl on rl.id=ura.role_id where rl.key='Admin_SuperAdmin' limit 1 \gset

set local role authenticated;

-- ⚠️ `authenticated` rolu gecici tablolara (fx, r) ERISEMEZ. Bu yuzden rol
--    icindeyken YALNIZ sayim yapilir ve psql degiskenine alinir; sonuclar
--    role cikildiktan sonra yazilir. (Ilk iki kosu tam bu yuzden dustu.)
select set_config('request.jwt.claims',
  json_build_object('sub', :'uye_id', 'role','authenticated')::text, true) as _s1 \gset
select count(*) as uye_gordu from command_center_items \gset

select set_config('request.jwt.claims',
  json_build_object('sub', :'admin_id', 'role','authenticated')::text, true) as _s2 \gset
select count(*) as admin_gordu from command_center_items \gset

reset role;

insert into r select 6,'K6 siradan UYE hicbir satir goremiyor',
  case when :uye_gordu = 0 then 'GECTI' else '!!! DUSTU: ' || :uye_gordu || ' satir gordu' end;
insert into r select 7,'K7 ADMIN hala tum satirlari goruyor (panel bozulmadi)',
  case when :admin_gordu = 1761 then 'GECTI' else '!!! DUSTU: ' || :admin_gordu end;

\echo ''
\echo '======== command_center_items RLS — KABUL ========'
select * from r order by no;
select case when count(*) filter (where sonuc like 'GECTI%' or no=0)=count(*)
            then 'TUMU GECTI: '||(count(*)-1)::text
            else '!!! '||(count(*) filter (where sonuc not like 'GECTI%' and no<>0))::text||' DUSTU' end as ozet
from r;

rollback;
\echo '== ROLLBACK =='
