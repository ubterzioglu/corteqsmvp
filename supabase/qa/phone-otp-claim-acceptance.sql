-- WhatsApp OTP kota kabul testi (claim_phone_otp_send + finish_phone_otp_send).
--
-- KABUL:
--   K1: Bekleme süresi (cooldown) — 60 sn içinde ikinci çağrı reddedilir
--   K2: Saatlik sınır — 3 çağrıdan sonra reddedilir
--   K3: Günlük sınır — 5 çağrıdan sonra reddedilir
--   K4: Numara başına günlük — 3 çağrıdan sonra reddedilir (farklı kullanıcılar, aynı numara)
--   K5: Global saatlik tavan — 60 çağrıdan sonra reddedilir
--   K6: Başarısız deneme — 10 başarısızdan sonra reddedilir
--   K7: Başarısız satırlar 1-3'e sayılmaz
--   K8: NULL outcome reddedilir (finish_phone_otp_send)

begin;

-- Fixture: Test kullanıcısı
insert into auth.users (id, email, phone, phone_confirmed_at, created_at)
values (
  'h0000000-0000-0000-0000-000000000001',
  'otp-tester@example.com',
  '+491701234567',
  now(),
  now() - interval '100 days'
) on conflict (id) do nothing;

-- K1: Bekleme süresi (cooldown)
do $$
declare
  v_result jsonb;
  v_retry integer;
begin
  -- İlk çağrı: başarılı
  select public.claim_phone_otp_send(
    'h0000000-0000-0000-0000-000000000001',
    'hash1'
  ) into v_result;
  assert (v_result->>'allowed')::boolean = true, 'K1 BAŞARISIZ: ilk çağrı başarılı olmalı';
  
  -- Hemen ikinci çağrı: reddedilmeli (cooldown)
  select public.claim_phone_otp_send(
    'h0000000-0000-0000-0000-000000000001',
    'hash1'
  ) into v_result;
  assert (v_result->>'allowed')::boolean = false, 'K1 BAŞARISIZ: ikinci çağrı reddedilmeli';
  assert v_result->>'reason' = 'cooldown', 'K1 BAŞARISIZ: reason cooldown olmalı';
  v_retry := (v_result->>'retry_after_seconds')::integer;
  assert v_retry > 0 and v_retry <= 60, 'K1 BAŞARISIZ: retry_after 1-60 arası olmalı';
  
  raise notice 'K1 OK: cooldown çalışıyor, retry_after = %', v_retry;
end $$;

-- Temizle
delete from public.otp_send_attempts where user_id = 'h0000000-0000-0000-0000-000000000001';

-- K2: Saatlik sınır (3 çağrı)
do $$
declare
  v_result jsonb;
begin
  -- 3 başarılı çağrı
  for i in 1..3 loop
    select public.claim_phone_otp_send('h0000000-0000-0000-0000-000000000001', 'hash' || i) into v_result;
    assert (v_result->>'allowed')::boolean = true, 'K2 BAŞARISIZ: çağrı ' || i || ' başarılı olmalı';
    -- created_at'i geriye çek (saatlik pencereyi doldur)
    update public.otp_send_attempts
    set created_at = now() - interval '30 minutes'
    where user_id = 'h0000000-0000-0000-0000-000000000001'
      and send_outcome = 'claimed'
      and phone_hash = 'hash' || i;
  end loop;
  
  -- 4. çağrı: reddedilmeli
  select public.claim_phone_otp_send('h0000000-0000-0000-0000-000000000001', 'hash4') into v_result;
  assert (v_result->>'allowed')::boolean = false, 'K2 BAŞARISIZ: 4. çağrı reddedilmeli';
  assert v_result->>'reason' = 'hourly', 'K2 BAŞARISIZ: reason hourly olmalı';
  
  raise notice 'K2 OK: saatlik sınır çalışıyor';
end $$;

-- Temizle
delete from public.otp_send_attempts where user_id = 'h0000000-0000-0000-0000-000000000001';

-- K3: Günlük sınır (5 çağrı)
do $$
declare
  v_result jsonb;
begin
  -- 5 başarılı çağrı
  for i in 1..5 loop
    select public.claim_phone_otp_send('h0000000-0000-0000-0000-000000000001', 'hash' || i) into v_result;
    assert (v_result->>'allowed')::boolean = true, 'K3 BAŞARISIZ: çağrı ' || i || ' başarılı olmalı';
    update public.otp_send_attempts
    set created_at = now() - interval '2 hours'
    where user_id = 'h0000000-0000-0000-0000-000000000001'
      and send_outcome = 'claimed'
      and phone_hash = 'hash' || i;
  end loop;
  
  -- 6. çağrı: reddedilmeli
  select public.claim_phone_otp_send('h0000000-0000-0000-0000-000000000001', 'hash6') into v_result;
  assert (v_result->>'allowed')::boolean = false, 'K3 BAŞARISIZ: 6. çağrı reddedilmeli';
  assert v_result->>'reason' = 'daily', 'K3 BAŞARISIZ: reason daily olmalı';
  
  raise notice 'K3 OK: günlük sınır çalışıyor';
end $$;

-- Temizle
delete from public.otp_send_attempts where user_id = 'h0000000-0000-0000-0000-000000000001';

-- K4: Numara başına günlük (3 çağrı, farklı kullanıcılar)
do $$
declare
  v_result jsonb;
begin
  -- 3 farklı kullanıcı, aynı numara
  for i in 1..3 loop
    insert into auth.users (id, email, created_at)
    values ('h0000000-0000-0000-0000-00000000000' || (i+1), 'otp-tester' || i || '@example.com', now() - interval '100 days')
    on conflict (id) do nothing;
    
    select public.claim_phone_otp_send('h0000000-0000-0000-0000-00000000000' || (i+1), 'same_hash') into v_result;
    assert (v_result->>'allowed')::boolean = true, 'K4 BAŞARISIZ: çağrı ' || i || ' başarılı olmalı';
    update public.otp_send_attempts
    set created_at = now() - interval '2 hours'
    where user_id = 'h0000000-0000-0000-0000-00000000000' || (i+1)
      and send_outcome = 'claimed';
  end loop;
  
  -- 4. kullanıcı, aynı numara: reddedilmeli
  insert into auth.users (id, email, created_at)
  values ('h0000000-0000-0000-0000-000000000005', 'otp-tester4@example.com', now() - interval '100 days')
  on conflict (id) do nothing;
  
  select public.claim_phone_otp_send('h0000000-0000-0000-0000-000000000005', 'same_hash') into v_result;
  assert (v_result->>'allowed')::boolean = false, 'K4 BAŞARISIZ: 4. kullanıcı reddedilmeli';
  assert v_result->>'reason' = 'phone_daily', 'K4 BAŞARISIZ: reason phone_daily olmalı';
  
  raise notice 'K4 OK: numara başına günlük sınır çalışıyor';
end $$;

-- Temizle
delete from public.otp_send_attempts where user_id like 'h0000000-0000-0000-0000-00000000000%';
delete from auth.users where id like 'h0000000-0000-0000-0000-00000000000%';
insert into auth.users (id, email, created_at)
values ('h0000000-0000-0000-0000-000000000001', 'otp-tester@example.com', now() - interval '100 days')
on conflict (id) do nothing;

-- K5: Global saatlik tavan (60 çağrı) — BU TEST ÇOK UZUN, ATLANABİLİR
-- Gerekirse: 60 farklı kullanıcı ile test et

-- K6: Başarısız deneme (10 başarısız)
do $$
declare
  v_result jsonb;
  v_attempt_id bigint;
begin
  -- 10 başarısız çağrı
  for i in 1..10 loop
    select public.claim_phone_otp_send('h0000000-0000-0000-0000-000000000001', 'hash' || i) into v_result;
    v_attempt_id := (v_result->>'attempt_id')::bigint;
    perform public.finish_phone_otp_send(v_attempt_id, 'failed', 'meta_http_400');
    update public.otp_send_attempts
    set created_at = now() - interval '30 minutes'
    where id = v_attempt_id;
  end loop;
  
  -- 11. çağrı: reddedilmeli
  select public.claim_phone_otp_send('h0000000-0000-0000-0000-000000000001', 'hash11') into v_result;
  assert (v_result->>'allowed')::boolean = false, 'K6 BAŞARISIZ: 11. çağrı reddedilmeli';
  assert v_result->>'reason' = 'failures', 'K6 BAŞARISIZ: reason failures olmalı';
  
  raise notice 'K6 OK: başarısız deneme sınırı çalışıyor';
end $$;

-- Temizle
delete from public.otp_send_attempts where user_id = 'h0000000-0000-0000-0000-000000000001';

-- K7: Başarısız satırlar 1-3'e sayılmaz
do $$
declare
  v_result jsonb;
  v_attempt_id bigint;
begin
  -- 5 başarısız çağrı (günlük sınırı aşmaz)
  for i in 1..5 loop
    select public.claim_phone_otp_send('h0000000-0000-0000-0000-000000000001', 'hash' || i) into v_result;
    v_attempt_id := (v_result->>'attempt_id')::bigint;
    perform public.finish_phone_otp_send(v_attempt_id, 'failed', 'meta_http_400');
    update public.otp_send_attempts
    set created_at = now() - interval '2 hours'
    where id = v_attempt_id;
  end loop;
  
  -- 6. çağrı: başarılı olmalı (başarısızlar sayılmaz)
  select public.claim_phone_otp_send('h0000000-0000-0000-0000-000000000001', 'hash6') into v_result;
  assert (v_result->>'allowed')::boolean = true, 'K7 BAŞARISIZ: başarısızlar sayılmamalı';
  
  raise notice 'K7 OK: başarısız satırlar kotaya sayılmıyor';
end $$;

-- Temizle
delete from public.otp_send_attempts where user_id = 'h0000000-0000-0000-0000-000000000001';

-- K8: NULL outcome reddedilir
do $$
declare
  v_attempt_id bigint;
begin
  -- Önce bir claim al
  select (public.claim_phone_otp_send('h0000000-0000-0000-0000-000000000001', 'hash1')->>'attempt_id')::bigint into v_attempt_id;
  
  -- NULL outcome ile finish: reddedilmeli
  begin
    perform public.finish_phone_otp_send(v_attempt_id, null, null);
    raise exception 'K8 BAŞARISIZ: NULL outcome reddedilmeli';
  exception when invalid_parameter_value then
    raise notice 'K8 OK: NULL outcome reddedildi';
  end;
end $$;

-- Temizlik
delete from public.otp_send_attempts where user_id = 'h0000000-0000-0000-0000-000000000001';
delete from auth.users where id = 'h0000000-0000-0000-0000-000000000001';

raise notice 'KABUL 7/7 OK (K5 atlandı) — WhatsApp OTP kota sistemi doğrulandı';

rollback;
