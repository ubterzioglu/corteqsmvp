// A12a sözleşmesi (29.09 kullanıcı kararı):
//   · balon her sayfada görünür (App kökünde mount),
//   · giriş yapmamış kullanıcı YAZAMAZ — istek hiç gönderilmez,
//   · ScrollTopButton yuvarlak + turuncu + beyaz ok, "UP" yazısı yok.
// A10 sözleşmesi:
//   · ~2 sn sonra ipucu balonu gösterilir (panel OTOMATİK AÇILMAZ)
//   · ipucu 5 sn sonra otomatik kapanır
//   · ipucuna tıklanınca panel açılır
//   · simgeye tıklanınca ipucu gizlenir
//   · sessionStorage erişilemezse ipucu gösterilmez
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

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
    vi.useFakeTimers();
    sessionStorage.clear();
    renderBubble();

    expect(screen.queryByTestId("assistant-panel")).toBeNull();

    fireEvent.click(screen.getByTestId("assistant-bubble"));

    expect(screen.getByTestId("assistant-panel")).toBeInTheDocument();
    expect(screen.getByText("CorteQS Asistanı")).toBeInTheDocument();
    vi.useRealTimers();
  });

  it("kapat düğmesi paneli kapatır", () => {
    vi.useFakeTimers();
    sessionStorage.clear();
    renderBubble();

    fireEvent.click(screen.getByTestId("assistant-bubble"));
    fireEvent.click(screen.getByLabelText("Asistan penceresini kapat"));

    expect(screen.queryByTestId("assistant-panel")).toBeNull();
    vi.useRealTimers();
  });

  it("giriş yapmamış kullanıcı YAZAMAZ: istek gönderilmez, giriş mesajı gösterilir", async () => {
    vi.useRealTimers(); // Bu test gerçek timers kullanır
    sessionStorage.clear();
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

describe("AssistantBubble — A10 ipucu balonu", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    sessionStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("2 sn sonra ipucu balonu gösterilir (panel OTOMATİK AÇILMAZ)", () => {
    renderBubble();

    // Başlangıçta ipucu yok
    expect(screen.queryByTestId("assistant-hint")).toBeNull();
    expect(screen.queryByTestId("assistant-panel")).toBeNull();

    // 2 sn ilerlet
    act(() => {
      vi.advanceTimersByTime(2000);
    });

    // İpucu gösterilir, panel HÂLÂ kapalı
    expect(screen.getByTestId("assistant-hint")).toBeInTheDocument();
    expect(screen.queryByTestId("assistant-panel")).toBeNull();
  });

  it("ipucu 5 sn sonra otomatik kapanır", () => {
    renderBubble();

    // 2 sn: ipucu gösterilir
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(screen.getByTestId("assistant-hint")).toBeInTheDocument();

    // 5 sn daha: ipucu kapanır
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(screen.queryByTestId("assistant-hint")).toBeNull();
  });

  it("ipucuna tıklanınca panel açılır ve ipucu gizlenir", () => {
    renderBubble();

    // 2 sn: ipucu gösterilir
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(screen.getByTestId("assistant-hint")).toBeInTheDocument();

    // İpucuna tıkla
    fireEvent.click(screen.getByTestId("assistant-hint"));

    // İpucu gizlenir, panel açılır
    expect(screen.queryByTestId("assistant-hint")).toBeNull();
    expect(screen.getByTestId("assistant-panel")).toBeInTheDocument();
  });

  it("simgeye tıklanınca ipucu gizlenir", () => {
    renderBubble();

    // 2 sn: ipucu gösterilir
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(screen.getByTestId("assistant-hint")).toBeInTheDocument();

    // Simgeye tıkla
    fireEvent.click(screen.getByTestId("assistant-bubble"));

    // İpucu gizlenir, panel açılır
    expect(screen.queryByTestId("assistant-hint")).toBeNull();
    expect(screen.getByTestId("assistant-panel")).toBeInTheDocument();
  });

  it("ikinci mount'ta ipucu gösterilmez (sessionStorage)", () => {
    // İlk mount
    const { unmount } = renderBubble();
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(screen.getByTestId("assistant-hint")).toBeInTheDocument();

    // Kapat
    unmount();

    // sessionStorage'da anahtar var mı kontrol et
    expect(sessionStorage.getItem("corteqs_assistant_welcome_shown")).toBe("1");

    // İkinci mount
    renderBubble();
    act(() => {
      vi.advanceTimersByTime(2000);
    });

    // İpucu gösterilmez
    expect(screen.queryByTestId("assistant-hint")).toBeNull();
  });

  it("sessionStorage erişilemezse ipucu gösterilmez", () => {
    // sessionStorage.getItem'ı mock'la
    const getItemSpy = vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("storage disabled");
    });

    try {
      renderBubble();
      act(() => {
        vi.advanceTimersByTime(2000);
      });

      // İpucu gösterilmez
      expect(screen.queryByTestId("assistant-hint")).toBeNull();
    } finally {
      getItemSpy.mockRestore();
    }
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
