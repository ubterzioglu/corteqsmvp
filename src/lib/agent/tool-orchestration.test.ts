import { describe, expect, it } from "vitest";

import {
  confidenceBand,
  contractCompleteness,
  rankTools,
  scoreFeatures,
  type RouteFeatures,
} from "./tool-router";
import { verifyToolCall } from "./tool-verifier";
import { executeTool } from "./tool-executor";

const fullFeatures: RouteFeatures = {
  intent: 1,
  contract: 1,
  privacy: 1,
  freshness: 1,
  latency: 1,
  determinism: 1,
  availability: 1,
};

describe("tool-router · scoreFeatures", () => {
  it("tüm özellikler 1 → 100", () => {
    expect(scoreFeatures(fullFeatures)).toBe(100);
  });

  it("tüm özellikler 0 → 0", () => {
    expect(
      scoreFeatures({
        intent: 0,
        contract: 0,
        privacy: 0,
        freshness: 0,
        latency: 0,
        determinism: 0,
        availability: 0,
      }),
    ).toBe(0);
  });

  it("ağırlıklar newtools.md formülüne uyar (sadece intent=1 → 30)", () => {
    expect(
      scoreFeatures({ ...fullFeatures, intent: 1, contract: 0, privacy: 0, freshness: 0, latency: 0, determinism: 0, availability: 0 }),
    ).toBe(30);
  });

  it("0..1 dışı değerler clamp'lenir", () => {
    expect(scoreFeatures({ ...fullFeatures, intent: 5 })).toBe(100);
  });
});

describe("tool-router · contractCompleteness", () => {
  it("zod + çok alan → yüksek", () => {
    const c = contractCompleteness({
      tool_key: "edge.find_matches",
      status: "active",
      family: "edge_function",
      input_schema: { validation: "zod", fields: ["a", "b", "c", "d", "e", "f", "g"] },
    });
    expect(c).toBe(1);
  });

  it("manual + alansız → düşük", () => {
    const c = contractCompleteness({
      tool_key: "edge.x",
      status: "active",
      family: "edge_function",
      input_schema: { validation: "manual", fields: [] },
    });
    expect(c).toBe(0.4);
  });
});

describe("tool-router · rankTools", () => {
  const tools = [
    { tool_key: "edge.find_matches", status: "active", family: "edge_function" },
    { tool_key: "edge.lansman_admin", status: "deprecated", family: "edge_function" },
  ];

  it("deprecated araç skoru 0 ve eligible=false", () => {
    const ranked = rankTools(tools, {
      "edge.find_matches": fullFeatures,
      "edge.lansman_admin": fullFeatures,
    });
    const lansman = ranked.find((r) => r.toolKey === "edge.lansman_admin")!;
    expect(lansman.eligible).toBe(false);
    expect(lansman.score).toBe(0);
  });

  it("yüksek skorlu araç başa sıralanır", () => {
    const ranked = rankTools(tools, {
      "edge.find_matches": fullFeatures,
      "edge.lansman_admin": fullFeatures,
    });
    expect(ranked[0].toolKey).toBe("edge.find_matches");
  });
});

describe("tool-router · confidenceBand", () => {
  it("eşik bantları doğru", () => {
    expect(confidenceBand(85)).toBe("high");
    expect(confidenceBand(70)).toBe("medium");
    expect(confidenceBand(55)).toBe("low");
    expect(confidenceBand(40)).toBe("reject");
  });
});

const activeTool = {
  tool_key: "edge.find_matches",
  status: "active",
  family: "edge_function",
  input_schema: { validation: "zod", fields: ["offers_needs"] },
};

describe("tool-verifier", () => {
  it("active + zorunlu alan dolu → ok", () => {
    const r = verifyToolCall({
      tool: activeTool,
      payload: { offers_needs: "mentor arıyorum" },
      requiredFields: ["offers_needs"],
    });
    expect(r.ok).toBe(true);
  });

  it("deprecated araç reddedilir", () => {
    const r = verifyToolCall({
      tool: { ...activeTool, status: "deprecated" },
      payload: { offers_needs: "x" },
    });
    expect(r.ok).toBe(false);
    expect(r.errors.join()).toMatch(/active/);
  });

  it("eksik zorunlu alan reddedilir", () => {
    const r = verifyToolCall({
      tool: activeTool,
      payload: {},
      requiredFields: ["offers_needs"],
    });
    expect(r.ok).toBe(false);
    expect(r.errors.join()).toMatch(/offers_needs/);
  });

  it("mutasyon idempotency-key olmadan reddedilir", () => {
    const r = verifyToolCall({
      tool: activeTool,
      payload: { offers_needs: "x" },
      mutating: true,
    });
    expect(r.ok).toBe(false);
    expect(r.errors.join()).toMatch(/idempotency/);
  });

  it("beklenmeyen alan uyarı üretir ama reddetmez", () => {
    const r = verifyToolCall({
      tool: activeTool,
      payload: { offers_needs: "x", surprise: 1 },
      requiredFields: ["offers_needs"],
    });
    expect(r.ok).toBe(true);
    expect(r.warnings.join()).toMatch(/surprise/);
  });
});

describe("tool-executor", () => {
  it("verifier reddederse çağrı yapılmaz (blocked)", async () => {
    let called = false;
    const res = await executeTool(
      { ...activeTool, status: "deprecated" },
      {
        payload: { offers_needs: "x" },
        invoke: async () => {
          called = true;
          return { httpStatus: 200, body: {} };
        },
      },
    );
    expect(res.status).toBe("blocked");
    expect(called).toBe(false);
    expect(res.telemetry.status).toBe("blocked");
  });

  it("geçerli çağrı çalışır ve telemetri redacted olur", async () => {
    let t = 1000;
    const res = await executeTool(
      activeTool,
      {
        payload: { offers_needs: "mail ali@x.com ile" },
        requiredFields: ["offers_needs"],
        invoke: async () => {
          t += 50;
          return { httpStatus: 200, body: { matches: [] } };
        },
      },
      () => t,
    );
    expect(res.status).toBe("ok");
    expect(res.httpStatus).toBe(200);
    const redacted = res.telemetry.payload_redacted as Record<string, string>;
    expect(redacted.offers_needs).toContain("[email]");
    expect(res.telemetry.latency_ms).toBeGreaterThanOrEqual(0);
  });

  it("invoke hata fırlatırsa status=failed", async () => {
    const res = await executeTool(activeTool, {
      payload: { offers_needs: "x" },
      requiredFields: ["offers_needs"],
      invoke: async () => {
        throw new Error("network");
      },
    });
    expect(res.status).toBe("failed");
    expect(res.errors.join()).toMatch(/network/);
  });

  it("5xx yanıtı status=failed", async () => {
    const res = await executeTool(activeTool, {
      payload: { offers_needs: "x" },
      requiredFields: ["offers_needs"],
      invoke: async () => ({ httpStatus: 500, body: { error: "x" } }),
    });
    expect(res.status).toBe("failed");
    expect(res.httpStatus).toBe(500);
  });
});
