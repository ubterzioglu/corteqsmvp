import { type ComponentType, useEffect, useMemo, useState } from "react";
import {
  Calendar,
  Eye,
  EyeOff,
  FileText,
  Globe,
  Linkedin,
  MessageSquare,
  Settings,
  ShieldCheck,
  Users,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { INDIVIDUAL_FEATURE_KEYS, type IndividualFeatureMeta } from "@/lib/features";
import type { IndividualProfileDetailsCore, IndividualProfileUpdateInput } from "@/lib/individual-profile";

type IndividualProfileCardsProps = {
  details: IndividualProfileDetailsCore;
  visibleModules: IndividualFeatureMeta[];
  featureSources: Record<string, string>;
  isFeaturesLoading: boolean;
  featureErrorMessage: string | null;
  isSavingProfile?: boolean;
  saveProfileError?: string | null;
  onSaveProfile?: (input: IndividualProfileUpdateInput) => Promise<void>;
};

type TabItem = {
  key: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
};

type SettingsFormState = {
  displayName: string;
  tagline: string;
  statusText: string;
  worldMessage: string;
  activeCountry: string;
  activeCity: string;
  hometown: string;
  country: string;
  city: string;
  yearsInCity: string;
  phone: string;
  education: string;
  school: string;
  institution: string;
  linkedin: string;
  bio: string;
  languages: string;
  interests: string;
  profileVisible: boolean;
  jobSeeking: boolean;
};

const ChipList = ({ items, emptyLabel }: { items: string[]; emptyLabel: string }) => {
  if (items.length === 0) {
    return <p className="text-xs text-muted-foreground">{emptyLabel}</p>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <Badge key={item} variant="outline" className="text-[11px]">
          {item}
        </Badge>
      ))}
    </div>
  );
};

const PlaceList = ({ items, emptyLabel }: { items: { label: string; period: string }[]; emptyLabel: string }) => {
  if (items.length === 0) {
    return <p className="text-xs text-muted-foreground">{emptyLabel}</p>;
  }

  return (
    <div className="space-y-1">
      {items.map((item) => (
        <p key={`${item.label}-${item.period}`} className="text-xs text-muted-foreground">
          {item.period ? `${item.label} (${item.period})` : item.label}
        </p>
      ))}
    </div>
  );
};

const Field = ({ label, value }: { label: string; value: string }) => (
  <p className="text-sm">
    <span className="font-medium">{label}:</span> {value}
  </p>
);

const presenceLabelMap = {
  online: "Online",
  cadde: "Cadde'de",
  offline: "Offline",
} as const;

const featureTabMap = {
  [INDIVIDUAL_FEATURE_KEYS.about]: { key: "about", label: "Hakkında", icon: Globe },
  [INDIVIDUAL_FEATURE_KEYS.serviceRequests]: { key: "service-requests", label: "Hizmet Talepleri", icon: FileText },
  [INDIVIDUAL_FEATURE_KEYS.events]: { key: "events", label: "Etkinlikler", icon: Calendar },
  [INDIVIDUAL_FEATURE_KEYS.follows]: { key: "following", label: "Takip", icon: Users },
  [INDIVIDUAL_FEATURE_KEYS.whatsapp]: { key: "whatsapp", label: "WhatsApp", icon: MessageSquare },
  [INDIVIDUAL_FEATURE_KEYS.messages]: { key: "messages", label: "Mesaj Kutusu", icon: MessageSquare },
  [INDIVIDUAL_FEATURE_KEYS.activity]: { key: "activity", label: "Aktivite", icon: Calendar },
} as const;

const visibleStateLabel = {
  open: "Profil Acik",
  locked: "Profil Kilitli",
} as const;

const mapDetailsToForm = (details: IndividualProfileDetailsCore): SettingsFormState => ({
  displayName: details.displayName,
  tagline: details.tagline,
  statusText: details.statusText,
  worldMessage: details.frontCard.worldMessage,
  activeCountry: details.activeCountry === "-" ? "" : details.activeCountry,
  activeCity: details.activeCity === "-" ? "" : details.activeCity,
  hometown: details.hometown === "-" ? "" : details.hometown,
  country: details.controlPanel.country === "-" ? "" : details.controlPanel.country,
  city: details.controlPanel.city === "-" ? "" : details.controlPanel.city,
  yearsInCity: details.controlPanel.yearsInCity === "-" ? "" : details.controlPanel.yearsInCity,
  phone: details.controlPanel.phone === "-" ? "" : details.controlPanel.phone,
  education: details.controlPanel.education === "-" ? "" : details.controlPanel.education,
  school: details.controlPanel.school === "-" ? "" : details.controlPanel.school,
  institution: details.controlPanel.institution === "-" ? "" : details.controlPanel.institution,
  linkedin: details.controlPanel.linkedin === "-" ? "" : details.controlPanel.linkedin,
  bio: details.controlPanel.bio === "Bio / Hakkında alanı henüz doldurulmadı." ? "" : details.controlPanel.bio,
  languages: details.detailCard.languages.join(", "),
  interests: details.detailCard.interests.join(", "),
  profileVisible: details.controlPanel.profileVisible,
  jobSeeking: details.jobSeeking,
});

export const IndividualProfileCards = ({
  details,
  visibleModules,
  featureSources,
  isFeaturesLoading,
  featureErrorMessage,
  isSavingProfile = false,
  saveProfileError = null,
  onSaveProfile,
}: IndividualProfileCardsProps) => {
  const [activeTab, setActiveTab] = useState<string>("settings");
  const [isEditingSettings, setIsEditingSettings] = useState(false);
  const [settingsForm, setSettingsForm] = useState<SettingsFormState>(() => mapDetailsToForm(details));

  const moduleKeySet = useMemo(() => new Set(visibleModules.map((module) => module.key)), [visibleModules]);
  const shouldShowFeatureTabs = !isFeaturesLoading && !featureErrorMessage;

  const tabs = useMemo(() => {
    const next: TabItem[] = [];

    if (shouldShowFeatureTabs) {
      Object.entries(featureTabMap).forEach(([featureKey, tabMeta]) => {
        if (moduleKeySet.has(featureKey)) {
          next.push(tabMeta);
        }
      });
    }

    next.push({ key: "settings", label: "Profil Ayarları", icon: Settings });
    return next;
  }, [moduleKeySet, shouldShowFeatureTabs]);

  useEffect(() => {
    if (tabs.some((tab) => tab.key === activeTab)) return;
    setActiveTab(tabs[0]?.key ?? "settings");
  }, [activeTab, tabs]);

  useEffect(() => {
    if (isEditingSettings) return;
    setSettingsForm(mapDetailsToForm(details));
  }, [details, isEditingSettings]);

  const front = details.frontCard;
  const detail = details.detailCard;
  const panel = details.controlPanel;

  const handleSaveSettings = async () => {
    if (!onSaveProfile) return;

    const payload: IndividualProfileUpdateInput = {
      displayName: settingsForm.displayName.trim(),
      tagline: settingsForm.tagline.trim(),
      statusText: settingsForm.statusText.trim(),
      worldMessage: settingsForm.worldMessage.trim(),
      activeCountry: settingsForm.activeCountry.trim(),
      activeCity: settingsForm.activeCity.trim(),
      hometown: settingsForm.hometown.trim(),
      profileVisible: settingsForm.profileVisible,
      jobSeeking: settingsForm.jobSeeking,
      bio: settingsForm.bio.trim(),
      linkedin: settingsForm.linkedin.trim(),
      country: settingsForm.country.trim(),
      city: settingsForm.city.trim(),
      yearsInCity: settingsForm.yearsInCity.trim(),
      phone: settingsForm.phone.trim(),
      education: settingsForm.education.trim(),
      school: settingsForm.school.trim(),
      institution: settingsForm.institution.trim(),
      languages: settingsForm.languages
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
      interests: settingsForm.interests
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
    };

    await onSaveProfile(payload);
    setIsEditingSettings(false);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="space-y-4 p-5">
          <div className="flex flex-wrap items-start gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-xl font-bold text-primary">
              {details.displayName.slice(0, 1).toUpperCase()}
            </div>
            <div className="min-w-[240px] flex-1 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-xl font-semibold">{details.displayName}</p>
                <Badge variant="outline">{presenceLabelMap[details.presenceStatus]}</Badge>
                <Badge variant="outline">{visibleStateLabel[details.visibilityStatus]}</Badge>
                {details.jobSeeking ? <Badge>İş Arıyorum</Badge> : null}
                {front.corteqsPassport ? (
                  <Badge className="bg-amber-500/10 text-amber-700 border-amber-500/30 gap-1">
                    <ShieldCheck className="h-3 w-3" /> CorteQS Pasaportu
                  </Badge>
                ) : null}
                {panel.profileVisible ? (
                  <Badge variant="secondary" className="gap-1">
                    <Eye className="h-3 w-3" /> Görünür
                  </Badge>
                ) : (
                  <Badge variant="outline" className="gap-1">
                    <EyeOff className="h-3 w-3" /> Gizli
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">{details.tagline}</p>
              {front.worldMessage ? (
                <p className="rounded-md border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">{front.worldMessage}</p>
              ) : null}
              <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted-foreground">
                <span>
                  <strong className="text-foreground">{details.followerCount}</strong> takipçi
                </span>
                <span>
                  <strong className="text-foreground">{details.followingCount}</strong> takip
                </span>
                <span>
                  <strong className="text-foreground">{details.eventCount}</strong> etkinlik
                </span>
                <span>{[details.activeCity, details.activeCountry].filter(Boolean).join(", ") || "Konum girilmedi"}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            {front.linkedinUrl && front.linkedinVisible ? (
              <a
                href={front.linkedinUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-primary hover:bg-muted"
              >
                <Linkedin className="h-3.5 w-3.5" /> LinkedIn
              </a>
            ) : null}
            {front.cvDoc ? (
              <span className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-muted-foreground">
                <FileText className="h-3.5 w-3.5" /> {front.cvDoc.name || "CV"}
              </span>
            ) : null}
            {front.presentationDoc ? (
              <span className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-muted-foreground">
                <FileText className="h-3.5 w-3.5" /> {front.presentationDoc.name || "Sunum"}
              </span>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="h-auto w-full justify-start gap-1 overflow-x-auto p-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <TabsTrigger key={tab.key} value={tab.key} className="gap-1.5 text-xs">
                    <Icon className="h-3.5 w-3.5" /> {tab.label}
                  </TabsTrigger>
                );
              })}
            </TabsList>

            {isFeaturesLoading ? <p className="mt-3 text-xs text-muted-foreground">Feature bilgileri yükleniyor...</p> : null}
            {featureErrorMessage ? (
              <p className="mt-3 text-xs text-muted-foreground">
                Feature verisi alınamadı. Güvenli mod nedeniyle sadece Profil Ayarları görüntüleniyor.
              </p>
            ) : null}

            <TabsContent value="about" className="mt-4 space-y-3">
              <div className="rounded-md border p-3">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Hakkında</p>
                <p className="text-sm text-muted-foreground">{detail.aboutText}</p>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-md border p-3">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Diller</p>
                  <ChipList items={detail.languages} emptyLabel="Dil eklenmedi" />
                </div>
                <div className="rounded-md border p-3">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Yaşadığı Ülkeler</p>
                  <PlaceList items={detail.countriesLived} emptyLabel="Kayıt yok" />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="service-requests" className="mt-4">
              <div className="rounded-md border p-3">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Hizmet Talepleri</p>
                <ChipList items={detail.serviceRequests} emptyLabel="Aktif talep yok" />
                <p className="mt-3 text-[11px] text-muted-foreground">
                  kaynak: {featureSources[INDIVIDUAL_FEATURE_KEYS.serviceRequests] ?? "fallback"}
                </p>
              </div>
            </TabsContent>

            <TabsContent value="events" className="mt-4">
              <div className="space-y-3 rounded-md border p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Etkinlikler</p>
                <ChipList items={detail.events} emptyLabel="Etkinlik kaydı yok" />
                {detail.recentEvents.length > 0 ? (
                  <div className="space-y-1">
                    {detail.recentEvents.map((event) => (
                      <p key={`${event.title}-${event.date}`} className="text-xs text-muted-foreground">
                        {event.title} - {event.date} {event.city ? `(${event.city})` : ""}
                      </p>
                    ))}
                  </div>
                ) : null}
                <p className="text-[11px] text-muted-foreground">
                  kaynak: {featureSources[INDIVIDUAL_FEATURE_KEYS.events] ?? "fallback"}
                </p>
              </div>
            </TabsContent>

            <TabsContent value="following" className="mt-4">
              <div className="rounded-md border p-3">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Takip</p>
                <ChipList items={detail.followsPreview} emptyLabel="Takip edilen profil yok" />
                <p className="mt-3 text-[11px] text-muted-foreground">
                  kaynak: {featureSources[INDIVIDUAL_FEATURE_KEYS.follows] ?? "fallback"}
                </p>
              </div>
            </TabsContent>

            <TabsContent value="whatsapp" className="mt-4">
              <div className="rounded-md border p-3">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">WhatsApp</p>
                <ChipList items={detail.whatsappGroups} emptyLabel="Grup bilgisi yok" />
                <p className="mt-3 text-[11px] text-muted-foreground">
                  kaynak: {featureSources[INDIVIDUAL_FEATURE_KEYS.whatsapp] ?? "fallback"}
                </p>
              </div>
            </TabsContent>

            <TabsContent value="messages" className="mt-4">
              <div className="rounded-md border p-3">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Mesaj Kutusu</p>
                <p className="text-xs text-muted-foreground">
                  Mesajlaşma özeti bu fazda read-only gösterilir. Detaylı aksiyonlar sonraki fazda açılacak.
                </p>
                <p className="mt-3 text-[11px] text-muted-foreground">
                  kaynak: {featureSources[INDIVIDUAL_FEATURE_KEYS.messages] ?? "fallback"}
                </p>
              </div>
            </TabsContent>

            <TabsContent value="activity" className="mt-4">
              <div className="rounded-md border p-3">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Aktivite</p>
                <ChipList items={detail.activities} emptyLabel="Aktivite bulunmuyor" />
                <p className="mt-3 text-[11px] text-muted-foreground">
                  kaynak: {featureSources[INDIVIDUAL_FEATURE_KEYS.activity] ?? "fallback"}
                </p>
              </div>
            </TabsContent>

            <TabsContent value="settings" className="mt-4 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs text-muted-foreground">Profil bilgilerini kendin düzenleyebilirsin.</p>
                {!isEditingSettings ? (
                  <Button type="button" size="sm" variant="outline" onClick={() => setIsEditingSettings(true)}>
                    Düzenle
                  </Button>
                ) : null}
              </div>

              {saveProfileError ? <p className="text-xs text-destructive">Kaydetme hatası: {saveProfileError}</p> : null}

              {isEditingSettings ? (
                <div className="space-y-3 rounded-md border p-3">
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="space-y-1">
                      <Label className="text-xs">Ad Soyad</Label>
                      <Input value={settingsForm.displayName} onChange={(event) => setSettingsForm((current) => ({ ...current, displayName: event.target.value }))} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Tagline</Label>
                      <Input value={settingsForm.tagline} onChange={(event) => setSettingsForm((current) => ({ ...current, tagline: event.target.value }))} />
                    </div>
                    <div className="space-y-1 md:col-span-2">
                      <Label className="text-xs">Status Mesajı</Label>
                      <Input value={settingsForm.statusText} onChange={(event) => setSettingsForm((current) => ({ ...current, statusText: event.target.value }))} />
                    </div>
                    <div className="space-y-1 md:col-span-2">
                      <Label className="text-xs">Profil Mesajım</Label>
                      <Textarea value={settingsForm.worldMessage} onChange={(event) => setSettingsForm((current) => ({ ...current, worldMessage: event.target.value }))} rows={2} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Aktif Ülke</Label>
                      <Input value={settingsForm.activeCountry} onChange={(event) => setSettingsForm((current) => ({ ...current, activeCountry: event.target.value }))} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Aktif Şehir</Label>
                      <Input value={settingsForm.activeCity} onChange={(event) => setSettingsForm((current) => ({ ...current, activeCity: event.target.value }))} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Memleket</Label>
                      <Input value={settingsForm.hometown} onChange={(event) => setSettingsForm((current) => ({ ...current, hometown: event.target.value }))} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">LinkedIn</Label>
                      <Input value={settingsForm.linkedin} onChange={(event) => setSettingsForm((current) => ({ ...current, linkedin: event.target.value }))} />
                    </div>
                    <div className="space-y-1 md:col-span-2">
                      <Label className="text-xs">Bio / Hakkında</Label>
                      <Textarea value={settingsForm.bio} onChange={(event) => setSettingsForm((current) => ({ ...current, bio: event.target.value }))} rows={3} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Ülke</Label>
                      <Input value={settingsForm.country} onChange={(event) => setSettingsForm((current) => ({ ...current, country: event.target.value }))} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Şehir</Label>
                      <Input value={settingsForm.city} onChange={(event) => setSettingsForm((current) => ({ ...current, city: event.target.value }))} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Kaç Yıldır Burada</Label>
                      <Input value={settingsForm.yearsInCity} onChange={(event) => setSettingsForm((current) => ({ ...current, yearsInCity: event.target.value }))} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Telefon</Label>
                      <Input value={settingsForm.phone} onChange={(event) => setSettingsForm((current) => ({ ...current, phone: event.target.value }))} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Eğitim</Label>
                      <Input value={settingsForm.education} onChange={(event) => setSettingsForm((current) => ({ ...current, education: event.target.value }))} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Okul</Label>
                      <Input value={settingsForm.school} onChange={(event) => setSettingsForm((current) => ({ ...current, school: event.target.value }))} />
                    </div>
                    <div className="space-y-1 md:col-span-2">
                      <Label className="text-xs">Kurum</Label>
                      <Input value={settingsForm.institution} onChange={(event) => setSettingsForm((current) => ({ ...current, institution: event.target.value }))} />
                    </div>
                    <div className="space-y-1 md:col-span-2">
                      <Label className="text-xs">Diller (virgülle ayır)</Label>
                      <Input value={settingsForm.languages} onChange={(event) => setSettingsForm((current) => ({ ...current, languages: event.target.value }))} />
                    </div>
                    <div className="space-y-1 md:col-span-2">
                      <Label className="text-xs">İlgi Alanları (virgülle ayır)</Label>
                      <Input value={settingsForm.interests} onChange={(event) => setSettingsForm((current) => ({ ...current, interests: event.target.value }))} />
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-4">
                    <label className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Switch checked={settingsForm.profileVisible} onCheckedChange={(checked) => setSettingsForm((current) => ({ ...current, profileVisible: checked }))} />
                      Profil görünür
                    </label>
                    <label className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Switch checked={settingsForm.jobSeeking} onCheckedChange={(checked) => setSettingsForm((current) => ({ ...current, jobSeeking: checked }))} />
                      İş arıyorum
                    </label>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button type="button" onClick={() => void handleSaveSettings()} disabled={isSavingProfile || !onSaveProfile}>
                      {isSavingProfile ? "Kaydediliyor..." : "Kaydet"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      disabled={isSavingProfile}
                      onClick={() => {
                        setSettingsForm(mapDetailsToForm(details));
                        setIsEditingSettings(false);
                      }}
                    >
                      İptal
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="grid gap-2 rounded-md border p-3 md:grid-cols-2">
                    <Field label="Ülke" value={panel.country} />
                    <Field label="Şehir" value={panel.city} />
                    <Field label="Kaç Yıldır Burada" value={panel.yearsInCity} />
                    <Field label="Telefon" value={panel.phone} />
                    <Field label="Doğum Tarihi" value={panel.birthDate} />
                    <Field label="Eğitim" value={panel.education} />
                    <Field label="Okul" value={panel.school} />
                    <Field label="LinkedIn" value={panel.linkedin} />
                  </div>
                  <div className="rounded-md border p-3">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Bio / Hakkında</p>
                    <p className="text-sm text-muted-foreground">{panel.bio}</p>
                  </div>
                  <div className="rounded-md border p-3">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Panel Aksiyonları</p>
                    <ChipList items={panel.navActions} emptyLabel="Aksiyon tanimi yok" />
                  </div>
                  <div className="rounded-md border p-3">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Profil Tamamlama Adımları</p>
                    <div className="space-y-1">
                      {panel.profileSteps.map((step) => (
                        <p key={step.label} className="text-xs text-muted-foreground">
                          {step.completed ? "Tamam" : "Bekliyor"} - {step.label}
                        </p>
                      ))}
                    </div>
                  </div>
                  {detail.relocation.enabled ? (
                    <div className="rounded-md border p-3">
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Taşınma Planı</p>
                      <p className="text-xs text-muted-foreground">
                        {[detail.relocation.city, detail.relocation.country].filter(Boolean).join(", ")}
                      </p>
                    </div>
                  ) : null}
                </>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};
