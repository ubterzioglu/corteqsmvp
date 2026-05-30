import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { UserCircle, Briefcase, Building2, Users, PenLine, Globe } from "lucide-react";
import Navbar from "@/components/Navbar";

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
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          account_type: selected,
          onboarding_completed: true,
        })
        .eq("id", user.id);

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
    </div>
  );
};

export default Onboarding;
