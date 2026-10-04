// Haftalık şehir özeti — ÜYENİN KENDİSİNE gider (transactional; alıcı
// payload.email — ENQUEUE ANINDA SQL'de auth.users'tan çözülür, G23 deseni,
// mig 20261004180000. M27 ölçümü: edge'in auth.admin API'si sb_secret
// anahtarıyla 401 veriyor; getUser çözümü SQL'e taşındı). Şablon email'i
// ÇİZMEZ — yalnız gönderim alıcısı olarak kullanılır.
//
// Tetikleyici: pg_cron 'weekly-city-digest' (pazartesi 05:00 UTC) →
// enqueue_weekly_city_digest() (mig 20261004130000) kullanıcı başına TEK satır
// yazar (dedupe: user_id + ISO hafta; İÇERİĞİ OLMAYANA SATIR YOK — G23 dersi).
// Gönderimi notification-email-drain (*/15) bu şablonla yapar. Kill switch:
// email.weekly_city_digest.enabled (M24'te KAPALI doğdu; M27 kanıtından sonra
// İNSAN kararıyla açılır).
//
// 🔴 Mail YALNIZ başlık + bağlantı taşır (herkese açık içerik kimliği). İletişim
// bilgisi ÇİZİLMEZ — events/recommendations satırlarında yalnız id+title vardır
// (M25 payload kuralı); şablon bilinen alanlar dışını çizmez.
//
// Bağımlılıksızdır — bkz. ./html.ts başlığı. Saf fonksiyondur: ağ, ortam
// değişkeni veya tarih üretimi yoktur, testi belirlenimcidir.
//
// E-posta HTML kuralları (bkz. member-welcome.ts başlığı): stiller inline,
// renkler hex, metin sürümü her zaman dolu.

import { escapeHtml } from "./html.ts";

/** notification_email_outbox.payload içeriği (enqueue_weekly_city_digest yazar). */
export type WeeklyCityDigestPayload = {
  /** M27: alıcı adresi (SQL'de çözülür) — şablon bunu ÇİZMEZ, sızıntı testi kilitler. */
  email?: unknown;
  user_id?: unknown;
  week?: unknown;
  cities?: unknown;
  events?: unknown;
  recommendations?: unknown;
  unmatched_cities?: unknown;
};

export type BuiltWeeklyCityDigestEmail = {
  subject: string;
  html: string;
  text: string;
};

const MUTED = "#71717a";
const BORDER = "#d4d4d8";
const ACCENT = "#0d9488";
const DEFAULT_SITE_URL = "https://corteqs.net";

function asText(value: unknown): string {
  return typeof value === "string" && value.trim() !== "" ? value.trim() : "";
}

function asList(value: unknown): Array<Record<string, unknown>> {
  return Array.isArray(value) ? (value.filter((v) => v && typeof v === "object") as Array<Record<string, unknown>>) : [];
}

function asStringList(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === "string" && v.trim() !== "") : [];
}

/** [{id,title}] → başlık + bağlantı listesi (HTML). Bilinen alanlar DIŞI çizilmez. */
function itemRows(
  items: Array<Record<string, unknown>>,
  pathPrefix: string,
  emptyLabel: string,
): string {
  if (items.length === 0) {
    return `<p style="font-size:13px;color:${MUTED};margin:4px 0 0;">${escapeHtml(emptyLabel)}</p>`;
  }
  const rows = items
    .map((item) => {
      const title = asText(item.title) || "Başlıksız";
      const id = asText(item.id);
      const url = id ? `${pathPrefix}/${encodeURIComponent(id)}` : null;
      const label = url
        ? `<a href="${escapeHtml(url)}" style="color:${ACCENT};text-decoration:none;font-weight:bold;">${escapeHtml(title)}</a>`
        : escapeHtml(title);
      return `<li style="margin:0 0 6px;font-size:14px;">${label}</li>`;
    })
    .join("");
  return `<ul style="margin:4px 0 0;padding-left:20px;">${rows}</ul>`;
}

function itemLines(items: Array<Record<string, unknown>>, pathPrefix: string, base: string): string[] {
  return items.map((item) => {
    const title = asText(item.title) || "Başlıksız";
    const id = asText(item.id);
    return id ? `- ${title}: ${base}${pathPrefix}/${id}` : `- ${title}`;
  });
}

/**
 * Haftalık şehir özetini maile çevirir.
 *
 * @param siteUrl Bağlantı kökü; boş verilirse canlıya düşer.
 */
export function buildWeeklyCityDigestEmail(
  payload: WeeklyCityDigestPayload,
  siteUrl?: string | null,
): BuiltWeeklyCityDigestEmail {
  const base = asText(siteUrl).replace(/\/+$/, "") || DEFAULT_SITE_URL;
  const week = asText(payload?.week);
  const cities = asList(payload?.cities).map((c) => asText(c.city)).filter(Boolean);
  const events = asList(payload?.events);
  const recommendations = asList(payload?.recommendations);
  const unmatched = asStringList(payload?.unmatched_cities);

  const cityLabel = cities.length > 0 ? cities.join(", ") : "takip ettiğin şehirler";
  const totalNew = events.length + recommendations.length;
  const subject = `Haftalık şehir özeti${week ? ` (${week})` : ""}: ${cityLabel} — ${totalNew} yeni içerik`;

  const html = `
    <div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;color:#18181b;">
      <h2 style="font-size:18px;margin:0 0 12px;">Haftalık şehir özeti${week ? ` · ${escapeHtml(week)}` : ""}</h2>
      <p style="font-size:14px;line-height:1.6;margin:0 0 16px;">
        Takip ettiğin şehirlerde (${escapeHtml(cityLabel)}) bu hafta
        <strong>${totalNew}</strong> yeni içerik var:
      </p>

      <h3 style="font-size:15px;margin:16px 0 0;">Yeni etkinlikler (${events.length})</h3>
      ${itemRows(events, `${base}/events`, "Bu hafta yeni etkinlik yok.")}

      <h3 style="font-size:15px;margin:16px 0 0;">Yeni tavsiye talepleri (${recommendations.length})</h3>
      ${itemRows(recommendations, `${base}/tavsiye`, "Bu hafta yeni tavsiye talebi yok.")}

      ${unmatched.length > 0 ? `
      <p style="font-size:12px;color:${MUTED};margin-top:16px;">
        ${escapeHtml(unmatched.join(", "))} için bu hafta yeni içerik yok.
      </p>` : ""}

      <p style="margin:20px 0;">
        <a href="${escapeHtml(`${base}/settings/notifications`)}"
           style="display:inline-block;background:${ACCENT};color:#ffffff;text-decoration:none;padding:10px 18px;border-radius:8px;font-size:13px;font-weight:bold;">
          Takip ettiğin şehirleri yönet
        </a>
      </p>
      <p style="font-size:12px;color:${MUTED};margin-top:16px;">
        Bu özet yalnız takip ettiğin şehirlerde YENİ içerik olduğunda gönderilir
        (haftada en fazla bir kez). Takibi bırakırsan özet de durur.
      </p>
    </div>
  `;

  const text = [
    `Haftalık şehir özeti${week ? ` (${week})` : ""} — ${cityLabel}`,
    `Bu hafta ${totalNew} yeni içerik var.`,
    "",
    `Yeni etkinlikler (${events.length}):`,
    ...itemLines(events, "/events", base),
    "",
    `Yeni tavsiye talepleri (${recommendations.length}):`,
    ...itemLines(recommendations, "/tavsiye", base),
    unmatched.length > 0 ? `\n${unmatched.join(", ")} için bu hafta yeni içerik yok.` : "",
    "",
    `Takiplerini yönet: ${base}/settings/notifications`,
    "Bu özet yalnız takip ettiğin şehirlerde yeni içerik olduğunda gönderilir.",
  ]
    .filter((line) => line !== "")
    .join("\n");

  return { subject, html, text };
}
