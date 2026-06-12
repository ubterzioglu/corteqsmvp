// AdminCaddeGuidePage — Cadde Kural Kitabı render testleri.

import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";

import AdminCaddeGuidePage from "./AdminCaddeGuidePage";

function renderCaddeGuidePage() {
  return render(
    <MemoryRouter>
      <AdminCaddeGuidePage />
    </MemoryRouter>,
  );
}

describe("AdminCaddeGuidePage", () => {
  it("başlık ve açıklama görünür", () => {
    renderCaddeGuidePage();

    expect(screen.getByText("Cadde Kural Kitabı")).toBeInTheDocument();
    expect(screen.getByText(/günlük dille, adım adım anlatır/)).toBeInTheDocument();
  });

  it("üye ve admin bölümleri tam listelenir", () => {
    renderCaddeGuidePage();

    // Üye tarafı (1-8) ve admin tarafı (9-12) ara başlıkları
    expect(screen.getByText(/Üye tarafı — Cadde üyeler için nasıl çalışır\?/)).toBeInTheDocument();
    expect(screen.getByText(/Admin tarafı — Cadde nasıl yönetilir\?/)).toBeInTheDocument();

    // Bölüm başlıklarından örnekler
    expect(screen.getByText("1. Cadde nedir? Kısa tanıtım")).toBeInTheDocument();
    expect(screen.getByText("4. Köprü nedir, kim Köprü'ye yazabilir?")).toBeInTheDocument();
    expect(screen.getByText("9. Admin tarafı: dört ekran, dört görev")).toBeInTheDocument();
    expect(screen.getByText("12. Önerilen günlük moderasyon rutini")).toBeInTheDocument();
  });

  it("admin ekranlarına ve canlı Cadde'ye linkler doğru hedefe gider", () => {
    renderCaddeGuidePage();

    expect(screen.getByRole("link", { name: "Cadde Yönetimi" })).toHaveAttribute("href", "/admin/cadde");
    expect(screen.getByRole("link", { name: "Moderasyon Kuyruğu" })).toHaveAttribute("href", "/admin/cadde/moderation");
    expect(screen.getByRole("link", { name: "Tanıtım Onayı" })).toHaveAttribute("href", "/admin/cadde/promotions");
    expect(screen.getByRole("link", { name: "Çarşı Denetimi" })).toHaveAttribute("href", "/admin/cadde/carsi");
    expect(screen.getByRole("link", { name: "Canlı Cadde'yi Aç" })).toHaveAttribute("href", "/cadde");
  });
});
