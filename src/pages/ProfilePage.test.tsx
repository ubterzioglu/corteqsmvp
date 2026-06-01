import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import type { CurrentUserProfilePayload } from "@/lib/member-profile";
import ProfilePage from "@/pages/ProfilePage";

const useAuthMock = vi.fn();
const useCurrentUserProfileMock = vi.fn();
const useCurrentUserDashboardMock = vi.fn();

vi.mock("@/components/auth/useAuth", () => ({
  useAuth: () => useAuthMock(),
}));

vi.mock("@/hooks/useCurrentUserProfile", () => ({
  useCurrentUserProfile: (...args: unknown[]) => useCurrentUserProfileMock(...args),
}));

vi.mock("@/hooks/useCurrentUserDashboard", () => ({
  useCurrentUserDashboard: (...args: unknown[]) => useCurrentUserDashboardMock(...args),
}));

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      signOut: vi.fn(),
    },
  },
}));

describe("ProfilePage", () => {
  const baseProfile: CurrentUserProfilePayload = {
    userId: "u-1",
    email: "firmascope@gmail.com",
    fullName: "firmascope",
    profileType: "bireysel",
    roleKey: "bireysel",
    roleLabel: "Bireysel",
    roleDescription: "Temel bireysel profil",
    roleSlug: "individual",
    features: [
      { key: "directory.visible", isEnabled: false, source: "role_default" },
      { key: "events.create", isEnabled: false, source: "role_default" },
    ],
    attributes: [
      {
        attributeKey: "full_name",
        label: "Görünen İsim",
        description: "Profil ismi",
        dataType: "text",
        isSystem: true,
        sortOrder: 10,
        isRequired: true,
        isPublicDefault: true,
        userCanEdit: true,
        userCanHide: false,
        requiresAdminApprovalOnChange: false,
        visibility: "public",
        approvalStatus: "approved",
        valueText: "firmascope",
        valueJson: null,
        displayValue: "firmascope",
      },
      {
        attributeKey: "bio_short",
        label: "Kısa Açıklama",
        description: "Kısa bio",
        dataType: "textarea",
        isSystem: true,
        sortOrder: 50,
        isRequired: false,
        isPublicDefault: true,
        userCanEdit: true,
        userCanHide: true,
        requiresAdminApprovalOnChange: false,
        visibility: "public",
        approvalStatus: "approved",
        valueText: "Diaspora için iş birliği ve mentorluk fırsatlarına açığım.",
        valueJson: null,
        displayValue: "Diaspora için iş birliği ve mentorluk fırsatlarına açığım.",
      },
      {
        attributeKey: "interests",
        label: "İlgi Alanları",
        description: "Rol özel alan",
        dataType: "textarea",
        isSystem: false,
        sortOrder: 110,
        isRequired: false,
        isPublicDefault: true,
        userCanEdit: true,
        userCanHide: true,
        requiresAdminApprovalOnChange: false,
        visibility: "public",
        approvalStatus: "approved",
        valueText: "mentorluk, topluluk, networking",
        valueJson: null,
        displayValue: "mentorluk, topluluk, networking",
      },
    ],
    taxonomyGroups: [],
    pendingRequests: [],
    profileCompletion: {
      requiredTotal: 1,
      requiredCompleted: 1,
      percentage: 100,
    },
  };

  it("falls back to bireysel on invalid slug", async () => {
    useAuthMock.mockReturnValue({
      user: { id: "u-1", email: "user@test.com", user_metadata: {} },
    });
    useCurrentUserDashboardMock.mockReturnValue({
      isLoading: false,
      errorMessage: null,
      items: [],
      refreshDashboard: vi.fn(),
    });
    useCurrentUserProfileMock.mockReturnValue({
      isLoading: false,
      errorMessage: null,
      profile: null,
      refreshProfile: vi.fn(),
    });

    render(
      <MemoryRouter initialEntries={["/profile/invalid"]}>
        <Routes>
          <Route path="/profile/:type" element={<ProfilePage />} />
          <Route path="/profile/bireysel" element={<div>Bireysel Profil</div>} />
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByText("Bireysel Profil")).toBeInTheDocument();
  });

  it("redirects to assigned profile type from current profile payload", async () => {
    useAuthMock.mockReturnValue({
      user: { id: "u-1", email: "user@test.com", user_metadata: {} },
    });
    useCurrentUserDashboardMock.mockReturnValue({
      isLoading: false,
      errorMessage: null,
      items: [],
      refreshDashboard: vi.fn(),
    });
    useCurrentUserProfileMock.mockReturnValue({
      isLoading: false,
      errorMessage: null,
      profile: { ...baseProfile, profileType: "danisman", roleKey: "danisman", roleLabel: "Consultant", roleSlug: "consultant" },
      refreshProfile: vi.fn(),
    });

    render(
      <MemoryRouter initialEntries={["/profile/isletme"]}>
        <Routes>
          <Route path="/profile/:type" element={<ProfilePage />} />
          <Route path="/profile/danisman" element={<div>Danisman Profil</div>} />
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByText("Danisman Profil")).toBeInTheDocument();
  });

  it("renders role-aware profile blocks for bireysel users", async () => {
    useAuthMock.mockReturnValue({
      user: { id: "u-1", email: "firmascope@gmail.com", user_metadata: { name: "firmascope" } },
    });
    useCurrentUserDashboardMock.mockReturnValue({
      isLoading: false,
      errorMessage: null,
      items: [
        {
          feature_key: "dashboard.tab_profil_ayarlari",
          label: "Dashboard: Profil Ayarları",
          description: "Profil ayarları tabına erişim",
          scope: "dashboard",
          feature_type: "tab",
          is_enabled: true,
          source: "role_default",
          sort_order: 510,
        },
      ],
      refreshDashboard: vi.fn(),
    });
    useCurrentUserProfileMock.mockReturnValue({
      isLoading: false,
      errorMessage: null,
      profile: baseProfile,
      refreshProfile: vi.fn(),
    });

    render(
      <MemoryRouter initialEntries={["/profile/bireysel"]}>
        <Routes>
          <Route path="/profile/:type" element={<ProfilePage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByText("Bireysel Kullanıcı")).toBeInTheDocument();
    expect(screen.getByText("Ortak Profil Alanları")).toBeInTheDocument();
    expect(screen.getByText("Rolüne Özel Alanlar")).toBeInTheDocument();
    expect(screen.getByText("Alt Kategori / Alt Tip")).toBeInTheDocument();
    expect(screen.getByText("Feature Talepleri")).toBeInTheDocument();
    expect(screen.getByText("Açık Dashboard Erişimleri")).toBeInTheDocument();
    expect(screen.getByText("Cift Modlu Profil Merkezi")).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Public Onizleme" })).toBeInTheDocument();
    expect(screen.getAllByText("Diaspora için iş birliği ve mentorluk fırsatlarına açığım.").length).toBeGreaterThan(0);
    expect(screen.getAllByText("mentorluk, topluluk, networking").length).toBeGreaterThan(0);
  });
});
