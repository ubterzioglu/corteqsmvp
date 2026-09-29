import { useState } from "react";
import { Link } from "react-router-dom";

import { useSeo } from "@/lib/seo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

// Hesap enumeration'ını önlemek için kayıtlı/kayıtsız tüm adreslerde aynı mesaj gösterilir.
const GENERIC_SUCCESS_MESSAGE =
  "Bu adres kayıtlıysa şifre sıfırlama bağlantısı gönderildi. Gelen kutunuzu ve spam klasörünü kontrol edin.";
const GENERIC_ERROR_MESSAGE = "Sıfırlama isteği alınamadı. Lütfen daha sonra tekrar deneyin.";

const ForgotPasswordPage = () => {
  useSeo({ title: "Şifremi Unuttum | CorteQS", robots: "noindex, follow" });

  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    // Sıfırlama bağlantısı /reset-password ekranına döner; token süreli ve tek kullanımlıktır (Supabase).
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    setSubmitting(false);
    if (error) {
      setErrorMessage(GENERIC_ERROR_MESSAGE);
      return;
    }
    setSuccessMessage(GENERIC_SUCCESS_MESSAGE);
    setEmail("");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Şifremi unuttum</CardTitle>
          <CardDescription>
            Kayıtlı e-posta adresinizi girin; size şifre sıfırlama bağlantısı gönderelim.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {successMessage ? (
            <div className="space-y-4">
              <p className="text-sm text-emerald-700">{successMessage}</p>
              <Button asChild variant="outline" className="w-full">
                <Link to="/login">Giriş ekranına dön</Link>
              </Button>
            </div>
          ) : (
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label htmlFor="forgot-email">E-posta</Label>
                <Input
                  id="forgot-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="ornek@corteqs.net"
                  disabled={submitting}
                  required
                />
              </div>

              {errorMessage ? <p className="text-sm text-destructive">{errorMessage}</p> : null}

              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? "Gönderiliyor..." : "Sıfırlama bağlantısı gönder"}
              </Button>
              <Button asChild type="button" variant="ghost" className="w-full" disabled={submitting}>
                <Link to="/login">Giriş ekranına dön</Link>
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ForgotPasswordPage;
