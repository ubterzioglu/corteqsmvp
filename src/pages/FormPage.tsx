import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import heroNetworkLight from "@/assets/hero-network-light.jpg";
import corteqsLogo from "../../newlogo.png";
import { notifySubmission } from "@/lib/mail";
import {
  categoryOptions,
  getReadableErrorMessage,
  getReferralDetailLabel,
  getReferralDetailPlaceholder,
  insertSubmissionWithCompatibility,
  isReferralDetailRequired,
  referralSourceOptions,
  shouldShowReferralDetail,
  toSubmissionInsert,
  validateReferralCodeBeforeSubmit,
} from "@/lib/submissions";

const FormPage = () => {
  const { toast } = useToast();
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

  useEffect(() => {
    document.dispatchEvent(new Event("render-complete"));
  }, []);

  const validatePhone = (value: string) => {
    const cleaned = value.replace(/[\s\-().]/g, "");
    const e164 = /^\+[1-9]\d{7,14}$/;
    return e164.test(cleaned);
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
    const values = Object.fromEntries(formData.entries());
    values.phone = phone.replace(/[\s\-().]/g, "");
    values.referral_source = referralSource;
    values.referral_detail = referralDetail;

    try {
      const payload = toSubmissionInsert(values, "register", consent);
      payload.referral_code = await validateReferralCodeBeforeSubmit(payload.referral_code);
      const inserted = await insertSubmissionWithCompatibility(payload);

      try {
        if (inserted?.id) {
          await notifySubmission(inserted.id);
        }
      } catch (notificationError) {
        console.error("Mail notification error:", notificationError);
      }

      toast({
        title: "Kaydınız Alındı! ✅",
        description: "Teşekkürler! Platform açıldığında sizinle iletişime geçeceğiz.",
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
        <form onSubmit={handleSubmit} className="space-y-5">
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
              <Input id="country" name="country" placeholder="Almanya" required />
            </div>
            <div>
              <Label htmlFor="city">Şehir</Label>
              <Input id="city" name="city" placeholder="Berlin" required />
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

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="email">E-posta</Label>
              <Input id="email" name="email" type="email" placeholder="ornek@mail.com" required />
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
