import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Save, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  buildLandingDescription,
  getEditableLandingForCurrentUser,
  parseAdminContact,
  type LandingCategory,
  type WhatsAppLanding,
  updateCurrentUserEditableLanding,
} from "@/lib/whatsapp-landings";

const categoryOptions: Array<{ value: LandingCategory; label: string }> = [
  { value: "alumni", label: "Alumni" },
  { value: "hobi", label: "Hobi" },
  { value: "is", label: "İş Grubu" },
  { value: "doktor", label: "Doktor / Sağlık" },
  { value: "yatirim", label: "Yatırım" },
  { value: "girisim", label: "Girişim" },
  { value: "akademik", label: "Akademik" },
  { value: "dayanisma", label: "Dayanışma" },
  { value: "diger", label: "Diğer" },
];

const platformOptions = [
  "WhatsApp",
  "Telegram",
  "Discord",
  "Facebook",
  "Instagram",
  "LinkedIn",
  "X",
  "TikTok",
  "YouTube",
  "Reddit",
] as const;

type EditableLandingState = {
  landingId: string;
  slug: string;
  groupName: string;
  platform: string;
  category: LandingCategory;
  country: string;
  city: string;
  heroImage: string;
  callToActionText: string;
  conditions: string;
  whatsappLink: string;
  adminName: string;
  adminEmail: string;
  adminPhone: string;
  description: string;
  memberApproved: boolean;
  adminApproved: boolean;
};

function toEditableLandingState(landing: WhatsAppLanding): EditableLandingState {
  const { adminEmail, adminPhone } = parseAdminContact(landing.adminContact);

  return {
    landingId: landing.dbId ?? "",
    slug: landing.id,
    groupName: landing.groupName,
    platform: landing.platform ?? "WhatsApp",
    category: landing.category,
    country: landing.country,
    city: landing.city,
    heroImage: landing.heroImage ?? "",
    callToActionText: landing.callToActionText ?? "",
    conditions: landing.conditions ?? "",
    whatsappLink: landing.whatsappLink,
    adminName: landing.adminName ?? "",
    adminEmail,
    adminPhone,
    description: landing.description ?? "",
    memberApproved: landing.memberApproved ?? true,
    adminApproved: landing.adminApproved ?? false,
  };
}

export default function WhatsAppLandingEditorPage() {
  const { slug = "" } = useParams<{ slug: string }>();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [state, setState] = useState<EditableLandingState | null>(null);

  useEffect(() => {
    let mounted = true;

    void (async () => {
      setLoading(true);
      try {
        const landing = await getEditableLandingForCurrentUser(slug);
        if (!mounted) return;
        setState(landing ? toEditableLandingState(landing) : null);
      } catch {
        if (!mounted) return;
        setState(null);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [slug]);

  const updateField = <K extends keyof EditableLandingState>(field: K, value: EditableLandingState[K]) => {
    setState((current) => (current ? { ...current, [field]: value } : current));
  };

  const handleSave = async () => {
    if (!state) return;

    try {
      setSaving(true);
      const nextDescription = buildLandingDescription({
        description: state.description,
        platform: state.platform,
        memberApproved: state.memberApproved,
        adminApproved: state.adminApproved,
        editorReviewPending: true,
        editorReviewUpdatedAt: new Date().toISOString(),
      });

      const adminContact = [
        state.adminEmail.trim() ? `E-posta: ${state.adminEmail.trim()}` : "",
        state.adminPhone.trim() ? `Telefon: ${state.adminPhone.trim()}` : "",
      ]
        .filter(Boolean)
        .join("\n");

      const updated = await updateCurrentUserEditableLanding({
        landingId: state.landingId,
        groupName: state.groupName,
        category: state.category,
        country: state.country,
        city: state.city,
        heroImage: state.heroImage,
        callToActionText: state.callToActionText,
        conditions: state.conditions,
        whatsappLink: state.whatsappLink,
        adminName: state.adminName,
        adminContact,
        description: nextDescription,
      });

      setState(toEditableLandingState(updated));
      toast({
        title: "Değişiklikler kaydedildi",
        description: "Landing kaydı yeniden admin incelemesine gönderildi.",
      });
    } catch (error) {
      toast({
        title: "Landing kaydedilemedi",
        description: error instanceof Error ? error.message : "Beklenmeyen hata",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center bg-background text-sm text-muted-foreground">Landing yükleniyor...</div>;
  }

  if (!state) {
    return (
      <div className="min-h-screen bg-background">
        <main className="container mx-auto max-w-3xl px-4 py-10">
          <Card>
            <CardHeader>
              <CardTitle>Erişim bulunamadı</CardTitle>
              <CardDescription>Bu topluluk landing kaydını düzenleme yetkiniz yok veya kayıt bulunamadı.</CardDescription>
            </CardHeader>
            <CardContent>
              <Link to="/addcom">
                <Button variant="outline" className="gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Topluluklara dön
                </Button>
              </Link>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#fffdfa_0%,#f8fafc_100%)]">
      <main className="container mx-auto max-w-3xl px-4 py-8">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <Link to={`/addcom?group=${encodeURIComponent(state.slug)}`}>
            <Button variant="outline" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Landing detayına dön
            </Button>
          </Link>
          <div className="flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">
            <ShieldCheck className="h-3.5 w-3.5" />
            Kaydettiğinde kayıt yeniden admin incelemesine gider
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Topluluk Landing Düzenle</CardTitle>
            <CardDescription>
              Sana atanmış bu topluluk landing kaydının görünen içerik alanlarını güncelleyebilirsin.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="landing-group-name">Topluluk Adı</Label>
              <Input id="landing-group-name" value={state.groupName} onChange={(event) => updateField("groupName", event.target.value)} />
            </div>

            <div className="space-y-1.5">
              <Label>Kategori</Label>
              <Select value={state.category} onValueChange={(value) => updateField("category", value as LandingCategory)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categoryOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Platform</Label>
              <Select value={state.platform} onValueChange={(value) => updateField("platform", value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {platformOptions.map((platform) => (
                    <SelectItem key={platform} value={platform}>
                      {platform}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="landing-country">Ülke</Label>
                <Input id="landing-country" value={state.country} onChange={(event) => updateField("country", event.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="landing-city">Şehir</Label>
                <Input id="landing-city" value={state.city} onChange={(event) => updateField("city", event.target.value)} />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="landing-link">Topluluk Linki</Label>
              <Input id="landing-link" value={state.whatsappLink} onChange={(event) => updateField("whatsappLink", event.target.value)} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="landing-hero-image">Hero Görsel URL</Label>
              <Input id="landing-hero-image" value={state.heroImage} onChange={(event) => updateField("heroImage", event.target.value)} placeholder="https://..." />
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-1.5">
                <Label htmlFor="landing-admin-name">Yönetici Adı</Label>
                <Input id="landing-admin-name" value={state.adminName} onChange={(event) => updateField("adminName", event.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="landing-admin-email">Yönetici Mail</Label>
                <Input id="landing-admin-email" type="email" value={state.adminEmail} onChange={(event) => updateField("adminEmail", event.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="landing-admin-phone">Yönetici Telefon</Label>
                <Input id="landing-admin-phone" value={state.adminPhone} onChange={(event) => updateField("adminPhone", event.target.value)} />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="landing-cta">Yeni Üyeler İçin Mesaj</Label>
              <Textarea id="landing-cta" rows={4} value={state.callToActionText} onChange={(event) => updateField("callToActionText", event.target.value)} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="landing-conditions">Topluluk Kuralları</Label>
              <Textarea id="landing-conditions" rows={4} value={state.conditions} onChange={(event) => updateField("conditions", event.target.value)} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="landing-description">Açıklama / Metadata</Label>
              <Textarea id="landing-description" rows={5} value={state.description} onChange={(event) => updateField("description", event.target.value)} />
            </div>

            <div className="flex justify-end">
              <Button className="gap-2 bg-emerald-600 text-white hover:bg-emerald-700" disabled={saving} onClick={() => void handleSave()}>
                <Save className="h-4 w-4" />
                {saving ? "Kaydediliyor..." : "Kaydet ve İncelemeye Gönder"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
