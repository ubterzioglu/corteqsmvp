import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes, useLocation, useParams } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/components/auth/AuthProvider";
import RequireAuth from "@/components/auth/RequireAuth";
import RequireFeature from "@/components/auth/RequireFeature";
import { DiasporaProvider } from "@/contexts/DiasporaContext";
import { GENERIC_FEATURE_KEYS } from "@/lib/features";
import ScrollTopButton from "@/components/ScrollTopButton";
import PublicLayout from "@/components/PublicLayout";

// Eager — SEO-critical above-the-fold pages
import Index from "./pages/Index.tsx";
import LansmanPage from "./pages/LansmanPage.tsx";
import FoundersPage from "./pages/FoundersPage.tsx";
import AboutPage from "./pages/AboutPage.tsx";
import NotFound from "./pages/NotFound.tsx";

// Lazy — public pages
const ResetPasswordPage = lazy(() => import("./pages/ResetPasswordPage.tsx"));
const PrivacyPolicyPage = lazy(() => import("./pages/PrivacyPolicyPage.tsx"));
const TermsOfService = lazy(() => import("./pages/TermsOfService.tsx"));
const KVKK = lazy(() => import("./pages/KVKK.tsx"));
const CookiePolicy = lazy(() => import("./pages/CookiePolicy.tsx"));
const ContactPage = lazy(() => import("./pages/ContactPage.tsx"));
const Pricing = lazy(() => import("./pages/Pricing.tsx"));
const Career = lazy(() => import("./pages/Career.tsx"));
const DiasporaDetailPage = lazy(() => import("./pages/DiasporaDetailPage.tsx"));
const RadarPage = lazy(() => import("./pages/RadarPage.tsx"));
const CommercialIndexPage = lazy(() => import("./pages/CommercialIndexPage.tsx"));
const CommercialDocumentPage = lazy(() => import("./pages/CommercialDocumentPage.tsx"));
const Founding1000Page = lazy(() => import("./pages/Founding1000Page.tsx"));
const BloggerContestPage = lazy(() => import("./pages/BloggerContestPage.tsx"));
const VloggerContestPage = lazy(() => import("./pages/VloggerContestPage.tsx"));
const May19CampaignPage = lazy(() => import("./pages/May19CampaignPage.tsx"));
const May19MapPage = lazy(() => import("./pages/May19MapPage.tsx"));
const May19IdeaPage = lazy(() => import("./pages/May19IdeaPage.tsx"));
const May19MomentPage = lazy(() => import("./pages/May19MomentPage.tsx"));
const AddWhatsAppPage = lazy(() => import("./pages/AddWhatsAppPage.tsx"));
const WhatsAppLandingEditorPage = lazy(() => import("./pages/WhatsAppLandingEditorPage.tsx"));
const SurveysPage = lazy(() => import("./pages/SurveysPage.tsx"));
const SurveyDetailPage = lazy(() => import("./pages/SurveyDetailPage.tsx"));
const SurveyThankYouPage = lazy(() => import("./pages/SurveyThankYouPage.tsx"));
const LoginPage = lazy(() => import("@/pages/LoginPage"));
const ProfilePage = lazy(() => import("@/pages/ProfilePage"));
const ProfileResolverPage = lazy(() => import("@/pages/ProfileResolverPage"));
const CatalogItemEditorPage = lazy(() => import("@/pages/CatalogItemEditorPage"));
const DirectoryPage = lazy(() => import("@/pages/DirectoryPage"));
const DirectoryProfilePage = lazy(() => import("@/pages/DirectoryProfilePage"));
const DirectoryCatalogItemPage = lazy(() => import("@/pages/DirectoryCatalogItemPage"));
const WelcomeActivatePage = lazy(() => import("@/pages/WelcomeActivatePage"));
const CaddePage = lazy(() => import("@/pages/cadde/CaddePage"));
const Associations = lazy(() => import("@/pages/Associations"));
const AssociationDetail = lazy(() => import("@/pages/AssociationDetail"));
const HospitalAppointment = lazy(() => import("@/pages/HospitalAppointment"));
const IndependentProfilePage = lazy(() => import("@/pages/IndependentProfilePage"));

// Lazy — admin
const AdminLayout = lazy(() => import("@/components/admin/AdminLayout"));
const AdminHomePage = lazy(() => import("@/pages/admin/AdminHomePage"));
const AdminReferralPage = lazy(() => import("@/pages/admin/AdminReferralPage"));
const AdminReferralSourcesPage = lazy(() => import("@/pages/admin/AdminReferralSourcesPage"));
const AdminReferralGroupsPage = lazy(() => import("@/pages/admin/AdminReferralGroupsPage"));
const AdminReferralTypesPage = lazy(() => import("@/pages/admin/AdminReferralTypesPage"));
const AdminAboutPage = lazy(() => import("@/pages/admin/AdminAboutPage"));
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
const AdminCaddePage = lazy(() => import("@/pages/admin/AdminCaddePage"));
const AdminConsulateProfilesPage = lazy(() => import("@/pages/admin/AdminConsulateProfilesPage"));
const AdminCatalogPage = lazy(() => import("@/pages/admin/AdminCatalogPage"));
const AdminDatabaseTablesPage = lazy(() => import("@/pages/admin/AdminDatabaseTablesPage"));

import { muhasebeRoutes } from "@/pages/admin/muhasebe/routes";

const queryClient = new QueryClient();

const WhatsAppGroupDetailRedirect = () => {
  const { id } = useParams<{ id: string }>();
  return <Navigate to={`/addcom?group=${encodeURIComponent(id ?? "")}`} replace />;
};

const AuthRouteRedirect = () => {
  const location = useLocation();
  return <Navigate to={`/login${location.search}`} replace />;
};

const FoundersCombinedPage = () => (
  <>
    <FoundersPage />
    <AboutPage />
  </>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <DiasporaProvider>
          <AuthProvider>
            <Suspense fallback={null}>
              <Routes>
                <Route element={<PublicLayout />}>
                  <Route path="/" element={<Index />} />
                  <Route path="/hakkimizda" element={<Navigate to="/founders" replace />} />
                  <Route path="/founders" element={<FoundersCombinedPage />} />
                  <Route path="/radar" element={<RadarPage />} />
                  <Route path="/commercial" element={<CommercialIndexPage />} />
                  <Route path="/commercial/:slug" element={<CommercialDocumentPage />} />
                  <Route path="/diaspora/:slug" element={<DiasporaDetailPage />} />
                  <Route path="/lansman" element={<LansmanPage />} />
                  <Route path="/founding-1000" element={<Founding1000Page />} />
                  <Route path="/blogger-yarismasi" element={<BloggerContestPage />} />
                  <Route path="/vlogger-yarismasi" element={<VloggerContestPage />} />
                  <Route path="/19051919" element={<May19CampaignPage />} />
                  <Route path="/19051919/harita" element={<May19MapPage />} />
                  <Route path="/190519idea" element={<May19IdeaPage />} />
                  <Route path="/190519memory" element={<May19MomentPage />} />
                  <Route path="/190519" element={<Navigate to="/190519memory" replace />} />
                  <Route path="/addcom" element={<AddWhatsAppPage />} />
                  <Route
                    path="/addcom/edit/:slug"
                    element={
                      <RequireAuth>
                        <WhatsAppLandingEditorPage />
                      </RequireAuth>
                    }
                  />
                  <Route path="/anket" element={<SurveysPage />} />
                  <Route path="/anket/tesekkurler" element={<SurveyThankYouPage />} />
                  <Route path="/anket/:slug" element={<SurveyDetailPage />} />
                  <Route path="/aiform" element={<Navigate to="/login" replace />} />
                  <Route path="/form" element={<Navigate to="/login" replace />} />
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/auth" element={<AuthRouteRedirect />} />
                  <Route path="/welcome/activate" element={<WelcomeActivatePage />} />
                  <Route path="/directory" element={<DirectoryPage />} />
                  <Route path="/directory/catalog/:slug" element={<DirectoryCatalogItemPage />} />
                  <Route path="/associations" element={<Associations />} />
                  <Route path="/association/:id" element={<AssociationDetail />} />
                  <Route path="/kurulus/:slug" element={<IndependentProfilePage />} />
                  <Route path="/hospital-appointment/:id" element={<HospitalAppointment />} />
                  <Route
                    path="/cadde"
                    element={
                      <RequireAuth>
                        <RequireFeature feature={GENERIC_FEATURE_KEYS.caddeAccess} fallback={<Navigate to="/" replace />}>
                          <CaddePage />
                        </RequireFeature>
                      </RequireAuth>
                    }
                  />
                  <Route path="/directory/profile/:userId" element={<DirectoryProfilePage />} />
                  <Route
                    path="/profile"
                    element={
                      <RequireAuth>
                        <ProfileResolverPage />
                      </RequireAuth>
                    }
                  />
                  <Route
                    path="/profile/:type"
                    element={
                      <RequireAuth>
                        <ProfilePage />
                      </RequireAuth>
                    }
                  />
                  <Route
                    path="/profile/catalog/:itemId"
                    element={
                      <RequireAuth>
                        <CatalogItemEditorPage />
                      </RequireAuth>
                    }
                  />
                  <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
                  <Route path="/legal/privacy" element={<PrivacyPolicyPage />} />
                  <Route path="/legal/terms" element={<TermsOfService />} />
                  <Route path="/legal/kvkk" element={<KVKK />} />
                  <Route path="/legal/cookies" element={<CookiePolicy />} />
                  <Route path="/iletisim" element={<ContactPage />} />
                  <Route path="/pricing" element={<Pricing />} />
                  <Route path="/kariyer" element={<Career />} />
                  <Route path="/reset-password" element={<ResetPasswordPage />} />
                  <Route path="*" element={<NotFound />} />
                </Route>
                <Route path="/addwa" element={<Navigate to="/addcom" replace />} />
                <Route path="/whatsapp-groups" element={<Navigate to="/addcom" replace />} />
                <Route path="/whatsapp-groups/:id" element={<WhatsAppGroupDetailRedirect />} />
                <Route path="/contributor" element={<Navigate to="/commercial/contributor" replace />} />
                <Route path="/influencer-partner" element={<Navigate to="/commercial/influencer-partner" replace />} />
                <Route path="/strategic-partner" element={<Navigate to="/commercial/strategic-partner" replace />} />
                <Route path="/community-leader" element={<Navigate to="/commercial/community-leader" replace />} />
                <Route path="/ambassador" element={<Navigate to="/commercial/ambassador" replace />} />
                <Route path="/admin" element={<AdminLayout />}>
                  <Route index element={<AdminHomePage />} />
                  <Route path="referral" element={<AdminReferralPage />} />
                  <Route path="referral/sources" element={<AdminReferralSourcesPage />} />
                  <Route path="referral/groups" element={<AdminReferralGroupsPage />} />
                  <Route path="referral/types" element={<AdminReferralTypesPage />} />
                  <Route path="marquee" element={<AdminMarqueePage />} />
                  <Route path="cadde" element={<AdminCaddePage />} />
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
                  <Route path="may19/kelime" element={<AdminMay19IdeaPage />} />
                  <Route path="may19/ani" element={<AdminMay19MomentPage />} />
                  <Route path="about" element={<AdminAboutPage />} />
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
                  <Route path="*" element={<NotFound />} />
                </Route>
              </Routes>
            </Suspense>
            <ScrollTopButton />
          </AuthProvider>
        </DiasporaProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
