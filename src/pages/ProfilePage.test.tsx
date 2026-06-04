import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { GENERIC_FEATURE_KEYS, INDIVIDUAL_FEATURE_KEYS } from "@/lib/features";
import type { CurrentUserProfilePayload } from "@/lib/member-profile";
import ProfilePage from "@/pages/ProfilePage";

const useAuthMock = vi.fn();
const useCurrentUserProfileMock = vi.fn();
const useCurrentUserDashboardMock = vi.fn();
const updateProfileAttributeMock = vi.fn();
const submitFeatureRequestMock = vi.fn();
const submitRoleChangeRequestMock = vi.fn();
const updateProfileAvatarMock = vi.fn();
const updateUserTaxonomySelectionMock = vi.fn();

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

vi.mock("@/lib/member-profile-api", () => ({
  submitFeatureRequest: (...args: unknown[]) => submitFeatureRequestMock(...args),
  submitRoleChangeRequest: (...args: unknown[]) => submitRoleChangeRequestMock(...args),
  updateProfileAttribute: (...args: unknown[]) => updateProfileAttributeMock(...args),
  updateProfileAvatar: (...args: unknown[]) => updateProfileAvatarMock(...args),
  updateUserTaxonomySelection: (...args: unknown[]) => updateUserTaxonomySelectionMock(...args),
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      signOut: vi.fn(),
    },
  },
}));

describe("ProfilePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    updateProfileAttributeMock.mockResolvedValue({ status: "approved" });
    submitFeatureRequestMock.mockResolvedValue("request-1");
    submitRoleChangeRequestMock.mockResolvedValue("request-1");
    updateProfileAvatarMock.mockResolvedValue({ status: "approved" });
    updateUserTaxonomySelectionMock.mockResolvedValue({ status: "approved" });
  });

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
      { key: INDIVIDUAL_FEATURE_KEYS.jobSeekingBadge, isEnabled: true, source: "role_default" },
      { key: INDIVIDUAL_FEATURE_KEYS.movingSoonBadge, isEnabled: true, source: "role_default" },
      { key: INDIVIDUAL_FEATURE_KEYS.volunteerMentorship, isEnabled: true, source: "role_default" },
      { key: GENERIC_FEATURE_KEYS.profileLinkedinCard, isEnabled: true, source: "role_default" },
      { key: GENERIC_FEATURE_KEYS.profileWebsiteCard, isEnabled: true, source: "role_default" },
      { key: GENERIC_FEATURE_KEYS.profileCvUpload, isEnabled: true, source: "role_default" },
      { key: GENERIC_FEATURE_KEYS.profilePresentationUpload, isEnabled: true, source: "role_default" },
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
        attributeKey: "country",
        label: "Ülke",
        description: "Profil ülkesi",
        dataType: "text",
        isSystem: true,
        sortOrder: 20,
        isRequired: false,
        isPublicDefault: true,
        userCanEdit: true,
        userCanHide: true,
        requiresAdminApprovalOnChange: false,
        visibility: "public",
        approvalStatus: "approved",
        valueText: "Almanya",
        valueJson: null,
        displayValue: "Almanya",
      },
      {
        attributeKey: "city",
        label: "Şehir",
        description: "Profil şehri",
        dataType: "text",
        isSystem: true,
        sortOrder: 30,
        isRequired: false,
        isPublicDefault: true,
        userCanEdit: true,
        userCanHide: true,
        requiresAdminApprovalOnChange: false,
        visibility: "public",
        approvalStatus: "approved",
        valueText: "Berlin",
        valueJson: null,
        displayValue: "Berlin",
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
      {
        attributeKey: "instagram_url",
        label: "Instagram",
        description: "Instagram profili",
        dataType: "url",
        isSystem: false,
        sortOrder: 171,
        isRequired: false,
        isPublicDefault: true,
        userCanEdit: true,
        userCanHide: true,
        requiresAdminApprovalOnChange: false,
        visibility: "public",
        approvalStatus: "approved",
        valueText: "https://www.instagram.com/firmascope",
        valueJson: null,
        displayValue: "https://www.instagram.com/firmascope",
      },
      {
        attributeKey: "linkedin_url",
        label: "LinkedIn",
        description: "LinkedIn profili",
        dataType: "url",
        isSystem: false,
        sortOrder: 172,
        isRequired: false,
        isPublicDefault: true,
        userCanEdit: true,
        userCanHide: true,
        requiresAdminApprovalOnChange: false,
        visibility: "public",
        approvalStatus: "approved",
        valueText: "https://www.linkedin.com/in/firmascope",
        valueJson: null,
        displayValue: "https://www.linkedin.com/in/firmascope",
      },
      {
        attributeKey: "website_url",
        label: "Web Sitesi",
        description: "Website linki",
        dataType: "url",
        isSystem: false,
        sortOrder: 173,
        isRequired: false,
        isPublicDefault: true,
        userCanEdit: true,
        userCanHide: true,
        requiresAdminApprovalOnChange: false,
        visibility: "public",
        approvalStatus: "approved",
        valueText: "https://firmascope.co",
        valueJson: null,
        displayValue: "https://firmascope.co",
      },
      {
        attributeKey: "job_seeking_opt_in",
        label: "İş Arıyorum Badge'i",
        description: "Badge tercihi",
        dataType: "boolean",
        isSystem: false,
        sortOrder: 177,
        isRequired: false,
        isPublicDefault: false,
        userCanEdit: true,
        userCanHide: false,
        requiresAdminApprovalOnChange: false,
        visibility: "public",
        approvalStatus: "approved",
        valueText: null,
        valueJson: true,
        displayValue: true,
      },
      {
        attributeKey: "moving_soon_opt_in",
        label: "Yakında Taşınacağım",
        description: "Badge tercihi",
        dataType: "boolean",
        isSystem: false,
        sortOrder: 178,
        isRequired: false,
        isPublicDefault: false,
        userCanEdit: true,
        userCanHide: false,
        requiresAdminApprovalOnChange: false,
        visibility: "public",
        approvalStatus: "approved",
        valueText: null,
        valueJson: false,
        displayValue: false,
      },
      {
        attributeKey: "volunteer_mentorship_opt_in",
        label: "Gönüllü Mentörlük",
        description: "Badge tercihi",
        dataType: "boolean",
        isSystem: false,
        sortOrder: 179,
        isRequired: false,
        isPublicDefault: false,
        userCanEdit: true,
        userCanHide: false,
        requiresAdminApprovalOnChange: false,
        visibility: "public",
        approvalStatus: "approved",
        valueText: null,
        valueJson: true,
        displayValue: true,
      },
      {
        attributeKey: "cv_doc",
        label: "CV / Özgeçmiş",
        description: "Özel dosya",
        dataType: "json",
        isSystem: false,
        sortOrder: 180,
        isRequired: false,
        isPublicDefault: false,
        userCanEdit: true,
        userCanHide: false,
        requiresAdminApprovalOnChange: false,
        visibility: "private",
        approvalStatus: "approved",
        valueText: null,
        valueJson: null,
        displayValue: null,
      },
      {
        attributeKey: "presentation_doc",
        label: "Sunum / Tanıtım",
        description: "Özel dosya",
        dataType: "json",
        isSystem: false,
        sortOrder: 181,
        isRequired: false,
        isPublicDefault: false,
        userCanEdit: true,
        userCanHide: false,
        requiresAdminApprovalOnChange: false,
        visibility: "private",
        approvalStatus: "approved",
        valueText: null,
        valueJson: null,
        displayValue: null,
      },
      {
        attributeKey: "profile_photo_url",
        label: "Profil Görseli",
        description: "Profil fotoğrafı",
        dataType: "url",
        isSystem: true,
        sortOrder: 40,
        isRequired: false,
        isPublicDefault: true,
        userCanEdit: true,
        userCanHide: true,
        requiresAdminApprovalOnChange: false,
        visibility: "public",
        approvalStatus: "approved",
        valueText: "https://example.com/avatar.jpg",
        valueJson: null,
        displayValue: "https://example.com/avatar.jpg",
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

    expect(await screen.findByRole("heading", { name: "firmascope" })).toBeInTheDocument();
    expect(screen.getByText("Profil Fotoğrafı")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^Yardım$/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^Değiştir$/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^Kaldır$/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Yenile/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Çıkış Yap/i })).toBeInTheDocument();
    expect(screen.getAllByRole("img", { name: "firmascope" })).toHaveLength(1);
    expect(screen.getByRole("img", { name: "firmascope" })).toHaveAttribute("src", "https://example.com/avatar.jpg");
    expect(screen.getByText("Profil Alanları")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Ad Soyadı Kaydet" })).toBeInTheDocument();
    expect(screen.getByText("Profil Rozetleri")).toBeInTheDocument();
    expect(screen.getByText("Sosyal Medya Hesapları")).toBeInTheDocument();
    expect(screen.getByDisplayValue("https://www.instagram.com/firmascope")).toBeInTheDocument();
    expect(screen.getAllByText("LinkedIn").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByDisplayValue("https://www.linkedin.com/in/firmascope")).toBeInTheDocument();
    expect(screen.getAllByText("Web Sitesi").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByDisplayValue("https://firmascope.co")).toBeInTheDocument();
    expect(screen.getAllByText("CV / Özgeçmiş").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Sunum / Tanıtım").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("İş Arıyorum Badge'i")).toBeInTheDocument();
    expect(screen.getByText("Yakında Taşınacağım")).toBeInTheDocument();
    expect(screen.getByText("Gönüllü Mentörlük")).toBeInTheDocument();
    expect(screen.getByText("Rolüne Özel Alanlar")).toBeInTheDocument();
    expect(screen.getByText("Alt Kategori / Alt Tip")).toBeInTheDocument();
    expect(screen.getAllByText("Locked").length).toBeGreaterThanOrEqual(3);
    const profileSummaryToggle = screen.getByRole("button", { name: "Profil Durumu" });
    expect(profileSummaryToggle).toBeInTheDocument();
    expect(profileSummaryToggle).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByText("Profil Skoru")).not.toBeInTheDocument();

    fireEvent.click(profileSummaryToggle);

    expect(profileSummaryToggle).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText("Profil Skoru")).toBeInTheDocument();
    expect(screen.queryByText("Genel Durum")).not.toBeInTheDocument();
    expect(screen.queryByText("Tamamlanma Durumu")).not.toBeInTheDocument();
    const accessCardToggle = screen.getByRole("button", { name: /Başvurular & Erişimler/i });
    expect(accessCardToggle).toBeInTheDocument();
    expect(accessCardToggle).toBeDisabled();
    expect(accessCardToggle).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByText("Rol Başvurusu")).not.toBeInTheDocument();
    expect(screen.queryByText("Açık Dashboard Erişimleri")).not.toBeInTheDocument();

    fireEvent.click(accessCardToggle);

    expect(accessCardToggle).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByText("Rol Başvurusu")).not.toBeInTheDocument();
    expect(screen.queryByText("Feature Talepleri")).not.toBeInTheDocument();
    expect(screen.queryByText("Açık Dashboard Erişimleri")).not.toBeInTheDocument();

    const helpCardToggle = screen.getByRole("button", { name: /Yardım & Kılavuzlar/i });
    expect(helpCardToggle).toBeInTheDocument();
    expect(helpCardToggle).toBeDisabled();
    expect(helpCardToggle).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByText("Ortak Profil Alanları Kullanım Kılavuzu")).not.toBeInTheDocument();

    fireEvent.click(helpCardToggle);

    expect(helpCardToggle).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByText("Ortak Profil Alanları Kullanım Kılavuzu")).not.toBeInTheDocument();
    expect(screen.getByText(/Diaspora için iş birliği ve mentorluk fırsatlarına açığım\./i)).toBeInTheDocument();
    expect(screen.getByText("Profil özeti: Diaspora için iş birliği ve mentorluk fırsatlarına açığım.")).toBeInTheDocument();
    expect(screen.queryByText("Hizmet almak, etkinliklere katılmak ve diaspora ağınızı keşfetmek için")).not.toBeInTheDocument();
    expect(screen.getByDisplayValue("mentorluk, topluluk, networking")).toBeInTheDocument();

    expect(screen.getByRole("switch", { name: /Ad Soyad görünürlük/i })).toBeInTheDocument();
    expect(screen.getAllByRole("switch").length).toBeGreaterThanOrEqual(2);
    expect(screen.queryByText("Tamamlandı")).not.toBeInTheDocument();
    expect(screen.queryByText("Eksik veya doldurulmayı bekliyor")).not.toBeInTheDocument();
    expect(screen.getAllByRole("switch").length).toBeGreaterThan(3);
  });

  it("does not render the bireysel fallback description when short bio is empty", async () => {
    useAuthMock.mockReturnValue({
      user: { id: "u-1", email: "firmascope@gmail.com", user_metadata: {} },
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
      profile: {
        ...baseProfile,
        attributes: baseProfile.attributes.filter((attribute) => attribute.attributeKey !== "bio_short"),
      },
      refreshProfile: vi.fn(),
    });

    render(
      <MemoryRouter initialEntries={["/profile/bireysel"]}>
        <Routes>
          <Route path="/profile/:type" element={<ProfilePage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByRole("heading", { name: "firmascope" })).toBeInTheDocument();
    expect(screen.queryByText("Hizmet almak, etkinliklere katılmak ve diaspora ağınızı keşfetmek için")).not.toBeInTheDocument();
    expect(screen.queryByText(/Profil özeti:/i)).not.toBeInTheDocument();
    expect(screen.queryByText("Profil kartını, görünürlüğünü ve taleplerini tek yerden yönet.")).not.toBeInTheDocument();
  });

  it("saves display name separately from the shared profile section", async () => {
    const refreshProfileMock = vi.fn().mockResolvedValue(undefined);

    useAuthMock.mockReturnValue({
      user: { id: "u-1", email: "firmascope@gmail.com", user_metadata: { name: "firmascope" } },
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
      profile: baseProfile,
      refreshProfile: refreshProfileMock,
    });

    render(
      <MemoryRouter initialEntries={["/profile/bireysel"]}>
        <Routes>
          <Route path="/profile/:type" element={<ProfilePage />} />
        </Routes>
      </MemoryRouter>,
    );

    fireEvent.change(screen.getAllByDisplayValue("firmascope")[0], { target: { value: "Ada Yilmaz" } });
    fireEvent.click(screen.getByRole("button", { name: "Ad Soyadı Kaydet" }));

    await waitFor(() => {
      expect(updateProfileAttributeMock).toHaveBeenCalledWith("full_name", "Ada Yilmaz", "public");
    });

    updateProfileAttributeMock.mockClear();

    fireEvent.click(screen.getByRole("button", { name: /Ortak Alanları Kaydet/i }));

    await waitFor(() => {
      expect(updateProfileAttributeMock).toHaveBeenCalledTimes(3);
    });

    expect(updateProfileAttributeMock.mock.calls.map((call) => call[0])).toEqual(["country", "city", "bio_short"]);
    expect(refreshProfileMock).toHaveBeenCalled();
  });
});
