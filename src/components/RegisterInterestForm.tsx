import { useEffect, useRef, useState } from "react";
import { Paperclip } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import heroNetworkLight from "@/assets/hero-network-light.jpg";
import corteqsLogo from "@/assets/corteqs-logo-globe.png";
import { notifySubmission } from "@/lib/mail";
import {
  categoryOptions,
  getReferralDetailLabel,
  getReferralDetailPlaceholder,
  getReadableErrorMessage,
  insertSubmissionWithCompatibility,
  isReferralDetailRequired,
  maxSubmissionDocumentCount,
  referralSourceOptions,
  shouldShowReferralDetail,
  toSubmissionInsert,
  type SubmissionFormMode,
  uploadSubmissionDocuments,
  validateReferralCodeBeforeSubmit,
  validateSubmissionDocuments,
} from "@/lib/submissions";

interface RegisterInterestFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultCategory?: string;
  defaultCity?: string;
  defaultReferralCode?: string;
  mode?: SubmissionFormMode;
}

const RegisterInterestForm = ({
  open,
  onOpenChange,
  defaultCategory,
  defaultCity,
  defaultReferralCode,
  mode = "register",
}: RegisterInterestFormProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [selectedCat, setSelectedCat] = useState(defaultCategory || "");
  const [consent, setConsent] = useState(false);
  const [phone, setPhone] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [referralSource, setReferralSource] = useState("");
  const [referralDetail, setReferralDetail] = useState("");
  const [documentFiles, setDocumentFiles] = useState<File[]>([]);
  const [documentError, setDocumentError] = useState("");
  const documentInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (open && defaultCategory) {
      setSelectedCat(defaultCategory);
    }
  }, [open, defaultCategory]);

  const isSupport = mode === "support";
  const showDocUpload = !isSupport && selectedCat !== "";

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
      const uploadedDocs = await uploadSubmissionDocuments(documentFiles);
      values.document_url = uploadedDocs[0]?.url ?? "";
      values.document_name = uploadedDocs[0]?.name ?? "";
      values.documents = uploadedDocs as unknown as FormDataEntryValue;

      const payload = toSubmissionInsert(values, mode, consent);
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

      onOpenChange(false);
      setConsent(false);
      setPhone("");
      setPhoneError("");
      setReferralSource("");
      setReferralDetail("");
      setSelectedCat(defaultCategory || "");
      setDocumentFiles([]);
      setDocumentError("");
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto p-0 border-none">
        <div className="relative rounded-t-lg overflow-hidden">
          <img src={heroNetworkLight} alt="" className="w-full h-40 object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background/95" />
          <div className="absolute bottom-0 left-0 right-0 p-6">
            <img src={corteqsLogo} alt="CorteQS Logo" className="h-10 mb-3" />
            <DialogHeader>
              <DialogTitle className="text-foreground text-xl">
                {isSupport ? "Projeye Destek & Yatırım" : "İlginizi Kaydedin"}
              </DialogTitle>
              <DialogDescription className="text-muted-foreground">
                {isSupport
                  ? "💡 Diaspora Connect projesine destek vermek veya yatırım yapmak için bilgilerinizi bırakın."
                  : "🚀 Yakında açılıyoruz! İlk erişim için bilgilerinizi bırakın."}
              </DialogDescription>
            </DialogHeader>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-6 pt-2">
          <div className="flex flex-wrap gap-2 mb-2">
            <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">
              {isSupport ? "🤝 Stratejik Ortaklık" : "🎯 Yakında: AI Destekli Eşleştirme"}
            </span>
            <span className="px-3 py-1 rounded-full bg-accent/10 text-accent text-xs font-semibold">
              {isSupport ? "💰 Yatırım Fırsatı" : "🌍 Yakında: 50+ Şehir Ağı"}
            </span>
          </div>

          {!isSupport && (
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

              {selectedCat === "danisman" && (
                <div className="mt-3 rounded-lg border border-primary/20 bg-primary/10 p-3">
                  <p className="mb-1 text-sm font-semibold text-foreground">Danışman / Doktor / Avukat Profili</p>
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    Hekim, avukat, mali müşavir, mühendis, koç, terapist ve diğer uzman danışmanlar için. Uzmanlık alanınızı ve varsa sertifika/CV dökümanlarınızı ekleyin; sizi daha doğru danışanlarla eşleştirelim.
                  </p>
                </div>
              )}
            </div>
          )}

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
              <Input id="city" name="city" placeholder="Berlin" defaultValue={defaultCity || ""} key={defaultCity || "city"} required />
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
                  defaultValue={defaultReferralCode || ""}
                  readOnly={!!defaultReferralCode}
                  key={defaultReferralCode || "referral_code"}
                />
                {defaultReferralCode ? (
                  <p className="mt-1 text-xs font-medium text-emerald-600">🎁 Bu sayfa için referral kodu otomatik uygulandı.</p>
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

          {selectedCat === "sehir-elcisi" && !isSupport && (
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

          {isSupport && (
            <div>
              <Label htmlFor="description">Açıklama</Label>
              <Textarea
                id="description"
                name="description"
                placeholder="Projeye verebileceğiniz teknik, organizasyonel ve yatırım gibi destekleri buraya yazın. Sizinle bağlantıya geçelim."
                rows={4}
                className="resize-none"
              />
            </div>
          )}

          <div>
            <Label htmlFor="offers_needs">Arz & Talepleriniz (opsiyonel)</Label>
            <Textarea
              id="offers_needs"
              name="offers_needs"
              rows={3}
              maxLength={1000}
              placeholder="Örn: İş arıyorum • Araç satıyorum • Etkinlik sponsoru arıyorum • Eleman arıyorum..."
              className="resize-none"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Diasporadaki arz ve taleplerinizi serbestçe yazın. <strong className="text-primary">Detaylı veri AI eşleşme kalitesini artırır.</strong>
            </p>
          </div>

          {showDocUpload && (
            <div className="rounded-lg border border-primary/15 bg-primary/5 p-3">
              <Label htmlFor="document" className="text-sm font-semibold">
                CV / Doküman Yükle (opsiyonel)
              </Label>
              <Input
                ref={documentInputRef}
                id="document"
                name="document"
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
                <Paperclip className="h-4 w-4" />
                Dosya Seç
              </button>
              {documentError && <p className="mt-2 text-xs text-destructive">{documentError}</p>}
              {documentFiles.length > 0 ? (
                <ul className="mt-2 space-y-1">
                  {documentFiles.map((file, index) => (
                    <li
                      key={`${file.name}-${index}`}
                      className="flex items-center justify-between gap-2 rounded border border-primary/15 bg-background/60 px-2 py-1 text-xs"
                    >
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
              ) : (
                <p className="mt-2 text-xs text-muted-foreground">
                  CV, portföy, sertifika veya tanıtım dökümanlarınızı ekleyin. Dosya başına maks. 50 MB.
                </p>
              )}
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
            {loading ? "Gönderiliyor..." : (isSupport ? "Destek Başvurusu Gönder" : "Kayıt Bırak / Takip Et")}
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default RegisterInterestForm;
