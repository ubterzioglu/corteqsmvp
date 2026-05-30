import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";

import May19CampaignShell from "@/components/may19/May19CampaignShell";

describe("May19CampaignShell", () => {
  it("renders eyebrow, title, description and children", () => {
    render(
      <MemoryRouter>
        <May19CampaignShell eyebrow="19 Mayıs" title="Test Başlık" description="Test açıklama">
          <div>Test içerik</div>
        </May19CampaignShell>
      </MemoryRouter>,
    );

    expect(screen.getByText("19 Mayıs")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Test Başlık" })).toBeInTheDocument();
    expect(screen.getByText("Test açıklama")).toBeInTheDocument();
    expect(screen.getByText("Test içerik")).toBeInTheDocument();
  });

  it("renders CTA links only when CTA props are provided", () => {
    render(
      <MemoryRouter>
        <May19CampaignShell
          eyebrow="19 Mayıs"
          title="Test Başlık"
          description="Test açıklama"
          primaryCta={{ label: "Modüllere İn", to: "/19051919#modules" }}
          secondaryCta={{ label: "Global Harita", to: "/19051919/harita" }}
        >
          <div>Test içerik</div>
        </May19CampaignShell>
      </MemoryRouter>,
    );

    expect(screen.getByRole("link", { name: /Modüllere İn/i })).toHaveAttribute("href", "/19051919#modules");
    expect(screen.getByRole("link", { name: /Global Harita/i })).toHaveAttribute("href", "/19051919/harita");
  });
});
