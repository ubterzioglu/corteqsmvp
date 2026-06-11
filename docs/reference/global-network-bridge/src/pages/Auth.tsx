import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { LogIn, UserPlus, Mail, Lock, User } from "lucide-react";
import ConsentCheckboxes, { emptyConsent, isConsentValid, type ConsentState } from "@/components/ConsentCheckboxes";

const Auth = () => {
  const { user, onboardingCompleted } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  const [signupFirstName, setSignupFirstName] = useState("");
  const [signupLastName, setSignupLastName] = useState("");
  const [signupBirthDate, setSignupBirthDate] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");

  const [resetEmail, setResetEmail] = useState("");
  const [showReset, setShowReset] = useState(false);
  const [consent, setConsent] = useState<ConsentState>(emptyConsent);

  useEffect(() => {
    if (user) {
      if (!onboardingCompleted) {
        navigate("/onboarding");
      } else {
        navigate("/profile");
      }
    }
  }, [user, onboardingCompleted, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: loginEmail,
      password: loginPassword,
    });
    setLoading(false);
    if (error) {
      toast({ title: "Giriş başarısız", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Hoş geldiniz! 👋" });
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signupFirstName.trim() || !signupLastName.trim() || !signupBirthDate) {
      toast({
        title: "Eksik bilgi",
        description: "İsim, soyisim ve doğum tarihi zorunludur.",
        variant: "destructive",
      });
      return;
    }
    if (!isConsentValid(consent)) {
      toast({
        title: "Onay gerekli",
        description: "Devam etmek için Gizlilik Politikası, Kullanım Şartları ve KVKK/GDPR onaylarını işaretleyin.",
        variant: "destructive",
      });
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: signupEmail,
      password: signupPassword,
      options: {
        data: {
          full_name: `${signupFirstName.trim()} ${signupLastName.trim()}`,
          first_name: signupFirstName.trim(),
          last_name: signupLastName.trim(),
          birth_date: signupBirthDate,
          consent_privacy: consent.privacy,
          consent_terms: consent.terms,
          consent_data_processing: consent.dataProcessing,
          consent_marketing: consent.marketing,
          consent_timestamp: new Date().toISOString(),
        },
        emailRedirectTo: window.location.origin,
      },
    });
    setLoading(false);
    if (error) {
      toast({ title: "Kayıt başarısız", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Kayıt başarılı! ✉️", description: "Lütfen e-posta adresinizi doğrulayın." });
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) {
      toast({ title: "Hata", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "E-posta gönderildi! 📧", description: "Şifre sıfırlama bağlantısı e-posta adresinize gönderildi." });
      setShowReset(false);
    }
  };

  const handleGoogle = async () => {
    setLoading(true);
    const { lovable } = await import("@/integrations/lovable/index");
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      setLoading(false);
      toast({ title: "Google girişi başarısız", description: String(result.error), variant: "destructive" });
      return;
    }
    if (result.redirected) return;
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-md">
          <Card className="border-border shadow-lg">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-extrabold">🌍 CorteQS</CardTitle>
              <CardDescription>Diaspora ağınıza katılın</CardDescription>
            </CardHeader>
            <CardContent>
              {showReset ? (
                <form onSubmit={handleReset} className="space-y-4">
                  <div className="space-y-2">
                    <Label>E-posta</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input className="pl-9" type="email" placeholder="ornek@email.com" value={resetEmail} onChange={e => setResetEmail(e.target.value)} required />
                    </div>
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Gönderiliyor..." : "Şifre Sıfırlama Bağlantısı Gönder"}
                  </Button>
                  <Button type="button" variant="ghost" className="w-full text-sm" onClick={() => setShowReset(false)}>
                    ← Giriş'e dön
                  </Button>
                </form>
              ) : (
                <Tabs defaultValue="login">
                  <TabsList className="w-full">
                    <TabsTrigger value="login" className="flex-1 gap-1.5"><LogIn className="h-3.5 w-3.5" /> Giriş</TabsTrigger>
                    <TabsTrigger value="signup" className="flex-1 gap-1.5"><UserPlus className="h-3.5 w-3.5" /> Kayıt Ol</TabsTrigger>
                  </TabsList>

                  <div className="mt-4 space-y-2">
                    <Button type="button" variant="outline" className="w-full gap-2" disabled={loading} onClick={handleGoogle}>
                      <img src="https://www.google.com/favicon.ico" alt="" className="h-4 w-4" />
                      Google ile devam et
                    </Button>
                    <div className="relative my-2">
                      <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border" /></div>
                      <div className="relative flex justify-center text-[11px] uppercase"><span className="bg-card px-2 text-muted-foreground">veya</span></div>
                    </div>
                  </div>

                  <TabsContent value="login">
                    <form onSubmit={handleLogin} className="space-y-4 mt-4">
                      <div className="space-y-2">
                        <Label>E-posta</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input className="pl-9" type="email" placeholder="ornek@email.com" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} required />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Şifre</Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input className="pl-9" type="password" placeholder="••••••••" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} required />
                        </div>
                      </div>
                      <Button type="submit" className="w-full" disabled={loading}>
                        {loading ? "Giriş yapılıyor..." : "Giriş Yap"}
                      </Button>
                      <Button type="button" variant="link" className="w-full text-xs" onClick={() => setShowReset(true)}>
                        Şifremi unuttum
                      </Button>
                    </form>
                  </TabsContent>

                  <TabsContent value="signup">
                    <form onSubmit={handleSignup} className="space-y-4 mt-4">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label>İsim *</Label>
                          <div className="relative">
                            <User className="h-4 w-4 absolute left-3 top-3 text-muted-foreground" />
                            <Input className="pl-9" placeholder="Adınız" value={signupFirstName} onChange={e => setSignupFirstName(e.target.value)} required maxLength={50} />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label>Soyisim *</Label>
                          <Input placeholder="Soyadınız" value={signupLastName} onChange={e => setSignupLastName(e.target.value)} required maxLength={50} />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Doğum Tarihi *</Label>
                        <Input type="date" value={signupBirthDate} onChange={e => setSignupBirthDate(e.target.value)} required max={new Date().toISOString().split("T")[0]} />
                      </div>
                      <div className="space-y-2">
                        <Label>E-posta</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input className="pl-9" type="email" placeholder="ornek@email.com" value={signupEmail} onChange={e => setSignupEmail(e.target.value)} required />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Şifre</Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input className="pl-9" type="password" placeholder="Min. 6 karakter" value={signupPassword} onChange={e => setSignupPassword(e.target.value)} required minLength={6} />
                        </div>
                      </div>
                      <ConsentCheckboxes value={consent} onChange={setConsent} />
                      <Button type="submit" className="w-full" disabled={loading || !isConsentValid(consent)}>
                        {loading ? "Kaydediliyor..." : "Kayıt Ol"}
                      </Button>
                    </form>
                  </TabsContent>
                </Tabs>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Auth;
