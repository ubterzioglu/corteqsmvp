import { describe, expect, it, vi } from "vitest";

import { createToolRunSink, type RpcCaller } from "./telemetry-sink";
import type { ToolRunTelemetry } from "./tool-executor";

const sampleRecord: ToolRunTelemetry = {
  tool_key: "edge.find_matches",
  status: "ok",
  http_status: 200,
  idempotency_key: "abc",
  payload_redacted: { offers_needs: "[email]" },
  latency_ms: 120,
};

/** Çağrı argümanlarını tip-güvenli okuyan yardımcı. */
function callArgs(
  rpc: ReturnType<typeof vi.fn>,
  index = 0,
): Record<string, unknown> {
  const call = rpc.mock.calls[index] as unknown as [string, Record<string, unknown>];
  return call[1];
}

describe("createToolRunSink", () => {
  it("record_tool_run RPC'sini doğru argümanlarla çağırır", async () => {
    const rpc = vi.fn(async () => ({ error: null }));
    const client: RpcCaller = { rpc };
    const sink = createToolRunSink(client, { actorType: "agent" });

    await sink(sampleRecord);

    expect(rpc).toHaveBeenCalledTimes(1);
    const call = rpc.mock.calls[0] as unknown as [string, Record<string, unknown>];
    expect(call[0]).toBe("record_tool_run");
    expect(call[1]).toMatchObject({
      p_tool_key: "edge.find_matches",
      p_status: "ok",
      p_http_status: 200,
      p_idempotency_key: "abc",
      p_latency_ms: 120,
      p_actor_type: "agent",
    });
  });

  it("redacted payload'ı olduğu gibi geçirir (ham PII içermez varsayımı)", async () => {
    const rpc = vi.fn(async () => ({ error: null }));
    const sink = createToolRunSink({ rpc });
    await sink(sampleRecord);
    const args = callArgs(rpc);
    expect(args.p_payload_redacted).toEqual({ offers_needs: "[email]" });
  });

  it("RPC hatasında onError çağrılır ama exception fırlatmaz", async () => {
    const rpc = vi.fn(async () => ({ error: { message: "permission denied" } }));
    const onError = vi.fn();
    const sink = createToolRunSink({ rpc }, { onError });
    await expect(sink(sampleRecord)).resolves.toBeUndefined();
    expect(onError).toHaveBeenCalledWith("permission denied");
  });

  it("eksik opsiyonel alanlar null geçer", async () => {
    const rpc = vi.fn(async () => ({ error: null }));
    const sink = createToolRunSink({ rpc });
    await sink({
      tool_key: "edge.x",
      status: "blocked",
      payload_redacted: {},
      latency_ms: 0,
    });
    const args = callArgs(rpc);
    expect(args.p_http_status).toBeNull();
    expect(args.p_idempotency_key).toBeNull();
  });
});
