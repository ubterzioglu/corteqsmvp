import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Outlet } from "react-router-dom";

import App from "@/App";

vi.mock("@/pages/admin/AdminCatalogPage", () => ({
  default: () => <div>Unified Admin Data Page</div>,
}));

vi.mock("@/components/admin/AdminLayout", () => ({
  default: () => (
    <div>
      <div>Shared Admin Layout</div>
      <Outlet />
    </div>
  ),
}));

describe("App data routing", () => {
  beforeEach(() => {
    window.history.pushState({}, "", "/admin/data");
  });

  afterEach(() => {
    window.history.pushState({}, "", "/");
  });

  it("renders the unified data route inside the shared admin shell", () => {
    render(<App />);

    expect(screen.getByText("Shared Admin Layout")).toBeInTheDocument();
    expect(screen.getByText("Unified Admin Data Page")).toBeInTheDocument();
  });

  it("redirects legacy data category routes to the unified data page", () => {
    window.history.pushState({}, "", "/admin/data/buyukelcilik");

    render(<App />);

    expect(screen.getByText("Shared Admin Layout")).toBeInTheDocument();
    expect(screen.getByText("Unified Admin Data Page")).toBeInTheDocument();
  });

  it("keeps the old kullanici-rolleri data alias inside the unified data flow", () => {
    window.history.pushState({}, "", "/admin/data/kullanici-rolleri");

    render(<App />);

    expect(screen.getByText("Shared Admin Layout")).toBeInTheDocument();
    expect(screen.getByText("Unified Admin Data Page")).toBeInTheDocument();
  });
});
