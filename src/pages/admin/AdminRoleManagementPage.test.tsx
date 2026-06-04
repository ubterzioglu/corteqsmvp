import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AdminRoleManagementPage from "@/pages/admin/AdminRoleManagementPage";

const { toast, getRoleManagementBundle, fetchCatalogRows, supabaseMock } = vi.hoisted(() => {
  const supabaseMock = {
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn(),
  };
  return {
    toast: vi.fn(),
    getRoleManagementBundle: vi.fn(),
    fetchCatalogRows: vi.fn(),
    supabaseMock,
  };
});

vi.mock("@/hooks/use-toast", () => ({ useToast: () => ({ toast }) }));

vi.mock("@/lib/admin", () => ({
  getRoleManagementBundle,
  upsertEntityMetadataAsAdmin: vi.fn(),
  setAttributeRuleAsAdmin: vi.fn(),
  setRoleFeatureFlagAsAdmin: vi.fn(),
  setFeatureGlobalStateAsAdmin: vi.fn(),
  upsertRoleProfileSectionRuleAsAdmin: vi.fn(),
}));

vi.mock("@/lib/role-catalog", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/role-catalog")>();
  return {
    ...actual,
    fetchCatalogRows,
  };
});

vi.mock("@/integrations/supabase/client", () => ({ supabase: supabaseMock }));

beforeEach(() => {
  window.HTMLElement.prototype.scrollIntoView = vi.fn();
});

const mockRoles = [
  { key: "User_Standard", label: "Standart Kullanıcı" },
  { key: "Consultant_RealEstate", label: "Gayrimenkul Danışmanı" },
];

const mockCatalogRows = [
  {
    kind: "attribute" as const,
    key: "bio",
    label: "Biyografi",
    description: "Kısa tanıtım",
    adminNote: null,
    dataType: "textarea",
    sortOrder: 10,
  },
  {
    kind: "feature" as const,
    key: "profile.edit_own",
    label: "Profil Düzenle",
    description: null,
    adminNote: null,
    isActiveGlobally: true,
    sortOrder: 0,
  },
  {
    kind: "profile_section" as const,
    key: "about_section",
    label: "Hakkında",
    description: null,
    adminNote: null,
    sectionArea: "detail_card",
    sortOrder: 5,
  },
];

const mockBundle = {
  role: { id: "role-uuid-1", key: "User_Standard", label: "Standart Kullanıcı" },
  attributes: [{ key: "bio", label: "Biyografi", description: null, admin_note: null, rule: { is_enabled: true, is_required: false, is_public_default: false, user_can_edit: true, user_can_hide: true, requires_admin_approval_on_change: false, sort_order: 10 } }],
  features: [{ key: "profile.edit_own", label: "Profil Düzenle", description: null, admin_note: null, is_active_globally: true, is_enabled: true }],
  sections: [{ key: "about_section", label: "Hakkında", description: null, admin_note: null, section_area: "detail_card", rule: { is_enabled: true, requires_approval: false, sort_order: 5 } }],
};

const renderPage = () =>
  render(
    <MemoryRouter initialEntries={["/admin/new-member/role-management"]}>
      <AdminRoleManagementPage />
    </MemoryRouter>,
  );

describe("AdminRoleManagementPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    supabaseMock.from.mockReturnThis();
    supabaseMock.select.mockReturnThis();
    supabaseMock.eq.mockReturnThis();
    supabaseMock.order.mockResolvedValue({ data: mockRoles, error: null });
    fetchCatalogRows.mockResolvedValue(mockCatalogRows);
    getRoleManagementBundle.mockResolvedValue(mockBundle);
    window.HTMLElement.prototype.scrollIntoView = vi.fn();
  });

  // RoleSearchSelect + EntityTypeFilter both render role="combobox" — use index 0 for role picker
  const getRolePicker = () => screen.getAllByRole("combobox")[0];

  it("renders role selector and search filter after load", async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getAllByRole("combobox").length).toBeGreaterThanOrEqual(1);
      expect(screen.getByPlaceholderText(/Ara/i)).toBeInTheDocument();
    });
  });

  it("renders unified table with catalog rows when no role selected", async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText("Biyografi")).toBeInTheDocument();
      expect(screen.getByText("Profil Düzenle")).toBeInTheDocument();
      expect(screen.getByText("Hakkında")).toBeInTheDocument();
    });
  });

  it("loads bundle when role is selected", async () => {
    renderPage();
    await waitFor(() => expect(getRolePicker()).toBeInTheDocument());
    fireEvent.click(getRolePicker());
    fireEvent.click(screen.getByText("Standart Kullanıcı"));
    await waitFor(() => {
      expect(getRoleManagementBundle).toHaveBeenCalledWith("User_Standard");
    });
  });

  it("shows edit controls in table after role selected", async () => {
    renderPage();
    await waitFor(() => expect(getRolePicker()).toBeInTheDocument());
    fireEvent.click(getRolePicker());
    fireEvent.click(screen.getByText("Standart Kullanıcı"));
    await waitFor(() => {
      expect(screen.getByText(/Kurallar/i)).toBeInTheDocument();
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

  it("clears role and filters with clear button", async () => {
    renderPage();
    await waitFor(() => expect(getRolePicker()).toBeInTheDocument());

    fireEvent.click(getRolePicker());
    fireEvent.click(screen.getByText("Standart Kullanıcı"));
    await waitFor(() => {
      expect(getRoleManagementBundle).toHaveBeenCalledWith("User_Standard");
    });

    fireEvent.change(screen.getByPlaceholderText(/Ara/i), { target: { value: "bio" } });
    expect(screen.getByPlaceholderText(/Ara/i)).toHaveValue("bio");

    fireEvent.click(screen.getByRole("button", { name: /Seçimi temizle/i }));

    await waitFor(() => {
      expect(getRolePicker()).toHaveTextContent("Rol seç");
      expect(screen.getByPlaceholderText(/Ara/i)).toHaveValue("");
      expect(screen.getByText("Profil Düzenle")).toBeInTheDocument();
      expect(screen.getByText("Hakkında")).toBeInTheDocument();
    });
  });

  it("shows error toast when catalog load fails", async () => {
    fetchCatalogRows.mockRejectedValue(new Error("Katalog hatası"));
    renderPage();
    await waitFor(() => {
      expect(toast).toHaveBeenCalledWith(
        expect.objectContaining({ variant: "destructive" }),
      );
    });
  });
});
