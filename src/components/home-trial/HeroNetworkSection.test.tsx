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
 * Düğme metni yerine HEDEF listesi karşılaştırılır: "Kampanya & Yarışmalar" düğmesi
 * DEMO rozeti taşıdığı için `textContent` "Kampanya & YarışmalarDEMO" döner ve metne dayalı bir
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

  // Kullanıcı kararı 2026-09-20: hero'daki düğmeler TAM İKİ SATIR. 2026-09-25'te
  // Kampanyalar ve Yarışmalar tek düğmeye indiği için 5 + 4.
  // Satır başına düşen sayı değişirse düzen sözleşmesi bozulur.
  it("düğmeleri iki satıra 5 + 4 böler", () => {
    renderHero();

    const rowOne = screen.getByRole("navigation", { name: "Ana eylemler" });
    const rowTwo = screen.getByRole("navigation", { name: "Hızlı erişim" });

    // "Ağı keşfet" bir <button> (aynı sayfada kaydırır), bu yüzden link sayısı 4.
    expect(hrefsIn(rowOne)).toEqual(["/login?mode=signup", "/tools", "/founders", "/campaign"]);
    expect(within(rowOne).getAllByRole("button")).toHaveLength(1);

    expect(hrefsIn(rowTwo)).toEqual(["/radar", "/addcom", "/events", "/feedback"]);
  });

  // Kullanıcı kararı 2026-09-25: Kampanyalar ve Yarışmalar TEK düğme, başlıktaki
  // menüyle aynı ad. Aynı hedefe giden ikinci bir düğme geri gelmemeli.
  it("tek bir Kampanya & Yarışmalar düğmesi çizer", () => {
    renderHero();

    const links = screen.getAllByRole("link", { name: /Kampanya|Yarışma/ });
    expect(links).toHaveLength(1);
    expect(links[0]).toHaveAttribute("href", "/campaign");
    expect(links[0]).toHaveTextContent("Kampanya & Yarışmalar");
  });

  // DEMO deseni (bkz. src/lib/demo-pages.ts): merkezdeki yarışma içeriği gerçek
  // değil, düğme bunu rozetle söylemeli.
  it("Kampanya & Yarışmalar düğmesi DEMO rozeti taşır", () => {
    renderHero();

    expect(
      within(screen.getByRole("link", { name: /Kampanya & Yarışmalar/ })).getByText("DEMO"),
    ).toBeInTheDocument();
  });

  // Kullanıcı kararı 2026-09-20: mobilde düğmeler alt alta çok yer kaplıyordu.
  // İlk ÜÇÜ açık kalır, kalanlar aç/kapa düğmesinin arkasına girer. Gizleme
  // SINIFLA yapılır (jsdom CSS uygulamaz), bu yüzden iddia sınıf üzerinedir —
  // DOM sırası masaüstündeki 5 + 4 sözleşmesi için değişmeden kalmalı.
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
