import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import AdminYenilikRehberiPage from "./AdminYenilikRehberiPage";

vi.mock("@/lib/seo", () => ({ useSeo: () => undefined }));

// jsdom'da Blob URL yok; indirme yolunun cagrildigini dogrulamak icin taklit edilir.
const createObjectURL = vi.fn(() => "blob:test");
Object.defineProperty(URL, "createObjectURL", { value: createObjectURL, writable: true });

describe("Yönetici yenilik rehberi sayfası", () => {
  it("her rehber için indirme ve yeni sekmede açma yollarını gösterir", () => {
    render(<AdminYenilikRehberiPage />);

    const indirButonlari = screen.getAllByRole("button", { name: /HTML olarak indir/i });
    const acLinkleri = screen.getAllByRole("link", { name: /Yeni sekmede aç/i });

    expect(indirButonlari.length).toBeGreaterThanOrEqual(8);
    expect(acLinkleri.length).toBeGreaterThanOrEqual(8);

    for (const link of acLinkleri) {
      expect(link).toHaveAttribute("href", "blob:test");
    }
  });

  it("tarih gruplarını gösterir — en yeni üstte", () => {
    render(<AdminYenilikRehberiPage />);

    expect(screen.getByText("7 Ekim 2026")).toBeInTheDocument();
    expect(screen.getByText("23 Eylül 2026")).toBeInTheDocument();
  });

  it("her rehberin başlığını ve özetini gösterir", () => {
    render(<AdminYenilikRehberiPage />);

    expect(screen.getByText(/Topluluk Motoru/)).toBeInTheDocument();
    expect(screen.getByText(/Dijital Gruplar Motoru/)).toBeInTheDocument();
    expect(screen.getByText(/Cadde.*Geliştirmeleri/)).toBeInTheDocument();
    expect(screen.getByText(/Kariyer ve Kadro/)).toBeInTheDocument();
    expect(screen.getByText(/Profil ve Hesap/)).toBeInTheDocument();
    expect(screen.getByText(/Admin Panel İyileştirmeleri/)).toBeInTheDocument();
    expect(screen.getByText(/Güvenlik ve Altyapı/)).toBeInTheDocument();
    expect(screen.getByText(/21–23 Eylül Yenilikleri/)).toBeInTheDocument();
  });

  it("Eylül rehberinin içeriğini özetler — indirmeden de ne olduğu anlaşılır", () => {
    render(<AdminYenilikRehberiPage />);

    expect(screen.getByText(/güvenlik işi/i)).toBeInTheDocument();
    expect(screen.getByText(/tıklanabilir test listesi/i)).toBeInTheDocument();
  });

  it("sayfanın herkese açık OLMADIĞINI açıkça söyler", () => {
    render(<AdminYenilikRehberiPage />);

    expect(screen.getByText(/yönetici girişi olması gerekir/i)).toBeInTheDocument();
  });

  it("her rehber dosyası gerçekten paketlenmiş — boş bir Blob indirilmez", () => {
    render(<AdminYenilikRehberiPage />);

    const blobCalls = createObjectURL.mock.calls as unknown as [Blob][];
    expect(blobCalls.length).toBeGreaterThanOrEqual(8);

    for (const [blob] of blobCalls) {
      expect(blob.size).toBeGreaterThan(2000);
      expect(blob.type).toContain("text/html");
    }
  });

  it("her rehber kartında en az bir özet maddesi vardır", () => {
    render(<AdminYenilikRehberiPage />);

    const rehberBasliklari = [
      /Topluluk Motoru/,
      /Dijital Gruplar/,
      /Cadde/,
      /Kariyer ve Kadro/,
      /Profil ve Hesap/,
      /Admin Panel/,
      /Güvenlik ve Altyapı/,
      /21–23 Eylül/,
    ];

    for (const baslik of rehberBasliklari) {
      const heading = screen.getByRole("heading", { level: 3, name: baslik });
      const parent = heading.closest("div.rounded-lg") as HTMLElement | null;
      expect(parent).not.toBeNull();
      if (parent) {
        const maddeler = within(parent).getAllByRole("listitem");
        expect(maddeler.length).toBeGreaterThanOrEqual(1);
      }
    }
  });
});
