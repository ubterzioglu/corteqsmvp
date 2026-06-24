// Tool executor (Faz 4 + telemetri/injection entegrasyonu) —
// router + verifier + injection-guard zincirini yürütür ve telemetri yazar.
// Kaynak tasarım: newtools.md §"Ajan orkestrasyonu" planner→router→executor→verifier.
//
// Akış: injection-scan → verify → (geçerse) execute → telemetri sink (redacted).
// Gerçek I/O (invoke) ve telemetri yazımı (sink) enjekte edilir → saf, test edilebilir.

import { verifyToolCall, type VerifyToolMeta } from "./tool-verifier";
import { redactPayload } from "./anonymize";
import { scanForInjection, shouldBlock } from "./injection-guard";

export type ExecutorTool = VerifyToolMeta & {
  entrypoint?: string;
};

/** ops.tool_runs ile uyumlu redacted telemetri kaydı. */
export type ToolRunTelemetry = {
  tool_key: string;
  status: string;
  http_status?: number;
  idempotency_key?: string;
  payload_redacted: unknown;
  latency_ms: number;
  /** Tespit edilen injection etiketleri (varsa). */
  injection_flags?: string[];
};

export type ExecuteOptions = {
  payload: Record<string, unknown>;
  idempotencyKey?: string;
  mutating?: boolean;
  redacted?: boolean;
  requiredFields?: string[];
  /** Gerçek çağrıyı yapan fonksiyon (HTTP/RPC). Enjekte edilir. */
  invoke: (payload: Record<string, unknown>) => Promise<{
    httpStatus: number;
    body: unknown;
  }>;
  /**
   * Telemetri yazıcı (ör. ops.tool_runs insert). Enjekte edilir; opsiyonel.
   * Sink hatası executor'ı KIRMAZ — telemetri best-effort.
   */
  sink?: (record: ToolRunTelemetry) => Promise<void> | void;
};

export type ExecuteResult = {
  status: "ok" | "blocked" | "failed";
  httpStatus?: number;
  body?: unknown;
  errors: string[];
  warnings: string[];
  telemetry: ToolRunTelemetry;
};

/** Payload içindeki string değerleri injection için tarar. */
function scanPayload(payload: Record<string, unknown>): {
  flags: string[];
  highRisk: boolean;
} {
  const flags = new Set<string>();
  let highRisk = false;
  for (const value of Object.values(payload ?? {})) {
    if (typeof value === "string") {
      const scan = scanForInjection(value);
      scan.matches.forEach((m) => flags.add(m));
      if (shouldBlock(scan)) highRisk = true;
    }
  }
  return { flags: [...flags].sort(), highRisk };
}

/** Telemetriyi best-effort yazar; sink hatası yutulur (executor kırılmaz). */
async function emit(
  sink: ExecuteOptions["sink"],
  record: ToolRunTelemetry,
): Promise<void> {
  if (!sink) return;
  try {
    await sink(record);
  } catch {
    // Telemetri yazımı yürütmeyi etkilemez.
  }
}

/**
 * Bir aracı doğrulayıp çalıştırır, telemetri üretir ve sink'e yazar.
 * Verifier reddederse VEYA yüksek-riskli injection bulunursa çağrı YAPILMAZ.
 * @param now Test için enjekte edilebilir zaman fonksiyonu (ms).
 */
export async function executeTool(
  tool: ExecutorTool,
  opts: ExecuteOptions,
  now: () => number = () => Date.now(),
): Promise<ExecuteResult> {
  const payloadRedacted = redactPayload(opts.payload);
  const injection = scanPayload(opts.payload);
  const injectionFlags = injection.flags.length ? injection.flags : undefined;
  const startedAt = now();

  const blocked = async (errors: string[], warnings: string[]): Promise<ExecuteResult> => {
    const telemetry: ToolRunTelemetry = {
      tool_key: tool.tool_key,
      status: "blocked",
      idempotency_key: opts.idempotencyKey,
      payload_redacted: payloadRedacted,
      latency_ms: 0,
      injection_flags: injectionFlags,
    };
    await emit(opts.sink, telemetry);
    return { status: "blocked", errors, warnings, telemetry };
  };

  // 1) Injection gate — yüksek riskli payload çağrı YAPILMADAN bloklanır.
  if (injection.highRisk) {
    return blocked(
      ["Yüksek riskli prompt injection tespit edildi — çağrı engellendi."],
      [`injection: ${injection.flags.join(", ")}`],
    );
  }

  // 2) Verifier gate.
  const verdict = verifyToolCall({
    tool,
    payload: opts.payload,
    idempotencyKey: opts.idempotencyKey,
    mutating: opts.mutating,
    redacted: opts.redacted,
    requiredFields: opts.requiredFields,
  });
  if (!verdict.ok) {
    return blocked(verdict.errors, verdict.warnings);
  }

  // 3) Yürüt.
  try {
    const res = await opts.invoke(opts.payload);
    const ok = res.httpStatus >= 200 && res.httpStatus < 300;
    const telemetry: ToolRunTelemetry = {
      tool_key: tool.tool_key,
      status: ok ? "ok" : "failed",
      http_status: res.httpStatus,
      idempotency_key: opts.idempotencyKey,
      payload_redacted: payloadRedacted,
      latency_ms: Math.max(0, now() - startedAt),
      injection_flags: injectionFlags,
    };
    await emit(opts.sink, telemetry);
    return {
      status: ok ? "ok" : "failed",
      httpStatus: res.httpStatus,
      body: res.body,
      errors: ok ? [] : [`HTTP ${res.httpStatus}`],
      warnings: verdict.warnings,
      telemetry,
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Bilinmeyen hata";
    const telemetry: ToolRunTelemetry = {
      tool_key: tool.tool_key,
      status: "failed",
      idempotency_key: opts.idempotencyKey,
      payload_redacted: payloadRedacted,
      latency_ms: Math.max(0, now() - startedAt),
      injection_flags: injectionFlags,
    };
    await emit(opts.sink, telemetry);
    return { status: "failed", errors: [message], warnings: verdict.warnings, telemetry };
  }
}
