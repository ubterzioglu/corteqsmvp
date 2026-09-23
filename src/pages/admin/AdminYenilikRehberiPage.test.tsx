import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import AdminYenilikRehberiPage from "./AdminYenilikRehberiPage";

vi.mock("@/lib/seo", () => ({ useSeo: () => undefined }));

// jsdom'da Blob URL yok; indirme yolunun cagrildigini dogrulamak icin taklit edilir.
const createObjectURL = vi.fn(() => "blob:test");
Object.defineProperty(URL, "createObjectURL", { value: createObjectURL, writable: true });

describe("Yönetici yenilik rehberi sayfası", () => {
  it("indirme ve yeni sekmede açma yollarını gösterir", () => {
    render(<AdminYenilikRehberiPage />);

    expect(screen.getByRole("button", { name: /HTML olarak indir/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Yeni sekmede aç/i })).toHaveAttribute(
      "href",
      "blob:test",
    );
  });

  it("rehberin içeriğini özetler — indirmeden de ne olduğu anlaşılır", () => {
    render(<AdminYenilikRehberiPage />);

    expect(screen.getByText(/güvenlik işi/i)).toBeInTheDocument();
    expect(screen.getByText(/tıklanabilir test listesi/i)).toBeInTheDocument();
  });

  it("sayfanın herkese açık OLMADIĞINI açıkça söyler", () => {
    render(<AdminYenilikRehberiPage />);

    expect(screen.getByText(/yönetici girişi olması gerekir/i)).toBeInTheDocument();
  });

  it("rehber dosyası gerçekten paketlenmiş — boş bir Blob indirilmez", () => {
    render(<AdminYenilikRehberiPage />);

    const [blob] = createObjectURL.mock.calls.at(-1) as unknown as [Blob];
    expect(blob.size).toBeGreaterThan(2000);
    expect(blob.type).toContain("text/html");
  });
});
