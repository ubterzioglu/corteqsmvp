import type { MetaReplyPayload } from "./whatsapp-reply.ts";

export const DEFAULT_GRAPH_VERSION = "v26.0";

/** AUTHENTICATION şablonu (kod gövde + "Copy code" butonu); bkz. phone-otp-hook.ts. */
export type OtpTemplatePayload = {
  messaging_product: "whatsapp";
  recipient_type: "individual";
  to: string;
  type: "template";
  template: {
    name: string;
    language: { code: string };
    components: Array<
      | { type: "body"; parameters: Array<{ type: "text"; text: string }> }
      | { type: "button"; sub_type: "url"; index: "0"; parameters: Array<{ type: "text"; text: string }> }
    >;
  };
};

export interface GraphSendConfig {
  accessToken: string;
  phoneNumberId: string;
  graphVersion: string;
}

export function resolveGraphVersion(candidate: string | null | undefined): string {
  if (typeof candidate === "string" && /^v\d+\.\d+$/.test(candidate)) return candidate;
  return DEFAULT_GRAPH_VERSION;
}

export function buildGraphMessagesUrl(config: GraphSendConfig): string {
  return `https://graph.facebook.com/${config.graphVersion}/${encodeURIComponent(config.phoneNumberId)}/messages`;
}

export async function sendGraphMessage(
  config: GraphSendConfig,
  payload: MetaReplyPayload | OtpTemplatePayload,
  fetchImpl: typeof fetch = fetch,
): Promise<string> {
  const response = await fetchImpl(buildGraphMessagesUrl(config), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  const responseBody: unknown = await response.json().catch(() => null);
  if (!response.ok || typeof responseBody !== "object" || responseBody === null) {
    throw new Error(`meta_http_${response.status}`);
  }
  const messages = (responseBody as { messages?: unknown }).messages;
  const first = Array.isArray(messages) ? messages[0] : null;
  const providerMessageId = typeof first === "object" && first !== null && "id" in first
    ? (first as { id?: unknown }).id
    : null;
  if (typeof providerMessageId !== "string" || !providerMessageId.startsWith("wamid.")) {
    throw new Error("meta_response_invalid");
  }
  return providerMessageId;
}
