import { describe, expect, it, vi, beforeEach } from "vitest";

import {
  MAX_CHAT_TURNS,
  MAX_MESSAGE_CHARS,
  askSiteAssistant,
  trimChatHistory,
} from "./site-assistant-api";

const invoke = vi.fn();

vi.mock("@/integrations/supabase/client", () => ({
  supabase: { functions: { invoke: (...args: unknown[]) => invoke(...args) } },
}));

beforeEach(() => {
  invoke.mockReset();
});

describe("trimChatHistory", () => {
  it("bos mesajlari atar", () => {
    const result = trimChatHistory([
      { role: "user", content: "  " },
      { role: "user", content: "soru" },
    ]);

    expect(result).toEqual([{ role: "user", content: "soru" }]);
  });

  it("en YENI turlari korur, eskileri duserir", () => {
    const messages = Array.from({ length: MAX_CHAT_TURNS + 5 }, (_, index) => ({
      role: "user" as const,
      content: `mesaj-${index}`,
    }));

    const result = trimChatHistory(messages);

    expect(result).toHaveLength(MAX_CHAT_TURNS);
    expect(result.at(-1)?.content).toBe(`mesaj-${MAX_CHAT_TURNS + 4}`);
    expect(result[0].content).toBe("mesaj-5");
  });

  it("tek mesaji edge function sinirina gore kirpar", () => {
    const result = trimChatHistory([{ role: "user", content: "x".repeat(MAX_MESSAGE_CHARS + 500) }]);
    expect(result[0].content).toHaveLength(MAX_MESSAGE_CHARS);
  });
});

describe("askSiteAssistant", () => {
  it("yaniti, hasContext ve kaynaklari doner", async () => {
    invoke.mockResolvedValue({
      data: {
        answer: "Yanit",
        hasContext: true,
        sources: [{ title: "Vize", url: "/blog/vize", sourceKey: "blog" }],
      },
      error: null,
    });

    const result = await askSiteAssistant([{ role: "user", content: "soru" }]);

    expect(result.answer).toBe("Yanit");
    expect(result.hasContext).toBe(true);
    expect(result.sources).toHaveLength(1);
  });

  it("hasContext alani yoksa FALSE kabul eder — sessizce true saymaz", () => {
    invoke.mockResolvedValue({ data: { answer: "Yanit" }, error: null });

    return expect(askSiteAssistant([{ role: "user", content: "s" }])).resolves.toMatchObject({
      hasContext: false,
    });
  });

  it("supabase hatasi DUZ NESNE olsa bile mesaji kaybetmez", async () => {
    // supabase-js fonksiyon hatalari `Error` ornegi OLMAYABILIR; `instanceof Error`'a
    // daraltmak mesaji kaybettirir (cadde-rules.ts'te ayni tuzak aylarca yasandi).
    invoke.mockResolvedValue({ data: null, error: { message: "Giris yapmaniz gerekiyor." } });

    await expect(askSiteAssistant([{ role: "user", content: "s" }])).rejects.toThrow(
      "Giris yapmaniz gerekiyor.",
    );
  });

  it("govdedeki error alanini firlatir", async () => {
    invoke.mockResolvedValue({ data: { error: "Cok fazla istek" }, error: null });

    await expect(askSiteAssistant([{ role: "user", content: "s" }])).rejects.toThrow(
      "Cok fazla istek",
    );
  });

  it("yanit bos gelirse hata firlatir", async () => {
    invoke.mockResolvedValue({ data: { answer: "" }, error: null });

    await expect(askSiteAssistant([{ role: "user", content: "s" }])).rejects.toThrow(
      "Asistan yanıt döndürmedi.",
    );
  });

  it("dogru edge function adini cagirir ve gecmisi kirpar", async () => {
    invoke.mockResolvedValue({ data: { answer: "ok", hasContext: false }, error: null });

    await askSiteAssistant([
      { role: "user", content: "bir" },
      { role: "assistant", content: "  " },
      { role: "user", content: "iki" },
    ]);

    expect(invoke).toHaveBeenCalledWith("site-assistant", {
      body: {
        messages: [
          { role: "user", content: "bir" },
          { role: "user", content: "iki" },
        ],
      },
    });
  });
});
