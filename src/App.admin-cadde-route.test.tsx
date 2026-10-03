import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Outlet } from "react-router-dom";

import App from "@/App";

vi.mock("@/pages/admin/AdminCaddePage", () => ({
  default: () => <div>Admin Cadde Page</div>,
}));

vi.mock("@/components/auth/AuthProvider", () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// M13: App artık InviteRedemption'ı AuthProvider içinde mount ediyor ve o bileşen
// useAuth çağırıyor — passthrough AuthProvider mock'ı context sağlamadığı için
// useAuth mock'u ŞART (ProfilePage.test deseni). Bu, App düzeyinde useAuth
// kullanan ilk bileşen; useAuth'un "provider şart" sözleşmesi BİLEREK korunuyor.
vi.mock("@/components/auth/useAuth", () => ({
  useAuth: () => ({ user: null, isLoading: false }),
}));

vi.mock("@/components/admin/AdminLayout", () => ({
  default: () => (
    <div>
      <div>Shared Admin Layout</div>
      <Outlet />
    </div>
  ),
}));

describe("App admin cadde routing", () => {
  beforeEach(() => {
    window.history.pushState({}, "", "/admin/cadde");
  });

  afterEach(() => {
    window.history.pushState({}, "", "/");
  });

  it("renders the cadde admin route inside the shared admin shell", async () => {
    await act(async () => { render(<App />); });

    expect(screen.getByText("Admin Cadde Page")).toBeInTheDocument();
    expect(screen.getByText("Shared Admin Layout")).toBeInTheDocument();
  });
});
