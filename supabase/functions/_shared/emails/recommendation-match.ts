// Tavsiye eşleşme bildirimi — EŞLEŞEN PROFESYONELE gider (transactional, alıcı
// payload.email; admin aboneliğine bakmaz).
//
// Tetikleyici: create_recommendation_request_v1 (mig 20261004110000) talep
// oluşunca M18 skoru >0 olan en iyi 5 profesyonele `recommendation_match`
// outbox satırı yazar; send-notification-emails bu şablonla ANLIK mail atar.
//
// 🔴 Mail'de TALEP SAHİBİNİN İLETİŞİMİ YOKTUR (payload'a hiç konmaz — sunucu
// tarafında kilitli). İletişim, Pro kilidinin arkasındadır (ProLockedInboxCard →
// feature_interest 'pro.inbox'). Mail yalnız talebin KİMLİĞİNİ taşır: başlık,
// şehir/ülke ve /tavsiye/:id bağlantısı.
//
// Bağımlılıksızdır — bkz. ./html.ts başlığı. Saf fonksiyondur: ağ, ortam
// değişkeni veya tarih üretimi yoktur, testi belirlenimcidir.
//
// E-posta HTML kuralları (bkz. member-welcome.ts başlığı): stiller inline,
// renkler hex, metin sürümü her zaman dolu.

import { escapeHtml } from "./html.ts";

/** notification_email_outbox.payload içeriği (create_recommendation_request_v1 yazar). */
export type RecommendationMatchPayload = {
  pro_name?: unknown;
  request_id?: unknown;
  request_title?: unknown;
  request_city?: unknown;
  request_country?: unknown;
};

export type BuiltRecommendationMatchEmail = {
  subject: string;
  html: string;
  text: string;
};

const MUTED = "#71717a";
const BORDER = "#d4d4d8";
const ACCENT = "#0d9488";
const DEFAULT_SITE_URL = "https://corteqs.net";

function asText(value: unknown): string {
  // 🔴 Kontrol karakterleri (CR/LF dahil) ÇIKARILIR: başlık talep sahibinden
  // gelir ve SMTP subject'ine girer — smtp.ts encodeHeaderValue ikinci savunma,
  // tek noktaya güvenilmez (inceleme CRITICAL: header injection).
  // eslint-disable-next-line no-control-regex -- kontrol karakterlerini SİLMEK işin kendisi (subject header injection kilidi)
  return typeof value === "string" ? value.replace(/[\u0000-\u001f\u007f]/g, " ").trim() : "";
}

/**
 * Tavsiye eşleşme mailini üretir.
 *
 * @param siteUrl Talep bağlantısının kökü; boş verilirse canlıya düşer.
 */
export function buildRecommendationMatchEmail(
  payload: RecommendationMatchPayload,
  siteUrl?: string | null,
): BuiltRecommendationMatchEmail {
  const base = asText(siteUrl).replace(/\/+$/, "") || DEFAULT_SITE_URL;
  const proName = asText(payload?.pro_name);
  const title = asText(payload?.request_title) || "Tavsiye talebi";
  const requestId = asText(payload?.request_id);
  const city = asText(payload?.request_city);
  const country = asText(payload?.request_country);
  const location = [city, country].filter(Boolean).join(", ");
  const requestUrl = requestId ? `${base}/tavsiye/${encodeURIComponent(requestId)}` : `${base}/tavsiye`;

  const greeting = proName ? `Merhaba ${proName},` : "Merhaba,";

  const subject = `Sana uyan bir tavsiye talebi: ${title}`;

  const html = `
    <div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;color:#18181b;">
      <h2 style="font-size:18px;margin:0 0 12px;">Sana uyan bir tavsiye talebi var</h2>
      <p style="font-size:14px;line-height:1.6;margin:0 0 12px;">${escapeHtml(greeting)}</p>
      <p style="font-size:14px;line-height:1.6;margin:0 0 16px;">
        Uzmanlık alanın ve konumunla eşleşen yeni bir tavsiye talebi yayınlandı:
      </p>
      <table cellpadding="8" cellspacing="0" border="1" style="border-collapse:collapse;border-color:${BORDER};width:100%;font-size:14px;">
        <tr>
          <td style="border:1px solid ${BORDER};"><strong>Talep</strong></td>
          <td style="border:1px solid ${BORDER};">${escapeHtml(title)}</td>
        </tr>
        ${location ? `<tr>
          <td style="border:1px solid ${BORDER};"><strong>Konum</strong></td>
          <td style="border:1px solid ${BORDER};">${escapeHtml(location)}</td>
        </tr>` : ""}
      </table>
      <p style="margin:20px 0;">
        <a href="${escapeHtml(requestUrl)}"
           style="display:inline-block;background:${ACCENT};color:#ffffff;text-decoration:none;padding:12px 20px;border-radius:8px;font-size:14px;font-weight:bold;">
          Talebi gör ve yanıtla
        </a>
      </p>
      <p style="font-size:13px;line-height:1.6;color:${MUTED};margin:16px 0 0;">
        Yanıtın talebin sayfasında görünür. Talep sahibine doğrudan iletişim
        (iletişim bilgisi görüntüleme) ileride Pro özellik olarak açılacak —
        sayfada ilgini kaydedebilirsin.
      </p>
      <p style="font-size:12px;color:${MUTED};margin-top:16px;">
        Bu bildirim sana uzmanlık alanın ve konumun eşleştiği için gönderildi.
      </p>
    </div>
  `;

  const text = [
    greeting,
    "",
    "Sana uyan yeni bir tavsiye talebi yayınlandı:",
    `Talep: ${title}`,
    location ? `Konum: ${location}` : null,
    "",
    `Talebi gör ve yanıtla: ${requestUrl}`,
    "",
    "Talep sahibine doğrudan iletişim ileride Pro özellik olarak açılacak.",
  ]
    // F12: YALNIZ koşullu satır null ile düşer; "" AYRAÇLARI korunur — eski
    // global filter(line !== "") paragraf boşluklarını da siliyordu ve text
    // sürümü tek blok çıkıyordu (career-application deseni: ayraca dokunma).
    .filter((line): line is string => line !== null)
    .join("\n");

  return { subject, html, text };
}
