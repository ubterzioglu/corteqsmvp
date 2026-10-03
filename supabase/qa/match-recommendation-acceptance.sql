-- M18 · match_recommendation_professionals — kabul (geri alınan işlem).
-- Ölçülen: EŞLEŞME SIRALAR (eler değil) · catalog_search_normalize katlama (case) ·
-- kısmi eşleşme KAPSANIR (kategori tutmasa da şehir/ülke ile listede) · İLETİŞİM
-- SIZINTISI YOK (search_text okunmaz, dönen kolonlarda email/telefon yok) · auth · grant.
--
-- 🔴 AYIRT: skorlar ÖLÇÜLÜR (A=145 > B=115 > C=45) — "liste dolu" demek yetmez,
--    doğru SIRALAMA ve doğru SKOR kanıtlanır (vakum geçiş yok).
\set ON_ERROR_STOP on
begin;

create temp table t(k text primary key, v uuid) on commit drop;
insert into auth.users (id, email) values
  (gen_random_uuid(),'m18-req@test.local'),
  (gen_random_uuid(),'m18-admin@test.local');
insert into t select split_part(email,'@',1), id from auth.users where email like 'm18-%@test.local';
update user_role_assignments set role_id=(select id from roles where key='Admin_PlatformAdmin')
 where user_id=(select v from t where k='m18-admin');

-- 4 test profesyoneli (member, published, public, non-placeholder, directory-visible rol).
-- A: terzi + Dortmund + DE (tam)  B: terzi + Berlin + DE  C: doktor + Dortmund + DE (kısmi)
-- D: doktor + Paris + FR (eşleşmez)
create temp table tp(k text primary key, item uuid, slug text) on commit drop;
insert into catalog_items (id, slug, title, item_type, platform_role_key, status, visibility, is_placeholder, city, country_code)
values
  (gen_random_uuid(),'m18-pro-a','M18 Terzi A','member','User_DiasporaMember','published','public',false,'Dortmund','DE'),
  (gen_random_uuid(),'m18-pro-b','M18 Terzi B','member','User_DiasporaMember','published','public',false,'Berlin','DE'),
  (gen_random_uuid(),'m18-pro-c','M18 Doktor C','member','User_DiasporaMember','published','public',false,'Dortmund','DE'),
  (gen_random_uuid(),'m18-pro-d','M18 Doktor D','member','User_DiasporaMember','published','public',false,'Paris','FR');
insert into tp
  select 'a', id, slug from catalog_items where slug='m18-pro-a'
  union all select 'b', id, slug from catalog_items where slug='m18-pro-b'
  union all select 'c', id, slug from catalog_items where slug='m18-pro-c'
  union all select 'd', id, slug from catalog_items where slug='m18-pro-d';

-- category_slugs search doc'ta (trigger test öğesi için üretmez) — search_text
-- NOT NULL ama match fonksiyonu ONU OKUMAZ; testte boş bırak (iletişim yok).
insert into catalog_search_documents (item_id, item_type, title, search_text, category_slugs, country_code, city)
select item, 'member', 'M18', '', cat, cc, ct from (
  select (select item from tp where k='a') as item, '{terzi}'::text[] as cat, 'DE' cc, 'Dortmund' ct
  union all select (select item from tp where k='b'), '{terzi}', 'DE', 'Berlin'
  union all select (select item from tp where k='c'), '{doktor}', 'DE', 'Dortmund'
  union all select (select item from tp where k='d'), '{doktor}', 'FR', 'Paris'
) z
on conflict (item_id) do update set category_slugs=excluded.category_slugs;

-- Talep: category 'Terzi' (BÜYÜK harf — normalize katlamayı test eder), city Dortmund, country DE.
insert into recommendation_requests (id, user_id, title, body, category_slug, country, city, status, diaspora_key)
values (gen_random_uuid(), (select v from t where k='m18-req'), 'Terzi lazım', 'Dortmund sehri icin güvenilir terzi','Terzi','DE','Dortmund','open','tr');
create temp table tq(v uuid) on commit drop;
insert into tq select id from recommendation_requests where title='Terzi lazım';

create temp table r(no int, ad text, sonuc text) on commit drop;

-- Sonucu temp tabloya al (sıra + skor).
create temp table mres(rnk int, item_id uuid, title text, match_score int, match_reason text) on commit drop;

do $x$
declare
  u_req uuid := (select v from t where k='m18-req');
  v_req uuid := (select v from tq);
  ia uuid := (select item from tp where k='a');
  ib uuid := (select item from tp where k='b');
  ic uuid := (select item from tp where k='c');
  sa int; sb int; sc int; ra int; rb int; rc int; nres int;
  v_def text;
begin
  perform set_config('request.jwt.claims', json_build_object('sub',u_req)::text, true);

  -- 🔴 Fonksiyonun KENDİ çıktı sırasını yakala (over () = geliş sırası, YENİDEN
  --    SIRALAMA YOK). `order by match_score` ile yakalarsak fonksiyonun sıralaması
  --    bozulsa bile test geçmezdi (M1 mutasyonu bunu yakaladı: kabul yeniden sıralıyordu).
  insert into mres
  select row_number() over (), item_id, title, match_score, match_reason
  from public.match_recommendation_professionals(v_req, 100);

  select count(*) into nres from mres;
  select match_score, rnk into sa, ra from mres where item_id=ia;
  select match_score, rnk into sb, rb from mres where item_id=ib;
  select match_score, rnk into sc, rc from mres where item_id=ic;

  -- K1: TAM eşleşme (A: kategori+şehir+ülke) skoru 145 ve LİSTE BAŞI.
  insert into r select 1,'K1 tam eslesme A skor=145 ve liste basi (rnk=1)',
    case when sa=145 and ra=1 then 'GECTI (skor='||sa||' rnk='||ra||')'
         else '!!! DUSTU: skor='||coalesce(sa::text,'null')||' rnk='||coalesce(ra::text,'null') end;

  -- K2: SIRALAMA A(145) > B(115) > C(45) — eşleşme SIRALAR (match_rank dersi).
  insert into r select 2,'K2 siralama A>B>C (skor 145>115>45)',
    case when sa=145 and sb=115 and sc=45 and ra<rb and rb<rc then 'GECTI'
         else '!!! DUSTU: A='||coalesce(sa::text,'?')||'('||coalesce(ra::text,'?')||') B='||coalesce(sb::text,'?')||'('||coalesce(rb::text,'?')||') C='||coalesce(sc::text,'?')||'('||coalesce(rc::text,'?')||')' end;

  -- K3: KISMİ eşleşme KAPSANIR (C kategori tutmaz ama şehir+ülke ile listede) — ELER DEĞİL.
  insert into r select 3,'K3 kismi eslesme C listede (kategori tutmasa da — ELER DEGIL SIRALAR)',
    case when sc is not null and sc=45 then 'GECTI (C skor='||sc||' listede)'
         else '!!! DUSTU: C skor='||coalesce(sc::text,'null')||' (dislandi mi?)' end;

  -- K4: normalize KATLAMA — talep 'Terzi' (büyük), doc 'terzi' (küçük) -> kategori eşleşti
  --     (A skoru 145'in içinde kategori 100 var; case farkı katlandı).
  insert into r select 4,'K4 catalog_search_normalize katlama (Terzi~terzi, skor 145 icerir kategori 100)',
    case when sa=145 then 'GECTI (kategori puani case-farkina ragmen geldi)'
         else '!!! DUSTU: A skor='||coalesce(sa::text,'null')||' (100 kategori yoksa katlama bozuk)' end;

  -- K5: İLETİŞİM SIZINTISI YOK — fonksiyon tanımı search_text OKUMAZ.
  select pg_get_functiondef('public.match_recommendation_professionals(uuid,integer)'::regprocedure) into v_def;
  insert into r select 5,'K5 iletisim sizintisi YOK (fonksiyon search_text okumaz)',
    case when v_def not like '%search_text%' then 'GECTI'
         else '!!! DUSTU: search_text kullaniliyor' end;

  -- K6: dönen kolonlar iletişim İÇERMEZ (match_reason yalnız kategori/şehir/ülke etiketleri).
  insert into r select 6,'K6 match_reason yalniz etiket (kategori/sehir/ulke) — email/telefon YOK',
    case when not exists (select 1 from mres where match_reason ~* '[@0-9]{3}' or match_reason like '%http%')
          and exists (select 1 from mres where item_id=ia and match_reason='kategori, şehir, ülke')
         then 'GECTI' else '!!! DUSTU' end;

  -- K7: oturumsuz -> recommendation_auth_required
  perform set_config('request.jwt.claims', '', true);
  begin
    perform public.match_recommendation_professionals(v_req, 10);
    insert into r select 7,'K7 oturumsuz -> recommendation_auth_required','!!! DUSTU: gecti';
  exception when others then
    insert into r select 7,'K7 oturumsuz -> recommendation_auth_required',
      case when sqlerrm like '%recommendation_auth_required%' then 'GECTI' else '!!! DUSTU: '||sqlerrm end;
  end;

  -- K8: olmayan talep -> recommendation_request_not_found
  perform set_config('request.jwt.claims', json_build_object('sub',u_req)::text, true);
  begin
    perform public.match_recommendation_professionals(gen_random_uuid(), 10);
    insert into r select 8,'K8 olmayan talep -> recommendation_request_not_found','!!! DUSTU: gecti';
  exception when others then
    insert into r select 8,'K8 olmayan talep -> recommendation_request_not_found',
      case when sqlerrm like '%recommendation_request_not_found%' then 'GECTI' else '!!! DUSTU: '||sqlerrm end;
  end;
end $x$;

-- K9: grant — anon execute YOK, authenticated VAR.
insert into r select 9,'K9 grant: anon execute YOK / authenticated VAR',
  case when not has_function_privilege('anon','public.match_recommendation_professionals(uuid,integer)','execute')
        and has_function_privilege('authenticated','public.match_recommendation_professionals(uuid,integer)','execute')
       then 'GECTI' else '!!! DUSTU' end;

\echo ''
\echo '================= M18 KABUL (K1-K9) ================='
select * from r order by no;
select case when count(*) filter (where sonuc like 'GECTI%')=count(*)
            then 'TUMU GECTI: '||count(*)::text
            else '!!! '||(count(*) filter (where sonuc not like 'GECTI%'))::text||' DUSTU' end as ozet
from r;
rollback;
\echo '== ROLLBACK =='
select 'CANLI temiz (m18-* kalinti=0)' as ad,
  case when (select count(*) from auth.users where email like 'm18-%@test.local')=0
        and (select count(*) from catalog_items where slug like 'm18-pro-%')=0
        and (select count(*) from recommendation_requests where title='Terzi lazım')=0
       then 'GECTI' else '!!! DUSTU' end as sonuc;
