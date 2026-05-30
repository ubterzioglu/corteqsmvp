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

describe("App lansman admin routing", () => {
  beforeEach(() => {
    window.history.pushState({}, "", "/admin/lansman");
  });

  afterEach(() => {
    window.history.pushState({}, "", "/");
  });

  it("renders the lansman admin route inside the shared admin shell", () => {
    render(<App />);

    expect(screen.getByText("Standalone Lansman Admin Page")).toBeInTheDocument();
    expect(screen.getByText("Shared Admin Layout")).toBeInTheDocument();
  });
});
