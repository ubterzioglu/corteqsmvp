import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import CatalogItemEditorsPanel from "@/components/admin/catalog/CatalogItemEditorsPanel";

const listCatalogItemEditorsMock = vi.fn();
const searchAdminProfilesMock = vi.fn();
const grantCatalogItemEditorMock = vi.fn();
const revokeCatalogItemEditorMock = vi.fn();

vi.mock("@/lib/admin-catalog", () => ({
  listCatalogItemEditors: (...args: unknown[]) => listCatalogItemEditorsMock(...args),
  searchAdminProfiles: (...args: unknown[]) => searchAdminProfilesMock(...args),
  grantCatalogItemEditor: (...args: unknown[]) => grantCatalogItemEditorMock(...args),
  revokeCatalogItemEditor: (...args: unknown[]) => revokeCatalogItemEditorMock(...args),
}));

describe("CatalogItemEditorsPanel", () => {
  beforeEach(() => {
    listCatalogItemEditorsMock.mockReset();
    searchAdminProfilesMock.mockReset();
    grantCatalogItemEditorMock.mockReset();
    revokeCatalogItemEditorMock.mockReset();

    listCatalogItemEditorsMock.mockResolvedValue([
      {
        userId: "user-2",
        fullName: "Mehmet Demir",
        email: "mehmet@example.com",
        membershipRole: "editor",
        status: "active",
        grantedAt: "2026-06-04T10:00:00.000Z",
      },
    ]);
    searchAdminProfilesMock.mockResolvedValue([
      { id: "user-1", fullName: "Ayşe Yılmaz", email: "ayse@example.com" },
    ]);
    grantCatalogItemEditorMock.mockResolvedValue(undefined);
    revokeCatalogItemEditorMock.mockResolvedValue(undefined);
  });

  it("searches profiles and grants editor access", async () => {
    render(<CatalogItemEditorsPanel itemId="item-1" />);

    expect(await screen.findByText("Mehmet Demir")).toBeInTheDocument();
    fireEvent.change(screen.getByPlaceholderText("İsim veya e-posta ile kullanıcı ara..."), {
      target: { value: "ayşe" },
    });

    expect(await screen.findByText("Ayşe Yılmaz")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Ayşe Yılmaz"));
    fireEvent.click(screen.getByRole("button", { name: "Düzenleyici Ekle" }));

    await waitFor(() => {
      expect(grantCatalogItemEditorMock).toHaveBeenCalledWith("item-1", "user-1");
      expect(listCatalogItemEditorsMock).toHaveBeenCalledTimes(2);
    });
  });

  it("revokes editor access", async () => {
    render(<CatalogItemEditorsPanel itemId="item-1" />);

    expect(await screen.findByText("Mehmet Demir")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Yetkiyi Kaldır" }));

    await waitFor(() => {
      expect(revokeCatalogItemEditorMock).toHaveBeenCalledWith("item-1", "user-2");
      expect(listCatalogItemEditorsMock).toHaveBeenCalledTimes(2);
    });
  });
});
