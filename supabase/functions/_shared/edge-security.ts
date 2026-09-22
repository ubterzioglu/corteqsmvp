/** Shared browser-origin policy for authenticated assistant Edge Functions. */
const ASSISTANT_ALLOWED_ORIGINS = new Set([
  "https://corteqs.net",
  "https://www.corteqs.net",
  "http://localhost:5173",
  "http://localhost:4173",
  "http://localhost:8080",
]);

export function isAssistantOriginAllowed(origin: string | null): boolean {
  return origin !== null && ASSISTANT_ALLOWED_ORIGINS.has(origin);
}

export function buildAssistantCorsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get("Origin");
  const headers: Record<string, string> = {
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    Vary: "Origin",
  };
  if (isAssistantOriginAllowed(origin)) headers["Access-Control-Allow-Origin"] = origin;
  return headers;
}

/** Reads JSON only after enforcing the byte ceiling on both declared and actual size. */
export async function readJsonWithLimit(req: Request, maxBytes: number): Promise<unknown> {
  const declared = Number.parseInt(req.headers.get("content-length") ?? "", 10);
  if (Number.isFinite(declared) && declared > maxBytes) throw new Error("PAYLOAD_TOO_LARGE");

  const text = await req.text();
  if (new TextEncoder().encode(text).length > maxBytes) throw new Error("PAYLOAD_TOO_LARGE");
  return JSON.parse(text);
}
