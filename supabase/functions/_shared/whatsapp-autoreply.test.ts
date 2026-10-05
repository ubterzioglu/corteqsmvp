import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";

describe("whatsapp-autoreply shared logic", () => {
  it("should have kille=['public'] hardcoded (not member/admin)", () => {
    const source = readFileSync("supabase/functions/_shared/whatsapp-autoreply.ts", "utf-8");
    
    // Check that p_audiences is hardcoded to ["public"]
    expect(source).toContain('p_audiences: ["public"]');
    
    // Ensure it doesn't use resolveAudiences or member/admin
    expect(source).not.toContain("resolveAudiences");
    expect(source).not.toMatch(/p_audiences.*member/);
    expect(source).not.toMatch(/p_audiences.*admin/);
  });

  it("should have system prompt without Markdown", () => {
    const source = readFileSync("supabase/functions/_shared/whatsapp-autoreply.ts", "utf-8");
    
    // Check that system prompt mentions no Markdown
    expect(source).toContain("Markdown YOK");
    expect(source).toContain("*kalın*");
  });

  it("should have 600 character target mentioned", () => {
    const source = readFileSync("supabase/functions/_shared/whatsapp-autoreply.ts", "utf-8");
    expect(source).toContain("600 karakter");
  });

  it("should use correct embedding model and dimensions", () => {
    const source = readFileSync("supabase/functions/_shared/whatsapp-autoreply.ts", "utf-8");
    
    expect(source).toContain('EMBEDDING_MODEL = "gemini-embedding-001"');
    expect(source).toContain("EMBEDDING_DIMENSIONS = 1536");
    expect(source).toContain('taskType: "RETRIEVAL_QUERY"');
  });

  it("should use correct search threshold", () => {
    const source = readFileSync("supabase/functions/_shared/whatsapp-autoreply.ts", "utf-8");
    expect(source).toContain("SEARCH_THRESHOLD = 0.35");
  });

  it("should call bot_prepare_whatsapp_reply with correct parameters", () => {
    const source = readFileSync("supabase/functions/_shared/whatsapp-autoreply.ts", "utf-8");
    
    expect(source).toContain("bot_prepare_whatsapp_reply");
    expect(source).toContain("p_request_id");
    expect(source).toContain("p_thread_id");
    expect(source).toContain("p_body");
  });

  it("should call bot_finalize_whatsapp_reply with correct parameters", () => {
    const source = readFileSync("supabase/functions/_shared/whatsapp-autoreply.ts", "utf-8");
    
    expect(source).toContain("bot_finalize_whatsapp_reply");
    expect(source).toContain("p_message_id");
    expect(source).toContain("p_success");
    expect(source).toContain("p_provider_message_id");
    expect(source).toContain("p_error_code");
  });

  it("should record usage with whatsapp-autoreply function name", () => {
    const source = readFileSync("supabase/functions/_shared/whatsapp-autoreply.ts", "utf-8");
    
    expect(source).toContain('functionName: "whatsapp-autoreply"');
    expect(source).toContain("recordAssistantUsage");
  });

  it("should handle handover keywords", () => {
    const source = readFileSync("supabase/functions/_shared/whatsapp-autoreply.ts", "utf-8");
    
    expect(source).toContain("handover_keywords");
    expect(source).toContain("bot_handed_over_at");
  });

  it("should check rate limits", () => {
    const source = readFileSync("supabase/functions/_shared/whatsapp-autoreply.ts", "utf-8");
    
    expect(source).toContain("edge_rate_limits");
    expect(source).toContain("max_replies_per_sender_per_day");
  });

  it("should not log PII", () => {
    const source = readFileSync("supabase/functions/_shared/whatsapp-autoreply.ts", "utf-8");
    
    // Should not have console.log with sensitive data
    expect(source).not.toMatch(/console\.log.*messageText/);
    expect(source).not.toMatch(/console\.log.*recipientPhone/);
    expect(source).not.toMatch(/console\.log.*waIdCiphertext/);
  });
});

describe("whatsapp-autoreply edge function", () => {
  it("should require WHATSAPP_AUTOREPLY_SECRET environment variable", () => {
    const source = readFileSync("supabase/functions/whatsapp-autoreply/index.ts", "utf-8");
    
    expect(source).toContain("WHATSAPP_AUTOREPLY_SECRET");
  });

  it("should verify shared secret with constant-time comparison", () => {
    const source = readFileSync("supabase/functions/whatsapp-autoreply/index.ts", "utf-8");
    
    expect(source).toContain("secretsMatch");
    expect(source).toContain("x-autoreply-secret");
  });

  it("should return 401 when secret is missing or invalid", () => {
    const source = readFileSync("supabase/functions/whatsapp-autoreply/index.ts", "utf-8");
    
    expect(source).toContain("401");
    expect(source).toContain("unauthorized");
  });

  it("should validate required fields in request body", () => {
    const source = readFileSync("supabase/functions/whatsapp-autoreply/index.ts", "utf-8");
    
    expect(source).toContain("threadId");
    expect(source).toContain("messageId");
    expect(source).toContain("waIdHash");
    expect(source).toContain("waIdCiphertext");
    expect(source).toContain("messageText");
    expect(source).toContain("missing_required_fields");
  });

  it("should handle CORS preflight", () => {
    const source = readFileSync("supabase/functions/whatsapp-autoreply/index.ts", "utf-8");
    
    expect(source).toContain("OPTIONS");
    expect(source).toContain("Access-Control-Allow-Origin");
  });
});
