import { escapeHtml } from "./html.ts";

export type RelocationToolReportPayload = {
  result_id?: unknown;
  tool_slug?: unknown;
  tool_title?: unknown;
  total_score?: unknown;
  score_bucket?: unknown;
  location_country?: unknown;
  location_city?: unknown;
};

export type BuiltRelocationToolReportEmail = {
  subject: string;
  html: string;
  text: string;
};

const DEFAULT_SITE_URL = "https://corteqs.net";

function asText(value: unknown, fallback = "-"): string {
  return typeof value === "string" && value.trim() !== "" ? value.trim() : fallback;
}

function scoreText(value: unknown): string {
  return typeof value === "number" && Number.isFinite(value) ? String(value) : "-";
}

export function buildRelocationToolReportEmail(
  payload: RelocationToolReportPayload,
  siteUrl?: string | null,
): BuiltRelocationToolReportEmail {
  const resultId = asText(payload?.result_id, "");
  const toolSlug = asText(payload?.tool_slug, "");
  const toolTitle = asText(payload?.tool_title, "Taşınma aracı");
  const country = asText(payload?.location_country);
  const city = asText(payload?.location_city);
  const score = scoreText(payload?.total_score);
  const bucket = asText(payload?.score_bucket);
  const base = asText(siteUrl, DEFAULT_SITE_URL).replace(/\/+$/, "") || DEFAULT_SITE_URL;
  const path = toolSlug && resultId
    ? `/tools/${encodeURIComponent(toolSlug)}/result/${encodeURIComponent(resultId)}`
    : "/tools";
  const link = `${base}${path}`;

  const html = `
    <h2 style="margin:0 0 12px 0;">${escapeHtml(toolTitle)} raporun hazır</h2>
    <p style="margin:0 0 16px 0;">Bu rapor, sonuç oluşturulduğu andaki profil konumunu kullanır.</p>
    <table cellpadding="8" cellspacing="0" style="border-collapse:collapse;">
      <tr><td style="border:1px solid #d4d4d8;"><strong>Konum</strong></td><td style="border:1px solid #d4d4d8;">${escapeHtml(city)}, ${escapeHtml(country)}</td></tr>
      <tr><td style="border:1px solid #d4d4d8;"><strong>Skor</strong></td><td style="border:1px solid #d4d4d8;">${escapeHtml(score)}</td></tr>
      <tr><td style="border:1px solid #d4d4d8;"><strong>Sonuç bandı</strong></td><td style="border:1px solid #d4d4d8;">${escapeHtml(bucket)}</td></tr>
    </table>
    <p style="margin:16px 0 0 0;"><a href="${escapeHtml(link)}">Raporu CorteQS'te aç</a></p>
    <p style="color:#71717a;font-size:12px;margin-top:16px;">Bu e-postayı ilgili sonuç ekranından sen istedin.</p>`;

  const text = [
    `${toolTitle} raporun hazır`,
    "",
    `Konum: ${city}, ${country}`,
    `Skor: ${score}`,
    `Sonuç bandı: ${bucket}`,
    "",
    link,
    "",
    "Bu e-postayı ilgili sonuç ekranından sen istedin.",
  ].join("\n");

  return { subject: `CorteQS araç raporu: ${toolTitle}`, html, text };
}

