import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";

import LoginPage from "@/pages/LoginPage";

const useAuthMock = vi.fn();
const signInWithOAuthMock = vi.fn();
const signInWithPasswordMock = vi.fn();
const signUpMock = vi.fn();

vi.mock("@/components/auth/useAuth", () => ({
  useAuth: () => useAuthMock(),
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      signInWithOAuth: (...args: unknown[]) => signInWithOAuthMock(...args),
      signInWithPassword: (...args: unknown[]) => signInWithPasswordMock(...args),
      signUp: (...args: unknown[]) => signUpMock(...args),
    },
  },
}));

afterEach(() => {
  vi.clearAllMocks();
});

describe("LoginPage", () => {
  it("starts on login mode by default and triggers password login", async () => {
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

    expect(screen.getByRole("button", { name: /google ile giriş yap/i })).toBeInTheDocument();

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

  it("starts on signup mode from query param", () => {
    useAuthMock.mockReturnValue({
      session: null,
      isLoading: false,
    });

    render(
      <MemoryRouter initialEntries={["/login?mode=signup"]}>
        <LoginPage />
      </MemoryRouter>,
    );

    expect(screen.getByRole("button", { name: /google ile devam et/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /e-posta ve şifre ile kayıt ol/i })).toBeInTheDocument();
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

  it("keeps next path in Google OAuth redirect", async () => {
    useAuthMock.mockReturnValue({
      session: null,
      isLoading: false,
    });
    signInWithOAuthMock.mockResolvedValue({ error: null });

    render(
      <MemoryRouter initialEntries={["/login?next=%2Faddcom"]}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/addcom" element={<div>Addcom Page</div>} />
        </Routes>
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole("button", { name: /google ile giriş yap/i }));

    await waitFor(() => {
      expect(signInWithOAuthMock).toHaveBeenCalledTimes(1);
    });

    expect(signInWithOAuthMock).toHaveBeenCalledWith({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/login?next=%2Faddcom`,
      },
    });
  });

  it("shows verification guidance after email signup", async () => {
    useAuthMock.mockReturnValue({
      session: null,
      isLoading: false,
    });
    signUpMock.mockResolvedValue({ error: null });

    render(
      <MemoryRouter initialEntries={["/login?mode=signup"]}>
        <LoginPage />
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByLabelText(/e-posta/i), {
      target: { value: "new@corteqs.test" },
    });
    fireEvent.change(screen.getByLabelText(/şifre/i), {
      target: { value: "secret-123" },
    });
    fireEvent.click(screen.getByRole("button", { name: /e-posta ve şifre ile kayıt ol/i }));

    await waitFor(() => {
      expect(signUpMock).toHaveBeenCalledTimes(1);
    });

    expect(signUpMock).toHaveBeenCalledWith({
      email: "new@corteqs.test",
      password: "secret-123",
      options: {
        emailRedirectTo: `${window.location.origin}/login`,
      },
    });

    expect(await screen.findByText(/doğrulama bağlantısını e-posta adresine gönderdik/i)).toBeInTheDocument();
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
