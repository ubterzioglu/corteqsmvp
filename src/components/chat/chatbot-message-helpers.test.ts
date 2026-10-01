import { describe, expect, it } from "vitest";

import {
  appendSources,
  classifyLinkTarget,
  parseRichText,
  toAssistantHistory,
} from "./chatbot-message-helpers";
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

describe("classifyLinkTarget (N06 guvenlik beyaz listesi)", () => {
  it("ic yollari kabul eder", () => {
    expect(classifyLinkTarget("/admin/data")).toBe("internal");
    expect(classifyLinkTarget("/blog/vize?x=1#bolum")).toBe("internal");
  });

  it("protocol-relative ve ters bolu kacislarini REDDEDER", () => {
    expect(classifyLinkTarget("//evil.com")).toBeNull();
    expect(classifyLinkTarget("/\\evil.com")).toBeNull();
  });

  it("yalniz https dis baglanti; http ve diger semalar red", () => {
    expect(classifyLinkTarget("https://eng.corteqs.net")).toBe("external");
    expect(classifyLinkTarget("HTTPS://eng.corteqs.net")).toBe("external");
    expect(classifyLinkTarget("http://example.com")).toBeNull();
    expect(classifyLinkTarget("javascript:alert(1)")).toBeNull();
    expect(classifyLinkTarget("data:text/html,x")).toBeNull();
    expect(classifyLinkTarget("mailto:a@b.c")).toBeNull();
  });
});

describe("parseRichText", () => {
  it("duz metni tek parcada birakir", () => {
    expect(parseRichText("Merhaba dunya")).toEqual([{ kind: "text", text: "Merhaba dunya" }]);
  });

  it("bos metin bos dizi doner", () => {
    expect(parseRichText("")).toEqual([]);
  });

  it("kalın ve linki karisik metinde ayirir", () => {
    const segments = parseRichText("Once **onemli**, sonra [Uyeler](/admin/data) gelir.");
    expect(segments).toEqual([
      { kind: "text", text: "Once " },
      { kind: "bold", text: "onemli" },
      { kind: "text", text: ", sonra " },
      { kind: "link", text: "Uyeler", href: "/admin/data", external: false },
      { kind: "text", text: " gelir." },
    ]);
  });

  it("dis linki external isaretler", () => {
    expect(parseRichText("[Engine](https://eng.corteqs.net)")).toEqual([
      { kind: "link", text: "Engine", href: "https://eng.corteqs.net", external: true },
    ]);
  });

  it("guvensiz hedefte yalniz etiket metnini birakir (ham markdown ve hedef YOK)", () => {
    const segments = parseRichText("Bak: [Kazanç](javascript:alert(1)) son.");
    expect(segments).toEqual([
      { kind: "text", text: "Bak: " },
      { kind: "text", text: "Kazanç" },
      { kind: "text", text: " son." },
    ]);
    expect(segments.some((segment) => segment.kind === "link")).toBe(false);
    expect(JSON.stringify(segments)).not.toContain("javascript:");
  });

  it("appendSources ciktisinin tamamini linklere cevirir (uctan uca sozlesme)", () => {
    const content = appendSources("Yanit", [
      { title: "Vize Rehberi", url: "/blog/vize" },
      { title: "Engine", url: "https://eng.corteqs.net" },
    ]);
    const segments = parseRichText(content);
    const links = segments.filter((segment) => segment.kind === "link");

    expect(links).toHaveLength(2);
    expect(links[0]).toMatchObject({ text: "Vize Rehberi", href: "/blog/vize", external: false });
    expect(links[1]).toMatchObject({ text: "Engine", href: "https://eng.corteqs.net", external: true });
    expect(segments.some((segment) => segment.kind === "bold" && segment.text === "Kaynaklar")).toBe(true);
  });
});
