import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Outlet } from "react-router-dom";

import App from "@/App";

vi.mock("@/components/admin/AdminLayout", () => ({
  default: () => (
    <div>
      <div>Shared Admin Layout</div>
      <Outlet />
    </div>
  ),
}));

vi.mock("@/pages/NotFound.tsx", () => ({
  default: () => <div>Admin Not Found</div>,
}));

describe("App removed lansman admin routing", () => {
  beforeEach(() => {
    window.history.pushState({}, "", "/admin/lansman");
  });

  afterEach(() => {
    window.history.pushState({}, "", "/");
  });

  it("renders admin not found inside the shared admin shell", async () => {
    await act(async () => { render(<App />); });

    expect(screen.getByText("Shared Admin Layout")).toBeInTheDocument();
    expect(screen.getByText("Admin Not Found")).toBeInTheDocument();
  });
});
