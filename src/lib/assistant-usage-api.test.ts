import { describe, expect, it } from "vitest";

import {
  getGeminiQuotaAlert,
  summarizeAssistantUsage,
  type AssistantUsageRow,
} from "@/lib/assistant-usage-api";

function usage(overrides: Partial<AssistantUsageRow> = {}): AssistantUsageRow {
  return {
    id: "usage-1",
    user_id: "user-1",
    function_name: "site-assistant",
    provider: "gemini",
    input_tokens: 12,
    output_tokens: 8,
    total_tokens: 20,
    status: "success",
    http_status: 200,
    created_at: "2026-09-22T08:00:00.000Z",
    ...overrides,
  };
}

describe("summarizeAssistantUsage", () => {
  it("istek ve token toplamlarını fonksiyon bazında özetler", () => {
    const summary = summarizeAssistantUsage([
      usage(),
      usage({
        id: "usage-2",
        function_name: "relocation-assistant",
        total_tokens: 35,
      }),
      usage({ id: "usage-3", total_tokens: null }),
    ]);

    expect(summary).toEqual({
      totalRequests: 3,
      totalTokens: 55,
      siteRequests: 2,
      relocationRequests: 1,
      quotaEvents: 0,
    });
  });

  it("kota olaylarını ayrıca sayar", () => {
    const summary = summarizeAssistantUsage([
      usage({ status: "quota_exceeded", http_status: 429, total_tokens: null }),
    ]);

    expect(summary.quotaEvents).toBe(1);
    expect(summary.totalTokens).toBe(0);
  });
});

describe("getGeminiQuotaAlert", () => {
  it("son 24 saatteki Gemini 429 olayında kota uyarısını açar", () => {
    const alert = getGeminiQuotaAlert(
      [usage({ status: "quota_exceeded", http_status: 429 })],
      new Date("2026-09-22T10:00:00.000Z"),
    );

    expect(alert).toEqual({ active: true, eventCount: 1 });
  });

  it("eski veya başka sağlayıcıya ait olayları eşikten saymaz", () => {
    const alert = getGeminiQuotaAlert(
      [
        usage({ created_at: "2026-09-20T08:00:00.000Z", status: "quota_exceeded", http_status: 429 }),
        usage({ provider: "groq", status: "quota_exceeded", http_status: 429 }),
      ],
      new Date("2026-09-22T10:00:00.000Z"),
    );

    expect(alert).toEqual({ active: false, eventCount: 0 });
  });
});
