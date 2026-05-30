import { useState } from "react";
import { Gift, Plane, Car, Bus, Baby, PawPrint, Calendar, Users, MapPin, X, UserCheck, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import ConsentCheckboxes, { emptyConsent, isConsentValid, type ConsentState } from "@/components/ConsentCheckboxes";

const COUNTRIES = [
  "Almanya", "Hollanda", "İngiltere", "Fransa", "ABD", "Kanada", "Avustralya",
  "İsviçre", "Avusturya", "Belçika", "İsveç", "Norveç", "Danimarka"
];

interface WelcomePackOrderFormProps {
  trigger?: React.ReactNode;
  defaultCountry?: string;
  defaultCity?: string;
  defaultAdults?: number;
  defaultChildren?: number;
  onSuccess?: () => void;
}

interface WelcomePackFormState {
  country: string;
  city: string;
  arrivalDate: string;
  adults: number;
  children: number;
  hasPet: boolean;
  petDetails: string;
  needsBabySeat: boolean;
  needsAirportTransfer: boolean;
  needsCarRental: boolean;
  needsFlightDiscount: boolean;
  needsMentor: boolean;
  needsSimCard: boolean;
  mentorType: "" | "paid" | "volunteer";
  notes: string;
}

const WelcomePackOrderForm = ({
  trigger,
  defaultCountry = "",
  defaultCity = "",
  defaultAdults = 1,
  defaultChildren = 0,
  onSuccess,
}: WelcomePackOrderFormProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState<WelcomePackFormState>({
    country: defaultCountry,
    city: defaultCity,
    arrivalDate: "",
    adults: defaultAdults,
    children: defaultChildren,
    hasPet: false,
    petDetails: "",
    needsBabySeat: false,
    needsAirportTransfer: false,
    needsCarRental: false,
    needsFlightDiscount: false,
    needsMentor: false,
    needsSimCard: false,
    mentorType: "" as "" | "paid" | "volunteer",
    notes: "",
  });
  const [consent, setConsent] = useState<ConsentState>(emptyConsent);

  const update = <K extends keyof WelcomePackFormState>(field: K, value: WelcomePackFormState[K]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!user) {
      toast({ title: "Giriş yapmalısınız", variant: "destructive" });
      return;
    }
    if (!form.country || !form.arrivalDate) {
      toast({ title: "Ülke ve geliş tarihi zorunlu", variant: "destructive" });
      return;
    }
    if (!isConsentValid(consent)) {
      toast({ title: "Onay gerekli", description: "KVKK / GDPR onaylarını işaretleyin.", variant: "destructive" });
      return;
    }

    setLoading(true);
    const { error } = await supabase.from("welcome_pack_orders").insert({
      user_id: user.id,
      country: form.country,
      city: form.city,
      arrival_date: form.arrivalDate,
      adults: form.adults,
      children: form.children,
      has_pet: form.hasPet,
      pet_details: form.petDetails || null,
      needs_baby_seat: form.needsBabySeat,
      needs_airport_transfer: form.needsAirportTransfer,
      needs_car_rental: form.needsCarRental,
      needs_flight_discount: form.needsFlightDiscount,
      needs_sim_card: form.needsSimCard,
      needs_mentor: form.needsMentor,
      mentor_type: form.mentorType || null,
      notes: form.notes || null,
    });

    setLoading(false);
    if (error) {
      toast({ title: "Hata oluştu", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "🎉 Hoşgeldin Paketi oluşturuldu!", description: "İşletme ve danışmanlardan teklifler gelecek." });
      setOpen(false);
      onSuccess?.();
    }
  };

  const defaultTrigger = (
    <Button variant="hero" className="gap-2">
      <Gift className="h-4 w-4" /> Hoşgeldin Paketi Oluştur
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger || defaultTrigger}</DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Gift className="h-5 w-5 text-primary" />
            Hoşgeldin Paketi Oluştur
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {/* Country & City */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5" /> Ülke *
              </Label>
              <Select value={form.country} onValueChange={v => update("country", v)}>
                <SelectTrigger><SelectValue placeholder="Ülke seçin" /></SelectTrigger>
                <SelectContent>
                  {COUNTRIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Şehir</Label>
              <Input placeholder="Örn: Berlin" value={form.city} onChange={e => update("city", e.target.value)} />
            </div>
          </div>

          {/* Arrival Date */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" /> Geliş Tarihi *
            </Label>
            <Input type="date" value={form.arrivalDate} onChange={e => update("arrivalDate", e.target.value)} />
          </div>

          {/* People */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5" /> Yetişkin
              </Label>
              <Input type="number" min={1} max={10} value={form.adults} onChange={e => update("adults", parseInt(e.target.value) || 1)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Çocuk</Label>
              <Input type="number" min={0} max={10} value={form.children} onChange={e => update("children", parseInt(e.target.value) || 0)} />
            </div>
          </div>

          {/* Service Needs */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold">İhtiyaçlar</Label>
            <div className="grid grid-cols-1 gap-2">
              {[
                { key: "needsFlightDiscount", icon: Plane, label: "✈️ Uçak Bileti İndirimi" },
                { key: "needsSimCard", icon: Smartphone, label: "📱 Mobil SIM Kart" },
                { key: "needsAirportTransfer", icon: Bus, label: "🚐 Havaalanı Transferi" },
                { key: "needsCarRental", icon: Car, label: "🚗 Araç Kiralama" },
                { key: "needsBabySeat", icon: Baby, label: "👶 Bebek Koltuğu" },
                { key: "needsMentor", icon: UserCheck, label: "🧭 Relokasyon Mentörü" },
              ].map(item => (
                <label key={item.key} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors cursor-pointer">
                  <Checkbox
                    checked={form[item.key as keyof Pick<WelcomePackFormState, "needsFlightDiscount" | "needsSimCard" | "needsAirportTransfer" | "needsCarRental" | "needsBabySeat" | "needsMentor">]}
                    onCheckedChange={v => update(item.key as keyof Pick<WelcomePackFormState, "needsFlightDiscount" | "needsSimCard" | "needsAirportTransfer" | "needsCarRental" | "needsBabySeat" | "needsMentor">, !!v)}
                  />
                  <span className="text-sm font-medium">{item.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Mentor Type */}
          {form.needsMentor && (
            <div className="space-y-2 ml-2">
              <Label className="text-sm font-medium">Mentör Tercihi</Label>
              <Select value={form.mentorType} onValueChange={v => update("mentorType", v as WelcomePackFormState["mentorType"])}>
                <SelectTrigger><SelectValue placeholder="Ücretli / Gönüllü" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="paid">💼 Ücretli Mentör</SelectItem>
                  <SelectItem value="volunteer">🤝 Gönüllü Mentör</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Pet */}
          <div className="space-y-2">
            <label className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors cursor-pointer">
              <Checkbox checked={form.hasPet} onCheckedChange={v => update("hasPet", !!v)} />
              <span className="text-sm font-medium flex items-center gap-1.5">
                <PawPrint className="h-3.5 w-3.5" /> Evcil Hayvan Var
              </span>
            </label>
            {form.hasPet && (
              <Input
                placeholder="Hayvan türü, boyutu, kafes ihtiyacı..."
                value={form.petDetails}
                onChange={e => update("petDetails", e.target.value)}
                className="ml-8"
              />
            )}
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Ek Notlar</Label>
            <Textarea
              placeholder="Özel istekleriniz, tercihleriniz..."
              value={form.notes}
              onChange={e => update("notes", e.target.value)}
              rows={2}
            />
          </div>

          <ConsentCheckboxes compact value={consent} onChange={setConsent} />

          <Button onClick={handleSubmit} disabled={loading || !isConsentValid(consent)} className="w-full gap-2" variant="hero" size="lg">
            <Gift className="h-4 w-4" />
            {loading ? "Oluşturuluyor..." : "🎉 Paketi Oluştur ve Teklif Al"}
          </Button>

          <p className="text-[11px] text-muted-foreground text-center">
            Paketiniz oluşturulduğunda platform üzerindeki işletme ve danışmanlardan otomatik teklifler gelecektir.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WelcomePackOrderForm;
