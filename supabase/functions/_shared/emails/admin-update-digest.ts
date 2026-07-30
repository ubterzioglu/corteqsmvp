// Admin güncelleme bildirimi — tekil ve günlük özet (digest) şablonu.
//
// 2026-07-30 kararı: admin_update kayıtları commit anında tek tek maillenmek yerine
// 18:00 (Europe/Berlin) özetinde bekletilir ve aynı claim'de gelen TÜM kayıtlar tek
// mailde birleşir (mig 20260730230000 + send-notification-emails). Bu dosya o mailin
// konu/HTML/metin sürümlerini üretir: 1 kayıt → tekil başlıklı konu (eski davranışla
// aynı), 2+ kayıt → "günlük özet: N kayıt" konusu ve bölümlenmiş gövde.
//
// Bağımlılıksızdır — bkz. ./html.ts başlığı (Edge Function + testler aynı dosyayı okur).

import { escapeHtml } from "./html.ts";

/** notification_email_outbox.payload içeriği (sync-admin-updates.mjs yazar). */
export type AdminUpdatePayload = {
  id?: unknown;
  date?: unknown;
  title?: unknown;
  items?: unknown;
};

export type BuiltAdminUpdateEmail = {
  subject: string;
  html: string;
  text: string;
};

const MUTED = "#71717a";

const FOOTNOTE =
  "Bu bildirimi admin panelindeki Bildirim Ayarları sayfasından kapatabilirsin.";

type NormalizedEntry = {
  title: string;
  date: string;
  items: string[];
};

/** Bozuk/eksik payload alanlarını güvenli varsayılanlara indirger. */
function normalizeEntry(payload: AdminUpdatePayload): NormalizedEntry {
  return {
    title: typeof payload?.title === "string" && payload.title !== "" ? payload.title : "Yeni güncelleme",
    date: typeof payload?.date === "string" ? payload.date : "",
    items: Array.isArray(payload?.items) ? payload.items.map((item) => String(item)) : [],
  };
}

function buildEntryHtml(entry: NormalizedEntry): string {
  const itemsHtml = entry.items.map((item) => `<li>${escapeHtml(item)}</li>`).join("");
  return `
      <h2 style="margin: 0 0 4px 0;">${escapeHtml(entry.title)}</h2>
      <p style="margin: 0 0 8px 0;"><strong>${escapeHtml(entry.date)}</strong></p>
      <ul style="margin: 0 0 8px 0;">${itemsHtml}</ul>`;
}

function buildEntryText(entry: NormalizedEntry): string {
  return [
    entry.title,
    entry.date,
    ...entry.items.map((item) => `- ${item}`),
  ]
    .filter((line) => line !== "")
    .join("\n");
}

/**
 * Kuyruktan gelen 1..N admin_update payload'ını tek maile çevirir.
 * Saf fonksiyondur — ağ, ortam değişkeni veya tarih üretimi yoktur, testi belirlenimcidir.
 * Sıra çağıranın verdiği sıradır (claim created_at artan sırada döndürür).
 */
export function buildAdminUpdateEmail(payloads: AdminUpdatePayload[]): BuiltAdminUpdateEmail {
  const entries = (Array.isArray(payloads) ? payloads : []).map(normalizeEntry);

  if (entries.length <= 1) {
    const entry = entries[0] ?? normalizeEntry({});
    return {
      subject: `CorteQS admin güncellemesi: ${entry.title}`,
      html: `${buildEntryHtml(entry)}
      <p style="color:${MUTED};font-size:12px;margin-top:16px;">${FOOTNOTE}</p>`,
      text: `${buildEntryText(entry)}\n\n${FOOTNOTE}`,
    };
  }

  const sectionsHtml = entries
    .map(buildEntryHtml)
    .join(`\n      <hr style="border: 0; border-top: 1px solid #e4e4e7; margin: 16px 0;">`);

  const sectionsText = entries.map(buildEntryText).join("\n\n---\n\n");

  return {
    subject: `CorteQS admin güncellemesi — günlük özet: ${entries.length} kayıt`,
    html: `
      <p style="margin: 0 0 16px 0;">Bugünün ${entries.length} güncellemesi tek mailde birleştirildi:</p>
      ${sectionsHtml}
      <p style="color:${MUTED};font-size:12px;margin-top:16px;">${FOOTNOTE}</p>`,
    text: `Bugünün ${entries.length} güncellemesi tek mailde birleştirildi:\n\n${sectionsText}\n\n${FOOTNOTE}`,
  };
}
