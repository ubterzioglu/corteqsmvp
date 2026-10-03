-- M16 · Faz 6 CANLI doğrulama — panel rakamı (5 metrik view'ı) == bağımsız SQL.
--
-- Panel (AdminTractionPage) `fetchTractionMetrics` ile 5 M14 view'ını okur. Bu
-- betik her metrik için VIEW çıktısını ("panel rakamı", admin olarak okunur)
-- BAĞIMSIZ doğrudan SQL sayımıyla karşılaştırır. Eşleşme = panel doğru sayıyı
-- gösterir. Geri alınan işlem; test admin'i oluşturur (view'ları okumak için),
-- canlıya iz bırakmaz.
--
-- 🔴 now() kayması olmasın diye view okuma ve ground-truth AYNI işlemde (tek now()).
-- 🔴 WAU ground-truth'u view'ın union mantığının BAĞIMSIZ yeniden yazımı; içerik/
--    davet/geri-dönüş doğrudan tablo sayımı (view alanlarıyla karşılaştırılır).
\set ON_ERROR_STOP on
begin;

create temp table t(v uuid) on commit drop;
insert into auth.users (id, email) values (gen_random_uuid(),'m16-admin@test.local');
insert into t select id from auth.users where email='m16-admin@test.local';
update user_role_assignments
   set role_id=(select id from roles where key='Admin_PlatformAdmin')
 where user_id=(select v from t);

create temp table r(no int, metrik text, panel text, sql_ground text, sonuc text) on commit drop;

do $x$
declare
  u_admin uuid := (select v from t);
  p_num numeric; g_num numeric;
  p_txt text;
  p_cohort numeric; p_returned numeric; p_rate numeric;
  g_cohort numeric; g_returned numeric;
begin
  perform set_config('request.jwt.claims', json_build_object('sub',u_admin)::text, true);

  -- 1) weekly_active_users.active_7d — panel vs bağımsız union
  select active_7d into p_num from public.metrics_weekly_active_users;
  select count(distinct uid) into g_num from (
    select id as uid from auth.users where last_sign_in_at >= now() - interval '7 days'
    union select user_id from public.events where created_at >= now() - interval '7 days' and user_id is not null
    union select owner_user_id from public.carsi_items where created_at >= now() - interval '7 days' and owner_user_id is not null
    union select author_user_id from public.cadde_posts where created_at >= now() - interval '7 days' and author_user_id is not null
    union select author_user_id from public.group_posts where created_at >= now() - interval '7 days' and author_user_id is not null
  ) u;
  insert into r select 1,'weekly_active_users.active_7d', p_num::text, g_num::text,
    case when p_num is not distinct from g_num then 'ESLESTI' else '!!! FARK' end;

  -- 2) content_created — panel toplamı (totalContentCreated formülü) vs doğrudan tablo sayıları
  select (events_total + cadde_posts_total + carsi_items_total + groups_total + group_posts_total + recommendations_total)
    into p_num from public.metrics_content_created;
  select (select count(*) from public.events)
       + (select count(*) from public.cadde_posts)
       + (select count(*) from public.carsi_items)
       + (select count(*) from public.whatsapp_landings)
       + (select count(*) from public.group_posts)
       + 0 into g_num;  -- tavsiye M17'ye dek 0
  insert into r select 2,'content_created toplam (panel formulu)', p_num::text, g_num::text,
    case when p_num is not distinct from g_num then 'ESLESTI' else '!!! FARK' end;

  -- 2b) content_created tür kırılımı (cadde_posts_total) vs doğrudan — alt alan doğrulama
  select cadde_posts_total into p_num from public.metrics_content_created;
  select count(*) into g_num from public.cadde_posts;
  insert into r select 3,'content_created.cadde_posts_total', p_num::text, g_num::text,
    case when p_num is not distinct from g_num then 'ESLESTI' else '!!! FARK' end;

  -- 3) recommendation_response_rate.available — M17 tavsiye tablosu YOK -> false
  select available::text into p_txt from public.metrics_recommendation_response_rate;
  insert into r select 4,'recommendation.available (M17 oncesi)', p_txt, 'false (tavsiye tablosu YOK)',
    case when p_txt='false'
          and not exists (select 1 from information_schema.tables
                          where table_schema='public' and table_name in ('recommendations','recommendation_requests','user_recommendations'))
         then 'ESLESTI' else '!!! FARK' end;

  -- 4) invite_signups.total vs doğrudan redemption sayımı
  select total into p_num from public.metrics_invite_signups;
  select count(*) into g_num from public.user_invite_redemptions;
  insert into r select 5,'invite_signups.total', p_num::text, g_num::text,
    case when p_num is not distinct from g_num then 'ESLESTI' else '!!! FARK' end;

  -- 5) 30d_return_rate — cohort + returned doğrudan auth.users sayımıyla
  select cohort_size, returned, return_rate into p_cohort, p_returned, p_rate from public.metrics_30d_return_rate;
  select count(*) into g_cohort from auth.users where created_at <= now() - interval '30 days';
  select count(*) into g_returned from auth.users
    where created_at <= now() - interval '30 days' and last_sign_in_at >= now() - interval '30 days';
  insert into r select 6,'30d_return_rate.cohort_size', p_cohort::text, g_cohort::text,
    case when p_cohort is not distinct from g_cohort then 'ESLESTI' else '!!! FARK' end;
  insert into r select 7,'30d_return_rate.returned', p_returned::text, g_returned::text,
    case when p_returned is not distinct from g_returned then 'ESLESTI' else '!!! FARK' end;
  -- rate = returned/cohort (cohort 0 ise NULL — uydurma yüzde yok)
  insert into r select 8,'30d_return_rate.return_rate tutarlı',
    coalesce(p_rate::text,'NULL'),
    case when g_cohort=0 then 'NULL' else round(g_returned::numeric/g_cohort,4)::text end,
    case when (g_cohort=0 and p_rate is null)
              or (g_cohort>0 and p_rate = round(g_returned::numeric/g_cohort,4))
         then 'ESLESTI' else '!!! FARK' end;
end $x$;

\echo ''
\echo '=========== M16 CANLI DOGRULAMA (panel == SQL) ==========='
select * from r order by no;
select case when count(*) filter (where sonuc='ESLESTI')=count(*)
            then 'TUMU ESLESTI: '||count(*)::text||' metrik'
            else '!!! '||(count(*) filter (where sonuc<>'ESLESTI'))::text||' FARK' end as ozet
from r;
rollback;
\echo '== ROLLBACK =='
select 'CANLI temiz (m16-admin kalinti=0)' as ad,
  case when (select count(*) from auth.users where email='m16-admin@test.local')=0
       then 'GECTI' else '!!! DUSTU' end as sonuc;
