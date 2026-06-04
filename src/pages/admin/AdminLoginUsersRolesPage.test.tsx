import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import AdminLoginUsersRolesPage from "@/pages/admin/AdminLoginUsersRolesPage";

const { toast, setUserRoleAsAdmin, updateUserProfileAttributeAsAdmin, updateUserTaxonomySelectionAsAdmin } = vi.hoisted(() => ({
  toast: vi.fn(),
  setUserRoleAsAdmin: vi.fn(),
  updateUserProfileAttributeAsAdmin: vi.fn(),
  updateUserTaxonomySelectionAsAdmin: vi.fn(),
}));

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({
    toast,
  }),
}));

vi.mock("@/lib/admin", () => ({
  setUserRoleAsAdmin,
  updateUserProfileAttributeAsAdmin,
  updateUserTaxonomySelectionAsAdmin,
}));

const roles = [
  { id: "role-bireysel", key: "bireysel", label: "Bireysel Kullanıcı", sort_order: 10, is_active: true },
  { id: "role-danisman", key: "danisman", label: "Danışman", sort_order: 20, is_active: true },
];

const userProfiles = [
  {
    user_id: "user-1",
    email: "ayse@example.com",
    full_name: "Ayşe Yılmaz",
    profile_type: "bireysel",
    auth_provider: "google",
    created_at: "2026-05-24T13:30:04.000Z",
  },
  {
    user_id: "user-2",
    email: "mehmet@example.com",
    full_name: "Mehmet Kara",
    profile_type: "danisman",
    auth_provider: "google",
    created_at: "2026-05-23T13:30:04.000Z",
  },
];

const roleAssignments = [
  { user_id: "user-1", role_id: "role-bireysel" },
  { user_id: "user-2", role_id: "role-danisman" },
];

const pendingApprovals = [{ user_id: "user-1", status: "pending" }];
const overrides = [{ user_id: "user-1", feature_key: "profile-edit" }];
const userProfileAttributes = [
  {
    attribute_id: "attr-bio",
    value_text: "Kurucu ekipten.",
    value_json: null,
    visibility: "public",
    approval_status: "approved",
  },
];
const attributeCatalog = [
  {
    id: "attr-bio",
    key: "bio",
    label: "Bio",
    description: "Kısa açıklama",
    data_type: "textarea",
    is_system: false,
    sort_order: 20,
  },
  {
    id: "attr-country",
    key: "country",
    label: "Ülke",
    description: "Profil ülkesi",
    data_type: "text",
    is_system: false,
    sort_order: 30,
  },
];
const userTaxonomySelections = [{ group_id: "group-focus", option_id: "option-community" }];
const roleTaxonomyRules = [{ group_id: "group-focus" }];
const taxonomyGroups = [
  { id: "group-focus", key: "focus", label: "Odak", description: "İlgi alanı", sort_order: 10 },
];
const taxonomyOptions = [
  { id: "option-community", group_id: "group-focus", key: "community", label: "Community", description: null, sort_order: 10 },
  { id: "option-growth", group_id: "group-focus", key: "growth", label: "Growth", description: null, sort_order: 20 },
];

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: (table: string) => {
      if (table === "roles") {
        return {
          select: () => ({
            eq: () => ({
              order: () => Promise.resolve({ data: roles, error: null }),
            }),
          }),
        };
      }

      if (table === "user_profiles") {
        return {
          select: () => {
            const query = {
              eq: () => query,
              or: () => query,
              gte: () => query,
              lt: () => query,
              order: () => Promise.resolve({ data: userProfiles, error: null }),
            };
            return query;
          },
        };
      }

      if (table === "user_role_assignments") {
        return {
          select: () => ({
            in: () => Promise.resolve({ data: roleAssignments, error: null }),
          }),
        };
      }

      if (table === "approval_requests") {
        return {
          select: () => ({
            eq: () => ({
              in: () => Promise.resolve({ data: pendingApprovals, error: null }),
            }),
          }),
        };
      }

      if (table === "user_feature_overrides") {
        return {
          select: () => ({
            in: () => Promise.resolve({ data: overrides, error: null }),
          }),
        };
      }

      if (table === "user_profile_attributes") {
        return {
          select: () => ({
            eq: () => Promise.resolve({ data: userProfileAttributes, error: null }),
          }),
        };
      }

      if (table === "attribute_catalog") {
        return {
          select: () => ({
            eq: () => ({
              order: () => Promise.resolve({ data: attributeCatalog, error: null }),
            }),
          }),
        };
      }

      if (table === "user_taxonomy_selections") {
        return {
          select: () => ({
            eq: () => Promise.resolve({ data: userTaxonomySelections, error: null }),
          }),
        };
      }

      if (table === "role_taxonomy_rules") {
        return {
          select: () => {
            const query = {
              eq: () => query,
            };
            query.eq = vi
              .fn()
              .mockImplementationOnce(() => query)
              .mockImplementationOnce(() => Promise.resolve({ data: roleTaxonomyRules, error: null }));
            return query;
          },
        };
      }

      if (table === "taxonomy_groups") {
        return {
          select: () => ({
            in: () => Promise.resolve({ data: taxonomyGroups, error: null }),
          }),
        };
      }

      if (table === "taxonomy_options") {
        return {
          select: () => ({
            in: () => Promise.resolve({ data: taxonomyOptions, error: null }),
          }),
        };
      }

      throw new Error(`Unexpected table ${table}`);
    },
  },
}));

const SearchProbe = () => {
  const location = useLocation();
  return <div data-testid="search-probe">{location.search}</div>;
};

function renderPage(initialEntry = "/admin/new-member/users-roles") {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route
          path="/admin/new-member/users-roles"
          element={
            <>
              <SearchProbe />
              <AdminLoginUsersRolesPage />
            </>
          }
        />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  Object.defineProperty(HTMLElement.prototype, "scrollIntoView", {
    configurable: true,
    value: vi.fn(),
  });
  toast.mockReset();
  setUserRoleAsAdmin.mockReset();
  updateUserProfileAttributeAsAdmin.mockReset();
  updateUserTaxonomySelectionAsAdmin.mockReset();
  setUserRoleAsAdmin.mockResolvedValue(undefined);
  updateUserProfileAttributeAsAdmin.mockResolvedValue(undefined);
  updateUserTaxonomySelectionAsAdmin.mockResolvedValue(undefined);
});

describe("AdminLoginUsersRolesPage", () => {
  it("renders details actions and removes role/status columns from the table", async () => {
    renderPage();

    expect(await screen.findByText("Ayşe Yılmaz")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Details" })).toHaveLength(2);
    expect(screen.queryByRole("columnheader", { name: "Rol" })).not.toBeInTheDocument();
    expect(screen.queryByRole("columnheader", { name: "Durum Özeti" })).not.toBeInTheDocument();
  });

  it("syncs active filters to the URL", async () => {
    renderPage();

    expect(await screen.findByText("Ayşe Yılmaz")).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText("Örn: ayse / @mail.com"), { target: { value: "mehmet" } });

    await waitFor(() => {
      expect(screen.getByTestId("search-probe")).toHaveTextContent("q=mehmet");
    });
  });

  it("opens the details modal with role, status summary, and editable fields", async () => {
    renderPage();

    expect(await screen.findByText("Ayşe Yılmaz")).toBeInTheDocument();

    fireEvent.click(screen.getAllByRole("button", { name: "Details" })[0]);

    expect(await screen.findByRole("heading", { name: "Kullanıcı Details" })).toBeInTheDocument();
    expect(screen.getByText(/Rol: Bireysel Kullanıcı/i)).toBeInTheDocument();
    expect(screen.getByText("Pending: 1")).toBeInTheDocument();
    expect(screen.getByText("Override: 1")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Ayşe Yılmaz")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Kurucu ekipten.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Tüm Değişiklikleri Kaydet" })).toBeInTheDocument();
    fireEvent.click(screen.getAllByRole("combobox")[1]);
    expect(screen.getAllByText("public").length).toBeGreaterThan(0);
    expect(screen.getAllByText("private").length).toBeGreaterThan(0);
    expect(screen.queryByText("admin_only")).not.toBeInTheDocument();
  });

  it("saves all dialog changes through admin helpers", async () => {
    renderPage();

    expect(await screen.findByText("Ayşe Yılmaz")).toBeInTheDocument();

    fireEvent.click(screen.getAllByRole("button", { name: "Details" })[0]);
    expect(await screen.findByRole("heading", { name: "Kullanıcı Details" })).toBeInTheDocument();

    fireEvent.change(screen.getByDisplayValue("Kurucu ekipten."), { target: { value: "Topluluk lideri." } });
    fireEvent.click(screen.getByRole("button", { name: "Growth" }));
    fireEvent.click(screen.getByRole("button", { name: "Tüm Değişiklikleri Kaydet" }));

    await waitFor(() => {
      expect(updateUserProfileAttributeAsAdmin).toHaveBeenCalled();
    });

    expect(setUserRoleAsAdmin).not.toHaveBeenCalled();
    expect(updateUserProfileAttributeAsAdmin).toHaveBeenCalledTimes(1);
    expect(updateUserProfileAttributeAsAdmin).toHaveBeenCalledWith("user-1", "bio", "Topluluk lideri.", "public");
    expect(updateUserTaxonomySelectionAsAdmin).toHaveBeenCalledWith("user-1", "focus", ["community", "growth"]);
  });

  it("does not show success or continue saving when role update fails", async () => {
    setUserRoleAsAdmin.mockRejectedValueOnce(new Error("role update failed"));
    renderPage();

    expect(await screen.findByText("Ayşe Yılmaz")).toBeInTheDocument();

    fireEvent.click(screen.getAllByRole("button", { name: "Details" })[0]);
    expect(await screen.findByRole("heading", { name: "Kullanıcı Details" })).toBeInTheDocument();

    fireEvent.click(screen.getAllByRole("combobox")[0]);
    fireEvent.click(await screen.findByText("Danışman"));
    fireEvent.click(screen.getByRole("button", { name: "Tüm Değişiklikleri Kaydet" }));

    await waitFor(() => {
      expect(setUserRoleAsAdmin).toHaveBeenCalledWith("user-1", "danisman");
    });

    expect(updateUserProfileAttributeAsAdmin).not.toHaveBeenCalled();
    expect(updateUserTaxonomySelectionAsAdmin).not.toHaveBeenCalled();
    expect(toast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Details kaydedilemedi",
        description: "role update failed",
        variant: "destructive",
      }),
    );
    expect(toast).not.toHaveBeenCalledWith(expect.objectContaining({ title: "Details kaydedildi" }));
  });
});
