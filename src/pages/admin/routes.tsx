// src/pages/admin/routes.tsx
// Admin Panel V2 — Faz 7: /admin route ağacının tamamı (masterplan §17/Faz 7).
// Path'ler App.tsx'teki eski ağaçla BİREBİR aynıdır; URL değiştirme yasak (kural §4.1).
// Yeni admin route eklerken: (1) buraya, (2) admin-route-meta.ts ADMIN_ROUTE_PATTERNS'a,
// (3) görünürse admin-navigation-registry.ts'e ekle — testler tutarsızlığı yakalar.
//
// Kullanım (App.tsx):
//
//   import { adminRoutes } from "@/pages/admin/routes";
//   ...
//   <Routes>
//     ...
//     {adminRoutes}
//   </Routes>

import { lazy } from "react";
import { Navigate, Route } from "react-router-dom";

import NotFound from "@/pages/NotFound";
import { muhasebeRoutes } from "./muhasebe/routes";
import { serviceFinderRoutes } from "./service-finder/routes";

// Code-splitting: admin sayfaları ihtiyaç anında yüklenir. Suspense sınırı
// App.tsx'teki kök <Suspense> — muhasebe alt ağacı kendi fallback'ini taşır.
const AdminLayout = lazy(() => import("@/components/admin/AdminLayout"));
const AdminDashboardPage = lazy(() => import("@/pages/admin/dashboard/AdminDashboardPage"));
const AdminReferralPage = lazy(() => import("@/pages/admin/AdminReferralPage"));
const AdminReferralSourcesPage = lazy(() => import("@/pages/admin/AdminReferralSourcesPage"));
const AdminReferralGroupsPage = lazy(() => import("@/pages/admin/AdminReferralGroupsPage"));
const AdminReferralTypesPage = lazy(() => import("@/pages/admin/AdminReferralTypesPage"));
const AdminAboutPage = lazy(() => import("@/pages/admin/AdminAboutPage"));
const AdminGuidePage = lazy(() => import("@/pages/admin/AdminGuidePage"));
const AdminMarqueePage = lazy(() => import("@/pages/admin/AdminMarqueePage"));
const AdminAdvisorLinksPage = lazy(() => import("@/pages/admin/AdminAdvisorLinksPage"));
const AdminSocialMediaLinksPage = lazy(() => import("@/pages/admin/AdminSocialMediaLinksPage"));
const AdminRolesDraftPage = lazy(() => import("@/pages/admin/AdminRolesDraftPage"));
const AdminWorkspaceHomePage = lazy(() => import("@/pages/admin/workspace/AdminWorkspaceHomePage"));
const AdminCommandCenterPage = lazy(() => import("@/pages/admin/workspace/AdminCommandCenterPage"));
const AdminResourcesPage = lazy(() => import("@/pages/admin/workspace/AdminResourcesPage"));
const AdminTodoWorkspacePage = lazy(() => import("@/pages/admin/workspace/AdminTodoWorkspacePage"));
const AdminMeetingNotesWorkspacePage = lazy(() => import("@/pages/admin/workspace/AdminMeetingNotesWorkspacePage"));
const AdminMvpWorkspacePage = lazy(() => import("@/pages/admin/workspace/AdminMvpWorkspacePage"));
const AdminWorkspaceDocPage = lazy(() => import("@/pages/admin/workspace/AdminWorkspaceDocPage"));
const AdminWhatsAppLandingsPage = lazy(() => import("@/pages/admin/AdminWhatsAppLandingsPage"));
const AdminWhatsAppLandingEditorsPage = lazy(() => import("@/pages/admin/AdminWhatsAppLandingEditorsPage"));
const AdminCommunityGuidePage = lazy(() => import("@/pages/admin/AdminCommunityGuidePage"));
const AdminMay19IdeaPage = lazy(() => import("@/pages/admin/AdminMay19IdeaPage"));
const AdminDunyaKupasiPage = lazy(() => import("@/pages/admin/AdminDunyaKupasiPage"));
const AdminMay19MomentPage = lazy(() => import("@/pages/admin/AdminMay19MomentPage"));
const AdminSurveysPage = lazy(() => import("@/pages/admin/surveys/AdminSurveysPage"));
const AdminSurveyCreatePage = lazy(() => import("@/pages/admin/surveys/AdminSurveyCreatePage"));
const AdminSurveyEditPage = lazy(() => import("@/pages/admin/surveys/AdminSurveyEditPage"));
const AdminSurveyResponsesPage = lazy(() => import("@/pages/admin/surveys/AdminSurveyResponsesPage"));
const AdminUserOverridesPage = lazy(() => import("@/pages/admin/AdminUserOverridesPage"));
const AdminApprovalsPage = lazy(() => import("@/pages/admin/AdminApprovalsPage"));
const AdminAuditLogsPage = lazy(() => import("@/pages/admin/AdminAuditLogsPage"));
const AdminNewMemberGuidePage = lazy(() => import("@/pages/admin/AdminNewMemberGuidePage"));
const AdminDurumRaporuPage = lazy(() => import("@/pages/admin/AdminDurumRaporuPage"));
const AdminRoleManagementPage = lazy(() => import("@/pages/admin/AdminRoleManagementPage"));
const AdminRolesOverviewPage = lazy(() => import("@/pages/admin/AdminRolesOverviewPage"));
import { adminCaddeRoutes } from "@/pages/admin/cadde/routes";
const AdminConsulateProfilesPage = lazy(() => import("@/pages/admin/AdminConsulateProfilesPage"));
const AdminCatalogPage = lazy(() => import("@/pages/admin/AdminCatalogPage"));
const AdminDatabaseTablesPage = lazy(() => import("@/pages/admin/AdminDatabaseTablesPage"));

// /admin alt ağacı — App.tsx'teki <Routes> içine {adminRoutes} olarak eklenir.
export const adminRoutes = (
  <Route path="/admin" element={<AdminLayout />}>
    <Route index element={<AdminDashboardPage />} />
    <Route path="referral" element={<AdminReferralPage />} />
    <Route path="referral/sources" element={<AdminReferralSourcesPage />} />
    <Route path="referral/groups" element={<AdminReferralGroupsPage />} />
    <Route path="referral/types" element={<AdminReferralTypesPage />} />
    <Route path="marquee" element={<AdminMarqueePage />} />
    {adminCaddeRoutes}
    <Route path="advisors">
      <Route index element={<Navigate to="/admin/advisors/consultant" replace />} />
      <Route path=":profile" element={<AdminAdvisorLinksPage />} />
    </Route>
    <Route path="social-media" element={<AdminSocialMediaLinksPage />} />
    <Route path="surveys" element={<AdminSurveysPage />} />
    <Route path="surveys/new" element={<AdminSurveyCreatePage />} />
    <Route path="surveys/:id/edit" element={<AdminSurveyEditPage />} />
    <Route path="surveys/:id/responses" element={<AdminSurveyResponsesPage />} />
    <Route path="new-member/profile-role-assignment" element={<AdminCatalogPage />} />
    <Route path="new-member/role-matrix" element={<AdminRoleManagementPage />} />
    <Route path="new-member/roles-overview" element={<AdminRolesOverviewPage />} />
    <Route path="new-member/users-roles" element={<Navigate to="/admin/new-member/profile-role-assignment" replace />} />
    <Route path="data" element={<AdminCatalogPage />} />
    <Route path="veritabani-tablolari" element={<AdminDatabaseTablesPage />} />
    <Route path="new-member/guide" element={<AdminNewMemberGuidePage />} />
    <Route path="new-member/durum-raporu" element={<AdminDurumRaporuPage />} />
    <Route path="new-member/roles-list" element={<Navigate to="/admin/new-member/guide#rol-listesi" replace />} />
    <Route path="new-member/roles-features" element={<Navigate to="/admin/new-member/role-matrix?kind=feature" replace />} />
    <Route path="new-member/attributes" element={<Navigate to="/admin/new-member/role-matrix?kind=attribute" replace />} />
    <Route path="new-member/profile-sections" element={<Navigate to="/admin/new-member/role-matrix?kind=profile_section" replace />} />
    <Route path="new-member/taxonomy" element={<Navigate to="/admin/new-member/guide?notice=taxonomy-retired" replace />} />
    <Route path="new-member/overrides" element={<AdminUserOverridesPage />} />
    <Route path="new-member/role-management" element={<Navigate to="/admin/new-member/role-matrix" replace />} />
    <Route path="new-member/roles-preview" element={<Navigate to="/admin/new-member/role-matrix" replace />} />
    <Route path="new-member/entity-preview" element={<Navigate to="/admin/new-member/role-matrix" replace />} />
    <Route path="approvals" element={<AdminApprovalsPage />} />
    <Route path="audit-logs" element={<AdminAuditLogsPage />} />
    <Route path="roller-taslak" element={<AdminRolesDraftPage />} />
    <Route path="whatsapp-landings" element={<AdminWhatsAppLandingsPage />} />
    <Route path="whatsapp-landings/editors" element={<AdminWhatsAppLandingEditorsPage />} />
    <Route path="whatsapp-landings/guide" element={<AdminCommunityGuidePage />} />
    <Route path="consulates" element={<AdminConsulateProfilesPage />} />
    <Route path="data/:category" element={<Navigate to="/admin/data" replace />} />
    <Route path="dunya-kupasi" element={<AdminDunyaKupasiPage />} />
    <Route path="may19/kelime" element={<AdminMay19IdeaPage />} />
    <Route path="may19/ani" element={<AdminMay19MomentPage />} />
    <Route path="about" element={<AdminAboutPage />} />
    <Route path="guide" element={<AdminGuidePage />} />
    <Route path="workspace" element={<AdminWorkspaceHomePage />} />
    <Route path="workspace/command-center" element={<AdminCommandCenterPage />} />
    <Route path="workspace/resources" element={<AdminResourcesPage />} />
    <Route
      path="workspace/resources/arge"
      element={<Navigate to="/admin/workspace/resources?section=arge" replace />}
    />
    <Route
      path="workspace/resources/insankaynaklari"
      element={<Navigate to="/admin/workspace/resources?section=insankaynaklari" replace />}
    />
    <Route path="workspace/todos" element={<AdminTodoWorkspacePage />} />
    <Route path="workspace/meeting-notes" element={<AdminMeetingNotesWorkspacePage />} />
    <Route path="workspace/mvp" element={<AdminMvpWorkspacePage />} />
    <Route path="workspace/docs/:slug" element={<AdminWorkspaceDocPage />} />
    {muhasebeRoutes}
    {serviceFinderRoutes}
    <Route path="*" element={<NotFound />} />
  </Route>
);
