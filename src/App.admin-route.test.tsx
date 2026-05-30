import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Outlet } from "react-router-dom";

import App from "@/App";

vi.mock("@/pages/AdminLansmanPage.tsx", () => ({
  default: () => <div>Standalone Lansman Admin Page</div>,
}));

vi.mock("@/components/admin/AdminLayout", () => ({
  default: () => (
    <div>
      <div>Shared Admin Layout</div>
      <Outlet />
    </div>
  ),
}));

vi.mock("@/pages/admin/AdminHomePage", () => ({
  default: () => <div>Admin landing page</div>,
}));

describe("App admin routing", () => {
  beforeEach(() => {
    window.history.pushState({}, "", "/admin");
  });

  afterEach(() => {
    window.history.pushState({}, "", "/");
  });

  it("renders the admin landing page on /admin", () => {
    render(<App />);

    expect(screen.getByText("Shared Admin Layout")).toBeInTheDocument();
    expect(screen.getByText("Admin landing page")).toBeInTheDocument();
  });
});
