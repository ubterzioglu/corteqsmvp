// G05 · Telefon doğrulama API — Supabase Auth native yolu.
//
// 🔴 AMAÇ: YALNIZCA mevcut hesaba telefon eklemek. Phone sign-up/sign-in KAPALI
//    (G04 migration guard + Auth panel ayarı).
// 🔴 Native yol: updateUser({phone}) → Auth SMS gönderir → verifyOtp → phone_confirmed_at
//    → trigger user_verifications'a aynalar (G04).
// 🔴 HIZ SINIRI: Auth'un yerleşik sınırları (30/gün proje geneli) geçerli. DB'de
//    otp_send_attempts tablosu ile GÖZLEM yapılır, enforcement YOK (spike kararı).
//    Kullanıcı başına 5/gün, 3/saat politikası ENFORCED değil — KARAR GEREKİR.
// 🔴 Ülke telefon alan kodundan TÜRETİLMEZ (WS1 madde 10, phone-country-derivation.test.ts).
//    phone_country_code dolsa bile profil ülkesi olmaz.

import { supabase } from "@/integrations/supabase/client";
import { normalizePhoneE164, PHONE_INVALID_MESSAGE } from "@/lib/profile-phone";

export const PHONE_VERIFICATION_ERROR_MESSAGES = {
  auth_required: "Telefon doğrulama için giriş yapmalısın.",
  invalid_phone: PHONE_INVALID_MESSAGE,
  same_phone: "Bu telefon zaten doğrulanmış.",
  send_failed: "Doğrulama kodu gönderilemedi. Lütfen tekrar dene.",
  verify_failed: "Doğrulama kodu hatalı veya süresi dolmuş.",
  rate_limited: "Çok fazla deneme yaptın. Lütfen bir süre sonra tekrar dene.",
  generic: "Telefon doğrulama işlenemedi. Lütfen tekrar dene.",
} as const;

export interface PhoneVerificationStatus {
  isVerified: boolean;
  phone: string | null;
  verifiedAt: string | null;
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
    phone: row?.phone_e164 ?? null,
    verifiedAt: row?.phone_verified_at ?? null,
  };
}

/**
 * Telefon doğrulama kodu gönder. Native yol: updateUser({phone}) → Auth SMS.
 * Gözlem: otp_send_attempts'a kayıt yazılır (enforcement değil).
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
  if (currentPhone === normalized) {
    throw new Error(PHONE_VERIFICATION_ERROR_MESSAGES.same_phone);
  }

  try {
    const { error } = await supabase.auth.updateUser({ phone: normalized });
    await recordOtpAttempt(uid, "send", error != null, error?.message ?? null);
    if (error) {
      if (error.message?.includes("rate limit") || error.message?.includes("over")) {
        throw new Error(PHONE_VERIFICATION_ERROR_MESSAGES.rate_limited);
      }
      throw new Error(PHONE_VERIFICATION_ERROR_MESSAGES.send_failed);
    }
  } catch (err) {
    if (err instanceof Error && err.message in PHONE_VERIFICATION_ERROR_MESSAGES) {
      throw err;
    }
    if (err instanceof Error && (err.message.includes("rate limit") || err.message.includes("over"))) {
      await recordOtpAttempt(uid, "send", true, err.message);
      throw new Error(PHONE_VERIFICATION_ERROR_MESSAGES.rate_limited);
    }
    await recordOtpAttempt(uid, "send", true, String(err));
    throw new Error(PHONE_VERIFICATION_ERROR_MESSAGES.send_failed);
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

  const phone = userData.user.phone;

  try {
    const { error } = await supabase.auth.verifyOtp({
      type: "phone_change",
      token: code,
      phone: phone ?? undefined,
    } as never);
    await recordOtpAttempt(uid, "verify", error != null, error?.message ?? null);
    if (error) {
      throw new Error(PHONE_VERIFICATION_ERROR_MESSAGES.verify_failed);
    }
  } catch (err) {
    if (err instanceof Error && err.message in PHONE_VERIFICATION_ERROR_MESSAGES) {
      throw err;
    }
    await recordOtpAttempt(uid, "verify", true, String(err));
    throw new Error(PHONE_VERIFICATION_ERROR_MESSAGES.verify_failed);
  }
}

/** Gözlem: OTP girişimini DB'ye kaydet (enforcement değil, audit için). */
async function recordOtpAttempt(
  userId: string,
  attemptType: "send" | "verify" | "resend",
  blockedByAuth: boolean,
  authErrorCode: string | null,
): Promise<void> {
  try {
    await supabase.from("otp_send_attempts" as never).insert({
      user_id: userId,
      attempt_type: attemptType,
      blocked_by_auth: blockedByAuth,
      auth_error_code: authErrorCode,
    } as never);
  } catch {
    // Gözlem hatası akışı bloklamaz — sessizce yut.
  }
}
