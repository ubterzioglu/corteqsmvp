import { useState, useEffect, useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import {
  Hospital, Calendar, Clock, MapPin, Star, Phone, Globe,
  CreditCard, Check, ArrowRight, Search, Filter, Heart, Stethoscope,
  Baby, Eye as EyeIcon, Bone, Brain, Pill
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useDiaspora } from "@/contexts/DiasporaContext";

const departments = [
  { key: "genel", label: "Genel Pratisyen", icon: Stethoscope },
  { key: "dahiliye", label: "Dahiliye", icon: Heart },
  { key: "ortopedi", label: "Ortopedi", icon: Bone },
  { key: "noroloji", label: "Nöroloji", icon: Brain },
  { key: "goz", label: "Göz Hastalıkları", icon: EyeIcon },
  { key: "cocuk", label: "Çocuk Sağlığı", icon: Baby },
  { key: "eczane", label: "Eczane", icon: Pill },
  { key: "dis", label: "Diş Hekimliği", icon: Stethoscope },
];

// Map entity IDs (from associations/businesses) to hospital mock data
const entityHospitalMap: Record<string, typeof mockHospitals[0]> = {
  // Association Hastane IDs
  "turkish-hospital-berlin": {
    id: "turkish-hospital-berlin", name: "Türk-Alman Sağlık Merkezi", city: "Berlin", country: "Almanya",
    rating: 4.8, reviews: 560, address: "Kurfürstendamm 45, 10719 Berlin",
    phone: "+49 30 886 789", turkishStaff: true, appointmentFee: 15,
    departments: ["genel", "dahiliye", "ortopedi", "goz", "dis", "cocuk"],
    image: "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=600&h=400&fit=crop",
    description: "Berlin'de Türk ve Alman doktorların birlikte hizmet verdiği tam donanımlı sağlık merkezi."
  },
  "turkish-clinic-london": {
    id: "turkish-clinic-london", name: "Anatolia Health Clinic", city: "Londra", country: "İngiltere",
    rating: 4.7, reviews: 320, address: "42 Harley Street, London W1G 9PR",
    phone: "+44 20 7946 0958", turkishStaff: true, appointmentFee: 20,
    departments: ["genel", "dahiliye", "goz", "dis"],
    image: "https://images.unsplash.com/photo-1538108149393-fbbd81895907?w=600&h=400&fit=crop",
    description: "Londra'da Türk doktorlar tarafından kurulan özel klinik."
  },
  "turkish-hospital-doha": {
    id: "turkish-hospital-doha", name: "Turkish Hospital Qatar", city: "Doha", country: "Katar",
    rating: 4.9, reviews: 890, address: "West Bay, Doha, Qatar",
    phone: "+974 4012 3456", turkishStaff: true, appointmentFee: 25,
    departments: ["genel", "dahiliye", "ortopedi", "noroloji", "cocuk", "goz"],
    image: "https://images.unsplash.com/photo-1586773860418-d37222d8fce3?w=600&h=400&fit=crop",
    description: "Doha'da Türk doktorlar ve sağlık profesyonelleri tarafından kurulan tam donanımlı hastane."
  },
  "turkish-medical-dubai": {
    id: "turkish-medical-dubai", name: "Turkish Medical Center Dubai", city: "Dubai", country: "BAE",
    rating: 4.8, reviews: 1200, address: "Dubai Healthcare City, Dubai",
    phone: "+971 4 435 8800", turkishStaff: true, appointmentFee: 22,
    departments: ["genel", "dahiliye", "ortopedi", "dis", "goz", "cocuk"],
    image: "https://images.unsplash.com/photo-1587351021759-3e566b6af7cc?w=600&h=400&fit=crop",
    description: "Dubai'de Türk sağlık profesyonelleri tarafından işletilen tıp merkezi."
  },
  // Business Sağlık IDs
  "turkish-hospital-qatar": {
    id: "turkish-hospital-qatar", name: "Turkish Hospital Qatar", city: "Doha", country: "Katar",
    rating: 4.9, reviews: 890, address: "West Bay, Doha, Qatar",
    phone: "+974 4012 3456", turkishStaff: true, appointmentFee: 25,
    departments: ["genel", "dahiliye", "ortopedi", "noroloji", "cocuk", "goz"],
    image: "https://images.unsplash.com/photo-1586773860418-d37222d8fce3?w=600&h=400&fit=crop",
    description: "Doha'da Türk doktorlar ve sağlık profesyonelleri tarafından kurulan tam donanımlı hastane."
  },
};

const mockHospitals = [
  {
    id: "h1", name: "Charité Universitätsmedizin", city: "Berlin", country: "Almanya",
    rating: 4.9, reviews: 1240, address: "Charitéplatz 1, 10117 Berlin",
    phone: "+49 30 450 50", turkishStaff: true, appointmentFee: 15,
    departments: ["genel", "dahiliye", "noroloji", "ortopedi", "cocuk"],
    image: "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=600&h=400&fit=crop",
    description: "Berlin'in en prestijli üniversite hastanesi. Türkçe konuşan personel mevcut."
  },
  {
    id: "h2", name: "Vivantes Klinikum", city: "Berlin", country: "Almanya",
    rating: 4.7, reviews: 890, address: "Landsberger Allee 49, 10249 Berlin",
    phone: "+49 30 130 10", turkishStaff: true, appointmentFee: 12,
    departments: ["genel", "dahiliye", "goz", "dis", "cocuk"],
    image: "https://images.unsplash.com/photo-1586773860418-d37222d8fce3?w=600&h=400&fit=crop",
    description: "Kapsamlı sağlık hizmetleri sunan modern hastane zinciri."
  },
  {
    id: "h3", name: "Royal London Hospital", city: "Londra", country: "İngiltere",
    rating: 4.8, reviews: 2100, address: "Whitechapel Rd, London E1 1FR",
    phone: "+44 20 7377 7000", turkishStaff: false, appointmentFee: 20,
    departments: ["genel", "dahiliye", "noroloji", "ortopedi"],
    image: "https://images.unsplash.com/photo-1538108149393-fbbd81895907?w=600&h=400&fit=crop",
    description: "İngiltere'nin önde gelen eğitim ve araştırma hastanesi."
  },
  {
    id: "h4", name: "Amsterdam UMC", city: "Amsterdam", country: "Hollanda",
    rating: 4.8, reviews: 1560, address: "Meibergdreef 9, Amsterdam",
    phone: "+31 20 566 9111", turkishStaff: true, appointmentFee: 18,
    departments: ["genel", "dahiliye", "goz", "cocuk", "noroloji"],
    image: "https://images.unsplash.com/photo-1551076805-e1869033e561?w=600&h=400&fit=crop",
    description: "Hollanda'nın en büyük akademik tıp merkezlerinden biri."
  },
  {
    id: "h5", name: "Mediclinic City Hospital", city: "Dubai", country: "BAE",
    rating: 4.9, reviews: 3200, address: "Dubai Healthcare City, Dubai",
    phone: "+971 4 435 9999", turkishStaff: true, appointmentFee: 25,
    departments: ["genel", "dahiliye", "ortopedi", "dis", "goz", "cocuk"],
    image: "https://images.unsplash.com/photo-1587351021759-3e566b6af7cc?w=600&h=400&fit=crop",
    description: "Dubai'nin en modern özel hastanesi. VIP Türkçe hizmet."
  },
  {
    id: "h6", name: "Hôpital Américain de Paris", city: "Paris", country: "Fransa",
    rating: 4.7, reviews: 980, address: "63 Boulevard Victor Hugo, Neuilly-sur-Seine",
    phone: "+33 1 46 41 25 25", turkishStaff: false, appointmentFee: 22,
    departments: ["genel", "dahiliye", "noroloji", "ortopedi", "goz"],
    image: "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=600&h=400&fit=crop",
    description: "Paris'in uluslararası hastalara özel prestijli hastanesi."
  },
];

const timeSlots = [
  "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
  "13:00", "13:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30"
];

const HospitalAppointment = () => {
  const { toast } = useToast();
  const { hospitalId } = useParams<{ hospitalId?: string }>();
  const { selectedCountry } = useDiaspora();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDept, setSelectedDept] = useState("all");
  const [bookingHospital, setBookingHospital] = useState<typeof mockHospitals[0] | null>(null);
  const [bookingStep, setBookingStep] = useState<"dept" | "time" | "info" | "payment" | "done">("dept");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [selectedBookingDept, setSelectedBookingDept] = useState("");
  const [patientName, setPatientName] = useState("");
  const [patientPhone, setPatientPhone] = useState("");
  const [patientNote, setPatientNote] = useState("");

  // If a specific hospital ID is provided, resolve it
  const directHospital = useMemo(() => {
    if (!hospitalId) return null;
    // Check entity map first, then mockHospitals
    return entityHospitalMap[hospitalId] || mockHospitals.find(h => h.id === hospitalId) || null;
  }, [hospitalId]);

  // Auto-set booking hospital when direct navigation
  useEffect(() => {
    if (directHospital) {
      setBookingHospital(directHospital);
      setBookingStep("dept");
    }
  }, [directHospital]);

  const filteredHospitals = mockHospitals.filter(h => {
    const matchesCountry = selectedCountry === "all" || h.country === selectedCountry;
    const matchesSearch = h.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      h.city.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDept = selectedDept === "all" || h.departments.includes(selectedDept);
    return matchesCountry && matchesSearch && matchesDept;
  });

  const resetBooking = () => {
    setBookingStep("dept");
    setSelectedDate("");
    setSelectedTime("");
    setSelectedBookingDept("");
    setPatientName("");
    setPatientPhone("");
    setPatientNote("");
    setBookingHospital(null);
  };

  const handleBook = () => {
    toast({
      title: "✅ Randevu Oluşturuldu!",
      description: `${bookingHospital?.name} - ${selectedDate} ${selectedTime}`,
    });
    resetBooking();
  };

  // Inline booking UI (reused for both direct and dialog modes)
  const renderBookingFlow = (hospital: typeof mockHospitals[0]) => (
    <div className="space-y-6">
      {/* Hospital info header */}
      <div className="flex items-start gap-4">
        <img src={hospital.image} alt={hospital.name} className="w-24 h-24 rounded-xl object-cover shrink-0" />
        <div>
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Hospital className="h-5 w-5 text-primary" /> {hospital.name}
          </h2>
          <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
            <MapPin className="h-3 w-3" /> {hospital.city}, {hospital.country}
          </p>
          <div className="flex items-center gap-2 mt-1">
            <Star className="h-3.5 w-3.5 fill-gold text-gold" />
            <span className="text-sm font-semibold">{hospital.rating}</span>
            <span className="text-xs text-muted-foreground">({hospital.reviews} değerlendirme)</span>
          </div>
          {hospital.turkishStaff && (
            <Badge className="bg-primary/10 text-primary text-[10px] mt-1">🇹🇷 Türkçe Personel</Badge>
          )}
        </div>
      </div>

      {/* Step: Department */}
      {bookingStep === "dept" && (
        <div className="space-y-4">
          <Label className="text-base font-semibold">Bölüm Seçin</Label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {hospital.departments.map(d => {
              const dept = departments.find(dep => dep.key === d);
              const Icon = dept?.icon || Stethoscope;
              return (
                <Button
                  key={d}
                  variant={selectedBookingDept === d ? "default" : "outline"}
                  size="sm"
                  className="justify-start gap-2"
                  onClick={() => setSelectedBookingDept(d)}
                >
                  <Icon className="h-4 w-4" /> {dept?.label}
                </Button>
              );
            })}
          </div>
          <Button className="w-full" disabled={!selectedBookingDept} onClick={() => setBookingStep("time")}>
            Devam <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      )}

      {/* Step: Date & Time */}
      {bookingStep === "time" && (
        <div className="space-y-4">
          <div>
            <Label>Tarih</Label>
            <Input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} min={new Date().toISOString().split("T")[0]} />
          </div>
          <div>
            <Label>Saat Seçin</Label>
            <div className="grid grid-cols-4 gap-1.5 mt-1">
              {timeSlots.map(t => (
                <Button
                  key={t}
                  variant={selectedTime === t ? "default" : "outline"}
                  size="sm"
                  className="text-xs"
                  onClick={() => setSelectedTime(t)}
                >
                  {t}
                </Button>
              ))}
            </div>
          </div>
          <Button className="w-full" disabled={!selectedDate || !selectedTime} onClick={() => setBookingStep("info")}>
            Devam <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      )}

      {/* Step: Patient Info */}
      {bookingStep === "info" && (
        <div className="space-y-3">
          <div>
            <Label>Ad Soyad</Label>
            <Input value={patientName} onChange={e => setPatientName(e.target.value)} placeholder="Tam adınız" />
          </div>
          <div>
            <Label>Telefon</Label>
            <Input value={patientPhone} onChange={e => setPatientPhone(e.target.value)} placeholder="+49 ..." />
          </div>
          <div>
            <Label>Not (opsiyonel)</Label>
            <Textarea value={patientNote} onChange={e => setPatientNote(e.target.value)} placeholder="Şikayetinizi kısaca yazın..." rows={3} />
          </div>
          <Button className="w-full" disabled={!patientName || !patientPhone} onClick={() => setBookingStep("payment")}>
            Ödemeye Geç <CreditCard className="h-4 w-4 ml-1" />
          </Button>
        </div>
      )}

      {/* Step: Payment */}
      {bookingStep === "payment" && (
        <div className="space-y-4">
          <div className="rounded-lg border border-border p-4 space-y-2 bg-muted/30">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Hastane</span>
              <span className="font-medium text-foreground">{hospital.name}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Bölüm</span>
              <span className="font-medium text-foreground">{departments.find(d => d.key === selectedBookingDept)?.label}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Tarih & Saat</span>
              <span className="font-medium text-foreground">{selectedDate} {selectedTime}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Hasta</span>
              <span className="font-medium text-foreground">{patientName}</span>
            </div>
            <div className="border-t border-border pt-2 flex justify-between font-bold">
              <span>Randevu Ücreti</span>
              <span className="text-primary">€{hospital.appointmentFee}</span>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Kart Numarası</Label>
            <Input placeholder="•••• •••• •••• ••••" />
            <div className="grid grid-cols-2 gap-2">
              <Input placeholder="AA/YY" />
              <Input placeholder="CVV" />
            </div>
          </div>
          <Button className="w-full" onClick={handleBook}>
            <Check className="h-4 w-4 mr-1" /> €{hospital.appointmentFee} Öde & Randevu Al
          </Button>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">

          {/* DIRECT HOSPITAL MODE: Show inline booking for the specific hospital */}
          {directHospital ? (
            <div className="max-w-2xl mx-auto">
              <Link to="/associations" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6">
                ← Geri dön
              </Link>
              <div className="bg-card rounded-2xl border border-border p-6 md:p-8 shadow-card">
                {renderBookingFlow(directHospital)}
              </div>
            </div>
          ) : (
            <>
              {/* GALLERY MODE: Header */}
              <div className="text-center mb-10">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Hospital className="h-8 w-8 text-primary" />
                  <h1 className="text-3xl font-bold text-foreground">Hastane Randevu</h1>
                </div>
                <p className="text-muted-foreground max-w-xl mx-auto">
                  Yaşadığınız ülkedeki hastanelerden kolayca online randevu alın. Türkçe konuşan personel bilgisi dahil.
                </p>
                <Badge variant="outline" className="mt-2 border-primary/30 text-primary">
                  <CreditCard className="h-3 w-3 mr-1" /> Randevu ücreti: €12 - €25
                </Badge>
              </div>

              {/* Filters */}
              <div className="flex flex-col sm:flex-row gap-3 mb-8 max-w-2xl mx-auto">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Hastane veya şehir ara..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Select value={selectedDept} onValueChange={setSelectedDept}>
                  <SelectTrigger className="w-full sm:w-48">
                    <SelectValue placeholder="Bölüm Seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tüm Bölümler</SelectItem>
                    {departments.map(d => (
                      <SelectItem key={d.key} value={d.key}>{d.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Hospital Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredHospitals.map(hospital => (
                  <Card key={hospital.id} className="border-border overflow-hidden hover:shadow-lg transition-shadow">
                    <div className="relative h-40">
                      <img src={hospital.image} alt={hospital.name} className="w-full h-full object-cover" />
                      {hospital.turkishStaff && (
                        <Badge className="absolute top-2 right-2 bg-primary text-primary-foreground text-[10px]">
                          🇹🇷 Türkçe Personel
                        </Badge>
                      )}
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-bold text-foreground mb-1">{hospital.name}</h3>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
                        <MapPin className="h-3 w-3" /> {hospital.city}, {hospital.country}
                      </div>
                      <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{hospital.description}</p>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-1">
                          <Star className="h-3.5 w-3.5 fill-gold text-gold" />
                          <span className="text-sm font-semibold text-foreground">{hospital.rating}</span>
                          <span className="text-xs text-muted-foreground">({hospital.reviews})</span>
                        </div>
                        <Badge variant="secondary" className="text-xs">€{hospital.appointmentFee} randevu</Badge>
                      </div>
                      <div className="flex flex-wrap gap-1 mb-3">
                        {hospital.departments.slice(0, 4).map(d => {
                          const dept = departments.find(dep => dep.key === d);
                          return (
                            <Badge key={d} variant="outline" className="text-[10px]">
                              {dept?.label}
                            </Badge>
                          );
                        })}
                        {hospital.departments.length > 4 && (
                          <Badge variant="outline" className="text-[10px]">+{hospital.departments.length - 4}</Badge>
                        )}
                      </div>

                      <Dialog open={bookingHospital?.id === hospital.id} onOpenChange={(open) => {
                        if (open) { setBookingHospital(hospital); setBookingStep("dept"); }
                        else resetBooking();
                      }}>
                        <DialogTrigger asChild>
                          <Button className="w-full" size="sm">
                            <Calendar className="h-4 w-4 mr-1" /> Randevu Al
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-md">
                          <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                              <Hospital className="h-5 w-5 text-primary" />
                              {hospital.name}
                            </DialogTitle>
                          </DialogHeader>
                          {renderBookingFlow(hospital)}
                        </DialogContent>
                      </Dialog>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {filteredHospitals.length === 0 && (
                <div className="text-center py-16">
                  <Hospital className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground">Bu kriterlere uygun hastane bulunamadı.</p>
                </div>
              )}
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default HospitalAppointment;
