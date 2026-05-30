import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import LoginPage from "@/pages/LoginPage";

const useAuthMock = vi.fn();
const signInWithOAuthMock = vi.fn();
const signInWithPasswordMock = vi.fn();

vi.mock("@/components/auth/useAuth", () => ({
  useAuth: () => useAuthMock(),
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      signInWithOAuth: (...args: unknown[]) => signInWithOAuthMock(...args),
      signInWithPassword: (...args: unknown[]) => signInWithPasswordMock(...args),
    },
  },
}));

describe("LoginPage", () => {
  it("triggers password login with entered credentials", async () => {
    useAuthMock.mockReturnValue({
      session: null,
      isLoading: false,
    });
    signInWithPasswordMock.mockResolvedValue({ error: null });

    render(
      <MemoryRouter initialEntries={["/login"]}>
        <LoginPage />
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByLabelText(/e-posta/i), {
      target: { value: "user@corteqs.test" },
    });
    fireEvent.change(screen.getByLabelText(/şifre/i), {
      target: { value: "secret-123" },
    });
    fireEvent.click(screen.getByRole("button", { name: /e-posta ve şifre ile giriş yap/i }));

    await waitFor(() => {
      expect(signInWithPasswordMock).toHaveBeenCalledTimes(1);
    });

    expect(signInWithPasswordMock).toHaveBeenCalledWith({
      email: "user@corteqs.test",
      password: "secret-123",
    });
  });

  it("triggers Google OAuth with /login redirect", async () => {
    useAuthMock.mockReturnValue({
      session: null,
      isLoading: false,
    });
    signInWithOAuthMock.mockResolvedValue({ error: null });

    render(
      <MemoryRouter initialEntries={["/login"]}>
        <LoginPage />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole("button", { name: /google ile giriş yap/i }));

    await waitFor(() => {
      expect(signInWithOAuthMock).toHaveBeenCalledTimes(1);
    });

    expect(signInWithOAuthMock).toHaveBeenCalledWith({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/login`,
      },
    });
  });

  it("redirects authenticated user to /profile", async () => {
    useAuthMock.mockReturnValue({
      session: { user: { id: "u-1" } },
      isLoading: false,
    });

    render(
      <MemoryRouter initialEntries={["/login"]}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/profile" element={<div>Profile Page</div>} />
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByText("Profile Page")).toBeInTheDocument();
  });
});

