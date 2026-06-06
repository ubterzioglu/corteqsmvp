import type { ReactNode } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import DiasporaSearchBar from "@/components/DiasporaSearchBar";

const mockNavigate = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock("@/contexts/DiasporaContext", () => ({
  useDiaspora: () => ({ selectedCountry: "all" }),
}));

vi.mock("@/components/WelcomePackOrderForm", () => ({
  default: ({ trigger }: { trigger: ReactNode }) => <div>{trigger}</div>,
}));

describe("DiasporaSearchBar", () => {
  it("navigates to /directory?q=... on search submit", async () => {
    render(
      <MemoryRouter>
        <DiasporaSearchBar />
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByPlaceholderText(/Ne ar.*yor.*sun/i), {
      target: { value: "danisman" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Ara" }));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/directory?q=danisman");
    });
  });

  it("navigates to directory for quick pill search", async () => {
    render(
      <MemoryRouter>
        <DiasporaSearchBar />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole("button", { name: /Vize/i }));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith(
        "/directory?q=Vize%20dan%C4%B1%C5%9Fman%C4%B1",
      );
    });
  });
});
