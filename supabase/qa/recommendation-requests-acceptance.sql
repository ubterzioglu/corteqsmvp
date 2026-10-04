-- M17 · Faz 2 (Tavsiye İste) Migration 1 — kabul (geri alınan işlem).
-- Ölçülen: RPC-only yazma · BAN kill-switch (is_cadde_banned) her iki yazma yolunu
-- da kapsar · talep oluştur/yanıt akışı · is_professional KATALOGDAN türetilir
-- (istemci gönderemez) · diaspora CHECK · auth · grant'lar.
--
-- 🔴 TEK kod eşleştirme (OR gevşetme YOK) · fixture ERKEN kontrole takılmasın:
--    ban testi BANLI kullanıcıyla koşar (auth_required'a takılmaz — uid set edilir).
-- 🔴 AYIRT: banlı REDDEDİLİRKEN banlı-olmayan aynı RPC'de BAŞARILI (vakum değil).
\set ON_ERROR_STOP on
begin;

create temp table t(k text primary key, v uuid) on commit drop;
insert into auth.users (id, email) values
  (gen_random_uuid(),'m17-author@test.local'),
  (gen_random_uuid(),'m17-answerer@test.local'),
  (gen_random_uuid(),'m17-answerer2@test.local'),
  (gen_random_uuid(),'m17-banned@test.local'),
  (gen_random_uuid(),'m17-admin@test.local');
insert into t select split_part(email,'@',1), id from auth.users where email like 'm17-%@test.local';
update user_role_assignments
   set role_id=(select id from roles where key='Admin_PlatformAdmin')
 where user_id=(select v from t where k='m17-admin');

-- m17-banned'i BANLA (is_cadde_banned: cadde_user_bans, scope='cadde', aktif).
insert into cadde_user_bans (user_id, scope, reason, starts_at, created_by)
values ((select v from t where k='m17-banned'), 'cadde', 'M17 kabul testi bani',
        now() - interval '1 day', (select v from t where k='m17-admin'));

create temp table r(no int, ad text, sonuc text) on commit drop;

do $x$
declare
  u_author   uuid := (select v from t where k='m17-author');
  u_answerer uuid := (select v from t where k='m17-answerer');
  u_answerer2 uuid := (select v from t where k='m17-answerer2');
  u_banned   uuid := (select v from t where k='m17-banned');
  v_req uuid; v_req2 uuid; v_ans uuid; v_ans2 uuid;
  v_status text; v_prof boolean; v_prof2 boolean; v_expected_prof boolean; n int;
begin
  -- K1: banlı-olmayan üye talep oluşturur -> satır, status='open', diaspora korunur.
  perform set_config('request.jwt.claims', json_build_object('sub',u_author)::text, true);
  v_req := public.create_recommendation_request_v1('İyi bir terzi arıyorum','Kadıköy civarında güvenilir terzi önerisi var mı?','tailor','TR','Istanbul','tr');
  select status into v_status from recommendation_requests where id=v_req;
  select count(*) into n from recommendation_requests where id=v_req and diaspora_key='tr' and user_id=u_author;
  insert into r select 1,'K1 uye talep olusturur -> satir + status open + diaspora tr',
    case when v_req is not null and v_status='open' and n=1 then 'GECTI'
         else '!!! DUSTU: status='||coalesce(v_status,'null')||' n='||n end;

  -- K2: BANLI kullanıcı create -> TEK kod recommendation_banned (kill-switch).
  perform set_config('request.jwt.claims', json_build_object('sub',u_banned)::text, true);
  begin
    perform public.create_recommendation_request_v1('Banli talep','Deneme','x','TR','Istanbul','tr');
    insert into r select 2,'K2 BANLI create -> recommendation_banned','!!! DUSTU: gecti';
  exception when others then
    insert into r select 2,'K2 BANLI create -> recommendation_banned',
      case when sqlerrm like '%recommendation_banned%' then 'GECTI' else '!!! DUSTU: '||sqlerrm end;
  end;

  -- K3: BANLI kullanıcı answer -> recommendation_banned (kill-switch 2. yazma yolunu da kapsar).
  begin
    perform public.answer_recommendation_v1(v_req,'Banli yanit');
    insert into r select 3,'K3 BANLI answer -> recommendation_banned (2. yol da kapsanir)','!!! DUSTU: gecti';
  exception when others then
    insert into r select 3,'K3 BANLI answer -> recommendation_banned (2. yol da kapsanir)',
      case when sqlerrm like '%recommendation_banned%' then 'GECTI' else '!!! DUSTU: '||sqlerrm end;
  end;

  -- K5: banlı-olmayan yanıt verir -> answer satırı + is_professional KATALOGDAN
  --     TÜRETİLİR (bağımsız EXISTS ile karşılaştır — istemci gönderemez, RPC'de
  --     parametresi YOK) + talep open->answered.
  perform set_config('request.jwt.claims', json_build_object('sub',u_answerer)::text, true);
  v_ans := public.answer_recommendation_v1(v_req,'Ben şu terzide memnun kaldım.');
  select is_professional into v_prof from recommendation_answers where id=v_ans;
  select status into v_status from recommendation_requests where id=v_req;
  select exists (
    select 1 from catalog_item_managers m join catalog_items ci on ci.id=m.item_id
    join roles rl on rl.key = ci.platform_role_key and rl.is_directory_visible = true
    where m.user_id=u_answerer and m.status='active' and ci.item_type='member'
      and ci.status='published' and ci.visibility='public' and coalesce(ci.is_placeholder,false)=false
  ) into v_expected_prof;
  insert into r select 5,'K5 yanit -> satir + is_professional KATALOGDAN türetildi + open->answered',
    case when v_ans is not null and v_prof = v_expected_prof and v_status='answered'
         then 'GECTI (prof='||v_prof||' = katalog)'
         else '!!! DUSTU: prof='||coalesce(v_prof::text,'null')||' expected='||coalesce(v_expected_prof::text,'null')||' status='||coalesce(v_status,'null') end;

  -- K6: aynı kullanıcı aynı talebe 2. yanıt -> TEK kod recommendation_already_answered
  -- (F11 ön kontrol; unique constraint İKİNCİ savunma — ham 23505 kullanıcıya
  -- genel "tekrar dene" mesajıyla sızıyordu, artık tek Türkçe kod).
  begin
    perform public.answer_recommendation_v1(v_req,'Ikinci yanit denemesi');
    insert into r select 6,'K6 ayni kullanicidan 2. yanit -> recommendation_already_answered (TEK kod)','!!! DUSTU: gecti';
  exception when others then
    insert into r select 6,'K6 ayni kullanicidan 2. yanit -> recommendation_already_answered (TEK kod)',
      case when sqlerrm like '%recommendation_already_answered%' then 'GECTI'
           else '!!! DUSTU: '||sqlerrm end;
  end;

  -- K7: KAPALI talebe yanıt -> recommendation_request_closed (ayrı talep, fixture erken kontrole takılmaz).
  perform set_config('request.jwt.claims', json_build_object('sub',u_author)::text, true);
  v_req2 := public.create_recommendation_request_v1('Kapali talep','Bu kapatildi','x','TR','Izmir','tr');
  update recommendation_requests set status='closed' where id=v_req2;
  perform set_config('request.jwt.claims', json_build_object('sub',u_answerer)::text, true);
  begin
    perform public.answer_recommendation_v1(v_req2,'Kapaliya yanit');
    insert into r select 7,'K7 kapali talebe yanit -> recommendation_request_closed','!!! DUSTU: gecti';
  exception when others then
    insert into r select 7,'K7 kapali talebe yanit -> recommendation_request_closed',
      case when sqlerrm like '%recommendation_request_closed%' then 'GECTI' else '!!! DUSTU: '||sqlerrm end;
  end;

  -- K8: oturumsuz (auth.uid null) -> recommendation_auth_required
  perform set_config('request.jwt.claims', '', true);
  begin
    perform public.create_recommendation_request_v1('Oturumsuz','Deneme','x','TR','Istanbul','tr');
    insert into r select 8,'K8 oturumsuz create -> recommendation_auth_required','!!! DUSTU: gecti';
  exception when others then
    insert into r select 8,'K8 oturumsuz create -> recommendation_auth_required',
      case when sqlerrm like '%recommendation_auth_required%' then 'GECTI' else '!!! DUSTU: '||sqlerrm end;
  end;

  -- K9: geçersiz diaspora -> recommendation_invalid_diaspora
  perform set_config('request.jwt.claims', json_build_object('sub',u_author)::text, true);
  begin
    perform public.create_recommendation_request_v1('Yanlis diaspora','Deneme','x','TR','Istanbul','xx');
    insert into r select 9,'K9 gecersiz diaspora -> recommendation_invalid_diaspora','!!! DUSTU: gecti';
  exception when others then
    insert into r select 9,'K9 gecersiz diaspora -> recommendation_invalid_diaspora',
      case when sqlerrm like '%recommendation_invalid_diaspora%' then 'GECTI' else '!!! DUSTU: '||sqlerrm end;
  end;

  -- K12 (inceleme W3): SAHİP kendi talebini yanıtlayamaz -> recommendation_self_answer.
  -- Fixture AYIRT edici: talep AÇIK (closed'a takılmaz) ve yanıtlayan SAHİBİN kendisi
  -- (not_found/self sırası doğru ölçülür). Self-guard olmasaydı bu yanıt talebi
  -- open->answered çevirip varsayılan listeden düşürürdü.
  perform set_config('request.jwt.claims', json_build_object('sub',u_author)::text, true);
  begin
    perform public.answer_recommendation_v1(v_req,'Kendi talebime kendiyanitim');
    insert into r select 12,'K12 sahip kendi talebini YANITLAYAMAZ -> recommendation_self_answer','!!! DUSTU: gecti';
  exception when others then
    insert into r select 12,'K12 sahip kendi talebini YANITLAYAMAZ -> recommendation_self_answer',
      case when sqlerrm like '%recommendation_self_answer%' then 'GECTI' else '!!! DUSTU: '||sqlerrm end;
  end;
  -- Self-answer reddi durumu DEGISTIRMEDI (talep hala 'answered' — K5'teki gerçek yanıt).
  select status into v_status from recommendation_requests where id=v_req;
  insert into r select 13,'K13 self-answer reddi durum degistirmadi (talep answered kaldi)',
    case when v_status='answered' then 'GECTI' else '!!! DUSTU: '||coalesce(v_status,'null') end;

  -- K14 (inceleme W6 AYIRT fixturesi): dizin-DISI hesap "Profesyonel" rozeti
  -- ALAMAZ. answerer2'nin otomatik kataloğu 'unlisted'e çevrilir -> güçlü
  -- yükleme (visibility='public' + directory-visible rol) FALSE vermeli.
  -- Zayıf türetme (visibility filtresiz) TRUE verirdi — rozet sapması ölçülür.
  update catalog_items set visibility='unlisted'
   where id in (select item_id from catalog_item_managers where user_id=u_answerer2);
  perform set_config('request.jwt.claims', json_build_object('sub',u_answerer2)::text, true);
  v_ans2 := public.answer_recommendation_v1(v_req,'Ikinci cevap — rozet testi');
  select is_professional into v_prof2 from recommendation_answers where id=v_ans2;
  insert into r select 14,'K14 dizin-disi (unlisted) hesap Profesyonel rozeti ALAMAZ',
    case when v_prof2=false then 'GECTI'
         else '!!! DUSTU: prof=true (visibility/dizin filtresi eksik)' end;
end $x$;

-- K4: RPC-only yazma — authenticated'ın doğrudan INSERT/UPDATE/DELETE grant'i YOK.
insert into r select 4,'K4 RPC-only yazma: authenticated INSERT/UPDATE/DELETE grant YOK (2 tablo)',
  case when not has_table_privilege('authenticated','public.recommendation_requests','INSERT')
        and not has_table_privilege('authenticated','public.recommendation_requests','UPDATE')
        and not has_table_privilege('authenticated','public.recommendation_requests','DELETE')
        and not has_table_privilege('authenticated','public.recommendation_answers','INSERT')
        and has_table_privilege('authenticated','public.recommendation_requests','SELECT')
       then 'GECTI' else '!!! DUSTU' end;

-- K10: grant'lar — anon execute YOK, authenticated VAR (2 RPC).
insert into r select 10,'K10 grant: anon execute YOK / authenticated VAR (2 RPC)',
  case when not has_function_privilege('anon','public.create_recommendation_request_v1(text,text,text,text,text,text)','execute')
        and not has_function_privilege('anon','public.answer_recommendation_v1(uuid,text)','execute')
        and has_function_privilege('authenticated','public.create_recommendation_request_v1(text,text,text,text,text,text)','execute')
        and has_function_privilege('authenticated','public.answer_recommendation_v1(uuid,text)','execute')
       then 'GECTI' else '!!! DUSTU' end;

-- K11: diaspora CHECK canlıda 4 değere kilitli (cadde ile aynı küme).
insert into r select 11,'K11 diaspora CHECK (tr/in/cn/ph) — cadde ile aynı küme',
  case when exists (
    select 1 from pg_constraint c join pg_class cl on cl.oid=c.conrelid
    where cl.relname='recommendation_requests' and c.contype='c'
      and pg_get_constraintdef(c.oid) like '%tr%' and pg_get_constraintdef(c.oid) like '%ph%'
      and pg_get_constraintdef(c.oid) like '%cn%' and pg_get_constraintdef(c.oid) like '%in%'
  ) then 'GECTI' else '!!! DUSTU' end;

\echo ''
\echo '================= M17 KABUL (K1-K14) ================='
select * from r order by no;
select case when count(*) filter (where sonuc like 'GECTI%')=count(*)
            then 'TUMU GECTI: '||count(*)::text
            else '!!! '||(count(*) filter (where sonuc not like 'GECTI%'))::text||' DUSTU' end as ozet
from r;
rollback;
\echo '== ROLLBACK =='
select 'CANLI temiz (m17-* kalinti=0)' as ad,
  case when (select count(*) from auth.users where email like 'm17-%@test.local')=0
        and (select count(*) from recommendation_requests)=0
        and (select count(*) from recommendation_answers)=0
        and (select count(*) from cadde_user_bans where reason='M17 kabul testi bani')=0
       then 'GECTI' else '!!! DUSTU' end as sonuc;
