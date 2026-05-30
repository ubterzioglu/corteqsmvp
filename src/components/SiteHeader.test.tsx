import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";

import SiteHeader from "@/components/SiteHeader";

describe("SiteHeader", () => {
  it("shows the simplified brand header and slogan without navigation buttons", () => {
    render(
      <MemoryRouter>
        <SiteHeader />
      </MemoryRouter>,
    );

    expect(screen.getByText("CorteQS")).toBeInTheDocument();
    expect(screen.getByText("Global Türk Diaspora Network")).toBeInTheDocument();
    expect(screen.getByText("Türk Diasporasını Birleştiren Platform")).toBeInTheDocument();
    expect(screen.queryByText("Kayıt Ol!")).not.toBeInTheDocument();
    expect(screen.queryByText("Founding 1000")).not.toBeInTheDocument();
    expect(screen.queryByText("Whatsapp Topluluğu")).not.toBeInTheDocument();
    expect(screen.queryByText("Ana Sayfa")).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Anketler" })).not.toBeInTheDocument();
    expect(screen.queryByText("19 Mayıs Etkinlikleri")).not.toBeInTheDocument();
  });
});
