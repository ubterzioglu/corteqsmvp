import { useEffect, useState } from "react";
import { Copy, Gift, Sparkles, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const AmbassadorReferralCard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [code, setCode] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("ambassador_referral_code")
        .eq("id", user.id)
        .maybeSingle();
      if (cancelled) return;
      setCode((data as any)?.ambassador_referral_code || "");
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [user]);

  const shareUrl = code
    ? `${window.location.origin}/auth?ref=${encodeURIComponent(code)}`
    : "";

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
      toast({ title: "Kopyalandı", description: text });
    } catch {
      toast({ title: "Kopyalanamadı", variant: "destructive" });
    }
  };

  return (
    <div className="bg-gradient-to-br from-amber-500/10 via-card to-card rounded-2xl border border-amber-500/30 p-5 md:p-6 shadow-card mb-6">
      <div className="flex items-start gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-amber-500/15 flex items-center justify-center shrink-0">
          <Gift className="h-5 w-5 text-amber-600" />
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-foreground flex items-center gap-2">
            Sana Özel Davet Kodun
            <Badge className="bg-amber-500/15 text-amber-700 border-amber-500/30 text-[10px] gap-1">
              <Sparkles className="h-3 w-3" /> %5 İndirim
            </Badge>
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Bu kodu kullanarak kayıt olan işletmeler <strong>yıllık ödemede %5 indirim</strong> kazanır.
            Davet ettiğin her kayıt panelindeki Onboarding & Referral raporuna düşer.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="h-12 rounded-lg bg-muted animate-pulse" />
      ) : code ? (
        <div className="space-y-3">
          <div className="flex items-center gap-2 rounded-xl border border-border bg-background p-3">
            <code className="text-lg font-bold tracking-wider text-amber-700 flex-1 truncate">
              {code}
            </code>
            <Button size="sm" variant="outline" className="gap-1.5" onClick={() => handleCopy(code)}>
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              Kodu Kopyala
            </Button>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-border bg-muted/30 p-3">
            <p className="text-xs text-muted-foreground truncate flex-1">{shareUrl}</p>
            <Button size="sm" variant="ghost" className="gap-1.5" onClick={() => handleCopy(shareUrl)}>
              <Copy className="h-3.5 w-3.5" /> Linki Kopyala
            </Button>
          </div>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          Davet kodun hazırlanıyor — sayfayı yenile.
        </p>
      )}
    </div>
  );
};

export default AmbassadorReferralCard;
