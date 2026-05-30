import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import AdminAttributesPage from "@/pages/admin/AdminAttributesPage";

const { toast, setAttributeRuleAsAdmin } = vi.hoisted(() => ({
  toast: vi.fn(),
  setAttributeRuleAsAdmin: vi.fn(),
}));

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({
    toast,
  }),
}));

vi.mock("@/lib/admin", () => ({
  setAttributeRuleAsAdmin,
}));

const roles = [
  { id: "role-bireysel", key: "bireysel", label: "Bireysel Kullanıcı", sort_order: 10 },
  { id: "role-danisman", key: "danisman", label: "Danışman", sort_order: 20 },
];

const attributes = [
  {
    id: "attr-bio",
    key: "bio",
    label: "Bio",
    description: "Kısa tanıtım",
    data_type: "text",
    is_active: true,
    is_system: false,
    sort_order: 10,
  },
];

const rules = [
  {
    id: "rule-1",
    role_id: "role-bireysel",
    attribute_id: "attr-bio",
    is_enabled: true,
    is_required: false,
    is_public_default: false,
    user_can_edit: true,
    user_can_hide: true,
    requires_admin_approval_on_change: false,
    sort_order: 10,
  },
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

      if (table === "attribute_catalog") {
        return {
          select: () => ({
            eq: () => ({
              order: () => Promise.resolve({ data: attributes, error: null }),
            }),
          }),
        };
      }

      if (table === "role_attribute_rules") {
        return {
          select: () => Promise.resolve({ data: rules, error: null }),
        };
      }

      throw new Error(`Unexpected table ${table}`);
    },
  },
}));

const SearchProbe = () => {
  const location = useLocation();
  return <div data-testid="back-search">{location.search}</div>;
};

function renderPage(initialEntry: string | { pathname: string; search?: string; state?: unknown }) {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path="/admin/new-member/attributes" element={<AdminAttributesPage />} />
        <Route
          path="/admin/new-member/users-roles"
          element={
            <>
              <div>Users Roles Page</div>
              <SearchProbe />
            </>
          }
        />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  toast.mockReset();
  setAttributeRuleAsAdmin.mockReset();
});

describe("AdminAttributesPage", () => {
  it("shows selected user context, preselects the role, and returns with preserved filters", async () => {
    renderPage({
      pathname: "/admin/new-member/attributes",
      search: "?selectedRoleId=role-bireysel&q=ayse&provider=all&from=2026-05-20&to=2026-05-25&sort=name_asc",
      state: {
        userId: "user-1",
        userName: "Ayşe Yılmaz",
        userEmail: "ayse@example.com",
        selectedRoleId: "role-bireysel",
        backTo: "/admin/new-member/users-roles?q=ayse&provider=all&from=2026-05-20&to=2026-05-25&sort=name_asc",
      },
    });

    expect(await screen.findByText("Kullanıcı bağlamı")).toBeInTheDocument();
    expect(screen.getByText("Ayşe Yılmaz")).toBeInTheDocument();
    expect(screen.getByText("ayse@example.com")).toBeInTheDocument();
    expect(screen.getByText(/Bu kullanıcı için rol bazlı attribute kuralları görüntüleniyor/i)).toBeInTheDocument();
    expect(screen.getByRole("combobox")).toHaveTextContent("Bireysel Kullanıcı");

    fireEvent.click(screen.getByRole("button", { name: /Loginli Kullanıcılar & Roller paneline dön/i }));

    await waitFor(() => {
      expect(screen.getByText("Users Roles Page")).toBeInTheDocument();
    });

    expect(screen.getByTestId("back-search")).toHaveTextContent("q=ayse");
    expect(screen.getByTestId("back-search")).toHaveTextContent("provider=all");
    expect(screen.getByTestId("back-search")).toHaveTextContent("from=2026-05-20");
    expect(screen.getByTestId("back-search")).toHaveTextContent("to=2026-05-25");
    expect(screen.getByTestId("back-search")).toHaveTextContent("sort=name_asc");
  });

  it("falls back to the general role view when route state is absent", async () => {
    renderPage("/admin/new-member/attributes?selectedRoleId=role-danisman");

    expect(await screen.findByText("Kullanıcı bağlamı")).toBeInTheDocument();
    expect(screen.getByText(/Genel rol görünümü açık/i)).toBeInTheDocument();
    expect(screen.getByRole("combobox")).toHaveTextContent("Danışman");
  });
});
