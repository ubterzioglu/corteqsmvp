// Telemetri sink fabrikası — executor sonucunu ops.tool_runs'a yazar.
// Kaynak tasarım: newtools.md §"Araç envanteri" ops.* + executor entegrasyonu.
//
// public.record_tool_run RPC'sini çağırır (ops PostgREST'e expose değil).
// Supabase client enjekte edilir → frontend ve edge ile uyumlu, test edilebilir.

import type { ToolRunTelemetry } from "./tool-executor";

/** Sadece ihtiyaç duyulan rpc yüzeyi — tam SupabaseClient bağımlılığı yok. */
export type RpcCaller = {
  rpc: (
    fn: string,
    args: Record<string, unknown>,
  ) => Promise<{ error: { message: string } | null }>;
};

export type SinkOptions = {
  actorType?: "human" | "agent" | "scheduler";
  actorPseudoId?: string;
  /** Hata olduğunda çağrılır (best-effort; varsayılan sessiz). */
  onError?: (message: string) => void;
};

/**
 * executeTool({ sink }) ile kullanılacak bir telemetri yazıcı üretir.
 * Yazma başarısız olsa bile yürütmeyi etkilemez (executor zaten yutar);
 * onError ile gözlemlenebilir.
 */
export function createToolRunSink(
  client: RpcCaller,
  options: SinkOptions = {},
): (record: ToolRunTelemetry) => Promise<void> {
  const actorType = options.actorType ?? "agent";
  return async (record: ToolRunTelemetry) => {
    const { error } = await client.rpc("record_tool_run", {
      p_tool_key: record.tool_key,
      p_status: record.status,
      p_http_status: record.http_status ?? null,
      p_idempotency_key: record.idempotency_key ?? null,
      p_payload_redacted: record.payload_redacted ?? {},
      p_latency_ms: record.latency_ms ?? null,
      p_actor_type: actorType,
      p_actor_pseudo_id: options.actorPseudoId ?? null,
    });
    if (error) {
      options.onError?.(error.message);
    }
  };
}
