import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import CatalogClaimRequestsPanel from "@/components/admin/catalog/CatalogClaimRequestsPanel";

const listCatalogClaimsMock = vi.fn();
const approveCatalogClaimMock = vi.fn();
const rejectCatalogClaimMock = vi.fn();

vi.mock("@/lib/admin-catalog", () => ({
  listCatalogClaims: (...args: unknown[]) => listCatalogClaimsMock(...args),
  approveCatalogClaim: (...args: unknown[]) => approveCatalogClaimMock(...args),
  rejectCatalogClaim: (...args: unknown[]) => rejectCatalogClaimMock(...args),
}));

describe("CatalogClaimRequestsPanel", () => {
  beforeEach(() => {
    listCatalogClaimsMock.mockReset();
    approveCatalogClaimMock.mockReset();
    rejectCatalogClaimMock.mockReset();

    listCatalogClaimsMock.mockResolvedValue([
      {
        id: "claim-1",
        itemId: "item-1",
        itemTitle: "Berlin Derneği",
        requestedByUserId: "user-1",
        requesterFullName: "Ayşe Yılmaz",
        requesterEmail: "ayse@example.com",
        claimType: "ownership",
        note: "Bu kayıt bana ait.",
        status: "pending",
        createdAt: "2026-06-04T10:00:00.000Z",
        reviewedAt: null,
        reviewedByUserId: null,
        reviewerFullName: null,
      },
    ]);
    approveCatalogClaimMock.mockResolvedValue(undefined);
    rejectCatalogClaimMock.mockResolvedValue(undefined);
  });

  it("renders pending claims and approves them", async () => {
    render(<CatalogClaimRequestsPanel itemId="item-1" />);

    expect(await screen.findByText("Ayşe Yılmaz")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Approve" }));

    await waitFor(() => {
      expect(approveCatalogClaimMock).toHaveBeenCalledWith("claim-1");
      expect(listCatalogClaimsMock).toHaveBeenCalledTimes(2);
    });
  });

  it("rejects pending claims", async () => {
    render(<CatalogClaimRequestsPanel itemId="item-1" />);

    expect(await screen.findByText("Ayşe Yılmaz")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Reject" }));

    await waitFor(() => {
      expect(rejectCatalogClaimMock).toHaveBeenCalledWith("claim-1");
      expect(listCatalogClaimsMock).toHaveBeenCalledTimes(2);
    });
  });
});
