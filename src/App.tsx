import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes, useParams } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/components/auth/AuthProvider";
import RequireAuth from "@/components/auth/RequireAuth";
import RequireFeature from "@/components/auth/RequireFeature";
import { DiasporaProvider } from "@/contexts/DiasporaContext";
import { GENERIC_FEATURE_KEYS } from "@/lib/features";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import AboutPage from "./pages/AboutPage.tsx";
import FormPage from "./pages/FormPage.tsx";
import ResetPasswordPage from "./pages/ResetPasswordPage.tsx";
import PrivacyPolicyPage from "./pages/PrivacyPolicyPage.tsx";
import DiasporaDetailPage from "./pages/DiasporaDetailPage.tsx";
import RadarPage from "./pages/RadarPage.tsx";
import CommercialIndexPage from "./pages/CommercialIndexPage.tsx";
import CommercialDocumentPage from "./pages/CommercialDocumentPage.tsx";
import AdminLayout from "@/components/admin/AdminLayout";
import AdminMembersPage from "@/pages/admin/AdminMembersPage";
import AdminLansmanPage from "@/pages/AdminLansmanPage.tsx";
import AdminReferralPage from "@/pages/admin/AdminReferralPage";
import AdminReferralSourcesPage from "@/pages/admin/AdminReferralSourcesPage";
import AdminReferralGroupsPage from "@/pages/admin/AdminReferralGroupsPage";
import AdminReferralTypesPage from "@/pages/admin/AdminReferralTypesPage";
import AdminAboutPage from "@/pages/admin/AdminAboutPage";
import AdminMarqueePage from "@/pages/admin/AdminMarqueePage";
import AdminAdvisorLinksPage from "@/pages/admin/AdminAdvisorLinksPage";
import AdminSocialMediaLinksPage from "@/pages/admin/AdminSocialMediaLinksPage";
import AdminRolesDraftPage from "@/pages/admin/AdminRolesDraftPage";
import AdminLoginUsersRolesPage from "@/pages/admin/AdminLoginUsersRolesPage";
import AdminRolesFeaturesPage from "@/pages/admin/AdminRolesFeaturesPage";
import AdminHomePage from "@/pages/admin/AdminHomePage";
import AdminWorkspaceHomePage from "@/pages/admin/workspace/AdminWorkspaceHomePage";
import AdminCommandCenterPage from "@/pages/admin/workspace/AdminCommandCenterPage";
import AdminResourcesPage from "@/pages/admin/workspace/AdminResourcesPage";
import AdminTodoWorkspacePage from "@/pages/admin/workspace/AdminTodoWorkspacePage";
import AdminMeetingNotesWorkspacePage from "@/pages/admin/workspace/AdminMeetingNotesWorkspacePage";
import AdminMvpWorkspacePage from "@/pages/admin/workspace/AdminMvpWorkspacePage";
import AdminWorkspaceDocPage from "@/pages/admin/workspace/AdminWorkspaceDocPage";
import { muhasebeRoutes } from "@/pages/admin/muhasebe/routes";
import Founding1000Page from "./pages/Founding1000Page.tsx";
import BloggerContestPage from "./pages/BloggerContestPage.tsx";
import VloggerContestPage from "./pages/VloggerContestPage.tsx";
import ScrollTopButton from "@/components/ScrollTopButton";
import PublicLayout from "@/components/PublicLayout";
import LansmanPage from "./pages/LansmanPage.tsx";
import FoundersPage from "./pages/FoundersPage.tsx";
import May19CampaignPage from "./pages/May19CampaignPage.tsx";
import May19MapPage from "./pages/May19MapPage.tsx";
import May19IdeaPage from "./pages/May19IdeaPage.tsx";
import May19MomentPage from "./pages/May19MomentPage.tsx";
import AddWhatsAppPage from "./pages/AddWhatsAppPage.tsx";
import AdminWhatsAppLandingsPage from "@/pages/admin/AdminWhatsAppLandingsPage";
import AdminWhatsAppLandingEditorsPage from "@/pages/admin/AdminWhatsAppLandingEditorsPage";
import AdminCommunityGuidePage from "@/pages/admin/AdminCommunityGuidePage";
import WhatsAppLandingEditorPage from "@/pages/WhatsAppLandingEditorPage";
import AIFormPage from "./pages/AIFormPage.tsx";
import AdminMay19IdeaPage from "@/pages/admin/AdminMay19IdeaPage";
import AdminMay19MomentPage from "@/pages/admin/AdminMay19MomentPage";
import SurveysPage from "./pages/SurveysPage.tsx";
import SurveyDetailPage from "./pages/SurveyDetailPage.tsx";
import SurveyThankYouPage from "./pages/SurveyThankYouPage.tsx";
import AdminSurveysPage from "@/pages/admin/surveys/AdminSurveysPage";
import AdminSurveyCreatePage from "@/pages/admin/surveys/AdminSurveyCreatePage";
import AdminSurveyEditPage from "@/pages/admin/surveys/AdminSurveyEditPage";
import AdminSurveyResponsesPage from "@/pages/admin/surveys/AdminSurveyResponsesPage";
import LoginPage from "@/pages/LoginPage";
import ProfilePage from "@/pages/ProfilePage";
import ProfileResolverPage from "@/pages/ProfileResolverPage";
import DirectoryPage from "@/pages/DirectoryPage";
import DirectoryProfilePage from "@/pages/DirectoryProfilePage";
import AdminAttributesPage from "@/pages/admin/AdminAttributesPage";
import AdminUserOverridesPage from "@/pages/admin/AdminUserOverridesPage";
import AdminApprovalsPage from "@/pages/admin/AdminApprovalsPage";
import AdminAuditLogsPage from "@/pages/admin/AdminAuditLogsPage";
import AdminProfileSectionsPage from "@/pages/admin/AdminProfileSectionsPage";
import AdminTaxonomyPage from "@/pages/admin/AdminTaxonomyPage";
import AdminNewMemberGuidePage from "@/pages/admin/AdminNewMemberGuidePage";
import CaddePage from "@/pages/CaddePage";
import AdminCaddePage from "@/pages/admin/AdminCaddePage";
import Associations from "@/pages/Associations";
import AssociationDetail from "@/pages/AssociationDetail";
import HospitalAppointment from "@/pages/HospitalAppointment";
import IndependentProfilePage from "@/pages/IndependentProfilePage";
import AdminConsulateProfilesPage from "@/pages/admin/AdminConsulateProfilesPage";
import AdminTurkishMissionsDataPage from "@/pages/admin/AdminTurkishMissionsDataPage";

const queryClient = new QueryClient();

const WhatsAppGroupDetailRedirect = () => {
  const { id } = useParams<{ id: string }>();

  return <Navigate to={`/addcom?group=${encodeURIComponent(id ?? "")}`} replace />;
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
                <Route path="/aiform" element={<AIFormPage />} />
                <Route path="/form" element={<FormPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/directory" element={<DirectoryPage />} />
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
                <Route
                  path="/directory/profile/:userId"
                  element={
                    <RequireAuth>
                      <DirectoryProfilePage />
                    </RequireAuth>
                  }
                />
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
                <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
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
                <Route path="members" element={<AdminMembersPage />} />
                <Route path="lansman" element={<AdminLansmanPage />} />
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
                <Route path="new-member/users-roles" element={<AdminLoginUsersRolesPage />} />
                <Route path="data/kullanici-rolleri" element={<AdminLoginUsersRolesPage />} />
                <Route path="new-member/guide" element={<AdminNewMemberGuidePage />} />
                <Route path="new-member/roles-features" element={<AdminRolesFeaturesPage />} />
                <Route path="new-member/attributes" element={<AdminAttributesPage />} />
                <Route path="new-member/profile-sections" element={<AdminProfileSectionsPage />} />
                <Route path="new-member/taxonomy" element={<AdminTaxonomyPage />} />
                <Route path="new-member/overrides" element={<AdminUserOverridesPage />} />
                <Route path="approvals" element={<AdminApprovalsPage />} />
                <Route path="audit-logs" element={<AdminAuditLogsPage />} />
                <Route path="roller-taslak" element={<AdminRolesDraftPage />} />
                <Route path="whatsapp-landings" element={<AdminWhatsAppLandingsPage />} />
                <Route path="whatsapp-landings/editors" element={<AdminWhatsAppLandingEditorsPage />} />
                <Route path="whatsapp-landings/guide" element={<AdminCommunityGuidePage />} />
                <Route path="consulates" element={<AdminConsulateProfilesPage />} />
                <Route path="data/:category" element={<AdminTurkishMissionsDataPage />} />
                <Route path="may19/kelime" element={<AdminMay19IdeaPage />} />
                <Route path="may19/ani" element={<AdminMay19MomentPage />} />
                <Route path="about" element={<AdminAboutPage />} />
                <Route path="workspace" element={<AdminWorkspaceHomePage />} />
                <Route path="workspace/command-center" element={<AdminCommandCenterPage />} />
                <Route path="workspace/resources" element={<AdminResourcesPage />} />
                <Route path="workspace/resources/arge" element={<Navigate to="/admin/workspace/resources?section=arge" replace />} />
                <Route
                  path="workspace/resources/insankaynaklari"
                  element={<Navigate to="/admin/workspace/resources?section=insankaynaklari" replace />}
                />
                <Route path="workspace/todos" element={<AdminTodoWorkspacePage />} />
                <Route path="workspace/meeting-notes" element={<AdminMeetingNotesWorkspacePage />} />
                <Route path="workspace/mvp" element={<AdminMvpWorkspacePage />} />
                <Route path="workspace/docs/:slug" element={<AdminWorkspaceDocPage />} />
                {muhasebeRoutes}
              </Route>
            </Routes>
            <ScrollTopButton />
          </AuthProvider>
        </DiasporaProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
