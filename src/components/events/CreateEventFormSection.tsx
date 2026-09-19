import { useState } from "react";
import { Calendar, Plus, X } from "lucide-react";

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useCreateEvent } from "@/hooks/use-events";

const CATEGORIES = [
  { value: "networking", label: "Networking" },
  { value: "egitim", label: "Eğitim" },
  { value: "kultur", label: "Kültür & Sanat" },
  { value: "is", label: "İş & Kariyer" },
  { value: "sosyal", label: "Sosyal" },
  { value: "spor", label: "Spor" },
];

const EVENT_TYPES = [
  { value: "yuz yuze", label: "Fiziksel" },
  { value: "online", label: "Dijital" },
  { value: "hybrid", label: "Hibrit" },
];

interface CreateEventFormSectionProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateEventFormSection({ open, onOpenChange }: CreateEventFormSectionProps) {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const createEventMutation = useCreateEvent();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [type, setType] = useState("yuz yuze");
  const [eventDate, setEventDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [country, setCountry] = useState("");
  const [city, setCity] = useState("");
  const [location, setLocation] = useState("");
  const [onlineUrl, setOnlineUrl] = useState("");
  const [price, setPrice] = useState("");
  const [maxAttendees, setMaxAttendees] = useState("");
  const [coverImage, setCoverImage] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [organizerName, setOrganizerName] = useState(profile?.full_name ?? "");
  const [registrationUrl, setRegistrationUrl] = useState("");

  const showPhysicalFields = type === "yuz yuze" || type === "hybrid";
  const showOnlineFields = type === "online" || type === "hybrid";

  const handleAddTag = () => {
    const trimmed = tagInput.trim();
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
      setTagInput("");
    }
  };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  const handleSubmit = async () => {
    if (!title.trim() || !description.trim() || !category || !eventDate) {
      toast({
        title: "Eksik alan",
        description: "Baslik, aciklama, kategori ve tarih zorunludur.",
        variant: "destructive",
      });
      return;
    }

    if (!user) {
      toast({
        title: "Uye olmalisiniz",
        description: "Etkinlik olusturmak icin once uye olmalisiniz. Google ile giris yapiliyor...",
      });

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: new URL("/events", window.location.origin).toString(),
        },
      });

      if (error) {
        toast({
          title: "Google girisi baslatilamadi",
          description: error.message,
          variant: "destructive",
        });
      }
      return;
    }

    try {
      await createEventMutation.mutateAsync({
        userId: user.id,
        title: title.trim(),
        description: description.trim(),
        category,
        type: type as "yuz yuze" | "online" | "hybrid",
        eventDate,
        startTime: startTime || null,
        endTime: endTime || null,
        country: country || null,
        city: city || null,
        location: location || null,
        onlineUrl: onlineUrl || null,
        price: price ? Number(price) : null,
        maxAttendees: maxAttendees ? Number(maxAttendees) : null,
        coverImage: coverImage || null,
        tags,
        organizerName: organizerName || null,
        organizerType: "member",
        registrationUrl: registrationUrl || null,
      });

      toast({
        title: "Etkinliginiz alindi",
        description: "Admin onayindan sonra listede yayinlanacak.",
      });

      setTitle("");
      setDescription("");
      setCategory("");
      setType("yuz yuze");
      setEventDate("");
      setStartTime("");
      setEndTime("");
      setCountry("");
      setCity("");
      setLocation("");
      setOnlineUrl("");
      setPrice("");
      setMaxAttendees("");
      setCoverImage("");
      setTags([]);
      setTagInput("");
      setOrganizerName(profile?.full_name ?? "");
      setRegistrationUrl("");
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Gonderilemedi",
        description: error instanceof Error ? error.message : "Beklenmeyen hata",
        variant: "destructive",
      });
    }
  };

  const formFieldInsetClass = "mx-0.5 w-[calc(100%-4px)]";

  return (
    <div className="mt-8 rounded-[1.9rem] border border-violet-200/70 bg-[linear-gradient(135deg,rgba(245,243,255,0.96)_0%,rgba(255,255,255,0.98)_42%,rgba(239,246,255,0.94)_100%)] p-3 shadow-[0_20px_60px_rgba(15,23,42,0.08)] ring-1 ring-white/80 backdrop-blur-sm">
      <Accordion
        type="single"
        collapsible
        value={open ? "event-form" : ""}
        onValueChange={(value) => onOpenChange(value === "event-form")}
      >
        <AccordionItem
          value="event-form"
          className="overflow-hidden rounded-[1.45rem] border border-violet-200/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(245,243,255,0.92)_100%)]"
        >
          <AccordionTrigger className="px-5 py-4 text-left text-base font-bold text-slate-900 hover:no-underline">
            {open ? "Formu kapat" : "Etkinlik Eklemek Istiyorum — Formu Ac"}
          </AccordionTrigger>
          <AccordionContent className="border-t border-violet-100 px-5 pb-5 pt-4">
            <div className="mb-5">
              <h3 className="text-left text-xl font-bold text-slate-900">Etkinlik Ekle</h3>
              <p className="mt-1 text-left text-sm text-slate-600">
                Asagidaki bilgileri doldur. Etkinlik admin onayindan sonra listede gorunecek.
              </p>
            </div>

            <div className="space-y-5">
              <div className="space-y-3">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Etkinlik Bilgileri</h3>

                <div>
                  <Label htmlFor="event-title">Etkinlik Basligi *</Label>
                  <Input
                    id="event-title"
                    className={formFieldInsetClass}
                    lang="tr"
                    spellCheck
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    placeholder="Orn: Berlin Turk Girisimciler Bulusmasi"
                  />
                </div>

                <div>
                  <Label htmlFor="event-description">Aciklama *</Label>
                  <Textarea
                    id="event-description"
                    className={formFieldInsetClass}
                    lang="tr"
                    spellCheck
                    rows={3}
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    placeholder="Etkinlik hakkinda detayli bilgi..."
                  />
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="event-category">Kategori *</Label>
                    <Select value={category} onValueChange={setCategory}>
                      <SelectTrigger id="event-category" className={formFieldInsetClass}>
                        <SelectValue placeholder="Secin" />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map((c) => (
                          <SelectItem key={c.value} value={c.value}>
                            {c.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="event-type">Etkinlik Turu *</Label>
                    <Select value={type} onValueChange={setType}>
                      <SelectTrigger id="event-type" className={formFieldInsetClass}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {EVENT_TYPES.map((t) => (
                          <SelectItem key={t.value} value={t.value}>
                            {t.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <div>
                    <Label htmlFor="event-date">Tarih *</Label>
                    <Input
                      id="event-date"
                      type="date"
                      className={formFieldInsetClass}
                      value={eventDate}
                      onChange={(event) => setEventDate(event.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="start-time">Baslangic Saati</Label>
                    <Input
                      id="start-time"
                      type="time"
                      className={formFieldInsetClass}
                      value={startTime}
                      onChange={(event) => setStartTime(event.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="end-time">Bitis Saati</Label>
                    <Input
                      id="end-time"
                      type="time"
                      className={formFieldInsetClass}
                      value={endTime}
                      onChange={(event) => setEndTime(event.target.value)}
                    />
                  </div>
                </div>

                {showPhysicalFields && (
                  <div className="rounded-lg border border-violet-200/50 p-4 space-y-3">
                    <h4 className="text-sm font-semibold text-slate-700">Fiziksel Mekan Bilgileri</h4>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <Label htmlFor="event-country">Ulke</Label>
                        <Input
                          id="event-country"
                          className={formFieldInsetClass}
                          lang="tr"
                          spellCheck
                          value={country}
                          onChange={(event) => setCountry(event.target.value)}
                          placeholder="Orn: Almanya"
                        />
                      </div>
                      <div>
                        <Label htmlFor="event-city">Sehir</Label>
                        <Input
                          id="event-city"
                          className={formFieldInsetClass}
                          lang="tr"
                          spellCheck
                          value={city}
                          onChange={(event) => setCity(event.target.value)}
                          placeholder="Orn: Berlin"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="event-location">Adres / Mekan</Label>
                      <Input
                        id="event-location"
                        className={formFieldInsetClass}
                        lang="tr"
                        spellCheck
                        value={location}
                        onChange={(event) => setLocation(event.target.value)}
                        placeholder="Mekan adi veya adres"
                      />
                    </div>
                  </div>
                )}

                {showOnlineFields && (
                  <div className="rounded-lg border border-violet-200/50 p-4 space-y-3">
                    <h4 className="text-sm font-semibold text-slate-700">Dijital Katilim Bilgileri</h4>
                    <div>
                      <Label htmlFor="event-online-url">Online Katilim Baglantisi</Label>
                      <Input
                        id="event-online-url"
                        type="url"
                        className={formFieldInsetClass}
                        value={onlineUrl}
                        onChange={(event) => setOnlineUrl(event.target.value)}
                        placeholder="https://zoom.us/j/..."
                      />
                    </div>
                  </div>
                )}

                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="event-price">Fiyat (EUR)</Label>
                    <Input
                      id="event-price"
                      type="number"
                      min="0"
                      step="0.01"
                      className={formFieldInsetClass}
                      value={price}
                      onChange={(event) => setPrice(event.target.value)}
                      placeholder="Ucretsiz ise bos birakin"
                    />
                  </div>
                  <div>
                    <Label htmlFor="event-max-attendees">Maks. Katilimci</Label>
                    <Input
                      id="event-max-attendees"
                      type="number"
                      min="1"
                      className={formFieldInsetClass}
                      value={maxAttendees}
                      onChange={(event) => setMaxAttendees(event.target.value)}
                      placeholder="Sinirsiz ise bos birakin"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="event-cover">Kapak Gorseli URL</Label>
                  <Input
                    id="event-cover"
                    type="url"
                    className={formFieldInsetClass}
                    value={coverImage}
                    onChange={(event) => setCoverImage(event.target.value)}
                    placeholder="https://..."
                  />
                </div>

                <div>
                  <Label htmlFor="event-organizer">Duzenleyen Adi</Label>
                  <Input
                    id="event-organizer"
                    className={formFieldInsetClass}
                    lang="tr"
                    spellCheck
                    value={organizerName}
                    onChange={(event) => setOrganizerName(event.target.value)}
                    placeholder="Organizator adi"
                  />
                </div>

                <div>
                  <Label htmlFor="event-registration">Kayit Baglantisi</Label>
                  <Input
                    id="event-registration"
                    type="url"
                    className={formFieldInsetClass}
                    value={registrationUrl}
                    onChange={(event) => setRegistrationUrl(event.target.value)}
                    placeholder="https://... (harici kayit sayfasi)"
                  />
                </div>

                <div>
                  <Label>Etiketler</Label>
                  <div className="flex gap-2">
                    <Input
                      value={tagInput}
                      onChange={(event) => setTagInput(event.target.value)}
                      placeholder="Etiket ekle"
                      className={formFieldInsetClass}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault();
                          handleAddTag();
                        }
                      }}
                    />
                    <Button type="button" variant="outline" size="icon" onClick={handleAddTag}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  {tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {tags.map((tag) => (
                        <span key={tag} className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-0.5 text-xs text-secondary-foreground">
                          {tag}
                          <button type="button" onClick={() => handleRemoveTag(tag)} className="rounded-full hover:bg-accent">
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <Button
                className="w-full bg-violet-600 text-white hover:bg-violet-700"
                onClick={handleSubmit}
                disabled={createEventMutation.isPending}
              >
                {createEventMutation.isPending ? "Gonderiliyor..." : user ? "Etkinligi Gonder" : "Uye Ol ve Gonder"}
              </Button>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
