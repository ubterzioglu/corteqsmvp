import { existsSync, readFileSync } from "node:fs";

import { describe, expect, it, vi } from "vitest";

import {
  normalizeAssistantUsage,
  recordAssistantUsage,
} from "./assistant-usage";

const migrationPath =
  "supabase/migrations/applied/20260922110000_ai_assistant_usage.sql";

describe("ai_assistant_usage migration", () => {
  it("creates an admin-readable, service-role-written usage ledger", () => {
    expect(existsSync(migrationPath)).toBe(true);
    const sql = readFileSync(migrationPath, "utf8");

    expect(sql).toContain("create table if not exists public.ai_assistant_usage");
    expect(sql).toContain("alter table public.ai_assistant_usage enable row level security");
    expect(sql).toMatch(/using\s*\(public\.is_admin\(auth\.uid\(\)\)\)/i);
    expect(sql).toMatch(/grant insert on table public\.ai_assistant_usage to service_role/i);
    expect(sql).not.toMatch(/grant insert[\s\S]+to (?:anon|authenticated)/i);
  });
});

describe("normalizeAssistantUsage", () => {
  it("normalizes Gemini token metadata", () => {
    expect(normalizeAssistantUsage({
      promptTokenCount: 12,
      candidatesTokenCount: 8,
      totalTokenCount: 20,
    })).toEqual({ inputTokens: 12, outputTokens: 8, totalTokens: 20 });
  });

  it("normalizes Groq token metadata and rejects invalid values", () => {
    expect(normalizeAssistantUsage({
      prompt_tokens: 10,
      completion_tokens: 5,
      total_tokens: 15,
    })).toEqual({ inputTokens: 10, outputTokens: 5, totalTokens: 15 });
    expect(normalizeAssistantUsage({ total_tokens: -4 })).toEqual({
      inputTokens: 0,
      outputTokens: 0,
      totalTokens: 0,
    });
  });
});

describe("recordAssistantUsage", () => {
  it("writes normalized usage without storing message content", async () => {
    const insert = vi.fn().mockResolvedValue({ error: null });
    const client = { from: vi.fn(() => ({ insert })) };

    await recordAssistantUsage(client, {
      userId: "user-1",
      functionName: "site-assistant",
      provider: "gemini",
      usage: { promptTokenCount: 3, candidatesTokenCount: 2, totalTokenCount: 5 },
      status: "success",
      httpStatus: 200,
    });

    expect(insert).toHaveBeenCalledWith({
      user_id: "user-1",
      function_name: "site-assistant",
      provider: "gemini",
      input_tokens: 3,
      output_tokens: 2,
      total_tokens: 5,
      status: "success",
      http_status: 200,
    });
  });

  it("telemetry failure never fails the assistant request", async () => {
    const client = {
      from: vi.fn(() => ({
        insert: vi.fn().mockResolvedValue({ error: { message: "db unavailable" } }),
      })),
    };

    await expect(recordAssistantUsage(client, {
      userId: "user-1",
      functionName: "relocation-assistant",
      provider: "gemini",
      usage: null,
      status: "error",
      httpStatus: 502,
    })).resolves.toBeUndefined();
  });

  it("both assistants persist successful model usage", () => {
    for (const sourcePath of [
      "supabase/functions/site-assistant/index.ts",
      "supabase/functions/relocation-assistant/index.ts",
    ]) {
      const source = readFileSync(sourcePath, "utf8");
      expect(source, sourcePath).toContain('from "../_shared/assistant-usage.ts"');
      expect(source, sourcePath).toContain("recordAssistantUsage(");
      expect(source, sourcePath).toContain('status: "success"');
    }
  });

  it("both assistants persist model-provider 429 quota events", () => {
    for (const sourcePath of [
      "supabase/functions/site-assistant/index.ts",
      "supabase/functions/relocation-assistant/index.ts",
    ]) {
      const source = readFileSync(sourcePath, "utf8");
      expect(source, sourcePath).toContain('status: "quota_exceeded"');
      expect(source, sourcePath).toContain("httpStatus: 429");
    }
  });
});
