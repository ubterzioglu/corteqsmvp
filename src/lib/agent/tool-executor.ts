// Tool executor (Faz 4) — router + verifier zincirini yürütür.
// Kaynak tasarım: newtools.md §"Ajan orkestrasyonu" planner→router→executor→verifier.
//
// Akış: verify → (geçerse) execute → telemetri kaydı (redacted).
// Gerçek I/O enjekte edilir (fetcher) → saf, test edilebilir.

import { verifyToolCall, type VerifyToolMeta } from "./tool-verifier";
import { redactPayload } from "./anonymize";

export type ExecutorTool = VerifyToolMeta & {
  entrypoint?: string;
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
};

export type ExecuteResult = {
  status: "ok" | "blocked" | "failed";
  httpStatus?: number;
  body?: unknown;
  errors: string[];
  warnings: string[];
  /** Telemetriye yazılacak redacted kayıt (ops.tool_runs ile uyumlu). */
  telemetry: {
    tool_key: string;
    status: string;
    http_status?: number;
    idempotency_key?: string;
    payload_redacted: unknown;
    latency_ms: number;
  };
};

/**
 * Bir aracı doğrulayıp çalıştırır ve telemetri üretir.
 * Verifier reddederse çağrı YAPILMAZ (status="blocked").
 * @param now Test için enjekte edilebilir zaman fonksiyonu (ms).
 */
export async function executeTool(
  tool: ExecutorTool,
  opts: ExecuteOptions,
  now: () => number = () => Date.now(),
): Promise<ExecuteResult> {
  const verdict = verifyToolCall({
    tool,
    payload: opts.payload,
    idempotencyKey: opts.idempotencyKey,
    mutating: opts.mutating,
    redacted: opts.redacted,
    requiredFields: opts.requiredFields,
  });

  const payloadRedacted = redactPayload(opts.payload);
  const startedAt = now();

  if (!verdict.ok) {
    return {
      status: "blocked",
      errors: verdict.errors,
      warnings: verdict.warnings,
      telemetry: {
        tool_key: tool.tool_key,
        status: "blocked",
        idempotency_key: opts.idempotencyKey,
        payload_redacted: payloadRedacted,
        latency_ms: 0,
      },
    };
  }

  try {
    const res = await opts.invoke(opts.payload);
    const ok = res.httpStatus >= 200 && res.httpStatus < 300;
    return {
      status: ok ? "ok" : "failed",
      httpStatus: res.httpStatus,
      body: res.body,
      errors: ok ? [] : [`HTTP ${res.httpStatus}`],
      warnings: verdict.warnings,
      telemetry: {
        tool_key: tool.tool_key,
        status: ok ? "ok" : "failed",
        http_status: res.httpStatus,
        idempotency_key: opts.idempotencyKey,
        payload_redacted: payloadRedacted,
        latency_ms: Math.max(0, now() - startedAt),
      },
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Bilinmeyen hata";
    return {
      status: "failed",
      errors: [message],
      warnings: verdict.warnings,
      telemetry: {
        tool_key: tool.tool_key,
        status: "failed",
        idempotency_key: opts.idempotencyKey,
        payload_redacted: payloadRedacted,
        latency_ms: Math.max(0, now() - startedAt),
      },
    };
  }
}
