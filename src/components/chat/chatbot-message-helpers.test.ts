import { describe, expect, it } from "vitest";

import { appendSources, toAssistantHistory } from "./chatbot-message-helpers";
import type { ChatMessage } from "@/lib/chatConfig";

const message = (role: ChatMessage["role"], content: string): ChatMessage => ({
  id: `${role}-${content}`,
  role,
  content,
  timestamp: 0,
});

describe("toAssistantHistory", () => {
  it("bot rolunu assistant'a cevirir", () => {
    const history = toAssistantHistory([message("bot", "merhaba"), message("user", "soru")], []);

    expect(history).toEqual([
      { role: "assistant", content: "merhaba" },
      { role: "user", content: "soru" },
    ]);
  });

  it("acilis selamlamasini ve uyari metinlerini gecmise KOYMAZ", () => {
    const greeting = "Merhaba! Ben asistanim.";
    const guest = "Giris yapmalisin.";

    const history = toAssistantHistory(
      [message("bot", greeting), message("bot", guest), message("user", "soru")],
      [greeting, guest],
    );

    expect(history).toEqual([{ role: "user", content: "soru" }]);
  });

  it("bos gecmis icin bos dizi doner", () => {
    expect(toAssistantHistory([], [])).toEqual([]);
  });
});

describe("appendSources", () => {
  it("kaynak yoksa yaniti aynen birakir", () => {
    expect(appendSources("Yanit", [])).toBe("Yanit");
  });

  it("URL'si olmayan kaynagi atar", () => {
    expect(appendSources("Yanit", [{ title: "Baslik", url: null }])).toBe("Yanit");
  });

  it("baglantilari markdown listesi olarak ekler", () => {
    const result = appendSources("Yanit", [{ title: "Vize Rehberi", url: "/blog/vize" }]);

    expect(result).toContain("**Kaynaklar**");
    expect(result).toContain("- [Vize Rehberi](/blog/vize)");
  });

  it("en fazla dort kaynak gosterir", () => {
    const sources = Array.from({ length: 8 }, (_, index) => ({
      title: `Kayit ${index}`,
      url: `/directory/${index}`,
    }));

    const lines = appendSources("Yanit", sources).split("\n").filter((line) => line.startsWith("- "));
    expect(lines).toHaveLength(4);
  });
});
