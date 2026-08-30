import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Crown, Loader2, LogIn, ShieldCheck, ShieldX } from "lucide-react";

import { useAuth } from "@/components/auth/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSeo } from "@/lib/seo";
import {
  redeemVipInvitation,
  resolveVipInvitation,
  type ResolvedVipInvitation,
} from "@/lib/vip-invitations";

const STATUS_COPY: Record<string, { title: string; description: string }> = {
  invalid: { title: "Davet bulunamadı", description: "Bu VIP bağlantısı geçerli değil." },
  expired: { title: "Davetin süresi doldu", description: "Yeni bir davet bağlantısı istemen gerekiyor." },
  revoked: { title: "Davet iptal edildi", description: "Bu bağlantı artık kullanılamaz." },
  used: { title: "Davet daha önce kullanıldı", description: "VIP davetleri yalnızca bir kez kullanılabilir." },
  rate_limited: { title: "Çok fazla deneme", description: "Lütfen birkaç dakika sonra yeniden dene." },
};

const VipInvitationPage = () => {
  const { token = "" } = useParams<{ token: string }>();
  const { user, isLoading: authLoading } = useAuth();
  const [resolved, setResolved] = useState<ResolvedVipInvitation | null>(null);
  const [loading, setLoading] = useState(true);
  const [redeeming, setRedeeming] = useState(false);
  const [redeemed, setRedeemed] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useSeo({ title: "VIP Daveti | CorteQS", robots: "noindex, nofollow" }, []);

  useEffect(() => {
    let active = true;
    setLoading(true);
    void resolveVipInvitation(token)
      .then((result) => {
        if (active) setResolved(result);
      })
      .catch((error: unknown) => {
        if (active) setErrorMessage(error instanceof Error ? error.message : "Davet doğrulanamadı.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [token]);

  const handleRedeem = async () => {
    setRedeeming(true);
    setErrorMessage(null);
    try {
      const result = await redeemVipInvitation(token);
      if (result.status === "redeemed") {
        setRedeemed(true);
      } else {
        setResolved((current) => current ? { ...current, status: result.status === "used" ? "used" : "invalid" } : current);
      }
    } catch (error: unknown) {
      setErrorMessage(error instanceof Error ? error.message : "Davet kabul edilemedi.");
    } finally {
      setRedeeming(false);
    }
  };

  if (loading || authLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
        <div role="status" className="flex items-center gap-2 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" /> Davet doğrulanıyor…</div>
      </main>
    );
  }

  if (redeemed) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
        <Card className="w-full max-w-lg text-center">
          <CardContent className="space-y-4 pt-8">
            <ShieldCheck className="mx-auto h-12 w-12 text-emerald-500" />
            <h1 className="text-2xl font-bold">VIP davetin kabul edildi</h1>
            <p className="text-muted-foreground">Hoş geldin. Davet güvenli biçimde hesabına işlendi.</p>
            <Button asChild><Link to="/profile">Profiline git</Link></Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  if (errorMessage || !resolved || resolved.status !== "valid") {
    const copy = STATUS_COPY[resolved?.status ?? "invalid"];
    return (
      <main className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
        <Card className="w-full max-w-lg text-center">
          <CardContent className="space-y-4 pt-8">
            <ShieldX className="mx-auto h-12 w-12 text-destructive" />
            <h1 className="text-2xl font-bold">{errorMessage ? "Davet doğrulanamadı" : copy.title}</h1>
            <p className="text-muted-foreground">{errorMessage ?? copy.description}</p>
            <Button variant="outline" asChild><Link to="/">Ana sayfaya dön</Link></Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  const loginTarget = `/login?next=${encodeURIComponent(`/vip/${token}`)}`;

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-amber-500/10 to-background px-4 py-12">
      <Card className="w-full max-w-xl">
        <CardHeader className="text-center">
          <Crown className="mx-auto mb-2 h-12 w-12 text-amber-500" />
          <CardTitle className="text-2xl">{resolved.title ?? "CorteQS VIP Daveti"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5 text-center">
          {resolved.recipientName && <p className="text-lg font-medium">Merhaba {resolved.recipientName},</p>}
          {resolved.message && <p className="whitespace-pre-wrap text-muted-foreground">{resolved.message}</p>}
          {resolved.expiresAt && <p className="text-sm text-muted-foreground">Son kullanım: {new Date(resolved.expiresAt).toLocaleString("tr-TR")}</p>}
          {user ? (
            <Button className="w-full gap-2" size="lg" disabled={redeeming} onClick={handleRedeem}>
              {redeeming ? <Loader2 className="h-5 w-5 animate-spin" /> : <ShieldCheck className="h-5 w-5" />}
              Daveti kabul et
            </Button>
          ) : (
            <Button className="w-full gap-2" size="lg" asChild>
              <Link to={loginTarget}><LogIn className="h-5 w-5" /> Giriş yap ve kabul et</Link>
            </Button>
          )}
          {errorMessage && <p role="alert" className="text-sm text-destructive">{errorMessage}</p>}
        </CardContent>
      </Card>
    </main>
  );
};

export default VipInvitationPage;
