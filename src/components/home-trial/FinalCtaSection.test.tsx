import { render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";

import FinalCtaSection from "./FinalCtaSection";

const renderCta = () =>
  render(
    <MemoryRouter>
      <FinalCtaSection />
    </MemoryRouter>,
  );

const hrefsIn = (nav: HTMLElement) =>
  Array.from(nav.querySelectorAll("a")).map((anchor) => anchor.getAttribute("href"));

describe("ana sayfa kapanış kartı", () => {
  // Kullanıcı kararı 2026-09-20: kart genişledi ve düğmeler TAM İKİ SATIR
  // (2026-09-25'ten beri 5 + 4 — Kampanyalar ve Yarışmalar tek düğme).
  // Önceden 4 + 6 verilip sarmaya bırakılıyordu ve canlıda 4/4/2 diye ÜÇ satır
  // çiziliyordu — bu test o gerilemeyi geri getirmeyi engeller.
  it("düğmeleri iki satıra 5 + 4 böler", () => {
    renderCta();

    const rowOne = screen.getByRole("navigation", { name: "Kayıt eylemleri" });
    const rowTwo = screen.getByRole("navigation", { name: "Hızlı erişim (kapanış)" });

    // "Ağı keşfet" bir <button> (aynı sayfada kaydırır), bu yüzden link sayısı 4.
    expect(hrefsIn(rowOne)).toEqual(["/login?mode=signup", "/tools", "/founders", "/campaign"]);
    expect(within(rowOne).getAllByRole("button")).toHaveLength(1);

    expect(hrefsIn(rowTwo)).toEqual(["/radar", "/addcom", "/events", "/feedback"]);
  });

  // Kayıt düğmesi 2026-09-20'de TEKLEŞTİ: hero ile kapanış kartı aynı etiketi
  // kullanır ("Ücretsiz kayıt ol!"). Eskiden burada "Ücretsiz Kayıt Ol", hero'da
  // "Ağa Katıl" yazıyordu; ikisi de aynı yere gittiği için ayrışma bir kazançtan
  // çok drift kaynağıydı. Bu test yazımın geri ayrışmasını engeller.
  it("hero ile AYNI kayıt etiketini kullanır", () => {
    renderCta();

    expect(screen.getByRole("link", { name: /Ücretsiz kayıt ol!/ })).toHaveAttribute(
      "href",
      "/login?mode=signup",
    );
    expect(screen.queryByRole("link", { name: /^Ağa Katıl/ })).not.toBeInTheDocument();
  });

  // DEMO deseni (src/lib/demo-pages.ts) kapanış kartında da geçerli.
  it("Kampanya & Yarışmalar düğmesi DEMO rozeti taşır", () => {
    renderCta();

    expect(screen.getAllByRole("link", { name: /Kampanya|Yarışma/ })).toHaveLength(1);
    expect(
      within(screen.getByRole("link", { name: /Kampanya & Yarışmalar/ })).getByText("DEMO"),
    ).toBeInTheDocument();
  });
});
