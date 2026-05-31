import { useEffect, useMemo, useState } from "react";
import { Navigate, useSearchParams } from "react-router-dom";

import { useAuth } from "@/components/auth/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";

const LoginPage = () => {
  const { session, isLoading } = useAuth();
  const [searchParams] = useSearchParams();
  const [oauthSubmitting, setOauthSubmitting] = useState(false);
  const [passwordSubmitting, setPasswordSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const nextPath = useMemo(() => {
    const rawNext = searchParams.get("next")?.trim();
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

  const handleGoogleSignIn = async () => {
    setOauthSubmitting(true);
    setErrorMessage(null);

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

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      setErrorMessage(error.message);
      setPasswordSubmitting(false);
      return;
    }
  };

  if (!isLoading && session) {
    return <Navigate to={nextPath} replace />;
  }

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>CorteQS Giriş</CardTitle>
          <CardDescription>Google hesabınızla veya Supabase e-posta/şifre bilgilerinizle giriş yapın.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button type="button" className="w-full" onClick={handleGoogleSignIn} disabled={oauthSubmitting || passwordSubmitting || isLoading}>
            {oauthSubmitting ? "Yönlendiriliyor..." : "Google ile giriş yap"}
          </Button>

          <div className="relative">
            <Separator />
            <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-2 text-xs text-muted-foreground">
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
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="ornek@corteqs.net"
                disabled={oauthSubmitting || passwordSubmitting || isLoading}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="login-password">Şifre</Label>
              <Input
                id="login-password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Şifrenizi girin"
                disabled={oauthSubmitting || passwordSubmitting || isLoading}
                required
              />
            </div>

            <Button type="submit" variant="outline" className="w-full" disabled={oauthSubmitting || passwordSubmitting || isLoading}>
              {passwordSubmitting ? "Giriş yapılıyor..." : "E-posta ve şifre ile giriş yap"}
            </Button>
          </form>

          {errorMessage ? <p className="text-sm text-destructive">{errorMessage}</p> : null}
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginPage;

