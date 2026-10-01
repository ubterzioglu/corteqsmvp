// N02 sözleşmesi — SIDEBAR'IN ÇİZDİĞİ numaralar ↔ `buildAdminMenuCatalog()`.
//
// Bu testin kapattığı sınıf: **iki ayrı sayaç.** Numara sidebar'da bir yerden,
// bot korpusunda (N04) başka bir yerden hesaplanırsa ikisi sessizce ayrışır —
// bot "17'ye bak" der, menüde 17'de başka bir sayfa yazar. Hiçbir şey patlamaz,
// yalnız kullanıcı yanlış yere bakar.
//
// Bu yüzden burada katalogu YENİDEN HESAPLAMIYORUZ; sidebar'ın gerçekten
// render ettiği DOM okunuyor ve katalogla karşılaştırılıyor.
import { render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";

import AdminSidebar from "@/components/admin/shell/AdminSidebar";
import { buildAdminMenuCatalog } from "@/lib/admin-shell/admin-menu-numbering";
import type { AdminFavoritesState } from "@/hooks/admin/useAdminFavorites";

// ⚠️ Favori listesi BOŞ bırakıldı: sidebar favorileri en üstte TEKRAR çizer ve
// o satırlar da kendi numaralarını taşır. Dolu bir favori listesiyle DOM'daki
// numara dizisi katalog sırasını izlemez (aynı numara iki kez, üstte önce
// görünür) — test o yüzden favorisiz durumu ölçer. Favorilerin numarası
// gruptakiyle AYNI olduğu için bu bir kapsam kaybı değil.
const noFavorites: AdminFavoritesState = {
  favoriteIds: [],
  favoriteEntries: [],
  isFavorite: () => false,
  toggleFavorite: () => {},
};

function renderSidebar(collapsed = false) {
  return render(
    <MemoryRouter initialEntries={["/admin"]}>
      <AdminSidebar collapsed={collapsed} onToggleCollapsed={() => {}} favorites={noFavorites} />
    </MemoryRouter>,
  );
}

/** DOM'da çizilmiş numara rozetlerini görünüm sırasıyla toplar. */
function renderedNumbers(container: HTMLElement): string[] {
  return [...container.querySelectorAll("span.font-mono")]
    .map((node) => node.textContent?.trim() ?? "")
    .filter((text) => /^\d+(\.\d+)?$/.test(text));
}

describe("N02 · sidebar numaraları", () => {
  it("üst seviye numaraları katalogla BİREBİR aynı ve artan sırada", () => {
    const { container } = renderSidebar();
    const drawn = renderedNumbers(container);

    // Kapalı gruplar ve kapalı "İnaktif" bölümü yüzünden DOM'da katalogun
    // tamamı olmayabilir — ama çizilen HER numara katalogda olmalı ve
    // çizilenler kendi aralarında katalog sırasını korumalı.
    const catalogOrder = buildAdminMenuCatalog().map((entry) => entry.number);
    expect(drawn.length).toBeGreaterThan(0);

    for (const number of drawn) {
      expect(catalogOrder, `${number} katalogda yok`).toContain(number);
    }

    const positions = drawn.map((number) => catalogOrder.indexOf(number));
    expect(positions, "çizim sırası katalog sırasıyla uyuşmuyor").toEqual(
      [...positions].sort((a, b) => a - b),
    );
  });

  it("numara ile etiket AYNI satırda — bot referansı yanlış satıra düşmesin", () => {
    const { container } = renderSidebar();
    const catalog = buildAdminMenuCatalog();
    const drawn = renderedNumbers(container);
    const firstNumber = drawn[0];
    const expectedLabel = catalog.find((entry) => entry.number === firstNumber)?.label;

    const badge = [...container.querySelectorAll("span.font-mono")].find(
      (node) => node.textContent?.trim() === firstNumber,
    );
    const row = badge?.closest("a, button") as HTMLElement | null;

    expect(row, "numara rozetinin satırı bulunamadı").not.toBeNull();
    expect(within(row!).getByText(expectedLabel!)).toBeInTheDocument();
  });

  it("numara ekran okuyucudan GİZLENMEZ", () => {
    // `aria-hidden` konulsaydı sesli okumada "Üyeler" denir, botun verdiği
    // "17. sıra" referansı karşılıksız kalırdı.
    const { container } = renderSidebar();
    const badge = [...container.querySelectorAll("span.font-mono")].find((node) =>
      /^\d+(\.\d+)?$/.test(node.textContent?.trim() ?? ""),
    );

    expect(badge).toBeDefined();
    expect(badge?.getAttribute("aria-hidden")).toBeNull();
    expect(badge?.closest("[aria-hidden='true']")).toBeNull();
  });

  it("DARALTILMIŞ sidebar'da numara ÇİZİLMEZ (72px kolona sığmaz)", () => {
    const { container } = renderSidebar(true);
    expect(renderedNumbers(container)).toHaveLength(0);
  });

  it("ilk öğe 1 numarayı alır", () => {
    const { container } = renderSidebar();
    expect(renderedNumbers(container)[0]).toBe("1");
    expect(screen.getAllByText(buildAdminMenuCatalog()[0].label).length).toBeGreaterThan(0);
  });
});
