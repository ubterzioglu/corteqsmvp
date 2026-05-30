import { useEffect, useState } from "react";
import { Phone, Loader2, ShieldCheck, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const PhoneVerification = () => {
  const { profile, refreshProfile } = useAuth();
  const { toast } = useToast();
  const [phone, setPhone] = useState(profile?.phone ?? "");
  const [code, setCode] = useState("");
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [sent, setSent] = useState(false);
  const [demoCode, setDemoCode] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const verified = !!profile?.phone_verified;
  const inputDisabled = verified && !editing;

  useEffect(() => {
    if (profile?.phone && !phone) setPhone(profile.phone);
  }, [profile?.phone]);

  const sendCode = async () => {
    const trimmed = phone.trim();
    if (!/^\+?[0-9 ()-]{6,20}$/.test(trimmed)) {
      toast({ title: "Geçersiz numara", description: "Ülke kodu ile birlikte girin (ör: +49 …).", variant: "destructive" });
      return;
    }
    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-phone-otp", { body: { phone: trimmed } });
      if (error) throw error;
      setSent(true);
      if ((data as any)?.demo && (data as any)?.code) {
        setDemoCode((data as any).code);
        toast({ title: "Demo kod oluşturuldu", description: `Kod: ${(data as any).code} (10 dk geçerli)` });
      } else {
        toast({ title: "Kod gönderildi", description: "E-postanı / SMS'ini kontrol et." });
      }
    } catch (e: any) {
      toast({ title: "Gönderilemedi", description: e?.message || "Bir hata oluştu", variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  const verify = async () => {
    if (!/^\d{6}$/.test(code)) {
      toast({ title: "6 haneli kodu girin", variant: "destructive" });
      return;
    }
    setVerifying(true);
    try {
      const { data, error } = await supabase.functions.invoke("verify-phone-otp", { body: { code } });
      if (error || (data as any)?.error) throw new Error((data as any)?.error || error?.message || "Hata");
      toast({ title: "Telefon doğrulandı ✅" });
      setCode("");
      setSent(false);
      setDemoCode(null);
      await refreshProfile();
    } catch (e: any) {
      toast({ title: "Doğrulanamadı", description: e?.message, variant: "destructive" });
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <Label className="flex items-center gap-1.5 text-sm font-semibold">
          <Phone className="h-4 w-4 text-primary" /> Telefon
        </Label>
        {verified ? (
          <Badge className="bg-emerald-500/15 text-emerald-600 border-emerald-500/30 gap-1">
            <ShieldCheck className="h-3 w-3" /> Doğrulandı
          </Badge>
        ) : (
          <Badge variant="outline" className="text-amber-600 border-amber-500/40">Doğrulanmadı</Badge>
        )}
      </div>
      {!verified && (
        <div className="rounded-md border border-amber-500/30 bg-amber-500/5 p-2 text-[11px] text-amber-700 leading-snug">
          <strong>Öneri:</strong> Yurt dışı (TR dışı) telefon numarası ile doğrulanan üyeler{" "}
          <span className="inline-flex items-center font-semibold">CorteQS / Diaspora Pasaport</span> rozeti kazanır
          ve Cadde'de cafe açma gibi premium özelliklere erişir. Daha sonra telefon değişikliği yapabilirsiniz.
        </div>
      )}
      <div className="flex gap-2">
        <Input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="+49 170 …  (ülke kodu ile)"
          disabled={inputDisabled}
        />
        {(!verified || editing) && (
          <Button size="sm" onClick={sendCode} disabled={sending} className="gap-1.5 shrink-0">
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            {sent ? "Yeniden Gönder" : "Kod Gönder"}
          </Button>
        )}
      </div>
      {(!verified || editing) && sent && (
        <div className="space-y-2">
          {demoCode && (
            <p className="text-[11px] text-muted-foreground bg-muted/50 rounded px-2 py-1">
              Demo modu — kod: <strong className="text-foreground">{demoCode}</strong>. Gerçek e-posta/SMS gönderimini ayarlamak için Cloud → Emails veya bir SMS sağlayıcısı eklemek gerekir.
            </p>
          )}
          <div className="flex gap-2">
            <Input
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="6 haneli kod"
              inputMode="numeric"
              maxLength={6}
            />
            <Button size="sm" onClick={verify} disabled={verifying} className="shrink-0">
              {verifying ? <Loader2 className="h-4 w-4 animate-spin" /> : "Doğrula"}
            </Button>
          </div>
        </div>
      )}
      {verified && !editing && (
        <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
          <span>Doğrulanmış numarayı dilediğin zaman değiştirebilirsin (yeniden doğrulama gerekir).</span>
          <Button size="sm" variant="outline" onClick={() => { setEditing(true); setSent(false); setDemoCode(null); }}>
            Daha sonra değiştir
          </Button>
        </div>
      )}
    </div>
  );
};

export default PhoneVerification;
