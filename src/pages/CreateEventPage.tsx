import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Plus, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCreateEvent } from "@/hooks/use-events";
import { useAuth } from "@/components/auth/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useSeo } from "@/lib/seo";

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

export default function CreateEventPage() {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
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

  useSeo({
    title: "Etkinlik Oluştur | CorteQS",
    description: "Yeni bir etkinlik oluşturun.",
    canonicalPath: "/events/create",
    robots: "noindex, follow",
  });

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast({ title: "Giriş yapmalısınız", variant: "destructive" });
      return;
    }
    if (!title.trim() || !description.trim() || !category || !eventDate) {
      toast({ title: "Zorunlu alanları doldurun", description: "Başlık, açıklama, kategori ve tarih gereklidir.", variant: "destructive" });
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
      toast({ title: "Etkinlik oluşturuldu", description: "Admin onayından sonra yayınlanacaktır." });
      navigate("/events");
    } catch {
      toast({ title: "Etkinlik oluşturulamadı", variant: "destructive" });
    }
  };

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#fffdf9_0%,#f8fafc_100%)] px-4 py-10">
      <div className="mx-auto max-w-2xl">
        <Link to="/events" className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" /> Etkinliklere dön
        </Link>

        <Card>
          <CardHeader>
            <CardTitle>Etkinlik Oluştur</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="title">Başlık *</Label>
                <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Etkinlik başlığı" required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Açıklama *</Label>
                <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Etkinlik hakkında detaylı bilgi..." rows={5} required />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Kategori *</Label>
                  <Select value={category} onValueChange={setCategory} required>
                    <SelectTrigger><SelectValue placeholder="Seçin" /></SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((c) => (
                        <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Etkinlik Türü *</Label>
                  <Select value={type} onValueChange={setType}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {EVENT_TYPES.map((t) => (
                        <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="eventDate">Tarih *</Label>
                  <Input id="eventDate" type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="startTime">Başlangıç Saati</Label>
                  <Input id="startTime" type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endTime">Bitiş Saati</Label>
                  <Input id="endTime" type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
                </div>
              </div>

              {showPhysicalFields && (
                <div className="rounded-lg border border-slate-200 p-4 space-y-4">
                  <h3 className="text-sm font-semibold text-slate-700">Fiziksel Mekan Bilgileri</h3>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="country">Ülke</Label>
                      <Input id="country" value={country} onChange={(e) => setCountry(e.target.value)} placeholder="Almanya" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="city">Şehir</Label>
                      <Input id="city" value={city} onChange={(e) => setCity(e.target.value)} placeholder="Berlin" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="location">Adres / Mekan</Label>
                    <Input id="location" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Mekan adı veya adres" />
                  </div>
                </div>
              )}

              {showOnlineFields && (
                <div className="rounded-lg border border-slate-200 p-4 space-y-4">
                  <h3 className="text-sm font-semibold text-slate-700">Dijital Katılım Bilgileri</h3>
                  <div className="space-y-2">
                    <Label htmlFor="onlineUrl">Online Katılım Bağlantısı</Label>
                    <Input id="onlineUrl" type="url" value={onlineUrl} onChange={(e) => setOnlineUrl(e.target.value)} placeholder="https://zoom.us/j/..." />
                  </div>
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="price">Fiyat (EUR)</Label>
                  <Input id="price" type="number" min="0" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="Ücretsiz ise boş bırakın" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxAttendees">Maks. Katılımcı</Label>
                  <Input id="maxAttendees" type="number" min="1" value={maxAttendees} onChange={(e) => setMaxAttendees(e.target.value)} placeholder="Sınırsız ise boş bırakın" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="coverImage">Kapak Görseli URL</Label>
                <Input id="coverImage" type="url" value={coverImage} onChange={(e) => setCoverImage(e.target.value)} placeholder="https://..." />
              </div>

              <div className="space-y-2">
                <Label htmlFor="organizerName">Düzenleyen Adı</Label>
                <Input id="organizerName" value={organizerName} onChange={(e) => setOrganizerName(e.target.value)} placeholder="Organizatör adı" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="registrationUrl">Kayıt Bağlantısı</Label>
                <Input id="registrationUrl" type="url" value={registrationUrl} onChange={(e) => setRegistrationUrl(e.target.value)} placeholder="https://... (harici kayıt sayfası)" />
              </div>

              <div className="space-y-2">
                <Label>Etiketler</Label>
                <div className="flex gap-2">
                  <Input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    placeholder="Etiket ekle"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
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

              <div className="flex gap-3 pt-2">
                <Button type="submit" disabled={createEventMutation.isPending}>
                  {createEventMutation.isPending ? "Oluşturuluyor..." : "Etkinlik Oluştur"}
                </Button>
                <Button type="button" variant="outline" onClick={() => navigate("/events")}>
                  İptal
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
