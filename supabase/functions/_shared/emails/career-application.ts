// Yeni kariyer başvurusu bildirimi (KR09) — abone olan admin/moderator'lara gider.
//
// Tetikleyici: `/kariyer` formu `submit_career_application` RPC'sini çağırır;
// `career_applications` üzerindeki trigger kuyruğa satır yazar ve
// send-notification-emails bu şablonla ANLIK mail atar (admin_update gibi 18:00
// özetine girmez — revision_request ile aynı karar).
//
// Bağımlılıksızdır — bkz. ./html.ts başlığı. Saf fonksiyondur: ağ, ortam değişkeni
// veya tarih üretimi yoktur, testi belirlenimcidir.
//
// ⚠️ **CV/ön yazı/sunum DOSYALARI maile EKLENMEZ ve bağlantıları konmaz.** Kova
// private'tır ve imzalı bağlantı süreli üretilir; maile gömülen bir bağlantı
// mail kutusunda süresiz kalır ve iletilen her kopyada başvuranın belgesine
// erişim açar. Mail yalnız panele yönlendirir.

import { escapeHtml } from "./html.ts";

/** notification_email_outbox.payload içeriği (trigger yazar). */
export type CareerApplicationPayload = {
  application_id?: unknown;
  full_name?: unknown;
  email?: unknown;
  position_id?: unknown;
  model?: unknown;
  country?: unknown;
  city?: unknown;
  created_at?: unknown;
};

export type BuiltCareerApplicationEmail = {
  subject: string;
  html: string;
  text: string;
};

const MUTED = "#71717a";
const BORDER = "#d4d4d8";

const DEFAULT_SITE_URL = "https://corteqs.net";
const ADMIN_PATH = "/admin/kadro/basvurular";

const FOOTNOTE = "Bu bildirimi admin panelindeki Bildirim Ayarları sayfasından kapatabilirsin.";

/**
 * Katılım modeli etiketleri `src/lib/careers/careers-schemas.ts` ile AYNI olmalıdır.
 * Edge Function deploy'u yalnız `supabase/functions/` klasörünü yüklediği için
 * `src/` altından import edilemez; değerler burada tekrarlanır (revision-request
 * şablonundaki `STATUS_LABELS` deseni). Kayma olursa mail ham değeri gösterir —
 * veri kaybı olmaz.
 */
const MODEL_LABELS: Record<string, string> = {
  "kurucu-ekip": "Kurucu Ekip Modeli",
  "yatirimci-ortak": "Yatırımcı-Ortak Modeli",
  staj: "Staj programı",
  gorusmede: "Görüşmede konuşalım",
};

function asText(value: unknown): string {
  return typeof value === "string" && value.trim() !== "" ? value.trim() : "";
}

function row(label: string, value: string): string {
  return `<tr><td style="padding:8px;border:1px solid ${BORDER};"><strong>${escapeHtml(label)}</strong></td><td style="padding:8px;border:1px solid ${BORDER};">${escapeHtml(value)}</td></tr>`;
}

export function buildCareerApplicationEmail(
  payload: CareerApplicationPayload,
  siteUrl?: string | null,
): BuiltCareerApplicationEmail {
  const data = payload ?? {};
  const name = asText(data.full_name) || "İsimsiz aday";
  const position = asText(data.position_id) || "-";
  const modelRaw = asText(data.model);
  const model = MODEL_LABELS[modelRaw] ?? (modelRaw || "-");
  const email = asText(data.email) || "-";
  const country = asText(data.country) || "-";
  const city = asText(data.city);
  const location = city ? `${country} / ${city}` : country;

  const base = asText(siteUrl).replace(/\/+$/, "") || DEFAULT_SITE_URL;
  const link = `${base}${ADMIN_PATH}`;

  const html = `
      <h2 style="margin:0 0 12px 0;">Yeni kariyer başvurusu: ${escapeHtml(name)}</h2>
      <table cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
        ${row("Pozisyon", position)}
        ${row("Katılım modeli", model)}
        ${row("E-posta", email)}
        ${row("Konum", location)}
      </table>
      <p style="margin:16px 0 0 0;">
        <a href="${escapeHtml(link)}">Başvuruyu panelde aç</a>
      </p>
      <p style="color:${MUTED};font-size:12px;margin-top:16px;">
        CV ve diğer belgeler güvenlik gereği maile eklenmez; panelden süreli bağlantıyla açılır.
      </p>
      <p style="color:${MUTED};font-size:12px;margin-top:8px;">${FOOTNOTE}</p>`;

  const text = [
    `Yeni kariyer başvurusu: ${name}`,
    "",
    `Pozisyon: ${position}`,
    `Katılım modeli: ${model}`,
    `E-posta: ${email}`,
    `Konum: ${location}`,
    "",
    link,
    "",
    "CV ve diğer belgeler güvenlik gereği maile eklenmez; panelden süreli bağlantıyla açılır.",
    FOOTNOTE,
  ].join("\n");

  return {
    subject: `CorteQS yeni kariyer başvurusu: ${name}`,
    html,
    text,
  };
}
