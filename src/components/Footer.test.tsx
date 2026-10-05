import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";

import Footer from "@/components/Footer";

describe("Footer — A9 CorteQS Global linki", () => {
  it("Global linki doğru href, target ve rel ile render edilir", () => {
    render(
      <MemoryRouter>
        <Footer />
      </MemoryRouter>
    );

    const globalLink = screen.getByRole("link", {
      name: /CorteQS Global – Coming to every diaspora/i,
    });

    expect(globalLink).toBeInTheDocument();
    expect(globalLink).toHaveAttribute(
      "href",
      "https://corteqsglobal.qualtronsinclair.com/?utm_source=corteqs.net&utm_medium=footer"
    );
    expect(globalLink).toHaveAttribute("target", "_blank");
    expect(globalLink).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("Global linki footer'ın son kısmında yer alır", () => {
    const { container } = render(
      <MemoryRouter>
        <Footer />
      </MemoryRouter>
    );

    const footer = container.querySelector("footer");
    expect(footer).toBeInTheDocument();

    // Link footer içinde olmalı
    const globalLink = container.querySelector(
      'a[href*="corteqsglobal.qualtronsinclair.com"]'
    );
    expect(globalLink).toBeInTheDocument();
    expect(footer?.contains(globalLink)).toBe(true);
  });
});
