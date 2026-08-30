import QRCode from "qrcode";

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

const qrOptions = {
  errorCorrectionLevel: "M" as const,
  margin: 2,
  width: 512,
  color: { dark: "#0f4c5c", light: "#ffffff" },
};

function assertSafeTargetUrl(targetUrl: string): URL {
  const parsed = new URL(targetUrl);
  if (parsed.protocol !== "https:" && parsed.hostname !== "localhost") {
    throw new Error("QR hedefi güvenli bir adres olmalı.");
  }
  return parsed;
}

export function generateReferralQrSvg(targetUrl: string): Promise<string> {
  return QRCode.toString(assertSafeTargetUrl(targetUrl).toString(), { ...qrOptions, type: "svg" });
}

export function generateReferralQrPngDataUrl(targetUrl: string): Promise<string> {
  return QRCode.toDataURL(assertSafeTargetUrl(targetUrl).toString(), { ...qrOptions, type: "image/png" });
}
