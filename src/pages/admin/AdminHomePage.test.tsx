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
    renderAdminHomePage();

    expect(screen.getByText("Admin İşlemleri")).toBeInTheDocument();
    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.getByText("Dış Bağlantılar")).toBeInTheDocument();
    expect(screen.getByText("Üye Takibi")).toBeInTheDocument();
    expect(screen.getByText("Ref Kod")).toBeInTheDocument();
    expect(screen.getByText("Dosyalar")).toBeInTheDocument();
    expect(screen.getByText("Diğer İşlemler")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Diğer İşlemler"));
    expect(screen.getByText("Muhasebe")).toBeInTheDocument();
    expect(screen.getByText("Haber Bandı")).toBeInTheDocument();
    expect(screen.getByText("Sosyal Medya")).toBeInTheDocument();
    expect(screen.getByText("Güncellemeler")).toBeInTheDocument();
    expect(screen.getByText("Diğer Kayıtlar")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Diğer Kayıtlar"));
    expect(screen.getByText("Lansman Katılım")).toBeInTheDocument();
    expect(screen.getByText("19 Mayıs Kelime")).toBeInTheDocument();
    expect(screen.getByText("19 Mayıs Anı")).toBeInTheDocument();
    expect(screen.getByText("Topluluklar")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Topluluklar"));
    expect(screen.getByText("Topluluk Editörleri")).toBeInTheDocument();
    expect(screen.getByText("Topluluk Kullanma Kılavuzu")).toBeInTheDocument();
    expect(screen.getByText("Dashboard Merkezi")).toBeInTheDocument();
    expect(screen.getByText("Command Center")).toBeInTheDocument();
    expect(screen.getByText("Dosyalar ve Linkler")).toBeInTheDocument();
    expect(screen.getByText("MVP Listesi")).toBeInTheDocument();
    expect(screen.getByText("Diğer Dokümanlar")).toBeInTheDocument();
    expect(screen.getByText("Kortex — CTO, Pitch & PRD Dokümanları")).toBeInTheDocument();
    expect(screen.getByText("Roadmap")).toBeInTheDocument();
    expect(screen.getByText("Ambassador")).toBeInTheDocument();
    expect(screen.getByText("Cap Table V2 — Hisse Yapısı")).toBeInTheDocument();
    expect(screen.getByText("Proje Takibi Şablonu")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Dış Bağlantılar"));
    expect(screen.getByText("Engine")).toBeInTheDocument();
    expect(screen.getByText("Globe")).toBeInTheDocument();
    expect(screen.getByText("Founders")).toBeInTheDocument();
    const externalLinks = screen.getAllByRole("link", { name: /Bağlantıyı Aç/i });
    expect(externalLinks[0]).toHaveAttribute("href", "https://eng.corteqs.net");
    expect(externalLinks[1]).toHaveAttribute("href", "https://globe.corteqs.net");
    expect(externalLinks[2]).toHaveAttribute("href", "https://mvp.corteqs.net/founders");
    expect(screen.queryByText("IK Dökümanları")).not.toBeInTheDocument();
    expect(screen.queryByText("ARGE Dökümanları")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Çıkış/i })).toBeInTheDocument();
  });

  it("uses the shared logout action", () => {
    const onLogout = vi.fn();

    renderAdminHomePage(onLogout);
    fireEvent.click(screen.getByRole("button", { name: /Çıkış/i }));

    expect(onLogout).toHaveBeenCalledTimes(1);
  });
});
