import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Award, Crown, Sparkles, Mail, Check } from "lucide-react";
import heroNetworkLight from "@/assets/hero-network-light.jpg";
import corteqsLogo from "@/assets/corteqs-logo-globe.png";
import { notifySubmission } from "@/lib/mail";
import SearchableCountrySelect from "@/components/SearchableCountrySelect";
import SearchableCitySelect from "@/components/SearchableCitySelect";
import {
  getReferralDetailLabel,
  getReferralDetailPlaceholder,
  getReadableErrorMessage,
  insertSubmissionWithCompatibility,
  isReferralDetailRequired,
  maxSubmissionDocumentCount,
  referralSourceOptions,
  shouldShowReferralDetail,
  toSubmissionInsert,
  uploadSubmissionDocuments,
  validateReferralCodeBeforeSubmit,
  validateSubmissionDocuments,
} from "@/lib/submissions";

interface BackerFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultTier?: number;
}

type DonorType = "individual" | "company";

type Tier = {
  amount: number;
  label: string;
  icon: typeof Sparkles;
  perks: string[];
  accent: string;
  border: string;
  popular?: boolean;
};

const tiers: Tier[] = [
  {
    amount: 1000,
    label: "Ülke Bazlı Kurucu",
    icon: Award,
    perks: [
      "Ülke bazlı kurucu unvanı",
      "Sosyal medya tanıtımlarında 1 yıl süreyle yer alma",
      "Erken kullanıcı lead'lerine erişim",
      "Etkinlik sponsorluğu önceliği",
      "Platform reklam kredisi",
    ],
    accent: "from-primary/35 to-accent/10",
    border: "border-primary/50",
    popular: true,
  },
  {
    amount: 10000,
    label: "Onursal Kurucu",
    icon: Crown,
    perks: [
      "CorteQS platformunda ve sosyal medyada global görünürlük",
      "Özel iş birliği fırsatları",
      "Stratejik 1:1 görüşmeler",
    ],
    accent: "from-yellow-500/25 via-primary/15 to-accent/10",
    border: "border-yellow-500/50",
  },
];

const BackerForm = ({ open, onOpenChange, defaultTier }: BackerFormProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [consent, setConsent] = useState(false);
  const [donorType, setDonorType] = useState<DonorType>("individual");
  const presetAmounts = tiers.map((t) => t.amount);
  const initialAmount = defaultTier ?? 1000;
  const [selectedTier, setSelectedTier] = useState<number>(initialAmount);
  const [isCustom, setIsCustom] = useState<boolean>(!presetAmounts.includes(initialAmount));
  const [customAmount, setCustomAmount] = useState<string>(
    !presetAmounts.includes(initialAmount) ? String(initialAmount) : ""
  );

  useEffect(() => {
    if (open && defaultTier) {
      setSelectedTier(defaultTier);
      const custom = !presetAmounts.includes(defaultTier);
      setIsCustom(custom);
      setCustomAmount(custom ? String(defaultTier) : "");
    }
  }, [open, defaultTier, presetAmounts]);
  const [phone, setPhone] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [referralSource, setReferralSource] = useState("");
  const [referralDetail, setReferralDetail] = useState("");
  const [documentFiles, setDocumentFiles] = useState<File[]>([]);
  const [documentError, setDocumentError] = useState("");
  const [country, setCountry] = useState("");
  const [city, setCity] = useState("");
  const documentInputRef = useRef<HTMLInputElement | null>(null);

  const validatePhone = (value: string) => {
    const cleaned = value.replace(/[\s\-().]/g, "");
    return /^\+[1-9]\d{7,14}$/.test(cleaned);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validatePhone(phone)) {
      setPhoneError("Telefon ülke kodu ile başlamalı (örn: +49 170 1234567).");
      return;
    }
    setPhoneError("");

    if (!country || !city) {
      toast({
        title: "Ülke ve şehir seçin",
        description: "Lütfen ülke ve şehir alanlarını doldurun.",
        variant: "destructive",
      });
      return;
    }

    const effectiveAmount = isCustom ? parseInt(customAmount, 10) : selectedTier;
    if (!effectiveAmount || effectiveAmount < 1) {
      toast({
        title: "Geçerli bir tutar girin",
        description: "Lütfen en az 1 USD tutarında bir bağış miktarı belirtin.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const values = Object.fromEntries(formData.entries());
    values.referral_source = referralSource;
    values.referral_detail = referralDetail;

    try {
      const uploadedDocs = await uploadSubmissionDocuments(documentFiles);
      values.document_url = uploadedDocs[0]?.url ?? "";
      values.document_name = uploadedDocs[0]?.name ?? "";
      values.documents = uploadedDocs as unknown as FormDataEntryValue;

      const payload = toSubmissionInsert(
        {
          ...values,
          phone: phone.replace(/[\s\-().]/g, ""),
          donation_amount: String(effectiveAmount),
          donor_type: donorType,
          offers_needs: String(values.offers_needs ?? ""),
        },
        "backer",
        consent,
      );
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
        title: "Bağış Niyetiniz Alındı! 🏆",
        description: "Teşekkürler! Detaylı görüşme için kısa süre içinde size e-posta göndereceğiz.",
      });

      onOpenChange(false);
      setConsent(false);
      setPhone("");
      setSelectedTier(1000);
      setIsCustom(false);
      setCustomAmount("");
      setDonorType("individual");
      setReferralSource("");
      setReferralDetail("");
      setDocumentFiles([]);
      setDocumentError("");
    } catch (err: unknown) {
      console.error("Backer submission error:", err);
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[92vh] overflow-y-auto p-0 border-none">
        <div className="relative rounded-t-lg overflow-hidden">
          <img src={heroNetworkLight} alt="" className="w-full h-44 object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-transparent to-background/95" />
          <div className="absolute top-4 right-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-yellow-500/95 text-yellow-950 text-xs font-bold shadow-lg">
              <Crown className="w-3.5 h-3.5" /> ONURSAL KURUCULAR PROGRAMI
            </span>
          </div>
          <div className="absolute bottom-0 left-0 right-0 p-6">
            <img src={corteqsLogo} alt="CorteQS Logo" className="h-10 mb-3" />
            <DialogHeader>
              <DialogTitle className="text-foreground text-2xl">
                🏆 Bağış Kabul Ediyoruz — Onursal Kurucularımız Arasına Girin
              </DialogTitle>
              <DialogDescription className="text-muted-foreground">
                Diaspora Connect'in temellerini birlikte atalım. Bağışınızla erken erişim, üyelik avantajları, platform reklamları ve onursal kurucular panomuzda yer alma fırsatı kazanın.
              </DialogDescription>
            </DialogHeader>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 p-6 pt-4">
          <div>
            <Label className="text-base font-semibold mb-3 block">Bağış Tutarınızı Seçin</Label>
            <div className="grid sm:grid-cols-2 gap-3">
              {tiers.map((tier) => {
                const Icon = tier.icon;
                const isSelected = !isCustom && selectedTier === tier.amount;
                return (
                  <button
                    type="button"
                    key={tier.amount}
                    onClick={() => {
                      setIsCustom(false);
                      setSelectedTier(tier.amount);
                    }}
                    className={`relative text-left p-4 rounded-xl border-2 transition-all bg-gradient-to-br ${tier.accent} ${
                      isSelected
                        ? `${tier.border} ring-2 ring-primary/50 scale-[1.02] shadow-lg`
                        : "border-border hover:border-primary/30"
                    }`}
                  >
                    {tier.popular && (
                      <span className="absolute -top-2 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-wide">
                        Popüler
                      </span>
                    )}
                    {isSelected && (
                      <span className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                        <Check className="w-3 h-3" />
                      </span>
                    )}
                    <Icon className="w-6 h-6 text-primary mb-2" />
                    <div className="font-bold text-foreground text-2xl">${tier.amount.toLocaleString()}</div>
                    <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">{tier.label}</div>
                    <ul className="space-y-1">
                      {tier.perks.map((perk) => (
                        <li key={perk} className="text-xs text-foreground/80 flex items-start gap-1">
                          <span className="text-primary mt-0.5">•</span>
                          <span>{perk}</span>
                        </li>
                      ))}
                    </ul>
                  </button>
                );
              })}
            </div>

            <div
              className={`mt-3 p-4 rounded-xl border-2 transition-all bg-gradient-to-br from-emerald-500/10 to-cyan-500/5 ${
                isCustom ? "border-emerald-500/60 ring-2 ring-emerald-500/30 shadow-md" : "border-border"
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  <span className="font-semibold text-foreground text-sm">Özel Tutar / Esnek Bağış</span>
                </div>
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">İstediğiniz kadar</span>
              </div>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold">$</span>
                  <Input
                    type="number"
                    min={1}
                    inputMode="numeric"
                    placeholder="Tutar (USD)"
                    value={customAmount}
                    onFocus={() => setIsCustom(true)}
                    onChange={(e) => {
                      setIsCustom(true);
                      setCustomAmount(e.target.value);
                    }}
                    className="pl-7"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (customAmount && parseInt(customAmount, 10) >= 1) setIsCustom(true);
                  }}
                  className="px-4 rounded-md bg-emerald-500 text-white text-sm font-bold hover:bg-emerald-600 transition-all"
                >
                  Seç
                </button>
              </div>
              {isCustom && customAmount && parseInt(customAmount, 10) >= 1 && (
                <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-2 font-medium">
                  ✓ ${parseInt(customAmount, 10).toLocaleString()} USD bağış seçildi
                </p>
              )}
            </div>
          </div>

          <div>
            <Label className="text-base font-semibold mb-3 block">Bağışçı Tipi</Label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setDonorType("individual")}
                className={`p-3 rounded-lg border-2 font-semibold text-sm transition-all ${
                  donorType === "individual"
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-border text-muted-foreground hover:border-primary/30"
                }`}
              >
                👤 Kişisel
              </button>
              <button
                type="button"
                onClick={() => setDonorType("company")}
                className={`p-3 rounded-lg border-2 font-semibold text-sm transition-all ${
                  donorType === "company"
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-border text-muted-foreground hover:border-primary/30"
                }`}
              >
                🏢 Firma
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="fullname">Ad Soyad</Label>
              <Input id="fullname" name="fullname" placeholder="Adınız Soyadınız" required />
            </div>

            {donorType === "company" && (
              <div>
                <Label htmlFor="company_name">Firma Adı</Label>
                <Input id="company_name" name="company_name" placeholder="Şirket veya kuruluş adı" required />
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="country">Ülke</Label>
                <SearchableCountrySelect
                  id="country"
                  name="country"
                  value={country}
                  onChange={(v) => { setCountry(v); setCity(""); }}
                  placeholder="Almanya"
                />
              </div>
              <div>
                <Label htmlFor="city">Şehir</Label>
                <SearchableCitySelect
                  id="city"
                  name="city"
                  value={city}
                  onChange={setCity}
                  countryName={country || undefined}
                  placeholder={country ? "Şehir seçin" : "Önce ülke seçin"}
                />
              </div>
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

            <div>
              <Label htmlFor="description">Mesajınız (opsiyonel)</Label>
              <Textarea
                id="description"
                name="description"
                rows={3}
                placeholder="Bağışınızla ilgili belirtmek istedikleriniz, beklentileriniz veya iş birliği önerileriniz..."
                className="resize-none"
              />
            </div>

            <div>
              <Label htmlFor="offers_needs">Arz & Talepleriniz (opsiyonel)</Label>
              <Textarea
                id="offers_needs"
                name="offers_needs"
                rows={3}
                maxLength={1000}
                placeholder="Örn: Diaspora network erişimi arıyorum • Sponsorluk görüşmesi yapmak istiyorum..."
                className="resize-none"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Detaylı veri AI eşleşme kalitesini artırır.
              </p>
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
                  />
                  <p className="mt-1 text-xs text-muted-foreground">Sizi yönlendiren admin veya davet kodunu girebilirsiniz.</p>
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

            <div className="rounded-lg border border-primary/15 bg-primary/5 p-3">
              <Label htmlFor="backer-document" className="text-sm font-semibold">
                Doküman Yükle (opsiyonel)
              </Label>
              <Input
                ref={documentInputRef}
                id="backer-document"
                name="backer-document"
                type="file"
                multiple
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp"
                onChange={(event) => {
                  const picked = Array.from(event.target.files ?? []);
                  if (!picked.length) return;

                  const result = validateSubmissionDocuments(picked, documentFiles);
                  if (!result.ok) {
                    setDocumentError(result.message);
                    event.target.value = "";
                    return;
                  }

                  setDocumentError("");
                  setDocumentFiles(result.files);
                  event.target.value = "";
                }}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => documentInputRef.current?.click()}
                className="mt-2 inline-flex h-10 items-center gap-2 rounded-xl border border-primary/20 bg-white px-4 text-sm font-semibold text-primary shadow-sm transition hover:border-primary/40 hover:bg-primary/5"
              >
                Dosya Seç
              </button>
              {documentError && <p className="mt-2 text-xs text-destructive">{documentError}</p>}
              {documentFiles.length > 0 && (
                <ul className="mt-2 space-y-1">
                  {documentFiles.map((file, index) => (
                    <li key={`${file.name}-${index}`} className="flex items-center justify-between gap-2 rounded border border-primary/15 bg-background/60 px-2 py-1 text-xs">
                      <span className="truncate font-medium text-primary">
                        {file.name} <span className="text-muted-foreground">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => setDocumentFiles(documentFiles.filter((_, currentIndex) => currentIndex !== index))}
                        className="shrink-0 text-destructive hover:underline"
                      >
                        Kaldır
                      </button>
                    </li>
                  ))}
                  <li className="pt-1 text-[11px] text-muted-foreground">
                    {documentFiles.length} / {maxSubmissionDocumentCount} dosya seçildi.
                  </li>
                </ul>
              )}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-gradient-to-br from-primary/5 to-accent/5 border border-primary/20 space-y-2">
            <p className="font-semibold text-foreground flex items-center gap-2">
              <Mail className="w-4 h-4 text-primary" /> Detaylı Bilgilendirme
            </p>
            <p className="text-sm text-muted-foreground">
              Backing/Destek karşılığı erken erişim, üyelik paketi avantajları, platform reklam fırsatları ve <strong className="text-foreground">Onursal Bağışçılar Panomuzda</strong> yer alma detayları için e-posta ile size ulaşıp görüşme planlayacağız.
            </p>
            <a href="mailto:info@corteqs.net" className="inline-flex items-center gap-1 text-primary text-sm font-semibold hover:underline">
              info@corteqs.net
            </a>
          </div>

          <label className="flex items-start gap-2 p-3 rounded-lg bg-[#25D366]/5 border border-[#25D366]/30 cursor-pointer">
            <input type="checkbox" name="whatsapp_interest" value="yes" className="mt-1 rounded border-input accent-[#25D366]" />
            <span className="text-sm text-foreground leading-relaxed">
              💬 <strong>Onursal Kurucular WhatsApp grubuna katılmak istiyorum.</strong>{" "}
              <span className="text-muted-foreground">Davet linki size iletilecek.</span>
            </span>
          </label>

          <div className="flex items-start gap-2">
            <Checkbox
              id="backer-consent"
              checked={consent}
              onCheckedChange={(checked) => setConsent(checked === true)}
              className="mt-0.5"
            />
            <label htmlFor="backer-consent" className="text-xs text-muted-foreground cursor-pointer leading-relaxed">
              Kişisel bilgilerimi, CorteQS tarafından bağış sürecinin yürütülmesi ve tarafıma ulaşılması amacıyla paylaşıyorum. Bilgilerim üçüncü şahıslarla paylaşılmayacaktır.
            </label>
          </div>

          <button
            type="submit"
            disabled={loading || !consent}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-yellow-500 via-primary to-primary text-white font-bold text-base hover:opacity-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary/20"
          >
            {loading
              ? "Gönderiliyor..."
              : `🏆 ${(isCustom ? parseInt(customAmount || "0", 10) : selectedTier).toLocaleString()}$ Bağış Niyetimi Bildir`}
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default BackerForm;
