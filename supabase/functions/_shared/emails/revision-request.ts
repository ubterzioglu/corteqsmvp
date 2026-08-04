// Yeni revizyon isteği bildirimi — abone olan admin/moderator'lara gider.
//
// Tetikleyici: /admin/revision-requests sayfasından yeni bir talep açıldığında
// revision_requests trigger'ı kuyruğa satır yazar (mig 20260804160000) ve
// send-notification-emails bu şablonla ANLIK mail atar (admin_update gibi 18:00
// özetine girmez — karar 2026-08-04).
//
// Bağımlılıksızdır — bkz. ./html.ts başlığı (Edge Function + önizleme scripti + testler
// aynı dosyayı okur). Saf fonksiyondur: ağ, ortam değişkeni veya tarih üretimi yoktur,
// testi belirlenimcidir.
//
// E-posta HTML kuralları (bkz. member-welcome.ts başlığı): stiller inline, renkler hex,
// metin sürümü her zaman dolu. Bu iç bildirim olduğu için yerleşim admin-update-digest.ts
// gibi sadedir — 600px'lik table iskeleti gerekmez.

import { escapeHtml } from "./html.ts";

/** notification_email_outbox.payload içeriği (enqueue_revision_request_notification yazar). */
export type RevisionRequestPayload = {
  request_id?: unknown;
  title?: unknown;
  detail?: unknown;
  status?: unknown;
  priority?: unknown;
  area_label?: unknown;
  author_email?: unknown;
  created_at?: unknown;
};

export type BuiltRevisionRequestEmail = {
  subject: string;
  html: string;
  text: string;
};

const MUTED = "#71717a";
const BORDER = "#d4d4d8";

const DEFAULT_SITE_URL = "https://corteqs.net";
const ADMIN_PATH = "/admin/revision-requests";

const FOOTNOTE =
  "Bu bildirimi admin panelindeki Bildirim Ayarları sayfasından kapatabilirsin.";

/**
 * Durum etiketleri src/lib/admin-shell/revision-requests.ts'teki REVISION_STATUS_LABELS ile
 * AYNI olmalıdır. Edge Function deploy'u yalnız supabase/functions/ klasörünü yüklediği için
 * src/ altından import edilemez; bu yüzden değerler burada tekrarlanır (SOCIAL_LINKS deseni).
 * Kayma olursa mail bilinmeyen durumu ham haliyle gösterir — veri kaybı olmaz.
 */
const STATUS_LABELS: Record<string, string> = {
  acik: "Açık",
  inceleniyor: "İnceleniyor",
  yapildi: "Yapıldı",
  iptal: "İptal",
};

type NormalizedRequest = {
  title: string;
  detail: string;
  status: string;
  priority: string;
  areaLabel: string;
  authorEmail: string;
};

function asText(value: unknown): string {
  return typeof value === "string" && value.trim() !== "" ? value.trim() : "";
}

/** Bozuk/eksik payload alanlarını güvenli varsayılanlara indirger. */
function normalize(payload: RevisionRequestPayload): NormalizedRequest {
  const status = asText(payload?.status);
  const priority = payload?.priority;

  return {
    title: asText(payload?.title) || "Yeni revizyon isteği",
    detail: asText(payload?.detail),
    status: STATUS_LABELS[status] ?? (status || "-"),
    priority: typeof priority === "number" && Number.isFinite(priority) ? String(priority) : "-",
    areaLabel: asText(payload?.area_label) || "-",
    authorEmail: asText(payload?.author_email) || "-",
  };
}

/** Serbest metindeki satır sonlarını korur; kaçırma ÖNCE yapılır, <br> sonra eklenir. */
function detailHtml(detail: string): string {
  return escapeHtml(detail).replace(/\r?\n/g, "<br>");
}

function row(label: string, value: string): string {
  return `<tr><td style="padding:8px;border:1px solid ${BORDER};"><strong>${escapeHtml(label)}</strong></td><td style="padding:8px;border:1px solid ${BORDER};">${escapeHtml(value)}</td></tr>`;
}

/**
 * Tek bir revizyon isteği payload'ını maile çevirir.
 *
 * @param siteUrl Panel bağlantısının kökü; boş verilirse canlıya düşer.
 */
export function buildRevisionRequestEmail(
  payload: RevisionRequestPayload,
  siteUrl?: string | null,
): BuiltRevisionRequestEmail {
  const entry = normalize(payload ?? {});
  const base = asText(siteUrl).replace(/\/+$/, "") || DEFAULT_SITE_URL;
  const link = `${base}${ADMIN_PATH}`;

  const detailBlock = entry.detail
    ? `<p style="margin:0 0 16px 0;">${detailHtml(entry.detail)}</p>`
    : `<p style="margin:0 0 16px 0;color:${MUTED};">Detay girilmemiş.</p>`;

  const html = `
      <h2 style="margin:0 0 12px 0;">Yeni revizyon isteği: ${escapeHtml(entry.title)}</h2>
      ${detailBlock}
      <table cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
        ${row("Öncelik", entry.priority)}
        ${row("Durum", entry.status)}
        ${row("Alan", entry.areaLabel)}
        ${row("Açan", entry.authorEmail)}
      </table>
      <p style="margin:16px 0 0 0;">
        <a href="${escapeHtml(link)}">Revizyon İstekleri sayfasında aç</a>
      </p>
      <p style="color:${MUTED};font-size:12px;margin-top:16px;">${FOOTNOTE}</p>`;

  const text = [
    `Yeni revizyon isteği: ${entry.title}`,
    "",
    entry.detail || "Detay girilmemiş.",
    "",
    `Öncelik: ${entry.priority}`,
    `Durum: ${entry.status}`,
    `Alan: ${entry.areaLabel}`,
    `Açan: ${entry.authorEmail}`,
    "",
    link,
    "",
    FOOTNOTE,
  ].join("\n");

  return {
    subject: `CorteQS yeni revizyon isteği: ${entry.title}`,
    html,
    text,
  };
}
