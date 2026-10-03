\set ON_ERROR_STOP on
begin;
\i supabase/migrations/applied/20261003100000_org_verification.sql

create temp table t(k text primary key, v uuid) on commit drop;
insert into auth.users (id, email) values
  (gen_random_uuid(),'g06-linked@test.local'),
  (gen_random_uuid(),'g06-unlinked@test.local');
insert into t select split_part(email,'@',1), id from auth.users where email like 'g06-%@test.local';

insert into catalog_items (id, slug, title, item_type, platform_role_key, verification_status)
values (gen_random_uuid(),'g06-dernek','G06 Dernek','organization','Organization_AssociationFoundation','unverified'),
       (gen_random_uuid(),'g06-dogrulanmis','G06 Dogrulanmis','organization','Organization_AssociationFoundation','verified'),
       (gen_random_uuid(),'g06-birey','G06 Birey','member','User_DiasporaMember','unverified');

create temp table ti(k text primary key, v uuid) on commit drop;
insert into ti values
  ('dernek',(select id from catalog_items where title='G06 Dernek')),
  ('dogrulanmis',(select id from catalog_items where title='G06 Dogrulanmis')),
  ('birey',(select id from catalog_items where title='G06 Birey'));

insert into catalog_item_managers (item_id, user_id, role, status)
select v,(select v from t where k='g06-linked'),'owner','active' from ti where k in ('dernek','dogrulanmis');

create temp table r(no int, ad text, sonuc text) on commit drop;

do $x$
declare
  u_linked uuid := (select v from t where k='g06-linked');
  u_un uuid := (select v from t where k='g06-unlinked');
  i_dernek uuid := (select v from ti where k='dernek');
  i_dogru uuid := (select v from ti where k='dogrulanmis');
  i_birey uuid := (select v from ti where k='birey');
  cid uuid;
begin
  perform set_config('request.jwt.claims', json_build_object('sub',u_linked)::text, true);

  begin
    cid := request_org_verification_v1(i_dernek, array[u_linked::text||'/'||i_dernek::text||'/belge.pdf'], 'tuzuk');
    insert into r select 1,'A1 linked kullanici talep acabiliyor',
      case when (select claim_type from catalog_item_claims where id=cid)='verification_level_2'
            and (select status from catalog_item_claims where id=cid)='pending'
            and (select evidence->>'bucket' from catalog_item_claims where id=cid)='org-verification-docs'
           then 'GECTI' else '!!! DUSTU' end;
  exception when others then insert into r select 1,'A1 linked talep','!!! DUSTU: '||sqlerrm; end;

  begin
    perform request_org_verification_v1(i_dernek, array[u_linked::text||'/x.pdf'], null);
    insert into r select 2,'A2 mukerrer bekleyen reddedilir','!!! DUSTU: gecti';
  exception when others then insert into r select 2,'A2 mukerrer bekleyen reddedilir',
    case when sqlerrm like '%pending_exists%' then 'GECTI' else '!!! DUSTU: '||sqlerrm end; end;

  begin
    perform request_org_verification_v1(i_dogru, array[u_linked::text||'/x.pdf'], null);
    insert into r select 3,'A3 zaten verified reddedilir','!!! DUSTU: gecti';
  exception when others then insert into r select 3,'A3 zaten verified reddedilir',
    case when sqlerrm like '%already_verified%' then 'GECTI' else '!!! DUSTU: '||sqlerrm end; end;

  begin
    perform request_org_verification_v1(i_birey, array[u_linked::text||'/x.pdf'], null);
    insert into r select 4,'A4 kurumsal olmayan reddedilir','!!! DUSTU: gecti';
  exception when others then insert into r select 4,'A4 kurumsal olmayan reddedilir',
    case when sqlerrm like '%not_organization%' then 'GECTI' else '!!! DUSTU: '||sqlerrm end; end;

  begin
    -- ⚠️ Kurumsal + bagli + dogrulanmamis kayit kullanilir: aksi halde kontrol
    -- not_organization'da ERKEN patlar ve iddia YANLIS SEBEPLE gecer (ilk turda
    -- tam bu oldu, G2 mutasyonu vakum cikti). Tek kod kabul edilir.
    perform request_org_verification_v1(i_dernek, array[u_un::text||'/x.pdf'], null);
    insert into r select 5,'A5 baskasinin klasoru reddedilir','!!! DUSTU: gecti';
  exception when others then insert into r select 5,'A5 baskasinin klasoru reddedilir',
    case when sqlerrm like '%path_forbidden%' then 'GECTI' else '!!! DUSTU: '||sqlerrm end; end;

  begin
    perform request_org_verification_v1(i_dernek, array[]::text[], null);
    insert into r select 6,'A6 belgesiz reddedilir','!!! DUSTU: gecti';
  exception when others then insert into r select 6,'A6 belgesiz reddedilir',
    case when sqlerrm like '%document_required%' or sqlerrm like '%pending_exists%' then 'GECTI' else '!!! DUSTU: '||sqlerrm end; end;

  begin
    perform request_org_verification_v1(i_dernek, array[u_linked::text||'/a.pdf',u_linked::text||'/b.pdf',
      u_linked::text||'/c.pdf',u_linked::text||'/d.pdf',u_linked::text||'/e.pdf',u_linked::text||'/f.pdf'], null);
    insert into r select 7,'A7 6 belge reddedilir','!!! DUSTU: gecti';
  exception when others then insert into r select 7,'A7 6 belge reddedilir',
    case when sqlerrm like '%too_many_documents%' then 'GECTI' else '!!! DUSTU: '||sqlerrm end; end;

  perform set_config('request.jwt.claims', json_build_object('sub',u_un)::text, true);
  begin
    -- Ayni tuzak: kurumsal kayit olmali ki kontrol gercekten bag dalina gelsin.
    perform request_org_verification_v1(i_dernek, array[u_un::text||'/x.pdf'], null);
    insert into r select 8,'A8 bagsiz kullanici reddedilir','!!! DUSTU: gecti';
  exception when others then insert into r select 8,'A8 bagsiz kullanici reddedilir',
    case when sqlerrm like '%not_linked%' then 'GECTI' else '!!! DUSTU: '||sqlerrm end; end;

  perform set_config('request.jwt.claims', '', true);
  begin
    perform request_org_verification_v1(i_dernek, array['a/x.pdf'], null);
    insert into r select 9,'A9 oturumsuz reddedilir','!!! DUSTU: gecti';
  exception when others then insert into r select 9,'A9 oturumsuz reddedilir',
    case when sqlerrm like '%auth_required%' then 'GECTI' else '!!! DUSTU: '||sqlerrm end; end;

  insert into r select 10,'A10 is_level2: dogrulanmis kurulus yoneticisi TRUE',
    case when is_level2_org_representative(u_linked) then 'GECTI' else '!!! DUSTU' end;
  insert into r select 11,'A11 is_level2: bagsiz kullanici FALSE',
    case when not is_level2_org_representative(u_un) then 'GECTI' else '!!! DUSTU' end;
  -- ⚠️ Asil kilit: DOGRULANMAMIS kurulusun yoneticisi de FALSE olmali. Bagsiz
  -- kullaniciyla olcmek yetmez (o zaten her halukarda false) — verification_status
  -- kosulu silinse bile gecerdi (G7 mutasyonu ilk turda vakum cikti).
  insert into catalog_item_managers (item_id, user_id, role, status)
  values (i_dernek, u_un, 'owner', 'active');
  insert into r select 15,'A15 is_level2: DOGRULANMAMIS kurulus yoneticisi FALSE',
    case when not is_level2_org_representative(u_un) then 'GECTI' else '!!! DUSTU' end;
end $x$;

insert into r select 12,'A12 kova private + 15MB + 4 MIME + octet-stream YOK',
  case when not public and file_size_limit=15728640 and array_length(allowed_mime_types,1)=4
        and not ('application/octet-stream' = any(allowed_mime_types))
       then 'GECTI' else '!!! DUSTU' end
from storage.buckets where id='org-verification-docs';

insert into r select 13,'A13 anon RPC grant YOK',
  case when not has_function_privilege('anon','public.request_org_verification_v1(uuid,text[],text)','execute')
       then 'GECTI' else '!!! DUSTU' end;

insert into r select 14,'A14 iz kolonlari var, gecmis kayitlar UYDURULMADI',
  case when (select count(*) from information_schema.columns where table_name='catalog_items'
             and column_name in ('verified_at','verified_by_user_id'))=2
        and (select count(*) from catalog_items where verification_status='verified' and verified_at is not null)=0
       then 'GECTI' else '!!! DUSTU' end;

\echo ''
\echo '================= G06 KABUL ================='
select * from r order by no;
select case when count(*) filter (where sonuc like 'GECTI%')=count(*) then 'TUMU GECTI: '||count(*)::text
            else '!!! '||(count(*) filter (where sonuc not like 'GECTI%'))::text||' DUSTU' end as ozet from r;
rollback;
\echo '== ROLLBACK =='
