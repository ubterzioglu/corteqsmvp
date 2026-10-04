-- `admin_*` anon yetkisi temizliği — kabul testi (geri alınan işlem).
\set ON_ERROR_STOP on
begin;

create temp table r(no int, ad text, sonuc text) on commit drop;

create temp view admin_fn as
  select p.oid, p.proname,
         has_function_privilege('anon', p.oid,'execute')          as anon,
         has_function_privilege('authenticated', p.oid,'execute') as auth,
         has_function_privilege('service_role', p.oid,'execute')  as svc
    from pg_proc p join pg_namespace n on n.oid=p.pronamespace
   where n.nspname='public' and p.prokind='f' and p.proname like 'admin\_%';

create temp table onceki on commit drop as
  select proname, anon, auth, svc from admin_fn;

-- admin_* DISINDAKI fonksiyonlarin anon yetkisi: kapsam genislemesi kilidi.
-- ⚠️ "su an >0 tane var mi" diye bakmak YETMEZ — cogu public RPC yetkisini
-- PUBLIC rolunden alir, anon'dan revoke etmek onlari etkilemez ve iddia
-- yanlis sebeple gecer (mutasyon Y3 ilk turda tam bunu yapti). Dogru kosul
-- ONCE/SONRA karsilastirmasidir.
create temp table onceki_diger on commit drop as
  select p.proname, has_function_privilege('anon', p.oid,'execute') as anon
    from pg_proc p join pg_namespace n on n.oid=p.pronamespace
   where n.nspname='public' and p.prokind='f' and p.proname not like 'admin\_%';

insert into r select 0,'ONCE · anon yetkili admin_* sayisi',
  (select count(*) filter (where anon) from onceki)::text;

\i supabase/migrations/applied/20261004140000_admin_rpc_anon_revoke.sql

insert into r select 1,'K1 anon yetkili admin_* SIFIRLANDI',
  case when (select count(*) from admin_fn where anon)=0 then 'GECTI'
       else '!!! DUSTU: '||(select count(*) from admin_fn where anon)::text end;

insert into r select 2,'K2 authenticated erisimi KORUNDU (hicbiri kaybolmadi)',
  case when not exists (
        select 1 from onceki o join admin_fn f on f.proname=o.proname
        where o.auth and not f.auth) then 'GECTI' else '!!! DUSTU' end;

insert into r select 3,'K3 service_role erisimi KORUNDU (edge functionlar)',
  case when not exists (
        select 1 from onceki o join admin_fn f on f.proname=o.proname
        where o.svc and not f.svc) then 'GECTI' else '!!! DUSTU' end;

insert into r select 4,'K4 zaten kilitli 28 fonksiyon bozulmadi',
  case when (select count(*) from onceki where not anon)
            <= (select count(*) from admin_fn where not anon) then 'GECTI' else '!!! DUSTU' end;

insert into r select 5,'K5 admin_* DISINDAKI hicbir fonksiyon anon yetkisi KAYBETMEDI',
  case when not exists (
        select 1 from onceki_diger o
        join (select p.proname, has_function_privilege('anon', p.oid,'execute') as anon
                from pg_proc p join pg_namespace n on n.oid=p.pronamespace
               where n.nspname='public' and p.prokind='f' and p.proname not like 'admin\_%') f
          on f.proname=o.proname
        where o.anon and not f.anon)
       then 'GECTI' else '!!! DUSTU: kapsam admin_* disina tasti' end;

-- Kapi hala calisiyor mu: siradan uye ile cagir, reddedilmeli.
create temp table fx(k text primary key, v uuid) on commit drop;
insert into auth.users(id,email) values (gen_random_uuid(),'anonrev@test.local');
insert into fx select 'u', id from auth.users where email='anonrev@test.local';

do $x$
declare u uuid := (select v from fx where k='u');
begin
  perform set_config('request.jwt.claims', json_build_object('sub',u,'role','authenticated')::text, true);
  begin
    perform admin_set_user_feature_override(u,'cadde.access',true);
    insert into r select 6,'K6 govdedeki admin kapisi HALA calisiyor','!!! DUSTU: siradan uye gecti';
  exception when others then insert into r select 6,'K6 govdedeki admin kapisi HALA calisiyor',
    case when sqlerrm ilike '%forbidden%' then 'GECTI' else '!!! DUSTU: '||left(sqlerrm,40) end;
  end;
end $x$;

insert into r select 7,'K7 ornek fonksiyon authenticated icin CAGRILABILIR durumda',
  case when has_function_privilege('authenticated',
            'public.admin_set_user_feature_override(uuid,text,boolean)','execute')
       then 'GECTI' else '!!! DUSTU' end;

\echo ''
\echo '======== admin_* ANON YETKI TEMIZLIGI — KABUL ========'
select * from r order by no;
select case when count(*) filter (where sonuc like 'GECTI%' or no=0)=count(*)
            then 'TUMU GECTI: '||(count(*)-1)::text
            else '!!! '||(count(*) filter (where sonuc not like 'GECTI%' and no<>0))::text||' DUSTU' end as ozet
from r;

rollback;
\echo '== ROLLBACK =='
