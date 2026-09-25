import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import Founding1000Page from "@/pages/Founding1000Page";

vi.mock("@/components/Founding1000Section", () => ({
  default: () => <div data-testid="founding-section" />,
}));

vi.mock("@/lib/seo", () => ({ useSeo: vi.fn() }));

const renderPage = () =>
  render(
    <MemoryRouter initialEntries={["/founding-1000"]}>
      <Founding1000Page />
    </MemoryRouter>,
  );

describe("Founding1000Page", () => {
  it("renders the founding section", () => {
    const { container } = renderPage();

    expect(container.querySelector("main")).toBeTruthy();
  });

  // Sayfanın 2026-09-20 öncesinde HİÇ h1'i yoktu; başlık bölüm içinde h2 idi.
  // Hero geldiğinde tek h1 buraya taşındı — geri alınırsa bu iddia düşer.
  it("tek bir h1 çizer ve başlığı hero'dan alır", () => {
    const { container } = renderPage();

    const headings = container.querySelectorAll("h1");
    expect(headings).toHaveLength(1);
    // Görünen ad 2026-09-25'te "Kurucu 1000" oldu (satırlar ayrı span'lerde çizilir).
    expect(headings[0].textContent).toBe("Kurucu1000");
    expect(headings[0].textContent).not.toMatch(/Founding/i);
  });

  it("hero görseline gerçek bir alt metin verir (dekoratif değil)", () => {
    renderPage();

    expect(
      screen.getByAltText("Uzaydan görünen dünya üzerinde ışıkla birbirine bağlanan şehirler"),
    ).toBeInTheDocument();
  });
});
