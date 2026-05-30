import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Upload, X, FileText, Send, Clock, MapPin, DollarSign, Briefcase, Building2, Users, Target } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import ConsentCheckboxes, { emptyConsent, isConsentValid, type ConsentState } from "@/components/ConsentCheckboxes";
import { markRealServiceRequest } from "@/lib/demoFlags";

type CategoryDef = { value: string; label: string; subcategories: string[] };

const TARGET_TYPES = [
  { value: "consultant", label: "Danışman", description: "Bireysel uzman / profesyonel", icon: Briefcase, color: "text-emerald-500" },
  { value: "business", label: "İşletme", description: "Şirket, restoran, mağaza, hizmet sağlayıcı", icon: Building2, color: "text-amber-500" },
];

const CONSULTANT_CATEGORIES: CategoryDef[] = [
  { value: "yasam-relokasyon", label: "Yaşam ve Relokasyon", subcategories: ["Taşınma Danışmanlığı", "Entegrasyon", "Dil Desteği", "Konut Arama", "Okul/Eğitim Danışmanlığı"] },
  { value: "finans", label: "Finans & Vergi", subcategories: ["Vergi Danışmanlığı", "Yatırım", "Bankacılık", "Sigorta", "Emeklilik Planlama", "Kripto/Web3"] },
  { value: "hukuk", label: "Hukuk", subcategories: ["İş Hukuku", "Aile Hukuku", "Sözleşme", "Vatandaşlık", "Ceza Hukuku", "Miras Hukuku"] },
  { value: "sirket-kurulusu", label: "Şirket Kuruluşu", subcategories: ["GmbH / LTD Kuruluşu", "Freelance Kayıt", "Muhasebe", "Ticari Danışmanlık", "KOBİ Danışmanlığı"] },
  { value: "vize-gocmenlik", label: "Vize / Göçmenlik", subcategories: ["Çalışma Vizesi", "Mavi Kart", "Aile Birleşimi", "Oturma İzni", "Vatandaşlık Başvurusu", "Öğrenci Vizesi"] },
  { value: "gayrimenkul-danismanlik", label: "Gayrimenkul Danışmanlığı", subcategories: ["Kiralama", "Satın Alma", "Yatırım", "Değerleme", "Mortgage"] },
  { value: "saglik-danismanlik", label: "Sağlık Danışmanlığı", subcategories: ["Hastane Yönlendirme", "Sigorta", "Diş", "Estetik", "Psikoterapi", "İkinci Görüş"] },
  { value: "kariyer-egitim", label: "Kariyer & Eğitim", subcategories: ["CV / LinkedIn", "Mülakat Koçluğu", "Kariyer Geçişi", "Diploma Denkliği", "Sertifika"] },
  { value: "psikoloji-aile", label: "Psikoloji & Aile", subcategories: ["Bireysel Terapi", "Çift / Aile Terapisi", "Çocuk Psikolojisi", "Yaşam Koçluğu"] },
  { value: "dijital-pazarlama", label: "Dijital & Pazarlama", subcategories: ["SEO/SEM", "Sosyal Medya", "Web Tasarım", "İçerik Üretimi", "Marka Danışmanlığı"] },
];

const BUSINESS_CATEGORIES: CategoryDef[] = [
  { value: "restoran-gida", label: "Restoran & Gıda", subcategories: ["Restoran", "Cafe", "Catering", "Market / Bakkal", "Pastane / Fırın", "Helal Et / Kasap"] },
  { value: "saglik-medikal", label: "Sağlık & Medikal", subcategories: ["Hastane / Klinik", "Diş Hekimi", "Eczane", "Optik", "Estetik", "Fizyoterapi"] },
  { value: "guzellik-bakim", label: "Güzellik & Bakım", subcategories: ["Berber", "Kuaför", "SPA / Masaj", "Tırnak / Cilt Bakımı"] },
  { value: "perakende", label: "Perakende & Mağaza", subcategories: ["Giyim", "Mücevher", "Elektronik", "Hediyelik", "Kitap"] },
  { value: "otomotiv", label: "Otomotiv", subcategories: ["Servis", "Galeri", "Kiralama", "Lastik", "Yıkama"] },
  { value: "insaat-tadilat", label: "İnşaat & Tadilat", subcategories: ["Tadilat", "Boya", "Tesisat", "Elektrik", "Mobilya / Mutfak"] },
  { value: "lojistik-tasimacilik", label: "Lojistik & Taşımacılık", subcategories: ["Evden Eve Nakliyat", "Kargo", "Uluslararası Taşıma", "Depolama"] },
  { value: "egitim-okul", label: "Eğitim & Okul", subcategories: ["Anaokulu", "Özel Ders", "Dil Kursu", "Müzik / Sanat"] },
  { value: "turizm-konaklama", label: "Turizm & Konaklama", subcategories: ["Otel", "Apart", "Tur Operatörü", "Bilet / Acente"] },
  { value: "etkinlik-organizasyon", label: "Etkinlik & Organizasyon", subcategories: ["Düğün", "Catering", "Fotoğraf / Video", "DJ / Müzik"] },
  { value: "teknoloji-yazilim", label: "Teknoloji & Yazılım", subcategories: ["Yazılım Ajansı", "IT Servis", "E-ticaret", "Donanım Satış"] },
  { value: "finans-sigorta", label: "Finans & Sigorta", subcategories: ["Banka Şubesi", "Sigorta Acentesi", "Döviz / Transfer", "Muhasebe Bürosu"] },
];

const ASSOCIATION_CATEGORIES: CategoryDef[] = [
  { value: "kultur-sanat", label: "Kültür & Sanat Derneği", subcategories: ["Folklor", "Müzik", "Tiyatro", "Edebiyat"] },
  { value: "egitim-bilim", label: "Eğitim & Bilim Vakfı", subcategories: ["Burs", "Kurs", "Akademik", "Öğrenci Topluluğu"] },
  { value: "yardimlasma", label: "Yardımlaşma & Dayanışma", subcategories: ["İhtiyaç Sahipleri", "Afet", "Sağlık Yardımı", "Gıda Bankası"] },
  { value: "din-ibadet", label: "Din & İbadet Kurumu", subcategories: ["Cami", "Cemevi", "Kültür Merkezi"] },
  { value: "spor-genclik", label: "Spor & Gençlik Kulübü", subcategories: ["Futbol", "Basketbol", "Geleneksel Sporlar", "Gençlik Kampı"] },
  { value: "is-meslek", label: "İş & Meslek Odası", subcategories: ["Ticaret Odası", "Sanayici Derneği", "Profesyonel Birlik", "KOBİ Ağı"] },
  { value: "kadin-aile", label: "Kadın & Aile Derneği", subcategories: ["Kadın Hakları", "Aile Danışmanlığı", "Çocuk Destek"] },
  { value: "hemseri", label: "Hemşeri Derneği", subcategories: ["Şehir Derneği", "Bölge Derneği", "Köy Derneği"] },
  { value: "siyasi-lobi", label: "Siyasi & Lobi Kuruluşu", subcategories: ["Düşünce Kuruluşu", "Lobi", "Sivil Platform"] },
  { value: "konsolosluk-resmi", label: "Konsolosluk / Resmi Kurum", subcategories: ["Konsolosluk", "Büyükelçilik", "Ticaret Müşaviri"] },
];

const CATEGORIES_BY_TARGET: Record<string, CategoryDef[]> = {
  consultant: CONSULTANT_CATEGORIES,
  business: BUSINESS_CATEGORIES,
  association: ASSOCIATION_CATEGORIES,
};

const URGENCY_OPTIONS = [
  { value: "low", label: "Acil Değil", color: "bg-muted text-muted-foreground" },
  { value: "normal", label: "Normal", color: "bg-primary/10 text-primary" },
  { value: "high", label: "Acil", color: "bg-gold/10 text-gold" },
  { value: "urgent", label: "Çok Acil", color: "bg-destructive/10 text-destructive" },
];

interface ServiceRequestFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

const ServiceRequestForm = ({ onSuccess, onCancel }: ServiceRequestFormProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [targetType, setTargetType] = useState<string>("");
  const [category, setCategory] = useState("");
  const [customCategory, setCustomCategory] = useState("");
  const [subcategory, setSubcategory] = useState("");
  const [customSubcategory, setCustomSubcategory] = useState("");
  const [form, setForm] = useState({
    title: "",
    description: "",
    city: "",
    country: "",
    budgetMin: "",
    budgetMax: "",
    preferredTime: "",
    urgency: "normal",
  });
  const [consent, setConsent] = useState<ConsentState>(emptyConsent);

  // Auto-fill city/country from user profile
  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("profiles")
        .select("city, country")
        .eq("id", user.id)
        .maybeSingle();
      if (data) {
        setForm(p => ({
          ...p,
          city: p.city || (data as any).city || "",
          country: p.country || (data as any).country || "",
        }));
      }
    })();
  }, []);

  const availableCategories = CATEGORIES_BY_TARGET[targetType] || [];
  const selectedCategory = availableCategories.find(c => c.value === category);
  const selectedTarget = TARGET_TYPES.find(t => t.value === targetType);
  const isOtherCategory = category === "__other__";
  const isOtherSubcategory = subcategory === "__other__";

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setFiles(prev => [...prev, ...newFiles].slice(0, 5));
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalCategoryLabel = isOtherCategory ? customCategory.trim() : (selectedCategory?.label || "");
    const finalSubcategory = isOtherSubcategory ? customSubcategory.trim() : subcategory;
    if (!targetType || !category || (isOtherCategory && !finalCategoryLabel) || !form.title || !form.description) {
      toast({ title: "Eksik bilgi", description: "Hedef tür, kategori, başlık ve açıklama zorunludur.", variant: "destructive" });
      return;
    }
    if (isOtherSubcategory && !finalSubcategory) {
      toast({ title: "Eksik bilgi", description: "Alt kategori için bir değer girin.", variant: "destructive" });
      return;
    }
    if (!isConsentValid(consent)) {
      toast({ title: "Onay gerekli", description: "KVKK / GDPR onaylarını işaretleyin.", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({ title: "Giriş yapmalısınız", variant: "destructive" });
        return;
      }

      // Upload files
      const attachmentUrls: string[] = [];
      for (const file of files) {
        const filePath = `${user.id}/${Date.now()}-${file.name}`;
        const { error: uploadError } = await supabase.storage
          .from("service-attachments")
          .upload(filePath, file);
        if (!uploadError) {
          const { data: urlData } = supabase.storage
            .from("service-attachments")
            .getPublicUrl(filePath);
          attachmentUrls.push(urlData.publicUrl);
        }
      }

      const { error } = await supabase.from("service_requests").insert({
        user_id: user.id,
        category: `${selectedTarget?.label || targetType} › ${finalCategoryLabel || category}`,
        subcategory: finalSubcategory || null,
        title: form.title,
        description: form.description,
        city: form.city || null,
        country: form.country || null,
        budget_min: form.budgetMin ? parseFloat(form.budgetMin) : null,
        budget_max: form.budgetMax ? parseFloat(form.budgetMax) : null,
        preferred_time: form.preferredTime || null,
        urgency: form.urgency,
        attachment_urls: attachmentUrls,
      });

      if (error) throw error;

      markRealServiceRequest();
      toast({ title: "Talep oluşturuldu!", description: "Danışmanlar tekliflerini gönderecektir." });
      onSuccess?.();
    } catch (err: any) {
      toast({ title: "Hata", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Target Type */}
      <div className="space-y-2">
        <Label className="flex items-center gap-1.5"><Target className="h-3.5 w-3.5" /> Talebiniz kime yönelik? *</Label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          {TARGET_TYPES.map(t => {
            const Icon = t.icon;
            const active = targetType === t.value;
            return (
              <button
                key={t.value}
                type="button"
                onClick={() => { setTargetType(t.value); setCategory(""); setSubcategory(""); }}
                className={`flex items-start gap-3 p-3 rounded-xl border-2 text-left transition-all ${
                  active ? "border-primary bg-primary/5 shadow-sm" : "border-border hover:border-primary/40"
                }`}
              >
                <div className={`p-2 rounded-lg bg-muted ${t.color}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm text-foreground">{t.label}</div>
                  <div className="text-xs text-muted-foreground line-clamp-2">{t.description}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Category */}
        <div className="space-y-2">
          <Label className="flex items-center gap-1.5"><Briefcase className="h-3.5 w-3.5" /> Kategori *</Label>
          <Select
            value={category}
            onValueChange={(v) => { setCategory(v); setSubcategory(""); setCustomSubcategory(""); if (v !== "__other__") setCustomCategory(""); }}
            disabled={!targetType}
          >
            <SelectTrigger><SelectValue placeholder={targetType ? "Kategori seçin" : "Önce hedef türünü seçin"} /></SelectTrigger>
            <SelectContent>
              {availableCategories.map(c => (
                <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
              ))}
              <SelectItem value="__other__">✏️ Diğer (kendim yazayım)</SelectItem>
            </SelectContent>
          </Select>
          {isOtherCategory && (
            <Input
              placeholder="Kategoriyi yazın"
              value={customCategory}
              onChange={e => setCustomCategory(e.target.value)}
              maxLength={80}
            />
          )}
        </div>

        {/* Subcategory */}
        <div className="space-y-2">
          <Label>Alt Kategori</Label>
          <Select
            value={subcategory}
            onValueChange={(v) => { setSubcategory(v); if (v !== "__other__") setCustomSubcategory(""); }}
            disabled={!category}
          >
            <SelectTrigger><SelectValue placeholder="Alt kategori seçin" /></SelectTrigger>
            <SelectContent>
              {selectedCategory?.subcategories.map(sc => (
                <SelectItem key={sc} value={sc}>{sc}</SelectItem>
              ))}
              <SelectItem value="__other__">✏️ Diğer (kendim yazayım)</SelectItem>
            </SelectContent>
          </Select>
          {isOtherSubcategory && (
            <Input
              placeholder="Alt kategoriyi yazın"
              value={customSubcategory}
              onChange={e => setCustomSubcategory(e.target.value)}
              maxLength={80}
            />
          )}
        </div>
      </div>

      {/* Title */}
      <div className="space-y-2">
        <Label>Talep Başlığı *</Label>
        <Input
          placeholder="Örn: Almanya'da GmbH kurulumu hakkında danışmanlık"
          value={form.title}
          onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
          maxLength={200}
        />
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label>Detaylı Açıklama *</Label>
        <Textarea
          placeholder="Hizmet talebinizi detaylı açıklayın..."
          value={form.description}
          onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
          rows={4}
          maxLength={2000}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* City */}
        <div className="space-y-2">
          <Label className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> Şehir</Label>
          <Input placeholder="Örn: Berlin" value={form.city} onChange={e => setForm(p => ({ ...p, city: e.target.value }))} />
          <p className="text-[10px] text-muted-foreground">Profilinizden otomatik dolduruldu — değiştirebilirsiniz.</p>
        </div>

        {/* Country */}
        <div className="space-y-2">
          <Label>Ülke</Label>
          <Input placeholder="Örn: Almanya" value={form.country} onChange={e => setForm(p => ({ ...p, country: e.target.value }))} />
          <p className="text-[10px] text-muted-foreground">Profilinizden otomatik dolduruldu — değiştirebilirsiniz.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Budget */}
        <div className="space-y-2">
          <Label className="flex items-center gap-1.5"><DollarSign className="h-3.5 w-3.5" /> Min Bütçe (€)</Label>
          <Input type="number" placeholder="100" value={form.budgetMin} onChange={e => setForm(p => ({ ...p, budgetMin: e.target.value }))} />
        </div>
        <div className="space-y-2">
          <Label>Max Bütçe (€)</Label>
          <Input type="number" placeholder="500" value={form.budgetMax} onChange={e => setForm(p => ({ ...p, budgetMax: e.target.value }))} />
        </div>

        {/* Preferred Time */}
        <div className="space-y-2">
          <Label className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" /> Tercih Edilen Zaman</Label>
          <Select value={form.preferredTime} onValueChange={v => setForm(p => ({ ...p, preferredTime: v }))}>
            <SelectTrigger><SelectValue placeholder="Zaman seçin" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="weekday-morning">Hafta İçi Sabah</SelectItem>
              <SelectItem value="weekday-afternoon">Hafta İçi Öğleden Sonra</SelectItem>
              <SelectItem value="weekday-evening">Hafta İçi Akşam</SelectItem>
              <SelectItem value="weekend">Hafta Sonu</SelectItem>
              <SelectItem value="flexible">Esnek</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Urgency */}
      <div className="space-y-2">
        <Label>Aciliyet</Label>
        <div className="flex flex-wrap gap-2">
          {URGENCY_OPTIONS.map(u => (
            <Badge
              key={u.value}
              className={`cursor-pointer transition-all ${form.urgency === u.value ? u.color + " ring-2 ring-ring" : "bg-muted/50 text-muted-foreground hover:bg-muted"}`}
              onClick={() => setForm(p => ({ ...p, urgency: u.value }))}
            >
              {u.label}
            </Badge>
          ))}
        </div>
      </div>

      {/* File Upload */}
      <div className="space-y-2">
        <Label className="flex items-center gap-1.5"><Upload className="h-3.5 w-3.5" /> Dosya Ekle (max 5)</Label>
        <div className="border-2 border-dashed border-border rounded-xl p-4 text-center hover:border-primary/50 transition-colors">
          <input type="file" multiple onChange={handleFileChange} className="hidden" id="file-upload" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp" />
          <label htmlFor="file-upload" className="cursor-pointer">
            <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Dosya seçmek için tıklayın</p>
            <p className="text-xs text-muted-foreground/60 mt-1">PDF, DOC, JPG, PNG · Max 5 dosya</p>
          </label>
        </div>
        {files.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {files.map((file, i) => (
              <Badge key={i} variant="outline" className="gap-1.5 pr-1">
                <FileText className="h-3 w-3" />
                <span className="max-w-[120px] truncate text-xs">{file.name}</span>
                <button type="button" onClick={() => removeFile(i)} className="ml-1 hover:text-destructive">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
      </div>

      <ConsentCheckboxes compact value={consent} onChange={setConsent} />

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <Button type="submit" disabled={loading || !isConsentValid(consent)} className="gap-2 flex-1 md:flex-none">
          <Send className="h-4 w-4" /> {loading ? "Gönderiliyor..." : "Talebi Gönder"}
        </Button>
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>İptal</Button>
        )}
      </div>
    </form>
  );
};

export default ServiceRequestForm;
