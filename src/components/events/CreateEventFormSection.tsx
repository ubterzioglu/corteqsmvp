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
  { value: "eğitim", label: "Eğitim" },
  { value: "kültür", label: "Kültür & Sanat" },
  { value: "iş", label: "İş & Kariyer" },
  { value: "sosyal", label: "Sosyal" },
  { value: "spor", label: "Spor" },
];

const EVENT_TYPES = [
  { value: "yüz yüze", label: "Fiziksel" },
  { value: "online", label: "Dijital" },
  { value: "hybrid", label: "Hibrit" },
];

interface CreateEventFormSectionProps {
  isSignedIn: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateEventFormSection({ isSignedIn, open, onOpenChange }: CreateEventFormSectionProps) {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const createEventMutation = useCreateEvent();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [type, setType] = useState("yüz yüze");
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
  const [oauthSubmitting, setOauthSubmitting] = useState(false);

  const showPhysicalFields = type === "yüz yüze" || type === "hybrid";
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

  const startGoogleAuthForEventForm = async () => {
    if (user) {
      onOpenChange(true);
      return true;
    }

    setOauthSubmitting(true);

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: new URL("/events", window.location.origin).toString(),
      },
    });

    if (error) {
      toast({
        title: "Google girişi başlatılamadı",
        description: error.message,
        variant: "destructive",
      });
      setOauthSubmitting(false);
      return false;
    }

    return false;
  };

  const handleSubmit = async () => {
    if (!user) {
      toast({
        title: "Üye olmalısınız",
        description: "Etkinlik oluşturmak için önce üye olmalısınız. Google ile giriş yapılıyor...",
      });
      await startGoogleAuthForEventForm();
      return;
    }

    if (!title.trim() || !description.trim() || !category || !eventDate) {
      toast({
        title: "Eksik alan",
        description: "Başlık, açıklama, kategori ve tarih zorunludur.",
        variant: "destructive",
      });
      return;
    }

    try {
      await createEventMutation.mutateAsync({
        userId: user.id,
        title: title.trim(),
        description: description.trim(),
        category,
        type: type as "yüz yüze" | "online" | "hybrid",
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
        title: "Etkinliğiniz alındı",
        description: "Admin onayından sonra listede yayınlanacak.",
      });

      setTitle("");
      setDescription("");
      setCategory("");
      setType("yüz yüze");
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
        title: "Gönderilemedi",
        description: error instanceof Error ? error.message : "Beklenmeyen hata",
        variant: "destructive",
      });
    }
  };

  const formFieldInsetClass = "mx-0.5 w-[calc(100%-4px)]";

  return (
    <div className="mt-8 rounded-[1.9rem] border border-violet-200/70 bg-[linear-gradient(135deg,rgba(245,243,255,0.96)_0%,rgba(255,255,255,0.98)_42%,rgba(239,246,255,0.94)_100%)] p-3 shadow-[0_20px_60px_rgba(15,23,42,0.08)] ring-1 ring-white/80 backdrop-blur-sm">
      <div className="rounded-[1.45rem] bg-white/55 p-4 md:p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-3 text-left">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[linear-gradient(135deg,#f5f3ff_0%,#ede9fe_100%)] shadow-[0_10px_24px_rgba(139,92,246,0.16)] ring-1 ring-violet-200/80">
              <Calendar className="h-4.5 w-4.5 text-violet-700" />
            </span>
            <div className="space-y-1">
              <h2 className="text-base font-bold tracking-[0.01em] text-slate-900 md:text-lg">Etkinlik Eklemek İstiyorum</h2>
              <p className="text-sm text-slate-600">
                Etkinliğini ekle, admin onayından sonra listede yayınlanacak.
              </p>
            </div>
          </div>

          <Button
            type="button"
            className="w-full bg-violet-600 text-white hover:bg-violet-700 md:w-auto"
            onClick={startGoogleAuthForEventForm}
            disabled={oauthSubmitting || createEventMutation.isPending}
          >
            {oauthSubmitting
              ? "Google'a yönlendiriliyor..."
              : isSignedIn
                ? "Etkinlik ekleme formunu aç"
                : "Google ile etkinlik ekle"}
          </Button>
        </div>
      </div>
      <Accordion
        type="single"
        collapsible
        value={open ? "event-form" : ""}
        onValueChange={(value) => onOpenChange(value === "event-form")}
        className="mt-3"
      >
        <AccordionItem
          value="event-form"
          className="overflow-hidden rounded-[1.45rem] border border-violet-200/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(245,243,255,0.92)_100%)]"
        >
          <AccordionTrigger className="px-5 py-4 text-left text-base font-bold text-slate-900 hover:no-underline">
            {open ? "Formu kapat" : "Formu aç"}
          </AccordionTrigger>
          <AccordionContent className="border-t border-violet-100 px-5 pb-5 pt-4">
            <div className="mb-5">
              <h3 className="text-left text-xl font-bold text-slate-900">Etkinlik Ekle</h3>
              <p className="mt-1 text-left text-sm text-slate-600">
                Aşağıdaki bilgileri doldur. Etkinlik admin onayından sonra listede görünecek.
              </p>
            </div>

            <div className="space-y-5">
              <div className="space-y-3">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Etkinlik Bilgileri</h3>

                <div>
                  <Label htmlFor="event-title">Etkinlik Başlığı *</Label>
                  <Input
                    id="event-title"
                    className={formFieldInsetClass}
                    lang="tr"
                    spellCheck
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    placeholder="Örn: Berlin Türk Girişimciler Buluşması"
                  />
                </div>

                <div>
                  <Label htmlFor="event-description">Açıklama *</Label>
                  <Textarea
                    id="event-description"
                    className={formFieldInsetClass}
                    lang="tr"
                    spellCheck
                    rows={3}
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    placeholder="Etkinlik hakkında detaylı bilgi..."
                  />
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="event-category">Kategori *</Label>
                    <Select value={category} onValueChange={setCategory}>
                      <SelectTrigger id="event-category" className={formFieldInsetClass}>
                        <SelectValue placeholder="Seçin" />
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
                    <Label htmlFor="event-type">Etkinlik Türü *</Label>
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
                    <Label htmlFor="start-time">Başlangıç Saati</Label>
                    <Input
                      id="start-time"
                      type="time"
                      className={formFieldInsetClass}
                      value={startTime}
                      onChange={(event) => setStartTime(event.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="end-time">Bitiş Saati</Label>
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
                        <Label htmlFor="event-country">Ülke</Label>
                        <Input
                          id="event-country"
                          className={formFieldInsetClass}
                          lang="tr"
                          spellCheck
                          value={country}
                          onChange={(event) => setCountry(event.target.value)}
                          placeholder="Örn: Almanya"
                        />
                      </div>
                      <div>
                        <Label htmlFor="event-city">Şehir</Label>
                        <Input
                          id="event-city"
                          className={formFieldInsetClass}
                          lang="tr"
                          spellCheck
                          value={city}
                          onChange={(event) => setCity(event.target.value)}
                          placeholder="Örn: Berlin"
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
                        placeholder="Mekan adı veya adres"
                      />
                    </div>
                  </div>
                )}

                {showOnlineFields && (
                  <div className="rounded-lg border border-violet-200/50 p-4 space-y-3">
                    <h4 className="text-sm font-semibold text-slate-700">Dijital Katılım Bilgileri</h4>
                    <div>
                      <Label htmlFor="event-online-url">Online Katılım Bağlantısı</Label>
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
                      placeholder="Ücretsiz ise boş bırakın"
                    />
                  </div>
                  <div>
                    <Label htmlFor="event-max-attendees">Maks. Katılımcı</Label>
                    <Input
                      id="event-max-attendees"
                      type="number"
                      min="1"
                      className={formFieldInsetClass}
                      value={maxAttendees}
                      onChange={(event) => setMaxAttendees(event.target.value)}
                      placeholder="Sınırsız ise boş bırakın"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="event-cover">Kapak Görseli URL</Label>
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
                  <Label htmlFor="event-organizer">Düzenleyen Adı</Label>
                  <Input
                    id="event-organizer"
                    className={formFieldInsetClass}
                    lang="tr"
                    spellCheck
                    value={organizerName}
                    onChange={(event) => setOrganizerName(event.target.value)}
                    placeholder="Organizatör adı"
                  />
                </div>

                <div>
                  <Label htmlFor="event-registration">Kayıt Bağlantısı</Label>
                  <Input
                    id="event-registration"
                    type="url"
                    className={formFieldInsetClass}
                    value={registrationUrl}
                    onChange={(event) => setRegistrationUrl(event.target.value)}
                    placeholder="https://... (harici kayıt sayfası)"
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
                {createEventMutation.isPending ? "Gönderiliyor..." : "Etkinliği Gönder"}
              </Button>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
