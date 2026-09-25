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

import { lazyWithReload } from "@/lib/lazy-with-reload";
import { Navigate, Route } from "react-router-dom";

import NotFound from "@/pages/NotFound";
import { muhasebeRoutes } from "./muhasebe/routes";
import { serviceFinderRoutes } from "./service-finder/routes";
import { relocationAdminRoutes } from "./relocation/routes";
import { adminWorkshopRoutes } from "./workshop/routes";

// Code-splitting: admin sayfaları ihtiyaç anında yüklenir. Suspense sınırı
// App.tsx'teki kök <Suspense> — muhasebe alt ağacı kendi fallback'ini taşır.
const AdminLayout = lazyWithReload(() => import("@/components/admin/AdminLayout"));
const AdminDashboardPage = lazyWithReload(() => import("@/pages/admin/dashboard/AdminDashboardPage"));
const AdminReferralPage = lazyWithReload(() => import("@/pages/admin/AdminReferralPage"));
const AdminReferralSourcesPage = lazyWithReload(() => import("@/pages/admin/AdminReferralSourcesPage"));
const AdminReferralGroupsPage = lazyWithReload(() => import("@/pages/admin/AdminReferralGroupsPage"));
const AdminReferralTypesPage = lazyWithReload(() => import("@/pages/admin/AdminReferralTypesPage"));
const AdminAboutPage = lazyWithReload(() => import("@/pages/admin/AdminAboutPage"));
const AdminNotificationSettingsPage = lazyWithReload(() => import("@/pages/admin/AdminNotificationSettingsPage"));
const AdminToolRegistryPage = lazyWithReload(() => import("@/pages/admin/AdminToolRegistryPage"));
const AdminAgentAnalyticsPage = lazyWithReload(() => import("@/pages/admin/AdminAgentAnalyticsPage"));
const AdminGuidePage = lazyWithReload(() => import("@/pages/admin/AdminGuidePage"));
const AdminMarqueePage = lazyWithReload(() => import("@/pages/admin/AdminMarqueePage"));
const AdminBlogPage = lazyWithReload(() => import("@/pages/admin/blog/AdminBlogPage"));
const AdminAdvisorLinksPage = lazyWithReload(() => import("@/pages/admin/AdminAdvisorLinksPage"));
const AdminSocialMediaLinksPage = lazyWithReload(() => import("@/pages/admin/AdminSocialMediaLinksPage"));
const AdminSocialShareVaultPage = lazyWithReload(() => import("@/pages/admin/AdminSocialShareVaultPage"));
const AdminVipInvitationsPage = lazyWithReload(() => import("@/pages/admin/AdminVipInvitationsPage"));
const AdminCustomerRequestsPage = lazyWithReload(() => import("@/pages/admin/AdminCustomerRequestsPage"));
const AdminYenilikRehberiPage = lazyWithReload(() => import("@/pages/admin/AdminYenilikRehberiPage"));
const AdminContributorResourcesPage = lazyWithReload(() => import("@/pages/admin/AdminContributorResourcesPage"));
const AdminRevisionRequestsPage = lazyWithReload(() => import("@/pages/admin/AdminRevisionRequestsPage"));
const AdminBrainstormingPage = lazyWithReload(() => import("@/pages/admin/AdminBrainstormingPage"));
const AdminFeedbackPage = lazyWithReload(() => import("@/pages/admin/AdminFeedbackPage"));
const AdminRolesDraftPage = lazyWithReload(() => import("@/pages/admin/AdminRolesDraftPage"));
const AdminWorkspaceHomePage = lazyWithReload(() => import("@/pages/admin/workspace/AdminWorkspaceHomePage"));
const AdminCommandCenterPage = lazyWithReload(() => import("@/pages/admin/workspace/AdminCommandCenterPage"));
const AdminResourcesPage = lazyWithReload(() => import("@/pages/admin/workspace/AdminResourcesPage"));
const AdminTodoWorkspacePage = lazyWithReload(() => import("@/pages/admin/workspace/AdminTodoWorkspacePage"));
const AdminMeetingNotesWorkspacePage = lazyWithReload(() => import("@/pages/admin/workspace/AdminMeetingNotesWorkspacePage"));
const AdminMvpWorkspacePage = lazyWithReload(() => import("@/pages/admin/workspace/AdminMvpWorkspacePage"));
const AdminWorkspaceDocPage = lazyWithReload(() => import("@/pages/admin/workspace/AdminWorkspaceDocPage"));
const AdminWhatsAppLandingsPage = lazyWithReload(() => import("@/pages/admin/AdminWhatsAppLandingsPage"));
const AdminWhatsAppLandingEditorsPage = lazyWithReload(() => import("@/pages/admin/AdminWhatsAppLandingEditorsPage"));
const AdminCommunityGuidePage = lazyWithReload(() => import("@/pages/admin/AdminCommunityGuidePage"));
const AdminMay19IdeaPage = lazyWithReload(() => import("@/pages/admin/AdminMay19IdeaPage"));
const AdminMay19MomentPage = lazyWithReload(() => import("@/pages/admin/AdminMay19MomentPage"));
const AdminSurveysPage = lazyWithReload(() => import("@/pages/admin/surveys/AdminSurveysPage"));
const AdminSurveyCreatePage = lazyWithReload(() => import("@/pages/admin/surveys/AdminSurveyCreatePage"));
const AdminSurveyEditPage = lazyWithReload(() => import("@/pages/admin/surveys/AdminSurveyEditPage"));
const AdminSurveyResponsesPage = lazyWithReload(() => import("@/pages/admin/surveys/AdminSurveyResponsesPage"));
const AdminUserOverridesPage = lazyWithReload(() => import("@/pages/admin/AdminUserOverridesPage"));
const AdminApprovalsPage = lazyWithReload(() => import("@/pages/admin/AdminApprovalsPage"));
const AdminAuditLogsPage = lazyWithReload(() => import("@/pages/admin/AdminAuditLogsPage"));
const AdminClientErrorsPage = lazyWithReload(() => import("@/pages/admin/AdminClientErrorsPage"));
const AdminNewMemberGuidePage = lazyWithReload(() => import("@/pages/admin/AdminNewMemberGuidePage"));
const AdminDurumRaporuPage = lazyWithReload(() => import("@/pages/admin/AdminDurumRaporuPage"));
const AdminRoleManagementPage = lazyWithReload(() => import("@/pages/admin/AdminRoleManagementPage"));
const AdminRolesOverviewPage = lazyWithReload(() => import("@/pages/admin/AdminRolesOverviewPage"));
import { adminCaddeRoutes } from "@/pages/admin/cadde/routes";
import { radarRoutes } from "@/pages/admin/radar/routes";
import { adminKadroRoutes } from "@/pages/admin/kadro/routes";
const AdminConsulateProfilesPage = lazyWithReload(() => import("@/pages/admin/AdminConsulateProfilesPage"));
const AdminCatalogPage = lazyWithReload(() => import("@/pages/admin/AdminCatalogPage"));
const AdminDatabaseTablesPage = lazyWithReload(() => import("@/pages/admin/AdminDatabaseTablesPage"));
const AdminBulkImportPage = lazyWithReload(() => import("@/pages/admin/AdminBulkImportPage"));
const AdminLinksPage = lazyWithReload(() => import("@/pages/admin/AdminLinksPage"));
const AdminEventsPage = lazyWithReload(() => import("@/pages/admin/AdminEventsPage"));

// /admin alt ağacı — App.tsx'teki <Routes> içine {adminRoutes} olarak eklenir.
export const adminRoutes = (
  <Route path="/admin" element={<AdminLayout />}>
    <Route index element={<AdminDashboardPage />} />
    <Route path="referral" element={<AdminReferralPage />} />
    <Route path="referral/sources" element={<AdminReferralSourcesPage />} />
    <Route path="referral/groups" element={<AdminReferralGroupsPage />} />
    <Route path="referral/types" element={<AdminReferralTypesPage />} />
    <Route path="marquee" element={<AdminMarqueePage />} />
    <Route path="blog" element={<AdminBlogPage />} />
    {adminCaddeRoutes}
    <Route path="advisors">
      <Route index element={<Navigate to="/admin/advisors/consultant" replace />} />
      <Route path=":profile" element={<AdminAdvisorLinksPage />} />
    </Route>
    <Route path="social-media" element={<AdminSocialMediaLinksPage />} />
    <Route path="social-share-vault" element={<AdminSocialShareVaultPage />} />
    <Route path="vip-invitations" element={<AdminVipInvitationsPage />} />
    <Route path="customer-requests" element={<AdminCustomerRequestsPage />} />
    <Route path="yenilik-rehberi" element={<AdminYenilikRehberiPage />} />
    <Route path="contributor-resources" element={<AdminContributorResourcesPage />} />
    <Route path="surveys" element={<AdminSurveysPage />} />
    <Route path="surveys/new" element={<AdminSurveyCreatePage />} />
    <Route path="surveys/:id/edit" element={<AdminSurveyEditPage />} />
    <Route path="surveys/:id/responses" element={<AdminSurveyResponsesPage />} />
    <Route path="new-member/profile-role-assignment" element={<AdminCatalogPage />} />
    <Route path="new-member/role-matrix" element={<AdminRoleManagementPage />} />
    <Route path="new-member/roles-overview" element={<AdminRolesOverviewPage />} />
    <Route path="brainstorming" element={<AdminBrainstormingPage />} />
    <Route path="new-member/users-roles" element={<Navigate to="/admin/new-member/profile-role-assignment" replace />} />
    <Route path="data" element={<AdminCatalogPage />} />
    <Route path="bulk-import" element={<AdminBulkImportPage />} />
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
    <Route path="client-errors" element={<AdminClientErrorsPage />} />
    <Route path="roller-taslak" element={<AdminRolesDraftPage />} />
    <Route path="whatsapp-landings" element={<AdminWhatsAppLandingsPage />} />
    <Route path="whatsapp-landings/editors" element={<AdminWhatsAppLandingEditorsPage />} />
    <Route path="whatsapp-landings/guide" element={<AdminCommunityGuidePage />} />
    <Route path="consulates" element={<AdminConsulateProfilesPage />} />
    <Route path="data/:category" element={<Navigate to="/admin/data" replace />} />
    <Route path="may19/kelime" element={<AdminMay19IdeaPage />} />
    <Route path="may19/ani" element={<AdminMay19MomentPage />} />
    <Route path="about" element={<AdminAboutPage />} />
    <Route path="notifications" element={<AdminNotificationSettingsPage />} />
    <Route path="tools" element={<AdminToolRegistryPage />} />
    <Route path="agent-analytics" element={<AdminAgentAnalyticsPage />} />
    <Route path="links" element={<AdminLinksPage />} />
    <Route path="events" element={<AdminEventsPage />} />
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
    <Route path="revision-requests" element={<AdminRevisionRequestsPage />} />
    <Route path="feedback" element={<AdminFeedbackPage />} />
    {adminWorkshopRoutes}
    {muhasebeRoutes}
    {serviceFinderRoutes}
    {relocationAdminRoutes}
    {radarRoutes}
    {adminKadroRoutes}
    <Route path="*" element={<NotFound />} />
  </Route>
);
