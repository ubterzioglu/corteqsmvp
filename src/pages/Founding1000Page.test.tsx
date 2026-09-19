import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import Founding1000Page from "@/pages/Founding1000Page";

vi.mock("@/components/Founding1000Section", () => ({
  default: () => <div data-testid="founding-section" />,
}));

vi.mock("@/lib/seo", () => ({ useSeo: vi.fn() }));

describe("Founding1000Page", () => {
  it("renders the founding section", () => {
    const { container } = render(
      <MemoryRouter initialEntries={["/founding-1000"]}>
        <Founding1000Page />
      </MemoryRouter>,
    );

    expect(container.querySelector("main")).toBeTruthy();
  });
});
