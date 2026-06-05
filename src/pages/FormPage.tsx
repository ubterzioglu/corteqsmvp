import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import heroNetworkLight from "@/assets/hero-network-light.jpg";
import corteqsLogo from "../../newlogo.png";
import { notifySubmission } from "@/lib/mail";
import { useAuth } from "@/components/auth/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useResumePendingOnboarding } from "@/hooks/use-profile-onboarding";
import {
  buildPendingOnboardingPayload,
  finalizeAuthenticatedSubmission,
  loadPendingOnboardingPayload,
  savePendingOnboardingPayload,
} from "@/lib/profile-onboarding-api";
import { normalizePendingFormPayload } from "@/lib/profile-onboarding-normalize";
import { pendingOnboardingFormSchema } from "@/lib/profile-onboarding-schemas";
import SearchableCountrySelect from "@/components/SearchableCountrySelect";
import SearchableCitySelect from "@/components/SearchableCitySelect";
import {
  categoryOptions,
  getReadableErrorMessage,
  getReferralDetailLabel,
  getReferralDetailPlaceholder,
  isReferralDetailRequired,
  referralSourceOptions,
  shouldShowReferralDetail,
} from "@/lib/submissions";

const FormPage = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user, isLoading: isAuthLoading } = useAuth();
  const formRef = useRef<HTMLFormElement>(null);
  const lastResumedKeyRef = useRef<string | null>(null);
  const [oauthSubmitting, setOauthSubmitting] = useState(false);
  const resumePendingOnboarding = useResumePendingOnboarding();

  const [prefilledReferralCode] = useState(() => {
    if (typeof window === "undefined") return "";
    const params = new URLSearchParams(window.location.search);
    return (params.get("referral_code") ?? params.get("ref") ?? "").trim().toUpperCase();
  });
  const [loading, setLoading] = useState(false);
  const [selectedCat, setSelectedCat] = useState("");
  const [consent, setConsent] = useState(false);
  const [phone, setPhone] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [referralCode, setReferralCode] = useState(prefilledReferralCode);
  const [referralSource, setReferralSource] = useState("");
  const [referralDetail, setReferralDetail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [formCountry, setFormCountry] = useState("");
  const [formCity, setFormCity] = useState("");

  useEffect(() => {
    document.dispatchEvent(new Event("render-complete"));
  }, []);

  const buildCurrentPendingFormValues = () => {
    const formData = formRef.current ? new FormData(formRef.current) : new FormData();
    const values = Object.fromEntries(formData.entries());

    return pendingOnboardingFormSchema.parse({
      category: selectedCat || String(values.category ?? ""),
      fullname: String(values.fullname ?? ""),
      country: String(values.country ?? ""),
      city: String(values.city ?? ""),
      business: String(values.business ?? ""),
      field: String(values.field ?? ""),
      email: String(values.email ?? ""),
      phone,
      description: String(values.description ?? ""),
      offers_needs: String(values.offers_needs ?? ""),
      company_name: String(values.company_name ?? ""),
      donor_type: String(values.donor_type ?? ""),
      donation_amount: String(values.donation_amount ?? ""),
      document_url: String(values.document_url ?? ""),
      document_name: String(values.document_name ?? ""),
      referral_source: referralSource,
      referral_detail: referralDetail,
      referral_code: referralCode,
      linkedin: String(values.linkedin ?? ""),
      instagram: String(values.instagram ?? ""),
      tiktok: String(values.tiktok ?? ""),
      facebook: String(values.facebook ?? ""),
      twitter: String(values.twitter ?? ""),
      website: String(values.website ?? ""),
      contest_interest:
        values.contest_interest === "yes" ||
        values.contest_interest === "on" ||
        values.contest_interest === true,
      whatsapp_interest:
        values.whatsapp_interest === "yes" ||
        values.whatsapp_interest === "on" ||
        values.whatsapp_interest === true,
      consent,
    });
  };

  const applyPendingPayloadToForm = (payload: ReturnType<typeof loadPendingOnboardingPayload>) => {
    if (!payload || !formRef.current) return;

    const values = payload.form;
    const assignInputValue = (name: string, nextValue: string) => {
      const element = formRef.current?.elements.namedItem(name) as
        | HTMLInputElement
        | HTMLSelectElement
        | null;
      if (element && element.type !== "radio") {
        element.value = nextValue;
      }
    };

    assignInputValue("category", values.category);
    assignInputValue("fullname", values.fullname);
    setFormCountry(values.country);
    setFormCity(values.city);
    assignInputValue("business", values.business);
    assignInputValue("field", values.field);
    assignInputValue("email", values.email);
    assignInputValue("description", values.description);
    assignInputValue("offers_needs", values.offers_needs);
    assignInputValue("company_name", values.company_name);
    assignInputValue("donor_type", values.donor_type);
    assignInputValue("donation_amount", values.donation_amount);
    assignInputValue("document_url", values.document_url);
    assignInputValue("document_name", values.document_name);
    assignInputValue("linkedin", values.linkedin);
    assignInputValue("instagram", values.instagram);
    assignInputValue("tiktok", values.tiktok);
    assignInputValue("facebook", values.facebook);
    assignInputValue("twitter", values.twitter);
    assignInputValue("website", values.website);

    const contestInterest = formRef.current.elements.namedItem("contest_interest") as HTMLInputElement | null;
    if (contestInterest) contestInterest.checked = values.contest_interest;

    const whatsappInterest = formRef.current.elements.namedItem("whatsapp_interest") as HTMLInputElement | null;
    if (whatsappInterest) whatsappInterest.checked = values.whatsapp_interest;

    setSelectedCat(values.category);
    setPhone(values.phone);
    setReferralSource(values.referral_source);
    setReferralDetail(values.referral_detail);
    setReferralCode(values.referral_code || prefilledReferralCode);
    setConsent(values.consent);
  };

  // Restore state from versioned onboarding storage
  useEffect(() => {
    applyPendingPayloadToForm(loadPendingOnboardingPayload());
  }, [prefilledReferralCode]);

  // Pre-fill user data
  useEffect(() => {
    if (user && formRef.current) {
      const fullnameEl = formRef.current.elements.namedItem("fullname") as HTMLInputElement;
      const emailEl = formRef.current.elements.namedItem("email") as HTMLInputElement;
      if (fullnameEl && !fullnameEl.value && user.user_metadata?.full_name) {
        fullnameEl.value = user.user_metadata.full_name;
      }
      if (emailEl && !emailEl.value && user.email) {
        emailEl.value = user.email;
      }
    }
  }, [user]);

  const validatePhone = (value: string) => {
    const cleaned = value.replace(/[\s\-().]/g, "");
    const e164 = /^\+[1-9]\d{7,14}$/;
    return e164.test(cleaned);
  };

  useEffect(() => {
    if (isAuthLoading || !user) return;

    const pendingPayload = loadPendingOnboardingPayload();
    if (!pendingPayload) return;

    try {
      normalizePendingFormPayload(pendingPayload);
    } catch {
      applyPendingPayloadToForm(pendingPayload);
      return;
    }

    if (lastResumedKeyRef.current === pendingPayload.onboardingKey || resumePendingOnboarding.isPending) {
      return;
    }

    lastResumedKeyRef.current = pendingPayload.onboardingKey;

    resumePendingOnboarding.mutate(undefined, {
      onSuccess: async (result) => {
        if (!result) return;

        try {
          if (result.submissionId) {
            await notifySubmission(result.submissionId);
          }
        } catch (notificationError) {
          console.error("Mail notification error:", notificationError);
        }

        toast({
          title: result.duplicate ? "Kaydınız zaten tamamlanmış" : "Kaydınız Alındı! ✅",
          description: result.duplicate
            ? "Bekleyen kayıt tekrar bulundu ve yeni kopya oluşturulmadı."
            : "Auth dönüşünden sonra başvurunuz güvenli şekilde tamamlandı.",
        });

        setSubmitted(true);
        setConsent(false);
        setPhone("");
        setPhoneError("");
        setReferralCode(prefilledReferralCode);
        setReferralSource("");
        setReferralDetail("");
        setSelectedCat("");
      },
      onError: (error) => {
        lastResumedKeyRef.current = null;
        const message = getReadableErrorMessage(
          error,
          "Bekleyen kayıt tamamlanamadı. Form verileri korunuyor, lütfen tekrar deneyin.",
        );
        toast({
          title: "Bekleyen kayıt tamamlanamadı",
          description: message,
          variant: "destructive",
        });
      },
    });
  }, [
    applyPendingPayloadToForm,
    isAuthLoading,
    prefilledReferralCode,
    resumePendingOnboarding,
    toast,
    user,
  ]);

  const handleGoogleSignIn = async () => {
    const pendingPayload = buildPendingOnboardingPayload({
      form: buildCurrentPendingFormValues(),
    });
    savePendingOnboardingPayload(pendingPayload);

    setOauthSubmitting(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin + "/form",
      },
    });

    if (error) {
      toast({
        title: "Google ile giriş yapılamadı",
        description: error.message,
        variant: "destructive",
      });
      setOauthSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validatePhone(phone)) {
      setPhoneError("Telefon ülke kodu ile başlamalı (örn: +49 170 1234567).");
      return;
    }
    setPhoneError("");

    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const pendingPayload = buildPendingOnboardingPayload({
      form: buildCurrentPendingFormValues(),
    });
    savePendingOnboardingPayload(pendingPayload);

    // User Signup Logic if not authenticated
    if (!user) {
      const emailStr = String(formData.get("email") ?? "").trim();
      const passwordStr = String(formData.get("password") ?? "");

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: emailStr,
        password: passwordStr,
        options: {
          data: {
            full_name: String(formData.get("fullname") ?? ""),
          },
        },
      });

      if (authError) {
        if (
          authError.message.toLowerCase().includes("already registered") || 
          (authError.status === 400 && authError.message.includes("already registered")) ||
          authError.message.includes("User already registered")
        ) {
          toast({
            title: "Bu e-posta adresi kullanımda",
            description: "Bu e-posta adresiyle bir hesap zaten var. Lütfen giriş yapın.",
            variant: "destructive",
          });
          navigate("/login?next=/form");
        } else {
          toast({
            title: "Kayıt Hatası",
            description: authError.message,
            variant: "destructive",
          });
        }
        setLoading(false);
        return;
      }

      if (!authData.session) {
        toast({
          title: "E-posta doğrulaması bekleniyor",
          description: "Form verileriniz kaydedildi. E-postanızı doğrulayıp giriş yaptığınızda başvurunuz tamamlanacak.",
        });
        setLoading(false);
        navigate("/login?next=/form");
        return;
      }
    }

    try {
      const finalized = await finalizeAuthenticatedSubmission(pendingPayload);

      try {
        if (finalized.submissionId) {
          await notifySubmission(finalized.submissionId);
        }
      } catch (notificationError) {
        console.error("Mail notification error:", notificationError);
      }

      toast({
        title: finalized.duplicate ? "Kaydınız zaten tamamlanmış" : "Kaydınız Alındı! ✅",
        description: finalized.duplicate
          ? "Bu pending kayıt daha önce işlenmişti; yeni kopya oluşturulmadı."
          : "Teşekkürler! Platform açıldığında sizinle iletişime geçeceğiz.",
      });

      setSubmitted(true);
      setConsent(false);
      setPhone("");
      setPhoneError("");
      setReferralCode(prefilledReferralCode);
      setReferralSource("");
      setReferralDetail("");
      setSelectedCat("");
    } catch (err: unknown) {
      console.error("Submission error:", err);
      const message = getReadableErrorMessage(err, "Lütfen tekrar deneyin veya info@corteqs.net adresine yazın.");
      toast({
        title: "Bir hata oluştu",
        description: message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex flex-col">
        <div className="relative h-60 overflow-hidden sm:h-64 md:h-72">
          <img src={heroNetworkLight} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background/95" />
          <div className="absolute bottom-0 left-0 right-0 mx-auto max-w-2xl px-6 pb-8 pt-12 sm:pb-10 md:pt-16">
            <Link to="/">
              <img src={corteqsLogo} alt="CorteQS Logo" className="mb-4 h-14 w-auto sm:h-16" />
            </Link>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center max-w-2xl mx-auto w-full px-4 py-12">
          <div className="text-center space-y-4">
            <div className="text-6xl">🎉</div>
            <h1 className="text-3xl font-bold text-foreground">Kaydınız Alındı!</h1>
            <p className="text-muted-foreground text-lg">
              Teşekkürler! Platform açıldığında sizinle iletişime geçeceğiz.
            </p>
            <Link
              to="/"
              className="inline-block mt-6 px-8 py-3 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors"
            >
              Ana Sayfaya Dön
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <div className="relative h-60 overflow-hidden sm:h-64 md:h-72">
        <img src={heroNetworkLight} alt="" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background/95" />
        <div className="absolute bottom-0 left-0 right-0 mx-auto max-w-2xl px-6 pb-8 pt-12 text-center sm:pb-10 md:pt-16">
          <Link to="/" className="inline-flex justify-center">
            <img src={corteqsLogo} alt="CorteQS Logo" className="mb-5 h-20 w-auto sm:h-24 md:h-28" />
          </Link>
          <h1 className="text-foreground text-2xl font-bold">İlginizi Kaydedin</h1>
          <p className="mt-1 text-muted-foreground">
            🚀 Yakında açılıyoruz! İlk erişim için bilgilerinizi bırakın.
          </p>
          <div className="mt-4 flex justify-center">
            <Link
              to="/aiform"
              className="inline-flex items-center gap-2 rounded-xl border border-primary/30 bg-background/85 px-4 py-2.5 text-sm font-semibold text-primary shadow-sm transition-all hover:border-primary hover:bg-primary/5"
            >
              Yapay Zeka Destekli Asistan ile kaydol
            </Link>
          </div>
        </div>
      </div>

      <div className="flex-1 max-w-2xl mx-auto w-full px-4 py-10 sm:py-12">
        <form ref={formRef} onSubmit={handleSubmit} className="space-y-5">
          
          <div className="mb-6 space-y-4">
            {!user ? (
              <>
                <Button 
                  type="button" 
                  variant="outline" 
                  className="w-full flex gap-2 items-center justify-center bg-white text-black hover:bg-gray-50 hover:text-black border-gray-300"
                  onClick={handleGoogleSignIn}
                  disabled={oauthSubmitting || loading || isAuthLoading}
                >
                  <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
                    <path d="M12.0003 4.75C13.7703 4.75 15.3553 5.36 16.6053 6.54998L20.0303 3.125C17.9502 1.19 15.2353 0 12.0003 0C7.31028 0 3.25527 2.69 1.28027 6.60998L5.27028 9.70498C6.21525 6.86 8.87028 4.75 12.0003 4.75Z" fill="#EA4335" />
                    <path d="M23.49 12.275C23.49 11.49 23.415 10.73 23.3 10H12V14.51H18.47C18.18 15.99 17.34 17.25 16.08 18.1L19.945 21.1C22.2 19.01 23.49 15.92 23.49 12.275Z" fill="#4285F4" />
                    <path d="M5.26498 14.2949C5.02498 13.5699 4.88501 12.7999 4.88501 11.9999C4.88501 11.1999 5.01998 10.4299 5.26498 9.7049L1.275 6.60986C0.46 8.22986 0 10.0599 0 11.9999C0 13.9399 0.46 15.7699 1.28 17.3899L5.26498 14.2949Z" fill="#FBBC05" />
                    <path d="M12.0004 24.0001C15.2404 24.0001 17.9654 22.935 19.9454 21.095L16.0804 18.095C15.0054 18.82 13.6204 19.245 12.0004 19.245C8.8704 19.245 6.21537 17.135 5.26538 14.29L1.27539 17.385C3.25539 21.31 7.3104 24.0001 12.0004 24.0001Z" fill="#34A853" />
                  </svg>
                  {oauthSubmitting ? "Yönlendiriliyor..." : "Google ile Hızlı Kayıt Ol"}
                </Button>
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">veya Standart Kayıt</span>
                  </div>
                </div>
              </>
            ) : (
              <div className="p-4 rounded-xl bg-primary/10 border border-primary/20 text-center">
                <p className="text-sm font-medium">Merhaba {user.user_metadata?.full_name || "Kullanıcı"},</p>
                <p className="text-xs text-muted-foreground">Auth tamamlandıktan sonra form tek seferde finalize edilir.</p>
              </div>
            )}
          </div>

          <div>
            <Label htmlFor="category">Kategori / İlgi Alanı</Label>
            <select
              id="category"
              name="category"
              value={selectedCat}
              onChange={(e) => setSelectedCat(e.target.value)}
              required
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <option value="" disabled>Seçiniz...</option>
              {categoryOptions
                .filter((cat) => cat.value !== "support")
                .map((cat) => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
            </select>

            {selectedCat === "blogger-vlogger" && (
              <div className="mt-3 p-3 rounded-lg bg-accent/10 border border-accent/20">
                <p className="text-sm font-semibold text-foreground mb-1">🏆 Ödüllü Blog Yazısı Yarışmamız Başlıyor!</p>
                <p className="text-xs text-muted-foreground mb-2">Diaspora deneyiminizi anlatan en iyi blog yazısını yazın, ödülleri kazanın.</p>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" name="contest_interest" value="yes" className="rounded border-input" />
                  <span className="text-sm text-foreground">Yarışma ile ilgili bilgi istiyorum</span>
                </label>
              </div>
            )}
          </div>

          <div>
            <Label htmlFor="fullname">Ad Soyad</Label>
            <Input id="fullname" name="fullname" placeholder="Adınız Soyadınız" required />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="country">Ülke</Label>
              <SearchableCountrySelect
                value={formCountry}
                onChange={(v) => { setFormCountry(v); setFormCity(""); }}
                placeholder="Almanya"
                name="country"
                id="country"
              />
            </div>
            <div>
              <Label htmlFor="city">Şehir</Label>
              <SearchableCitySelect
                value={formCity}
                onChange={setFormCity}
                countryName={formCountry}
                placeholder="Berlin"
                name="city"
                id="city"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="business">İşletme / Kuruluş (opsiyonel)</Label>
            <Input id="business" name="business" placeholder="Şirket veya kuruluş adı" />
          </div>

          <div>
            <Label htmlFor="field">İştigal / İlgi Sahası</Label>
            <Input id="field" name="field" placeholder="Faaliyet veya ilgi alanınız" required />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label htmlFor="email">E-posta</Label>
              <Input 
                id="email" 
                name="email" 
                type="email" 
                placeholder="ornek@mail.com" 
                required 
                readOnly={!!user}
                className={user ? "bg-muted text-muted-foreground" : ""}
              />
            </div>
            <div>
              <Label htmlFor="phone">Telefon (ülke kodu ile)</Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                inputMode="tel"
                placeholder="+49 170 1234567"
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value);
                  if (phoneError) setPhoneError("");
                }}
                pattern="^\+[1-9][0-9\s\-().]{7,20}$"
                title="Telefon ülke kodu ile başlamalı (örn: +49 170 1234567)"
                required
                aria-invalid={!!phoneError}
              />
              {phoneError ? (
                <p className="text-xs text-destructive mt-1">{phoneError}</p>
              ) : (
                <p className="text-xs text-muted-foreground mt-1">+ ile başlatın, ülke kodu zorunlu.</p>
              )}
            </div>
          </div>

          {!user && (
            <div>
              <Label htmlFor="password">Şifre Belirleyin</Label>
              <Input 
                id="password" 
                name="password" 
                type="password" 
                placeholder="Hesabınız için şifre girin" 
                required 
              />
              <p className="text-xs text-muted-foreground mt-1">Platform açıldığında giriş yapmak için kullanacaksınız.</p>
            </div>
          )}

          <div className="space-y-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <Label htmlFor="referral_source">Bizi nereden buldunuz?</Label>
                <select
                  id="referral_source"
                  name="referral_source"
                  value={referralSource}
                  onChange={(event) => {
                    setReferralSource(event.target.value);
                    setReferralDetail("");
                  }}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="">Seçiniz...</option>
                  {referralSourceOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="referral_code">Referral Kodu (opsiyonel)</Label>
                <Input
                  id="referral_code"
                  name="referral_code"
                  placeholder="Admin / davet kodu"
                  maxLength={32}
                  className="uppercase"
                  value={referralCode}
                  onChange={(event) => setReferralCode(event.target.value.toUpperCase())}
                  readOnly={Boolean(prefilledReferralCode)}
                />
                {prefilledReferralCode ? (
                  <p className="mt-1 text-xs font-medium text-emerald-600">🎁 Bu link için referral kodu otomatik uygulandı.</p>
                ) : (
                  <p className="mt-1 text-xs text-muted-foreground">Sizi yönlendiren admin veya davet kodunu girebilirsiniz.</p>
                )}
              </div>
            </div>

            {shouldShowReferralDetail(referralSource) && (
              <div>
                <Label htmlFor="referral_detail">{getReferralDetailLabel(referralSource)}</Label>
                <Input
                  id="referral_detail"
                  name="referral_detail"
                  value={referralDetail}
                  onChange={(event) => setReferralDetail(event.target.value)}
                  placeholder={getReferralDetailPlaceholder(referralSource)}
                  maxLength={120}
                  required={isReferralDetailRequired(referralSource)}
                />
              </div>
            )}
          </div>

          {selectedCat === "sehir-elcisi" && (
            <div className="space-y-3 p-4 rounded-xl bg-primary/5 border border-primary/15">
              <p className="text-sm font-semibold text-foreground">📱 Sosyal Medya Hesaplarınız</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="linkedin" className="text-xs">LinkedIn</Label>
                  <Input id="linkedin" name="linkedin" placeholder="linkedin.com/in/..." />
                </div>
                <div>
                  <Label htmlFor="instagram" className="text-xs">Instagram</Label>
                  <Input id="instagram" name="instagram" placeholder="@kullaniciadi" />
                </div>
                <div>
                  <Label htmlFor="tiktok" className="text-xs">TikTok</Label>
                  <Input id="tiktok" name="tiktok" placeholder="@kullaniciadi" />
                </div>
                <div>
                  <Label htmlFor="facebook" className="text-xs">Facebook</Label>
                  <Input id="facebook" name="facebook" placeholder="facebook.com/..." />
                </div>
                <div>
                  <Label htmlFor="twitter" className="text-xs">X (Twitter)</Label>
                  <Input id="twitter" name="twitter" placeholder="@kullaniciadi" />
                </div>
                <div>
                  <Label htmlFor="website" className="text-xs">Web Sitesi</Label>
                  <Input id="website" name="website" type="url" placeholder="https://..." />
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center justify-center gap-2 p-3 rounded-lg bg-primary/5 border border-primary/15">
            <span className="text-lg">✉️</span>
            <a href="mailto:info@corteqs.net" className="text-primary font-semibold hover:underline">
              info@corteqs.net
            </a>
          </div>

          <div className="p-3 rounded-lg bg-accent/5 border border-accent/15 text-sm text-muted-foreground">
            ⏳ <strong className="text-foreground">Yakında!</strong> Platform açılır açılmaz size ilk haber vereceğiz. Erken kayıt avantajlarından yararlanın.
          </div>

          <label className="flex items-start gap-2 p-3 rounded-lg bg-[#25D366]/5 border border-[#25D366]/30 cursor-pointer">
            <input
              type="checkbox"
              name="whatsapp_interest"
              value="yes"
              className="mt-1 rounded border-input accent-[#25D366]"
            />
            <span className="text-sm text-foreground leading-relaxed">
              💬 <strong>Kategori WhatsApp grubuna katılmak istiyorum.</strong>{" "}
              <span className="text-muted-foreground">Erken erişim, açılış avantajları ve topluluk duyuruları için davet linki size iletilecek.</span>
            </span>
          </label>

          <div className="flex items-start gap-2">
            <Checkbox
              id="consent"
              checked={consent}
              onCheckedChange={(checked) => setConsent(checked === true)}
              className="mt-0.5"
            />
            <label htmlFor="consent" className="text-xs text-muted-foreground cursor-pointer leading-relaxed">
              Kişisel bilgilerimi, CorteQS tarafından tarafıma ulaşılması amacıyla paylaşıyorum. Bilgilerim üçüncü şahıslarla paylaşılmayacaktır.
            </label>
          </div>

          <button
            type="submit"
            disabled={loading || !consent}
            className="w-full py-3 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Gönderiliyor..." : "Kayıt Bırak / Takip Et"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default FormPage;
