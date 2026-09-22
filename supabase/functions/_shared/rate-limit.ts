import { createClient } from "https://esm.sh/@supabase/supabase-js@2.108.2";

function getClientKey(req: Request): string {
  const forwardedFor = req.headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0]?.trim() || "unknown";
  return req.headers.get("cf-connecting-ip") ?? req.headers.get("x-real-ip") ?? "unknown";
}

/** Epoch comparison prevents equivalent timestamps from silently opening new windows. */
export async function enforceRateLimit(
  supabase: ReturnType<typeof createClient>, req: Request, scope: string, maxRequests: number, windowSeconds: number,
) {
  const clientKey = getClientKey(req);
  const windowMs = windowSeconds * 1000;
  const windowStartMs = Math.floor(Date.now() / windowMs) * windowMs;
  const windowStartedAt = new Date(windowStartMs).toISOString();
  const { data: existing, error: fetchError } = await supabase.from("edge_rate_limits").select("request_count, window_started_at").eq("scope", scope).eq("client_key", clientKey).maybeSingle();
  if (fetchError) throw fetchError;
  const existingWindowMs = existing?.window_started_at ? new Date(existing.window_started_at as string).getTime() : Number.NaN;
  if (!existing || !Number.isFinite(existingWindowMs) || existingWindowMs !== windowStartMs) {
    const { error } = await supabase.from("edge_rate_limits").upsert({ scope, client_key: clientKey, window_started_at: windowStartedAt, request_count: 1 }, { onConflict: "scope,client_key" });
    if (error) throw error;
    return;
  }
  if ((existing.request_count as number) >= maxRequests) throw new Error("RATE_LIMITED");
  const { error } = await supabase.from("edge_rate_limits").update({ request_count: (existing.request_count as number) + 1 }).eq("scope", scope).eq("client_key", clientKey);
  if (error) throw error;
}
