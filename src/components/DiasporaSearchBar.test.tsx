import type { ReactNode } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import DiasporaSearchBar from "@/components/DiasporaSearchBar";

const mockNavigate = vi.fn();
const mockAuth = { user: null as { id: string } | null, isLoading: false };

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock("@/components/auth/useAuth", () => ({
  useAuth: () => mockAuth,
}));

vi.mock("@/contexts/DiasporaContext", () => ({
  useDiaspora: () => ({ selectedCountry: "all" }),
}));

vi.mock("@/components/WelcomePackOrderForm", () => ({
  default: ({ trigger }: { trigger: ReactNode }) => <div>{trigger}</div>,
}));

describe("DiasporaSearchBar", () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    mockAuth.user = null;
    mockAuth.isLoading = false;
  });

  it("redirects visitors to login with directory search preserved in next", async () => {
    render(
      <MemoryRouter>
        <DiasporaSearchBar />
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByPlaceholderText("Şehir, kategori veya hizmet ara"), {
      target: { value: "danisman" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Ara" }));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith(
        "/login?next=%2Fdirectory%3Fq%3Ddanisman",
      );
    });
  });

  it("navigates authenticated users straight to directory on search submit", async () => {
    mockAuth.user = { id: "u1" };
    render(
      <MemoryRouter>
        <DiasporaSearchBar />
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByPlaceholderText("Şehir, kategori veya hizmet ara"), {
      target: { value: "danisman" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Ara" }));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/directory?q=danisman");
    });
  });

  it("routes the quick pill search through the same auth-aware path", async () => {
    mockAuth.user = { id: "u1" };
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
