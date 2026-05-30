import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import FormPage from "@/pages/FormPage";

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: vi.fn(),
  },
}));

describe("FormPage", () => {
  it("shows the AI assistant registration CTA", () => {
    render(
      <MemoryRouter>
        <FormPage />
      </MemoryRouter>,
    );

    expect(screen.getByRole("link", { name: /Yapay Zeka Destekli Asistan ile kaydol/i })).toHaveAttribute(
      "href",
      "/aiform",
    );
  });
});
