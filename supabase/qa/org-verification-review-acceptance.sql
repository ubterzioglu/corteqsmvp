-- G07 · Kurumsal doğrulama ADMIN inceleme — kabul (geri alınan işlem).
-- review_org_verification_v1 + admin_list_org_verifications (migration 20261003130000).
--
-- 🔴 Tek kod eşleştirme (OR ile gevşetme YOK) · fixture ERKEN kontrole takılmasın
--    (G06 dersi): her red iddiası DOĞRU sebeple düşmeli (ör. reason_required testi
--    pending+verification bir claim'le koşar, not_found'a takılmaz).
-- 🔴 Onay = catalog_items.verification_status='verified' + verified_at + verified_by
--    + claim approved/reviewed_* (hepsi ölçülür). Rozet/filtre yayılımı YOK (G07 kapsamı).
\set ON_ERROR_STOP on
begin;

create temp table t(k text primary key, v uuid) on commit drop;
insert into auth.users (id, email) values
  (gen_random_uuid(),'g07-admin@test.local'),
  (gen_random_uuid(),'g07-req@test.local');
insert into t select split_part(email,'@',1), id from auth.users where email like 'g07-%@test.local';
update user_role_assignments
   set role_id=(select id from roles where key='Admin_PlatformAdmin')
 where user_id=(select v from t where k='g07-admin');

-- Kurumsal katalog kaydı (published, organization).
insert into catalog_items (id, slug, title, item_type, platform_role_key, status, visibility, is_placeholder)
values (gen_random_uuid(),'g07-dernek','G07 Test Derneği','organization','Organization_AssociationFoundation','published','public',false);
create temp table ti(k text primary key, v uuid) on commit drop;
insert into ti values ('item',(select id from catalog_items where slug='g07-dernek'));

-- 3 talep: approve edilecek · reject edilecek · (K6) editor_access (not_verification).
create temp table tc(k text primary key, v uuid) on commit drop;
insert into catalog_item_claims (id, item_id, requested_by_user_id, claim_type, evidence, note, status)
values
  (gen_random_uuid(),(select v from ti where k='item'),(select v from t where k='g07-req'),'verification_level_2',
   jsonb_build_object('documents', jsonb_build_array((select v from t where k='g07-req')::text||'/'||(select v from ti where k='item')::text||'/tuzuk.pdf')),
   'Tüzük ekte','pending'),
  (gen_random_uuid(),(select v from ti where k='item'),(select v from t where k='g07-req'),'verification_level_2',
   jsonb_build_object('documents', jsonb_build_array('x/y/belge.pdf')),'Yetki belgesi','pending'),
  (gen_random_uuid(),(select v from ti where k='item'),(select v from t where k='g07-req'),'editor_access',
   '{}'::jsonb,'Editor istiyorum','pending');
insert into tc
  select 'approve', id from catalog_item_claims where note='Tüzük ekte'
  union all select 'reject', id from catalog_item_claims where note='Yetki belgesi'
  union all select 'editor', id from catalog_item_claims where note='Editor istiyorum';

create temp table r(no int, ad text, sonuc text) on commit drop;

do $x$
declare
  u_admin uuid := (select v from t where k='g07-admin');
  u_req   uuid := (select v from t where k='g07-req');
  c_approve uuid := (select v from tc where k='approve');
  c_reject  uuid := (select v from tc where k='reject');
  c_editor  uuid := (select v from tc where k='editor');
  v_item  uuid := (select v from ti where k='item');
  q jsonb; nq int; docn int;
  v_res jsonb;
  v_status text; v_vstatus text; v_reason text;
  v_verified_by uuid; v_verified_at timestamptz; v_reviewed_by uuid;
begin
  perform set_config('request.jwt.claims', json_build_object('sub',u_admin)::text, true);

  -- K1: admin kuyruğu okur, verification talebi doc_paths ile görünür.
  select count(*), coalesce(max(array_length(doc_paths,1)),0) into nq, docn
    from public.admin_list_org_verifications('pending');
  insert into r select 1,'K1 admin kuyrugu okur (pending verification + doc_paths)',
    case when nq>=2 and docn=1 then 'GECTI ('||nq||' talep, doc='||docn||')'
         else '!!! DUSTU: n='||nq||' doc='||docn end;

  -- K2: ONAY -> catalog_items verified + verified_at + verified_by + claim approved/reviewed_*
  v_res := public.review_org_verification_v1(c_approve, true, null);
  select verification_status, verified_at, verified_by_user_id into v_vstatus, v_verified_at, v_verified_by
    from catalog_items where id=v_item;
  select status, reviewed_by_user_id into v_status, v_reviewed_by from catalog_item_claims where id=c_approve;
  insert into r select 2,'K2 ONAY -> item verified + verified_at + verified_by + claim approved/reviewed',
    case when v_vstatus='verified' and v_verified_at is not null and v_verified_by=u_admin
          and v_status='approved' and v_reviewed_by=u_admin
         then 'GECTI' else '!!! DUSTU: item='||coalesce(v_vstatus,'null')||' claim='||coalesce(v_status,'null') end;

  -- K3: RET (sebep ile) -> claim rejected + review_reason evidence'ta
  v_res := public.review_org_verification_v1(c_reject, false, 'Belge yetersiz');
  select status, evidence->>'review_reason' into v_status, v_reason from catalog_item_claims where id=c_reject;
  insert into r select 3,'K3 RET (sebeple) -> claim rejected + review_reason kayitli',
    case when v_status='rejected' and v_reason='Belge yetersiz' then 'GECTI'
         else '!!! DUSTU: status='||coalesce(v_status,'null')||' reason='||coalesce(v_reason,'null') end;

  -- K4: RET sebepsiz -> TEK kod reason_required (fixture pending+verification, erken kontrole takilmaz)
  begin
    -- yeni bir pending verification claim (sebepsiz ret icin)
    insert into catalog_item_claims (id, item_id, requested_by_user_id, claim_type, evidence, note, status)
    values (gen_random_uuid(), v_item, u_req, 'verification_level_2', '{}'::jsonb, 'sebepsiz-ret','pending');
    perform public.review_org_verification_v1((select id from catalog_item_claims where note='sebepsiz-ret'), false, null);
    insert into r select 4,'K4 RET sebepsiz -> reason_required (TEK kod)','!!! DUSTU: gecti';
  exception when others then
    insert into r select 4,'K4 RET sebepsiz -> reason_required (TEK kod)',
      case when sqlerrm like '%org_verification_review_reason_required%' then 'GECTI' else '!!! DUSTU: '||sqlerrm end;
  end;

  -- K5: zaten incelenmis (K2'de approved) -> already_reviewed
  begin
    perform public.review_org_verification_v1(c_approve, true, null);
    insert into r select 5,'K5 yeniden inceleme -> already_reviewed','!!! DUSTU: gecti';
  exception when others then
    insert into r select 5,'K5 yeniden inceleme -> already_reviewed',
      case when sqlerrm like '%org_verification_review_already_reviewed%' then 'GECTI' else '!!! DUSTU: '||sqlerrm end;
  end;

  -- K6: editor_access claim -> not_verification
  begin
    perform public.review_org_verification_v1(c_editor, true, null);
    insert into r select 6,'K6 editor_access claim -> not_verification','!!! DUSTU: gecti';
  exception when others then
    insert into r select 6,'K6 editor_access claim -> not_verification',
      case when sqlerrm like '%org_verification_review_not_verification%' then 'GECTI' else '!!! DUSTU: '||sqlerrm end;
  end;

  -- K7: non-admin -> auth_required (list + review)
  perform set_config('request.jwt.claims', json_build_object('sub',u_req)::text, true);
  begin
    perform public.admin_list_org_verifications('pending');
    insert into r select 7,'K7 non-admin -> auth_required','!!! DUSTU: list gecti';
  exception when others then
    insert into r select 7,'K7 non-admin -> auth_required',
      case when sqlerrm like '%org_verification_review_auth_required%' then 'GECTI' else '!!! DUSTU: '||sqlerrm end;
  end;

  -- K8: olmayan claim -> claim_not_found (admin olarak)
  perform set_config('request.jwt.claims', json_build_object('sub',u_admin)::text, true);
  begin
    perform public.review_org_verification_v1(gen_random_uuid(), true, null);
    insert into r select 8,'K8 olmayan claim -> claim_not_found','!!! DUSTU: gecti';
  exception when others then
    insert into r select 8,'K8 olmayan claim -> claim_not_found',
      case when sqlerrm like '%org_verification_review_claim_not_found%' then 'GECTI' else '!!! DUSTU: '||sqlerrm end;
  end;
end $x$;

-- K9: grant'lar — anon execute YOK, authenticated VAR (her iki RPC).
insert into r select 9,'K9 grant: anon execute YOK / authenticated VAR (2 RPC)',
  case when not has_function_privilege('anon','public.admin_list_org_verifications(text)','execute')
        and not has_function_privilege('anon','public.review_org_verification_v1(uuid,boolean,text)','execute')
        and has_function_privilege('authenticated','public.admin_list_org_verifications(text)','execute')
        and has_function_privilege('authenticated','public.review_org_verification_v1(uuid,boolean,text)','execute')
       then 'GECTI' else '!!! DUSTU' end;

\echo ''
\echo '================= G07 KABUL (K1-K9) ================='
select * from r order by no;
select case when count(*) filter (where sonuc like 'GECTI%')=count(*)
            then 'TUMU GECTI: '||count(*)::text
            else '!!! '||(count(*) filter (where sonuc not like 'GECTI%'))::text||' DUSTU' end as ozet
from r;
rollback;
\echo '== ROLLBACK =='
select 'CANLI temiz (g07-* kalinti=0)' as ad,
  case when (select count(*) from auth.users where email like 'g07-%@test.local')=0
        and (select count(*) from catalog_items where slug='g07-dernek')=0
       then 'GECTI' else '!!! DUSTU' end as sonuc;
