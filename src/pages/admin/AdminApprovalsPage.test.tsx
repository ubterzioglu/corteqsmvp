import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

HTMLElement.prototype.scrollIntoView = vi.fn();

vi.mock("@/hooks/admin/useAdminApprovals", () => ({
  useAdminApprovals: () => ({
    data: {
      requests: [
        {
          id: "req-1",
          request_type: "new_profile",
          user_id: "user-1",
          target_role_key: "Consultant_HealthcareDoctor",
          target_feature_key: null,
          target_entity_type: "catalog_item",
          payload: { role_key: "Consultant_HealthcareDoctor", title: "Dr. Ahmet Yılmaz", note: "Diş hekimiyim" },
          status: "pending",
          admin_note: null,
          created_at: "2026-07-23T10:00:00.000Z",
        },
      ],
      users: [],
    },
    isLoading: false,
    error: null,
    refetch: vi.fn(),
    reviewMutation: { isPending: false, variables: undefined, mutateAsync: vi.fn() },
  }),
}));

import AdminApprovalsPage from "@/pages/admin/AdminApprovalsPage";

describe("AdminApprovalsPage — yeni profil filtresi", () => {
  it("lists 'Yeni profil talebi' as a filter option", () => {
    render(<AdminApprovalsPage />);
    fireEvent.click(screen.getByRole("combobox"));
    expect(screen.getByText("Yeni profil talebi", { selector: "[role=option], span" })).toBeDefined();
  });

  it("renders a pending new_profile request in the queue", () => {
    render(<AdminApprovalsPage />);
    expect(screen.getByText("new_profile")).toBeDefined();
  });
});
