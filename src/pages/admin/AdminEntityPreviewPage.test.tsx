import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AdminEntityPreviewPage from "@/pages/admin/AdminEntityPreviewPage";

const { toast, fetchCatalogRows } = vi.hoisted(() => ({
  toast: vi.fn(),
  fetchCatalogRows: vi.fn(),
}));

vi.mock("@/hooks/use-toast", () => ({ useToast: () => ({ toast }) }));

vi.mock("@/lib/role-catalog", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/role-catalog")>();
  return { ...actual, fetchCatalogRows };
});

const mockRows = [
  { kind: "attribute" as const, key: "bio", label: "Biyografi", description: "Kısa tanıtım", adminNote: "Admin notu", dataType: "textarea", sortOrder: 10 },
  { kind: "feature" as const, key: "profile.edit_own", label: "Profil Düzenle", description: null, adminNote: null, isActiveGlobally: true, sortOrder: 0 },
  { kind: "profile_section" as const, key: "about_section", label: "Hakkında", description: "Hakkında bölümü", adminNote: null, sectionArea: "detail_card", sortOrder: 5 },
];

const renderPage = () =>
  render(
    <MemoryRouter>
      <AdminEntityPreviewPage />
    </MemoryRouter>,
  );

describe("AdminEntityPreviewPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fetchCatalogRows.mockResolvedValue(mockRows);
  });

  it("renders page title", () => {
    renderPage();
    expect(screen.getByText("AFS Önizleme")).toBeInTheDocument();
  });

  it("shows search filter and type dropdown", async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/Ara/i)).toBeInTheDocument();
    });
  });

  it("renders all rows after load", async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText("Biyografi")).toBeInTheDocument();
      expect(screen.getByText("Profil Düzenle")).toBeInTheDocument();
      expect(screen.getByText("Hakkında")).toBeInTheDocument();
    });
  });

  it("does not render key column", async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.queryByText("bio")).not.toBeInTheDocument();
      expect(screen.queryByText("profile.edit_own")).not.toBeInTheDocument();
    });
  });

  it("renders descriptions", async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText("Kısa tanıtım")).toBeInTheDocument();
    });
  });

  it("renders admin notes", async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText("Admin notu")).toBeInTheDocument();
    });
  });

  it("filters rows by search text", async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText("Biyografi")).toBeInTheDocument());
    fireEvent.change(screen.getByPlaceholderText(/Ara/i), { target: { value: "bio" } });
    await waitFor(() => {
      expect(screen.getByText("Biyografi")).toBeInTheDocument();
      expect(screen.queryByText("Profil Düzenle")).not.toBeInTheDocument();
    });
  });

  it("shows count of visible vs total rows", async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText(/3 \/ 3/)).toBeInTheDocument();
    });
  });

  it("shows empty state when no match", async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText("Biyografi")).toBeInTheDocument());
    fireEvent.change(screen.getByPlaceholderText(/Ara/i), { target: { value: "xyznotfound" } });
    await waitFor(() => {
      expect(screen.getByText(/bulunamadı/i)).toBeInTheDocument();
    });
  });

  it("shows error toast on load failure", async () => {
    fetchCatalogRows.mockRejectedValue(new Error("Katalog hatası"));
    renderPage();
    await waitFor(() => {
      expect(toast).toHaveBeenCalledWith(expect.objectContaining({ variant: "destructive" }));
    });
  });
});
