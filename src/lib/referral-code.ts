// Referral kodu normalizasyonu — `qrcode` paketine BAĞIMLI DEĞİLDİR.
// invites-api başlangıç zincirinde (use-invite-redemption) olduğu için buradan
// import eder; referral-qr.ts'ten import etseydi `qrcode` her sayfada yüklenirdi
// (Lighthouse 2026-10-12). QR üretimi referral-qr.ts'te kalır ve bunları yeniden
// dışa aktarır, mevcut importlar kırılmaz.

const REFERRAL_CODE_PATTERN = /^[A-Z0-9]+(?:-[A-Z0-9]+)*$/;

export function normalizeReferralCode(code: string): string {
  const normalized = code.trim().toUpperCase();
  if (!normalized || normalized.length > 128 || !REFERRAL_CODE_PATTERN.test(normalized)) {
    throw new Error("Referral kodu geçersiz.");
  }
  return normalized;
}

export function buildReferralTargetUrl(
  code: string,
  baseOrigin = typeof window === "undefined" ? "https://corteqs.net" : window.location.origin,
): string {
  const target = new URL("/founding-1000", baseOrigin);
  target.searchParams.set("ref", normalizeReferralCode(code));
  return target.toString();
}

export function readReferralCodeFromSearch(search: string): string | undefined {
  const code = new URLSearchParams(search).get("ref");
  if (!code) return undefined;

  try {
    return normalizeReferralCode(code);
  } catch {
    return undefined;
  }
}
