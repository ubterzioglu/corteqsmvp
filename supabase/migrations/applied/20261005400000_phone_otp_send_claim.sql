-- G05 · WhatsApp OTP: kota defterini SUNUCUDA zorlayan atomik kota RPC'si.
--
-- ═══ NEDEN ═══
-- Telefon OTP'si Supabase "Send SMS" Auth Hook'u üzerinden WhatsApp'a (Meta Cloud API)
-- gidiyor (edge function `send-phone-otp-hook`). Auth'un yerleşik sınırı proje geneli;
-- kullanıcı başına sınır (G09: group_settings 'groups.otp_rate_limits') hook içinde
-- uygulanır. 20261004270000'daki `otp_send_attempts` yalnız GÖZLEM tablosuydu ve
-- istemci ona yazamıyordu (RLS authenticated için kapalı) — yani bugün boş. Bu
-- migration onu hook'un kota defteri yapar.
--
-- ═══ TASARIM ═══
-- claim_phone_otp_send(user, phone_hash) : kilit al → sınırları say → izinliyse 'claimed' yaz.
-- finish_phone_otp_send(id, …)           : Graph sonucu 'sent' | 'failed' olarak işlenir.
--
-- Dört sınır (hepsi group_settings 'groups.otp_rate_limits' JSON'unda; ayar yoksa varsayılan):
--   1. kullanıcı başına: cooldown (60 sn) · saatlik (3) · günlük (5)
--   2. NUMARA başına günlük (3): çok hesap açıp aynı kurbana mesaj yağdırmayı (SMS-bombing
--      / Meta faturası / WABA kalite puanı) keser. Numara düz saklanmaz — hook'un HMAC'ladığı
--      `phone_hash` gelir.
--   3. global saatlik tavan (60): hesap-çiftliği saldırısında maliyetin üst sınırı. ⚠️ Bu aynı
--      zamanda bir DoS kolu — meşru kullanıcıları da durdurur; değeri ürün kararıdır.
--   4. kullanıcı başına saatlik BAŞARISIZ deneme (10): geçersiz/WhatsApp'sız numaralarla
--      Graph API'yi sınırsız yakmayı keser (failed satırlar 1-3'e sayılmaz).
-- Kotaya yalnız 'claimed' ve 'sent' sayılır; 'failed' (mesaj kesin gitmedi) ve send_outcome'u
-- NULL eski satırlar 1-3'e sayılmaz. Hook çökerse ya da sonuç belirsizse satır 'claimed'
-- kalır ve sayılmaya devam eder (güvenli yön: kota fazla sıkılaşır, gevşemez).
-- max_verify_attempts doğrulama tarafıdır ve Auth'ta durur, burada ZORLANMAZ.
-- Yalnız service_role çağırır — anon/authenticated EXECUTE yok.
-- Temizlik: kota penceresi 1 gün; satırlar 7 günden sonra güvenle silinebilir (pg_cron işi
-- ayrı karar; tablo kullanıcı başına günde ≤ ~15 satır büyür).

begin;

-- ═══ 1. Kota defteri sütunları (eklemeli; var olan satırlar etkilenmez) ═══
alter table public.otp_send_attempts
  add column if not exists send_outcome text,
  add column if not exists provider_ref text,
  add column if not exists phone_hash text;

alter table public.otp_send_attempts
  drop constraint if exists otp_send_attempts_send_outcome_check;
alter table public.otp_send_attempts
  add constraint otp_send_attempts_send_outcome_check
  check (send_outcome is null or send_outcome in ('claimed', 'sent', 'failed'));

comment on column public.otp_send_attempts.send_outcome is
  'claimed = kota alındı, sonuç bilinmiyor · sent = WhatsApp kabul etti · failed = kesin gitmedi. NULL = eski gözlem satırı, kotaya sayılmaz.';
comment on column public.otp_send_attempts.provider_ref is
  'sent: Meta mesaj kimliği (wamid.…) · failed: kod benzeri hata ayrıntısı (meta_http_400). Telefon/OTP ASLA yazılmaz.';
comment on column public.otp_send_attempts.phone_hash is
  'Alıcı numaranın HMAC-SHA256 özeti (hook, gizli pepper ile). Numara başına kota içindir; numara düz SAKLANMAZ.';

create index if not exists otp_send_attempts_user_send_created_idx
  on public.otp_send_attempts (user_id, created_at desc)
  where attempt_type = 'send';
create index if not exists otp_send_attempts_phone_send_created_idx
  on public.otp_send_attempts (phone_hash, created_at desc)
  where attempt_type = 'send' and phone_hash is not null;
create index if not exists otp_send_attempts_send_created_idx
  on public.otp_send_attempts (created_at desc)
  where attempt_type = 'send';

-- ═══ 2. Kota al ═══
-- Ayar okuma yardımcısı: JSON değeri sayı değilse / yoksa varsayılana düşer ve alt sınırı uygular
-- (bozuk ayar — "abc", 5.0, 0, negatif — hook'u durdurmaz, kalıcı blok da yapmaz).
create or replace function public.phone_otp_limit(p_limits jsonb, p_key text, p_default integer, p_min integer)
returns integer
language sql
immutable
set search_path = public, pg_temp
as $$
  select greatest(
    p_min,
    coalesce(
      case when jsonb_typeof(p_limits -> p_key) = 'number'
           then floor((p_limits ->> p_key)::numeric)::integer
      end,
      p_default
    )
  );
$$;

create or replace function public.claim_phone_otp_send(p_user_id uuid, p_phone_hash text)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_limits jsonb;
  v_per_day integer;
  v_per_hour integer;
  v_cooldown integer;
  v_per_phone_day integer;
  v_global_hour integer;
  v_failed_hour integer;
  v_now timestamptz;
  v_last timestamptz;
  v_day_count integer;
  v_hour_count integer;
  v_day_oldest timestamptz;
  v_hour_oldest timestamptz;
  v_phone_count integer;
  v_phone_oldest timestamptz;
  v_global_count integer;
  v_global_oldest timestamptz;
  v_failed_count integer;
  v_failed_oldest timestamptz;
  v_retry integer := 0;
  v_reason text;
  v_attempt_id bigint;
begin
  -- Aynı kullanıcının eşzamanlı iki hook çağrısı kotayı birlikte aşamasın.
  perform pg_advisory_xact_lock(hashtextextended(p_user_id::text, 0));
  -- Zaman, kilit beklemesinden SONRA alınır (beklerken yazılan satırlar doğru görülsün).
  v_now := clock_timestamp();

  v_limits := public.group_setting_json(
    'groups.otp_rate_limits',
    '{"per_user_per_day": 5, "per_user_per_hour": 3, "resend_cooldown_seconds": 60}'::jsonb
  );
  v_per_day := public.phone_otp_limit(v_limits, 'per_user_per_day', 5, 1);
  v_per_hour := public.phone_otp_limit(v_limits, 'per_user_per_hour', 3, 1);
  v_cooldown := public.phone_otp_limit(v_limits, 'resend_cooldown_seconds', 60, 0);
  v_per_phone_day := public.phone_otp_limit(v_limits, 'per_phone_per_day', 3, 1);
  v_global_hour := public.phone_otp_limit(v_limits, 'global_per_hour', 60, 1);
  v_failed_hour := public.phone_otp_limit(v_limits, 'per_user_failed_per_hour', 10, 1);

  -- 1. Kullanıcı başına (cooldown + saatlik + günlük)
  select max(created_at),
         count(*) filter (where created_at > v_now - interval '1 day'),
         count(*) filter (where created_at > v_now - interval '1 hour'),
         min(created_at) filter (where created_at > v_now - interval '1 day'),
         min(created_at) filter (where created_at > v_now - interval '1 hour')
    into v_last, v_day_count, v_hour_count, v_day_oldest, v_hour_oldest
    from public.otp_send_attempts
   where user_id = p_user_id
     and attempt_type = 'send'
     and send_outcome in ('claimed', 'sent')
     and created_at > v_now - interval '1 day';

  if v_last is not null and v_last > v_now - make_interval(secs => v_cooldown) then
    v_reason := 'cooldown';
    v_retry := greatest(v_retry, ceil(extract(epoch from (v_last + make_interval(secs => v_cooldown) - v_now)))::integer);
  end if;
  if v_hour_count >= v_per_hour then
    v_reason := coalesce(v_reason, 'hourly');
    v_retry := greatest(v_retry, ceil(extract(epoch from (v_hour_oldest + interval '1 hour' - v_now)))::integer);
  end if;
  if v_day_count >= v_per_day then
    v_reason := coalesce(v_reason, 'daily');
    v_retry := greatest(v_retry, ceil(extract(epoch from (v_day_oldest + interval '1 day' - v_now)))::integer);
  end if;

  -- 2. Numara başına günlük (tüm kullanıcılar)
  if p_phone_hash is not null then
    select count(*), min(created_at)
      into v_phone_count, v_phone_oldest
      from public.otp_send_attempts
     where phone_hash = p_phone_hash
       and attempt_type = 'send'
       and send_outcome in ('claimed', 'sent')
       and created_at > v_now - interval '1 day';
    if v_phone_count >= v_per_phone_day then
      v_reason := coalesce(v_reason, 'phone_daily');
      v_retry := greatest(v_retry, ceil(extract(epoch from (v_phone_oldest + interval '1 day' - v_now)))::integer);
    end if;
  end if;

  -- 3. Global saatlik tavan
  select count(*), min(created_at)
    into v_global_count, v_global_oldest
    from public.otp_send_attempts
   where attempt_type = 'send'
     and send_outcome in ('claimed', 'sent')
     and created_at > v_now - interval '1 hour';
  if v_global_count >= v_global_hour then
    v_reason := coalesce(v_reason, 'global');
    v_retry := greatest(v_retry, ceil(extract(epoch from (v_global_oldest + interval '1 hour' - v_now)))::integer);
  end if;

  -- 4. Kullanıcı başına saatlik başarısız deneme
  select count(*), min(created_at)
    into v_failed_count, v_failed_oldest
    from public.otp_send_attempts
   where user_id = p_user_id
     and attempt_type = 'send'
     and send_outcome = 'failed'
     and created_at > v_now - interval '1 hour';
  if v_failed_count >= v_failed_hour then
    v_reason := coalesce(v_reason, 'failures');
    v_retry := greatest(v_retry, ceil(extract(epoch from (v_failed_oldest + interval '1 hour' - v_now)))::integer);
  end if;

  if v_reason is not null then
    return jsonb_build_object('allowed', false, 'reason', v_reason, 'retry_after_seconds', greatest(v_retry, 1));
  end if;

  insert into public.otp_send_attempts (user_id, attempt_type, send_outcome, phone_hash)
  values (p_user_id, 'send', 'claimed', p_phone_hash)
  returning id into v_attempt_id;

  return jsonb_build_object('allowed', true, 'attempt_id', v_attempt_id);
end;
$$;

-- ═══ 3. Sonucu işle ═══
create or replace function public.finish_phone_otp_send(
  p_attempt_id bigint,
  p_outcome text,
  p_detail text
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  -- NULL outcome `not in` ile NULL döner ve guard'ı geçerdi → satır kotadan düşerdi.
  if p_outcome is null or p_outcome not in ('sent', 'failed') then
    raise exception 'invalid_outcome' using errcode = '22023';
  end if;

  update public.otp_send_attempts
     set send_outcome = p_outcome,
         provider_ref = left(p_detail, 120)
   where id = p_attempt_id
     and attempt_type = 'send'
     and send_outcome = 'claimed';
end;
$$;

-- ═══ 4. Yetkiler: yalnız service_role ═══
revoke all on function public.phone_otp_limit(jsonb, text, integer, integer) from public, anon, authenticated;
revoke all on function public.claim_phone_otp_send(uuid, text) from public, anon, authenticated;
revoke all on function public.finish_phone_otp_send(bigint, text, text) from public, anon, authenticated;
grant execute on function public.phone_otp_limit(jsonb, text, integer, integer) to service_role;
grant execute on function public.claim_phone_otp_send(uuid, text) to service_role;
grant execute on function public.finish_phone_otp_send(bigint, text, text) to service_role;

commit;
