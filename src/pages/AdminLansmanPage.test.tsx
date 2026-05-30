import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import AdminLansmanPage from "@/pages/AdminLansmanPage";

vi.mock("@/components/AdminLansmanTable", () => ({
  default: () => <div>Lansman tablo mock</div>,
}));

describe("AdminLansmanPage", () => {
  it("renders the admin table inside the shared admin screen content", () => {
    render(<AdminLansmanPage />);

    expect(screen.getByRole("heading", { name: "Lansman Yönetimi" })).toBeInTheDocument();
    expect(screen.getByText("Lansman tablo mock")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Çıkış" })).not.toBeInTheDocument();
  });
});
