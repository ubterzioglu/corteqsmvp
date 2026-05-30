import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Outlet } from "react-router-dom";

import App from "@/App";

vi.mock("@/pages/admin/AdminCaddePage", () => ({
  default: () => <div>Admin Cadde Page</div>,
}));

vi.mock("@/components/auth/AuthProvider", () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
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

  it("renders the cadde admin route inside the shared admin shell", () => {
    render(<App />);

    expect(screen.getByText("Admin Cadde Page")).toBeInTheDocument();
    expect(screen.getByText("Shared Admin Layout")).toBeInTheDocument();
  });
});
