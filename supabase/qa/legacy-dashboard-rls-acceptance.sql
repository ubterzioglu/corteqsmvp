-- Eski pano tabloları RLS kapatma — kabul testi (geri alınan işlem).
\set ON_ERROR_STOP on
begin;

create temp table r(no int, ad text, sonuc text) on commit drop;

create temp view hedef as
  select * from (values ('arge_cards'),('arge_files'),('arge_links'),
    ('command_center_legacy_map'),('contacts'),('doc_categories'),('draft_notlar'),
    ('gorevler'),('links'),('meeting_notes'),('mvp_items'),('resource_entries'),
    ('social_media_links'),('todo_items'),('user_cvs')) as t(tablo);

insert into r select 0,'ONCE · anon iceren politika sayisi (15 tabloda)',
  (select count(*)::text from pg_policies p join hedef h on h.tablo=p.tablename
    where p.schemaname='public' and p.roles::text like '%anon%');

-- Satır sayıları korunsun diye önceden al
create temp table onceki_satir on commit drop as
select 'meeting_notes' as t, count(*) n from meeting_notes
union all select 'command_center_legacy_map', count(*) from command_center_legacy_map
union all select 'todo_items', count(*) from todo_items
union all select 'resource_entries', count(*) from resource_entries
union all select 'mvp_items', count(*) from mvp_items
union all select 'user_cvs', count(*) from user_cvs;

\i supabase/migrations/applied/20261004190000_legacy_dashboard_rls_lockdown.sql

insert into r select 1,'K1 15 tabloda anon iceren politika KALMADI',
  case when (select count(*) from pg_policies p join hedef h on h.tablo=p.tablename
              where p.schemaname='public' and p.roles::text like '%anon%')=0
       then 'GECTI' else '!!! DUSTU: '||(select count(*) from pg_policies p join hedef h on h.tablo=p.tablename
              where p.schemaname='public' and p.roles::text like '%anon%')::text end;

insert into r select 2,'K2 her tabloda EN AZ BIR authenticated politikasi var (panel bozulmasin)',
  case when not exists (
        select 1 from hedef h
        where not exists (select 1 from pg_policies p
                           where p.schemaname='public' and p.tablename=h.tablo
                             and p.roles::text like '%authenticated%'))
       then 'GECTI' else '!!! DUSTU' end;

insert into r select 3,'K3 hicbir satir silinmedi',
  case when not exists (
        select 1 from onceki_satir o
        where o.n <> (case o.t
          when 'meeting_notes' then (select count(*) from meeting_notes)
          when 'command_center_legacy_map' then (select count(*) from command_center_legacy_map)
          when 'todo_items' then (select count(*) from todo_items)
          when 'resource_entries' then (select count(*) from resource_entries)
          when 'mvp_items' then (select count(*) from mvp_items)
          when 'user_cvs' then (select count(*) from user_cvs) end))
       then 'GECTI' else '!!! DUSTU' end;

insert into r select 4,'K4 todo_items yazma politikasi artik yalniz authenticated',
  case when exists (select 1 from pg_policies where tablename='todo_items'
                     and cmd='ALL' and roles::text like '%authenticated%'
                     and roles::text not like '%anon%')
       then 'GECTI' else '!!! DUSTU' end;

insert into r select 5,'K5 command_center_legacy_map yazma politikasi anon ICERMIYOR',
  case when not exists (select 1 from pg_policies where tablename='command_center_legacy_map'
                         and roles::text like '%anon%')
       then 'GECTI' else '!!! DUSTU' end;

insert into r select 6,'K6 doc_categories okunabilir KALDI (tek politikasi public idi)',
  case when exists (select 1 from pg_policies where tablename='doc_categories'
                     and cmd='SELECT' and roles::text like '%authenticated%')
       then 'GECTI' else '!!! DUSTU' end;

-- ── Rol davranisi ───────────────────────────────────────────────────────────
-- ⚠️ `authenticated` rolu gecici tablolara erisemez: sayimlar rol icinde
--    psql degiskenine alinir, rolden cikinca yazilir.
insert into auth.users(id,email) values (gen_random_uuid(),'legacy-uye@test.local');
select id as uye_id from auth.users where email='legacy-uye@test.local' \gset

set local role authenticated;
select set_config('request.jwt.claims',
  json_build_object('sub', :'uye_id', 'role','authenticated')::text, true) as _s \gset
select count(*) as uye_meeting from meeting_notes \gset
reset role;

insert into r select 7,'K7 GIRISLI kullanici hala okuyabiliyor (davranis korundu)',
  case when :uye_meeting > 0 then 'GECTI' else '!!! DUSTU: '||:uye_meeting end;

\echo ''
\echo '======== ESKI PANO TABLOLARI RLS — KABUL ========'
select * from r order by no;
select case when count(*) filter (where sonuc like 'GECTI%' or no=0)=count(*)
            then 'TUMU GECTI: '||(count(*)-1)::text
            else '!!! '||(count(*) filter (where sonuc not like 'GECTI%' and no<>0))::text||' DUSTU' end as ozet
from r;

rollback;
\echo '== ROLLBACK =='
