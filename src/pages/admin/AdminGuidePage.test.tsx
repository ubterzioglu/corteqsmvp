// AdminGuidePage — kılavuz sayfası render testleri.

import { render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";

import AdminGuidePage from "./AdminGuidePage";

function renderGuidePage() {
  return render(
    <MemoryRouter>
      <AdminGuidePage />
    </MemoryRouter>,
  );
}

describe("AdminGuidePage", () => {
  it("başlık ve açıklama görünür", () => {
    renderGuidePage();

    expect(screen.getByRole("heading", { level: 1, name: "Admin Kullanım Kılavuzu" })).toBeInTheDocument();
    expect(screen.getByText(/bölümler sol menü gruplarını izler/i)).toBeInTheDocument();
  });

  it("içindekiler tüm bölümlere anchor link verir", () => {
    renderGuidePage();

    const toc = screen.getByRole("navigation", { name: "Kılavuz içindekiler" });
    const links = within(toc).getAllByRole("link");
    expect(links.length).toBeGreaterThanOrEqual(10);
    expect(links[0]).toHaveAttribute("href", "#giris-yetki");
  });

  it("ana modül bölümleri ve ilgili ekran linkleri mevcut", () => {
    renderGuidePage();

    expect(screen.getByRole("heading", { name: /Üyeler ve Dizin/ })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /Roller ve AFS/ })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /Muhasebe/ })).toBeInTheDocument();

    expect(
      screen.getByRole("link", { name: "Derin referans: Sistem Kullanım Kılavuzu (AFS)" }),
    ).toHaveAttribute("href", "/admin/new-member/guide");
    expect(screen.getByRole("link", { name: "Ürün Güncellemeleri" })).toHaveAttribute("href", "/admin/about");
  });
});
