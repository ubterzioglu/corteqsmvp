// G05 · Telefon doğrulama API — Supabase Auth native yolu, kod WhatsApp ile taşınır.
//
// 🔴 AMAÇ: YALNIZCA mevcut hesaba telefon eklemek. Phone sign-up/sign-in KAPALI
//    (G04 migration guard + Auth panel ayarı).
// 🔴 Akış: updateUser({phone}) → Auth kodu üretir → "Send SMS" Auth Hook
//    (`supabase/functions/send-phone-otp-hook`) kodu WhatsApp şablonuyla yollar →
//    verifyOtp → phone_confirmed_at → trigger user_verifications'a aynalar (G04).
// 🔴 HIZ SINIRI sunucuda zorlanır: kullanıcı başına sınırlar group_settings tablosundaki
//    otp_rate_limits satırından okunur (anahtar adı BİLEREK tırnaksız: src ağacında
//    çıplak groups.* anahtarı yasak, bkz. group-settings.test.ts), hook
//    claim_phone_otp_send RPC'siyle uygular (mig 20261005400000). İstemci kayıt TUTMAZ —
//    otp_send_attempts tablosuna istemci yazamaz (RLS), defteri hook işletir.
// 🔴 Ülke telefon alan kodundan TÜRETİLMEZ (WS1 madde 10, phone-country-derivation.test.ts).
//    phone_country_code dolsa bile profil ülkesi olmaz.

import { supabase } from "@/integrations/supabase/client";
import { normalizePhoneE164, PHONE_INVALID_MESSAGE } from "@/lib/profile-phone";

export const PHONE_VERIFICATION_ERROR_MESSAGES = {
  auth_required: "Telefon doğrulama için giriş yapmalısın.",
  invalid_phone: PHONE_INVALID_MESSAGE,
  same_phone: "Bu telefon zaten doğrulanmış.",
  send_failed:
    "Doğrulama kodu WhatsApp'a gönderilemedi. Numaranın WhatsApp'ta kayıtlı olduğundan emin ol ve tekrar dene.",
  verify_failed: "Doğrulama kodu hatalı veya süresi dolmuş.",
  rate_limited: "Çok fazla deneme yaptın. Lütfen bir süre sonra tekrar dene.",
  generic: "Telefon doğrulama işlenemedi. Lütfen tekrar dene.",
} as const;

export interface PhoneVerificationStatus {
  isVerified: boolean;
  phone: string | null;
  verifiedAt: string | null;
}

interface AuthFailure {
  message?: string | null;
  status?: number | null;
  code?: string | null;
}

// Sınır aşımı üç yoldan gelebilir: (1) Send SMS hook'un `phone_otp_rate_limited` mesajı,
// (2) Auth'un kendi SMS sınırı (`over_sms_send_rate_limit`), (3) HTTP 429. GoTrue'nun hook
// hatasını istemciye hangi sarmalla ilettiği canlıda ÖLÇÜLMEDİ; bu yüzden üçü de aranır.
// Genel ifadeler ("too many") bilerek YOK: SMTP/IP sınırı gibi alakasız hataları da
// "çok fazla deneme"ye çevirirdi.
function isRateLimited(failure: AuthFailure): boolean {
  if (failure.status === 429) return true;
  if (failure.code === "over_sms_send_rate_limit") return true;
  return (failure.message ?? "").includes("phone_otp_rate_limited");
}

/** Hook mesajındaki `retry_after=<sn>` ipucunu okunur bir cümleye çevirir; yoksa boş. */
export function formatRetryHint(message: string | null | undefined): string {
  const seconds = Number(/retry_after=(\d+)/.exec(message ?? "")?.[1]);
  if (!Number.isFinite(seconds) || seconds <= 0) return "";
  return seconds < 90 ? ` Yaklaşık ${seconds} sn sonra tekrar dene.` : ` Yaklaşık ${Math.ceil(seconds / 60)} dk sonra tekrar dene.`;
}

/**
 * Auth `phone` değeri '+'sız saklanır (GoTrue: "491701234567"); G04 trigger'ı bunu
 * user_verifications.phone_e164'e olduğu gibi yazar. Karşılaştırma ve gösterim için tek biçim.
 */
function stripPlus(phone: string): string {
  return phone.startsWith("+") ? phone.slice(1) : phone;
}

function toDisplayPhone(phone: string | null | undefined): string | null {
  if (!phone) return null;
  return `+${stripPlus(phone)}`;
}

/** Mevcut kullanıcının telefon doğrulama durumunu döner. */
export async function fetchPhoneVerificationStatus(): Promise<PhoneVerificationStatus> {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) {
    return { isVerified: false, phone: null, verifiedAt: null };
  }

  const { data, error } = await supabase
    .from("user_verifications" as never)
    .select("phone_e164, phone_verified_at" as never)
    .eq("user_id" as never, userData.user.id as never)
    .maybeSingle();

  if (error) {
    return { isVerified: false, phone: null, verifiedAt: null };
  }

  const row = (data as { phone_e164?: string; phone_verified_at?: string } | null) ?? null;
  return {
    isVerified: row?.phone_verified_at != null,
    phone: toDisplayPhone(row?.phone_e164),
    verifiedAt: row?.phone_verified_at ?? null,
  };
}

/**
 * Telefon doğrulama kodu gönder. Native yol: updateUser({phone}) → Auth → Send SMS hook →
 * WhatsApp. Kota ve kayıt sunucuda (hook) tutulur.
 */
export async function sendPhoneVerificationCode(phone: string): Promise<void> {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  const uid = userData.user?.id;
  if (userError || !uid) {
    throw new Error(PHONE_VERIFICATION_ERROR_MESSAGES.auth_required);
  }

  const normalized = normalizePhoneE164(phone);
  if (!normalized) {
    throw new Error(PHONE_VERIFICATION_ERROR_MESSAGES.invalid_phone);
  }

  const { data: currentStatus } = await supabase
    .from("user_verifications" as never)
    .select("phone_e164" as never)
    .eq("user_id" as never, uid as never)
    .maybeSingle();

  const currentPhone = (currentStatus as { phone_e164?: string } | null)?.phone_e164;
  if (currentPhone && stripPlus(currentPhone) === stripPlus(normalized)) {
    throw new Error(PHONE_VERIFICATION_ERROR_MESSAGES.same_phone);
  }

  let failure: AuthFailure | null = null;
  try {
    const { error } = await supabase.auth.updateUser({ phone: normalized });
    failure = error ?? null;
  } catch (err) {
    failure = err instanceof Error ? { message: err.message } : { message: String(err) };
  }

  if (failure !== null) {
    throw new Error(
      isRateLimited(failure)
        ? `${PHONE_VERIFICATION_ERROR_MESSAGES.rate_limited}${formatRetryHint(failure.message)}`
        : PHONE_VERIFICATION_ERROR_MESSAGES.send_failed,
    );
  }
}

/**
 * Telefon doğrulama kodunu doğrula. Native yol: verifyOtp({type:'phone_change'}).
 * Başarıda trigger user_verifications'a aynalar (G04).
 */
export async function verifyPhoneVerificationCode(code: string): Promise<void> {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  const uid = userData.user?.id;
  if (userError || !uid) {
    throw new Error(PHONE_VERIFICATION_ERROR_MESSAGES.auth_required);
  }

  // phone_change doğrulamasında `phone`, DOĞRULANACAK (bekleyen) numaradır: updateUser sonrası
  // o `new_phone`'da durur, `phone` ise eski/boştur. Canlı uçtan uca denemeyle teyit edilir.
  const phone = userData.user.new_phone ?? userData.user.phone;

  let failed = false;
  try {
    const { error } = await supabase.auth.verifyOtp({
      type: "phone_change",
      token: code,
      phone: phone ?? undefined,
    } as never);
    failed = error != null;
  } catch {
    failed = true;
  }

  if (failed) {
    throw new Error(PHONE_VERIFICATION_ERROR_MESSAGES.verify_failed);
  }
}
