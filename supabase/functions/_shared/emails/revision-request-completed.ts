// Revizyon isteği tamamlandı bildirimi — abone olan admin/moderator'lara gider.
//
// Tetikleyici: revision_requests.status 'yapildi'ye GEÇTİĞİNDE
// enqueue_revision_completion_notification() kuyruğa satır yazar
// (mig 20260927190000) ve send-notification-emails bu şablonla ANLIK mail atar.
// Açılış bildirimiyle (revision-request.ts) aynı abone listesini ve aynı ayar
// anahtarını (email.revision_request.enabled) paylaşır — ayrı bir düğme YOKTUR.
//
// Bağımlılıksızdır — bkz. ./html.ts başlığı. Saf fonksiyondur: ağ, ortam değişkeni
// veya tarih üretimi yoktur, testi belirlenimcidir.
//
// E-posta HTML kuralları (bkz. member-welcome.ts başlığı): stiller inline, renkler
// hex, metin sürümü her zaman dolu.

import { escapeHtml } from "./html.ts";

/** notification_email_outbox.payload içeriği (enqueue_revision_completion_notification yazar). */
export type RevisionCompletedPayload = {
  request_id?: unknown;
  revision_number?: unknown;
  title?: unknown;
  detail?: unknown;
  priority?: unknown;
  area_label?: unknown;
  completed_by?: unknown;
  completed_at?: unknown;
};

export type BuiltRevisionCompletedEmail = {
  subject: string;
  html: string;
  text: string;
};

const MUTED = "#71717a";
const BORDER = "#d4d4d8";
const ACCENT = "#0d9488";

const DEFAULT_SITE_URL = "https://corteqs.net";
const ADMIN_PATH = "/admin/revision-requests";

const FOOTNOTE =
  "Bu bildirimi admin panelindeki Bildirim Ayarları sayfasından kapatabilirsin.";

function asText(value: unknown): string {
  return typeof value === "string" && value.trim() !== "" ? value.trim() : "";
}

/**
 * "#REV-042" biçimi. Numara yoksa boş döner ve başlıkta hiç görünmez —
 * eski kayıtlarda (numara atanmadan önce kuyruğa girmiş satır) mail yine çalışır.
 */
export function formatRevisionNumber(value: unknown): string {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n) || n <= 0) return "";
  return `#REV-${String(Math.trunc(n)).padStart(3, "0")}`;
}

type NormalizedCompleted = {
  numara: string;
  title: string;
  detail: string;
  priority: string;
  areaLabel: string;
  completedBy: string;
};

function normalize(payload: RevisionCompletedPayload): NormalizedCompleted {
  const priority = payload?.priority;

  return {
    numara: formatRevisionNumber(payload?.revision_number),
    title: asText(payload?.title) || "Revizyon isteği",
    detail: asText(payload?.detail),
    priority: typeof priority === "number" && Number.isFinite(priority) ? String(priority) : "-",
    areaLabel: asText(payload?.area_label) || "-",
    completedBy: asText(payload?.completed_by) || "-",
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
 * Tamamlanan bir revizyon isteğini maile çevirir.
 *
 * @param siteUrl Panel bağlantısının kökü; boş verilirse canlıya düşer.
 */
export function buildRevisionCompletedEmail(
  payload: RevisionCompletedPayload,
  siteUrl?: string | null,
): BuiltRevisionCompletedEmail {
  const entry = normalize(payload ?? {});
  const base = asText(siteUrl).replace(/\/+$/, "") || DEFAULT_SITE_URL;
  const link = `${base}${ADMIN_PATH}`;

  const basligiOlustur = (ayrac: string) =>
    entry.numara ? `${entry.numara}${ayrac}${entry.title}` : entry.title;

  const detailBlock = entry.detail
    ? `<p style="margin:0 0 16px 0;">${detailHtml(entry.detail)}</p>`
    : `<p style="margin:0 0 16px 0;color:${MUTED};">Detay girilmemiş.</p>`;

  const html = `
      <h2 style="margin:0 0 12px 0;">Revizyon tamamlandı: ${escapeHtml(basligiOlustur(" "))}</h2>
      <p style="margin:0 0 16px 0;color:${ACCENT};font-weight:bold;">Durum: Yapıldı</p>
      ${detailBlock}
      <table cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
        ${entry.numara ? row("Revizyon No", entry.numara) : ""}
        ${row("Öncelik", entry.priority)}
        ${row("Alan", entry.areaLabel)}
        ${row("Tamamlayan", entry.completedBy)}
      </table>
      <p style="margin:16px 0 0 0;">
        <a href="${escapeHtml(link)}">Revizyon İstekleri sayfasında aç</a>
      </p>
      <p style="color:${MUTED};font-size:12px;margin-top:16px;">${FOOTNOTE}</p>`;

  const text = [
    `Revizyon tamamlandı: ${basligiOlustur(" ")}`,
    "",
    "Durum: Yapıldı",
    "",
    entry.detail || "Detay girilmemiş.",
    "",
    ...(entry.numara ? [`Revizyon No: ${entry.numara}`] : []),
    `Öncelik: ${entry.priority}`,
    `Alan: ${entry.areaLabel}`,
    `Tamamlayan: ${entry.completedBy}`,
    "",
    link,
    "",
    FOOTNOTE,
  ].join("\n");

  return {
    subject: `CorteQS revizyon tamamlandı: ${basligiOlustur(" ")}`,
    html,
    text,
  };
}
