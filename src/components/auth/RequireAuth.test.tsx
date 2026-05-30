import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import RequireAuth from "@/components/auth/RequireAuth";

const useAuthMock = vi.fn();

vi.mock("@/components/auth/useAuth", () => ({
  useAuth: () => useAuthMock(),
}));

describe("RequireAuth", () => {
  it("redirects to /login when session is missing", async () => {
    useAuthMock.mockReturnValue({
      session: null,
      isLoading: false,
    });

    render(
      <MemoryRouter initialEntries={["/profile"]}>
        <Routes>
          <Route
            path="/profile"
            element={
              <RequireAuth>
                <div>Protected Profile</div>
              </RequireAuth>
            }
          />
          <Route path="/login" element={<div>Login Page</div>} />
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByText("Login Page")).toBeInTheDocument();
  });

  it("renders children when session exists", () => {
    useAuthMock.mockReturnValue({
      session: { user: { id: "u-1" } },
      isLoading: false,
    });

    render(
      <MemoryRouter>
        <RequireAuth>
          <div>Protected Profile</div>
        </RequireAuth>
      </MemoryRouter>,
    );

    expect(screen.getByText("Protected Profile")).toBeInTheDocument();
  });
});

