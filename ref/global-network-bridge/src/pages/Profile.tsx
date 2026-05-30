import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, User, Building2, Users, Briefcase, Shield, PenLine, Globe2, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ProfileIndividual from "@/components/profiles/ProfileIndividual";
import ProfileBusiness from "@/components/profiles/ProfileBusiness";
import ProfileAssociation from "@/components/profiles/ProfileAssociation";
import ProfileConsultant from "@/components/profiles/ProfileConsultant";
import ProfileAdmin from "@/components/profiles/ProfileAdmin";
import ProfileBlogger from "@/components/profiles/ProfileBlogger";
import ProfileAmbassador from "@/components/profiles/ProfileAmbassador";
import ProfileCompletePopup from "@/components/ProfileCompletePopup";

const Profile = () => {
  const { user, loading, accountType, onboardingCompleted } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const previewView = searchParams.get("view");
  const previewViews = ["individual", "business", "association", "consultant", "admin", "blogger", "ambassador"];
  const isPreviewMode = !!previewView && previewViews.includes(previewView);

  useEffect(() => {
    if (isPreviewMode) return;

    if (!loading && !user) {
      navigate("/auth");
    } else if (!loading && user && !onboardingCompleted) {
      navigate("/onboarding");
    }
  }, [loading, user, onboardingCompleted, navigate, isPreviewMode]);

  const renderProfile = () => {
    const activeView = isPreviewMode ? previewView : accountType;

    switch (activeView) {
      case "business":
        return <ProfileBusiness />;
      case "association":
        return <ProfileAssociation />;
      case "consultant":
        return <ProfileConsultant />;
      case "admin":
        return <ProfileAdmin />;
      case "blogger":
        return <ProfileBlogger />;
      case "ambassador":
        return <ProfileAmbassador />;
      default:
        return <ProfileIndividual />;
    }
  };

  if (loading && !isPreviewMode) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Yükleniyor...</div>
      </div>
    );
  }

  const dashboardMeta: Record<string, { title: string; subtitle: string; icon: typeof User }> = {
    individual: { title: "Bireysel Panelim", subtitle: "Diaspora yolculuğunuzu tek yerden yönetin", icon: User },
    business: { title: "İşletme Paneli", subtitle: "İlanlarınızı, kuponlarınızı ve müşteri etkileşimlerinizi yönetin", icon: Building2 },
    association: { title: "Kuruluş Paneli", subtitle: "Üyelerinizi ve etkinliklerinizi koordine edin", icon: Users },
    consultant: { title: "Danışman Paneli", subtitle: "Hizmetlerinizi sunun, talepleri yönetin", icon: Briefcase },
    admin: { title: "Yönetici Paneli", subtitle: "Platformu yönetin ve içerikleri denetleyin", icon: Shield },
    blogger: { title: "Blogger / Vlogger Paneli", subtitle: "İçeriklerinizi ve iş birliklerinizi yönetin", icon: PenLine },
    ambassador: { title: "Şehir Elçisi Paneli", subtitle: "Şehrinizdeki diasporayı büyütün", icon: Globe2 },
  };

  const activeView = isPreviewMode ? previewView! : (accountType || "individual");
  const meta = dashboardMeta[activeView] || dashboardMeta.individual;
  const Icon = meta.icon;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors">
            <ArrowLeft className="h-4 w-4" /> Ana Sayfa
          </Link>

          <div className="mb-6 rounded-2xl border bg-card p-5 sm:p-6 shadow-sm">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-4 min-w-0">
                <div className="h-12 w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <Icon className="h-6 w-6" />
                </div>
                <div className="min-w-0">
                  <h1 className="text-xl sm:text-2xl font-bold text-foreground truncate">{meta.title}</h1>
                  <p className="text-sm text-muted-foreground mt-0.5">{meta.subtitle}</p>
                </div>
              </div>
              {isPreviewMode && (
                <Badge variant="outline" className="gap-1.5 border-primary/30 bg-primary/5 text-primary">
                  <Eye className="h-3.5 w-3.5" />
                  Önizleme Modu
                </Badge>
              )}
            </div>
          </div>

          {renderProfile()}
          <ProfileCompletePopup onGoToSettings={() => navigate("/profile?tab=settings")} />
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Profile;
