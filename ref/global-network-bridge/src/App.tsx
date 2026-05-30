import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Suspense, lazy, useEffect, useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { DiasporaProvider } from "@/contexts/DiasporaContext";
import { AuthProvider } from "@/contexts/AuthContext";
import AppErrorBoundary from "@/components/AppErrorBoundary";
import BrandLoader from "@/components/BrandLoader";
import { recoverFromWhiteScreen } from "@/lib/recoveryReload";

const Index = lazy(() => import("./pages/Index"));
const Consultants = lazy(() => import("./pages/Consultants"));
const ConsultantDetail = lazy(() => import("./pages/ConsultantDetail"));
const VolunteerMentorDetail = lazy(() => import("./pages/VolunteerMentorDetail"));
const Associations = lazy(() => import("./pages/Associations"));
const AssociationDetail = lazy(() => import("./pages/AssociationDetail"));
const Businesses = lazy(() => import("./pages/Businesses"));
const VentureHub = lazy(() => import("./pages/VentureHub"));
const BusinessDetail = lazy(() => import("./pages/BusinessDetail"));
const Profile = lazy(() => import("./pages/Profile"));
const WhatsAppGroups = lazy(() => import("./pages/WhatsAppGroups"));
const WhatsAppGroupLanding = lazy(() => import("./pages/WhatsAppGroupLanding"));
const Events = lazy(() => import("./pages/Events"));
const EventDetail = lazy(() => import("./pages/EventDetail"));
const RadioSongRequest = lazy(() => import("./pages/RadioSongRequest"));
const MapSearch = lazy(() => import("./pages/MapSearch"));
const Pricing = lazy(() => import("./pages/Pricing"));
const Bloggers = lazy(() => import("./pages/Bloggers"));
const BloggerDetail = lazy(() => import("./pages/BloggerDetail"));
const BlogContest = lazy(() => import("./pages/BlogContest"));
const VloggerContest = lazy(() => import("./pages/VloggerContest"));
const RelocationEngine = lazy(() => import("./pages/RelocationEngine"));
const Auth = lazy(() => import("./pages/Auth"));
const Onboarding = lazy(() => import("./pages/Onboarding"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const CityAmbassadors = lazy(() => import("./pages/CityAmbassadors"));
const AmbassadorDetail = lazy(() => import("./pages/AmbassadorDetail"));
const CityNews = lazy(() => import("./pages/CityNews"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const HospitalAppointment = lazy(() => import("./pages/HospitalAppointment"));
const Founders1000 = lazy(() => import("./pages/Founders1000"));
const Career = lazy(() => import("./pages/Career"));
const JobBoard = lazy(() => import("./pages/JobBoard"));
const Dashboards = lazy(() => import("./pages/Dashboards"));
const PostGenerator = lazy(() => import("./pages/PostGenerator"));
const AITwin = lazy(() => import("./pages/AITwin"));
const PrivacyPolicy = lazy(() => import("./pages/legal/PrivacyPolicy"));
const TermsOfService = lazy(() => import("./pages/legal/TermsOfService"));
const KVKK = lazy(() => import("./pages/legal/KVKK"));
const CookiePolicy = lazy(() => import("./pages/legal/CookiePolicy"));

const Feed = lazy(() => import("./pages/Feed"));
const DiasporaPeople = lazy(() => import("./pages/DiasporaPeople"));
const DiasporaPersonDetail = lazy(() => import("./pages/DiasporaPersonDetail"));
const May19 = lazy(() => import("./pages/May19"));
const May19Map = lazy(() => import("./pages/May19Map"));
const NotFound = lazy(() => import("./pages/NotFound"));

import CookieConsentBanner from "@/components/CookieConsentBanner";

const queryClient = new QueryClient();

const ROUTE_LOADING_WARNING_MS = 4000;
const ROUTE_LOADING_TIMEOUT_MS = 12000;

const RouteLoadingFallback = () => {
  const [isSlow, setIsSlow] = useState(false);
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    const slowTimer = window.setTimeout(() => setIsSlow(true), ROUTE_LOADING_WARNING_MS);
    const recoveryTimer = window.setTimeout(() => {
      const recovered = recoverFromWhiteScreen();
      if (!recovered) {
        setTimedOut(true);
      }
    }, ROUTE_LOADING_TIMEOUT_MS);

    return () => {
      window.clearTimeout(slowTimer);
      window.clearTimeout(recoveryTimer);
    };
  }, []);

  if (timedOut) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center px-4">
        <div className="max-w-md w-full rounded-2xl border border-border bg-card p-8 text-center shadow-card">
          <h1 className="text-2xl font-extrabold mb-3">Sayfa yüklenemedi</h1>
          <p className="text-sm text-muted-foreground mb-6">
            Uygulama bu ekranda takıldı. Tekrar denemek için sayfayı yenileyin.
          </p>
          <Button onClick={() => recoverFromWhiteScreen({ forceReloadOnCooldown: true })} variant="hero" className="w-full">
            Sayfayı Yenile
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center px-4">
      <div className="max-w-md w-full rounded-2xl border border-border bg-card p-8 text-center shadow-card">
        <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-border border-t-primary" aria-hidden="true" />
        <p className="text-sm font-medium text-muted-foreground">
          {isSlow ? "Sayfa beklenenden uzun sürüyor, kurtarma hazırlanıyor..." : "Sayfa yükleniyor..."}
        </p>
      </div>
    </div>
  );
};

const App = () => (
  <AppErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <DiasporaProvider>
            <Toaster />
            <Sonner />
            <BrandLoader />
            <BrowserRouter>
              <Suspense fallback={<RouteLoadingFallback />}>
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/consultants" element={<Consultants />} />
                  <Route path="/consultant/:id" element={<ConsultantDetail />} />
                  <Route path="/volunteer/:id" element={<VolunteerMentorDetail />} />
                  <Route path="/associations" element={<Associations />} />
                  <Route path="/association/:id" element={<AssociationDetail />} />
                  <Route path="/businesses" element={<Businesses />} />
                  <Route path="/business/:id" element={<BusinessDetail />} />
                  <Route path="/venture-hub" element={<VentureHub />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/whatsapp-groups" element={<WhatsAppGroups />} />
                  <Route path="/whatsapp-groups/:id" element={<WhatsAppGroupLanding />} />
                  <Route path="/events" element={<Events />} />
                  <Route path="/event/:id" element={<EventDetail />} />
                  <Route path="/radio/:id/song-request" element={<RadioSongRequest />} />
                  <Route path="/map" element={<MapSearch />} />
                  <Route path="/pricing" element={<Pricing />} />
                  <Route path="/bloggers" element={<Bloggers />} />
                  <Route path="/blogger/:id" element={<BloggerDetail />} />
                  <Route path="/blog-contest" element={<BlogContest />} />
                  <Route path="/vlogger-contest" element={<VloggerContest />} />
                  <Route path="/relocation" element={<RelocationEngine />} />
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/onboarding" element={<Onboarding />} />
                  <Route path="/reset-password" element={<ResetPassword />} />
                  <Route path="/city-ambassadors" element={<CityAmbassadors />} />
                  <Route path="/city-news" element={<CityNews />} />
                  <Route path="/ambassador/:id" element={<AmbassadorDetail />} />
                  <Route path="/admin" element={<AdminDashboard />} />
                  <Route path="/admin/post-generator" element={<PostGenerator />} />
                  <Route path="/hospital-appointment/:hospitalId?" element={<HospitalAppointment />} />
                  <Route path="/founders-1000" element={<Founders1000 />} />
                  <Route path="/founding-1000" element={<Founders1000 />} />
                  <Route path="/kariyer" element={<Career />} />
                  <Route path="/is-ilanlari" element={<JobBoard />} />
                  <Route path="/career" element={<Career />} />
                  <Route path="/internal-cq-dashboards-7f3a9b2e1d4c" element={<Dashboards />} />
                  <Route path="/ai-twin" element={<AITwin />} />
                  <Route path="/legal/privacy" element={<PrivacyPolicy />} />
                  <Route path="/legal/terms" element={<TermsOfService />} />
                  <Route path="/legal/kvkk" element={<KVKK />} />
                  <Route path="/legal/cookies" element={<CookiePolicy />} />
                  
                  <Route path="/feed" element={<Feed />} />
                  <Route path="/cadde" element={<Feed />} />
                  <Route path="/cadde/:cafeId" element={<Feed />} />
                  <Route path="/diaspora-people" element={<DiasporaPeople />} />
                  <Route path="/diaspora-people/:id" element={<DiasporaPersonDetail />} />
                  <Route path="/19-mayis" element={<May19 />} />
                  <Route path="/19-mayis/harita" element={<May19Map />} />
                  <Route path="/may19" element={<May19 />} />
                  <Route path="/may19/map" element={<May19Map />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
              <CookieConsentBanner />
            </BrowserRouter>
          </DiasporaProvider>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  </AppErrorBoundary>
);

export default App;
