// Üyeye giden profil doluluk hatırlatma e-postası (L10b).
//
// TASLAK — Burak onaylayacak. Konu, gövde ve düğme metni onaylanana kadar bayrak
// (email.profile_completion_reminder.enabled) KAPALI kalır; metin değişirse yalnız bu dosya
// ve testi güncellenir. Alıcı üyenin kendisidir (payload.email) — admin aboneliğine bakılmaz.
//
// Kayıt sonrası 0., 3. ve 10. günde, doluluk eşiğin altındayken gider (enqueue SQL'de:
// supabase/migrations/applied/20261109100000_profile_completion_reminder.sql).
// E-posta HTML kuralları (table yerleşim, inline stil, hex renk, metin sürümü) için bkz.
// ./member-welcome.ts başlığı — aynı kurallar burada da geçerlidir.

import { escapeHtml } from "./html.ts";

const BRAND = "#25b19a";
const BRAND_DARK = "#17836f";
const TEXT = "#18181b";
const MUTED = "#71717a";
const BORDER = "#e4e4e7";
const PAGE_BG = "#f4f4f5";
const CARD_BG = "#ffffff";
const FONT = "-apple-system, 'Segoe UI', Roboto, Arial, sans-serif";

const DEFAULT_SITE_URL = "https://corteqs.net";

// ⚠️ Önerilen alanlar SABİT LİSTE DEĞİLDİR. Yüzdeyi yalnız rolün is_required alanları
// oynatır; eski statik liste (fotoğraf/meslek…) yüzdeyi hiç değiştirmiyordu ve "şunları
// eklemen yeterli" cümlesi yanlıştı. Liste enqueue anında SQL'de üretilir:
// payload.missing_labels = eksik zorunlu alanların afs_attributes.label değerleri.

export type ProfileCompletionReminderPayload = {
  full_name?: unknown;
  email?: unknown;
  percentage?: unknown;
  /** Hatırlatmanın durduğu doluluk eşiği (notification_settings, payload'da). */
  threshold?: unknown;
  /** Eksik ZORUNLU alanların etiketleri — yüzdeyi oynatan alanlar yalnız bunlar. */
  missing_labels?: unknown;
};

type BuiltEmail = { subject: string; html: string; text: string };

function text(value: unknown, fallback = ""): string {
  return typeof value === "string" && value.trim() !== "" ? value.trim() : fallback;
}

/** 0–100 aralığına sıkıştırılmış tam sayı; geçersizse null (yüzde hiç gösterilmez). */
function percent(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  return Math.min(100, Math.max(0, Math.round(value)));
}

/** 1–100 aralığında tam sayı eşik; değilse null (altbilgi genel cümleye düşer). */
function threshold(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isInteger(value) || value < 1 || value > 100) return null;
  return value;
}

/** Boş olmayan metin etiketleri; dizi değilse boş liste. */
function labels(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === "string" && item.trim() !== "")
    .map((item) => item.trim());
}

export function buildProfileCompletionReminderEmail(
  payload: ProfileCompletionReminderPayload,
  siteUrl?: string | null,
): BuiltEmail {
  const base = text(siteUrl, DEFAULT_SITE_URL).replace(/\/+$/, "") || DEFAULT_SITE_URL;
  const profileUrl = `${base}/profile`;
  const privacyUrl = `${base}/legal/privacy`;
  const firstName = text(payload?.full_name).split(/\s+/)[0] ?? "";
  const greeting = firstName !== "" && firstName.length <= 40 ? `Merhaba ${firstName},` : "Merhaba,";
  const pct = percent(payload?.percentage);
  const limit = threshold(payload?.threshold);
  const missing = labels(payload?.missing_labels);

  const subject = pct === null ? "CorteQS profilini tamamla" : `CorteQS profilin %${pct} tamamlandı, birkaç adım kaldı`;
  const progressLine = pct === null ? "Profilin henüz tamamlanmadı." : `Profilin şu an %${pct} tamamlanmış durumda.`;
  const reason = "Eksik bilgiler, seni doğru kişilerle ve fırsatlarla eşleştirmemizi zorlaştırıyor.";
  const intro =
    missing.length > 0
      ? `${reason} Profilinde eksik kalan alanlar:`
      : `${reason} Eksik alanları profil sayfanda görebilirsin.`;
  const footer =
    limit === null
      ? "Bu hatırlatmayı CorteQS üyesi olduğun için aldın; profilin yeterince dolunca gelmez."
      : `Bu hatırlatmayı CorteQS üyesi olduğun için aldın; profilin %${limit} doluluğa ulaşınca gelmez.`;

  const itemsHtml = missing.map((item) => `<li style="margin: 0 0 6px 0;">${escapeHtml(item)}</li>`).join("");
  const listHtml =
    missing.length > 0
      ? `<ul style="margin: 0 0 24px 20px; padding: 0; color: ${TEXT}; font-family: ${FONT}; font-size: 16px; line-height: 25px;">${itemsHtml}</ul>`
      : "";

  const html = `<!doctype html>
<html lang="tr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light">
<title>${escapeHtml(subject)}</title>
</head>
<body style="margin: 0; padding: 0; background-color: ${PAGE_BG};">
<div style="display: none; max-height: 0; overflow: hidden; opacity: 0; color: transparent; font-size: 1px; line-height: 1px;">${escapeHtml(progressLine)}</div>
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: ${PAGE_BG}; border-collapse: collapse;">
  <tr>
    <td align="center" style="padding: 24px 12px;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="width: 600px; max-width: 100%; background-color: ${CARD_BG}; border: 1px solid ${BORDER}; border-radius: 12px; border-collapse: separate;">
        <tr>
          <td style="background-color: ${BRAND}; border-radius: 12px 12px 0 0; padding: 20px 32px;">
            <a href="${escapeHtml(base)}" style="text-decoration: none; color: #ffffff; font-family: ${FONT}; font-size: 22px; font-weight: 700; letter-spacing: 0.06em;">CorteQS</a>
          </td>
        </tr>
        <tr>
          <td style="padding: 32px 32px 8px 32px;">
            <h1 style="margin: 0 0 12px 0; color: ${TEXT}; font-family: ${FONT}; font-size: 24px; line-height: 32px; font-weight: 700;">${escapeHtml(greeting)}</h1>
            <p style="margin: 0 0 16px 0; color: ${TEXT}; font-family: ${FONT}; font-size: 16px; line-height: 25px;">${escapeHtml(progressLine)}</p>
            <p style="margin: 0 0 12px 0; color: ${MUTED}; font-family: ${FONT}; font-size: 16px; line-height: 25px;">${escapeHtml(intro)}</p>
            ${listHtml}
          </td>
        </tr>
        <tr>
          <td style="padding: 0 32px 32px 32px;">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td style="background-color: ${BRAND}; border-radius: 8px;">
                  <a href="${escapeHtml(profileUrl)}" style="display: inline-block; padding: 14px 28px; color: #ffffff; font-family: ${FONT}; font-size: 16px; font-weight: 700; line-height: 20px; text-decoration: none;">Profilini tamamla</a>
                </td>
              </tr>
            </table>
            <p style="margin: 12px 0 0 0; color: ${MUTED}; font-family: ${FONT}; font-size: 13px; line-height: 20px;">
              Buton çalışmazsa bu adresi tarayıcına yapıştır:<br>
              <a href="${escapeHtml(profileUrl)}" style="color: ${BRAND_DARK}; word-break: break-all;">${escapeHtml(profileUrl)}</a>
            </p>
          </td>
        </tr>
      </table>
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="width: 600px; max-width: 100%; border-collapse: collapse;">
        <tr>
          <td align="center" style="padding: 20px 24px 8px 24px;">
            <p style="margin: 0 0 6px 0; color: ${MUTED}; font-family: ${FONT}; font-size: 12px; line-height: 19px;">
              ${escapeHtml(footer)}
            </p>
            <p style="margin: 0; color: ${MUTED}; font-family: ${FONT}; font-size: 12px; line-height: 19px;">
              <a href="${escapeHtml(base)}" style="color: ${MUTED};">corteqs.net</a>
              <span style="color: ${BORDER};"> &nbsp;·&nbsp; </span>
              <a href="${escapeHtml(privacyUrl)}" style="color: ${MUTED};">Gizlilik politikası</a>
            </p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>`;

  const body = [
    greeting,
    "",
    progressLine,
    "",
    intro,
    ...missing.map((item) => `- ${item}`),
    "",
    `Profilini tamamla: ${profileUrl}`,
    "",
    footer,
    `Gizlilik politikası: ${privacyUrl}`,
  ].join("\n");

  return { subject, html, text: body };
}
