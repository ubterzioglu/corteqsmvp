import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import ChatBot from "@/components/chat/ChatBot";

const { askSiteAssistantMock } = vi.hoisted(() => ({
  askSiteAssistantMock: vi.fn(),
}));

vi.mock("@/components/auth/useAuth", () => ({
  useAuth: () => ({ user: { id: "admin-1" } }),
}));

vi.mock("@/lib/site-assistant-api", () => ({
  askSiteAssistant: askSiteAssistantMock,
}));

describe("ChatBot panel bağlamı", () => {
  it("assistant query değerini gönderme yapmadan giriş alanına doldurur", () => {
    const prompt = "Agent kullanım analitiğini nasıl yorumlamalıyım?";
    render(
      <MemoryRouter initialEntries={[`/landingtrial?assistant=${encodeURIComponent(prompt)}#kaydol`]}>
        <ChatBot />
      </MemoryRouter>,
    );

    expect(screen.getByPlaceholderText("Mesajını yaz...")).toHaveValue(prompt);
    expect(askSiteAssistantMock).not.toHaveBeenCalled();
  });
});
