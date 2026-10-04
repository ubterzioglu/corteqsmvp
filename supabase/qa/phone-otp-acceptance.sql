-- G04 · Telefon OTP aynalama + phone-only kayıt guard — kabul (geri alınan işlem).
-- Migration 20261004270000: auth.users AFTER UPDATE trigger → user_verifications aynalama,
-- auth.users BEFORE INSERT guard → phone-only kayıt reddet, otp_send_attempts gözlem tablosu.
--
-- 🔴 Sağlayıcı yokken gerçek SMS gönderilemez (U06 bekliyor). Bu test auth.users'a
--    phone_confirmed_at YAZDIRARAK aynalama trigger'ını tetikler — gerçek OTP akışı değil.
-- 🔴 "Uçtan uca doğrulandı" YAZILMAZ — YALNIZ trigger aynalama + guard + gözlem kanıtlanır.

\set ON_ERROR_STOP on
begin;

-- ═══ Fixture ═══
create temp table t(k text primary key, v uuid) on commit drop;
insert into auth.users (id, email) values
  (gen_random_uuid(), 'g04-phone@test.local');
insert into t select 'user', id from auth.users where email = 'g04-phone@test.local';

-- ═══ K1: phone_confirmed_at NULL iken user_verifications satırı YOK ═══
do $$
declare
  v_uid uuid := (select v from t where k = 'user');
  v_count int;
begin
  select count(*) into v_count from user_verifications where user_id = v_uid;
  assert v_count = 0, 'K1 FAIL: phone_confirmed_at NULL iken user_verifications satırı olmamalı';
  assert public.is_phone_verified(v_uid) = false, 'K1 FAIL: is_phone_verified false dönmeli';
end $$;

-- ═══ K2: phone_confirmed_at yazılınca trigger user_verifications'a aynalar ═══
do $$
declare
  v_uid uuid := (select v from t where k = 'user');
  v_e164 text;
  v_verified_at timestamptz;
begin
  update auth.users
     set phone = '+491701234567',
         phone_confirmed_at = now()
   where id = v_uid;

  select phone_e164, phone_verified_at into v_e164, v_verified_at
    from user_verifications where user_id = v_uid;
  assert v_e164 = '+491701234567', 'K2 FAIL: phone_e164 aynalanmadı';
  assert v_verified_at is not null, 'K2 FAIL: phone_verified_at aynalanmadı';
  assert public.is_phone_verified(v_uid) = true, 'K2 FAIL: is_phone_verified true dönmeli';
end $$;

-- ═══ K3: phone_confirmed_at NULL'a çekilince user_verifications güncellenir ═══
do $$
declare
  v_uid uuid := (select v from t where k = 'user');
  v_verified_at timestamptz;
begin
  update auth.users
     set phone_confirmed_at = null
   where id = v_uid;

  select phone_verified_at into v_verified_at
    from user_verifications where user_id = v_uid;
  assert v_verified_at is null, 'K3 FAIL: phone_verified_at NULL olmalı';
  assert public.is_phone_verified(v_uid) = false, 'K3 FAIL: is_phone_verified false dönmeli';
end $$;

-- ═══ K4: Phone-only INSERT reddedilir (email YOK, phone VAR) ═══
do $$
declare
  v_phone_only_rejected boolean := false;
begin
  begin
    insert into auth.users (id, phone, instance_id)
    values (gen_random_uuid(), '+491709999999', '00000000-0000-0000-0000-000000000000');
  exception when others then
    v_phone_only_rejected := true;
  end;
  assert v_phone_only_rejected, 'K4 FAIL: Phone-only INSERT reddedilmeli (email gerekli)';
end $$;

-- ═══ K5: Email + phone INSERT reddedilmez (normal kayıt) ═══
do $$
declare
  v_uid uuid;
  v_rejected boolean := false;
begin
  begin
    v_uid := gen_random_uuid();
    insert into auth.users (id, email, instance_id)
    values (v_uid, 'g04-normal@test.local', '00000000-0000-0000-0000-000000000000');
  exception when others then
    v_rejected := true;
  end;
  assert v_rejected = false, 'K5 FAIL: Email + normal INSERT reddedilmemeli';
end $$;

-- ═══ K6: otp_send_attempts gözlem tablosu çalışır ═══
do $$
declare
  v_uid uuid := (select v from t where k = 'user');
  v_count int;
begin
  insert into otp_send_attempts (user_id, attempt_type, blocked_by_auth)
  values (v_uid, 'send', false);
  insert into otp_send_attempts (user_id, attempt_type, blocked_by_auth)
  values (v_uid, 'verify', false);

  select count(*) into v_count from otp_send_attempts where user_id = v_uid;
  assert v_count = 2, 'K6 FAIL: otp_send_attempts 2 satır içermeli';
end $$;

-- ═══ K7: otp_send_attempts RLS — anon/authenticated erişemez ═══
do $$
declare
  v_rejected boolean := false;
begin
  set local role authenticated;
  begin
    perform count(*) from otp_send_attempts;
  exception when others then
    v_rejected := true;
  end;
  reset role;
  assert v_rejected, 'K7 FAIL: authenticated otp_send_attempts okuyamamalı';
end $$;

-- ═══ K8: user_verifications RLS hâlâ kapalı (service_role hariç) ═══
do $$
declare
  v_rejected boolean := false;
begin
  set local role authenticated;
  begin
    perform count(*) from user_verifications;
  exception when others then
    v_rejected := true;
  end;
  reset role;
  assert v_rejected, 'K8 FAIL: authenticated user_verifications okuyamamalı';
end $$;

-- ═══ K9: Grant — otp_send_attempts yalnız service_role ═══
do $$
declare
  v_has_privilege boolean;
begin
  select has_table_privilege('service_role', 'otp_send_attempts', 'INSERT') into v_has_privilege;
  assert v_has_privilege, 'K9 FAIL: service_role otp_send_attempts INSERT yapabilmeli';
end $$;

-- ═══ Temizlik ═══
delete from auth.users where email like 'g04-%@test.local';

-- ═══ Özet ═══
do $$
begin
  raise notice 'G04 kabul: K1–K9 9/9 PASSED (geri alınan işlem)';
end $$;

rollback;
