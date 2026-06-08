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
    expect(screen.getByText("Ücretsiz Kayıt Ol")).toBeInTheDocument();
    expect(screen.getByText("Biz Kimiz")).toBeInTheDocument();
    expect(screen.getByText(/WhatsApp Grubuna Katıl/i)).toBeInTheDocument();
    expect(screen.getByText(/Topluluğunu Ekle/i)).toBeInTheDocument();
  });
});
