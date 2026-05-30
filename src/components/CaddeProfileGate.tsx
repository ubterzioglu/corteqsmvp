import { Link } from "react-router-dom";
import { Lock, Settings, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Wrap the Cadde page content. If the user hasn't completed their profile
 * (country/city/phone verified), show an overlay banner that lets them
 * still see a faded mock and pushes them to /profile to finish.
 */
const CaddeProfileGate = ({ children }: { children: React.ReactNode }) => {
  const { user, profileComplete, loading } = useAuth();

  if (loading || !user || profileComplete) return <>{children}</>;

  return (
    <div className="relative">
      <div className="pointer-events-none select-none opacity-50 blur-[1.5px]">{children}</div>
      <div className="absolute inset-0 z-30 flex items-start justify-center pt-32 px-4">
        <div className="max-w-md w-full bg-card border border-border rounded-2xl shadow-xl p-6 text-center pointer-events-auto">
          <div className="h-12 w-12 mx-auto rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-3">
            <Lock className="h-6 w-6" />
          </div>
          <Badge variant="outline" className="mb-3 border-amber-500/40 text-amber-600">Demo Görünümü</Badge>
          <h2 className="text-xl font-bold text-foreground mb-2">Caddeye çıkmak için profilini tamamla</h2>
          <p className="text-sm text-muted-foreground mb-5">
            Bu Cadde önizlemesi sadece demo. Gerçek topluluğa katılmak için ülke, şehir ve telefon doğrulamanı tamamlaman gerekiyor.
          </p>
          <Button asChild className="w-full gap-2">
            <Link to="/profile?tab=settings">
              <Settings className="h-4 w-4" /> Profil Ayarlarını Tamamla
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CaddeProfileGate;
