import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { UserCircle, Briefcase, Building2, Users, PenLine, Globe, Crown, Sparkles, Check } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const accountTypes = [
  {
    key: "user",
    label: "Bireysel Kullanıcı",
    description: "Hizmet almak, etkinliklere katılmak ve diaspora ağınızı keşfetmek için",
    icon: UserCircle,
    color: "text-blue-500",
  },
  {
    key: "consultant",
    label: "Danışman",
    description: "Profesyonel danışmanlık hizmetleri sunmak ve müşteri portföyünüzü büyütmek için",
    icon: Briefcase,
    color: "text-emerald-500",
  },
  {
    key: "business",
    label: "İşletme",
    description: "İşletmenizi tanıtmak, ilan vermek ve diaspora müşterilerine ulaşmak için",
    icon: Building2,
    color: "text-amber-500",
  },
  {
    key: "association",
    label: "Kuruluş / Dernek",
    description: "Kuruluşunuzu yönetmek, etkinlikler düzenlemek ve üyelerinize ulaşmak için",
    icon: Users,
    color: "text-purple-500",
  },
  {
    key: "blogger",
    label: "Blogger / Vlogger / YouTuber",
    description: "İçerik üretmek, blog/vlog yarışmalarına katılmak ve diaspora kitlenizi büyütmek için (Ücretsiz)",
    icon: PenLine,
    color: "text-rose-500",
  },
  {
    key: "ambassador",
    label: "Şehir Elçisi",
    description: "Şehrinde CorteQS ağını kur, topluluk yönet ve gelir paylaşımından kazan",
    icon: Globe,
    color: "text-cyan-500",
  },
];

const Onboarding = () => {
  const { user, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [foundingLoading, setFoundingLoading] = useState(false);
  const [foundingDone, setFoundingDone] = useState(false);

  const handleFoundingSignup = async () => {
    if (!user || !selected || selected === "user") return;
    setFoundingLoading(true);
    const meta = (user.user_metadata || {}) as Record<string, any>;
    const { error } = await (supabase.from("founding_1000_signups") as any).insert({
      user_id: user.id,
      account_type: selected,
      full_name: meta.full_name || meta.name || null,
      email: user.email || null,
    });
    setFoundingLoading(false);
    if (error && !error.message.includes("duplicate")) {
      toast({ title: "Kayıt başarısız", description: error.message, variant: "destructive" });
      return;
    }
    setFoundingDone(true);
    toast({
      title: "Founding 1000 başvurun alındı! ⭐",
      description: "Platform admin en kısa sürede seninle iletişime geçecek.",
    });
  };

  const handleContinue = async () => {
    if (!selected || !user) return;
    setLoading(true);

    try {
      // Update user_roles — delete default 'user' role if selecting something else, then insert
      if (selected !== "user") {
        // Insert the new role
        const { error: roleError } = await supabase
          .from("user_roles")
          .insert({ user_id: user.id, role: selected as any });

        if (roleError && !roleError.message.includes("duplicate")) {
          throw roleError;
        }
      }

      // Update profile with account_type and mark onboarding as completed
      const profilePatch: Record<string, any> = {
        account_type: selected,
        onboarding_completed: true,
      };
      // Auth-tan gelen bilgilerle işletme profilini ön-doldur
      if (selected === "business") {
        const meta = (user.user_metadata || {}) as Record<string, any>;
        const fallbackName = meta.full_name || meta.name || "";
        if (fallbackName) profilePatch.business_name = fallbackName;
        profilePatch.business_sector = meta.business_sector || meta.sector || "İşletme";
      }
      const { error: profileError } = await (supabase
        .from("profiles") as any)
        .upsert({ id: user.id, ...profilePatch }, { onConflict: "id" });

      if (profileError) throw profileError;

      await refreshProfile();
      toast({ title: "Hesabınız hazır! 🎉", description: "Profilinize yönlendiriliyorsunuz." });
      navigate("/profile");
    } catch (error: any) {
      toast({ title: "Hata", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-2xl">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-extrabold text-foreground mb-2">Hoş Geldiniz! 👋</h1>
            <p className="text-muted-foreground">
              Hesap türünüzü seçerek profilinizi oluşturmaya başlayın.
            </p>
          </div>

          <div className="grid gap-3">
            {accountTypes.map((type) => (
              <Card
                key={type.key}
                className={`cursor-pointer transition-all border-2 ${
                  selected === type.key
                    ? "border-primary bg-primary/5 shadow-md"
                    : "border-border hover:border-primary/40 hover:shadow-sm"
                }`}
                onClick={() => setSelected(type.key)}
              >
                <CardContent className="flex items-center gap-4 p-4">
                  <div className={`p-3 rounded-xl bg-muted ${type.color}`}>
                    <type.icon className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground">{type.label}</h3>
                    <p className="text-sm text-muted-foreground">{type.description}</p>
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    selected === type.key ? "border-primary bg-primary" : "border-muted-foreground/30"
                  }`}>
                    {selected === type.key && (
                      <div className="w-2 h-2 rounded-full bg-primary-foreground" />
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {selected && selected !== "user" && (
            <Card className="mt-6 border-2 border-amber-400/60 bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 dark:from-amber-950/20 dark:via-orange-950/20 dark:to-rose-950/20 shadow-lg overflow-hidden">
              <CardContent className="p-5">
                <div className="flex items-start gap-3 mb-3">
                  <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-sm">
                    <Crown className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h3 className="font-extrabold text-foreground">Founding 1000 — Kurucu Üye</h3>
                      <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0">Sınırlı</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Platformun ilk 1000 kurucu üyesinden biri ol. <strong className="text-foreground">Global tanınma</strong>, profilinde kalıcı kurucu rozeti ve özel kurucu indirimi:
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2 mb-4 pl-1">
                  <Badge variant="outline" className="gap-1 border-amber-400/60 bg-white/60 dark:bg-background/60">
                    <Sparkles className="h-3 w-3 text-amber-500" /> 1 Yıl · 99 €
                  </Badge>
                  <Badge variant="outline" className="gap-1 border-amber-400/60 bg-white/60 dark:bg-background/60">
                    🌍 Global tanınma
                  </Badge>
                  <Badge variant="outline" className="gap-1 border-amber-400/60 bg-white/60 dark:bg-background/60">
                    👑 Kurucu rozeti
                  </Badge>
                </div>
                <Button
                  type="button"
                  size="lg"
                  disabled={foundingLoading || foundingDone}
                  onClick={handleFoundingSignup}
                  className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white border-0 shadow-md"
                >
                  {foundingDone ? (
                    <><Check className="h-4 w-4 mr-2" /> Founding 1000 başvurun alındı</>
                  ) : foundingLoading ? (
                    "Kaydediliyor..."
                  ) : (
                    <><Crown className="h-4 w-4 mr-2" /> Beni Kaydet — Founding 1000</>
                  )}
                </Button>
                <p className="text-[11px] text-muted-foreground mt-2 text-center">
                  Başvurun platform yöneticisine iletilir, ödeme & onay sonrasında aktifleşir.
                </p>
              </CardContent>
            </Card>
          )}

          <Button
            className="w-full mt-6"
            size="lg"
            disabled={!selected || loading}
            onClick={handleContinue}
          >
            {loading ? "Kaydediliyor..." : "Devam Et"}
          </Button>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Onboarding;
