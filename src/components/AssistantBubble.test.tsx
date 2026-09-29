// A12a sözleşmesi (29.09 kullanıcı kararı):
//   · balon her sayfada görünür (App kökünde mount),
//   · giriş yapmamış kullanıcı YAZAMAZ — istek hiç gönderilmez,
//   · ScrollTopButton yuvarlak + turuncu + beyaz ok, "UP" yazısı yok.
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import AssistantBubble from "@/components/AssistantBubble";
import ScrollTopButton from "@/components/ScrollTopButton";

const { askSiteAssistantMock } = vi.hoisted(() => ({ askSiteAssistantMock: vi.fn() }));

// Ziyaretçi senaryosu: kapının gerçekten kapalı olduğunu ancak user=null kanıtlar.
vi.mock("@/components/auth/useAuth", () => ({
  useAuth: () => ({ user: null }),
}));

vi.mock("@/lib/site-assistant-api", () => ({
  askSiteAssistant: askSiteAssistantMock,
}));

const renderBubble = () =>
  render(
    <MemoryRouter>
      <AssistantBubble />
    </MemoryRouter>,
  );

describe("AssistantBubble", () => {
  it("kapalı başlar; balona tıklayınca panel açılır", () => {
    renderBubble();

    expect(screen.queryByTestId("assistant-panel")).toBeNull();

    fireEvent.click(screen.getByTestId("assistant-bubble"));

    expect(screen.getByTestId("assistant-panel")).toBeInTheDocument();
    expect(screen.getByText("CorteQS Asistanı")).toBeInTheDocument();
  });

  it("kapat düğmesi paneli kapatır", () => {
    renderBubble();

    fireEvent.click(screen.getByTestId("assistant-bubble"));
    fireEvent.click(screen.getByLabelText("Asistan penceresini kapat"));

    expect(screen.queryByTestId("assistant-panel")).toBeNull();
  });

  it("giriş yapmamış kullanıcı YAZAMAZ: istek gönderilmez, giriş mesajı gösterilir", async () => {
    renderBubble();

    fireEvent.click(screen.getByTestId("assistant-bubble"));
    fireEvent.change(screen.getByPlaceholderText("Mesajını yaz..."), {
      target: { value: "Merhaba, üyelik nasıl çalışıyor?" },
    });
    fireEvent.click(screen.getByLabelText("Gönder"));

    expect(await screen.findByText(/giriş yapman gerekiyor/i)).toBeInTheDocument();
    expect(askSiteAssistantMock).not.toHaveBeenCalled();
  });
});

describe("ScrollTopButton stili (29.09 kararı)", () => {
  it("UP yazısı YOK; yuvarlak ve turuncu", () => {
    render(<ScrollTopButton />);

    const button = screen.getByTestId("scroll-top-button");

    expect(button.textContent ?? "").not.toContain("UP");
    expect(button.className).toContain("rounded-full");
    expect(button.className).toContain("bg-[#f97316]");
    expect(button.querySelector("svg"), "beyaz yukarı ok ikonu").not.toBeNull();
  });
});
