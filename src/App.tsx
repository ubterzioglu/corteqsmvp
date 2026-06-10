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

// Admin route ağacı (lazy importlar dahil) — bkz. src/pages/admin/routes.tsx
import { adminRoutes } from "@/pages/admin/routes";

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
                {adminRoutes}
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
