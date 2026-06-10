// Admin Panel V2 — erişim kapısı.
// useAdminAccess durum makinesini UI'a çevirir: login formu, yetki reddi,
// hata ve yükleme ekranları. Yetkili kullanıcıda children render edilir.
// Erişim reddi mesajı canonical is_admin() akışını anlatır; drop edilmiş
// admin_users tablosuna referans YASAKTIR (masterplan §11.2).

import { useState } from "react";
import type { FormEvent, ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import type { AdminAccessState } from "@/hooks/admin/useAdminAccess";

import AdminShellLoading from "./AdminShellLoading";

type AdminAccessGateProps = {
  access: AdminAccessState;
  children: ReactNode;
};

const GateCardFrame = ({ children }: { children: ReactNode }) => (
  <div className="flex min-h-screen items-center justify-center bg-background p-4">{children}</div>
);

const AdminLoginCard = ({ access }: { access: AdminAccessState }) => {
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  const handleLogin = async (event: FormEvent) => {
    event.preventDefault();
    setAuthLoading(true);
    const { error } = await access.login(email, password);
    if (error) {
      toast({ title: "Giriş başarısız", description: error, variant: "destructive" });
    }
    setAuthLoading(false);
  };

  const handlePasswordReset = async () => {
    setResetLoading(true);
    const { error } = await access.requestPasswordReset(email);
    setResetLoading(false);

    if (error) {
      toast({ title: "İstek alınamadı", description: error, variant: "destructive" });
      return;
    }
    toast({
      title: "İstek alındı",
      description: "Bu e-posta kayıtlıysa sıfırlama bağlantısı gönderilecek.",
    });
  };

  return (
    <GateCardFrame>
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Admin Giriş</CardTitle>
          <CardDescription>Kayıtlara erişmek için yetkili hesabınızla giriş yapın.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <Input
              type="email"
              placeholder="E-posta"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
            <Input
              type="password"
              placeholder="Şifre"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
            <Button type="submit" disabled={authLoading} className="w-full">
              {authLoading ? "Giriş yapılıyor..." : "Giriş Yap"}
            </Button>
            <button
              type="button"
              onClick={() => void handlePasswordReset()}
              disabled={resetLoading}
              className="w-full text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline disabled:opacity-60"
            >
              {resetLoading ? "Gönderiliyor..." : "Şifremi unuttum"}
            </button>
          </form>
        </CardContent>
      </Card>
    </GateCardFrame>
  );
};

const AdminDeniedCard = ({ access }: { access: AdminAccessState }) => (
  <GateCardFrame>
    <Card className="w-full max-w-lg">
      <CardHeader>
        <CardTitle>Bu hesabın yönetici yetkisi bulunmuyor</CardTitle>
        <CardDescription>
          Yönetici erişimi kullanıcı rol atamaları ve güvenli is_admin() kontrolü üzerinden
          doğrulanır. Yetkiniz olduğunu düşünüyorsanız sistem yöneticisiyle iletişime geçin.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg border border-border bg-muted/40 p-4 text-sm text-muted-foreground">
          Giriş yapan kullanıcı:{" "}
          <span className="font-medium text-foreground">{access.session?.user.email}</span>
        </div>
        <Button variant="outline" onClick={() => void access.logout()}>
          Çıkış Yap
        </Button>
      </CardContent>
    </Card>
  </GateCardFrame>
);

const AdminAccessErrorCard = ({ access }: { access: AdminAccessState }) => (
  <GateCardFrame>
    <Card className="w-full max-w-lg">
      <CardHeader>
        <CardTitle>Yetki kontrolü başarısız</CardTitle>
        <CardDescription>
          Yetki doğrulaması sırasında bir sorun oluştu. Tekrar deneyin; sorun sürerse sistem
          yöneticisiyle iletişime geçin.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex gap-3">
        <Button onClick={() => void access.retry()}>Tekrar Dene</Button>
        <Button variant="outline" onClick={() => void access.logout()}>
          Çıkış Yap
        </Button>
      </CardContent>
    </Card>
  </GateCardFrame>
);

const AdminAccessGate = ({ access, children }: AdminAccessGateProps) => {
  switch (access.status) {
    case "loading":
      return <AdminShellLoading message="Oturum yükleniyor..." />;
    case "checking":
      return <AdminShellLoading />;
    case "unauthenticated":
      return <AdminLoginCard access={access} />;
    case "denied":
      return <AdminDeniedCard access={access} />;
    case "error":
      return <AdminAccessErrorCard access={access} />;
    case "authorized":
      return <>{children}</>;
  }
};

export default AdminAccessGate;
