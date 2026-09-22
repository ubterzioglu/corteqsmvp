import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";

import PublicProfileProvenanceCard from "./PublicProfileProvenanceCard";

const renderCard = (provenance: Parameters<typeof PublicProfileProvenanceCard>[0]["provenance"]) =>
  render(
    <MemoryRouter>
      <PublicProfileProvenanceCard provenance={provenance} />
    </MemoryRouter>,
  );

describe("B16 kaynak künyesi kartı", () => {
  it("künye yoksa hiçbir şey çizmez — boş kart sahte doğrulama izlenimi verir", () => {
    const { container } = renderCard(null);
    expect(container).toBeEmptyDOMElement();
  });

  it("derleme adını ve tarihi olduğu gibi gösterir, kaynak iddiası üretmez", () => {
    renderCard({
      sourceKey: "vancouver-toronto-deep-research-20260617",
      importedAt: "2026-06-17",
      isVerified: false,
    });

    expect(screen.getByText("vancouver-toronto-deep-research-20260617")).toBeInTheDocument();
    expect(screen.getByText("2026-06-17")).toBeInTheDocument();
    expect(screen.getByText(/kişinin kendisi oluşturmadı/i)).toBeInTheDocument();
    expect(screen.getByText(/henüz doğrulanmadı/i)).toBeInTheDocument();
  });

  it("kaldırma talebi için iletişim yolunu HER ZAMAN gösterir (B15 şartı)", () => {
    renderCard({ sourceKey: "melbourne-deep-research-20260617", importedAt: null, isVerified: true });

    const link = screen.getByRole("link", { name: /iletişim sayfasından/i });
    expect(link).toHaveAttribute("href", "/iletisim");
    expect(screen.getByText(/doğrulandı/)).toBeInTheDocument();
  });
});
