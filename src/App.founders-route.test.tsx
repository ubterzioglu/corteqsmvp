import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Outlet } from "react-router-dom";

import App from "@/App";

vi.mock("@/pages/AdminLansmanPage.tsx", () => ({
  default: () => <div>Standalone Lansman Admin Page</div>,
}));

vi.mock("@/components/admin/AdminLayout", () => ({
  default: () => (
    <div>
      <div>Shared Admin Layout</div>
      <Outlet />
    </div>
  ),
}));

describe("App founders routing", () => {
  beforeEach(() => {
    window.history.pushState({}, "", "/founders");
  });

  afterEach(() => {
    window.history.pushState({}, "", "/");
  });

  it("renders the founders page on /founders", () => {
    render(<App />);

    expect(screen.getByRole("link", { name: "CorteQS CorteQS MVP Global Türk Diaspora Network" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Burak Akçakanat" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Umut Barış Terzioğlu" })).toBeInTheDocument();
    expect(screen.getByAltText("CorteQS kurucular logosu")).toBeInTheDocument();
    expect(screen.getByAltText("Burak Akçakanat profil fotoğrafı")).toBeInTheDocument();
    expect(screen.getByAltText("Umut Barış Terzioğlu profil fotoğrafı")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Burak Akçakanat LinkedIn profili" })).toHaveAttribute(
      "href",
      "https://www.linkedin.com/in/burakakcakanat/",
    );
    expect(screen.getByRole("link", { name: "Umut Barış Terzioğlu LinkedIn profili" })).toHaveAttribute(
      "href",
      "https://www.linkedin.com/in/ubterzioglu",
    );
    const burakAccordionButton = screen.getByRole("button", { name: /Kurucu Ortak Burak Akçakanat/i });
    const umutAccordionButton = screen.getByRole("button", { name: /Kurucu Ortak Umut Barış Terzioğlu/i });

    expect(burakAccordionButton).toHaveAttribute("data-state", "closed");
    expect(umutAccordionButton).toHaveAttribute("data-state", "closed");

    fireEvent.click(umutAccordionButton);

    expect(burakAccordionButton).toHaveAttribute("data-state", "open");
    expect(umutAccordionButton).toHaveAttribute("data-state", "open");
    expect(screen.getByText("Ürün güveni odaklı kalite yaklaşımı")).toBeInTheDocument();
    expect(screen.getByText("Disiplinli test stratejisi")).toBeInTheDocument();
    expect(screen.getByText("Süreç optimizasyonu bakışı")).toBeInTheDocument();
    expect(screen.getByText("Ölçeklenebilir otomasyon becerisi")).toBeInTheDocument();
    expect(screen.getByText("Kurumsal güvenilirlik odağı")).toBeInTheDocument();
    expect(screen.getByText("Topluluk uyumlu teknik mimari")).toBeInTheDocument();
    expect(screen.getByText("Kaliteyi koruyan sistem tasarımı")).toBeInTheDocument();
    expect(screen.getByText("Operasyonel düzen kurma disiplini")).toBeInTheDocument();
    expect(screen.getByText("Diaspora ihtiyaçlarına ürün yaklaşımı")).toBeInTheDocument();

    fireEvent.click(burakAccordionButton);

    expect(burakAccordionButton).toHaveAttribute("data-state", "closed");
    expect(umutAccordionButton).toHaveAttribute("data-state", "closed");
  });
});
