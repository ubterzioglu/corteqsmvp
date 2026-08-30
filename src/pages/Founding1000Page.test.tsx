import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import Founding1000Page from "@/pages/Founding1000Page";

vi.mock("@/components/Founding1000Section", () => ({
  default: ({ defaultReferralCode }: { defaultReferralCode?: string }) => (
    <div data-testid="founding-referral">{defaultReferralCode ?? "fallback"}</div>
  ),
}));

vi.mock("@/lib/seo", () => ({ useSeo: vi.fn() }));

describe("Founding1000Page referral", () => {
  it("QR query'sindeki doğrulanmış kodu kayıt formu bölümüne aktarır", () => {
    render(
      <MemoryRouter initialEntries={["/founding-1000?ref=liscty-abc123"]}>
        <Founding1000Page />
      </MemoryRouter>,
    );

    expect(screen.getByTestId("founding-referral")).toHaveTextContent("LISCTY-ABC123");
  });

  it("geçersiz query kodunu forma aktarmaz", () => {
    render(
      <MemoryRouter initialEntries={["/founding-1000?ref=ABC%3Cscript%3E"]}>
        <Founding1000Page />
      </MemoryRouter>,
    );

    expect(screen.getByTestId("founding-referral")).toHaveTextContent("fallback");
  });
});
