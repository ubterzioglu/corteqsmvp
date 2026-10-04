-- M24 kabul testi (geri alınan işlem).
\set ON_ERROR_STOP on
begin;

create temp table r(no int, ad text, sonuc text) on commit drop;

insert into r select 0,'ONCE · outbox CHECK deger sayisi',
  (select (length(pg_get_constraintdef(oid)) - length(replace(pg_get_constraintdef(oid),'''::text',''))) / 7
   from pg_constraint where conname='notification_email_outbox_event_type_check')::text;

\i supabase/migrations/applied/20261004120000_user_city_follows.sql

create temp table fx(k text primary key, v uuid) on commit drop;
insert into auth.users(id,email) values (gen_random_uuid(),'m24-a@test.local'),(gen_random_uuid(),'m24-b@test.local');
insert into fx select split_part(email,'@',1), id from auth.users where email like 'm24-%@test.local';
insert into fx select 'sehir', id from geo_cities limit 1;
insert into fx select 'sehir2', id from (select id from geo_cities offset 1 limit 1) s;

-- ── Sema ────────────────────────────────────────────────────────────────────
insert into r select 1,'K1 tablo kuruldu + PK (user_id, city_id)',
  case when (select pg_get_constraintdef(oid) from pg_constraint
             where conrelid='public.user_city_follows'::regclass and contype='p')
            = 'PRIMARY KEY (user_id, city_id)' then 'GECTI' else '!!! DUSTU' end;

insert into r select 2,'K2 sehir geo_cities''e FK (serbest metin DEGIL)',
  case when exists (select 1 from pg_constraint
        where conrelid='public.user_city_follows'::regclass and contype='f'
          and confrelid='public.geo_cities'::regclass) then 'GECTI' else '!!! DUSTU' end;

insert into r select 3,'K3 ters indeks var (sehri kim takip ediyor sorgusu)',
  case when exists (select 1 from pg_indexes where tablename='user_city_follows'
                     and indexdef ilike '%(city_id)%') then 'GECTI' else '!!! DUSTU' end;

insert into r select 4,'K4 RLS acik',
  case when (select relrowsecurity from pg_class where oid='public.user_city_follows'::regclass)
       then 'GECTI' else '!!! DUSTU' end;

insert into r select 5,'K5 UPDATE politikasi BILEREK YOK (user_id kaydirilamaz)',
  case when not exists (select 1 from pg_policies
        where tablename='user_city_follows' and cmd='UPDATE') then 'GECTI' else '!!! DUSTU' end;

-- ── Davranis ────────────────────────────────────────────────────────────────
insert into user_city_follows(user_id, city_id)
  values ((select v from fx where k='m24-a'), (select v from fx where k='sehir'));

insert into r select 6,'K6 ayni takip iki kez eklenemez (PK)',
  case when (select count(*) from user_city_follows
             where user_id=(select v from fx where k='m24-a')) = 1 then 'GECTI' else '!!! DUSTU' end;

do $x$
begin
  insert into user_city_follows(user_id, city_id)
    values ((select v from fx where k='m24-a'), (select v from fx where k='sehir'));
  insert into r select 7,'K7 mukerrer takip reddedilir','!!! DUSTU: gecti';
exception when unique_violation then insert into r select 7,'K7 mukerrer takip reddedilir','GECTI';
end $x$;

do $x$
begin
  insert into user_city_follows(user_id, city_id)
    values ((select v from fx where k='m24-b'), gen_random_uuid());
  insert into r select 8,'K8 olmayan sehir reddedilir (FK)','!!! DUSTU: gecti';
exception when foreign_key_violation then insert into r select 8,'K8 olmayan sehir reddedilir (FK)','GECTI';
end $x$;

insert into r select 9,'K9 ulke sehirden TURETILEBILIYOR (ayrica saklanmiyor)',
  case when (select c.country_id is not null from user_city_follows f
             join geo_cities c on c.id=f.city_id
             where f.user_id=(select v from fx where k='m24-a') limit 1)
       then 'GECTI' else '!!! DUSTU' end;

-- ── Outbox + ayarlar ────────────────────────────────────────────────────────
insert into notification_email_outbox(event_type, dedupe_key, payload, status)
  values ('weekly_city_digest','m24-kabul-'||gen_random_uuid()::text,'{}'::jsonb,'pending');
insert into r select 10,'K10 outbox yeni tipi KABUL ediyor (KR09 sessiz kayip dersi)',
  case when (select count(*) from notification_email_outbox where event_type='weekly_city_digest')=1
       then 'GECTI' else '!!! DUSTU' end;

do $x$
begin
  insert into notification_email_outbox(event_type, dedupe_key, payload, status)
    values ('uydurma_tip','m24-kotu','{}'::jsonb,'pending');
  insert into r select 11,'K11 uydurma tip hala reddediliyor','!!! DUSTU: gecti';
exception when check_violation then insert into r select 11,'K11 uydurma tip hala reddediliyor','GECTI';
end $x$;

insert into r select 12,'K12 eski 18 tip KORUNDU (hicbiri dusurulmedi)',
  case when (select count(*) from (values ('new_member'),('admin_update'),('member_welcome'),
       ('revision_request'),('revision_request_completed'),('relocation_tool_report'),
       ('relocation_tool_abandonment'),('radar_scan_digest'),('career_application'),
       ('group_submission_received'),('group_published'),('group_rejected'),
       ('group_ownership_verified'),('group_post_pending'),('group_link_dead'),
       ('group_score_badge'),('group_strike_warning'),('recommendation_match')) as t(v)
       where pg_get_constraintdef((select oid from pg_constraint
         where conname='notification_email_outbox_event_type_check')) like '%'''||t.v||'''%')=18
       then 'GECTI' else '!!! DUSTU' end;

insert into r select 13,'K13 ozet KAPALI dogdu (G22 deseni - insan acacak)',
  case when (select value from notification_settings where key='email.weekly_city_digest.enabled')='false'::jsonb
       then 'GECTI' else '!!! DUSTU' end;

insert into r select 14,'K14 takip tavani ayardan geliyor (kodda sabit degil)',
  case when (select value from notification_settings where key='weekly_city_digest.max_follows_per_user')='10'::jsonb
       then 'GECTI' else '!!! DUSTU' end;

\echo ''
\echo '============ M24 KABUL ============'
select * from r order by no;
select case when count(*) filter (where sonuc like 'GECTI%' or no=0)=count(*)
            then 'TUMU GECTI: '||(count(*)-1)::text
            else '!!! '||(count(*) filter (where sonuc not like 'GECTI%' and no<>0))::text||' DUSTU' end as ozet
from r;

rollback;
\echo '== ROLLBACK =='
