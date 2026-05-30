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
  it("does not expose a visible founders link", () => {
    const { container } = render(
      <MemoryRouter>
        <FooterSection />
      </MemoryRouter>,
    );

    expect(container.querySelector('a[href="/founders"]')).toBeNull();
  });
});
