import { createClient } from "https://esm.sh/@supabase/supabase-js@2.108.2";

function getClientKey(req: Request, userId?: string): string {
  // SG9: user.id varsa onu kullan (sahtecilik önleme)
  if (userId) return `user:${userId}`;
  
  // Fallback: IP adresi (sahtecilik mümkün ama auth yoksa tek seçenek)
  const forwardedFor = req.headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0]?.trim() || "unknown";
  return req.headers.get("cf-connecting-ip") ?? req.headers.get("x-real-ip") ?? "unknown";
}

/**
 * SG9: Atomik rate-limit. INSERT ON CONFLICT DO UPDATE ile yarış koruması.
 * @param userId - Varsa user.id kullan (önerilir), yoksa IP'ye düşer
 */
export async function enforceRateLimit(
  supabase: ReturnType<typeof createClient>, req: Request, scope: string, maxRequests: number, windowSeconds: number,
  userId?: string,
) {
  await enforceRateLimitForKey(supabase, scope, getClientKey(req, userId), maxRequests, windowSeconds);
}

/**
 * Anahtarı çağıranın kendisi hazırladığı durumlar için (örn. anket: tuzlanmış IP hash'i,
 * anket başına kapsam). `enforceRateLimit` ile AYNI atomik RPC'yi kullanır; select+update
 * kopyaları yazma, yarış durumuna açıktır.
 */
export async function enforceRateLimitForKey(
  supabase: ReturnType<typeof createClient>, scope: string, clientKey: string, maxRequests: number, windowSeconds: number,
) {
  const windowMs = windowSeconds * 1000;
  const windowStartMs = Math.floor(Date.now() / windowMs) * windowMs;
  const windowStartedAt = new Date(windowStartMs).toISOString();
  
  // SG9: Atomik INSERT ON CONFLICT DO UPDATE
  // Yarış durumu: iki eşzamanlı istek aynı pencerede → ikisi de insert dener,
  // biri çakışır ve update olur. Select+update ayrı ayrı olsaydı kaybolurdu.
  const { error } = await supabase.rpc("edge_rate_limit_atomic", {
    p_scope: scope,
    p_client_key: clientKey,
    p_window_started_at: windowStartedAt,
    p_max_requests: maxRequests,
  });
  
  if (error) {
    if (error.message.includes("RATE_LIMITED") || error.code === "P0001") {
      throw new Error("RATE_LIMITED");
    }
    throw error;
  }
}
