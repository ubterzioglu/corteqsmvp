import { fireEvent, render, screen, within } from "@testing-library/react";
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
    // Etiket 2026-09-20'de "Ağa Katıl" → "Ücretsiz kayıt ol!" oldu (kullanıcı
    // kararı): "ağa katıl" ücretsizliği söylemiyordu.
    expect(screen.getByRole("link", { name: /Ücretsiz kayıt ol!/ })).toHaveAttribute(
      "href",
      "/login?mode=signup",
    );
    expect(screen.queryByRole("link", { name: /Ağa Katıl/ })).not.toBeInTheDocument();
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

  // Kullanıcı kararı 2026-09-20: mobilde on düğme alt alta çok yer kaplıyordu.
  // İlk ÜÇÜ açık kalır, kalanlar aç/kapa düğmesinin arkasına girer. Gizleme
  // SINIFLA yapılır (jsdom CSS uygulamaz), bu yüzden iddia sınıf üzerinedir —
  // DOM sırası masaüstündeki 5 + 5 sözleşmesi için değişmeden kalmalı.
  describe("mobil aç/kapa", () => {
    const isHiddenOnMobile = (element: HTMLElement) =>
      element.className.includes("hidden sm:inline-flex");

    it("mobilde yalnız ilk üç düğmeyi açık bırakır", () => {
      renderHero();

      const rowOne = screen.getByRole("navigation", { name: "Ana eylemler" });
      const buttons = Array.from(rowOne.children) as HTMLElement[];

      expect(buttons.slice(0, 3).map(isHiddenOnMobile)).toEqual([false, false, false]);
      expect(buttons.slice(3).map(isHiddenOnMobile)).toEqual([true, true]);
      expect(screen.getByRole("navigation", { name: "Hızlı erişim" })).toHaveClass("hidden");
    });

    it("aç/kapa düğmesi tüm kısayolları açar ve kapatır", () => {
      renderHero();

      const toggle = screen.getByRole("button", { name: /Tüm kısayollar/ });
      expect(toggle).toHaveAttribute("aria-expanded", "false");

      fireEvent.click(toggle);

      expect(screen.getByRole("navigation", { name: "Hızlı erişim" })).not.toHaveClass("hidden");
      expect(
        Array.from(screen.getByRole("navigation", { name: "Ana eylemler" }).children).some((child) =>
          isHiddenOnMobile(child as HTMLElement),
        ),
      ).toBe(false);

      fireEvent.click(screen.getByRole("button", { name: /Daha az göster/ }));

      expect(screen.getByRole("navigation", { name: "Hızlı erişim" })).toHaveClass("hidden");
    });
  });

  it("Araçlar kısayol şeridinde TEKRARLANMAZ", () => {
    renderHero();
    // Yukarıda turuncu birincil buton olarak duruyor; şeritte ikinci kez görünmemeli.
    expect(screen.getAllByRole("link", { name: /Araçlar/ })).toHaveLength(1);

    const nav = screen.getByRole("navigation", { name: "Hızlı erişim" });
    expect(nav.textContent).not.toContain("Araçlar");
  });
});
