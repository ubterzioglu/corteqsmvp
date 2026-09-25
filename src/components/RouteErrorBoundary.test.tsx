import { fireEvent, render, screen } from "@testing-library/react";
import { Link, MemoryRouter, Outlet, Route, Routes, useNavigate } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { RouterAppErrorBoundary } from "@/components/AppErrorBoundary";
import RouteErrorBoundary from "@/components/RouteErrorBoundary";

const reportClientError = vi.fn();
vi.mock("@/lib/client-error-reports", () => ({
  reportClientError: (...args: unknown[]) => reportClientError(...args),
}));

const Boom = () => {
  throw new Error("sayfa çöktü");
};

const Shell = () => (
  <div>
    <nav>
      <Link to="/ok">Sağlam sayfa</Link>
      <Link to="/boom">Çöken sayfa</Link>
    </nav>
    <RouteErrorBoundary sectionName="TestRoute">
      <Outlet />
    </RouteErrorBoundary>
  </div>
);

describe("RouteErrorBoundary (Outlet sınırı)", () => {
  beforeEach(() => {
    reportClientError.mockClear();
    vi.spyOn(console, "error").mockImplementation(() => undefined);
  });
  afterEach(() => vi.restoreAllMocks());

  const renderShell = (initial: string) =>
    render(
      <MemoryRouter initialEntries={[initial]}>
        <Routes>
          <Route element={<Shell />}>
            <Route path="/ok" element={<p>Sağlam içerik</p>} />
            <Route path="/boom" element={<Boom />} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

  it("sayfa çökünce kabuk navigasyonu render'da kalır ve hata raporlanır", () => {
    renderShell("/boom");

    expect(screen.getByText("Bu sayfa yüklenemedi")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Sağlam sayfa" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Ana sayfaya dön" })).toHaveAttribute("href", "/");
    expect(reportClientError).toHaveBeenCalledWith(
      expect.objectContaining({ source: "render", context: "SectionErrorBoundary:TestRoute" }),
    );
  });

  it("rota değişince (location.key) sınır sıfırlanır ve yeni sayfa çizilir", () => {
    renderShell("/boom");
    expect(screen.getByText("Bu sayfa yüklenemedi")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("link", { name: "Sağlam sayfa" }));

    expect(screen.queryByText("Bu sayfa yüklenemedi")).not.toBeInTheDocument();
    expect(screen.getByText("Sağlam içerik")).toBeInTheDocument();
  });

  it("çöken rotaya navigasyon aynı hatayı bir kez raporlar (sıfırlama döngüsü yok)", () => {
    renderShell("/ok");
    fireEvent.click(screen.getByRole("link", { name: "Çöken sayfa" }));

    expect(screen.getByText("Bu sayfa yüklenemedi")).toBeInTheDocument();
    expect(reportClientError).toHaveBeenCalledTimes(1);
  });
});

/** Sınırın DIŞINDA duran navigasyon tetikleyicisi — tarayıcının geri tuşunun test karşılığı. */
function OutsideNavigator() {
  const navigate = useNavigate();
  return (
    <button type="button" onClick={() => navigate("/ok")}>
      Dışarıdan git
    </button>
  );
}

describe("RouterAppErrorBoundary (genel sınır)", () => {
  beforeEach(() => {
    reportClientError.mockClear();
    vi.spyOn(console, "error").mockImplementation(() => undefined);
  });
  afterEach(() => vi.restoreAllMocks());

  it("genel hata kartı location.key değişince sıfırlanır", () => {
    render(
      <MemoryRouter initialEntries={["/boom"]}>
        <OutsideNavigator />
        <RouterAppErrorBoundary>
          <Routes>
            <Route path="/boom" element={<Boom />} />
            <Route path="/ok" element={<p>Kurtarıldı</p>} />
          </Routes>
        </RouterAppErrorBoundary>
      </MemoryRouter>,
    );
    expect(screen.getByText("Bir hata oluştu")).toBeInTheDocument();
    expect(reportClientError).toHaveBeenCalledWith(
      expect.objectContaining({ context: "AppErrorBoundary" }),
    );

    fireEvent.click(screen.getByRole("button", { name: "Dışarıdan git" }));

    expect(screen.queryByText("Bir hata oluştu")).not.toBeInTheDocument();
    expect(screen.getByText("Kurtarıldı")).toBeInTheDocument();
  });
});
