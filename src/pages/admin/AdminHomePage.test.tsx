import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Outlet, Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import AdminHomePage from "@/pages/admin/AdminHomePage";

function renderAdminHomePage(onLogout = vi.fn()) {
  return render(
    <MemoryRouter initialEntries={["/admin"]}>
      <Routes>
        <Route
          path="/admin"
          element={
            <Outlet
              context={{
                session: {
                  user: {
                    email: "admin@corteqs.test",
                  },
                },
                onLogout,
              }}
            />
          }
        >
          <Route index element={<AdminHomePage />} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
}

describe("AdminHomePage", () => {
  it("shows all header areas on the admin landing page", () => {
    const { container } = renderAdminHomePage();

    expect(screen.getByText("Header menüsündeki tüm item'lar artık tek gridde.")).toBeInTheDocument();
    expect(screen.getByRole("searchbox", { name: /admin kartlarında ara/i })).toBeInTheDocument();
    expect(screen.getByText("6 kolonlu hızlı erişim")).toBeInTheDocument();
    expect(screen.queryByText("Yeni Üye Sistemi")).not.toBeInTheDocument();
    expect(screen.queryByText("Admin Çekirdeği")).not.toBeInTheDocument();
    expect(screen.queryByText("Operasyon Modülleri")).not.toBeInTheDocument();
    expect(screen.queryByText("Community Kontrol Merkezi")).not.toBeInTheDocument();
    expect(screen.queryByText("Veri Katmanı")).not.toBeInTheDocument();
    expect(screen.queryByText("Kayıt ve Moderasyon Alanları")).not.toBeInTheDocument();
    expect(screen.queryByText("Workspace ve Dokümanlar")).not.toBeInTheDocument();
    expect(screen.queryByText("Harici Yüzeyler")).not.toBeInTheDocument();
    expect(screen.getAllByText("Veritabanı").length).toBeGreaterThan(0);
    expect(screen.queryByText(/^Tüm Roller$/)).not.toBeInTheDocument();
    expect(screen.queryByText("Profil ve Rol Atama")).not.toBeInTheDocument();
    expect(screen.getByText("Ref Kod")).toBeInTheDocument();
    expect(screen.getByText("Dosyalar")).toBeInTheDocument();
    expect(screen.getByText("Muhasebe")).toBeInTheDocument();
    expect(screen.getByText("Haber Bandı")).toBeInTheDocument();
    expect(screen.getByText("Cadde")).toBeInTheDocument();
    expect(screen.getByText("Sosyal Medya")).toBeInTheDocument();
    expect(screen.getByText("Güncellemeler")).toBeInTheDocument();
    expect(screen.getByText("Anketler")).toBeInTheDocument();
    expect(screen.getByText("19 Mayıs Kelime")).toBeInTheDocument();
    expect(screen.getAllByText("19 Mayıs Anı").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Topluluklar").length).toBeGreaterThan(0);
    expect(screen.getByText("Topluluk Editörleri")).toBeInTheDocument();
    expect(screen.getByText("Topluluk Kullanma Kılavuzu")).toBeInTheDocument();
    expect(screen.getByText("Diplomatik Profiller")).toBeInTheDocument();
    expect(screen.queryByText("Başkonsolosluk")).not.toBeInTheDocument();
    expect(screen.queryByText("Kullanıcı Rolleri")).not.toBeInTheDocument();
    expect(screen.getByText("CC")).toBeInTheDocument();
    expect(screen.getByText("Dosyalar ve Linkler")).toBeInTheDocument();
    expect(screen.getByText("MVP Listesi")).toBeInTheDocument();
    expect(screen.getByText("Kortex — CTO, Pitch & PRD Dokümanları")).toBeInTheDocument();
    expect(screen.getByText("Roadmap")).toBeInTheDocument();
    expect(screen.getByText("Ambassador")).toBeInTheDocument();
    expect(screen.getByText("Cap Table V2 — Hisse Yapısı")).toBeInTheDocument();
    expect(screen.getByText("Proje Takibi Şablonu")).toBeInTheDocument();
    expect(screen.getByText("Engine")).toBeInTheDocument();
    expect(screen.getByText("Globe")).toBeInTheDocument();
    expect(screen.getByText("Founders")).toBeInTheDocument();
    expect(screen.getByText("Dashboard Merkezi")).toBeInTheDocument();
    expect(screen.queryByText("Demo")).not.toBeInTheDocument();
    const externalLinks = screen.getAllByRole("link", { name: /Bağlantıyı Aç/i });
    expect(externalLinks[0]).toHaveAttribute("href", "https://eng.corteqs.net");
    expect(externalLinks[1]).toHaveAttribute("href", "https://globe.corteqs.net");
    expect(externalLinks[2]).toHaveAttribute("href", "https://mvp.corteqs.net/founders");
    expect(screen.queryByText("IK Dökümanları")).not.toBeInTheDocument();
    expect(screen.queryByText("ARGE Dökümanları")).not.toBeInTheDocument();
    expect(container.querySelector(".xl\\:grid-cols-6")).not.toBeNull();
    expect(screen.getByRole("button", { name: /Çıkış/i })).toBeInTheDocument();
  });

  it("filters admin cards with the search bar", () => {
    renderAdminHomePage();

    const searchInput = screen.getByRole("searchbox", { name: /admin kartlarında ara/i });
    fireEvent.change(searchInput, { target: { value: "muhasebe" } });

    expect(screen.getByDisplayValue("muhasebe")).toBeInTheDocument();
    expect(screen.getByText("Muhasebe")).toBeInTheDocument();
    expect(screen.queryByText("Cadde")).not.toBeInTheDocument();

    fireEvent.change(searchInput, { target: { value: "bulunamayan ifade" } });

    expect(screen.getByText("Aramayla eslesen kart bulunamadi.")).toBeInTheDocument();
  });

  it("uses the shared logout action", () => {
    const onLogout = vi.fn();

    renderAdminHomePage(onLogout);
    fireEvent.click(screen.getByRole("button", { name: /Çıkış/i }));

    expect(onLogout).toHaveBeenCalledTimes(1);
  });
});
