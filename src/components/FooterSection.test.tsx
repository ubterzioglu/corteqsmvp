import { render } from "@testing-library/react";
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
});
