-- M14 · Faz 6 traction metrik view'ları — kabul (geri alınan işlem).
-- Ölçülen: admin OKUR (1 satır + GERÇEK veri) · non-admin 0 satır (guard ayırt
-- eder, vakum DEĞİL) · oturumsuz 0 satır · anon SELECT grant YOK · authenticated
-- grant VAR · 5 view de MATERIALIZED DEĞİL (relkind='v').
--
-- 🔴 GUARD AYIRT ETMELİ (G06 dersi): admin'in GERÇEK sayıyı gördüğü (cadde_posts
--    canlı sayıya eşit, >0) ve non-admin'in 0 satır aldığı ÖLÇÜLÜR — aksi halde
--    "hiç satır yok" da vakum geçerdi. is_admin(auth.uid()) PARAMETRELİ çağrılır.
\set ON_ERROR_STOP on
begin;

create temp table t(k text primary key, v uuid) on commit drop;
insert into auth.users (id, email) values
  (gen_random_uuid(),'m14-admin@test.local'),
  (gen_random_uuid(),'m14-user@test.local');
insert into t select split_part(email,'@',1), id from auth.users where email like 'm14-%@test.local';
-- user_role_assignments PK=user_id (üye başına TEK rol; auth.users insert trigger'ı
-- varsayılan rolü atar) -> admin'i insert DEĞİL update ile yükselt.
update user_role_assignments
   set role_id=(select id from roles where key='Admin_PlatformAdmin')
 where user_id=(select v from t where k='m14-admin');

create temp table r(no int, ad text, sonuc text) on commit drop;

do $x$
declare
  u_admin uuid := (select v from t where k='m14-admin');
  u_user  uuid := (select v from t where k='m14-user');
  n int;
  v_cadde int; v_cadde_canli int;
begin
  -- ADMIN olarak: 5 view de 1 satır döner.
  perform set_config('request.jwt.claims', json_build_object('sub',u_admin)::text, true);

  select count(*) into n from public.metrics_weekly_active_users;
  insert into r select 1,'K1 admin metrics_weekly_active_users OKUR (1 satir)',
    case when n=1 then 'GECTI' else '!!! DUSTU: '||n||' satir' end;

  select count(*) into n from public.metrics_content_created;
  insert into r select 2,'K2 admin metrics_content_created OKUR (1 satir)',
    case when n=1 then 'GECTI' else '!!! DUSTU: '||n||' satir' end;

  select count(*) into n from public.metrics_recommendation_response_rate;
  insert into r select 3,'K3 admin metrics_recommendation_response_rate OKUR (1 satir)',
    case when n=1 then 'GECTI' else '!!! DUSTU: '||n||' satir' end;

  select count(*) into n from public.metrics_invite_signups;
  insert into r select 4,'K4 admin metrics_invite_signups OKUR (1 satir)',
    case when n=1 then 'GECTI' else '!!! DUSTU: '||n||' satir' end;

  select count(*) into n from public.metrics_30d_return_rate;
  insert into r select 5,'K5 admin metrics_30d_return_rate OKUR (1 satir)',
    case when n=1 then 'GECTI' else '!!! DUSTU: '||n||' satir' end;

  -- GUARD AYIRT: admin GERÇEK veriyi görür (cadde_posts_total = canlı sayı, >0).
  select cadde_posts_total into v_cadde from public.metrics_content_created;
  select count(*) into v_cadde_canli from public.cadde_posts;
  insert into r select 6,'K6 admin GERCEK veriyi gorur (cadde_posts_total = canli, >0)',
    case when v_cadde = v_cadde_canli and v_cadde_canli > 0 then 'GECTI ('||v_cadde||')'
         else '!!! DUSTU: view='||coalesce(v_cadde::text,'null')||' canli='||v_cadde_canli end;

  -- NON-ADMIN olarak: guard 0 satır (gerçek veri SIZMAZ).
  perform set_config('request.jwt.claims', json_build_object('sub',u_user)::text, true);
  select count(*) into n from public.metrics_content_created;
  insert into r select 7,'K7 non-admin metrics_content_created 0 satir (guard, SIZINTI YOK)',
    case when n=0 then 'GECTI' else '!!! DUSTU: '||n||' satir SIZDI' end;

  select count(*) into n from public.metrics_weekly_active_users;
  insert into r select 8,'K8 non-admin metrics_weekly_active_users 0 satir (guard)',
    case when n=0 then 'GECTI' else '!!! DUSTU: '||n||' satir SIZDI' end;

  -- OTURUMSUZ (auth.uid()=null): is_admin(null)=false -> 0 satır.
  perform set_config('request.jwt.claims', '', true);
  select count(*) into n from public.metrics_invite_signups;
  insert into r select 9,'K9 oturumsuz (auth.uid null) 0 satir',
    case when n=0 then 'GECTI' else '!!! DUSTU: '||n||' satir' end;
end $x$;

-- K10: anon SELECT grant YOK (PostgREST düzeyinde permission denied -> hata).
insert into r select 10,'K10 5 view: anon SELECT grant YOK',
  case when not has_table_privilege('anon','public.metrics_weekly_active_users','SELECT')
        and not has_table_privilege('anon','public.metrics_content_created','SELECT')
        and not has_table_privilege('anon','public.metrics_recommendation_response_rate','SELECT')
        and not has_table_privilege('anon','public.metrics_invite_signups','SELECT')
        and not has_table_privilege('anon','public.metrics_30d_return_rate','SELECT')
       then 'GECTI' else '!!! DUSTU' end;

-- K11: authenticated SELECT grant VAR (admin PostgREST'ten okuyabilsin).
insert into r select 11,'K11 5 view: authenticated SELECT grant VAR',
  case when has_table_privilege('authenticated','public.metrics_weekly_active_users','SELECT')
        and has_table_privilege('authenticated','public.metrics_content_created','SELECT')
        and has_table_privilege('authenticated','public.metrics_recommendation_response_rate','SELECT')
        and has_table_privilege('authenticated','public.metrics_invite_signups','SELECT')
        and has_table_privilege('authenticated','public.metrics_30d_return_rate','SELECT')
       then 'GECTI' else '!!! DUSTU' end;

-- K12: MATERIALIZED DEĞİL (relkind='v'; 'm' YASAK — 1 GB RAM refresh riski).
insert into r select 12,'K12 5 view MATERIALIZED DEGIL (relkind=v, m YOK)',
  case when (select count(*) from pg_class c join pg_namespace ns on ns.oid=c.relnamespace
              where ns.nspname='public' and c.relkind='v'
                and c.relname in ('metrics_weekly_active_users','metrics_content_created',
                  'metrics_recommendation_response_rate','metrics_invite_signups','metrics_30d_return_rate'))=5
        and (select count(*) from pg_class c join pg_namespace ns on ns.oid=c.relnamespace
              where ns.nspname='public' and c.relkind='m'
                and c.relname like 'metrics_%')=0
       then 'GECTI' else '!!! DUSTU' end;

-- K13: guard is_admin(auth.uid()) PARAMETRELİ — view tanımı parametresiz is_admin() İÇERMEZ.
insert into r select 13,'K13 guard is_admin(auth.uid()) parametreli (parametresiz YOK)',
  case when (select count(*) from pg_views where schemaname='public'
              and viewname in ('metrics_weekly_active_users','metrics_content_created',
                'metrics_recommendation_response_rate','metrics_invite_signups','metrics_30d_return_rate')
              and definition like '%is_admin(auth.uid())%')=5
        and (select count(*) from pg_views where schemaname='public' and viewname like 'metrics_%'
              and definition ~ 'is_admin\(\s*\)')=0
       then 'GECTI' else '!!! DUSTU' end;

\echo ''
\echo '================= M14 KABUL (K1-K13) ================='
select * from r order by no;
select case when count(*) filter (where sonuc like 'GECTI%')=count(*)
            then 'TUMU GECTI: '||count(*)::text
            else '!!! '||(count(*) filter (where sonuc not like 'GECTI%'))::text||' DUSTU' end as ozet
from r;
rollback;
\echo '== ROLLBACK =='

-- Rollback sonrası canlı temiz: test kullanıcıları kalıntı yok, view'lar DURUYOR.
select 'CANLI temiz (m14-* kalinti=0)' as ad,
  case when (select count(*) from auth.users where email like 'm14-%@test.local')=0
       then 'GECTI' else '!!! DUSTU' end as sonuc;
select 'view kalici (rollback sadece test verisini aldi)' as ad,
  case when (select count(*) from pg_views where schemaname='public' and viewname like 'metrics\_%')=5
       then 'GECTI' else '!!! DUSTU' end as sonuc;
