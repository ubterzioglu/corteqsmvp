// G23 · Dijital Gruplar bildirim şablonları (tasarım §9 — metinler BİREBİR).
//
// Tetikleyici: migration 20261002120000'deki trigger zinciri outbox'a yazar,
// send-notification-emails bu şablonla ANLIK gönderir (transactional — digest
// DEĞİL; revizyon/career deseni). Alıcı payload.email (üyenin KENDİSİ —
// admin aboneliklerinden bağımsız, member_welcome deseni).
//
// 🔴 KURAL 8: maile DAVET LİNKİ konmaz. {link} alanları SİTE sayfasıdır
// (`/addcom?group={slug}`) — davet linki yalnız girişli kullanıcıya RPC ile
// gider (G03b). Rozet görseli de sitedeki sahip panelinden indirilir.
//
// Bağımlılıksız ve saf (bkz. ./html.ts başlığı): ağ/env/tarih yok, test
// belirlenimci. Metinler `docs/dijital-gruplar/02_motor-tasarimi.md` §9
// tablosuna karşı sözleşme testiyle kilitli.

import { escapeHtml } from "./html.ts";

export type GroupNotificationEventType =
  | "group_submission_received"
  | "group_published"
  | "group_rejected"
  | "group_ownership_verified"
  | "group_post_pending"
  | "group_link_dead"
  | "group_score_badge"
  | "group_strike_warning";

export type GroupNotificationPayload = {
  email?: unknown;
  group_name?: unknown;
  slug?: unknown;
  reason?: unknown;
  n?: unknown;
  score?: unknown;
};

export type BuiltGroupNotificationEmail = {
  subject: string;
  html: string;
  text: string;
};

const MUTED = "#71717a";
const DEFAULT_SITE_URL = "https://corteqs.net";

function asText(value: unknown): string {
  return typeof value === "string" && value.trim() !== "" ? value.trim() : "";
}

/** Tasarım §9 metinleri — cümleler birebir; {Grup}/{link}/{sebep}/{n} yerine konur. */
export function buildGroupNotificationEmail(
  eventType: GroupNotificationEventType,
  payload: GroupNotificationPayload,
  siteUrl?: string | null,
): BuiltGroupNotificationEmail {
  const data = payload ?? {};
  const group = asText(data.group_name) || "Grubun";
  const base = asText(siteUrl).replace(/\/+$/, "") || DEFAULT_SITE_URL;
  const slug = asText(data.slug);
  const pageLink = slug ? `${base}/addcom?group=${encodeURIComponent(slug)}` : `${base}/addcom`;
  const reason = asText(data.reason) || "belirtilmedi";
  const n = typeof data.n === "number" ? data.n : Number(asText(data.n) || "0");

  let subject: string;
  let body: string;

  switch (eventType) {
    case "group_submission_received":
      subject = "Grubun alındı";
      body = "Grubun alındı. İnceleme genelde 24 saat sürer.";
      break;
    case "group_published":
      subject = `${group} yayında`;
      body = `${group} yayında. Sayfanı paylaşmak için hazır: ${pageLink}`;
      break;
    case "group_rejected":
      subject = `${group} yayınlanamadı`;
      body = `${group} yayınlanamadı. Sebep: ${reason}. Grup Sözü: ${base}/addcom`;
      break;
    case "group_ownership_verified":
      subject = "Sahiplik doğrulandı";
      body = `Artık ${group} sayfasının sahibisin. Kodu grup adından silebilirsin.`;
      break;
    case "group_post_pending":
      subject = `${group}: onay bekleyen ${n} gönderi`;
      body = `${group} sayfasında onay bekleyen ${n} gönderi var. 48 saat içinde bakmazsan ekibimiz devralır.`;
      break;
    case "group_link_dead":
      subject = `${group}: davet linkin çalışmıyor`;
      body = `${group} davet linkin çalışmıyor, grup geçici olarak gizlendi. Yeni linki ekle: ${pageLink}`;
      break;
    case "group_score_badge":
      subject = `${group} Onaylı Grup oldu`;
      body = `Tebrikler, ${group} Onaylı Grup oldu. Rozet görselin hazır: ${pageLink}`;
      break;
    case "group_strike_warning":
      subject = `${group}: ihlal kaydı`;
      body = `${group} için bir ihlal kaydı oluştu: ${reason}. İkinci ihlalde grup 30 gün askıya alınır.`;
      break;
    default: {
      // Bilinmeyen tip: ham metin uydurulmaz, nötr düşer (sessiz çökme yok).
      subject = "Grup bildirimi";
      body = `${group} için bir güncelleme var: ${pageLink}`;
    }
  }

  const html = `
      <h2 style="margin:0 0 12px 0;">${escapeHtml(subject)}</h2>
      <p style="margin:0 0 16px 0;">${escapeHtml(body).replace(
        escapeHtml(pageLink),
        `<a href="${escapeHtml(pageLink)}">${escapeHtml(pageLink)}</a>`,
      )}</p>
      <p style="margin:16px 0 0 0;">
        <a href="${escapeHtml(pageLink)}">Grup sayfasını aç</a>
      </p>
      <p style="color:${MUTED};font-size:12px;margin-top:16px;">
        Bu bildirim CorteQS Dijital Gruplar sisteminden gönderildi. Davet linkleri
        güvenlik gereği maile konmaz; grup sayfasında giriş yaptıktan sonra görünür.
      </p>`;

  const text = [
    subject,
    "",
    body,
    "",
    pageLink,
    "",
    "Bu bildirim CorteQS Dijital Gruplar sisteminden gönderildi. Davet linkleri güvenlik gereği maile konmaz; grup sayfasında giriş yaptıktan sonra görünür.",
  ].join("\n");

  return { subject: `CorteQS: ${subject}`, html, text };
}
