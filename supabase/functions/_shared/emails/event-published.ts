// A15 · "Etkinliğiniz yayında" bildirimi — ETKİNLİK SAHİBİNE gider (transactional).
//
// Tetikleyici: trg_events_after_publish (mig 202610051000000) events.status='published'
// olunca enqueue_event_published_notification ile outbox'a yazar; send-notification-emails
// bu şablonla ANLIK mail atar.
//
// Mail'de etkinlik bilgisi: başlık, tarih, şehir/ülke ve /events/:id?share=1 bağlantısı.
// Paylaşım butonları mail'de YOK (SMTP HTML'de JS çalışmaz); yalnız bağlantı.
//
// Bağımlılıksızdır — bkz. ./html.ts başlığı. Saf fonksiyondur: ağ, ortam
// değişkeni veya tarih üretimi yoktur, testi belirlenimcidir.
//
// E-posta HTML kuralları (bkz. member-welcome.ts başlığı): stiller inline,
// renkler hex, metin sürümü her zaman dolu.

import { escapeHtml } from "./html.ts";

/** notification_email_outbox.payload içeriği (enqueue_event_published_notification yazar). */
export type EventPublishedPayload = {
  event_id?: unknown;
};

/** Edge function etkinlik detayını DB'den çeker, bu fonksiyona iletir. */
export type EventPublishedDetails = {
  title: string;
  event_date: string;
  city?: string | null;
  country?: string | null;
  description?: string | null;
};

export type BuiltEventPublishedEmail = {
  subject: string;
  html: string;
  text: string;
};

const MUTED = "#71717a";
const BORDER = "#d4d4d8";
const ACCENT = "#0d9488";
const DEFAULT_SITE_URL = "https://corteqs.net";

function asText(value: unknown): string {
  // Kontrol karakterleri (CR/LF dahil) ÇIKARILIR: başlık kullanıcıdan gelir ve
  // SMTP subject'ine girer — smtp.ts encodeHeaderValue ikinci savunma, tek noktaya
  // güvenilmez (inceleme CRITICAL: header injection).
  // eslint-disable-next-line no-control-regex -- kontrol karakterlerini SİLMEK işin kendisi
  return typeof value === "string" ? value.replace(/[\u0000-\u001f\u007f]/g, " ").trim() : "";
}

function formatEventDate(isoDate: string): string {
  try {
    const date = new Date(isoDate);
    return new Intl.DateTimeFormat("tr-TR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(date);
  } catch {
    return isoDate;
  }
}

/**
  * "Etkinliğiniz yayında" mailini üretir.
 *
 * @param payload Outbox payload (event_id içerir)
 * @param details Edge function tarafından DB'den çekilen etkinlik detayları
 * @param siteUrl Etkinlik bağlantısının kökü; boş verilirse canlıya düşer.
 */
export function buildEventPublishedEmail(
  payload: EventPublishedPayload,
  details: EventPublishedDetails,
  siteUrl?: string | null,
): BuiltEventPublishedEmail {
  const base = asText(siteUrl).replace(/\/+$/, "") || DEFAULT_SITE_URL;
  const eventId = asText(payload?.event_id);
  const title = asText(details.title) || "Etkinliğiniz";
  const eventDate = formatEventDate(details.event_date);
  const city = asText(details.city);
  const country = asText(details.country);
  const location = [city, country].filter(Boolean).join(", ");
  const description = asText(details.description);
  const eventUrl = eventId ? `${base}/events/${encodeURIComponent(eventId)}?share=1` : `${base}/events`;

  const subject = `Etkinliğiniz yayında: ${title}`;

  const html = `
    <div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;color:#18181b;">
      <h2 style="font-size:18px;margin:0 0 12px;">✨ Etkinliğiniz yayında!</h2>
      <p style="font-size:14px;line-height:1.6;margin:0 0 16px;">
        Etkinliğiniz başarıyla oluşturuldu ve artık listede görünüyor. Aşağıdaki butonlarla paylaşabilirsiniz:
      </p>
      <table cellpadding="8" cellspacing="0" border="1" style="border-collapse:collapse;border-color:${BORDER};width:100%;font-size:14px;">
        <tr>
          <td style="border:1px solid ${BORDER};"><strong>Etkinlik</strong></td>
          <td style="border:1px solid ${BORDER};">${escapeHtml(title)}</td>
        </tr>
        <tr>
          <td style="border:1px solid ${BORDER};"><strong>Tarih</strong></td>
          <td style="border:1px solid ${BORDER};">${escapeHtml(eventDate)}</td>
        </tr>
        ${location ? `
        <tr>
          <td style="border:1px solid ${BORDER};"><strong>Konum</strong></td>
          <td style="border:1px solid ${BORDER};">${escapeHtml(location)}</td>
        </tr>
        ` : ""}
        ${description ? `
        <tr>
          <td style="border:1px solid ${BORDER};"><strong>Açıklama</strong></td>
          <td style="border:1px solid ${BORDER};">${escapeHtml(description.slice(0, 200))}${description.length > 200 ? "…" : ""}</td>
        </tr>
        ` : ""}
      </table>
      <p style="font-size:14px;line-height:1.6;margin:16px 0 8px;">
        <a href="${eventUrl}" style="display:inline-block;background:${ACCENT};color:#ffffff;padding:10px 20px;text-decoration:none;border-radius:6px;font-weight:600;">
          Etkinliği Görüntüle ve Paylaş
        </a>
      </p>
      <p style="font-size:12px;color:${MUTED};margin:16px 0 0;">
        Bu e-posta CorteQS platformunda oluşturduğunuz etkinlik için gönderildi.
        Sorularınız için <a href="mailto:info@corteqs.net" style="color:${ACCENT};">info@corteqs.net</a> adresine yazabilirsiniz.
      </p>
    </div>
  `;

  const text = `Etkinliğiniz yayında!

Etkinlik: ${title}
Tarih: ${eventDate}${location ? `\nKonum: ${location}` : ""}${description ? `\n\n${description.slice(0, 200)}${description.length > 200 ? "…" : ""}` : ""}

Etkinliği görüntüle ve paylaş: ${eventUrl}

---
Bu e-posta CorteQS platformunda oluşturduğunuz etkinlik için gönderildi.
Sorularınız için info@corteqs.net adresine yazabilirsiniz.`;

  return { subject, html, text };
}
