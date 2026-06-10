import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import AdminDashboardPage from "./AdminDashboardPage";

const mocks = vi.hoisted(() => ({
  fetchAdminDashboardSummary: vi.fn(),
}));

vi.mock("@/lib/admin-shell/admin-dashboard-api", () => ({
  fetchAdminDashboardSummary: mocks.fetchAdminDashboardSummary,
}));

vi.mock("@/components/admin/shell/AdminShell", () => ({
  useAdminOutletContext: () => ({
    session: { user: { id: "admin-user", email: "admin@corteqs.test" } },
    onLogout: vi.fn(),
  }),
}));

function renderDashboard() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={["/admin"]}>
        <AdminDashboardPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  window.localStorage.clear();
  mocks.fetchAdminDashboardSummary.mockReset().mockResolvedValue({
    catalogItems: 239,
    roles: 76,
    pendingApprovals: 4,
    featureOverrides: 12,
    auditLogsLast24h: 14,
  });
});

describe("AdminDashboardPage", () => {
  it("hero selamlama, e-posta ve dikkat cümlesini gösterir", async () => {
    renderDashboard();

    expect(
      await screen.findByRole("heading", { name: /(Günaydın|İyi günler|İyi akşamlar), admin@corteqs\.test/ }),
    ).toBeInTheDocument();
    // Cümle hem hero'da hem dikkat kuyruğunda geçer.
    expect(await screen.findAllByText(/4 bekleyen approval/)).not.toHaveLength(0);
  });

  it("KPI kartları metrik değerlerini gösterir ve doğru ekrana linkler", async () => {
    renderDashboard();

    expect(await screen.findByText("239")).toBeInTheDocument();
    expect(screen.getByText("76")).toBeInTheDocument();
    expect(screen.getByText("12")).toBeInTheDocument();
    expect(screen.getByText("14")).toBeInTheDocument();

    expect(screen.getByText("Katalog Kaydı").closest("a")).toHaveAttribute("href", "/admin/data");
    expect(screen.getByText("Bekleyen Approval").closest("a")).toHaveAttribute("href", "/admin/approvals");
  });

  it("bekleyen approval varsa dikkat kuyruğunda link gösterir", async () => {
    renderDashboard();

    const attention = await screen.findByText(/4 bekleyen approval talebi var/);
    expect(attention.closest("a")).toHaveAttribute("href", "/admin/approvals");
  });

  it("bekleyen iş yoksa her şey yolunda durumu gösterir", async () => {
    mocks.fetchAdminDashboardSummary.mockResolvedValue({
      catalogItems: 239,
      roles: 76,
      pendingApprovals: 0,
      featureOverrides: 12,
      auditLogsLast24h: 0,
    });
    renderDashboard();

    expect(await screen.findByText("Şu an dikkat bekleyen iş yok.")).toBeInTheDocument();
  });

  it("hesaplanamayan metrik — olarak gösterilir", async () => {
    mocks.fetchAdminDashboardSummary.mockResolvedValue({
      catalogItems: null,
      roles: 76,
      pendingApprovals: 0,
      featureOverrides: 0,
      auditLogsLast24h: 0,
    });
    renderDashboard();

    expect(await screen.findByText("76")).toBeInTheDocument();
    expect(screen.getByText("—")).toBeInTheDocument();
  });

  it("metrik isteği tamamen düşerse graceful fallback gösterir, linkler çalışır", async () => {
    mocks.fetchAdminDashboardSummary.mockRejectedValue(new Error("network"));
    renderDashboard();

    expect(await screen.findByRole("alert")).toHaveTextContent("Özet metrikler şu an yüklenemedi");
    expect(screen.getByRole("link", { name: /Kayıt ara/ })).toHaveAttribute("href", "/admin/data");
    expect(screen.getByRole("link", { name: /Gider ekle/ })).toHaveAttribute(
      "href",
      "/admin/muhasebe/giderler",
    );
  });

  it("modül kartları registry gruplarını ve child linkleri gösterir", async () => {
    renderDashboard();

    expect(await screen.findByText("Muhasebe")).toBeInTheDocument();
    expect(screen.getByText("Roller ve AFS")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Nakit Akışı/ })).toHaveAttribute(
      "href",
      "/admin/muhasebe/nakit-akisi",
    );
  });

  it("favoriler ve son kullanılanlar widget'ları boş durumda yönlendirici metin gösterir", async () => {
    renderDashboard();

    expect(await screen.findByText(/Henüz favori yok/)).toBeInTheDocument();
    expect(screen.getByText(/Henüz gezinme geçmişi yok/)).toBeInTheDocument();
  });
});
