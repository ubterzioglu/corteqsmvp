import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { GENERIC_FEATURE_KEYS, INDIVIDUAL_FEATURE_KEYS } from "@/lib/features";
import type { CurrentUserProfilePayload } from "@/lib/member-profile";
import ProfilePage from "@/pages/ProfilePage";

function renderProfilePage(initialEntry: string, options?: { includeRedirectTargets?: boolean }) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <Routes>
          <Route path="/profile/:type" element={<ProfilePage />} />
          {options?.includeRedirectTargets ? <Route path="/profile/bireysel" element={<div>Bireysel Profil</div>} /> : null}
          {options?.includeRedirectTargets ? <Route path="/profile/danisman" element={<div>Danisman Profil</div>} /> : null}
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

const useAuthMock = vi.fn();
const useCurrentUserProfileMock = vi.fn();
const useCurrentUserDashboardMock = vi.fn();
const updateProfileAttributeMock = vi.fn();
const submitFeatureRequestMock = vi.fn();
const submitRoleChangeRequestMock = vi.fn();
const updateProfileAvatarMock = vi.fn();
const supabaseRpcMock = vi.fn();
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
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      signOut: vi.fn(),
    },
    rpc: (...args: unknown[]) => supabaseRpcMock(...args),
  },
}));

describe("ProfilePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    updateProfileAttributeMock.mockResolvedValue({ status: "approved" });
    submitFeatureRequestMock.mockResolvedValue("request-1");
    submitRoleChangeRequestMock.mockResolvedValue("request-1");
    updateProfileAvatarMock.mockResolvedValue({ status: "approved" });
    supabaseRpcMock.mockResolvedValue({
      data: [
        { key: "User_CityAmbassador", label: "Şehir Elçisi", description: null, sort_order: 10 },
        { key: "bireysel", label: "Bireysel", description: null, sort_order: 20 },
      ],
      error: null,
    });
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
        attributeKey: "business_or_organization",
        label: "İşletme / Kuruluş",
        description: "Rol özel alan",
        dataType: "text",
        isSystem: false,
        sortOrder: 120,
        isRequired: false,
        isPublicDefault: true,
        userCanEdit: true,
        userCanHide: true,
        requiresAdminApprovalOnChange: false,
        visibility: "public",
        approvalStatus: "approved",
        valueText: "Corteqs Labs",
        valueJson: null,
        displayValue: "Corteqs Labs",
      },
      {
        attributeKey: "interest_focus",
        label: "İştigal / İlgi Sahası",
        description: "Rol özel alan",
        dataType: "text",
        isSystem: false,
        sortOrder: 130,
        isRequired: false,
        isPublicDefault: true,
        userCanEdit: true,
        userCanHide: true,
        requiresAdminApprovalOnChange: false,
        visibility: "public",
        approvalStatus: "approved",
        valueText: "Network tasarımı",
        valueJson: null,
        displayValue: "Network tasarımı",
      },
      {
        attributeKey: "referral_code",
        label: "Referral Kodu",
        description: "Referral alanı",
        dataType: "text",
        isSystem: false,
        sortOrder: 140,
        isRequired: true,
        isPublicDefault: false,
        userCanEdit: true,
        userCanHide: false,
        requiresAdminApprovalOnChange: false,
        visibility: "private",
        approvalStatus: "approved",
        valueText: "REF-2026",
        valueJson: null,
        displayValue: "REF-2026",
      },
      {
        attributeKey: "referral_source",
        label: "Bizi nereden buldunuz?",
        description: "Referral alanı",
        dataType: "select",
        isSystem: false,
        sortOrder: 150,
        isRequired: true,
        isPublicDefault: false,
        userCanEdit: true,
        userCanHide: false,
        requiresAdminApprovalOnChange: false,
        visibility: "private",
        approvalStatus: "approved",
        valueText: "linkedin",
        valueJson: null,
        displayValue: "LinkedIn",
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

    renderProfilePage("/profile/invalid", { includeRedirectTargets: true });

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

    renderProfilePage("/profile/isletme", { includeRedirectTargets: true });

    expect(await screen.findByText("Danisman Profil")).toBeInTheDocument();
  });

  it("renders flat-role User_DiasporaMember at /profile/bireysel without redirect", async () => {
    useAuthMock.mockReturnValue({
      user: { id: "u-1", email: "desiremapde@gmail.com", user_metadata: {} },
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
        profileType: "User_DiasporaMember",
        roleKey: "User_DiasporaMember",
        roleLabel: "Diaspora Üyesi",
        roleSlug: "User_DiasporaMember",
      },
      refreshProfile: vi.fn(),
    });

    renderProfilePage("/profile/bireysel");

    // Redirect döngüsü yok: sayfa kendi içeriğini render eder.
    expect(await screen.findByRole("heading", { name: "firmascope" })).toBeInTheDocument();
    expect(screen.getByText("Profil Alanları")).toBeInTheDocument();
  });

  it("redirects flat-role user to its mapped UI category with a single redirect", async () => {
    useAuthMock.mockReturnValue({
      user: { id: "u-1", email: "desiremapde@gmail.com", user_metadata: {} },
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
        profileType: "User_DiasporaMember",
        roleKey: "User_DiasporaMember",
        roleLabel: "Diaspora Üyesi",
        roleSlug: "User_DiasporaMember",
      },
      refreshProfile: vi.fn(),
    });

    // /profile/isletme literal hedef olarak kayıtlı değil → ProfilePage eşleşir,
    // User_DiasporaMember bireysel'e tek redirect ile düşer.
    renderProfilePage("/profile/isletme", { includeRedirectTargets: true });

    expect(await screen.findByText("Bireysel Profil")).toBeInTheDocument();
  });

  it("shows DB role label for flat consultant roles", async () => {
    useAuthMock.mockReturnValue({
      user: { id: "u-1", email: "consultant@test.com", user_metadata: {} },
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
        profileType: "Consultant_PracticalLife",
        roleKey: "Consultant_PracticalLife",
        roleLabel: "Pratik Hayat Danışmanı",
        roleSlug: "Consultant_PracticalLife",
      },
      refreshProfile: vi.fn(),
    });

    renderProfilePage("/profile/danisman");

    // danisman kategorisi: kurumsal layout, rozet DB rol etiketini gösterir.
    expect(await screen.findByText("Pratik Hayat Danışmanı")).toBeInTheDocument();
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

    renderProfilePage("/profile/bireysel");

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
    expect(screen.queryByText("Alt Kategori / Alt Tip")).not.toBeInTheDocument();
    expect(screen.queryByText("Locked")).not.toBeInTheDocument();
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
    expect(accessCardToggle).toBeEnabled();
    expect(accessCardToggle).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByText("Rol Başvurusu")).not.toBeInTheDocument();
    expect(screen.queryByText("Açık Dashboard Erişimleri")).not.toBeInTheDocument();

    fireEvent.click(accessCardToggle);

    expect(accessCardToggle).toHaveAttribute("aria-expanded", "true");
    expect(await screen.findByText("Rol Başvurusu")).toBeInTheDocument();
    expect(screen.getByText("Feature Talepleri")).toBeInTheDocument();
    expect(screen.getByText("Açık Dashboard Erişimleri")).toBeInTheDocument();
    expect(screen.getByText("Bekleyen Talepler")).toBeInTheDocument();
    await waitFor(() => {
      expect(supabaseRpcMock).toHaveBeenCalledWith("get_flat_roles");
    });

    fireEvent.click(accessCardToggle);
    expect(accessCardToggle).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByText("Rol Başvurusu")).not.toBeInTheDocument();

    const helpCardToggle = screen.getByRole("button", { name: /Yardım & Kılavuzlar/i });
    expect(helpCardToggle).toBeInTheDocument();
    expect(helpCardToggle).toBeEnabled();
    expect(helpCardToggle).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByText("Ortak Profil Alanları Kullanım Kılavuzu")).not.toBeInTheDocument();

    fireEvent.click(helpCardToggle);

    expect(helpCardToggle).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText("Ortak Profil Alanları Kullanım Kılavuzu")).toBeInTheDocument();
    expect(screen.getByText("Rolüne Özel Alanlar Kullanım Kılavuzu")).toBeInTheDocument();
    expect(screen.getByText("Rol Başvurusu Kılavuzu")).toBeInTheDocument();
    expect(screen.getByText("Feature Talepleri Kılavuzu")).toBeInTheDocument();
    expect(screen.getByText("Bekleyen Talepler Kılavuzu")).toBeInTheDocument();

    fireEvent.click(helpCardToggle);
    expect(helpCardToggle).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByText("Ortak Profil Alanları Kullanım Kılavuzu")).not.toBeInTheDocument();
    expect(screen.getByText(/Diaspora için iş birliği ve mentorluk fırsatlarına açığım\./i)).toBeInTheDocument();
    expect(screen.getByText("Profil özeti: Diaspora için iş birliği ve mentorluk fırsatlarına açığım.")).toBeInTheDocument();
    expect(screen.queryByText("Hizmet almak, etkinliklere katılmak ve diaspora ağınızı keşfetmek için")).not.toBeInTheDocument();
    expect(screen.queryByDisplayValue("mentorluk, topluluk, networking")).not.toBeInTheDocument();
    expect(screen.getByDisplayValue("Corteqs Labs")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Network tasarımı")).toBeInTheDocument();
    expect(screen.getByDisplayValue("REF-2026")).toBeInTheDocument();

    expect(screen.getByRole("switch", { name: /Ad Soyad görünürlük/i })).toBeInTheDocument();
    expect(screen.getAllByRole("switch").length).toBeGreaterThanOrEqual(2);
    expect(screen.queryByText("Tamamlandı")).not.toBeInTheDocument();
    expect(screen.queryByText("Eksik veya doldurulmayı bekliyor")).not.toBeInTheDocument();
    expect(screen.getAllByRole("switch").length).toBeGreaterThan(3);
    expect(screen.getAllByDisplayValue("firmascope")).toHaveLength(1);
  }, 15_000); // tek başına ~4sn süren geniş kapsamlı render testi; paralel suite yükünde 5sn default timeout'u aşıyor

  it("submits a feature request from the access card", async () => {
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

    renderProfilePage("/profile/bireysel");

    fireEvent.click(await screen.findByRole("button", { name: /Başvurular & Erişimler/i }));
    fireEvent.click(await screen.findByText("Feature Talepleri"));

    const requestButtons = await screen.findAllByRole("button", { name: "Talep Et" });
    expect(requestButtons.length).toBeGreaterThanOrEqual(1);

    fireEvent.click(requestButtons[0]);

    await waitFor(() => {
      expect(submitFeatureRequestMock).toHaveBeenCalledWith(GENERIC_FEATURE_KEYS.directoryVisible);
    });
    expect(refreshProfileMock).toHaveBeenCalled();
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

    renderProfilePage("/profile/bireysel");

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

    renderProfilePage("/profile/bireysel");

    fireEvent.change(screen.getByDisplayValue("firmascope"), { target: { value: "Ada Yilmaz" } });
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

  it("syncs the common-fields visibility toggle from the saved profile state", async () => {
    useAuthMock.mockReturnValue({
      user: { id: "u-1", email: "firmascope@gmail.com", user_metadata: { name: "firmascope" } },
    });
    useCurrentUserDashboardMock.mockReturnValue({
      isLoading: false,
      errorMessage: null,
      items: [],
      refreshDashboard: vi.fn(),
    });
    // Tüm ortak alanlar (country/city/bio_short) DB'de private kayıtlı.
    useCurrentUserProfileMock.mockReturnValue({
      isLoading: false,
      errorMessage: null,
      profile: {
        ...baseProfile,
        attributes: baseProfile.attributes.map((attribute) =>
          ["country", "city", "bio_short"].includes(attribute.attributeKey)
            ? { ...attribute, visibility: "private" as const }
            : attribute,
        ),
      },
      refreshProfile: vi.fn(),
    });

    renderProfilePage("/profile/bireysel");

    // Regresyon: toggle useState(true)'a sabit kalmamalı; kayıtlı private durumu
    // yansıtmalı (aksi halde toggle "public" derken public profil göstermez).
    const commonToggle = await screen.findByRole("switch", { name: /Ortak alanlar görünürlük/i });
    expect(commonToggle).not.toBeChecked();
  });

  it("renders compact role-specific rows and saves referral fields without visibility switches", async () => {
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

    renderProfilePage("/profile/bireysel");

    const roleCardButton = screen.getByRole("button", { name: /Rolüne Özel Alanları Kaydet/i });
    const roleCard = roleCardButton.parentElement?.parentElement?.parentElement ?? null;
    expect(roleCard).not.toBeNull();
    const roleCardScope = within(roleCard as HTMLElement);

    expect(roleCardScope.queryByDisplayValue("mentorluk, topluluk, networking")).not.toBeInTheDocument();
    expect(roleCardScope.queryByDisplayValue("firmascope")).not.toBeInTheDocument();
    expect(roleCardScope.getByDisplayValue("Corteqs Labs")).toBeInTheDocument();
    expect(roleCardScope.getByDisplayValue("Network tasarımı")).toBeInTheDocument();
    expect(roleCardScope.getByDisplayValue("REF-2026")).toBeInTheDocument();
    expect(roleCardScope.getByText("İşletme / Kuruluş")).toBeInTheDocument();
    expect(roleCardScope.getByText("İştigal / İlgi Sahası")).toBeInTheDocument();
    expect(roleCardScope.queryByRole("switch", { name: /Referral Kodu görünürlük/i })).not.toBeInTheDocument();
    expect(roleCardScope.queryByRole("switch", { name: /Bizi nereden buldunuz\\? görünürlük/i })).not.toBeInTheDocument();
    expect(roleCardScope.getByRole("switch", { name: /İşletme \/ Kuruluş görünürlük/i })).toBeInTheDocument();
    expect(roleCardScope.getByRole("switch", { name: /İştigal \/ İlgi Sahası görünürlük/i })).toBeInTheDocument();
    expect(roleCardScope.queryByText("Rol özel alan")).not.toBeInTheDocument();
    expect(roleCardScope.queryByText("Referral alanı")).not.toBeInTheDocument();

    fireEvent.click(roleCardButton);

    await waitFor(() => {
      expect(updateProfileAttributeMock.mock.calls.map((call) => call[0])).toEqual([
        "business_or_organization",
        "interest_focus",
        "referral_code",
        "referral_source",
      ]);
    });

    expect(refreshProfileMock).toHaveBeenCalled();
  });
});
