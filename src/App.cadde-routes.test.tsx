import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Outlet } from "react-router-dom";

import App from "@/App";

vi.mock("@/pages/CaddePage", () => ({
  default: () => <div>Cadde Public Page</div>,
}));

vi.mock("@/components/auth/AuthProvider", () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock("@/components/auth/RequireAuth", () => ({
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock("@/components/auth/RequireFeature", () => ({
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock("@/components/admin/AdminLayout", () => ({
  default: () => (
    <div>
      <div>Shared Admin Layout</div>
      <Outlet />
    </div>
  ),
}));

describe("App cadde routing", () => {
  beforeEach(() => {
    window.history.pushState({}, "", "/cadde");
  });

  afterEach(() => {
    window.history.pushState({}, "", "/");
  });

  it("renders the cadde public route", () => {
    render(<App />);
    expect(screen.getByText("Cadde Public Page")).toBeInTheDocument();
  });
});
