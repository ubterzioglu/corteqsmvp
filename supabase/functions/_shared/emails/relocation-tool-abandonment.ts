import { escapeHtml } from "./html.ts";

export type RelocationToolAbandonmentPayload = {
  session_id?: unknown;
  tool_slug?: unknown;
  tool_title?: unknown;
  answered_count?: unknown;
  question_count?: unknown;
};

type BuiltEmail = { subject: string; html: string; text: string };
const DEFAULT_SITE_URL = "https://corteqs.net";

function text(value: unknown, fallback = ""): string {
  return typeof value === "string" && value.trim() !== "" ? value.trim() : fallback;
}

function count(value: unknown): number | null {
  return typeof value === "number" && Number.isInteger(value) && value >= 0 ? value : null;
}

export function buildRelocationToolAbandonmentEmail(
  payload: RelocationToolAbandonmentPayload,
  siteUrl?: string | null,
): BuiltEmail {
  const sessionId = text(payload?.session_id);
  const toolSlug = text(payload?.tool_slug);
  const toolTitle = text(payload?.tool_title, "Taşınma aracı");
  const answeredCount = count(payload?.answered_count);
  const questionCount = count(payload?.question_count);
  const base = text(siteUrl, DEFAULT_SITE_URL).replace(/\/+$/, "") || DEFAULT_SITE_URL;
  const toolPath = toolSlug && sessionId
    ? `/tools/${encodeURIComponent(toolSlug)}/session/${encodeURIComponent(sessionId)}`
    : "/tools";
  const continueUrl = `${base}${toolPath}`;
  const preferencesUrl = `${base}/settings/notifications`;
  const progress = answeredCount !== null && questionCount !== null
    ? `${answeredCount}/${questionCount} soru`
    : "Yarım kalan ilerleme";

  const html = `
    <h2 style="margin:0 0 12px 0;">${escapeHtml(toolTitle)} seni bekliyor</h2>
    <p style="margin:0 0 12px 0;">Kaydettiğin ${escapeHtml(progress)} ile kaldığın yerden devam edebilirsin.</p>
    <p style="margin:16px 0;"><a href="${escapeHtml(continueUrl)}">Araca geri dön</a></p>
    <p style="color:#71717a;font-size:12px;margin-top:16px;">
      Bu tür e-postaları istemiyorsan <a href="${escapeHtml(preferencesUrl)}">bildirim tercihinden kapat</a>.
    </p>`;

  const body = [
    `${toolTitle} seni bekliyor`,
    "",
    `İlerleme: ${progress}`,
    continueUrl,
    "",
    `Araç hatırlatmalarını kapat: ${preferencesUrl}`,
  ].join("\n");

  return { subject: `CorteQS: ${toolTitle} aracına devam et`, html, text: body };
}

