import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import AdminCatalogPage from "@/pages/admin/AdminCatalogPage";

const toast = vi.fn();
const listAdminUnifiedRecordsMock = vi.fn();
const listAdminCatalogItemTypesMock = vi.fn();
const listAdminCatalogRolesMock = vi.fn();
const getAdminCatalogItemDetailMock = vi.fn();

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({
    toast,
  }),
}));

vi.mock("@/components/admin/catalog/CatalogItemRolePanel", () => ({
  default: () => <div>Role Panel Mock</div>,
}));

vi.mock("@/components/admin/catalog/CatalogItemEditorsPanel", () => ({
  default: () => <div>Editors Panel Mock</div>,
}));

vi.mock("@/components/admin/catalog/CatalogClaimRequestsPanel", () => ({
  default: () => <div>Claims Panel Mock</div>,
}));

vi.mock("@/lib/admin-catalog", async () => {
  const actual = await vi.importActual<typeof import("@/lib/admin-catalog")>("@/lib/admin-catalog");

  return {
    ...actual,
    listAdminUnifiedRecords: (...args: unknown[]) => listAdminUnifiedRecordsMock(...args),
    listAdminCatalogItemTypes: (...args: unknown[]) => listAdminCatalogItemTypesMock(...args),
    listAdminCatalogRoles: (...args: unknown[]) => listAdminCatalogRolesMock(...args),
    getAdminCatalogItemDetail: (...args: unknown[]) => getAdminCatalogItemDetailMock(...args),
  };
});

const baseRecords = [
  {
    id: "item-1",
    kind: "catalog_item" as const,
    slug: "berlin-dernegi",
    itemType: "organization",
    title: "Berlin Derneği",
    summary: "Resmi topluluk kaydı",
    status: "published",
    visibility: "public",
    verificationStatus: "official_source",
    platformRoleKey: "Organization_Association",
    primaryCity: "Berlin",
    primaryCountryCode: "DE",
    categoryLabels: ["Association"],
    sourceTypes: ["turkish_mission"],
    createdAt: "2026-06-04T10:00:00.000Z",
    updatedAt: "2026-06-04T10:15:00.000Z",
    profileType: null,
    email: null,
  },
  {
    id: "profile-1",
    kind: "profile" as const,
    slug: null,
    itemType: null,
    title: "Ayşe Yılmaz",
    summary: "ayse@example.com",
    status: "directory_opted_in",
    visibility: null,
    verificationStatus: null,
    platformRoleKey: "Community_Leader",
    primaryCity: "Dortmund",
    primaryCountryCode: "DE",
    categoryLabels: [],
    sourceTypes: [],
    createdAt: "2026-06-03T10:00:00.000Z",
    updatedAt: "2026-06-03T10:15:00.000Z",
    profileType: "Community_Leader",
    email: "ayse@example.com",
  },
];

describe("AdminCatalogPage", () => {
  beforeEach(() => {
    toast.mockReset();
    listAdminCatalogItemTypesMock.mockResolvedValue([{ key: "organization", label: "Organization" }]);
    listAdminCatalogRolesMock.mockResolvedValue([
      { key: "Organization_Association", label: "Dernek" },
      { key: "Community_Leader", label: "Topluluk Lideri" },
    ]);
    listAdminUnifiedRecordsMock.mockImplementation(
      ({ filters }: { filters: { kind: string; query: string; platformRoleKey?: string } }) => {
        let records = [...baseRecords];

        if (filters.kind) {
          records = records.filter((record) => record.kind === filters.kind);
        }

        if (filters.query) {
          const normalized = filters.query.toLocaleLowerCase("tr-TR");
          records = records.filter((record) =>
            [record.title, record.summary ?? "", record.slug ?? "", record.email ?? ""]
              .join(" ")
              .toLocaleLowerCase("tr-TR")
              .includes(normalized),
          );
        }

        if (filters.platformRoleKey) {
          records = records.filter((record) => record.platformRoleKey === filters.platformRoleKey);
        }

        return Promise.resolve({
          records,
          totalCount: records.length,
          page: 1,
          pageSize: 50,
        });
      },
    );
    getAdminCatalogItemDetailMock.mockResolvedValue({
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
      platformRoleKey: "Organization_Association",
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
    });
  });

  it("filters unified rows and opens catalog details", async () => {
    render(<AdminCatalogPage />);

    await waitFor(() => {
      expect(screen.getByText("Berlin Derneği")).toBeInTheDocument();
      expect(screen.getByText("Ayşe Yılmaz")).toBeInTheDocument();
    });

    fireEvent.change(screen.getByRole("searchbox", { name: "Katalog araması" }), {
      target: { value: "ayşe" },
    });

    await waitFor(() => {
      expect(screen.getByText("Ayşe Yılmaz")).toBeInTheDocument();
      expect(screen.queryByText("Berlin Derneği")).not.toBeInTheDocument();
    });

    fireEvent.change(screen.getByRole("searchbox", { name: "Katalog araması" }), {
      target: { value: "" },
    });

    await waitFor(() => {
      expect(screen.getByText("Berlin Derneği")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Berlin Derneği"));

    expect(await screen.findByRole("tab", { name: "Rol & Kurallar" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Talepler" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Düzenleyiciler" })).toBeInTheDocument();
    expect(screen.getByText(/Alexanderplatz 1/i)).toBeInTheDocument();
  });

  it("filters by kind and shows profile-specific detail without catalog tabs", async () => {
    render(<AdminCatalogPage />);

    await waitFor(() => {
      expect(screen.getByText("Berlin Derneği")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("combobox", { name: "Tür filtresi" }));
    fireEvent.click(screen.getByRole("option", { name: "Kullanıcı" }));

    await waitFor(() => {
      expect(screen.getByText("Ayşe Yılmaz")).toBeInTheDocument();
      expect(screen.queryByText("Berlin Derneği")).not.toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Ayşe Yılmaz"));

    expect(await screen.findByText("Profil Özeti")).toBeInTheDocument();
    expect(screen.queryByRole("tab", { name: "Rol & Kurallar" })).not.toBeInTheDocument();
    expect(screen.getByText(/profile-uygun özet/i)).toBeInTheDocument();
  });

  it("renders compact column codes, legend, and role labels", async () => {
    render(<AdminCatalogPage />);

    await waitFor(() => {
      expect(screen.getByText("Berlin Derneği")).toBeInTheDocument();
    });

    expect(screen.getByText("KTG = Katalog")).toBeInTheDocument();
    expect(screen.getByText("YAY = Yayında")).toBeInTheDocument();
    expect(screen.getByText("RES = Resmi Kaynak")).toBeInTheDocument();
    expect(screen.getByText("Kısaltma Rehberi")).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Rol" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Tür Kısaltmaları/i }));
    expect(
      screen.getByText("CSV, import, manuel giriş veya başka kaynaklardan gelen katalog kayıtlarını temsil eder."),
    ).toBeInTheDocument();

    const berlinRow = screen.getByText("Berlin Derneği").closest("tr");
    expect(berlinRow).not.toBeNull();

    const rowScope = within(berlinRow as HTMLTableRowElement);
    expect(rowScope.getByText("KTG")).toBeInTheDocument();
    expect(rowScope.getByText("YAY")).toBeInTheDocument();
    expect(rowScope.getByText("RES")).toBeInTheDocument();
    expect(rowScope.getByText("Dernek")).toBeInTheDocument();
  });

  it("filters rows by platform role", async () => {
    render(<AdminCatalogPage />);

    await waitFor(() => {
      expect(screen.getByText("Berlin Derneği")).toBeInTheDocument();
      expect(screen.getByText("Ayşe Yılmaz")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("combobox", { name: "Rol filtresi" }));
    fireEvent.click(screen.getByRole("option", { name: "Dernek" }));

    await waitFor(() => {
      expect(screen.getByText("Berlin Derneği")).toBeInTheDocument();
      expect(screen.queryByText("Ayşe Yılmaz")).not.toBeInTheDocument();
    });
  });

  it("falls back to platform role key when role label is unavailable", async () => {
    listAdminCatalogRolesMock.mockResolvedValue([{ key: "Organization_Association", label: "Dernek" }]);

    render(<AdminCatalogPage />);

    await waitFor(() => {
      expect(screen.getByText("Ayşe Yılmaz")).toBeInTheDocument();
    });

    expect(screen.getByText("Community_Leader")).toBeInTheDocument();
  });
});
