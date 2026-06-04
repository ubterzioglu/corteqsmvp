import { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";

import { useAuth } from "@/components/auth/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import {
  useActivateCurrentOnboardingProfile,
  useCurrentOnboardingActivation,
  useResendCurrentOnboardingActivationLink,
} from "@/hooks/use-profile-onboarding";
import { getReferralSourceOptions } from "@/lib/profile-onboarding-normalize";

const WelcomeActivatePage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, isLoading: isAuthLoading } = useAuth();
  const { data, isLoading, error } = useCurrentOnboardingActivation(Boolean(user));
  const activateMutation = useActivateCurrentOnboardingProfile();
  const resendMutation = useResendCurrentOnboardingActivationLink();

  const [fullName, setFullName] = useState("");
  const [country, setCountry] = useState("");
  const [city, setCity] = useState("");
  const [businessOrOrganization, setBusinessOrOrganization] = useState("");
  const [interestFocus, setInterestFocus] = useState("");
  const [businessVisibility, setBusinessVisibility] = useState<"public" | "private">("public");
  const [interestVisibility, setInterestVisibility] = useState<"public" | "private">("public");
  const [referralCode, setReferralCode] = useState("");
  const [referralSource, setReferralSource] = useState("");

  useEffect(() => {
    if (!data) return;
    setFullName(data.submission.fullname);
    setCountry(data.submission.country);
    setCity(data.submission.city);
    setBusinessOrOrganization(data.submission.business);
    setInterestFocus(data.submission.field);
    setReferralCode(data.submission.referralCode);
    setReferralSource(data.submission.referralSource);
  }, [data]);

  if (!isAuthLoading && !user) {
    return <Navigate to="/login?next=/welcome/activate" replace />;
  }

  const handleActivate = async () => {
    try {
      await activateMutation.mutateAsync({
        fullName,
        country,
        city,
        businessOrOrganization,
        interestFocus,
        businessVisibility,
        interestVisibility,
        referralCode,
        referralSource,
      });

      toast({
        title: "Profil aktivasyonu tamamlandı",
        description: "Taslak profilin etkinleştirildi. Şimdi profil sayfana yönlendiriliyorsun.",
      });
      navigate("/profile/bireysel", { replace: true });
    } catch (mutationError) {
      const message =
        mutationError instanceof Error ? mutationError.message : "Aktivasyon tamamlanamadı.";
      toast({
        title: "Aktivasyon başarısız",
        description: message,
        variant: "destructive",
      });
    }
  };

  const handleResend = async () => {
    try {
      await resendMutation.mutateAsync(data?.submission.email ?? user?.email ?? "");
      toast({
        title: "Yeni giriş linki gönderildi",
        description: "E-posta kutunu kontrol edip aynı aktivasyon ekranına dönebilirsin.",
      });
    } catch (mutationError) {
      const message =
        mutationError instanceof Error ? mutationError.message : "Link yeniden gönderilemedi.";
      toast({
        title: "Link gönderilemedi",
        description: message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="mx-auto flex min-h-[70vh] w-full max-w-3xl items-center justify-center px-4 py-12">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Profil Aktivasyonu</CardTitle>
          <CardDescription>
            Daha önce bıraktığın CorteQS formundan güvenli bir taslak oluşturduk. Son kez gözden geçirip profilini aktive edebilirsin.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {isAuthLoading || isLoading ? (
            <p className="text-sm text-muted-foreground">Aktivasyon verisi yükleniyor...</p>
          ) : null}

          {!isLoading && error ? (
            <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
              Aktivasyon verisi alınamadı: {error instanceof Error ? error.message : "Bilinmeyen hata"}
            </div>
          ) : null}

          {!isLoading && !error && !data ? (
            <div className="space-y-3 rounded-xl border border-border bg-muted/40 p-4">
              <p className="text-sm text-muted-foreground">
                Bu hesap için bekleyen bir onboarding taslağı bulunamadı. Eğer davet linkinin süresi dolduysa yeni giriş linki isteyebilirsin.
              </p>
              <Button type="button" variant="outline" onClick={() => void handleResend()} disabled={resendMutation.isPending}>
                {resendMutation.isPending ? "Gönderiliyor..." : "Yeni Giriş Linki Gönder"}
              </Button>
            </div>
          ) : null}

          {data ? (
            <>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="activation-full-name">Ad Soyad</Label>
                  <Input
                    id="activation-full-name"
                    value={fullName}
                    onChange={(event) => setFullName(event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="activation-email">E-posta</Label>
                  <Input id="activation-email" value={data.submission.email} readOnly className="bg-muted" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="activation-country">Ülke</Label>
                  <Input
                    id="activation-country"
                    value={country}
                    onChange={(event) => setCountry(event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="activation-city">Şehir</Label>
                  <Input
                    id="activation-city"
                    value={city}
                    onChange={(event) => setCity(event.target.value)}
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="activation-business">İşletme / Kuruluş</Label>
                  <Input
                    id="activation-business"
                    value={businessOrOrganization}
                    onChange={(event) => setBusinessOrOrganization(event.target.value)}
                    placeholder="Varsa kuruluş veya şirket adı"
                  />
                  <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
                    <span className="text-xs text-muted-foreground">Public profilde göster</span>
                    <Switch
                      checked={businessVisibility === "public"}
                      onCheckedChange={(checked) => setBusinessVisibility(checked ? "public" : "private")}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="activation-interest">İştigal / İlgi Sahası</Label>
                  <Input
                    id="activation-interest"
                    value={interestFocus}
                    onChange={(event) => setInterestFocus(event.target.value)}
                  />
                  <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
                    <span className="text-xs text-muted-foreground">Public profilde göster</span>
                    <Switch
                      checked={interestVisibility === "public"}
                      onCheckedChange={(checked) => setInterestVisibility(checked ? "public" : "private")}
                    />
                  </div>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="activation-referral-code">Referral Kodu</Label>
                  <Input
                    id="activation-referral-code"
                    value={referralCode}
                    onChange={(event) => setReferralCode(event.target.value.toUpperCase())}
                    placeholder="Opsiyonel"
                  />
                  <p className="text-xs text-muted-foreground">Bu alan backend tarafından her durumda private tutulur.</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="activation-referral-source">Bizi nereden buldunuz?</Label>
                  <Select value={referralSource || "__empty__"} onValueChange={(value) => setReferralSource(value === "__empty__" ? "" : value)}>
                    <SelectTrigger id="activation-referral-source">
                      <SelectValue placeholder="Seçiniz..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__empty__">Seçiniz...</SelectItem>
                      {getReferralSourceOptions().map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">Bu alan backend tarafından her durumda private tutulur.</p>
                </div>
              </div>

              <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm text-muted-foreground">
                Profilin sen onay verene kadar public hale gelmez. Aktivasyon sonrası istediğin alanları profil ekranından tekrar düzenleyebilirsin.
              </div>

              <div className="flex flex-wrap gap-3">
                <Button type="button" onClick={() => void handleActivate()} disabled={activateMutation.isPending}>
                  {activateMutation.isPending ? "Aktive ediliyor..." : "Profili Aktive Et"}
                </Button>
                <Button type="button" variant="outline" onClick={() => void handleResend()} disabled={resendMutation.isPending}>
                  {resendMutation.isPending ? "Gönderiliyor..." : "Linki Yeniden Gönder"}
                </Button>
              </div>
            </>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
};

export default WelcomeActivatePage;
