import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCircle2, Upload, X, Hourglass, Target, Globe2, Rocket } from "lucide-react";
import ConsentCheckboxes, { emptyConsent, isConsentValid, type ConsentState } from "@/components/ConsentCheckboxes";

export type InterestCategory =
  | "founders_1000"
  | "yarisma"
  | "kariyer"
  | "genel";

export const INTEREST_CATEGORIES: { value: string; label: string }[] = [
  { value: "danisman", label: "Danışman / Profesyonel" },
  { value: "isletme", label: "İşletme / Restoran / Mağaza" },
  { value: "kurulus", label: "Dernek / STK / Kuruluş" },
  { value: "blogger", label: "Blogger / Vlogger / YouTuber / İçerik Üretici" },
  { value: "diaspora-medya", label: "Türk Diaspora Medyası (TV / Radyo / Dijital Medya)" },
  { value: "sehir-elcisi", label: "Şehir Elçisi" },
  { value: "kullanici", label: "Bireysel Kullanıcı (taşınma/yaşam)" },
  { value: "founders_1000", label: "Founders 1000" },
  { value: "yarisma", label: "Yarışma (Blog / Vlog)" },
  { value: "kariyer", label: "CorteQS Kariyer" },
];

const HEARD_FROM_OPTIONS = [
  "Instagram",
  "LinkedIn",
  "X / Twitter",
  "TikTok",
  "YouTube",
  "Arkadaş tavsiyesi",
  "Google",
  "WhatsApp grubu",
  "Etkinlik / podcast",
  "Diğer",
];

interface InterestFormProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** modal=true (default) Dialog içinde, false ise sayfaya gömülü inline */
  modal?: boolean;
  /** Önceden seçili kategori */
  defaultCategory?: string;
  /** Form bağlamı (founders_1000, yarisma, kariyer, genel) */
  context?: InterestCategory;
  title?: string;
  description?: string;
  source?: string;
  referralCode?: string;
  /** Kullanıcı kategoriyi değiştirebilsin mi */
  lockCategory?: boolean;
}

const titles: Record<InterestCategory, string> = {
  founders_1000: "Founding 1000'e Katıl — Diaspora Pasaportunuzu Oluşturun",
  yarisma: "Yarışmaya Başvur — Diaspora Pasaportunuzu Oluşturun",
  kariyer: "İş İlanına Başvur — Diaspora Pasaportunuzu Oluşturun",
  genel: "Diaspora Pasaportunuzu Oluşturun",
};

const InterestForm = ({
  open,
  onOpenChange,
  modal = true,
  defaultCategory,
  context = "genel",
  title,
  description,
  source,
  referralCode,
  lockCategory = false,
}: InterestFormProps) => {
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [consent, setConsent] = useState<ConsentState>(emptyConsent);
  const [form, setForm] = useState({
    selected_category: defaultCategory || "",
    name: "",
    email: "",
    phone: "",
    country: "",
    city: "",
    organization: "",
    interest_area: "",
    supply_demand: "",
    heard_from: "",
  });

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const list = Array.from(e.target.files || []);
    const total = files.length + list.length;
    if (total > 5) {
      toast({ title: "En fazla 5 dosya yükleyebilirsiniz", variant: "destructive" });
      return;
    }
    const oversize = list.find((f) => f.size > 10 * 1024 * 1024);
    if (oversize) {
      toast({ title: "Dosya çok büyük", description: `${oversize.name} 10MB üstü.`, variant: "destructive" });
      return;
    }
    setFiles((p) => [...p, ...list]);
  };

  const removeFile = (i: number) => setFiles((p) => p.filter((_, idx) => idx !== i));

  const uploadAttachments = async (): Promise<string[]> => {
    if (files.length === 0) return [];
    const urls: string[] = [];
    for (const f of files) {
      const ext = f.name.split(".").pop() || "bin";
      const path = `${(form.selected_category || context)}/${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 8)}.${ext}`;
      const { error } = await supabase.storage
        .from("interest-uploads")
        .upload(path, f, { contentType: f.type, upsert: false });
      if (error) throw error;
      urls.push(path);
    }
    return urls;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email) {
      toast({ title: "Eksik bilgi", description: "Ad ve e-posta zorunlu.", variant: "destructive" });
      return;
    }
    if (!isConsentValid(consent)) {
      toast({ title: "Onay gerekli", description: "KVKK / GDPR onaylarını işaretleyin.", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      const attachment_urls = await uploadAttachments();
      const { error } = await supabase.from("interest_registrations").insert({
        category: context,
        role: form.selected_category || null,
        name: form.name,
        email: form.email,
        phone: form.phone,
        country: form.country,
        city: form.city,
        organization: form.organization,
        interest_area: form.interest_area,
        supply_demand: form.supply_demand,
        heard_from: form.heard_from,
        referral_code: referralCode || null,
        source: source || null,
        attachment_urls,
        message: form.supply_demand,
      });
      if (error) throw error;
      setSubmitted(true);
      toast({ title: "Kaydınız alındı", description: "En kısa sürede sizinle iletişime geçeceğiz." });
    } catch (err: any) {
      toast({ title: "Bir şeyler ters gitti", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const reset = () => {
    setSubmitted(false);
    setFiles([]);
    setForm({
      selected_category: defaultCategory || "",
      name: "",
      email: "",
      phone: "",
      country: "",
      city: "",
      organization: "",
      interest_area: "",
      supply_demand: "",
      heard_from: "",
    });
  };

  const FormBody = (
    <>
      {submitted ? (
        <div className="flex flex-col items-center text-center py-10 gap-3">
          <CheckCircle2 className="h-14 w-14 text-turquoise" />
          <h3 className="text-xl font-bold">Teşekkürler!</h3>
          <p className="text-sm text-muted-foreground max-w-sm">
            Kaydınız alındı. Platform açılır açılmaz size ilk haber vereceğiz. Erken kayıt olanlar avantajlı şartlarla yer alacak.
          </p>
          {modal ? (
            <Button onClick={() => onOpenChange?.(false)} className="mt-2">Kapat</Button>
          ) : (
            <Button variant="outline" onClick={reset} className="mt-2">Yeni Kayıt</Button>
          )}
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Yakında rozetleri */}
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-turquoise/10 text-turquoise border border-turquoise/30">
              <Target className="h-3 w-3" /> Yakında: AI Destekli Eşleştirme
            </span>
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-orange/10 text-orange-600 border border-orange-300/40">
              <Globe2 className="h-3 w-3" /> Yakında: 50+ Şehir Ağı
            </span>
          </div>

          {/* Kategori */}
          <div>
            <Label htmlFor="cat">Kategori / İlgi Alanı *</Label>
            <Select
              value={form.selected_category}
              onValueChange={(v) => setForm({ ...form, selected_category: v })}
              disabled={lockCategory}
            >
              <SelectTrigger id="cat" className="ring-2 ring-turquoise/40">
                <SelectValue placeholder="Seçiniz..." />
              </SelectTrigger>
              <SelectContent>
                {INTEREST_CATEGORIES.map((c) => (
                  <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {lockCategory && (
              <p className="text-[11px] text-muted-foreground mt-1">Bu kategori sabittir.</p>
            )}
          </div>

          <div>
            <Label htmlFor="name">Ad Soyad *</Label>
            <Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Adınız Soyadınız" required />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="country">Ülke</Label>
              <Input id="country" value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} placeholder="Almanya" />
            </div>
            <div>
              <Label htmlFor="city">Şehir</Label>
              <Input id="city" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} placeholder="Berlin" />
            </div>
          </div>

          <div>
            <Label htmlFor="org">İşletme / Kuruluş (opsiyonel)</Label>
            <Input id="org" value={form.organization} onChange={(e) => setForm({ ...form, organization: e.target.value })} placeholder="Şirket veya kuruluş adı" />
          </div>

          <div>
            <Label htmlFor="interest">İştigal / İlgi Sahası</Label>
            <Input id="interest" value={form.interest_area} onChange={(e) => setForm({ ...form, interest_area: e.target.value })} placeholder="Faaliyet veya ilgi alanınız" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="email">E-posta *</Label>
              <Input id="email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="ornek@mail.com" required />
            </div>
            <div>
              <Label htmlFor="phone">Telefon (ülke kodu ile)</Label>
              <Input id="phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+49 170 1234567" />
              <p className="text-[11px] text-muted-foreground mt-1">+ ile başlatın, ülke kodu zorunlu.</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="heard">Bizi nereden buldunuz?</Label>
              <Select value={form.heard_from} onValueChange={(v) => setForm({ ...form, heard_from: v })}>
                <SelectTrigger id="heard"><SelectValue placeholder="Seçiniz..." /></SelectTrigger>
                <SelectContent>
                  {HEARD_FROM_OPTIONS.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="ref">Referral Kodu (opsiyonel)</Label>
              <Input id="ref" defaultValue={referralCode} placeholder="ADMİN / DAVET KODU" />
              <p className="text-[11px] text-muted-foreground mt-1">Sizi davet eden admin/influencer kodu varsa girin.</p>
            </div>
          </div>

          <div>
            <Label htmlFor="sd">Arz & Talepleriniz (opsiyonel)</Label>
            <Textarea
              id="sd"
              value={form.supply_demand}
              onChange={(e) => setForm({ ...form, supply_demand: e.target.value })}
              rows={3}
              placeholder="Örn: İş arıyorum • Aracımı satıyorum • Parti biletim var • Eleman arıyorum • Ev kiralıyorum..."
            />
            <p className="text-[11px] text-muted-foreground mt-1">
              🎯 <span className="text-turquoise font-semibold">Detaylı veri AI eşleşme kalitesini artıracaktır</span> — sizi doğru kişilerle daha hızlı eşleştirelim.
            </p>
          </div>

          {/* Dosya yükleme */}
          <div>
            <Label>Sunum / CV / One-Pager vb. dosyalarınızı yükleyin</Label>
            <label className="mt-1 flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-turquoise/60 hover:bg-turquoise/5 transition-colors">
              <Upload className="h-4 w-4 text-turquoise" />
              <span className="text-sm text-muted-foreground">Dosya seç (PDF, PPTX, DOCX, max 10MB)</span>
              <input type="file" multiple accept=".pdf,.ppt,.pptx,.doc,.docx,.png,.jpg,.jpeg" className="hidden" onChange={handleFiles} />
            </label>
            {files.length > 0 && (
              <ul className="mt-2 space-y-1">
                {files.map((f, i) => (
                  <li key={i} className="flex items-center justify-between text-xs bg-muted/50 px-2 py-1 rounded">
                    <span className="truncate">{f.name} <span className="text-muted-foreground">({(f.size / 1024).toFixed(0)}KB)</span></span>
                    <button type="button" onClick={() => removeFile(i)} className="text-destructive"><X className="h-3.5 w-3.5" /></button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="flex items-start gap-2 p-3 rounded-lg bg-orange-50 border border-orange-200">
            <Hourglass className="h-4 w-4 text-orange-600 shrink-0 mt-0.5" />
            <p className="text-xs text-foreground">
              <span className="font-semibold">Yakında!</span> Platform açılır açılmaz size ilk haber vereceğiz. Erken kayıt olanlar avantajlı şartlarla yer alır.
            </p>
          </div>

          <ConsentCheckboxes compact value={consent} onChange={setConsent} />

          <Button type="submit" disabled={submitting || !isConsentValid(consent)} className="w-full" size="lg">
            {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Rocket className="h-4 w-4 mr-2" />}
            Kaydı Tamamla
          </Button>
        </form>
      )}
    </>
  );

  if (!modal) {
    return (
      <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
        <div className="mb-4">
          <h3 className="text-2xl font-bold">{title || titles[context]}</h3>
          {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
        </div>
        {FormBody}
      </div>
    );
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) reset();
        onOpenChange?.(o);
      }}
    >
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">{title || titles[context]}</DialogTitle>
          <DialogDescription>
            {description || "🚀 Yakında açılıyoruz! İlk erişim için bilgilerinizi bırakın."}
          </DialogDescription>
        </DialogHeader>
        {FormBody}
      </DialogContent>
    </Dialog>
  );
};

export default InterestForm;
