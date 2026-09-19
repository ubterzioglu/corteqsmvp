import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";

import HeroNetworkSection from "./HeroNetworkSection";

function renderHero() {
  return render(
    <MemoryRouter>
      <HeroNetworkSection />
    </MemoryRouter>,
  );
}

describe("ana sayfa hero", () => {
  it("üç birincil çağrıyı çizer", () => {
    renderHero();
    expect(screen.getByRole("link", { name: /Ağa Katıl/ })).toHaveAttribute("href", "/login?mode=signup");
    expect(screen.getByRole("link", { name: /Araçlar!/ })).toHaveAttribute("href", "/tools");
    expect(screen.getByRole("button", { name: /Ağı keşfet/ })).toBeInTheDocument();
  });

  it("ikincil kısayol şeridi üst menüdeki hedeflere gider", () => {
    renderHero();
    const nav = screen.getByRole("navigation", { name: "Hızlı erişim" });

    const targets = Array.from(nav.querySelectorAll("a")).map((anchor) => [
      anchor.textContent,
      anchor.getAttribute("href"),
    ]);

    expect(targets).toEqual([
      ["Radar", "/radar"],
      ["Dijital Gruplar", "/addcom"],
      ["Etkinlikler", "/events"],
      ["Geri Bildirim", "/feedback"],
    ]);
  });

  it("Araçlar kısayol şeridinde TEKRARLANMAZ", () => {
    renderHero();
    // Yukarıda turuncu birincil buton olarak duruyor; şeritte ikinci kez görünmemeli.
    expect(screen.getAllByRole("link", { name: /Araçlar/ })).toHaveLength(1);

    const nav = screen.getByRole("navigation", { name: "Hızlı erişim" });
    expect(nav.textContent).not.toContain("Araçlar");
  });
});
