import { useEffect, useMemo, useState } from "react";
import { Navigate, useSearchParams } from "react-router-dom";
import { ShieldCheck } from "lucide-react";

import { useAuth } from "@/components/auth/useAuth";
import DiasporaNetworkLayer from "@/components/landing/DiasporaNetworkLayer";
import { Button } from "@/components/ui/button";
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";

type AuthMode = "login" | "signup";

const normalizeMode = (value: string | null): AuthMode => (value === "signup" ? "signup" : "login");

const LoginPage = () => {
  const { session, isLoading } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [oauthSubmitting, setOauthSubmitting] = useState(false);
  const [passwordSubmitting, setPasswordSubmitting] = useState(false);
  const [signupSubmitting, setSignupSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [signupSuccessMessage, setSignupSuccessMessage] = useState<string | null>(null);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");

  const mode = useMemo(() => normalizeMode(searchParams.get("mode")), [searchParams]);

  const nextPath = useMemo(() => {
    const rawNext = searchParams.get("next")?.trim() ?? searchParams.get("redirect")?.trim();
    return rawNext?.startsWith("/") ? rawNext : "/profile";
  }, [searchParams]);

  const redirectTo = useMemo(() => {
    const loginUrl = new URL("/login", window.location.origin);
    if (nextPath !== "/profile") {
      loginUrl.searchParams.set("next", nextPath);
    }
    return loginUrl.toString();
  }, [nextPath]);

  useEffect(() => {
    const previousTitle = document.title;
    document.title = "Giriş | CorteQS";

    let metaRobots = document.querySelector('meta[name="robots"]');
    const hadExistingMeta = Boolean(metaRobots);
    const previousRobotsContent = metaRobots?.getAttribute("content");

    if (!metaRobots) {
      metaRobots = document.createElement("meta");
      metaRobots.setAttribute("name", "robots");
      document.head.appendChild(metaRobots);
    }
    metaRobots.setAttribute("content", "noindex, nofollow");

    return () => {
      document.title = previousTitle;
      if (!metaRobots) return;
      if (hadExistingMeta) {
        if (previousRobotsContent) {
          metaRobots.setAttribute("content", previousRobotsContent);
        } else {
          metaRobots.removeAttribute("content");
        }
      } else {
        metaRobots.remove();
      }
    };
  }, []);

  const updateMode = (nextMode: AuthMode) => {
    const params = new URLSearchParams(searchParams);
    params.set("mode", nextMode);
    if (params.has("redirect") && !params.has("next")) {
      params.set("next", params.get("redirect") ?? "");
      params.delete("redirect");
    }
    setSearchParams(params, { replace: true });
    setErrorMessage(null);
    if (nextMode === "login") {
      setSignupSuccessMessage(null);
    }
  };

  const handleGoogleSignIn = async () => {
    setOauthSubmitting(true);
    setErrorMessage(null);
    setSignupSuccessMessage(null);

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo,
      },
    });

    if (error) {
      setErrorMessage(error.message);
      setOauthSubmitting(false);
    }
  };

  const handlePasswordSignIn = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPasswordSubmitting(true);
    setErrorMessage(null);
    setSignupSuccessMessage(null);

    const { error } = await supabase.auth.signInWithPassword({
      email: loginEmail.trim(),
      password: loginPassword,
    });

    if (error) {
      setErrorMessage(error.message);
      setPasswordSubmitting(false);
      return;
    }
  };

  const handlePasswordSignUp = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSignupSubmitting(true);
    setErrorMessage(null);
    setSignupSuccessMessage(null);

    const { error } = await supabase.auth.signUp({
      email: signupEmail.trim(),
      password: signupPassword,
      options: {
        emailRedirectTo: redirectTo,
      },
    });

    if (error) {
      setErrorMessage(error.message);
      setSignupSubmitting(false);
      return;
    }

    setSignupSubmitting(false);
    setSignupSuccessMessage("Doğrulama bağlantısını e-posta adresine gönderdik. E-postanı onayladıktan sonra aynı hesapla giriş yapabilirsin.");
  };

  if (!isLoading && session) {
    return <Navigate to={nextPath} replace />;
  }

  const isBusy = oauthSubmitting || passwordSubmitting || signupSubmitting || isLoading;

  return (
    <div className="grid min-h-screen w-full lg:grid-cols-2">
      {/* ——— SOL PANEL: koyu + renkli marka/branding ——— */}
      <aside className="relative flex min-h-[30vh] flex-col justify-between overflow-hidden bg-[hsl(220_28%_10%)] px-8 py-10 text-white lg:min-h-screen lg:px-12 lg:py-14">
        {/* Marka gradient zemin (teal→turuncu) */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-0"
          style={{
            background:
              "radial-gradient(120% 90% at 12% 8%, hsl(var(--glow-teal) / 0.55), transparent 55%), radial-gradient(120% 90% at 92% 96%, hsl(var(--glow-orange) / 0.5), transparent 52%), linear-gradient(160deg, hsl(220 30% 9%) 0%, hsl(220 32% 12%) 100%)",
          }}
        />
        {/* Canlı diaspora ağ animasyonu (dekoratif) */}
        <DiasporaNetworkLayer className="z-0 opacity-60" />

        <div className="relative z-10 flex items-center gap-3">
          <img src="/logocorteqsbig.png" alt="CorteQS" className="h-9 w-auto" />
        </div>

        <div className="relative z-10 max-w-md">
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-white/55">
            Diaspora ağı
          </p>
          <h1 className="mt-4 font-display text-4xl font-black leading-tight tracking-tight md:text-5xl">
            Diasporanın profesyonel
            <span className="bg-gradient-to-r from-[hsl(var(--glow-teal))] to-[hsl(var(--glow-orange))] bg-clip-text text-transparent">
              {" "}ağına giriş yap
            </span>
          </h1>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/65">
            CorteQS, dünyaya yayılmış Türk diasporasını tek bir ağda buluşturur. Hesabınla
            giriş yap, profilini yönet ve bağlantını sürdür.
          </p>
        </div>

        <div className="relative z-10 inline-flex w-fit items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5 text-xs font-medium text-white/70 backdrop-blur-sm">
          <ShieldCheck className="h-3.5 w-3.5 text-[hsl(var(--glow-teal))]" />
          <span className="uppercase tracking-wider">Güvenli giriş</span>
        </div>
      </aside>

      {/* ——— SAĞ PANEL: açık form ——— */}
      <main className="flex items-center justify-center bg-background px-4 py-12 sm:px-8">
        <div className="w-full max-w-md">
          <CardHeader className="px-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-muted-foreground">
              Üye erişimi
            </p>
            <CardTitle className="font-display text-3xl">CorteQS Hesabı</CardTitle>
            <CardDescription>Google ile devam edin veya Supabase e-posta/şifre akışıyla giriş yapın ya da kayıt olun.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 px-0">
          <Tabs value={mode} onValueChange={(value) => updateMode(normalizeMode(value))}>
            <TabsList className="grid h-auto w-full grid-cols-2 rounded-2xl bg-orange-100/70 p-1.5">
              <TabsTrigger
                value="login"
                className="rounded-xl px-4 py-2.5 text-base font-semibold text-slate-600 data-[state=active]:bg-orange-500 data-[state=active]:text-white data-[state=active]:shadow-[0_10px_24px_rgba(249,115,22,0.35)]"
              >
                Giriş Yap
              </TabsTrigger>
              <TabsTrigger
                value="signup"
                className="rounded-xl px-4 py-2.5 text-base font-semibold text-slate-600 data-[state=active]:bg-orange-500 data-[state=active]:text-white data-[state=active]:shadow-[0_10px_24px_rgba(249,115,22,0.35)]"
              >
                Kayıt Ol
              </TabsTrigger>
            </TabsList>

            <TabsContent value="login" className="space-y-4">
              <Button type="button" className="w-full" onClick={handleGoogleSignIn} disabled={isBusy}>
                {oauthSubmitting ? "Yönlendiriliyor..." : "Google ile giriş yap"}
              </Button>

              <div className="relative">
                <Separator />
                <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-background px-2 text-xs text-muted-foreground">
                  veya
                </span>
              </div>

              <form className="space-y-4" onSubmit={handlePasswordSignIn}>
                <div className="space-y-2">
                  <Label htmlFor="login-email">E-posta</Label>
                  <Input
                    id="login-email"
                    type="email"
                    autoComplete="email"
                    value={loginEmail}
                    onChange={(event) => setLoginEmail(event.target.value)}
                    placeholder="ornek@corteqs.net"
                    disabled={isBusy}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="login-password">Şifre</Label>
                  <Input
                    id="login-password"
                    type="password"
                    autoComplete="current-password"
                    value={loginPassword}
                    onChange={(event) => setLoginPassword(event.target.value)}
                    placeholder="Şifrenizi girin"
                    disabled={isBusy}
                    required
                  />
                </div>

                <Button type="submit" variant="outline" className="w-full" disabled={isBusy}>
                  {passwordSubmitting ? "Giriş yapılıyor..." : "E-posta ve şifre ile giriş yap"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup" className="space-y-4">
              <Button type="button" className="w-full" onClick={handleGoogleSignIn} disabled={isBusy}>
                {oauthSubmitting ? "Yönlendiriliyor..." : "Google ile devam et"}
              </Button>

              <div className="relative">
                <Separator />
                <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-background px-2 text-xs text-muted-foreground">
                  veya
                </span>
              </div>

              <form className="space-y-4" onSubmit={handlePasswordSignUp}>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">E-posta</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    autoComplete="email"
                    value={signupEmail}
                    onChange={(event) => setSignupEmail(event.target.value)}
                    placeholder="ornek@corteqs.net"
                    disabled={isBusy}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-password">Şifre</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    autoComplete="new-password"
                    value={signupPassword}
                    onChange={(event) => setSignupPassword(event.target.value)}
                    placeholder="Şifre oluşturun"
                    disabled={isBusy}
                    required
                  />
                </div>

                <Button type="submit" variant="outline" className="w-full" disabled={isBusy}>
                  {signupSubmitting ? "Kayıt oluşturuluyor..." : "E-posta ve şifre ile kayıt ol"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          {signupSuccessMessage ? <p className="text-sm text-emerald-700">{signupSuccessMessage}</p> : null}
          {errorMessage ? <p className="text-sm text-destructive">{errorMessage}</p> : null}
          </CardContent>
        </div>
      </main>
    </div>
  );
};

export default LoginPage;
