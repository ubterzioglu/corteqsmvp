import { render, screen, within } from "@testing-library/react";
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

/**
 * Düğme metni yerine HEDEF listesi karşılaştırılır: "Yarışmalar" düğmesi DEMO
 * rozeti taşıdığı için `textContent` "YarışmalarDEMO" döner ve metne dayalı bir
 * iddia rozet eklendiği anda sahte biçimde kırılırdı.
 */
const hrefsIn = (nav: HTMLElement) =>
  Array.from(nav.querySelectorAll("a")).map((anchor) => anchor.getAttribute("href"));

describe("ana sayfa hero", () => {
  it("birincil çağrıları çizer", () => {
    renderHero();
    expect(screen.getByRole("link", { name: /Ağa Katıl/ })).toHaveAttribute("href", "/login?mode=signup");
    expect(screen.getByRole("link", { name: /Araçlar!/ })).toHaveAttribute("href", "/tools");
    expect(screen.getByRole("button", { name: /Ağı keşfet/ })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Biz kimiz\?/ })).toHaveAttribute("href", "/founders");
  });

  // Kullanıcı kararı 2026-09-20: hero'daki düğmeler TAM İKİ SATIR, 5 + 5.
  // Satır başına düşen sayı değişirse düzen sözleşmesi bozulur.
  it("düğmeleri iki satıra beşer beşer böler", () => {
    renderHero();

    const rowOne = screen.getByRole("navigation", { name: "Ana eylemler" });
    const rowTwo = screen.getByRole("navigation", { name: "Hızlı erişim" });

    // "Ağı keşfet" bir <button> (aynı sayfada kaydırır), bu yüzden link sayısı 4.
    expect(hrefsIn(rowOne)).toEqual(["/login?mode=signup", "/tools", "/founders", "/campaign"]);
    expect(within(rowOne).getAllByRole("button")).toHaveLength(1);

    expect(hrefsIn(rowTwo)).toEqual(["/campaign", "/radar", "/addcom", "/events", "/feedback"]);
  });

  // Kampanyalar ve Yarışmalar bilerek AYNI hedefe gider (action-buttons-data.ts).
  it("Kampanyalar ve Yarışmalar aynı hedefi paylaşır", () => {
    renderHero();

    expect(screen.getByRole("link", { name: /Kampanyalar/ })).toHaveAttribute("href", "/campaign");
    expect(screen.getByRole("link", { name: /Yarışmalar/ })).toHaveAttribute("href", "/campaign");
  });

  // DEMO deseni (bkz. src/lib/demo-pages.ts): yarışma içeriği gerçek değil,
  // düğme bunu rozetle söylemeli.
  it("Yarışmalar düğmesi DEMO rozeti taşır, Kampanyalar taşımaz", () => {
    renderHero();

    expect(within(screen.getByRole("link", { name: /Yarışmalar/ })).getByText("DEMO")).toBeInTheDocument();
    expect(
      within(screen.getByRole("link", { name: /Kampanyalar/ })).queryByText("DEMO"),
    ).not.toBeInTheDocument();
  });

  it("Araçlar kısayol şeridinde TEKRARLANMAZ", () => {
    renderHero();
    // Yukarıda turuncu birincil buton olarak duruyor; şeritte ikinci kez görünmemeli.
    expect(screen.getAllByRole("link", { name: /Araçlar/ })).toHaveLength(1);

    const nav = screen.getByRole("navigation", { name: "Hızlı erişim" });
    expect(nav.textContent).not.toContain("Araçlar");
  });
});
