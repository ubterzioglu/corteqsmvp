-- M22 · Tavsiye eşleşme bildirimi + pro.inbox ilgi kaydı — kabul (geri alınan işlem).
-- Ölçülen: outbox CHECK genişledi · settings anahtarı seed · feature_interest
-- 'pro.inbox' beyaz listede (idempotent) · talep oluşunca EŞLEŞEN profesyonele
-- outbox satırı (payload.email) · talep SAHİBİNE/BANLIya/eşleşmeyene satır YOK ·
-- M17 davranışı korunur.
--
-- 🔴 "Kuyruğa yazıldı" tek başına kanıt DEĞİL (M23 sent+sent_at ölçer); burada
--    satırın VARLIĞI + DOĞRU ALICI + YANLIŞ ALICILARIN YOKLUĞU ölçülür.
-- 🔴Fixture'lar ERKEN kontrole takılmaz: banlı pro talebi AÇMAZ (create'i
--   requester koşar); ban bildirimi ALICI tarafında ölçülür.
\set ON_ERROR_STOP on
begin;

create temp table t(k text primary key, v uuid) on commit drop;
insert into auth.users (id, email) values
  (gen_random_uuid(),'m22-req@test.local'),
  (gen_random_uuid(),'m22-pro@test.local'),
  (gen_random_uuid(),'m22-banned@test.local'),
  (gen_random_uuid(),'m22-paris@test.local'),
  (gen_random_uuid(),'m22-admin@test.local');
insert into t select split_part(email,'@',1), id from auth.users where email like 'm22-%@test.local';
update user_role_assignments
   set role_id=(select id from roles where key='Admin_PlatformAdmin')
 where user_id=(select v from t where k='m22-admin');
insert into cadde_user_bans (user_id, scope, reason, starts_at, created_by)
values ((select v from t where k='m22-banned'), 'cadde', 'M22 kabul bani',
        now() - interval '1 day', (select v from t where k='m22-admin'));

-- 4 katalog: pro (Dortmund/DE — eşleşir) · banned (Dortmund/DE — eşleşir AMA
-- banlı) · paris (Paris/FR — eşleşmez, skor 0) · REQ'İN KENDİSİ (Dortmund/DE —
-- 🔴 K7'nin AYIRT etmesi için: `<> v_uid` dışlaması silinirse requester'ın
-- kataloğu eşleşir ve satır YAZILIR; skor-0'a güvenen vakum geçiş kapanır).
insert into catalog_items (id, slug, title, item_type, platform_role_key, status, visibility, is_placeholder, city, country_code)
values
  (gen_random_uuid(),'m22-pro','M22 Terzi Pro','member','User_DiasporaMember','published','public',false,'Dortmund','DE'),
  (gen_random_uuid(),'m22-banned','M22 Banli Pro','member','User_DiasporaMember','published','public',false,'Dortmund','DE'),
  (gen_random_uuid(),'m22-paris','M22 Paris Pro','member','User_DiasporaMember','published','public',false,'Paris','FR'),
  (gen_random_uuid(),'m22-req','M22 Requester Kendi','member','User_DiasporaMember','published','public',false,'Dortmund','DE');
insert into catalog_item_managers (item_id, user_id, role, status)
select ci.id, t.v, 'owner', 'active'
from catalog_items ci join t on (ci.slug='m22-pro' and t.k='m22-pro')
   or (ci.slug='m22-banned' and t.k='m22-banned')
   or (ci.slug='m22-paris' and t.k='m22-paris')
   or (ci.slug='m22-req' and t.k='m22-req');

create temp table r(no int, ad text, sonuc text) on commit drop;

do $x$
declare
  u_req uuid := (select v from t where k='m22-req');
  u_pro uuid := (select v from t where k='m22-pro');
  u_ban uuid := (select v from t where k='m22-banned');
  v_req uuid; v_res jsonb; n int; v_email text; v_condef text; v_setting jsonb;
begin
  -- K1: outbox CHECK'i recommendation_match'i KABUL ediyor (canlı constraint).
  select pg_get_constraintdef(oid) into v_condef
  from pg_constraint
  where conrelid='public.notification_email_outbox'::regclass and contype='c'
    and pg_get_constraintdef(oid) like '%event_type%';
  insert into r select 1,'K1 outbox CHECK recommendation_match icerir (18 event)',
    case when v_condef like '%recommendation_match%' then 'GECTI' else '!!! DUSTU' end;

  -- K2: global ayar anahtarı seed edildi (edge isEventEnabled bunu okur).
  select value into v_setting from notification_settings where key='email.recommendation_match.enabled';
  insert into r select 2,'K2 settings seed: email.recommendation_match.enabled=true',
    case when v_setting::text='true' then 'GECTI' else '!!! DUSTU: '||coalesce(v_setting::text,'YOK') end;

  -- K3: pro.inbox beyaz listede — ilgi kaydı registered:true/already:false + satır.
  -- 🔴 ÇÖKME DAYANIMI: çıplak RPC çağrısı exception sarmalında — mutasyon
  -- (ör. beyaz listeden silme) raise ederse BETİK PATLAMAZ, K3 DUSTU yazılır ve
  -- ÖZET satırı her zaman basılır ("betik patladı" ≠ "iddia düştü" ayrımı).
  perform set_config('request.jwt.claims', json_build_object('sub',u_pro)::text, true);
  begin
    v_res := public.register_feature_interest('pro.inbox');
    select count(*) into n from feature_interest where feature_key='pro.inbox' and user_id=u_pro;
    insert into r select 3,'K3 register_feature_interest(pro.inbox) -> registered + TEK satir',
      case when (v_res->>'registered')='true' and (v_res->>'already')='false' and n=1
           then 'GECTI' else '!!! DUSTU: '||v_res::text||' n='||n end;
  exception when others then
    insert into r select 3,'K3 register_feature_interest(pro.inbox) -> registered + TEK satir',
      '!!! DUSTU: '||sqlerrm;
  end;

  -- K4: aynı kişi ikinci kez SAYILMAZ (already:true, hala 1 satır — kanıt birikir).
  begin
    v_res := public.register_feature_interest('pro.inbox');
    select count(*) into n from feature_interest where feature_key='pro.inbox' and user_id=u_pro;
    insert into r select 4,'K4 ikinci kayit already:true + hala TEK satir',
      case when (v_res->>'already')='true' and n=1 then 'GECTI'
           else '!!! DUSTU: '||v_res::text||' n='||n end;
  exception when others then
    insert into r select 4,'K4 ikinci kayit already:true + hala TEK satir',
      '!!! DUSTU: '||sqlerrm;
  end;

  -- K5: uydurma anahtar reddedilir (beyaz liste sıkı).
  begin
    perform public.register_feature_interest('uydurma.anahtar');
    insert into r select 5,'K5 uydurma anahtar -> feature_interest_unknown_key','!!! DUSTU: gecti';
  exception when others then
    insert into r select 5,'K5 uydurma anahtar -> feature_interest_unknown_key',
      case when sqlerrm like '%feature_interest_unknown_key%' then 'GECTI' else '!!! DUSTU: '||sqlerrm end;
  end;

  -- K6: talep oluştur (Dortmund/DE/terzi) → EŞLEŞEN pro'ya outbox satırı.
  -- 🔴 create çıplak çağrılmaz: CHECK/kuyruk mutasyonunda raise gelirse K6 DUSTU
  -- yazılır, K7–K11 "olculemedi" ile işaretlenir, ÖZET yine basılır.
  perform set_config('request.jwt.claims', json_build_object('sub',u_req)::text, true);
  begin
    v_req := public.create_recommendation_request_v1(
      'M22 Dortmund terzi','Guvenilir terzi onerisi','terzi','DE','Dortmund','tr');
  exception when others then
    v_req := null;
    insert into r select 6,'K6 eslesen proya outbox satiri (event+dedupe+payload.email)',
      '!!! DUSTU: create raise: '||sqlerrm;
  end;

  if v_req is not null then
    select count(*), min(payload->>'email') into n, v_email
    from notification_email_outbox
    where event_type='recommendation_match' and dedupe_key like 'recommendation_match:'||v_req||':'||u_pro;
    insert into r select 6,'K6 eslesen proya outbox satiri (event+dedupe+payload.email)',
      case when n=1 and v_email='m22-pro@test.local' then 'GECTI'
           else '!!! DUSTU: n='||n||' email='||coalesce(v_email,'null') end;

    -- K7: talep SAHİBİNE satır YOK (kendi talebinin bildirimi kendine gitmez).
    -- Fixture AYIRT edici: requester'ın KENDİ kataloğu da Dortmund/DE (skor 45) —
    -- `<> v_uid` dışlaması silinirse satır YAZILIR (vakum geçiş kapalı).
    select count(*) into n from notification_email_outbox
    where event_type='recommendation_match' and dedupe_key like 'recommendation_match:'||v_req||':'||u_req;
    insert into r select 7,'K7 talep sahibine outbox satiri YOK',
      case when n=0 then 'GECTI' else '!!! DUSTU: '||n||' satir' end;

    -- K8: BANLI profesyonele satır YOK (kill-switch bildirimi de kapsar).
    select count(*) into n from notification_email_outbox o
    where o.event_type='recommendation_match'
      and o.dedupe_key like 'recommendation_match:'||v_req||':%'
      and o.payload->>'email'='m22-banned@test.local';
    insert into r select 8,'K8 BANLI pro bildirim ALMAZ (kill-switch kapsaminda)',
      case when n=0 then 'GECTI' else '!!! DUSTU: '||n||' satir' end;

    -- K9: eşleşmeyen (Paris/FR, skor 0) pro bildirim ALMAZ — spam yok.
    select count(*) into n from notification_email_outbox o
    where o.event_type='recommendation_match'
      and o.dedupe_key like 'recommendation_match:'||v_req||':%'
      and o.payload->>'email'='m22-paris@test.local';
    insert into r select 9,'K9 eslesmeyen (skor 0) pro bildirim ALMAZ',
      case when n=0 then 'GECTI' else '!!! DUSTU: '||n||' satir' end;

    -- K10: payload talep sahibinin İLETİŞİMİNİ taşımaz (anahtar kümesi kilitli).
    select count(*) into n from notification_email_outbox o
    where o.event_type='recommendation_match' and o.dedupe_key like 'recommendation_match:'||v_req||':%'
      and (o.payload ? 'requester_email' or o.payload ? 'requester_phone'
           or o.payload->>'request_title' is null);
    insert into r select 10,'K10 payload iletisim TASIMAZ (requester_* anahtari YOK, title VAR)',
      case when n=0 then 'GECTI' else '!!! DUSTU' end;
  else
    insert into r select 7,'K7 talep sahibine outbox satiri YOK','!!! DUSTU: create patladi, olculemedi';
    insert into r select 8,'K8 BANLI pro bildirim ALMAZ (kill-switch kapsaminda)','!!! DUSTU: create patladi, olculemedi';
    insert into r select 9,'K9 eslesmeyen (skor 0) pro bildirim ALMAZ','!!! DUSTU: create patladi, olculemedi';
    insert into r select 10,'K10 payload iletisim TASIMAZ (requester_* anahtari YOK, title VAR)','!!! DUSTU: create patladi, olculemedi';
  end if;

  -- K11: eşleşmeyen talepte hiç satır yazılmaz (skor>0 filtresinin GÜÇLÜ kilidi:
  -- >=0 gevşetmesinde 5 satır düşer — SM3'te ölçüldü). create sarmallı.
  declare v_req2 uuid;
  begin
    begin
      v_req2 := public.create_recommendation_request_v1(
        'M22 essiz sehir','Zzz testi','zzzkategori','ZZ','ZzzTestSehri','tr');
    exception when others then
      insert into r select 11,'K11 eslesmeyen talep -> 0 outbox satiri','!!! DUSTU: create raise: '||sqlerrm;
      v_req2 := null;
    end;
    if v_req2 is not null then
      select count(*) into n from notification_email_outbox
      where event_type='recommendation_match' and dedupe_key like 'recommendation_match:'||v_req2||':%';
      insert into r select 11,'K11 eslesmeyen talep -> 0 outbox satiri',
        case when n=0 then 'GECTI' else '!!! DUSTU: '||n end;
    end if;
  end;

  -- K12: M17 davranışı KORUNDU — banlı create reddi (RPC yeniden tanımlandı).
  perform set_config('request.jwt.claims', json_build_object('sub',(select v from t where k='m22-banned'))::text, true);
  begin
    perform public.create_recommendation_request_v1('Banli','Deneme','x','DE','Dortmund','tr');
    insert into r select 12,'K12 M17 regresyon: banli create -> recommendation_banned','!!! DUSTU: gecti';
  exception when others then
    insert into r select 12,'K12 M17 regresyon: banli create -> recommendation_banned',
      case when sqlerrm like '%recommendation_banned%' then 'GECTI' else '!!! DUSTU: '||sqlerrm end;
  end;
end $x$;

-- K13: grant — anon register_feature_interest ÇALIŞTIRAMAZ (kayıt açamaz).
insert into r select 13,'K13 grant: anon execute YOK / authenticated VAR (register_feature_interest)',
  case when not has_function_privilege('anon','public.register_feature_interest(text)','execute')
        and has_function_privilege('authenticated','public.register_feature_interest(text)','execute')
       then 'GECTI' else '!!! DUSTU' end;

\echo ''
\echo '================= M22 KABUL (K1-K13) ================='
select * from r order by no;
select case when count(*) filter (where sonuc like 'GECTI%')=count(*)
            then 'TUMU GECTI: '||count(*)::text
            else '!!! '||(count(*) filter (where sonuc not like 'GECTI%'))::text||' DUSTU' end as ozet
from r;
rollback;
\echo '== ROLLBACK =='
select 'CANLI temiz (m22-* kalinti=0)' as ad,
  case when (select count(*) from auth.users where email like 'm22-%@test.local')=0
        and (select count(*) from catalog_items where slug like 'm22-%')=0
        and (select count(*) from recommendation_requests where title like 'M22 %')=0
        and (select count(*) from notification_email_outbox where payload->>'email' like 'm22-%@test.local')=0
        and (select count(*) from feature_interest where feature_key='pro.inbox')=0
       then 'GECTI' else '!!! DUSTU' end as sonuc;
