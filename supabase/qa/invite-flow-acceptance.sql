-- M13 · Faz 3 canlı doğrulama — kayıt akışı davet tüketimi (K1–K5)
-- Geri alınan işlem içinde koşar; migration M11 (20261003050000) ZATEN canlıda.
-- Ölçülen: redeem_invite_code + get_invite_leaderboard invariantları.
--
-- 🔴 "GEÇTİ" sebepleri yanlış olmamalı (G06 dersi): K5'te admin'i ELEME iddiası,
--    admin'in geçerli katalog kaydı + redemption'ı VARKEN ölçülür (join değil
--    `not is_admin` filtresi eler) + POZİTİF KONTROL (admin-olmayan davetçi
--    listede GÖRÜNÜR) — aksi halde "hiç kimse görünmüyor" da vakum geçerdi.
\set ON_ERROR_STOP on
begin;

create temp table t(k text primary key, v uuid) on commit drop;
insert into auth.users (id, email) values
  (gen_random_uuid(),'m13-inviter@test.local'),
  (gen_random_uuid(),'m13-invitee@test.local'),
  (gen_random_uuid(),'m13-invitee2@test.local'),
  (gen_random_uuid(),'m13-admin@test.local');
insert into t select split_part(email,'@',1), id from auth.users where email like 'm13-%@test.local';

-- Liderlik join'i geçsin diye inviter + admin'e geçerli üye kataloğu.
insert into catalog_items (id, slug, title, item_type, platform_role_key, status, visibility, is_placeholder)
values (gen_random_uuid(),'m13-inviter','M13 Inviter','member','User_DiasporaMember','published','public',false),
       (gen_random_uuid(),'m13-admin','M13 Admin','member','User_DiasporaMember','published','public',false);

create temp table ti(k text primary key, v uuid) on commit drop;
insert into ti values
  ('inviter',(select id from catalog_items where slug='m13-inviter')),
  ('admin',(select id from catalog_items where slug='m13-admin'));

insert into catalog_item_managers (item_id, user_id, role, status)
select v,(select v from t where k='m13-inviter'),'owner','active' from ti where k='inviter';
insert into catalog_item_managers (item_id, user_id, role, status)
select v,(select v from t where k='m13-admin'),'owner','active' from ti where k='admin';

-- m13-admin GERÇEK admin (is_admin true): user_role_assignments PK=user_id (üye
-- başına TEK rol; auth.users insert trigger'ı varsayılan rolü ZATEN atadı) ->
-- insert DEĞİL update ile Admin_% rolüne yükselt.
update user_role_assignments
   set role_id=(select id from roles where key='Admin_PlatformAdmin')
 where user_id=(select v from t where k='m13-admin');

create temp table r(no int, ad text, sonuc text) on commit drop;

do $x$
declare
  u_inviter  uuid := (select v from t where k='m13-inviter');
  u_invitee  uuid := (select v from t where k='m13-invitee');
  u_invitee2 uuid := (select v from t where k='m13-invitee2');
  u_admin    uuid := (select v from t where k='m13-admin');
  v_code text;
  v_admin_code text;
  v_res jsonb;
  v_cnt int;
  v_lb jsonb;
begin
  -- Davetçi kendi kodunu üretir.
  perform set_config('request.jwt.claims', json_build_object('sub',u_inviter)::text, true);
  v_code := get_or_create_my_invite_code()->>'code';

  -- K1: yeni üye geçerli kodu kullanır -> TAM 1 redemption satırı, redeemed:true already:false
  perform set_config('request.jwt.claims', json_build_object('sub',u_invitee)::text, true);
  v_res := redeem_invite_code(v_code);
  select count(*) into v_cnt from user_invite_redemptions where invited_user_id=u_invitee;
  insert into r select 1,'K1 davet linkiyle kayit -> redemption satiri (redeemed:true,already:false,1 satir)',
    case when (v_res->>'redeemed')='true' and (v_res->>'already')='false' and v_cnt=1
         then 'GECTI' else '!!! DUSTU: '||coalesce(v_res::text,'null')||' cnt='||v_cnt end;

  -- K2: AYNI kullanıcı ikinci kez -> already:true, satır sayısı HALA 1 (çift sayım yok)
  v_res := redeem_invite_code(v_code);
  select count(*) into v_cnt from user_invite_redemptions where invited_user_id=u_invitee;
  insert into r select 2,'K2 AYNI kullanici ikinci kez SAYILMAZ (already:true, hala 1 satir)',
    case when (v_res->>'already')='true' and v_cnt=1
         then 'GECTI' else '!!! DUSTU: '||coalesce(v_res::text,'null')||' cnt='||v_cnt end;

  -- K3: geçersiz/uydurma kod -> TEK kod invite_code_not_found (OR ile gevşetilmez).
  --     Bu, "geçersiz kodla kayıt YİNE BAŞARILI" sözünün SQL tarafı: hata KONTROLLÜ
  --     ve ÖZGÜN; istemci fire-and-forget yakalar (14 TS testi kilidi), kayıt düşmez.
  begin
    perform redeem_invite_code('ZZZZZZ');
    insert into r select 3,'K3 gecersiz kod -> invite_code_not_found (kayit dusmez, TEK kod)','!!! DUSTU: gecti';
  exception when others then
    insert into r select 3,'K3 gecersiz kod -> invite_code_not_found (kayit dusmez, TEK kod)',
      case when sqlerrm like '%invite_code_not_found%' then 'GECTI' else '!!! DUSTU: '||sqlerrm end;
  end;

  -- K4: kendi kodunu kullanma -> TEK kod invite_self_not_allowed
  perform set_config('request.jwt.claims', json_build_object('sub',u_inviter)::text, true);
  begin
    perform redeem_invite_code(v_code);
    insert into r select 4,'K4 kendi kodu -> invite_self_not_allowed (TEK kod)','!!! DUSTU: gecti';
  exception when others then
    insert into r select 4,'K4 kendi kodu -> invite_self_not_allowed (TEK kod)',
      case when sqlerrm like '%invite_self_not_allowed%' then 'GECTI' else '!!! DUSTU: '||sqlerrm end;
  end;

  -- K5 hazırlık: admin davetçiye de geçerli kod + redemption (invitee2 ile).
  perform set_config('request.jwt.claims', json_build_object('sub',u_admin)::text, true);
  v_admin_code := get_or_create_my_invite_code()->>'code';
  perform set_config('request.jwt.claims', json_build_object('sub',u_invitee2)::text, true);
  perform redeem_invite_code(v_admin_code);

  -- K5: /liderlik — admin-olmayan davetçi GÖRÜNÜR (pozitif kontrol) + admin GÖRÜNMEZ.
  perform set_config('request.jwt.claims', '', true);
  v_lb := get_invite_leaderboard(null);
  insert into r select 5,'K5 /liderlik: admin YOK (gecerli katalog+redemption olsa da) + non-admin davetci VAR',
    case when (select count(*) from jsonb_array_elements(v_lb->'entries') e
                where e->>'display_name'='M13 Admin')=0
          and (select count(*) from jsonb_array_elements(v_lb->'entries') e
                where e->>'display_name'='M13 Inviter' and (e->>'invite_count')::int=1)=1
         then 'GECTI' else '!!! DUSTU: '||v_lb::text end;
end $x$;

\echo ''
\echo '================= M13 KABUL (K1-K5) ================='
select * from r order by no;
select case when count(*) filter (where sonuc like 'GECTI%')=count(*)
            then 'TUMU GECTI: '||count(*)::text
            else '!!! '||(count(*) filter (where sonuc not like 'GECTI%'))::text||' DUSTU' end as ozet
from r;

-- Anon grant ölçümü: redeem_invite_code anon'a KAPALI, leaderboard anon'a ACIK.
select 'K-grant: redeem anon execute YOK' as ad,
  case when not has_function_privilege('anon','public.redeem_invite_code(text)','execute')
       then 'GECTI' else '!!! DUSTU' end as sonuc;
select 'K-grant: leaderboard anon execute VAR' as ad,
  case when has_function_privilege('anon','public.get_invite_leaderboard(integer)','execute')
       then 'GECTI' else '!!! DUSTU' end as sonuc;

rollback;
\echo '== ROLLBACK =='

-- Rollback sonrası CANLI temiz: test verisi sıfır (baseline korunur).
select 'CANLI temiz (m13-* kalinti=0)' as ad,
  case when (select count(*) from auth.users where email like 'm13-%@test.local')=0
        and (select count(*) from catalog_items where slug in ('m13-inviter','m13-admin'))=0
        and (select count(*) from user_invites)=0
        and (select count(*) from user_invite_redemptions)=0
       then 'GECTI' else '!!! DUSTU' end as sonuc;
