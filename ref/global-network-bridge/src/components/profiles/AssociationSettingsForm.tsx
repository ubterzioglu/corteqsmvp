import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { FileText, Settings, Save, Users as UsersIcon, Plus, Trash2, Target } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ORGANIZATION_CATEGORIES, findOrgCategory } from "@/data/organizationCategories";
import { countryList } from "@/contexts/DiasporaContext";
import { countryCities } from "@/data/countryCities";

const STORAGE_KEY = "association_profile_v1";

export interface BoardMember {
  name: string;
  role: string;
}

export interface AssociationProfileData {
  name: string;
  categoryKey: string;
  subcategoryKey: string;
  description: string;
  email: string;
  phone: string;
  website: string;
  country: string;
  city: string;
  address: string;
  founded: string;
  mission: string;
  vision: string;
  activityAreas: string;
  boardMembers: BoardMember[];
}

export const defaultAssociationProfile: AssociationProfileData = {
  name: "",
  categoryKey: "",
  subcategoryKey: "",
  description: "",
  email: "",
  phone: "",
  website: "",
  country: "",
  city: "",
  address: "",
  founded: "",
  mission: "",
  vision: "",
  activityAreas: "",
  boardMembers: [],
};

export const loadAssociationProfile = (): AssociationProfileData => {
  if (typeof window === "undefined") return defaultAssociationProfile;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultAssociationProfile;
    const parsed = JSON.parse(raw);
    return {
      ...defaultAssociationProfile,
      ...parsed,
      boardMembers: Array.isArray(parsed.boardMembers) ? parsed.boardMembers : [],
    };
  } catch {
    return defaultAssociationProfile;
  }
};

interface Props {
  onSaved?: (data: AssociationProfileData) => void;
}

const AssociationSettingsForm = ({ onSaved }: Props) => {
  const { toast } = useToast();
  const [data, setData] = useState<AssociationProfileData>(defaultAssociationProfile);

  useEffect(() => { setData(loadAssociationProfile()); }, []);

  const update = <K extends keyof AssociationProfileData>(k: K, v: AssociationProfileData[K]) =>
    setData((d) => ({ ...d, [k]: v }));

  const cat = findOrgCategory(data.categoryKey);
  const cities = data.country && countryCities[data.country] ? countryCities[data.country] : [];

  const addBoardMember = () =>
    update("boardMembers", [...(data.boardMembers || []), { name: "", role: "" }]);
  const updateBoardMember = (i: number, k: keyof BoardMember, v: string) => {
    const next = [...(data.boardMembers || [])];
    next[i] = { ...next[i], [k]: v };
    update("boardMembers", next);
  };
  const removeBoardMember = (i: number) =>
    update("boardMembers", (data.boardMembers || []).filter((_, idx) => idx !== i));

  const handleSave = () => {
    if (!data.name.trim()) {
      toast({ title: "Kuruluş adı zorunlu", variant: "destructive" });
      return;
    }
    if (!data.categoryKey) {
      toast({ title: "Kategori seçin", variant: "destructive" });
      return;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    toast({ title: "Kaydedildi", description: "Kuruluş bilgileri güncellendi." });
    onSaved?.(data);
    window.dispatchEvent(new Event("association-profile-updated"));
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Genel bilgiler */}
      <div className="bg-card rounded-2xl border border-border p-6 shadow-card">
        <h2 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" /> Kuruluş Bilgileri
        </h2>
        <div className="space-y-4">
          <div>
            <Label>Kuruluş Adı *</Label>
            <Input value={data.name} onChange={(e) => update("name", e.target.value)} placeholder="Örn. Almanya Türk Toplumu Derneği" />
          </div>

          <div>
            <Label>Ana Kategori *</Label>
            <Select value={data.categoryKey} onValueChange={(v) => { update("categoryKey", v); update("subcategoryKey", ""); }}>
              <SelectTrigger><SelectValue placeholder="Kategori seçin" /></SelectTrigger>
              <SelectContent>
                {ORGANIZATION_CATEGORIES.map((c) => (
                  <SelectItem key={c.key} value={c.key}>{c.icon} {c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {cat && (
            <div>
              <Label>Tür (Alt Kategori) *</Label>
              <Select value={data.subcategoryKey} onValueChange={(v) => update("subcategoryKey", v)}>
                <SelectTrigger><SelectValue placeholder="Tür seçin" /></SelectTrigger>
                <SelectContent>
                  {cat.subcategories.map((s) => (
                    <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div>
            <Label>Tanıtım Metni</Label>
            <Textarea
              rows={4}
              value={data.description}
              onChange={(e) => update("description", e.target.value)}
              placeholder="Kuruluşunuzu kısaca tanıtın..."
              maxLength={500}
            />
          </div>

          <div>
            <Label>Kuruluş Yılı</Label>
            <Input
              type="number"
              value={data.founded}
              onChange={(e) => update("founded", e.target.value)}
              placeholder="2008"
            />
          </div>
        </div>
      </div>

      {/* İletişim & adres */}
      <div className="bg-card rounded-2xl border border-border p-6 shadow-card">
        <h2 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
          <Settings className="h-5 w-5 text-primary" /> İletişim & Adres
        </h2>
        <div className="space-y-4">
          <div>
            <Label>E-posta</Label>
            <Input type="email" value={data.email} onChange={(e) => update("email", e.target.value)} placeholder="iletisim@dernek.de" />
          </div>
          <div>
            <Label>Telefon</Label>
            <Input value={data.phone} onChange={(e) => update("phone", e.target.value)} placeholder="+49 30 1234567" />
          </div>
          <div>
            <Label>Web Sitesi</Label>
            <Input value={data.website} onChange={(e) => update("website", e.target.value)} placeholder="dernek.de" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Ülke</Label>
              <Select value={data.country} onValueChange={(v) => { update("country", v); update("city", ""); }}>
                <SelectTrigger><SelectValue placeholder="Ülke" /></SelectTrigger>
                <SelectContent>
                  {countryList.filter((c) => c !== "all").map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Şehir</Label>
              <Select value={data.city} onValueChange={(v) => update("city", v)} disabled={!data.country}>
                <SelectTrigger><SelectValue placeholder={data.country ? "Şehir" : "Önce ülke seçin"} /></SelectTrigger>
                <SelectContent>
                  {cities.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Açık Adres</Label>
            <Textarea
              rows={3}
              value={data.address}
              onChange={(e) => update("address", e.target.value)}
              placeholder="Sokak, No, Posta Kodu..."
            />
          </div>
        </div>
      </div>

      {/* Hakkında — Misyon / Vizyon / Faaliyet Alanları */}
      <div className="bg-card rounded-2xl border border-border p-6 shadow-card">
        <h2 className="text-xl font-bold text-foreground mb-2 flex items-center gap-2">
          <Target className="h-5 w-5 text-turquoise" /> Hakkında
        </h2>
        <p className="text-xs text-muted-foreground mb-4">
          Bu alanlar profil sayfanızın "Hakkında" sekmesinde gösterilir.
        </p>
        <div className="space-y-4">
          <div>
            <Label>Misyon</Label>
            <Textarea
              rows={3}
              value={data.mission}
              onChange={(e) => update("mission", e.target.value)}
              placeholder="Diaspora kimliğini güçlendirmek, üyeler arası dayanışmayı artırmak."
            />
          </div>
          <div>
            <Label>Vizyon</Label>
            <Textarea
              rows={3}
              value={data.vision}
              onChange={(e) => update("vision", e.target.value)}
              placeholder="Bölgenin en aktif ve referans alınan kuruluşu olmak."
            />
          </div>
          <div>
            <Label>Faaliyet Alanları</Label>
            <Textarea
              rows={3}
              value={data.activityAreas}
              onChange={(e) => update("activityAreas", e.target.value)}
              placeholder="Eğitim, kültür-sanat, sosyal yardım, gençlik programları."
            />
          </div>
        </div>
      </div>

      {/* Yönetim Kurulu */}
      <div className="bg-card rounded-2xl border border-border p-6 shadow-card">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <UsersIcon className="h-5 w-5 text-turquoise" /> Yönetim Kurulu
          </h2>
          <Button variant="outline" size="sm" className="gap-1" onClick={addBoardMember}>
            <Plus className="h-3.5 w-3.5" /> Üye Ekle
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mb-4">
          Profil sayfanızdaki "Hakkında" sekmesinin yanında listelenir.
        </p>

        {(data.boardMembers || []).length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-muted/30 p-6 text-center text-sm text-muted-foreground">
            Henüz yönetim kurulu üyesi eklenmedi.
          </div>
        ) : (
          <div className="space-y-3">
            {data.boardMembers.map((m, i) => (
              <div key={i} className="grid grid-cols-[1fr,1fr,auto] gap-2 items-end">
                <div>
                  <Label className="text-xs">İsim</Label>
                  <Input
                    value={m.name}
                    onChange={(e) => updateBoardMember(i, "name", e.target.value)}
                    placeholder="Mehmet Yıldız"
                  />
                </div>
                <div>
                  <Label className="text-xs">Görev</Label>
                  <Input
                    value={m.role}
                    onChange={(e) => updateBoardMember(i, "role", e.target.value)}
                    placeholder="Başkan"
                  />
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeBoardMember(i)}
                  aria-label="Üyeyi sil"
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="lg:col-span-2">
        <Button className="w-full gap-2" onClick={handleSave}>
          <Save className="h-4 w-4" /> Bilgileri Kaydet
        </Button>
      </div>
    </div>
  );
};

export default AssociationSettingsForm;
