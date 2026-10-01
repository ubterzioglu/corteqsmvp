import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";

import ChatMessage from "@/components/chat/ChatMessage";
import type { ChatMessage as ChatMessageType } from "@/lib/chatConfig";

function createBotMessage(content: string): ChatMessageType {
  return { id: "m1", role: "bot", content, timestamp: 0 };
}

function renderMessage(content: string) {
  return render(
    <MemoryRouter>
      <ChatMessage message={createBotMessage(content)} />
    </MemoryRouter>,
  );
}

describe("ChatMessage bağlantı işleme (N06)", () => {
  it("iç yol tıklanabilir link üretir", () => {
    renderMessage("Kayıtlara bak: [Kayıt Veritabanı](/admin/data)");

    const link = screen.getByRole("link", { name: "Kayıt Veritabanı" });
    expect(link).toHaveAttribute("href", "/admin/data");
    // İç link yeni sekme AÇMAZ.
    expect(link).not.toHaveAttribute("target");
  });

  it("https hedefi yeni sekmede, noopener ile açılır", () => {
    renderMessage("[Engine](https://eng.corteqs.net) dış araçtır.");

    const link = screen.getByRole("link", { name: "Engine" });
    expect(link).toHaveAttribute("href", "https://eng.corteqs.net");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("javascript: hedefi link ÜRETMEZ, etiket düz metin kalır", () => {
    renderMessage("Tıkla: [Kazanç](javascript:alert(1))");

    expect(screen.queryByRole("link")).toBeNull();
    expect(screen.getByText("Kazanç")).toBeInTheDocument();
    // Ham markdown da gösterilmez.
    expect(screen.queryByText(/javascript:/)).toBeNull();
  });

  it("protocol-relative hedefler (// ve /\\) dış siteye kaçamaz", () => {
    const { unmount } = renderMessage("[A](//evil.com) ve [B](/\\evil.com)");
    expect(screen.queryByRole("link")).toBeNull();
    unmount();
  });

  it("http:// (şifresiz) hedef link olmaz — yalnız https kabul", () => {
    renderMessage("[Eski](http://example.com)");
    expect(screen.queryByRole("link")).toBeNull();
  });

  it("Kaynaklar bloğu: satırların hepsi tıklanabilir, başlık kalın", () => {
    renderMessage(
      "Yanıt metni.\n\n**Kaynaklar**\n- [Vize Rehberi](/blog/vize)\n- [Üyeler](/admin/data)",
    );

    expect(screen.getByText("Kaynaklar").tagName).toBe("STRONG");
    expect(screen.getByRole("link", { name: "Vize Rehberi" })).toHaveAttribute("href", "/blog/vize");
    expect(screen.getByRole("link", { name: "Üyeler" })).toHaveAttribute("href", "/admin/data");
  });

  it("mevcut **kalın** davranışı aynen korunur", () => {
    renderMessage("Bu **önemli** bir nottur.");

    const strong = screen.getByText("önemli");
    expect(strong.tagName).toBe("STRONG");
    expect(strong).toHaveClass("font-semibold");
    expect(screen.getByText(/Bu/)).toBeInTheDocument();
  });

  it("markdown içermeyen metin değişmeden görünür", () => {
    renderMessage("Merhaba, nasıl yardımcı olabilirim?");
    expect(screen.getByText("Merhaba, nasıl yardımcı olabilirim?")).toBeInTheDocument();
    expect(screen.queryByRole("link")).toBeNull();
  });
});
