import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";

import HeroSection from "@/components/HeroSection";

describe("HeroSection", () => {
  it("does not show the 19 Mayıs banner and still keeps the hero CTAs", () => {
    render(
      <MemoryRouter>
        <HeroSection />
      </MemoryRouter>,
    );

    expect(screen.queryByText("19 Mayıs Etkinlikleri")).not.toBeInTheDocument();
    expect(screen.getByText("Dünyadaki Türkleri Bir Araya Getiren")).toBeInTheDocument();
    expect(screen.getByText(/Türkiye Dünya Kupası'nda!/)).toBeInTheDocument();
    expect(screen.getByText(/Türkiye Dünya Kupası'nda!/).closest("a")).toHaveAttribute(
      "href",
      "/dunya-kupasi",
    );
    expect(screen.getByText("Ücretsiz Kayıt Ol")).toBeInTheDocument();
    expect(screen.getByText("Diasporada Ara")).toBeInTheDocument();
    expect(screen.getByText("Biz Kimiz")).toBeInTheDocument();
    expect(screen.getByText(/WhatsApp Grubu/i)).toBeInTheDocument();
    expect(screen.getByText(/Topluluğunu Ekle/i)).toBeInTheDocument();
  });
});
