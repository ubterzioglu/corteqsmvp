-- Eski pano tabloları admin-only daraltma — kabul testi (geri alınan işlem).
\set ON_ERROR_STOP on
begin;

create temp table r(no int, ad text, sonuc text) on commit drop;

create temp view hedef as
  select * from (values ('arge_cards'),('arge_files'),('arge_links'),
    ('command_center_legacy_map'),('contacts'),('doc_categories'),('draft_notlar'),
    ('gorevler'),('links'),('meeting_notes'),('mvp_items'),('resource_entries'),
    ('social_media_links'),('todo_items'),('user_cvs')) as t(tablo);

insert into r select 0,'ONCE · kosulsuz authenticated politikasi sayisi',
  (select count(*)::text from pg_policies p join hedef h on h.tablo=p.tablename
    where p.schemaname='public' and coalesce(p.qual,'true')='true'
      and p.roles::text like '%authenticated%');

\i supabase/migrations/applied/20261004210000_legacy_dashboard_admin_only.sql

insert into r select 1,'K1 kosulsuz (qual=true) politika KALMADI',
  case when (select count(*) from pg_policies p join hedef h on h.tablo=p.tablename
              where p.schemaname='public' and coalesce(p.qual,'true')='true')=0
       then 'GECTI' else '!!! DUSTU: '||(select count(*) from pg_policies p join hedef h on h.tablo=p.tablename
              where p.schemaname='public' and coalesce(p.qual,'true')='true')::text end;

insert into r select 2,'K2 her tabloda en az bir is_admin politikasi var',
  case when not exists (
        select 1 from hedef h
        where not exists (select 1 from pg_policies p
                           where p.schemaname='public' and p.tablename=h.tablo
                             and p.qual ilike '%is_admin%'))
       then 'GECTI' else '!!! DUSTU' end;

insert into r select 3,'K3 anon politikasi hala YOK (KS07 geri gelmedi)',
  case when (select count(*) from pg_policies p join hedef h on h.tablo=p.tablename
              where p.schemaname='public' and p.roles::text like '%anon%')=0
       then 'GECTI' else '!!! DUSTU' end;

insert into r select 4,'K4 satirlar korundu (meeting_notes 470)',
  case when (select count(*) from meeting_notes)=470 then 'GECTI'
       else '!!! DUSTU: '||(select count(*) from meeting_notes)::text end;

-- ── Rol davranisi: sıradan üye 0, admin hepsi ───────────────────────────────
insert into auth.users(id,email) values (gen_random_uuid(),'adminonly-uye@test.local');
select id as uye_id from auth.users where email='adminonly-uye@test.local' \gset
select ura.user_id as admin_id from user_role_assignments ura
  join roles rl on rl.id=ura.role_id where rl.key='Admin_SuperAdmin' limit 1 \gset

set local role authenticated;
select set_config('request.jwt.claims',
  json_build_object('sub', :'uye_id', 'role','authenticated')::text, true) as _s1 \gset
select count(*) as uye_meeting from meeting_notes \gset
select count(*) as uye_cv from user_cvs \gset

select set_config('request.jwt.claims',
  json_build_object('sub', :'admin_id', 'role','authenticated')::text, true) as _s2 \gset
select count(*) as admin_meeting from meeting_notes \gset
reset role;

insert into r select 5,'K5 SIRADAN UYE artik toplanti notu goremiyor',
  case when :uye_meeting = 0 then 'GECTI' else '!!! DUSTU: '||:uye_meeting||' satir gordu' end;
insert into r select 6,'K6 SIRADAN UYE ozgecmis kaydi goremiyor',
  case when :uye_cv = 0 then 'GECTI' else '!!! DUSTU: '||:uye_cv||' satir gordu' end;
insert into r select 7,'K7 ADMIN hala hepsini goruyor (panel bozulmadi)',
  case when :admin_meeting = 470 then 'GECTI' else '!!! DUSTU: '||:admin_meeting end;

\echo ''
\echo '======== ESKI PANO ADMIN-ONLY — KABUL ========'
select * from r order by no;
select case when count(*) filter (where sonuc like 'GECTI%' or no=0)=count(*)
            then 'TUMU GECTI: '||(count(*)-1)::text
            else '!!! '||(count(*) filter (where sonuc not like 'GECTI%' and no<>0))::text||' DUSTU' end as ozet
from r;

rollback;
\echo '== ROLLBACK =='
