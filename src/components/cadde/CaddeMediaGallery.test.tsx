// Medya ızgarası — m64 sözleşmesi: görseller "ek dosya" gibi değil, gömülü çizilir.
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import CaddeMediaGallery from "@/components/cadde/CaddeMediaGallery";
import type { CaddeMediaAsset } from "@/lib/cadde-types";

const image = (index: number): CaddeMediaAsset => ({
  kind: "image",
  path: `u/p/${index}.jpg`,
  url: `https://cdn.example/${index}.jpg`,
});

describe("CaddeMediaGallery (m64)", () => {
  it("medya yoksa hiç çizilmez", () => {
    const { container } = render(<CaddeMediaGallery media={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("tek görsel kendi oranıyla ve büyük çizilir (kırpılmaz)", () => {
    render(<CaddeMediaGallery media={[image(1)]} contextLabel="Ayşe" />);

    const img = screen.getByAltText("Ayşe — görsel 1");
    // object-contain: dikey fotoğraf ince bir şeride kırpılmaz.
    expect(img).toHaveClass("object-contain");
    expect(img).toHaveClass("max-h-[560px]");
    // Kopuk yükseklik zinciri geri gelmesin: tek görselde h-full KULLANILMAZ.
    expect(img.className).not.toContain("h-full");
  });

  it("çoklu ızgarada hücreler eşit kalsın diye object-cover korunur", () => {
    render(<CaddeMediaGallery media={[image(1), image(2)]} />);

    const first = screen.getByAltText("Paylaşım görseli 1");
    expect(first).toHaveClass("object-cover");
    expect(first).toHaveClass("h-full");
  });

  it("her görsel büyütme için tıklanabilir bir düğmenin içindedir", () => {
    render(<CaddeMediaGallery media={[image(1)]} />);

    expect(screen.getByRole("button", { name: /büyüt/i })).toBeInTheDocument();
  });
});
