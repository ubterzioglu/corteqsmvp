import { useEffect, useRef, useState } from "react";
import { Calendar, Plus, X } from "lucide-react";

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useCreateEvent } from "@/hooks/use-events";
import {
  forgetEventFormDraft,
  readEventFormDraft,
  rememberEventFormDraft,
} from "@/lib/event-form-draft";
import {
  DEFAULT_EVENT_TYPE,
  EVENT_CATEGORY_OPTIONS,
  EVENT_TYPE_OPTIONS,
  isOnlineEventType,
  isPhysicalEventType,
  type EventType,
} from "@/lib/events-vocabulary";
import {
  EVENT_TIMEZONE_GROUPS,
  EVENT_TIMEZONE_OPTIONS,
  eventTimezoneLabel,
  isKnownEventTimezone,
  resolveBrowserEventTimezone,
} from "@/lib/events-timezone";

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
  const [type, setType] = useState<EventType>(DEFAULT_EVENT_TYPE);
  const [eventDate, setEventDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  // Başlangıç değeri tarayıcının saat dilimi — ANCAK listede varsa. Yoksa BOŞ
  // kalır ve kullanıcı seçmek zorundadır. Bilinmeyeni sessizce "İstanbul"a
  // çekmek, bu alanın önlemek için var olduğu zararı üretirdi.
  const [timezone, setTimezone] = useState<string>(() => resolveBrowserEventTimezone());
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

  // Google OAuth dönüşü: sayfa sıfırdan yüklenir, React state'i gitmiştir.
  // Kullanıcı Google'a gitmeden önce bıraktığımız taslağı geri yükle ve formu aç.
  // Taslak bir kere okunur; okunduktan sonra silinir ki kullanıcı formu kendi
  // isteğiyle temizlediğinde eski hâli geri gelmesin.
  const draftRestoredRef = useRef(false);
  useEffect(() => {
    if (draftRestoredRef.current) return;
    draftRestoredRef.current = true;

    const draft = readEventFormDraft();
    if (!draft) return;
    forgetEventFormDraft();

    setTitle(draft.title);
    setDescription(draft.description);
    setCategory(draft.category);
    setType(draft.type);
    setEventDate(draft.eventDate);
    setStartTime(draft.startTime);
    setEndTime(draft.endTime);
    setTimezone(draft.timezone);
    setCountry(draft.country);
    setCity(draft.city);
    setLocation(draft.location);
    setOnlineUrl(draft.onlineUrl);
    setPrice(draft.price);
    setMaxAttendees(draft.maxAttendees);
    setCoverImage(draft.coverImage);
    setTags(draft.tags);
    if (draft.organizerName) setOrganizerName(draft.organizerName);
    setRegistrationUrl(draft.registrationUrl);
    onOpenChange(true);
  }, [onOpenChange]);

  const showPhysicalFields = isPhysicalEventType(type);
  const showOnlineFields = isOnlineEventType(type);

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
        description: "Başlık, açıklama, kategori ve tarih zorunludur.",
        variant: "destructive",
      });
      return;
    }

    // Saat girildiyse saat dilimi ZORUNLUDUR. Diasporada referanssız bir "19:00"
    // yanlış bilgidir: Katar'daki üye Berlin'deki etkinliğe iki saat geç kalır.
    if ((startTime || endTime) && !isKnownEventTimezone(timezone)) {
      toast({
        title: "Saat dilimi seçin",
        description: "Saat girdiniz — bu saat hangi ülkenin saati? Farklı ülkelerdeki üyeler kendi saatlerini buna göre görüyor.",
        variant: "destructive",
      });
      return;
    }

    if (!user) {
      // Google'a gitmeden ÖNCE taslağı bırak: yönlendirme sayfayı sıfırdan
      // yükler, bu bileşenin state'i tamamen kaybolur. Dönüşte yukarıdaki
      // efekt taslağı geri yükleyip formu açar.
      rememberEventFormDraft({
        title,
        description,
        category,
        type,
        eventDate,
        startTime,
        endTime,
        timezone,
        country,
        city,
        location,
        onlineUrl,
        price,
        maxAttendees,
        coverImage,
        tags,
        organizerName,
        registrationUrl,
      });

      toast({
        title: "Üye olmalısınız",
        description: "Etkinlik oluşturmak için önce üye olmalısınız. Google ile giriş yapılıyor, formunuz korunuyor...",
      });

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: new URL("/events", window.location.origin).toString(),
        },
      });

      if (error) {
        // Yönlendirme hiç olmadı; taslağı sekmede asılı bırakma.
        forgetEventFormDraft();
        toast({
          title: "Google girişi başlatılamadı",
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
        type,
        eventDate,
        startTime: startTime || null,
        endTime: endTime || null,
        // Saat girilmediyse saat dilimi ANLAMSIZDIR; boş yazmak "referans var"
        // izlenimi verir ve detay sayfası olmayan bir saati etiketler.
        timezone: startTime || endTime ? timezone : null,
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

      forgetEventFormDraft();
      setTitle("");
      setDescription("");
      setCategory("");
      setType(DEFAULT_EVENT_TYPE);
      setEventDate("");
      setStartTime("");
      setEndTime("");
      setTimezone(resolveBrowserEventTimezone());
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
            {open ? "Formu kapat" : "Etkinlik Eklemek İstiyorum — Formu Aç"}
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
                        {EVENT_CATEGORY_OPTIONS.map((c) => (
                          <SelectItem key={c.value} value={c.value}>
                            {c.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="event-type">Etkinlik Türü *</Label>
                    <Select value={type} onValueChange={(value) => setType(value as EventType)}>
                      <SelectTrigger id="event-type" className={formFieldInsetClass}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {EVENT_TYPE_OPTIONS.map((t) => (
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

                <div>
                  <Label htmlFor="event-timezone">Saat Dilimi</Label>
                  <Select value={timezone} onValueChange={setTimezone}>
                    <SelectTrigger id="event-timezone" className={formFieldInsetClass}>
                      <SelectValue placeholder="Saat dilimi seçin" />
                    </SelectTrigger>
                    <SelectContent className="max-h-72">
                      {EVENT_TIMEZONE_GROUPS.map((group) => (
                        <SelectGroup key={group}>
                          <SelectLabel>{group}</SelectLabel>
                          {EVENT_TIMEZONE_OPTIONS.filter((option) => option.group === group).map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="mt-1 text-xs text-slate-500">
                    {timezone
                      ? `Yukarıdaki saatler ${eventTimezoneLabel(timezone)} saatiyle okunur. Başka ülkedeki üye kendi saatini etkinlik sayfasında görür.`
                      : "Saat girecekseniz bu alan zorunludur — hangi ülkenin saatini yazdığınızı seçin."}
                  </p>
                </div>

                {showPhysicalFields && (
                  <div className="rounded-lg border border-violet-200/50 p-4 space-y-3">
                    <h4 className="text-sm font-semibold text-slate-700">Fiziksel Mekân Bilgileri</h4>
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
                      <Label htmlFor="event-location">Adres / Mekân</Label>
                      <Input
                        id="event-location"
                        className={formFieldInsetClass}
                        lang="tr"
                        spellCheck
                        value={location}
                        onChange={(event) => setLocation(event.target.value)}
                        placeholder="Mekân adı veya adres"
                      />
                    </div>
                  </div>
                )}

                {showOnlineFields && (
                  <div className="rounded-lg border border-violet-200/50 p-4 space-y-3">
                    <h4 className="text-sm font-semibold text-slate-700">Dijital Katılım Bilgileri</h4>
                    <div>
                      <Label htmlFor="event-online-url">Çevrim İçi Katılım Bağlantısı</Label>
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
                {createEventMutation.isPending ? "Gönderiliyor..." : user ? "Etkinliği Gönder" : "Üye Ol ve Gönder"}
              </Button>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
