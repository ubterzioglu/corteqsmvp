import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

type RecoveryStatus = "checking" | "ready" | "invalid" | "updating" | "done";

const ResetPasswordPage = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [status, setStatus] = useState<RecoveryStatus>("checking");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" && session) {
        setStatus("ready");
      }
    });

    void supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setStatus((current) => (current === "checking" ? "ready" : current));
        return;
      }

      const hash = window.location.hash;
      const hasRecoveryToken = hash.includes("type=recovery") || hash.includes("access_token=");

      if (!hasRecoveryToken) {
        setStatus("invalid");
      }
    });

    return () => {
      data.subscription.unsubscribe();
    };
  }, []);

  const isStrongPassword = (pwd: string) => {
    if (pwd.length < 12) return false;
    if (!/[A-Z]/.test(pwd)) return false;
    if (!/[a-z]/.test(pwd)) return false;
    if (!/[0-9]/.test(pwd)) return false;
    return true;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!isStrongPassword(password)) {
      toast({
        title: "Şifre yeterince güçlü değil",
        description: "En az 12 karakter, büyük harf, küçük harf ve rakam içermeli.",
        variant: "destructive",
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: "Şifreler eşleşmiyor",
        description: "Lütfen her iki alana aynı şifreyi girin.",
        variant: "destructive",
      });
      return;
    }

    setStatus("updating");
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      toast({
        title: "Şifre güncellenemedi",
        description: error.message,
        variant: "destructive",
      });
      setStatus("ready");
      return;
    }

    toast({
      title: "Şifre güncellendi",
      description: "Yeni şifrenizle giriş yapabilirsiniz.",
    });
    setStatus("done");

    await supabase.auth.signOut();
    setTimeout(() => {
      navigate("/admin", { replace: true });
    }, 1500);
  };

  if (status === "checking") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        Bağlantı doğrulanıyor...
      </div>
    );
  }

  if (status === "invalid") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Geçersiz veya süresi dolmuş bağlantı</CardTitle>
            <CardDescription>
              Şifre sıfırlama bağlantısı geçersiz. Lütfen giriş ekranından tekrar bir sıfırlama e-postası talep edin.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate("/admin")} className="w-full">
              Giriş ekranına dön
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (status === "done") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Şifreniz güncellendi</CardTitle>
            <CardDescription>Giriş sayfasına yönlendiriliyorsunuz...</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const isUpdating = status === "updating";

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Yeni şifre belirle</CardTitle>
          <CardDescription>Lütfen yeni şifrenizi girin ve onaylayın.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="password"
              placeholder="Yeni şifre (en az 12 karakter)"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="new-password"
              minLength={12}
              required
            />
            <Input
              type="password"
              placeholder="Yeni şifre (tekrar)"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              autoComplete="new-password"
              minLength={8}
              required
            />
            <Button type="submit" disabled={isUpdating} className="w-full">
              {isUpdating ? "Güncelleniyor..." : "Şifreyi güncelle"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ResetPasswordPage;
