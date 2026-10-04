-- G04 · Telefon OTP: auth.users → user_verifications aynalama + phone-only kayıt guard.
--
-- ═══ AMAÇ ═══
-- Supabase Auth native yolu (updateUser({phone}) → verifyOtp → phone_confirmed_at)
-- kullanılır. Trigger, phone_confirmed_at değişimini user_verifications'a aynalar.
-- Phone-only kayıt (email YOK, phone VAR) reddedilir — amaç YALNIZCA mevcut hesaba
-- telefon eklemek, telefonla giriş/kayıt yolunu açmamak.
--
-- ═══ GÜVENLİK ═══
-- 1. Phone sign-up guard: auth.users BEFORE INSERT — email boş, phone dolu → reddet.
--    Bu, external_phone_enabled=true açıldığında telefonla kayıt yolunu kapatır.
-- 2. Phone sign-in: Supabase Auth panelinde "Phone Auth" kapalı tutulmalı (U06 talimatı).
--    Bu migration auth.users'a DOKUNMAZ — Auth ayarı kullanıcı işi.
-- 3. user_verifications RLS hâlâ kapalı (service_role hariç) — değişmedi.
--
-- ═══ GÖZLEM ═══
-- otp_send_attempts tablosu: Her OTP gönderim/deneme DB'ye yazılır (edge function veya
-- client kodu tarafından). Sınır enforcement YOK — Auth'un yerleşik sınırları geçerli.
-- Spike notu: docs/plans/2026-10-04-g04-g05-telefon-otp-spike.md
--
-- ═══ SINIRLAR (canlıda ölçülen, KALANLAR G09) ═══
-- groups.otp_rate_limits: {per_user_per_day:5, per_user_per_hour:3,
--   resend_cooldown_seconds:60, max_verify_attempts:5}
-- Bu değerler OLDUĞU GİBİ kullanılır; teyit beklenmez.

begin;

-- ═══ 1. otp_send_attempts gözlem tablosu ═══
create table if not exists public.otp_send_attempts (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  attempt_type text not null check (attempt_type in ('send', 'verify', 'resend')),
  blocked_by_auth boolean not null default false,
  auth_error_code text,
  created_at timestamptz not null default now()
);

comment on table public.otp_send_attempts is
  'G04: OTP gönderim/deneme gözlem tablosu. Sınır enforcement YOK — Auth yerleşik sınırları kullanır. Analiz/audit için kayıt tutar.';

alter table public.otp_send_attempts enable row level security;
revoke all on table public.otp_send_attempts from anon, authenticated;
grant all on table public.otp_send_attempts to service_role;

-- ═══ 2. phone_confirmed_at → user_verifications aynalama trigger ═══
create or replace function public.mirror_phone_confirmation_to_user_verifications()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.phone_confirmed_at is not null and (old.phone_confirmed_at is null or old.phone_confirmed_at is distinct from new.phone_confirmed_at) then
    insert into public.user_verifications (user_id, phone_e164, phone_verified_at, phone_country_code)
    values (new.id, new.phone, new.phone_confirmed_at, null)
    on conflict (user_id) do update
      set phone_e164 = excluded.phone_e164,
          phone_verified_at = excluded.phone_verified_at,
          updated_at = now();
  elsif new.phone_confirmed_at is null and old.phone_confirmed_at is not null then
    update public.user_verifications
       set phone_verified_at = null,
           updated_at = now()
     where user_id = new.id;
  end if;
  return new;
end;
$$;

drop trigger if exists on_auth_user_phone_confirmed_mirror on auth.users;
create trigger on_auth_user_phone_confirmed_mirror
  after update of phone_confirmed_at on auth.users
  for each row
  execute function public.mirror_phone_confirmation_to_user_verifications();

-- ═══ 3. Phone-only kayıt guard (BEFORE INSERT) ═══
create or replace function public.reject_phone_only_auth_signup()
returns trigger
language plpgsql
as $$
begin
  if (new.email is null or new.email = '') and new.phone is not null and new.phone != '' then
    raise exception 'phone_only_signup_not_allowed: email required'
      using hint = 'Phone sign-up is disabled. Use email registration.',
            errcode = '28000';
  end if;
  return new;
end;
$$;

drop trigger if exists on_auth_user_reject_phone_only_signup on auth.users;
create trigger on_auth_user_reject_phone_only_signup
  before insert on auth.users
  for each row
  execute function public.reject_phone_only_auth_signup();

-- ═══ 4. Grant — mirror fonksiyonu service_role olarak çalışır ═══
revoke all on function public.mirror_phone_confirmation_to_user_verifications() from anon, authenticated;
grant execute on function public.mirror_phone_confirmation_to_user_verifications() to service_role;

commit;
