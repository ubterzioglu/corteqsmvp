import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";

import { PanelHelpCard } from "@/components/admin/PanelHelpCard";

describe("PanelHelpCard", () => {
  it("panel açıklamasını ve kılavuz bağlantısını gösterir", () => {
    render(
      <MemoryRouter>
        <PanelHelpCard
          title="Bu panel ne anlatıyor?"
          description="İstek ve token sayılarını yorumlamanıza yardım eder."
          guideHref="/admin/guide#agent-altyapisi"
        />
      </MemoryRouter>,
    );

    expect(screen.getByText("Bu panel ne anlatıyor?")).toBeInTheDocument();
    expect(screen.getByText(/İstek ve token sayılarını/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Kılavuzu aç" })).toHaveAttribute(
      "href",
      "/admin/guide#agent-altyapisi",
    );
  });

  it("asistan bağlantısına panel bağlamını güvenli query parametresiyle ekler", () => {
    const assistantPrompt = "Agent kullanım analitiğini nasıl yorumlamalıyım?";
    render(
      <MemoryRouter>
        <PanelHelpCard
          title="Yardım"
          description="Açıklama"
          assistantPrompt={assistantPrompt}
        />
      </MemoryRouter>,
    );

    const link = screen.getByRole("link", { name: "Asistana sor" });
    const href = link.getAttribute("href");
    expect(href).toBeTruthy();

    const url = new URL(href!, "https://corteqs.test");
    expect(url.pathname).toBe("/landingtrial");
    expect(url.hash).toBe("#kaydol");
    expect(url.searchParams.get("assistant")).toBe(assistantPrompt);
  });
});
