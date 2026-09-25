import { Suspense } from "react";
import { lazyWithReload } from "@/lib/lazy-with-reload";
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
import ScrollToTop from "@/components/ScrollToTop";
import PublicLayout from "@/components/PublicLayout";
import RouteLoadingFallback from "@/components/RouteLoadingFallback";
import { RouterAppErrorBoundary } from "@/components/AppErrorBoundary";

// Eager — SEO-critical above-the-fold pages
import Index from "./pages/Index.tsx";
import LansmanPage from "./pages/LansmanPage.tsx";
import FoundersPage from "./pages/FoundersPage.tsx";
import AboutPage from "./pages/AboutPage.tsx";
import NotFound from "./pages/NotFound.tsx";

// Lazy — public pages
const LandingTrialPage = lazyWithReload(() => import("./pages/LandingTrialPage.tsx")); // ana sayfa (/) içeriği — eski /landingtrial denemesi 2026-06-18'de ana sayfa yapıldı
const ResetPasswordPage = lazyWithReload(() => import("./pages/ResetPasswordPage.tsx"));
const PrivacyPolicyPage = lazyWithReload(() => import("./pages/PrivacyPolicyPage.tsx"));
const TermsOfService = lazyWithReload(() => import("./pages/TermsOfService.tsx"));
const KVKK = lazyWithReload(() => import("./pages/KVKK.tsx"));
const CookiePolicy = lazyWithReload(() => import("./pages/CookiePolicy.tsx"));
const BusinessInformationPage = lazyWithReload(() => import("./pages/BusinessInformationPage.tsx"));
const RefundCancellationPolicy = lazyWithReload(() => import("./pages/RefundCancellationPolicy.tsx"));
const ServiceDeliveryPolicy = lazyWithReload(() => import("./pages/ServiceDeliveryPolicy.tsx"));
const ContactPage = lazyWithReload(() => import("./pages/ContactPage.tsx"));
const FeedbackPage = lazyWithReload(() => import("./pages/FeedbackPage.tsx"));
const Pricing = lazyWithReload(() => import("./pages/Pricing.tsx"));
const Career = lazyWithReload(() => import("./pages/Career.tsx"));
const DiasporaDetailPage = lazyWithReload(() => import("./pages/DiasporaDetailPage.tsx"));
const RadarHubPage = lazyWithReload(() => import("./pages/RadarHubPage.tsx"));
const BlogPostPage = lazyWithReload(() => import("./pages/BlogPostPage.tsx"));
const CommercialIndexPage = lazyWithReload(() => import("./pages/CommercialIndexPage.tsx"));
const CommercialDocumentPage = lazyWithReload(() => import("./pages/CommercialDocumentPage.tsx"));
const CampaignHubPage = lazyWithReload(() => import("./pages/CampaignHubPage.tsx"));
const Founding1000Page = lazyWithReload(() => import("./pages/Founding1000Page.tsx"));
const BloggerContestPage = lazyWithReload(() => import("./pages/BloggerContestPage.tsx"));
const VloggerContestPage = lazyWithReload(() => import("./pages/VloggerContestPage.tsx"));
const May19CampaignPage = lazyWithReload(() => import("./pages/May19CampaignPage.tsx"));
const May19MapPage = lazyWithReload(() => import("./pages/May19MapPage.tsx"));
const May19IdeaPage = lazyWithReload(() => import("./pages/May19IdeaPage.tsx"));
const May19MomentPage = lazyWithReload(() => import("./pages/May19MomentPage.tsx"));
const AddWhatsAppPage = lazyWithReload(() => import("./pages/AddWhatsAppPage.tsx"));
const WhatsAppLandingEditorPage = lazyWithReload(() => import("./pages/WhatsAppLandingEditorPage.tsx"));
const SurveysPage = lazyWithReload(() => import("./pages/SurveysPage.tsx"));
const SurveyDetailPage = lazyWithReload(() => import("./pages/SurveyDetailPage.tsx"));
const SurveyThankYouPage = lazyWithReload(() => import("./pages/SurveyThankYouPage.tsx"));
const LoginPage = lazyWithReload(() => import("@/pages/LoginPage"));
const ProfilePage = lazyWithReload(() => import("@/pages/ProfilePage"));
const ProfileResolverPage = lazyWithReload(() => import("@/pages/ProfileResolverPage"));
const CatalogItemEditorPage = lazyWithReload(() => import("@/pages/CatalogItemEditorPage"));
const DirectoryPage = lazyWithReload(() => import("@/pages/DirectoryPage"));
const RelocationHomePage = lazyWithReload(() => import("@/pages/relocation/RelocationHomePage"));
const RelocationToolsHubPage = lazyWithReload(() => import("@/pages/relocation/tools/RelocationToolsHubPage"));
const RelocationToolPage = lazyWithReload(() => import("@/pages/relocation/tools/RelocationToolPage"));
const RelocationToolResultPage = lazyWithReload(() => import("@/pages/relocation/tools/RelocationToolResultPage"));
const DirectoryProfilePage = lazyWithReload(() => import("@/pages/DirectoryProfilePage"));
const DirectoryCatalogItemPage = lazyWithReload(() => import("@/pages/DirectoryCatalogItemPage"));
const WelcomeActivatePage = lazyWithReload(() => import("@/pages/WelcomeActivatePage"));
const CaddePage = lazyWithReload(() => import("@/pages/cadde/CaddePage"));
const CaddeCafePage = lazyWithReload(() => import("@/pages/cadde/CaddeCafePage"));
const CaddeCarsiPage = lazyWithReload(() => import("@/pages/cadde/CaddeCarsiPage"));
const CaddeCarsiItemPage = lazyWithReload(() => import("@/pages/cadde/CaddeCarsiItemPage"));
const Associations = lazyWithReload(() => import("@/pages/Associations"));
const CityAmbassadorsPage = lazyWithReload(() => import("@/pages/CityAmbassadorsPage"));
const ConsultantsPage = lazyWithReload(() => import("@/pages/ConsultantsPage"));
const BusinessesPage = lazyWithReload(() => import("@/pages/BusinessesPage"));
const BusinessDetailPage = lazyWithReload(() => import("@/pages/BusinessDetailPage"));
const AssociationDetail = lazyWithReload(() => import("@/pages/AssociationDetail"));
const HospitalAppointment = lazyWithReload(() => import("@/pages/HospitalAppointment"));
const IndependentProfilePage = lazyWithReload(() => import("@/pages/IndependentProfilePage"));
const VipInvitationPage = lazyWithReload(() => import("@/pages/VipInvitationPage"));
const NotificationPreferencesPage = lazyWithReload(() => import("@/pages/NotificationPreferencesPage"));
const ContributorResourcesPage = lazyWithReload(() => import("@/pages/ContributorResourcesPage"));
const EventsPage = lazyWithReload(() => import("@/pages/EventsPage"));
const EventDetailPage = lazyWithReload(() => import("@/pages/EventDetailPage"));
const CreateEventPage = lazyWithReload(() => import("@/pages/CreateEventPage"));

// Admin route ağacı (lazy importlar dahil) — bkz. src/pages/admin/routes.tsx
import { adminRoutes } from "@/pages/admin/routes";
// Legacy URL yönlendirmeleri — nginx ile ortak tek kaynak.
import { LEGACY_REDIRECTS } from "@/lib/redirects";

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
        <ScrollToTop />
        {/* Genel sınır — location.key ile sıfırlanır; geri/ileri navigasyon kurtarır.
            main.tsx'teki router dışı sınır son çare olarak durur. Sayfa hataları önce
            PublicLayout/AdminShell içindeki Outlet sınırına düşer. */}
        <RouterAppErrorBoundary>
          <DiasporaProvider>
            <AuthProvider>
              <Suspense fallback={<RouteLoadingFallback />}>
                <Routes>
                  <Route element={<PublicLayout />}>
                    <Route path="/" element={<LandingTrialPage />} />
                    <Route path="/landingtrial" element={<Index />} />
                    <Route path="/founders" element={<FoundersCombinedPage />} />
                    <Route path="/radar" element={<RadarHubPage />} />
                    <Route path="/radar/rehberler" element={<RadarHubPage />} />
                    <Route path="/blog/:slug" element={<BlogPostPage />} />
                    <Route path="/commercial" element={<CommercialIndexPage />} />
                    <Route path="/commercial/:slug" element={<CommercialDocumentPage />} />
                    <Route path="/diaspora/:slug" element={<DiasporaDetailPage />} />
                    <Route path="/lansman" element={<LansmanPage />} />
                    <Route path="/founding-1000" element={<Founding1000Page />} />
                    <Route path="/campaign" element={<CampaignHubPage />} />
                    <Route path="/campaign/vlogger" element={<VloggerContestPage />} />
                    <Route path="/campaign/blogger" element={<BloggerContestPage />} />
                    <Route path="/19051919" element={<May19CampaignPage />} />
                    <Route path="/19051919/harita" element={<May19MapPage />} />
                    <Route path="/190519idea" element={<May19IdeaPage />} />
                    <Route path="/190519memory" element={<May19MomentPage />} />
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
                    <Route
                      path="/feedback"
                      element={
                        <RequireAuth>
                          <FeedbackPage />
                        </RequireAuth>
                      }
                    />
                    <Route path="/anket/tesekkurler" element={<SurveyThankYouPage />} />
                    <Route path="/anket/:slug" element={<SurveyDetailPage />} />
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/auth" element={<AuthRouteRedirect />} />
                    <Route path="/welcome/activate" element={<WelcomeActivatePage />} />
                    <Route path="/vip/:token" element={<VipInvitationPage />} />
                    <Route path="/directory" element={<DirectoryPage />} />
                    <Route path="/directory/catalog/:slug" element={<DirectoryCatalogItemPage />} />
                    <Route
                      path="/relocation"
                      element={
                        <RequireAuth>
                          <RelocationHomePage />
                        </RequireAuth>
                      }
                    />
                    <Route path="/tools" element={<RelocationToolsHubPage />} />
                    <Route
                      path="/tools/:toolSlug"
                      element={
                        <RequireAuth>
                          <RelocationToolPage />
                        </RequireAuth>
                      }
                    />
                    <Route
                      path="/tools/:toolSlug/session/:sessionId"
                      element={
                        <RequireAuth>
                          <RelocationToolPage />
                        </RequireAuth>
                      }
                    />
                    <Route
                      path="/tools/:toolSlug/result/:resultId"
                      element={
                        <RequireAuth>
                          <RelocationToolResultPage />
                        </RequireAuth>
                      }
                    />
                    <Route path="/events" element={<EventsPage />} />
                    <Route path="/events/create" element={<RequireAuth><CreateEventPage /></RequireAuth>} />
                    <Route path="/events/:id" element={<EventDetailPage />} />
                    <Route path="/associations" element={<Associations />} />
                    <Route path="/city-ambassadors" element={<CityAmbassadorsPage />} />
                    <Route path="/consultants" element={<ConsultantsPage />} />
                    <Route path="/businesses" element={<BusinessesPage />} />
                    {/* Detay yolu TÜRKÇE — repodaki mevcut desen (`/associations`
                        + `/kurulus/:slug`) böyle. Bu sayfa DEMO içeriktir. */}
                    <Route path="/isletme/:slug" element={<BusinessDetailPage />} />
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
                      path="/cadde/cafe/:cafeId"
                      element={
                        <RequireAuth>
                          <RequireFeature feature={GENERIC_FEATURE_KEYS.caddeAccess} fallback={<Navigate to="/" replace />}>
                            <CaddeCafePage />
                          </RequireFeature>
                        </RequireAuth>
                      }
                    />
                    <Route
                      path="/cadde/carsi"
                      element={
                        <RequireAuth>
                          <RequireFeature feature={GENERIC_FEATURE_KEYS.caddeAccess} fallback={<Navigate to="/" replace />}>
                            <CaddeCarsiPage />
                          </RequireFeature>
                        </RequireAuth>
                      }
                    />
                    <Route
                      path="/cadde/carsi/:itemId"
                      element={
                        <RequireAuth>
                          <RequireFeature feature={GENERIC_FEATURE_KEYS.caddeAccess} fallback={<Navigate to="/" replace />}>
                            <CaddeCarsiItemPage />
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
                    <Route
                      path="/settings/notifications"
                      element={
                        <RequireAuth>
                          <NotificationPreferencesPage />
                        </RequireAuth>
                      }
                    />
                    <Route
                      path="/contributor/resources"
                      element={
                        <RequireAuth>
                          <ContributorResourcesPage />
                        </RequireAuth>
                      }
                    />
                    <Route path="/legal/privacy" element={<PrivacyPolicyPage />} />
                    <Route path="/legal/terms" element={<TermsOfService />} />
                    <Route path="/legal/business-information" element={<BusinessInformationPage />} />
                    <Route path="/legal/refund-cancellation" element={<RefundCancellationPolicy />} />
                    <Route path="/legal/service-delivery" element={<ServiceDeliveryPolicy />} />
                    <Route path="/legal/kvkk" element={<KVKK />} />
                    <Route path="/legal/cookies" element={<CookiePolicy />} />
                    <Route path="/iletisim" element={<ContactPage />} />
                    <Route path="/pricing" element={<Pricing />} />
                    <Route path="/kariyer" element={<Career />} />
                    <Route path="/reset-password" element={<ResetPasswordPage />} />
                    <Route path="*" element={<NotFound />} />
                  </Route>
                  {/* Legacy yönlendirmeler — tek kaynak: src/lib/redirects.ts.
                      Prod'da nginx 301'i zaten önce devreye girer; bunlar dev/nixpacks
                      ve client-side gezinme için savunma katmanıdır. Yeni madde eklerken
                      nginx.conf.template'i de güncelle (redirects.test.ts drift'i yakalar).
                      PublicLayout DIŞINDA duruyorlar: <Navigate> hiçbir şey render etmez,
                      layout'u boşuna mount etmenin anlamı yok. */}
                  {LEGACY_REDIRECTS.map(({ from, to }) => (
                    <Route key={from} path={from} element={<Navigate to={to} replace />} />
                  ))}
                  {/* Parametre/query taşıdığı için tabloya sığmayanlar (DYNAMIC_LEGACY_REDIRECTS). */}
                  <Route path="/whatsapp-groups/:id" element={<WhatsAppGroupDetailRedirect />} />
                  {adminRoutes}
                </Routes>
              </Suspense>
              <ScrollTopButton />
            </AuthProvider>
          </DiasporaProvider>
        </RouterAppErrorBoundary>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
