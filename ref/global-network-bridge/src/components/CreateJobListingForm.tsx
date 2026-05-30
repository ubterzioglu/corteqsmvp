import { useState } from "react";
import {
  Briefcase, Tag, CreditCard, Check, Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";

interface CreateJobListingFormProps {
  onClose: () => void;
  onCreated?: (listing: { title: string; type: string; package: string; price: number }) => void;
  editData?: {
    id: number;
    title: string;
    type: string;
    department: string;
    location: string;
    locationType: string;
    salary: string;
    description: string;
    requirements: string;
  } | null;
}

const listingPackages = [
  { id: "basic", name: "Standart İlan", price: 0, duration: "30 gün", comingSoon: false, features: ["Arama sonuçlarında görünür", "30 gün yayında kalır"] },
  { id: "premium", name: "Premium İlan", price: 27, duration: "45 gün", comingSoon: true, features: ["45 gün yayında", "Öne çıkan rozeti"] },
  { id: "featured", name: "Spotlight İlan", price: 59, duration: "60 gün", comingSoon: true, features: ["Ana sayfada görünür", "60 gün yayında", "AI eşleşmeli aday bildirimi", "Sosyal medya tanıtımı", "Detaylı başvuru raporu"] },
];

const CreateJobListingForm = ({ onClose, editData, onCreated }: CreateJobListingFormProps) => {
  const { toast } = useToast();
  const isEditing = !!editData;

  const [formData, setFormData] = useState({
    title: editData?.title || "",
    type: editData?.type || "Tam Zamanlı",
    department: editData?.department || "",
    location: editData?.location || "",
    locationType: editData?.locationType || "office",
    salaryMin: editData?.salary?.split("-")[0] || "",
    salaryMax: editData?.salary?.split("-")[1] || "",
    description: editData?.description || "",
    requirements: editData?.requirements || "",
  });

  const [selectedPackage, setSelectedPackage] = useState("basic");
  const [hideBusinessName, setHideBusinessName] = useState(false);

  const packagePrice = listingPackages.find(p => p.id === selectedPackage)?.price || 0;
  const totalPrice = packagePrice;

  const handleSubmit = async () => {
    const pkg = listingPackages.find((p) => p.id === selectedPackage);
    try {
      const { supabase } = await import("@/integrations/supabase/client");
      const { data: auth } = await supabase.auth.getUser();
      if (!auth?.user) {
        toast({ title: "Giriş gerekli", description: "İlan oluşturmak için giriş yapın." });
        return;
      }
      const { data: prof } = await supabase.from("profiles").select("business_name, country, city").eq("id", auth.user.id).maybeSingle();
      const payload = {
        user_id: auth.user.id,
        business_name: hideBusinessName ? null : ((prof as any)?.business_name || null),
        hide_business_name: hideBusinessName,
        title: formData.title || "Adsız İlan",
        department: formData.department || null,
        employment_type: formData.type,
        location_type: formData.locationType,
        country: (prof as any)?.country || null,
        city: (prof as any)?.city || null,
        location: formData.location || null,
        salary_min: formData.salaryMin ? Number(formData.salaryMin) : null,
        salary_max: formData.salaryMax ? Number(formData.salaryMax) : null,
        description: formData.description || null,
        requirements: formData.requirements || null,
        package: selectedPackage,
        total_price: totalPrice,
        status: "published" as const,
        expires_at: new Date(Date.now() + (selectedPackage === "featured" ? 60 : selectedPackage === "premium" ? 45 : 30) * 86400000).toISOString(),
      };
      if (isEditing && editData?.id) {
        await supabase.from("job_listings").update(payload).eq("id", String(editData.id));
      } else {
        await supabase.from("job_listings").insert(payload);
      }
      onCreated?.({
        title: payload.title,
        type: formData.type,
        package: pkg?.name || "Standart İlan",
        price: totalPrice,
      });
      toast({
        title: isEditing ? "İlan güncellendi ✅" : "İlan oluşturuldu! 🎉",
        description: isEditing
          ? "Değişiklikler kaydedildi."
          : totalPrice > 0
            ? `€${totalPrice} ödeme sonrası ilanınız yayınlanacaktır.`
            : "İlanınız yayına alındı ve İş İlanları sayfasında listelendi.",
      });
      onClose();
    } catch (e: any) {
      toast({ title: "Hata", description: e?.message || "İlan kaydedilemedi", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
          <Briefcase className="h-5 w-5 text-primary" />
          {isEditing ? "İlanı Düzenle" : "Yeni İş İlanı Oluştur"}
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          {isEditing ? "İlan detaylarını güncelleyin" : "Eleman arayışınızı platforma yayınlayın"}
        </p>
      </div>

      {/* Basic Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <Label>İlan Başlığı *</Label>
          <Input
            placeholder="ör. Kıdemli Frontend Geliştirici"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          />
        </div>
        <div>
          <Label>Departman</Label>
          <Input
            placeholder="ör. Yazılım Geliştirme"
            value={formData.department}
            onChange={(e) => setFormData({ ...formData, department: e.target.value })}
          />
        </div>
        <div>
          <Label>Çalışma Şekli</Label>
          <div className="flex flex-wrap gap-2 mt-1.5">
            {["Tam Zamanlı", "Yarı Zamanlı", "Staj", "Freelance", "Sözleşmeli"].map((t) => (
              <Button
                key={t}
                variant={formData.type === t ? "default" : "outline"}
                size="sm"
                className="text-xs"
                onClick={() => setFormData({ ...formData, type: t })}
              >
                {t}
              </Button>
            ))}
          </div>
        </div>
        <div>
          <Label>Lokasyon *</Label>
          <Input
            placeholder="ör. Berlin, Almanya"
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
          />
        </div>
        <div>
          <Label>Çalışma Yeri</Label>
          <RadioGroup
            value={formData.locationType}
            onValueChange={(v) => setFormData({ ...formData, locationType: v })}
            className="flex gap-4 mt-1.5"
          >
            {[
              { value: "office", label: "Ofis" },
              { value: "remote", label: "Uzaktan" },
              { value: "hybrid", label: "Hibrit" },
            ].map((opt) => (
              <div key={opt.value} className="flex items-center space-x-2">
                <RadioGroupItem value={opt.value} id={opt.value} />
                <Label htmlFor={opt.value} className="text-sm cursor-pointer">{opt.label}</Label>
              </div>
            ))}
          </RadioGroup>
        </div>
        <div>
          <Label>Maaş Aralığı (€/ay)</Label>
          <div className="flex items-center gap-2 mt-1.5">
            <Input
              placeholder="Min"
              type="number"
              value={formData.salaryMin}
              onChange={(e) => setFormData({ ...formData, salaryMin: e.target.value })}
            />
            <span className="text-muted-foreground">—</span>
            <Input
              placeholder="Max"
              type="number"
              value={formData.salaryMax}
              onChange={(e) => setFormData({ ...formData, salaryMax: e.target.value })}
            />
          </div>
        </div>
        <div>
          <Label>Başvuru Bitiş Tarihi</Label>
          <Input type="date" className="mt-1.5" />
        </div>
        <div className="md:col-span-2 flex items-center justify-between p-3 rounded-lg border border-border bg-muted/40">
          <div>
            <p className="font-medium text-foreground text-sm">Firma ismini ilanda gizle</p>
            <p className="text-xs text-muted-foreground">Açıkça yayınlamak istemiyorsanız işletme adınız ilanda görünmez.</p>
          </div>
          <Switch checked={hideBusinessName} onCheckedChange={setHideBusinessName} />
        </div>
      </div>

      {/* Description */}
      <div className="space-y-4">
        <div>
          <Label>İş Tanımı *</Label>
          <Textarea
            placeholder="Pozisyon hakkında detaylı bilgi yazın..."
            rows={5}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
        </div>
        <div>
          <Label>Aranan Nitelikler *</Label>
          <Textarea
            placeholder="Aranan deneyim, beceri ve yetkinlikleri listeleyin..."
            rows={4}
            value={formData.requirements}
            onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
          />
        </div>
      </div>

      {/* Package Selection */}
      {!isEditing && (
        <div>
          <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
            <Tag className="h-4 w-4 text-primary" /> İlan Paketi Seçin
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {listingPackages.map((pkg) => (
              <button
                key={pkg.id}
                disabled={pkg.comingSoon}
                onClick={() => !pkg.comingSoon && setSelectedPackage(pkg.id)}
                className={`relative text-left p-5 rounded-xl border-2 transition-all ${
                  pkg.comingSoon
                    ? "border-border bg-muted/30 opacity-70 cursor-not-allowed"
                    : selectedPackage === pkg.id
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/30"
                }`}
              >
                {pkg.comingSoon && (
                  <Badge className="absolute top-3 right-3 text-sm font-bold px-3 py-1 bg-gold text-white border-0 shadow-md gap-1">
                    <Sparkles className="h-3.5 w-3.5" /> YAKINDA
                  </Badge>
                )}
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-bold text-foreground">{pkg.name}</h4>
                  {selectedPackage === pkg.id && !pkg.comingSoon && (
                    <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                      <Check className="h-3 w-3 text-primary-foreground" />
                    </div>
                  )}
                </div>
                <p className="text-2xl font-bold text-primary mb-1">
                  {pkg.price === 0 ? "Ücretsiz" : `€${pkg.price}`}
                </p>
                <p className="text-xs text-muted-foreground mb-3">{pkg.duration}</p>
                <ul className="space-y-1.5">
                  {pkg.features.map((f, i) => (
                    <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                      <Check className="h-3 w-3 text-turquoise shrink-0 mt-0.5" /> {f}
                    </li>
                  ))}
                </ul>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Order Summary */}
      <div className="bg-card border-2 border-primary/20 rounded-xl p-5">
        <h3 className="font-bold text-foreground mb-3 flex items-center gap-2">
          <CreditCard className="h-4 w-4 text-primary" /> Sipariş Özeti
        </h3>
        <div className="space-y-2 text-sm">
          {!isEditing && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">{listingPackages.find(p => p.id === selectedPackage)?.name}</span>
              <span className="text-foreground font-medium">
                {packagePrice === 0 ? "Ücretsiz" : `€${packagePrice}`}
              </span>
            </div>
          )}
          <div className="border-t border-border pt-2 mt-2 flex justify-between">
            <span className="font-bold text-foreground">Toplam</span>
            <span className="font-bold text-primary text-lg">
              {totalPrice === 0 ? "Ücretsiz" : `€${totalPrice}`}
            </span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <Button variant="outline" onClick={onClose} className="flex-1">İptal</Button>
        <Button onClick={handleSubmit} className="flex-1 gap-2">
          {totalPrice > 0 && <CreditCard className="h-4 w-4" />}
          {isEditing ? "Güncelle" : totalPrice > 0 ? `€${totalPrice} Öde & Yayınla` : "Ücretsiz Yayınla"}
        </Button>
      </div>
    </div>
  );
};

export default CreateJobListingForm;
