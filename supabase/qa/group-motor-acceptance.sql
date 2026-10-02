-- G25 · Dijital Gruplar motoru — 13 KABUL TESTİ (tasarım §13)
--
-- Kendini doğrulayan betik: her senaryo `assert` ile kilitlenir; herhangi biri
-- patlarsa ON_ERROR_STOP ile çıkar (exit ≠ 0) ve ROLLBACK canlıyı temiz bırakır.
-- Koşum:  psql "$SUPABASE_DB_URL" -f supabase/qa/group-motor-acceptance.sql
--
-- ⚠️ #6 (şikayet eşiği) G14'e dek TRIPWIRE: group_reports tablosu ortaya
-- çıkarsa bu betik KIZARIR — G14 batch'i #6'yı buraya yazmak ZORUNDA kalır.
-- ⚠️ #5 ve #6 mutasyonla sınanır (KALANLAR G25 notu): kuralı bozan mutasyon
-- bu betiği veya sözleşme testlerini kırmıyorsa test yanlıştır.
\set ON_ERROR_STOP on
\set lid '556374c0-ff23-4782-a737-f590aefa54fe'
\set lid2 '8bf3cc18-112e-4cfc-bed4-70180b1fdf1f'
\set admin1 'bdb66bc1-f109-4122-a9ac-0cdcb62dae33'
\set na1 'f07ffffc-bd31-453c-901b-ceec34ef0bb0'
\set na2 '8c3291a7-8b76-4c58-83f0-349b2bd4313f'
\set berlin 'c6d53609-a8e2-4436-9466-244be3b79bae'

begin;

-- ── Fikstür: bilinen durum + hızlı şerit AÇIK (rollback her şeyi geri alır) ──
select set_config('group_status.via_rpc','on',true);
update public.whatsapp_landings
   set listing_status='published', hidden_reason=null, ownership='unclaimed', owner_user_id=null,
       group_score=null, has_approved_badge=false, group_score_breakdown=null, group_score_computed_at=null,
       review_flags='{}', link_fail_count=0, link_checked_at=null, suspended_until=null,
       published_at='2026-06-01'::timestamptz, short_description=null, rules=null, is_global=false
 where id in (:'lid', :'lid2');
select set_config('group_status.via_rpc','',true);
update public.group_settings set value='true' where key='groups.fast_lane_enabled';
delete from public.group_moderation_log;

\echo '──── KABUL #1: aynı link ikinci kez eklenemez ────'
select set_config('request.jwt.claims', '{"sub":"f07ffffc-bd31-453c-901b-ceec34ef0bb0","role":"authenticated"}', true);
do $$
declare r jsonb; n int;
begin
  select count(*) into n from public.whatsapp_landings;
  select public.submit_group_v1('https://chat.whatsapp.com/JXzMvjJoc57EKDDABSB0jo','Kopya','sehir-yasam','Aciklama','DE','c6d53609-a8e2-4436-9466-244be3b79bae',false,false,true,null) into r;
  assert r->>'result' = 'already_listed', '#1 already_listed bekleniyordu: ' || r::text;
  assert (select count(*) from public.whatsapp_landings) = n, '#1 satır sayısı değişti (INSERT sızdı)';
  raise notice 'KABUL #1 OK';
end $$;

\echo '──── KABUL #2: şerit açıkken admin-olmayan pending_review ────'
do $$
declare r jsonb;
begin
  select public.submit_group_v1('https://chat.whatsapp.com/QA2Kodu0000001','QA Iki','hobi-kultur','Deneme','DE','c6d53609-a8e2-4436-9466-244be3b79bae',false,true,true,null) into r;
  assert r->>'listing_status' = 'pending_review', '#2 pending_review bekleniyordu: ' || r::text;
  assert r->>'ownership' = 'claim_pending', '#2 claim_pending bekleniyordu';
  raise notice 'KABUL #2 OK';
end $$;

\echo '──── KABUL #3: şerit+admin+sahiplik → anında published · "Yeni" 72 saat ────'
select set_config('request.jwt.claims', '{"sub":"bdb66bc1-f109-4122-a9ac-0cdcb62dae33","role":"authenticated"}', true);
do $$
declare r jsonb; v_new boolean; v_id uuid;
begin
  select public.submit_group_v1('https://t.me/QA3Kodu0000002','QA Uc','is-girisim','Deneme','DE','c6d53609-a8e2-4436-9466-244be3b79bae',false,true,true,null) into r;
  assert r->>'listing_status' = 'published', '#3 published bekleniyordu: ' || r::text;
  v_id := (r->>'landing_id')::uuid;
  assert exists (select 1 from public.group_moderation_log where landing_id=v_id and reason='fast_lane'), '#3 fast_lane log satırı yok';
  assert exists (select 1 from public.whatsapp_landings where id=v_id and published_at is not null), '#3 published_at dolmadı';
  -- "Yeni" etiketi: ilk 72 saat var (is_new view'da), eşik 0'a inince KALKAR
  select is_new into v_new from public.whatsapp_landings_public where id=v_id;
  assert v_new, '#3 yeni grup is_new=true olmalıydı';
  update public.group_settings set value='0' where key='groups.new_badge_hours';
  select is_new into v_new from public.whatsapp_landings_public where id=v_id;
  assert not v_new, '#3 eşik 0 iken is_new=false olmalıydı (72 saat sonra kalkıyor)';
  update public.group_settings set value='72' where key='groups.new_badge_hours';
  raise notice 'KABUL #3 OK (72 saat davranışı eşik üzerinden ölçüldü)';
end $$;

\echo '──── KABUL #4: kara liste kelimesi hızlı şeritten geçmez ────'
do $$
declare r jsonb; v_row record;
begin
  select public.submit_group_v1('https://discord.gg/QA4Kodu0000003','Vize ve oturum danismanligi','meslek-kariyer','Deneme','DE','c6d53609-a8e2-4436-9466-244be3b79bae',false,true,true,null) into r;
  assert r->>'listing_status' = 'pending_review', '#4 işaretliyken published OLAMAZ: ' || r::text;
  assert (r->>'review_flagged')::boolean, '#4 review_flagged bekleniyordu';
  select review_flags into v_row from public.whatsapp_landings where id=(r->>'landing_id')::uuid;
  assert 'vize' = any(v_row.review_flags), '#4 vize işareti review_flags''te yok';
  raise notice 'KABUL #4 OK';
end $$;

\echo '──── KABUL #7: bekleyen gönderi 48 saatte eskale olur ────'
select set_config('group_status.via_rpc','on',true);
update public.whatsapp_landings set ownership='verified', owner_user_id=:'na1' where id=:'lid';
select set_config('group_status.via_rpc','',true);
select set_config('request.jwt.claims', '{"sub":"8c3291a7-8b76-4c58-83f0-349b2bd4313f","role":"authenticated"}', true);
do $$
declare v_post uuid; v_status text;
begin
  select (public.group_post_create('556374c0-ff23-4782-a737-f590aefa54fe','QA7 eskalasyon testi')->>'post_id')::uuid into v_post;
  assert (select post_status from public.group_posts where id=v_post) = 'pending_group_admin', '#7 başlangıç pending_group_admin olmalı';
  -- 48 saati dolmuş gibi kur (eşik group_settings'ten — G16)
  update public.group_posts set escalate_at = now() - interval '1 minute' where id = v_post;
  perform public.group_posts_escalate_due();
  select post_status into v_status from public.group_posts where id=v_post;
  assert v_status = 'pending_platform', '#7 eskalasyon sonrası pending_platform bekleniyordu: ' || v_status;
  raise notice 'KABUL #7 OK';
end $$;

\echo '──── KABUL #8: 2 ölü link gizler · 1 canlı geri açar · unknown etkisiz ────'
select set_config('request.jwt.claims', '{"role":"service_role"}', true);
do $$
declare r jsonb;
begin
  select public.group_link_health_record('8bf3cc18-112e-4cfc-bed4-70180b1fdf1f','invalid') into r;
  assert (r->>'link_fail_count')::int = 1 and r->>'listing_status' = 'published', '#8 ilk invalid gizlememeli';
  select public.group_link_health_record('8bf3cc18-112e-4cfc-bed4-70180b1fdf1f','invalid') into r;
  assert r->>'listing_status' = 'hidden', '#8 ikinci invalid gizlemeliydi: ' || r::text;
  select public.group_link_health_record('8bf3cc18-112e-4cfc-bed4-70180b1fdf1f','unknown') into r;
  assert (r->>'link_fail_count')::int = 2, '#8 unknown sayacı DEĞİŞTİREMEZ: ' || r::text;
  select public.group_link_health_record('8bf3cc18-112e-4cfc-bed4-70180b1fdf1f','ok') into r;
  assert r->>'listing_status' = 'published' and (r->>'link_fail_count')::int = 0, '#8 ok geri açmalı: ' || r::text;
  raise notice 'KABUL #8 OK';
end $$;
select set_config('request.jwt.claims', '{}', true);

\echo '──── KABUL #9: kaldırma isteği ANINDA gizler ────'
select set_config('request.jwt.claims', '{"sub":"f07ffffc-bd31-453c-901b-ceec34ef0bb0","role":"authenticated"}', true);
do $$
begin
  perform public.set_group_status_v1('556374c0-ff23-4782-a737-f590aefa54fe','hidden','owner_request','QA9');
  assert (select listing_status from public.whatsapp_landings where id='556374c0-ff23-4782-a737-f590aefa54fe') = 'hidden', '#9 anında hidden olmalı';
  assert (select hidden_reason from public.whatsapp_landings where id='556374c0-ff23-4782-a737-f590aefa54fe') = 'owner_request', '#9 sebep owner_request';
  assert exists (select 1 from public.group_moderation_log where landing_id='556374c0-ff23-4782-a737-f590aefa54fe' and to_status='hidden' and actor_kind='owner'), '#9 log actor owner değil';
  assert not exists (select 1 from public.whatsapp_landings_public where id='556374c0-ff23-4782-a737-f590aefa54fe'), '#9 hidden grup dizinde kaldı';
  raise notice 'KABUL #9 OK';
end $$;

\echo '──── KABUL #10: Aile & Çocuk seviye-2 olmayana kapalı (bugün: herkese) ────'
do $$
begin
  begin
    perform public.submit_group_v1('https://chat.whatsapp.com/QA10Kodu00004','Aile Grubu','aile-cocuk','Deneme','DE','c6d53609-a8e2-4436-9466-244be3b79bae',false,false,true,null);
    raise exception 'QA-BUG: aile-cocuk kabul edildi';
  exception when others then
    assert sqlerrm like '%group_submit_category_locked%', '#10 submit kilidi: ' || sqlerrm;
    assert sqlerrm not like '%QA-BUG%', '#10 kilit delindi';
  end;
  raise notice 'KABUL #10 OK (submit + owner_update kilidi; G06 seviye kontrolüne çevirecek)';
end $$;
-- owner_update tarafı: lid2 na1'e verified yapılır, kilit orada da ölçülür
select set_config('group_status.via_rpc','on',true);
update public.whatsapp_landings set ownership='verified', owner_user_id=:'na1' where id=:'lid2';
select set_config('group_status.via_rpc','',true);
select set_config('request.jwt.claims', '{"sub":"f07ffffc-bd31-453c-901b-ceec34ef0bb0","role":"authenticated"}', true);
do $$
begin
  begin
    perform public.group_owner_update_v1('8bf3cc18-112e-4cfc-bed4-70180b1fdf1f', null, null, 'aile-cocuk', null, null, null, null, null);
    raise exception 'QA-BUG: owner_update aile-cocuk kabul etti';
  exception when others then
    assert sqlerrm like '%group_owner_category_locked%', '#10 owner_update kilidi: ' || sqlerrm;
  end;
  raise notice 'KABUL #10b OK';
end $$;

\echo '──── KABUL #11: ilk 7 gün skor null + kartta görünmez ────'
do $$
declare s jsonb;
begin
  perform set_config('group_status.via_rpc','on',true);
  update public.whatsapp_landings set published_at = now() where id = '8bf3cc18-112e-4cfc-bed4-70180b1fdf1f';
  perform set_config('group_status.via_rpc','',true);
  perform public.group_health_score_recompute('8bf3cc18-112e-4cfc-bed4-70180b1fdf1f');
  assert (select group_score from public.whatsapp_landings where id='8bf3cc18-112e-4cfc-bed4-70180b1fdf1f') is null, '#11 ilk 7 gün skor null olmalı';
  assert (select group_score from public.whatsapp_landings_public where id='8bf3cc18-112e-4cfc-bed4-70180b1fdf1f') is null, '#11 view da null dönmeli (kart skor alanı çizmez)';
  assert not (select has_approved_badge from public.whatsapp_landings where id='8bf3cc18-112e-4cfc-bed4-70180b1fdf1f'), '#11 grace''te rozet olmaz';
  raise notice 'KABUL #11 OK';
end $$;

\echo '──── #11b + #13 hazırlık: 8 gün sonra skor dolar · rozet 70+ ────'
do $$
declare s jsonb;
begin
  perform set_config('group_status.via_rpc','on',true);
  update public.whatsapp_landings
     set published_at = now() - interval '8 days',
         short_description = 'QA profili', rules = 'QA kurallari', is_global = true
   where id = '8bf3cc18-112e-4cfc-bed4-70180b1fdf1f';
  perform set_config('group_status.via_rpc','',true);
  s := public.group_health_score_recompute('8bf3cc18-112e-4cfc-bed4-70180b1fdf1f');
  assert (s->>'score')::int >= 70, '#11b skor 70+ bekleniyordu (15+15+15+15+20): ' || s::text;
  assert (s->>'badge')::boolean, '#11b rozet kazanılmalıydı';
  raise notice 'KABUL #11b OK (skor %, rozet true)', (s->>'score');
end $$;

\echo '──── KABUL #12: her durum değişikliği logda ────'
select set_config('request.jwt.claims', '{"role":"service_role"}', true);
do $$
declare r record;
begin
  perform public.set_group_status_v1((select id from public.whatsapp_landings where invite_code='QA2Kodu0000001'),'rejected','rejected','QA12 red');
  assert (select count(*) from public.group_moderation_log) >= 5, '#12 log satırları eksik';
  for r in select unnest(array['fast_lane','owner_request','link_dead','published','rejected']) as reason loop
    assert exists (select 1 from public.group_moderation_log where reason = r.reason), '#12 log''da eksik sebep: ' || r.reason;
  end loop;
  raise notice 'KABUL #12 OK (fast_lane · owner_request · link_dead · published · rejected hepsi logda)';
end $$;
select set_config('request.jwt.claims', '{}', true);

\echo '──── #13 hazırlık: sahiplik doğrulama + uyarı ────'
do $$
begin
  insert into public.group_claims (landing_id, user_id, method, screenshot_path, status)
  values ('8bf3cc18-112e-4cfc-bed4-70180b1fdf1f','8c3291a7-8b76-4c58-83f0-349b2bd4313f','screenshot','8c3291a7-8b76-4c58-83f0-349b2bd4313f/screenshot-qa.png','pending');
  update public.group_claims set status='verified'
   where screenshot_path='8c3291a7-8b76-4c58-83f0-349b2bd4313f/screenshot-qa.png';
end $$;
select set_config('request.jwt.claims', '{"sub":"bdb66bc1-f109-4122-a9ac-0cdcb62dae33","role":"authenticated"}', true);
do $$
declare r jsonb;
begin
  select public.admin_record_group_strike('8bf3cc18-112e-4cfc-bed4-70180b1fdf1f','QA13 uyari testi') into r;
  assert r->>'outcome' = 'warning', '#13 ilk ihlal warning olmalı: ' || r::text;
  raise notice 'KABUL #13-hazirlik OK (strike warning)';
end $$;
select set_config('request.jwt.claims', '{}', true);

\echo '──── KABUL #13: 8 bildirimin 8'i de outbox'a düştü ────'
do $$
declare v_missing text[] := '{}'; e text;
begin
  foreach e in array array['group_submission_received','group_published','group_rejected',
    'group_ownership_verified','group_post_pending','group_link_dead','group_score_badge',
    'group_strike_warning'] loop
    if not exists (select 1 from public.notification_email_outbox where event_type = e) then
      v_missing := v_missing || e;
    end if;
  end loop;
  assert cardinality(v_missing) = 0, '#13 eksik bildirim tipleri: ' || array_to_string(v_missing, ', ');
  -- Kural 8: hiçbir payload davet linki taşımaz
  assert not exists (
    select 1 from public.notification_email_outbox
    where event_type like 'group_%'
      and (payload::text ilike '%chat.whatsapp.com%' or payload::text ilike '%t.me/%' or payload::text ilike '%discord.gg%')
  ), '#13 KURAL 8 ihlali: payload''da davet linki';
  raise notice 'KABUL #13 OK (8/8 outbox + kural 8 temiz · sent_at kanıtı G23 gerçek drenajında: processed:8 sent:8)';
end $$;

\echo '──── KABUL #6: TRIPWIRE — şikayet eşiği G14''te yazılacak ────'
do $$
begin
  assert to_regclass('public.group_reports') is null,
    '#6 TRIPWIRE: group_reports tablosu VAR ama kabul testi #6 (3 onaylı şikayet/30 gün → hidden · 2 → strike) bu betikte YOK — G14 batch''i buraya senaryoyu EKLEMELİ';
  raise notice 'KABUL #6 G14''e dek bloke (tripwire kurulu) — bugünkü doğru durum';
end $$;

select 'KABUL 12/13 ÖLÇÜLDÜ + #6 TRIPWIRE (G14 bekliyor) — HEPSİ YEŞİL' as sonuc;

rollback;

\echo '──── ROLLBACK SONRASI CANLI (dokunulmamış olmalı) ────'
select count(*) as landing_10, count(group_score) as skor_0, count(*) filter (where has_approved_badge) as rozet_0,
       count(*) filter (where listing_status <> 'published') as published_olmayan_0
  from public.whatsapp_landings;
select count(*) as log_0 from public.group_moderation_log;
select count(*) as post_0 from public.group_posts;
select count(*) as claim_0 from public.group_claims;
select count(*) as strike_0 from public.group_strikes;
select count(*) as group_outbox_0 from public.notification_email_outbox where event_type like 'group_%';
select value as fastlane_false from public.group_settings where key='groups.fast_lane_enabled';
select value as badge_hours_72 from public.group_settings where key='groups.new_badge_hours';

-- ── #5 RLS: işlem DIŞINDA, gerçek rollerle (canlı durum okunur; rollback gerekmez) ──
\echo '──── KABUL #5: üyeliği olmayana link/panel/kuyruk YOK ────'
set role anon;
do $$
declare n int;
begin
  -- Dizin view'ı: davet linki ve PII anon'a NULL
  select count(*) into n from public.whatsapp_landings_public
   where whatsapp_link is not null or admin_contact is not null or user_id is not null or rejection_reason is not null;
  assert n = 0, '#5 view anon''a link/PII sızdırıyor: ' || n || ' satır';

  -- Davet RPC'si: anon'a kapalı (link tek kapı, girişliye)
  begin
    perform public.get_whatsapp_landing_invite((select slug from public.whatsapp_landings limit 1));
    raise exception 'QA-BUG: anon invite RPC çağırabildi';
  exception when others then
    assert sqlerrm not like '%QA-BUG%', '#5 invite RPC anon''a AÇIK: ' || sqlerrm;
  end;

  -- Sahip paneli özeti + claims + ayarlar: anon'a permission denied
  begin
    perform public.group_moderator_summary();
    raise exception 'QA-BUG: anon summary çağırabildi';
  exception when others then
    assert sqlerrm like '%permission denied%', '#5 summary: ' || sqlerrm;
  end;
  begin
    select count(*) into n from public.group_claims;
    raise exception 'QA-BUG: anon group_claims okudu';
  exception when others then
    assert sqlerrm like '%permission denied%', '#5 claims: ' || sqlerrm;
  end;
  begin
    select count(*) into n from public.group_settings;
    raise exception 'QA-BUG: anon group_settings okudu';
  exception when others then
    assert sqlerrm like '%permission denied%', '#5 settings: ' || sqlerrm;
  end;
  begin
    select count(*) into n from public.group_moderation_log;
    raise exception 'QA-BUG: anon moderation_log okudu';
  exception when others then
    assert sqlerrm like '%permission denied%', '#5 log: ' || sqlerrm;
  end;
  raise notice 'KABUL #5 OK (anon: view PII null · invite/summary/claims/settings/log kapalı)';
end $$;
reset role;

\echo '════ G25 KABUL: 13/13 (12 ölçüldü + #6 tripwire) · ROLLBACK TEMİZ · #5 roller gerçek ════'
