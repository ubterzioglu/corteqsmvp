import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

import CaddeFeaturedSpotlight from "./CaddeFeaturedSpotlight";
import { isInternalCaddeLink } from "@/lib/cadde-links";
import type { CaddeBillboardCard } from "@/lib/cadde-types";

const card = (overrides: Partial<CaddeBillboardCard> = {}): CaddeBillboardCard => ({
  id: "card-1",
  type: "consultant",
  title: "Almanya 101",
  subtitle: "Taşınma danışmanlığı",
  description: "Berlin'e taşınanlar için ilk adım rehberi.",
  badgeText: null,
  ctaLabel: "Profili Gör",
  ctaUrl: "/directory/profile/u-1",
  imageUrl: null,
  isFeatured: true,
  ...overrides,
});

const renderSpotlight = (value: CaddeBillboardCard | null) =>
  render(
    <MemoryRouter>
      <CaddeFeaturedSpotlight card={value} />
    </MemoryRouter>,
  );

describe("CaddeFeaturedSpotlight (workshop m41/m44)", () => {
  it("featured kayıt yoksa hiçbir şey çizmez (yuvayı m43 dolduracak)", () => {
    const { container } = renderSpotlight(null);

    expect(container).toBeEmptyDOMElement();
  });

  it("kartın tamamı hedef profile giden bir bağlantıdır", () => {
    renderSpotlight(card());

    const link = screen.getByRole("link", { name: /Almanya 101/ });
    expect(link).toHaveAttribute("href", "/directory/profile/u-1");
    expect(screen.getByTestId("cadde-featured-spotlight")).toBeInTheDocument();
    expect(screen.getByText("Öne Çıkan")).toBeInTheDocument();
  });

  it("dış bağlantı yeni sekmede ve rel korumasıyla açılır", () => {
    renderSpotlight(card({ ctaUrl: "https://ornek.de/danisman" }));

    const link = screen.getByRole("link", { name: /Almanya 101/ });
    expect(link).toHaveAttribute("target", "_blank");
    expect(link.getAttribute("rel")).toContain("noopener");
  });

  it("isInternalCaddeLink protokol-göreli adresi dış sayar", () => {
    expect(isInternalCaddeLink("/cadde/carsi")).toBe(true);
    expect(isInternalCaddeLink("//evil.example")).toBe(false);
    expect(isInternalCaddeLink("https://ornek.de")).toBe(false);
  });
});
