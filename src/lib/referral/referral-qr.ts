import QRCode from "qrcode";

// Kod normalizasyonu qrcode'suz modüldedir (başlangıç zinciri onu kullanır);
// burada yalnız geriye uyumluluk için yeniden dışa aktarılır.
export { buildReferralTargetUrl, normalizeReferralCode, readReferralCodeFromSearch } from "./referral-code";

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
