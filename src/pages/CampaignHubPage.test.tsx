import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import { PAGE_SEO } from "@/lib/page-seo";
import { useSeo } from "@/lib/seo";
import CampaignHubPage from "@/pages/CampaignHubPage";

vi.mock("@/lib/seo", () => ({ useSeo: vi.fn() }));

const renderPage = () =>
  render(
    <MemoryRouter initialEntries={["/campaign"]}>
      <CampaignHubPage />
    </MemoryRouter>,
  );

describe("CampaignHubPage", () => {
  // 2026-09-25: başlıktaki tek "Kampanya & Yarışmalar" menüsü bu sayfaya gelir;
  // SEO başlığı menüyle aynı adı taşır.
  it("SEO başlığını Kampanya & Yarışmalar olarak verir", () => {
    renderPage();

    expect(useSeo).toHaveBeenCalledWith(PAGE_SEO.campaign, []);
    expect(PAGE_SEO.campaign.title).toBe("Kampanya & Yarışmalar | CorteQS");
    expect(PAGE_SEO.campaign.canonicalPath).toBe("/campaign");
  });

  // Tek merkez ekran: kartlar detay sayfalarına gitmeye devam eder.
  it("kampanya kartlarını detay sayfalarına bağlar", () => {
    renderPage();

    const hrefs = screen
      .getAllByRole("link")
      .map((link) => link.getAttribute("href"));

    expect(hrefs).toEqual(["/campaign/founding-1000", "/campaign/vlogger", "/campaign/blogger"]);
  });

  // Görünen ad "Kurucu 1000"dır; URL (/campaign/founding-1000) değişmedi.
  it("Kurucu 1000 adını kullanır, eski Founding 1000 metnini göstermez", () => {
    const { container } = renderPage();

    expect(screen.getByRole("heading", { level: 2, name: "Kurucu 1000" })).toBeInTheDocument();
    expect(container.textContent).not.toMatch(/Found(?:ing|ers) 1000/);
  });

  // Rozet adı da Türkçedir (2026-09-25): "Founding Verified User" → "Kurucu Onaylı Üye".
  it("rozet adını Türkçe gösterir", () => {
    const { container } = renderPage();

    expect(container.textContent).toContain("Kurucu Onaylı Üye");
    expect(container.textContent).not.toMatch(/Founding (?:Verified|User)/i);
  });
});
