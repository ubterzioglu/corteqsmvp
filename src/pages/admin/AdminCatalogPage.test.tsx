import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import AdminCatalogPage from "@/pages/admin/AdminCatalogPage";

const toast = vi.fn();
const listAdminCatalogItemsMock = vi.fn();
const listAdminCatalogItemTypesMock = vi.fn();

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({
    toast,
  }),
}));

vi.mock("@/lib/admin-catalog", async () => {
  const actual = await vi.importActual<typeof import("@/lib/admin-catalog")>("@/lib/admin-catalog");

  return {
    ...actual,
    listAdminCatalogItems: (...args: unknown[]) => listAdminCatalogItemsMock(...args),
    listAdminCatalogItemTypes: (...args: unknown[]) => listAdminCatalogItemTypesMock(...args),
  };
});

describe("AdminCatalogPage", () => {
  beforeEach(() => {
    toast.mockReset();
    listAdminCatalogItemTypesMock.mockResolvedValue([
      { key: "organization", label: "Organization" },
      { key: "community_group", label: "Community Group" },
    ]);
    listAdminCatalogItemsMock.mockResolvedValue([
      {
        id: "item-1",
        itemType: "organization",
        slug: "berlin-dernegi",
        title: "Berlin Derneği",
        headline: "Resmi topluluk kaydı",
        shortDescription: "Berlin merkezli dernek kaydı",
        longDescription: "Uzun açıklama 1",
        status: "published",
        visibility: "public",
        verificationStatus: "official_source",
        createdAt: "2026-06-04T10:00:00.000Z",
        updatedAt: "2026-06-04T10:15:00.000Z",
        publishedAt: "2026-06-04T11:00:00.000Z",
        primaryCity: "Berlin",
        primaryCountryCode: "DE",
        categoryLabels: ["Association"],
        sourceTypes: ["turkish_mission"],
        thumbnailUrl: null,
        attributes: { featured: true },
        createdByUserId: "user-1",
        categories: [{ slug: "association", name: "Association", isPrimary: true }],
        locations: [{ city: "Berlin", countryCode: "DE", addressLine: "Alexanderplatz 1", isPrimary: true }],
        sources: [
          {
            sourceType: "turkish_mission",
            externalId: "source-1",
            sourceUrl: "https://example.com/source-1",
            importedAt: "2026-06-04T09:00:00.000Z",
            lastSeenAt: "2026-06-04T09:30:00.000Z",
          },
        ],
      },
      {
        id: "item-2",
        itemType: "community_group",
        slug: "londra-whatsapp-grubu",
        title: "Londra WhatsApp Grubu",
        headline: "Topluluk grubu",
        shortDescription: "Londra icin topluluk grubu",
        longDescription: "Uzun açıklama 2",
        status: "draft",
        visibility: "private",
        verificationStatus: "pending",
        createdAt: "2026-06-03T10:00:00.000Z",
        updatedAt: "2026-06-03T10:15:00.000Z",
        publishedAt: null,
        primaryCity: "London",
        primaryCountryCode: "GB",
        categoryLabels: ["WhatsApp"],
        sourceTypes: ["whatsapp_landing"],
        thumbnailUrl: null,
        attributes: { featured: false },
        createdByUserId: "user-2",
        categories: [{ slug: "whatsapp", name: "WhatsApp", isPrimary: true }],
        locations: [{ city: "London", countryCode: "GB", addressLine: "Soho", isPrimary: true }],
        sources: [
          {
            sourceType: "whatsapp_landing",
            externalId: "source-2",
            sourceUrl: "https://example.com/source-2",
            importedAt: "2026-06-03T09:00:00.000Z",
            lastSeenAt: "2026-06-03T09:30:00.000Z",
          },
        ],
      },
    ]);
  });

  it("filters catalog rows and opens the detail sheet", async () => {
    render(<AdminCatalogPage />);

    expect(await screen.findByText("Berlin Derneği")).toBeInTheDocument();
    expect(screen.getByText("Londra WhatsApp Grubu")).toBeInTheDocument();

    fireEvent.change(screen.getByRole("searchbox", { name: "Katalog araması" }), {
      target: { value: "whatsapp" },
    });

    await waitFor(() => {
      expect(screen.getByText("Londra WhatsApp Grubu")).toBeInTheDocument();
      expect(screen.queryByText("Berlin Derneği")).not.toBeInTheDocument();
    });

    fireEvent.change(screen.getByRole("searchbox", { name: "Katalog araması" }), {
      target: { value: "" },
    });
    fireEvent.change(screen.getByRole("textbox", { name: "Şehir filtresi" }), {
      target: { value: "Berlin" },
    });

    await waitFor(() => {
      expect(screen.getByText("Berlin Derneği")).toBeInTheDocument();
      expect(screen.queryByText("Londra WhatsApp Grubu")).not.toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Berlin Derneği"));

    expect(await screen.findByText("Kaynak Kayıtları")).toBeInTheDocument();
    expect(screen.getByText("source-1")).toBeInTheDocument();
    expect(screen.getAllByText("Association").length).toBeGreaterThan(0);
    expect(screen.getByText(/Alexanderplatz 1/i)).toBeInTheDocument();
    expect(screen.getByText(/featured/i)).toBeInTheDocument();
  });
});
