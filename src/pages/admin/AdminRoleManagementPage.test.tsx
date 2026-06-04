import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AdminRoleManagementPage from "@/pages/admin/AdminRoleManagementPage";

// vi.hoisted ensures all mocks are defined before vi.mock factories run
const { toast, getRoleManagementBundle, supabaseMock } = vi.hoisted(() => {
  const supabaseMock = {
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn(),
  };
  return {
    toast: vi.fn(),
    getRoleManagementBundle: vi.fn(),
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

vi.mock("@/integrations/supabase/client", () => ({ supabase: supabaseMock }));

// cmdk uses scrollIntoView internally; jsdom does not implement it
beforeEach(() => {
  window.HTMLElement.prototype.scrollIntoView = vi.fn();
});

const mockRoles = [
  { key: "User_Standard", label: "Standart Kullanıcı" },
  { key: "Consultant_RealEstate", label: "Gayrimenkul Danışmanı" },
];

const mockBundle = {
  role: { id: "role-uuid-1", key: "User_Standard", label: "Standart Kullanıcı" },
  attributes: [
    {
      key: "bio",
      label: "Biyografi",
      description: "Kısa tanıtım",
      admin_note: null,
      rule: {
        is_enabled: true,
        is_required: false,
        is_public_default: false,
        user_can_edit: true,
        user_can_hide: true,
        requires_admin_approval_on_change: false,
        sort_order: 10,
      },
    },
  ],
  features: [
    {
      key: "profile.edit_own",
      label: "Profil Düzenle",
      description: null,
      admin_note: null,
      is_active_globally: true,
      is_enabled: true,
    },
  ],
  sections: [
    {
      key: "about_section",
      label: "Hakkında",
      description: null,
      admin_note: null,
      section_area: "detail_card",
      rule: { is_enabled: true, requires_approval: false, sort_order: 10 },
    },
  ],
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
    getRoleManagementBundle.mockResolvedValue(mockBundle);
    window.HTMLElement.prototype.scrollIntoView = vi.fn();
  });

  it("renders role selector combobox after roles load", async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByRole("combobox")).toBeInTheDocument();
    });
  });

  it("shows instruction text when no role selected", async () => {
    renderPage();
    await waitFor(() => {
      expect(
        screen.getByText(/yönetmek istediğin rolü yukarıdan seç/i),
      ).toBeInTheDocument();
    });
  });

  it("opens role picker popover on click", async () => {
    renderPage();
    await waitFor(() => expect(screen.getByRole("combobox")).toBeInTheDocument());
    fireEvent.click(screen.getByRole("combobox"));
    expect(screen.getByPlaceholderText("Rol ara...")).toBeInTheDocument();
  });

  it("loads bundle when role is selected", async () => {
    renderPage();
    await waitFor(() => expect(screen.getByRole("combobox")).toBeInTheDocument());
    fireEvent.click(screen.getByRole("combobox"));
    fireEvent.click(screen.getByText("Standart Kullanıcı"));
    await waitFor(() => {
      expect(getRoleManagementBundle).toHaveBeenCalledWith("User_Standard");
    });
  });

  it("renders three sub-panels after bundle loads", async () => {
    renderPage();
    await waitFor(() => expect(screen.getByRole("combobox")).toBeInTheDocument());
    fireEvent.click(screen.getByRole("combobox"));
    fireEvent.click(screen.getByText("Standart Kullanıcı"));
    await waitFor(() => {
      expect(screen.getByText("Attribute Kuralları")).toBeInTheDocument();
      expect(screen.getByText("Feature Bayrakları")).toBeInTheDocument();
      expect(screen.getByText("Profil Bölümleri")).toBeInTheDocument();
    });
  });

  it("shows error toast when bundle load fails", async () => {
    getRoleManagementBundle.mockRejectedValue(new Error("RPC hatası"));
    renderPage();
    await waitFor(() => expect(screen.getByRole("combobox")).toBeInTheDocument());
    fireEvent.click(screen.getByRole("combobox"));
    fireEvent.click(screen.getByText("Standart Kullanıcı"));
    await waitFor(() => {
      expect(toast).toHaveBeenCalledWith(
        expect.objectContaining({ variant: "destructive" }),
      );
    });
  });
});
