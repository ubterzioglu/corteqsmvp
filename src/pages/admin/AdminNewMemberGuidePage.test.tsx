import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import AdminNewMemberGuidePage from "@/pages/admin/AdminNewMemberGuidePage";

const fromMock = vi.fn();
const selectMock = vi.fn();
const orderMock = vi.fn();
const fetchCatalogRowsMock = vi.fn();

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: (...args: unknown[]) => fromMock(...args),
  },
}));

vi.mock("@/lib/role-catalog", async () => {
  const actual = await vi.importActual<typeof import("@/lib/role-catalog")>("@/lib/role-catalog");
  return {
    ...actual,
    fetchCatalogRows: (...args: unknown[]) => fetchCatalogRowsMock(...args),
  };
});

describe("AdminNewMemberGuidePage", () => {
  it("shows the role list button and opens roles section from hash", async () => {
    orderMock.mockResolvedValue({
      data: [
        { key: "User_Standard", label: "Standart Kullanıcı", sort_order: 1000, is_active: true },
      ],
      error: null,
    });
    selectMock.mockReturnValue({ order: orderMock });
    fromMock.mockReturnValue({ select: selectMock });
    fetchCatalogRowsMock.mockResolvedValue([]);

    render(
      <MemoryRouter initialEntries={["/admin/new-member/guide#rol-listesi"]}>
        <Routes>
          <Route path="/admin/new-member/guide" element={<AdminNewMemberGuidePage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByRole("link", { name: "Rol Listesi" })).toHaveAttribute(
      "href",
      "/admin/new-member/guide#rol-listesi",
    );

    await waitFor(() => {
      expect(screen.getByText(/Tüm Roller \(1\)/)).toBeInTheDocument();
    });

    expect(screen.getByText("Standart Kullanıcı")).toBeInTheDocument();
  });
});
