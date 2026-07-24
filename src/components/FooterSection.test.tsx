import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import FooterSection from "@/components/FooterSection";

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

vi.mock("@/components/RegisterInterestForm", () => ({
  default: () => null,
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: () => ({
      select: () => ({
        order: () => new Promise(() => {}),
      }),
    }),
  },
}));

describe("FooterSection", () => {
  it("does not expose a dedicated founders navigation entry", () => {
    const { container } = render(
      <MemoryRouter>
        <FooterSection />
      </MemoryRouter>,
    );

    const foundersLinks = Array.from(container.querySelectorAll('a[href="/founders"]'));
    const visibleFoundersLink = foundersLinks.find(
      (el) => el.textContent?.toLowerCase().includes("founders"),
    );
    expect(visibleFoundersLink).toBeUndefined();
  });

  it("renders the Tek Hurda Metal backlink in the footer", () => {
    render(
      <MemoryRouter>
        <FooterSection />
      </MemoryRouter>,
    );

    const backlink = screen.getByRole("link", {
      name: "İstanbul Hurdacı - Tek Hurda Metal A.Ş",
    });
    expect(backlink).toHaveAttribute("href", "https://tekhurdametal.com/istanbul-hurdaci/");
    expect(backlink).toHaveAttribute("aria-label", "İstanbul Hurdacı - Tek Hurda Metal A.Ş");
    expect(backlink).toHaveAttribute("title", "Tek Hurda Metal A.Ş");
  });
});
