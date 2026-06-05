import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Plus, Save } from "lucide-react";
import { AdminPageLayout } from "@/components/admin/AdminPageLayout";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import SearchableCountrySelect from "@/components/SearchableCountrySelect";
import SearchableCitySelect from "@/components/SearchableCitySelect";
import {
  createIndependentProfileAsAdmin,
  listIndependentProfilesAsAdmin,
  slugifyIndependentProfile,
  updateIndependentProfileAsAdmin,
  type IndependentProfile,
  type IndependentProfileAnnouncement,
  type IndependentProfileCta,
  type IndependentProfileInput,
  type IndependentProfileKind,
  type IndependentProfileService,
} from "@/lib/independent-profiles";

type FormState = {
  slug: string;
  profileKind: IndependentProfileKind;
  typeLabel: string;
  title: string;
  subtitle: string;
  country: string;
  city: string;
  description: string;
  websiteUrl: string;
  heroImageUrl: string;
  logoUrl: string;
  contactEmail: string;
  contactPhone: string;
  addressText: string;
  mapQuery: string;
  workingHours: string;
  servicesText: string;
  announcementsText: string;
  ctasText: string;
  isPublished: boolean;
  sortOrder: string;
};

const EMPTY_FORM: FormState = {
  slug: "",
  profileKind: "consulate",
  typeLabel: "Konsolosluk",
  title: "",
  subtitle: "",
  country: "",
  city: "",
  description: "",
  websiteUrl: "",
  heroImageUrl: "",
  logoUrl: "🏛️",
  contactEmail: "",
  contactPhone: "",
  addressText: "",
  mapQuery: "",
  workingHours: "",
  servicesText: "[]",
  announcementsText: "[]",
  ctasText: "[]",
  isPublished: false,
  sortOrder: "100",
};

const stringifyPretty = (value: unknown) => JSON.stringify(value, null, 2);

const profileToFormState = (profile: IndependentProfile): FormState => ({
  slug: profile.slug,
  profileKind: profile.profileKind,
  typeLabel: profile.typeLabel,
  title: profile.title,
  subtitle: profile.subtitle ?? "",
  country: profile.country,
  city: profile.city,
  description: profile.description,
  websiteUrl: profile.websiteUrl ?? "",
  heroImageUrl: profile.heroImageUrl ?? "",
  logoUrl: profile.logoUrl ?? "",
  contactEmail: profile.contactEmail ?? "",
  contactPhone: profile.contactPhone ?? "",
  addressText: profile.addressText ?? "",
  mapQuery: profile.mapQuery ?? "",
  workingHours: profile.workingHours ?? "",
  servicesText: stringifyPretty(profile.services),
  announcementsText: stringifyPretty(profile.announcements),
  ctasText: stringifyPretty(profile.ctas),
  isPublished: profile.isPublished,
  sortOrder: String(profile.sortOrder),
});

const parseJsonArray = <T,>(label: string, raw: string): T[] => {
  const trimmed = raw.trim();
  if (!trimmed) return [];
  let parsed: unknown;

  try {
    parsed = JSON.parse(trimmed);
  } catch {
    throw new Error(`${label} alanı geçerli JSON olmalı.`);
  }

  if (!Array.isArray(parsed)) {
    throw new Error(`${label} alanı JSON array olmalı.`);
  }

  return parsed as T[];
};

const buildInputFromForm = (form: FormState): IndependentProfileInput => ({
  slug: slugifyIndependentProfile(form.slug || form.title),
  profileKind: form.profileKind,
  typeLabel: form.typeLabel.trim() || (form.profileKind === "embassy" ? "Büyükelçilik" : "Konsolosluk"),
  title: form.title.trim(),
  subtitle: form.subtitle.trim() || null,
  country: form.country.trim(),
  city: form.city.trim(),
  description: form.description.trim(),
  websiteUrl: form.websiteUrl.trim() || null,
  heroImageUrl: form.heroImageUrl.trim() || null,
  logoUrl: form.logoUrl.trim() || null,
  contactEmail: form.contactEmail.trim() || null,
  contactPhone: form.contactPhone.trim() || null,
  addressText: form.addressText.trim() || null,
  mapQuery: form.mapQuery.trim() || null,
  workingHours: form.workingHours.trim() || null,
  services: parseJsonArray<IndependentProfileService>("Hizmetler JSON", form.servicesText),
  announcements: parseJsonArray<IndependentProfileAnnouncement>("Duyurular JSON", form.announcementsText),
  ctas: parseJsonArray<IndependentProfileCta>("CTA JSON", form.ctasText),
  isPublished: form.isPublished,
  sortOrder: Number(form.sortOrder || 100),
});

export default function AdminConsulateProfilesPage() {
  const { toast } = useToast();
  const [profiles, setProfiles] = useState<IndependentProfile[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const selectedProfile = useMemo(
    () => profiles.find((profile) => profile.id === selectedId) ?? null,
    [profiles, selectedId],
  );

  const loadProfiles = async (nextSelectedId?: string | null) => {
    setIsLoading(true);
    try {
      const nextProfiles = await listIndependentProfilesAsAdmin();
      setProfiles(nextProfiles);

      const effectiveId = nextSelectedId ?? selectedId;
      if (effectiveId) {
        const nextSelectedProfile = nextProfiles.find((profile) => profile.id === effectiveId) ?? null;
        setSelectedId(nextSelectedProfile?.id ?? null);
        setForm(nextSelectedProfile ? profileToFormState(nextSelectedProfile) : EMPTY_FORM);
      } else {
        setForm(EMPTY_FORM);
      }
    } catch (error) {
      toast({
        title: "Diplomatik profiller yüklenemedi",
        description: error instanceof Error ? error.message : "Beklenmeyen bir hata oluştu.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadProfiles();
  }, []);

  const updateForm = (key: keyof FormState, value: string | boolean) => {
    setForm((current) => ({ ...current, [key]: value as never }));
  };

  const handleNew = () => {
    setSelectedId(null);
    setForm(EMPTY_FORM);
  };

  const handleSelect = (profile: IndependentProfile) => {
    setSelectedId(profile.id);
    setForm(profileToFormState(profile));
  };

  const handleSave = async () => {
    if (!form.title.trim() || !form.country.trim() || !form.city.trim() || !form.description.trim()) {
      toast({
        title: "Eksik bilgi",
        description: "Başlık, ülke, şehir ve açıklama alanları zorunlu.",
        variant: "destructive",
      });
      return;
    }

    const payload = buildInputFromForm(form);
    setIsSaving(true);

    try {
      if (selectedProfile) {
        const saved = await updateIndependentProfileAsAdmin(selectedProfile.id, payload);
        await loadProfiles(saved.id);
        toast({ title: "Diplomatik profil güncellendi" });
      } else {
        const saved = await createIndependentProfileAsAdmin(payload);
        await loadProfiles(saved.id);
        toast({ title: "Yeni diplomatik profil oluşturuldu" });
      }
    } catch (error) {
      toast({
        title: "Kayıt kaydedilemedi",
        description: error instanceof Error ? error.message : "Beklenmeyen bir hata oluştu.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
      <Card className="h-fit">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <CardTitle>Diplomatik Profiller</CardTitle>
              <CardDescription>Büyükelçilik ve konsolosluklar için bağımsız public profil kayıtları</CardDescription>
            </div>
            <Button size="sm" variant="outline" onClick={handleNew}>
              <Plus className="h-4 w-4" />
              Yeni
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {isLoading ? <p className="text-sm text-muted-foreground">Kayıtlar yükleniyor...</p> : null}
          {!isLoading && profiles.length === 0 ? (
            <p className="text-sm text-muted-foreground">Henüz diplomatik profil yok.</p>
          ) : null}
          {profiles.map((profile) => (
            <button
              key={profile.id}
              type="button"
              onClick={() => handleSelect(profile)}
              className={`w-full rounded-xl border px-3 py-3 text-left transition ${
                selectedId === profile.id ? "border-primary bg-primary/5" : "border-border hover:bg-muted/40"
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{profile.title}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {profile.city}, {profile.country}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-[11px] text-muted-foreground">#{profile.sortOrder}</p>
                  <p className={`text-[11px] font-medium ${profile.isPublished ? "text-emerald-700" : "text-amber-700"}`}>
                    {profile.isPublished ? "Yayında" : "Draft"}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{selectedProfile ? "Diplomatik Profili Düzenle" : "Yeni Diplomatik Profil"}</CardTitle>
          <CardDescription>
            JSON alanları doğrudan DB yapısıyla uyumludur. `services`, `announcements` ve `cta` alanlarına array JSON gir.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Profil Türü">
              <Select
                value={form.profileKind}
                onValueChange={(value) => {
                  const profileKind = value as IndependentProfileKind;
                  updateForm("profileKind", profileKind);
                  if (!form.typeLabel.trim() || form.typeLabel === "Konsolosluk" || form.typeLabel === "Büyükelçilik") {
                    updateForm("typeLabel", profileKind === "embassy" ? "Büyükelçilik" : "Konsolosluk");
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Profil türü seç" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="consulate">Konsolosluk</SelectItem>
                  <SelectItem value="embassy">Büyükelçilik</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Slug">
              <Input value={form.slug} onChange={(event) => updateForm("slug", event.target.value)} placeholder="tc-berlin-buyukelcilik" />
            </Field>
            <Field label="Profil Etiketi">
              <Input value={form.typeLabel} onChange={(event) => updateForm("typeLabel", event.target.value)} placeholder="Konsolosluk / Büyükelçilik" />
            </Field>
            <Field label="Başlık">
              <Input value={form.title} onChange={(event) => updateForm("title", event.target.value)} placeholder="T.C. Londra Başkonsolosluğu" />
            </Field>
            <Field label="Alt Başlık">
              <Input value={form.subtitle} onChange={(event) => updateForm("subtitle", event.target.value)} placeholder="Kısa özet" />
            </Field>
            <Field label="Ülke">
              <SearchableCountrySelect
                value={form.country}
                onChange={(v) => updateForm("country", v)}
                placeholder="İngiltere"
                size="sm"
              />
            </Field>
            <Field label="Şehir">
              <SearchableCitySelect
                value={form.city}
                onChange={(v) => updateForm("city", v)}
                countryName={form.country}
                placeholder="Londra"
                size="sm"
              />
            </Field>
            <Field label="Website">
              <Input value={form.websiteUrl} onChange={(event) => updateForm("websiteUrl", event.target.value)} placeholder="https://..." />
            </Field>
            <Field label="Logo / Emoji">
              <Input value={form.logoUrl} onChange={(event) => updateForm("logoUrl", event.target.value)} placeholder="🏛️ veya görsel URL" />
            </Field>
            <Field label="Hero Görsel URL">
              <Input value={form.heroImageUrl} onChange={(event) => updateForm("heroImageUrl", event.target.value)} placeholder="https://..." />
            </Field>
            <Field label="Telefon">
              <Input value={form.contactPhone} onChange={(event) => updateForm("contactPhone", event.target.value)} placeholder="+44 ..." />
            </Field>
            <Field label="E-posta">
              <Input value={form.contactEmail} onChange={(event) => updateForm("contactEmail", event.target.value)} placeholder="info@example.com" />
            </Field>
            <Field label="Çalışma Saatleri">
              <Input value={form.workingHours} onChange={(event) => updateForm("workingHours", event.target.value)} placeholder="Hafta içi 09:00 - 17:00" />
            </Field>
            <Field label="Adres">
              <Textarea value={form.addressText} onChange={(event) => updateForm("addressText", event.target.value)} className="min-h-[88px]" />
            </Field>
            <Field label="Map Query">
              <Textarea value={form.mapQuery} onChange={(event) => updateForm("mapQuery", event.target.value)} className="min-h-[88px]" />
            </Field>
          </div>

          <Field label="Açıklama">
            <Textarea
              value={form.description}
              onChange={(event) => updateForm("description", event.target.value)}
              className="min-h-[120px]"
              placeholder={form.profileKind === "embassy" ? "Büyükelçilik açıklaması" : "Konsolosluk açıklaması"}
            />
          </Field>

          <div className="grid gap-4 lg:grid-cols-3">
            <Field label="Hizmetler JSON">
              <Textarea value={form.servicesText} onChange={(event) => updateForm("servicesText", event.target.value)} className="min-h-[220px] font-mono text-xs" />
            </Field>
            <Field label="Duyurular JSON">
              <Textarea value={form.announcementsText} onChange={(event) => updateForm("announcementsText", event.target.value)} className="min-h-[220px] font-mono text-xs" />
            </Field>
            <Field label="CTA JSON">
              <Textarea value={form.ctasText} onChange={(event) => updateForm("ctasText", event.target.value)} className="min-h-[220px] font-mono text-xs" />
            </Field>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-muted/30 px-4 py-3">
            <div className="flex items-center gap-3">
              <Switch checked={form.isPublished} onCheckedChange={(checked) => updateForm("isPublished", checked)} />
              <div>
                <p className="text-sm font-medium">Public yayında</p>
                <p className="text-xs text-muted-foreground">Kapalıysa slug sayfası publicte açılmaz.</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor="sort-order">Sıralama</Label>
              <Input
                id="sort-order"
                type="number"
                value={form.sortOrder}
                onChange={(event) => updateForm("sortOrder", event.target.value)}
                className="w-24"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={() => void handleSave()} disabled={isSaving}>
              <Save className="h-4 w-4" />
              {isSaving ? "Kaydediliyor..." : selectedProfile ? "Profili Güncelle" : "Profili Oluştur"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
