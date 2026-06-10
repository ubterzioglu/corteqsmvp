// Admin Panel V2 — page shell bileşen testleri (masterplan §9, Faz 6).

import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { Database } from "lucide-react";

import {
  AdminDetailDrawer,
  AdminEmptyState,
  AdminErrorState,
  AdminFilterBar,
  AdminLoadingState,
  AdminPageShell,
  AdminStatusBadge,
  statusToTone,
} from "./index";

describe("AdminPageShell", () => {
  it("başlık, açıklama, eyebrow, aksiyon, stats, filtre ve içerik render eder", () => {
    render(
      <MemoryRouter>
        <AdminPageShell
          title="Test Sayfası"
          description="Sayfa açıklaması"
          eyebrow="Modül"
          icon={Database}
          accent="sky"
          actions={<button type="button">Yenile</button>}
          stats={<div>stats-blok</div>}
          filters={<div>filtre-blok</div>}
        >
          <div>icerik-blok</div>
        </AdminPageShell>
      </MemoryRouter>,
    );

    expect(screen.getByRole("heading", { level: 1, name: "Test Sayfası" })).toBeInTheDocument();
    expect(screen.getByText("Sayfa açıklaması")).toBeInTheDocument();
    expect(screen.getByText("Modül")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Yenile" })).toBeInTheDocument();
    expect(screen.getByText("stats-blok")).toBeInTheDocument();
    expect(screen.getByText("filtre-blok")).toBeInTheDocument();
    expect(screen.getByText("icerik-blok")).toBeInTheDocument();
  });

  it("breadcrumbs verilirse linkli zincir render eder", () => {
    render(
      <MemoryRouter>
        <AdminPageShell
          title="Detay"
          breadcrumbs={[{ label: "Liste", to: "/admin/data" }, { label: "Kayıt" }]}
        >
          icerik
        </AdminPageShell>
      </MemoryRouter>,
    );

    const link = screen.getByRole("link", { name: "Liste" });
    expect(link).toHaveAttribute("href", "/admin/data");
    expect(screen.getByText("Kayıt")).toBeInTheDocument();
  });

  it("aside verilirse iki kolonlu düzen render eder", () => {
    render(
      <MemoryRouter>
        <AdminPageShell title="Sayfa" aside={<div>aside-blok</div>}>
          icerik
        </AdminPageShell>
      </MemoryRouter>,
    );

    expect(screen.getByText("aside-blok").closest("aside")).not.toBeNull();
  });
});

describe("AdminFilterBar", () => {
  it("onReset verilirse sıfırlama butonu çalışır", () => {
    const onReset = vi.fn();
    render(
      <AdminFilterBar onReset={onReset} resetLabel="Seçimi temizle">
        <input placeholder="ara" />
      </AdminFilterBar>,
    );

    fireEvent.click(screen.getByRole("button", { name: /Seçimi temizle/ }));
    expect(onReset).toHaveBeenCalledTimes(1);
  });
});

describe("AdminEmptyState", () => {
  it("başlık, açıklama ve aksiyon render eder", () => {
    render(
      <AdminEmptyState
        title="Kayıt yok"
        description="Filtreye uygun kayıt bulunamadı."
        action={<button type="button">Yeni ekle</button>}
      />,
    );

    expect(screen.getByText("Kayıt yok")).toBeInTheDocument();
    expect(screen.getByText("Filtreye uygun kayıt bulunamadı.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Yeni ekle" })).toBeInTheDocument();
  });
});

describe("AdminLoadingState", () => {
  it("status rolü ve erişilebilir etiket ile render eder", () => {
    render(<AdminLoadingState label="Katalog yükleniyor..." rows={2} />);
    expect(screen.getByRole("status", { name: "Katalog yükleniyor..." })).toBeInTheDocument();
  });
});

describe("AdminErrorState", () => {
  it("alert rolü render eder ve retry çağırır", () => {
    const onRetry = vi.fn();
    render(<AdminErrorState description="Sunucu hatası" onRetry={onRetry} />);

    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByText("Sunucu hatası")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Tekrar dene/ }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});

describe("AdminStatusBadge", () => {
  it("içeriği render eder", () => {
    render(<AdminStatusBadge tone="success">approved</AdminStatusBadge>);
    expect(screen.getByText("approved")).toBeInTheDocument();
  });

  it("statusToTone bilinen durumları eşler, bilinmeyeni neutral yapar", () => {
    expect(statusToTone("approved")).toBe("success");
    expect(statusToTone("pending")).toBe("pending");
    expect(statusToTone("rejected")).toBe("danger");
    expect(statusToTone("archived")).toBe("neutral");
    expect(statusToTone("boyle-bir-durum-yok")).toBe("neutral");
  });
});

describe("AdminDetailDrawer", () => {
  it("açıkken başlık, açıklama, içerik ve footer render eder", () => {
    render(
      <AdminDetailDrawer
        open
        onOpenChange={() => undefined}
        title="Kayıt Detayı"
        description="Seçili kaydın detayları"
        footer={<button type="button">Kapat</button>}
      >
        <div>drawer-icerik</div>
      </AdminDetailDrawer>,
    );

    expect(screen.getByText("Kayıt Detayı")).toBeInTheDocument();
    expect(screen.getByText("Seçili kaydın detayları")).toBeInTheDocument();
    expect(screen.getByText("drawer-icerik")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Kapat" })).toBeInTheDocument();
  });
});
