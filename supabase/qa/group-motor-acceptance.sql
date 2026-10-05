-- G25 · Dijital Gruplar motoru — 13 KABUL TESTİ (tasarım §13)
--
-- Kendini doğrulayan betik: her senaryo `assert` ile kilitlenir; herhangi biri
-- patlarsa ON_ERROR_STOP ile çıkar (exit ≠ 0) ve ROLLBACK canlıyı temiz bırakır.
-- Koşum:  psql "$SUPABASE_DB_URL" -f supabase/qa/group-motor-acceptance.sql
--
-- #6 (şikayet eşiği) G14'te GERÇEK senaryoya çevrildi (tripwire kalktı): 3 uygun
-- hesap gizler · 2 gizlemez · 6 günlük ve telefonsuz hesap SAYILMAZ · cooldown ·
-- kendi grubu · RLS · moderatör kararları · claim geri yükleme.
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

\echo '──── KABUL #6: şikayet eşiği (G14) — 3 uygun hesap gizler ────'
-- Fikstür (G04 kuralı): phone-only kayıt guard'ı reddeder → önce e-postalı kullanıcı,
-- sonra phone_confirmed_at (G04 aynası user_verifications'ı açar) + created_at geri.
-- Gruplar: A=8a64ba68 (eşik) · B=166a3afb (sınır + red/onay) · C=d3ed338a (diger).
select set_config('corteqs.skip_group_notify','on',true);
insert into auth.users (id, email) values
  ('a1400000-0000-4000-8000-000000000001','g14-e1@test.local'),
  ('a1400000-0000-4000-8000-000000000002','g14-e2@test.local'),
  ('a1400000-0000-4000-8000-000000000003','g14-e3@test.local'),
  ('a1400000-0000-4000-8000-000000000004','g14-e4@test.local'),
  ('a1400000-0000-4000-8000-000000000005','g14-young@test.local'),
  ('a1400000-0000-4000-8000-000000000006','g14-nophone@test.local');
update auth.users
   set phone = '+4915550140' || right(id::text, 3), phone_confirmed_at = now(),
       created_at = now() - interval '10 days'
 where email in ('g14-e1@test.local','g14-e2@test.local','g14-e3@test.local','g14-e4@test.local');
update auth.users
   set phone = '+4915550140' || right(id::text, 3), phone_confirmed_at = now(),
       created_at = now() - interval '6 days'
 where email = 'g14-young@test.local';
update auth.users set created_at = now() - interval '10 days' where email = 'g14-nophone@test.local';
-- C'nin doğrulanmış sahibi e4 (kendi grubu + "sahip şikayetçiyi göremez" senaryosu)
select set_config('group_status.via_rpc','on',true);
update public.whatsapp_landings
   set listing_status='published', hidden_reason=null, ownership='verified',
       owner_user_id='a1400000-0000-4000-8000-000000000004'
 where id='d3ed338a-0ec7-448f-8734-34417df26387';
update public.whatsapp_landings set listing_status='published', hidden_reason=null
 where id in ('166a3afb-cb4d-468c-81ef-07606d72bd6b','8a64ba68-dd34-406d-b36e-e8131a735d9f');
select set_config('group_status.via_rpc','',true);

do $$
declare
  A constant uuid := '8a64ba68-dd34-406d-b36e-e8131a735d9f';
  B constant uuid := '166a3afb-cb4d-468c-81ef-07606d72bd6b';
  C constant uuid := 'd3ed338a-0ec7-448f-8734-34417df26387';
  e1 constant uuid := 'a1400000-0000-4000-8000-000000000001';
  e2 constant uuid := 'a1400000-0000-4000-8000-000000000002';
  e3 constant uuid := 'a1400000-0000-4000-8000-000000000003';
  e4 constant uuid := 'a1400000-0000-4000-8000-000000000004';
  young constant uuid := 'a1400000-0000-4000-8000-000000000005';
  nophone constant uuid := 'a1400000-0000-4000-8000-000000000006';
  r jsonb;
  n int;
  v_sub uuid;
begin
  -- fikstür doğrulama: uygunluk GERÇEKTEN kuruldu mu (vakum test olmasın)
  assert public.is_phone_verified(e1) and public.is_phone_verified(young), '#6 fikstür: telefon aynası kurulmadı';
  assert not public.is_phone_verified(nophone), '#6 fikstür: nophone doğrulanmış çıktı';
  assert public.group_setting_int('groups.report_threshold', -1) = 3, '#6 eşik canlıda 3 değil';

  -- ── S1 · B sınırı: 2 uygun hesap + 6 günlük + telefonsuz → eşik DOLMAZ ──
  perform set_config('request.jwt.claims', json_build_object('sub', e1, 'role', 'authenticated')::text, true);
  r := public.submit_group_report_v1(B, 'hate_violence_adult', null);
  assert not (r->>'group_hidden')::boolean, '#6 S1 1. şikayet gizledi';
  perform set_config('request.jwt.claims', json_build_object('sub', e2, 'role', 'authenticated')::text, true);
  r := public.submit_group_report_v1(B, 'visa_slot_sale', 'Vize randevusu satiyor');
  assert not (r->>'group_hidden')::boolean, '#6 S1 2. şikayet gizledi (eşik 3)';

  perform set_config('request.jwt.claims', json_build_object('sub', young, 'role', 'authenticated')::text, true);
  begin
    perform public.submit_group_report_v1(B, 'hate_violence_adult', null);
    raise exception 'QA-BUG young kabul edildi';
  exception when others then
    assert sqlerrm = 'group_report_account_too_new', '#6 6 günlük hesap: ' || sqlerrm;
  end;
  perform set_config('request.jwt.claims', json_build_object('sub', nophone, 'role', 'authenticated')::text, true);
  begin
    perform public.submit_group_report_v1(B, 'hate_violence_adult', null);
    raise exception 'QA-BUG telefonsuz kabul edildi';
  exception when others then
    assert sqlerrm = 'group_report_phone_required', '#6 telefonsuz hesap: ' || sqlerrm;
  end;
  select count(*) into n from public.group_reports where landing_id = B;
  assert n = 2, '#6 S1 uygun olmayan şikayet SAKLANDI (2 bekleniyordu): ' || n;
  assert (select listing_status from public.whatsapp_landings where id = B) = 'published',
    '#6 S1 2 uygun + 2 uygunsuz şikayet B''yi gizledi — uygunsuzlar sayıldı';

  -- ── S2 · A eşiği: 3 farklı uygun hesap → hidden(reports), log actor system ──
  perform set_config('request.jwt.claims', json_build_object('sub', e1, 'role', 'authenticated')::text, true);
  perform public.submit_group_report_v1(A, 'crypto_mlm_finance', null);
  perform set_config('request.jwt.claims', json_build_object('sub', e2, 'role', 'authenticated')::text, true);
  perform public.submit_group_report_v1(A, 'crypto_mlm_finance', null);
  assert (select listing_status from public.whatsapp_landings where id = A) = 'published', '#6 S2 2 şikayette gizlendi';
  perform set_config('request.jwt.claims', json_build_object('sub', e3, 'role', 'authenticated')::text, true);
  r := public.submit_group_report_v1(A, 'crypto_mlm_finance', null);
  assert (r->>'group_hidden')::boolean, '#6 S2 3. uygun şikayet gizlemedi: ' || r::text;
  assert (select listing_status from public.whatsapp_landings where id = A) = 'hidden', '#6 S2 A hidden değil';
  assert (select hidden_reason from public.whatsapp_landings where id = A) = 'reports', '#6 S2 sebep reports değil';
  assert exists (select 1 from public.group_moderation_log
                 where landing_id = A and to_status = 'hidden' and reason = 'reports'
                   and actor_kind = 'system' and actor_uid is null), '#6 S2 log satırı (system) yok';
  -- Claim GERİ YÜKLENDİ: aynı işlemde sonraki ifadeler yükseltilmiş yetkiyle koşmaz
  assert auth.role() = 'authenticated', '#6 S2 CLAIM GERİ YÜKLENMEDİ: auth.role()=' || coalesce(auth.role(), 'null');
  assert auth.uid() = e3, '#6 S2 sub geri yüklenmedi';
  assert coalesce(current_setting('request.jwt.claim.role', true), '') = '', '#6 S2 tekil role GUC sızdı';
  assert not exists (select 1 from public.whatsapp_landings_public where id = A), '#6 S2 gizli grup dizinde';

  -- ── S3 · cooldown: aynı kişi aynı gruba 30 gün içinde 2. şikayet ──
  perform set_config('request.jwt.claims', json_build_object('sub', e1, 'role', 'authenticated')::text, true);
  begin
    perform public.submit_group_report_v1(B, 'political_campaign', null);
    raise exception 'QA-BUG cooldown delindi';
  exception when others then
    assert sqlerrm = 'group_report_cooldown', '#6 S3 cooldown: ' || sqlerrm;
  end;
  assert (select count(*) from public.group_reports where landing_id = B and reporter_id = e1) = 1, '#6 S3 ikinci satır yazıldı';

  -- ── S4 · sebep/not ──
  perform set_config('request.jwt.claims', json_build_object('sub', e3, 'role', 'authenticated')::text, true);
  begin
    perform public.submit_group_report_v1(B, 'diger', '   ');
    raise exception 'QA-BUG diger+bos not';
  exception when others then
    assert sqlerrm = 'group_report_note_required', '#6 S4 diger+boş: ' || sqlerrm;
  end;
  begin
    perform public.submit_group_report_v1(B, 'spam', null);
    raise exception 'QA-BUG gecersiz sebep';
  exception when others then
    assert sqlerrm = 'group_report_invalid_reason', '#6 S4 geçersiz sebep: ' || sqlerrm;
  end;
  begin
    perform public.submit_group_report_v1(B, null, null);
    raise exception 'QA-BUG null sebep';
  exception when others then
    assert sqlerrm = 'group_report_invalid_reason', '#6 S4 null sebep: ' || sqlerrm;
  end;
  -- diger + dolu not GEÇER (C)
  perform set_config('request.jwt.claims', json_build_object('sub', e1, 'role', 'authenticated')::text, true);
  perform public.submit_group_report_v1(C, 'diger', 'Surekli reklam spam');

  -- ── S5 · kendi grubu (sahip + ekleyen) · yayında olmayan · yok · girişsiz ──
  perform set_config('request.jwt.claims', json_build_object('sub', e4, 'role', 'authenticated')::text, true);
  begin
    perform public.submit_group_report_v1(C, 'hate_violence_adult', null);
    raise exception 'QA-BUG sahip kendi grubunu şikayet etti';
  exception when others then
    assert sqlerrm = 'group_report_own_group', '#6 S5 sahip: ' || sqlerrm;
  end;
  select submitted_by into v_sub from public.whatsapp_landings where id = C;
  perform set_config('request.jwt.claims', json_build_object('sub', v_sub, 'role', 'authenticated')::text, true);
  begin
    perform public.submit_group_report_v1(C, 'hate_violence_adult', null);
    raise exception 'QA-BUG ekleyen kendi grubunu şikayet etti';
  exception when others then
    assert sqlerrm = 'group_report_own_group', '#6 S5 ekleyen: ' || sqlerrm;
  end;
  perform set_config('request.jwt.claims', json_build_object('sub', e4, 'role', 'authenticated')::text, true);
  begin
    perform public.submit_group_report_v1('556374c0-ff23-4782-a737-f590aefa54fe', 'hate_violence_adult', null);
    raise exception 'QA-BUG gizli gruba şikayet';
  exception when others then
    assert sqlerrm = 'group_report_group_not_published', '#6 S5 yayında olmayan: ' || sqlerrm;
  end;
  begin
    perform public.submit_group_report_v1(gen_random_uuid(), 'hate_violence_adult', null);
    raise exception 'QA-BUG olmayan grup';
  exception when others then
    assert sqlerrm = 'group_report_group_not_found', '#6 S5 olmayan: ' || sqlerrm;
  end;
  perform set_config('request.jwt.claims', '{}', true);
  begin
    perform public.submit_group_report_v1(B, 'hate_violence_adult', null);
    raise exception 'QA-BUG girişsiz';
  exception when others then
    assert sqlerrm = 'group_report_auth_required', '#6 S5 girişsiz: ' || sqlerrm;
  end;

  -- ── S6 · yetki matrisi: anon hiçbir kapıyı çağıramaz, tabloya kimse yazamaz ──
  assert not has_function_privilege('anon', 'public.submit_group_report_v1(uuid,text,text)', 'execute'), '#6 S6 anon submit EXECUTE';
  assert has_function_privilege('authenticated', 'public.submit_group_report_v1(uuid,text,text)', 'execute'), '#6 S6 authenticated submit yok';
  assert not has_function_privilege('anon', 'public.review_group_report_v1(uuid,text,text)', 'execute'), '#6 S6 anon review';
  assert not has_function_privilege('anon', 'public.admin_list_group_reports()', 'execute'), '#6 S6 anon list';
  assert not has_function_privilege('anon', 'public.group_report_state_v1(uuid)', 'execute'), '#6 S6 anon state';
  assert not has_table_privilege('anon', 'public.group_reports', 'select'), '#6 S6 anon tabloyu okuyabiliyor';
  assert not has_table_privilege('authenticated', 'public.group_reports', 'insert'), '#6 S6 authenticated INSERT grant';
  assert not has_table_privilege('authenticated', 'public.group_reports', 'update'), '#6 S6 authenticated UPDATE grant';
  assert not has_table_privilege('authenticated', 'public.group_reports', 'delete'), '#6 S6 authenticated DELETE grant';
  raise notice 'KABUL #6 S1-S6 OK';
end $$;

-- ── S7 · RLS: kendi satırı · sahip şikayetçiyi GÖREMEZ · admin hepsini görür ──
do $$
declare n_own int; n_all int; n int;
begin
  select count(*) into n_own from public.group_reports where reporter_id = 'a1400000-0000-4000-8000-000000000001';
  select count(*) into n_all from public.group_reports;
  assert n_own = 3 and n_all >= 6, '#6 S7 fikstür sayımı beklenmedik: own=' || n_own || ' all=' || n_all;
  perform set_config('request.jwt.claims', '{"sub":"a1400000-0000-4000-8000-000000000001","role":"authenticated"}', true);
  set local role authenticated;
  select count(*) into n from public.group_reports;
  assert n = n_own, '#6 S7 kullanıcı başkasının şikayetini görüyor: ' || n;
  reset role;
  -- e4 = C'nin sahibi: C'ye gelen şikayeti (e1) GÖREMEZ
  perform set_config('request.jwt.claims', '{"sub":"a1400000-0000-4000-8000-000000000004","role":"authenticated"}', true);
  set local role authenticated;
  select count(*) into n from public.group_reports;
  assert n = 0, '#6 S7 SAHİP şikayetçiyi görüyor: ' || n;
  reset role;
  perform set_config('request.jwt.claims', '{"sub":"bdb66bc1-f109-4122-a9ac-0cdcb62dae33","role":"authenticated"}', true);
  set local role authenticated;
  select count(*) into n from public.group_reports;
  assert n = n_all, '#6 S7 admin hepsini görmüyor: ' || n;
  reset role;
  raise notice 'KABUL #6 S7 OK (RLS: own=%, sahip=0, admin=%)', n_own, n_all;
end $$;

-- ── S8 · arayüz durumu + moderatör özeti/listesi ──
do $$
declare s jsonb; l jsonb; a jsonb; n int;
begin
  perform set_config('request.jwt.claims', '{"sub":"a1400000-0000-4000-8000-000000000001","role":"authenticated"}', true);
  s := public.group_report_state_v1('166a3afb-cb4d-468c-81ef-07606d72bd6b');
  assert s->>'cooldown_until' is not null and not (s->>'can_report')::boolean, '#6 S8 cooldown durumu: ' || s::text;
  perform set_config('request.jwt.claims', '{"sub":"a1400000-0000-4000-8000-000000000004","role":"authenticated"}', true);
  s := public.group_report_state_v1('d3ed338a-0ec7-448f-8734-34417df26387');
  assert (s->>'own_group')::boolean and not (s->>'can_report')::boolean, '#6 S8 own_group: ' || s::text;
  perform set_config('request.jwt.claims', '{"sub":"a1400000-0000-4000-8000-000000000006","role":"authenticated"}', true);
  s := public.group_report_state_v1('166a3afb-cb4d-468c-81ef-07606d72bd6b');
  assert (s->>'phone_required')::boolean and not (s->>'can_report')::boolean, '#6 S8 phone_required: ' || s::text;
  perform set_config('request.jwt.claims', '{"sub":"a1400000-0000-4000-8000-000000000005","role":"authenticated"}', true);
  s := public.group_report_state_v1('166a3afb-cb4d-468c-81ef-07606d72bd6b');
  assert (s->>'account_too_new')::boolean, '#6 S8 account_too_new: ' || s::text;
  perform set_config('request.jwt.claims', '{"sub":"a1400000-0000-4000-8000-000000000003","role":"authenticated"}', true);
  s := public.group_report_state_v1('166a3afb-cb4d-468c-81ef-07606d72bd6b');
  assert (s->>'can_report')::boolean, '#6 S8 uygun hesap can_report=false: ' || s::text;

  -- üye moderatör listesini çağıramaz
  begin
    perform public.admin_list_group_reports();
    raise exception 'QA-BUG üye listeyi okudu';
  exception when others then
    assert sqlerrm = 'group_report_review_forbidden', '#6 S8 list kapısı: ' || sqlerrm;
  end;

  perform set_config('request.jwt.claims', '{"sub":"bdb66bc1-f109-4122-a9ac-0cdcb62dae33","role":"authenticated"}', true);
  select count(*) into n from public.group_reports where status = 'open';
  s := public.group_moderator_summary();
  assert (s->>'pending_reports')::int = n and n = 6, '#6 S8 pending_reports gerçek sayıyı vermiyor: ' || s::text || ' / open=' || n;
  -- diğer alanlar birebir: anahtar kümesi + sayaç kaynakları
  assert (select array_agg(k order by k) from jsonb_object_keys(s) k)
         = array['fast_lane_enabled','fast_lane_suggest_threshold','moderated_count','pending_claims',
                 'pending_groups','pending_posts','pending_reports','task_runs'], '#6 S8 özet anahtarları değişti: ' || s::text;
  assert (s->>'pending_groups')::int = (select count(*) from public.whatsapp_landings where listing_status = 'pending_review'), '#6 S8 pending_groups';
  assert (s->>'moderated_count')::int = (select count(*) from public.whatsapp_landings where listing_status = 'published'), '#6 S8 moderated_count';
  assert (s->>'pending_posts')::int = (select count(*) from public.group_posts where post_status = 'pending_platform'), '#6 S8 pending_posts';
  assert jsonb_array_length(s->'task_runs') >= 6, '#6 S8 görev koşuları kayboldu';

  l := public.admin_list_group_reports();
  select e into a from jsonb_array_elements(l) e where e->>'landing_id' = '8a64ba68-dd34-406d-b36e-e8131a735d9f';
  assert (a->>'distinct_reporters')::int = 3 and (a->>'open_count')::int = 3, '#6 S8 liste A: ' || coalesce(a::text, 'null');
  assert (a->'reason_counts'->>'crypto_mlm_finance')::int = 3, '#6 S8 sebep dağılımı';
  assert (a->'reports'->0->>'reporter_id') is not null, '#6 S8 admin şikayetçi kimliğini görmüyor';
  raise notice 'KABUL #6 S8 OK (pending_reports=% · özet anahtarları aynı)', n;
end $$;

-- ── S9 · moderatör kararları ──
do $$
declare
  A constant uuid := '8a64ba68-dd34-406d-b36e-e8131a735d9f';
  B constant uuid := '166a3afb-cb4d-468c-81ef-07606d72bd6b';
  C constant uuid := 'd3ed338a-0ec7-448f-8734-34417df26387';
  r jsonb; v_id uuid; v_ids uuid[];
begin
  -- üye karar veremez
  perform set_config('request.jwt.claims', '{"sub":"a1400000-0000-4000-8000-000000000001","role":"authenticated"}', true);
  begin
    perform public.review_group_report_v1((select id from public.group_reports where landing_id = A limit 1), 'rejected', null);
    raise exception 'QA-BUG üye karar verdi';
  exception when others then
    assert sqlerrm = 'group_report_review_forbidden', '#6 S9 kapı: ' || sqlerrm;
  end;

  perform set_config('request.jwt.claims', '{"sub":"bdb66bc1-f109-4122-a9ac-0cdcb62dae33","role":"authenticated"}', true);
  -- red: A'nın 3 açık şikayeti — ilk ikisi reddedilince grup HÂLÂ gizli, sonuncusunda yayına döner
  select array_agg(id order by created_at) into v_ids from public.group_reports where landing_id = A and status = 'open';
  assert cardinality(v_ids) = 3, '#6 S9 A açık şikayet sayısı';
  r := public.review_group_report_v1(v_ids[1], 'rejected', 'Asilsiz');
  assert not (r->>'group_republished')::boolean and r->>'listing_status' = 'hidden', '#6 S9 başka açık şikayet varken döndü: ' || r::text;
  r := public.review_group_report_v1(v_ids[2], 'rejected', null);
  assert r->>'listing_status' = 'hidden', '#6 S9 2. red sonrası döndü';
  r := public.review_group_report_v1(v_ids[3], 'rejected', null);
  assert (r->>'group_republished')::boolean and r->>'listing_status' = 'published', '#6 S9 son red yayına döndürmedi: ' || r::text;
  assert exists (select 1 from public.group_moderation_log where landing_id = A and from_status = 'hidden'
                 and to_status = 'published' and actor_kind = 'moderator'), '#6 S9 geri açılış logu yok';
  -- çifte karar
  begin
    perform public.review_group_report_v1(v_ids[3], 'upheld', null);
    raise exception 'QA-BUG çifte karar';
  exception when others then
    assert sqlerrm = 'group_report_already_reviewed', '#6 S9 çifte karar: ' || sqlerrm;
  end;
  begin
    perform public.review_group_report_v1(v_ids[3], 'belki', null);
    raise exception 'QA-BUG geçersiz karar';
  exception when others then
    assert sqlerrm = 'group_report_invalid_decision', '#6 S9 geçersiz karar: ' || sqlerrm;
  end;
  begin
    perform public.review_group_report_v1(gen_random_uuid(), 'rejected', null);
    raise exception 'QA-BUG olmayan şikayet';
  exception when others then
    assert sqlerrm = 'group_report_not_found', '#6 S9 olmayan: ' || sqlerrm;
  end;

  -- onay: B'nin visa_slot_sale şikayeti (kırmızı çizgi 2 — terminal) → strike + removed + log;
  -- grubun DİĞER açık şikayeti aynı kararla kapanır (tek karar = tek ihlal)
  select id into v_id from public.group_reports where landing_id = B and reason = 'visa_slot_sale';
  r := public.review_group_report_v1(v_id, 'upheld', 'Randevu slotu satisi kanitlandi');
  assert (r->>'closed_reports')::int = 2, '#6 S9 kardeş açık şikayet kapanmadı: ' || r::text;
  assert r->'strike'->>'outcome' = 'removed' and (r->'strike'->>'terminal_redline')::boolean, '#6 S9 terminal strike: ' || r::text;
  assert exists (select 1 from public.group_strikes where landing_id = B and redline_number = 2), '#6 S9 strike satırı (redline 2) yok';
  assert exists (select 1 from public.group_moderation_log where landing_id = B and to_status = 'removed' and reason = 'redline_2'), '#6 S9 strike log satırı yok';
  assert (select count(*) from public.group_strikes where landing_id = B) = 1, '#6 S9 tek karar birden çok ihlal üretti';
  assert not exists (select 1 from public.group_reports where landing_id = B and status = 'open'), '#6 S9 B''de açık şikayet kaldı';
  -- onay: C'nin diger şikayeti → kırmızı çizgi NULL, uyarı (grup yayında kalır)
  select id into v_id from public.group_reports where landing_id = C and reason = 'diger';
  r := public.review_group_report_v1(v_id, 'upheld', null);
  assert r->'strike'->>'outcome' = 'warning', '#6 S9 diger uyarı: ' || r::text;
  assert exists (select 1 from public.group_strikes where landing_id = C and redline_number is null and reason = 'Onaylanan şikayet'), '#6 S9 diger → redline NULL';
  assert (select listing_status from public.whatsapp_landings where id = C) = 'published', '#6 S9 uyarı grubu düşürdü';

  -- özet son durumu yansıtır
  assert (public.group_moderator_summary()->>'pending_reports')::int
         = (select count(*) from public.group_reports where status = 'open'), '#6 S9 özet bayat';
  raise notice 'KABUL #6 S9 OK (red→geri açılış · onay→strike+log · çifte karar reddi)';
end $$;
select set_config('request.jwt.claims', '{}', true);

select 'KABUL 13/13 ÖLÇÜLDÜ (#6 G14 gerçek senaryo) — HEPSİ YEŞİL' as sonuc;

rollback;

\echo '──── ROLLBACK SONRASI CANLI (dokunulmamış olmalı) ────'
select count(*) as landing_10, count(group_score) as skor_0, count(*) filter (where has_approved_badge) as rozet_0,
       count(*) filter (where listing_status <> 'published') as published_olmayan_0
  from public.whatsapp_landings;
select count(*) as log_0 from public.group_moderation_log;
select count(*) as post_0 from public.group_posts;
select count(*) as claim_0 from public.group_claims;
select count(*) as strike_0 from public.group_strikes;
select count(*) as report_0 from public.group_reports;
select count(*) as g14_fixture_user_0 from auth.users where email like 'g14-%@test.local';
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
  -- G14: şikayet tablosu ve gönderme kapısı anon'a kapalı
  begin
    select count(*) into n from public.group_reports;
    raise exception 'QA-BUG: anon group_reports okudu';
  exception when others then
    assert sqlerrm like '%permission denied%', '#5 group_reports: ' || sqlerrm;
  end;
  begin
    perform public.submit_group_report_v1((select id from public.whatsapp_landings_public limit 1), 'hate_violence_adult', null);
    raise exception 'QA-BUG: anon şikayet gönderebildi';
  exception when others then
    assert sqlerrm like '%permission denied%', '#5 submit_group_report_v1: ' || sqlerrm;
  end;
  raise notice 'KABUL #5 OK (anon: view PII null · invite/summary/claims/settings/log/reports kapalı)';
end $$;
reset role;

\echo '════ G25+G14 KABUL: 13/13 ölçüldü (#6 gerçek senaryo) · ROLLBACK TEMİZ · #5 roller gerçek ════'
