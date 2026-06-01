import { useCallback, useEffect, useMemo, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { CheckCircle2, Clock3, Globe2, Lock, ShieldCheck, BookOpen, Sparkles, MapPin, UserCircle2 } from "lucide-react";

import { useAuth } from "@/components/auth/useAuth";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useCurrentUserProfile } from "@/hooks/useCurrentUserProfile";
import { useCurrentUserDashboard } from "@/hooks/useCurrentUserDashboard";
import { GENERIC_FEATURE_KEYS, type GenericFeatureKey } from "@/lib/features";
import { submitFeatureRequest, submitRoleChangeRequest, updateProfileAttribute, updateUserTaxonomySelection } from "@/lib/member-profile-api";
import { getAttributeStringValue, type AttributeVisibility, type ProfileAttributeState, type TaxonomyGroupState } from "@/lib/member-profile";
import { defaultProfileType, getRoleMeta, isProfileType, profileTypeOptions, type ProfileType } from "@/lib/profile-types";
import { supabase } from "@/integrations/supabase/client";
import PublicProfileSummaryView from "@/components/profile/PublicProfileSummaryView";
import { buildSelfProfileViewModel } from "@/lib/profile-view-model";

type DraftValueMap = Record<string, string | boolean>;
type DraftVisibilityMap = Record<string, AttributeVisibility>;

const VISIBILITY_OPTIONS: { value: AttributeVisibility; label: string }[] = [
  { value: "public", label: "Public" },
  { value: "private", label: "Private" },
  { value: "admin_only", label: "Sadece Admin" },
];

const REQUESTABLE_FEATURES: { key: GenericFeatureKey; title: string; description: string }[] = [
  {
    key: GENERIC_FEATURE_KEYS.directoryVisible,
    title: "Directory Görünürlüğü",
    description: "Public directory’de görünmek için onay isteği oluştur.",
  },
  {
    key: GENERIC_FEATURE_KEYS.directoryFeatured,
    title: "Featured Profil",
    description: "Profilinin öne çıkarılmış kart olarak listelenmesini iste.",
  },
  {
    key: GENERIC_FEATURE_KEYS.contactShowWhatsapp,
    title: "WhatsApp Yayınlama",
    description: "WhatsApp bilgisini public göstermek için onay isteği gönder.",
  },
  {
    key: GENERIC_FEATURE_KEYS.eventsCreate,
    title: "Etkinlik Oluşturma",
    description: "Etkinlik oluşturma akışına erişim için talep bırak.",
  },
  {
    key: GENERIC_FEATURE_KEYS.offersCreate,
    title: "Teklif / Hizmet Oluşturma",
    description: "Teklif yayınlama erişimi için talep bırak.",
  },
  {
    key: GENERIC_FEATURE_KEYS.referralCreate,
    title: "Referral Oluşturma",
    description: "Referral oluşturma erişimi için talep bırak.",
  },
];

const mapAttributeDraftValue = (attribute: ProfileAttributeState): string | boolean => {
  if (attribute.dataType === "boolean") {
    return Boolean(attribute.valueJson);
  }

  if (attribute.dataType === "multi_select" && Array.isArray(attribute.valueJson)) {
    return attribute.valueJson.join(", ");
  }

  return getAttributeStringValue(attribute);
};

const ProfilePage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { type } = useParams<{ type: string }>();
  const { isLoading, errorMessage, profile, refreshProfile } = useCurrentUserProfile(true);
  const { items: dashboardItems, isLoading: isDashboardLoading } = useCurrentUserDashboard(true);

  const [draftValues, setDraftValues] = useState<DraftValueMap>({});
  const [draftVisibilities, setDraftVisibilities] = useState<DraftVisibilityMap>({});
  const [savingAttributeKey, setSavingAttributeKey] = useState<string | null>(null);
  const [savingTaxonomyGroupKey, setSavingTaxonomyGroupKey] = useState<string | null>(null);
  const [roleRequestTarget, setRoleRequestTarget] = useState<ProfileType | "">("");
  const [roleRequestNote, setRoleRequestNote] = useState("");
  const [submittingRoleRequest, setSubmittingRoleRequest] = useState(false);
  const [featureRequestingKey, setFeatureRequestingKey] = useState<string | null>(null);
  const [taxonomyDrafts, setTaxonomyDrafts] = useState<Record<string, string[]>>({});

  useEffect(() => {
    if (!profile) return;

    const nextValues: DraftValueMap = {};
    const nextVisibilities: DraftVisibilityMap = {};
    for (const attribute of profile.attributes) {
      nextValues[attribute.attributeKey] = mapAttributeDraftValue(attribute);
      nextVisibilities[attribute.attributeKey] = attribute.visibility;
    }
    setDraftValues(nextValues);
    setDraftVisibilities(nextVisibilities);
  }, [profile]);

  useEffect(() => {
    if (!profile) return;
    const nextDrafts: Record<string, string[]> = {};
    for (const group of profile.taxonomyGroups) {
      nextDrafts[group.groupKey] = group.options.filter((option) => option.isSelected).map((option) => option.key);
    }
    setTaxonomyDrafts(nextDrafts);
  }, [profile]);

  const roleMeta = useMemo(() => getRoleMeta(profile?.profileType ?? type), [profile?.profileType, type]);

  const availableRoleTargets = useMemo(() => {
    return profileTypeOptions.filter((option) => option.type !== profile?.profileType);
  }, [profile?.profileType]);

  const featureMap = useMemo(() => {
    return new Map((profile?.features ?? []).map((feature) => [feature.key, feature]));
  }, [profile?.features]);

  const groupedAttributes = useMemo(() => {
    const common: ProfileAttributeState[] = [];
    const roleSpecific: ProfileAttributeState[] = [];

    for (const attribute of profile?.attributes ?? []) {
      if (["full_name", "country", "city", "profile_photo_url", "bio_short"].includes(attribute.attributeKey)) {
        common.push(attribute);
      } else {
        roleSpecific.push(attribute);
      }
    }

    return { common, roleSpecific };
  }, [profile?.attributes]);

  const visibleTaxonomyGroups = useMemo(() => {
    return profile?.taxonomyGroups ?? [];
  }, [profile?.taxonomyGroups]);

  const attributeMap = useMemo(() => {
    return new Map((profile?.attributes ?? []).map((attribute) => [attribute.attributeKey, attribute]));
  }, [profile?.attributes]);

  const readAttributeValue = useCallback((attributeKey: string) => {
    const attribute = attributeMap.get(attributeKey);
    return attribute ? getAttributeStringValue(attribute) : "";
  }, [attributeMap]);

  const isIndividualProfile = roleMeta?.canonicalSlug === "individual";
  const displayName = readAttributeValue("full_name") || profile?.fullName || user?.user_metadata?.name || "CorteQS Üyesi";
  const shortBio = readAttributeValue("bio_short");
  const country = readAttributeValue("country");
  const city = readAttributeValue("city");
  const roleSpotlight = readAttributeValue(roleMeta?.defaultAttributeKey ?? "interests");
  const locationLabel = [city, country].filter(Boolean).join(", ");
  const initials = displayName
    .split(/\s+/)
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase() || "CQ";
  const publicAttributesCount = (profile?.attributes ?? []).filter((attribute) => draftVisibilities[attribute.attributeKey] === "public").length;
  const pendingCount = profile?.pendingRequests.length ?? 0;
  const dashboardCount = dashboardItems.length;
  const selfProfileViewModel = useMemo(
    () => (profile ? buildSelfProfileViewModel(profile, dashboardCount) : null),
    [dashboardCount, profile],
  );
  const completionHighlights = [
    { key: "full_name", label: roleMeta?.displayNameLabel ?? "Görünen isim" },
    { key: "country", label: "Ülke" },
    { key: "city", label: "Şehir" },
    { key: "bio_short", label: "Kısa açıklama" },
    { key: roleMeta?.defaultAttributeKey ?? "interests", label: roleMeta?.defaultAttributeKey === "interests" ? "İlgi alanları" : "Rol detayı" },
  ].map((item) => ({
    ...item,
    complete: Boolean(readAttributeValue(item.key).trim()),
  }));

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/login", { replace: true });
  };

  const handleDraftChange = (attributeKey: string, nextValue: string | boolean) => {
    setDraftValues((current) => ({ ...current, [attributeKey]: nextValue }));
  };

  const handleSaveAttribute = async (attribute: ProfileAttributeState) => {
    const rawValue = draftValues[attribute.attributeKey];
    const visibility = draftVisibilities[attribute.attributeKey] ?? attribute.visibility;

    let valueToSend: unknown = rawValue;
    if (attribute.dataType === "boolean") {
      valueToSend = Boolean(rawValue);
    } else if (attribute.dataType === "multi_select") {
      valueToSend = String(rawValue ?? "")
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
    } else {
      valueToSend = String(rawValue ?? "").trim();
    }

    setSavingAttributeKey(attribute.attributeKey);
    try {
      const result = (await updateProfileAttribute(attribute.attributeKey, valueToSend, visibility)) as { status?: string } | null;
      await refreshProfile();
      toast({
        title: result?.status === "pending" ? "Onay Bekliyor" : "Alan Güncellendi",
        description:
          result?.status === "pending"
            ? `${attribute.label} değişikliği admin onay kuyruğuna alındı.`
            : `${attribute.label} kaydedildi.`,
      });
    } catch (error) {
      toast({
        title: "Alan kaydedilemedi",
        description: error instanceof Error ? error.message : "Beklenmeyen bir hata oluştu.",
        variant: "destructive",
      });
    } finally {
      setSavingAttributeKey(null);
    }
  };

  const handleSubmitRoleRequest = async () => {
    if (!roleRequestTarget) return;

    setSubmittingRoleRequest(true);
    try {
      await submitRoleChangeRequest(roleRequestTarget, roleRequestNote.trim());
      setRoleRequestNote("");
      setRoleRequestTarget("");
      await refreshProfile();
      toast({
        title: "Rol başvurusu gönderildi",
        description: "Başvurun admin onay kuyruğuna eklendi.",
      });
    } catch (error) {
      toast({
        title: "Başvuru gönderilemedi",
        description: error instanceof Error ? error.message : "Beklenmeyen bir hata oluştu.",
        variant: "destructive",
      });
    } finally {
      setSubmittingRoleRequest(false);
    }
  };

  const handleRequestFeature = async (featureKey: GenericFeatureKey) => {
    setFeatureRequestingKey(featureKey);
    try {
      await submitFeatureRequest(featureKey, { requested_from: "profile" });
      await refreshProfile();
      toast({
        title: "Talep gönderildi",
        description: "İlgili feature için admin onay isteği oluşturuldu.",
      });
    } catch (error) {
      toast({
        title: "Talep gönderilemedi",
        description: error instanceof Error ? error.message : "Beklenmeyen bir hata oluştu.",
        variant: "destructive",
      });
    } finally {
      setFeatureRequestingKey(null);
    }
  };

  const toggleTaxonomyOption = (group: TaxonomyGroupState, optionKey: string) => {
    setTaxonomyDrafts((current) => {
      const existing = current[group.groupKey] ?? [];
      const exists = existing.includes(optionKey);

      if (group.selectionMode === "single") {
        return {
          ...current,
          [group.groupKey]: exists ? [] : [optionKey],
        };
      }

      return {
        ...current,
        [group.groupKey]: exists ? existing.filter((item) => item !== optionKey) : [...existing, optionKey],
      };
    });
  };

  const handleSaveTaxonomyGroup = async (group: TaxonomyGroupState) => {
    setSavingTaxonomyGroupKey(group.groupKey);
    try {
      await updateUserTaxonomySelection(group.groupKey, taxonomyDrafts[group.groupKey] ?? []);
      await refreshProfile();
      toast({
        title: "Taxonomy seçimi kaydedildi",
        description: `${group.label} güncellendi.`,
      });
    } catch (error) {
      toast({
        title: "Taxonomy kaydedilemedi",
        description: error instanceof Error ? error.message : "Beklenmeyen bir hata oluştu.",
        variant: "destructive",
      });
    } finally {
      setSavingTaxonomyGroupKey(null);
    }
  };

  if (!type || !isProfileType(type)) {
    return <Navigate to={`/profile/${defaultProfileType}`} replace />;
  }

  if (isLoading) {
    return <div className="flex min-h-[70vh] items-center justify-center">Profiliniz hazırlanıyor...</div>;
  }

  if (profile?.profileType && profile.profileType !== type) {
    return <Navigate to={`/profile/${profile.profileType}`} replace />;
  }

  return (
    <div className={`mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-10 ${isIndividualProfile ? "pb-16" : ""}`}>
      <Card className={isIndividualProfile ? "overflow-hidden border-slate-200 shadow-sm" : "border-slate-200 bg-white/90 shadow-sm"}>
        {isIndividualProfile ? (
          <div className="border-b border-border bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.18),transparent_35%),linear-gradient(135deg,rgba(255,255,255,0.98),rgba(248,250,252,0.92))]">
            <CardHeader className="flex flex-col gap-5 pb-4 md:flex-row md:items-start md:justify-between">
              <div className="flex items-start gap-4">
                <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-[24px] bg-gradient-to-br from-sky-500 to-cyan-500 text-2xl font-bold text-white shadow-lg">
                  {initials}
                </div>
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className="border-sky-300/60 bg-sky-50 text-sky-700">
                      <Sparkles className="mr-1 h-3 w-3" /> Bireysel Panelim
                    </Badge>
                    <Badge variant="secondary" className="bg-slate-900 text-white hover:bg-slate-900">
                      {profile?.roleLabel ?? roleMeta?.adminLabel ?? "Rol"}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      Tamamlanma %{profile?.profileCompletion.percentage ?? 0}
                    </Badge>
                    {errorMessage ? <Badge variant="destructive" className="text-xs">Kısmi veri yüklendi</Badge> : null}
                  </div>
                  <div>
                    <CardTitle className="text-3xl tracking-tight text-slate-950">{displayName}</CardTitle>
                    <CardDescription className="mt-1 max-w-2xl text-sm text-slate-600">
                      {shortBio
                        ? `Profil özeti: ${shortBio}`
                        : roleMeta?.description || "Profil kartını, görünürlüğünü ve taleplerini tek yerden yönet."}
                    </CardDescription>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-600">
                    <span className="inline-flex items-center gap-1.5">
                      <UserCircle2 className="h-3.5 w-3.5" /> {profile?.email ?? user?.email ?? "-"}
                    </span>
                    {locationLabel ? (
                      <span className="inline-flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5" /> {locationLabel}
                      </span>
                    ) : null}
                    {roleSpotlight ? (
                      <span className="inline-flex items-center gap-1.5">
                        <Sparkles className="h-3.5 w-3.5" /> İlgi odağı: {roleSpotlight}
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={() => void refreshProfile()}>
                  Yenile
                </Button>
                <Button size="sm" variant="outline" onClick={handleSignOut}>
                  Çıkış Yap
                </Button>
              </div>
            </CardHeader>
            <CardContent className="grid gap-3 pb-6 md:grid-cols-4">
              <div className="rounded-2xl border border-white/70 bg-white/80 p-3 shadow-sm backdrop-blur">
                <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Profil Skoru</p>
                <p className="mt-1 text-2xl font-bold text-slate-950">%{profile?.profileCompletion.percentage ?? 0}</p>
                <p className="mt-1 text-xs text-slate-600">Zorunlu alan tamamlanma oranı</p>
              </div>
              <div className="rounded-2xl border border-white/70 bg-white/80 p-3 shadow-sm backdrop-blur">
                <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Açık Modül</p>
                <p className="mt-1 text-2xl font-bold text-slate-950">{dashboardCount}</p>
                <p className="mt-1 text-xs text-slate-600">Şu an etkin dashboard erişimi</p>
              </div>
              <div className="rounded-2xl border border-white/70 bg-white/80 p-3 shadow-sm backdrop-blur">
                <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Public Alan</p>
                <p className="mt-1 text-2xl font-bold text-slate-950">{publicAttributesCount}</p>
                <p className="mt-1 text-xs text-slate-600">Dışarıya açık profil alanı</p>
              </div>
              <div className="rounded-2xl border border-white/70 bg-white/80 p-3 shadow-sm backdrop-blur">
                <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Bekleyen Talep</p>
                <p className="mt-1 text-2xl font-bold text-slate-950">{pendingCount}</p>
                <p className="mt-1 text-xs text-slate-600">Admin değerlendirme kuyruğu</p>
              </div>
            </CardContent>
          </div>
        ) : null}
        <CardHeader className="flex flex-col gap-3 pb-3 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <CardTitle className={`${isIndividualProfile ? "text-xl" : "text-2xl"}`}>{roleMeta?.title ?? "Profilim"}</CardTitle>
            <CardDescription className="max-w-2xl text-xs">
              {isIndividualProfile
                ? "Aşağıdaki alanlar bireysel profil kartını, directory görünürlüğünü ve erişimlerini belirler."
                : roleMeta?.description}
            </CardDescription>
            <div className="flex flex-wrap items-center gap-1.5">
              <Badge variant="secondary" className="text-xs">{profile?.roleLabel ?? roleMeta?.adminLabel ?? "Rol"}</Badge>
              <Badge variant="outline" className="text-xs">Tamamlanma %{profile?.profileCompletion.percentage ?? 0}</Badge>
              {errorMessage ? <Badge variant="destructive" className="text-xs">Kısmi veri yüklendi</Badge> : null}
            </div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => void refreshProfile()}>
              Yenile
            </Button>
            <Button size="sm" variant="outline" onClick={handleSignOut}>
              Çıkış Yap
            </Button>
          </div>
        </CardHeader>
        <CardContent className={`grid gap-2 pb-4 ${isIndividualProfile ? "md:grid-cols-4" : "md:grid-cols-3"}`}>
          <div className="rounded-lg border bg-slate-50 p-2.5">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Görünen İsim</p>
            <p className="mt-1 text-sm font-semibold">{displayName}</p>
          </div>
          <div className="rounded-lg border bg-slate-50 p-2.5">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">E-posta</p>
            <p className="mt-1 break-all text-xs">{profile?.email ?? user?.email ?? "-"}</p>
          </div>
          <div className="rounded-lg border bg-slate-50 p-2.5">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Bekleyen Talep</p>
            <p className="mt-1 text-sm font-semibold">{pendingCount}</p>
          </div>
          {isIndividualProfile ? (
            <div className="rounded-lg border bg-slate-50 p-2.5">
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Açık Dashboard</p>
              <p className="mt-1 text-sm font-semibold">{dashboardCount}</p>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {isIndividualProfile ? (
        <div className="grid gap-3 md:grid-cols-5">
          {completionHighlights.map((item) => (
            <div key={item.key} className={`rounded-2xl border p-3 ${item.complete ? "border-emerald-200 bg-emerald-50/70" : "border-amber-200 bg-amber-50/70"}`}>
              <div className="flex items-center gap-2">
                {item.complete ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                ) : (
                  <Clock3 className="h-4 w-4 text-amber-700" />
                )}
                <p className="text-sm font-medium text-slate-900">{item.label}</p>
              </div>
              <p className="mt-1 text-xs text-slate-600">
                {item.complete ? "Tamamlandı" : "Eksik veya doldurulmayı bekliyor"}
              </p>
            </div>
          ))}
        </div>
      ) : null}

      <div className={`grid gap-4 ${isIndividualProfile ? "xl:grid-cols-[1.65fr_1fr]" : "xl:grid-cols-[1.8fr_1fr]"}`}>
        <div className="space-y-4">
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="guide-common" className="rounded-lg border bg-blue-50/50 px-3">
              <AccordionTrigger className="py-2 text-sm font-medium hover:no-underline">
                <span className="inline-flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-blue-600" />
                  Ortak Profil Alanları Kullanım Kılavuzu
                </span>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2 text-xs text-muted-foreground">
                  <p><strong className="text-foreground">Görünen İsim:</strong> Directory ve profil kartında gösterilecek adınız. Değişiklikler anında yansır.</p>
                  <p><strong className="text-foreground">Ülke / Şehir:</strong> Konum bilgileriniz. Harita ve filtreleme için kullanılır. Görünürlük ayarını değiştirebilirsiniz.</p>
                  <p><strong className="text-foreground">Profil Fotoğrafı:</strong> Profil kartınızda gösterilecek görsel URL'si. Lütfen doğrudan bir resim bağlantısı girin.</p>
                  <p><strong className="text-foreground">Kısa Biyografi:</strong> Kendinizi tanıtan 1-2 cümlelik özet. Directory listelemelerinde görünür.</p>
                  <p><strong className="text-foreground">Görünürlük Ayarı:</strong> Her alan için <em>Public</em> (herkes görebilir), <em>Private</em> (sizin görebilirsiniz) veya <em>Sadece Admin</em> seçebilirsiniz.</p>
                  <p><strong className="text-foreground">Onay Süreci:</strong> Bazı alanlarda değişiklik yapıldığında admin onayı gerekir. Bu alanlar "Onaylı" etiketi ile işaretlenir.</p>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Ortak Profil Alanları</CardTitle>
              <CardDescription className="text-xs">Bu alanlar profil kartın ve directory görünümün için kullanılır.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {groupedAttributes.common.map((attribute) => (
                <ProfileAttributeEditor
                  key={attribute.attributeKey}
                  attribute={attribute}
                  draftValue={draftValues[attribute.attributeKey]}
                  draftVisibility={draftVisibilities[attribute.attributeKey] ?? attribute.visibility}
                  displayNameLabel={roleMeta?.displayNameLabel ?? "Görünen İsim"}
                  isSaving={savingAttributeKey === attribute.attributeKey}
                  onValueChange={(nextValue) => handleDraftChange(attribute.attributeKey, nextValue)}
                  onVisibilityChange={(nextVisibility) =>
                    setDraftVisibilities((current) => ({ ...current, [attribute.attributeKey]: nextVisibility }))
                  }
                  onSave={() => void handleSaveAttribute(attribute)}
                />
              ))}
            </CardContent>
          </Card>

          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="guide-role" className="rounded-lg border bg-purple-50/50 px-3">
              <AccordionTrigger className="py-2 text-sm font-medium hover:no-underline">
                <span className="inline-flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-purple-600" />
                  Rolüne Özel Alanlar Kullanım Kılavuzu
                </span>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2 text-xs text-muted-foreground">
                  <p>Rolüne özel alanlar, seçtiğin rol türüne göre dinamik olarak belirlenir. Örneğin <strong className="text-foreground">Ambassador</strong> rolünde bölge bilgisi, <strong className="text-foreground">Blogger</strong> rolünde blog URL'si gibi alanlar görünebilir.</p>
                  <p>Bu alanların bir kısmı admin onayı gerektirebilir. Onay gerektiren alanlarda değişiklik yapıldığında "Beklemede" durumu görünür ve admin onaylayana kadar public gösterilmez.</p>
                  <p>Her alan için görünürlük ayarını değiştirebilirsin: <em>Public</em> (herkese açık), <em>Private</em> (gizli), <em>Sadece Admin</em> (admin görebilir).</p>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Rolüne Özel Alanlar</CardTitle>
              <CardDescription className="text-xs">Aktif rolüne bağlı dinamik alanlar burada görünür.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {groupedAttributes.roleSpecific.length > 0 ? (
                groupedAttributes.roleSpecific.map((attribute) => (
                  <ProfileAttributeEditor
                    key={attribute.attributeKey}
                    attribute={attribute}
                    draftValue={draftValues[attribute.attributeKey]}
                    draftVisibility={draftVisibilities[attribute.attributeKey] ?? attribute.visibility}
                    displayNameLabel={roleMeta?.displayNameLabel ?? "Görünen İsim"}
                    isSaving={savingAttributeKey === attribute.attributeKey}
                    onValueChange={(nextValue) => handleDraftChange(attribute.attributeKey, nextValue)}
                    onVisibilityChange={(nextVisibility) =>
                      setDraftVisibilities((current) => ({ ...current, [attribute.attributeKey]: nextVisibility }))
                    }
                    onSave={() => void handleSaveAttribute(attribute)}
                  />
                ))
              ) : (
                <p className="text-xs text-muted-foreground">Bu rol için ek alan bulunmuyor.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Alt Kategori / Alt Tip</CardTitle>
              <CardDescription className="text-xs">Rolüne bağlı taxonomy seçimleri profildeki görünüm ve zorunlu alanları etkiler.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {visibleTaxonomyGroups.length ? (
                visibleTaxonomyGroups.map((group) => {
                  const selectedKeys = taxonomyDrafts[group.groupKey] ?? [];
                  return (
                    <div key={group.groupKey} className="rounded-lg border p-3">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-medium">{group.label}</p>
                          <p className="text-xs text-muted-foreground">{group.description ?? "Rol özel seçim grubu."}</p>
                          <div className="mt-1 flex flex-wrap gap-1">
                            <Badge variant="outline" className="text-[10px]">
                              {group.selectionMode === "multiple" ? "Çoklu seçim" : "Tek seçim"}
                            </Badge>
                            {group.isRequired ? (
                              <Badge variant="secondary" className="text-[10px]">
                                Zorunlu
                              </Badge>
                            ) : null}
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={savingTaxonomyGroupKey === group.groupKey}
                          onClick={() => void handleSaveTaxonomyGroup(group)}
                        >
                          {savingTaxonomyGroupKey === group.groupKey ? "Kaydediliyor..." : "Seçimi Kaydet"}
                        </Button>
                      </div>

                      <div className="mt-3 grid gap-2 md:grid-cols-2">
                        {group.options.filter((option) => option.isActive).map((option) => {
                          const selected = selectedKeys.includes(option.key);
                          return (
                            <button
                              key={option.key}
                              type="button"
                              className={`rounded-lg border px-3 py-2 text-left transition ${
                                selected ? "border-primary bg-primary/5" : "border-border hover:bg-muted/40"
                              }`}
                              onClick={() => toggleTaxonomyOption(group, option.key)}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <p className="text-sm font-medium">{option.label}</p>
                                  <p className="text-xs text-muted-foreground">{option.description ?? "Seçilebilir seçenek"}</p>
                                </div>
                                {selected ? <CheckCircle2 className="mt-0.5 h-4 w-4 text-primary" /> : null}
                              </div>
                            </button>
                          );
                        })}
                      </div>

                      {group.groupKey === "business_subtype" ? (
                        <p className="mt-3 text-xs text-muted-foreground">
                          `Classic` adres ve harita linkini, `Online` website ve servis bölgelerini, `Startup` ise kuruluş yılı gibi alanları öne çıkarır.
                        </p>
                      ) : null}

                      {group.groupKey === "consultant_subcategory" && selectedKeys.includes("consultant_category.gayrimenkul") ? (
                        <p className="mt-3 text-xs text-muted-foreground">
                          Gayrimenkul seçimi aktifken danışman profiline medya/link alanı eklenir ve public kartta bu uzmanlık etiketi gösterilebilir.
                        </p>
                      ) : null}
                    </div>
                  );
                })
              ) : (
                <p className="text-xs text-muted-foreground">Bu rol için taxonomy seçimi tanımlı değil.</p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          {selfProfileViewModel ? (
            <Card className="border-slate-200 bg-white/90 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Cift Modlu Profil Merkezi</CardTitle>
                <CardDescription className="text-xs">
                  Bu alan, kendi profilini duzenlerken loginli diger kullanicilarin gorecegi visitor gorunumunu da ayni ekranda onizlemeni saglar.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="preview" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="preview">Public Onizleme</TabsTrigger>
                    <TabsTrigger value="status">Profil Durumu</TabsTrigger>
                  </TabsList>
                  <TabsContent value="preview" className="mt-4">
                    <PublicProfileSummaryView model={selfProfileViewModel.preview} mode="preview" />
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {roleMeta?.publicSectionKeys.map((key) => (
                        <Badge key={key} variant="outline" className="text-[10px]">
                          {key}
                        </Badge>
                      ))}
                    </div>
                  </TabsContent>
                  <TabsContent value="status" className="mt-4 space-y-3">
                    <div className="grid gap-2 md:grid-cols-2">
                      <div className="rounded-lg border bg-slate-50 p-3">
                        <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Rol</p>
                        <p className="mt-1 text-sm font-semibold">{selfProfileViewModel.roleLabel}</p>
                      </div>
                      <div className="rounded-lg border bg-slate-50 p-3">
                        <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Tamamlanma</p>
                        <p className="mt-1 text-sm font-semibold">%{selfProfileViewModel.completionPercentage}</p>
                      </div>
                      <div className="rounded-lg border bg-slate-50 p-3">
                        <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Public Alan</p>
                        <p className="mt-1 text-sm font-semibold">{selfProfileViewModel.publicAttributeCount}</p>
                      </div>
                      <div className="rounded-lg border bg-slate-50 p-3">
                        <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Açık Dashboard</p>
                        <p className="mt-1 text-sm font-semibold">{selfProfileViewModel.dashboardCount}</p>
                      </div>
                    </div>
                    <div className="rounded-lg border bg-slate-50 p-3">
                      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Self View Blokları</p>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {roleMeta?.selfSectionKeys.map((key) => (
                          <Badge key={key} variant="secondary" className="text-[10px]">
                            {key}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          ) : null}

          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="guide-role-application" className="rounded-lg border bg-emerald-50/50 px-3">
              <AccordionTrigger className="py-2 text-sm font-medium hover:no-underline">
                <span className="inline-flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-emerald-600" />
                  Rol Başvurusu Kılavuzu
                </span>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2 text-xs text-muted-foreground">
                  <p>Her üyenin aynı anda sadece <strong className="text-foreground">bir aktif rolü</strong> olabilir. Mevcut rolünüzden farklı bir role başvurmak için açılır menüden seçim yapın.</p>
                  <p><strong className="text-foreground">Başvuru süreci:</strong> Başvurunuz admin onay kuyruğuna eklenir. Onaylanırsa yeni rolünüz aktifleşir ve eski rolünüz kaldırılır.</p>
                  <p><strong className="text-foreground">Açıklama alanı:</strong> Başvurunuzu destekleyen kısa bir metin yazın. Bu not admin değerlendirmesinde kullanılır.</p>
                  <p><strong className="text-foreground">Mevcut rolünüz:</strong> Profil kartındaki "Rol" etiketi mevcut aktif rolünüzü gösterir. Başvuru onaylanana kadar mevcut rolünüz değişmez.</p>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Rol Başvurusu</CardTitle>
              <CardDescription className="text-xs">Tek aktif rol modeli korunur. Yeni rol için başvuru admin onayına düşer.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Select value={roleRequestTarget} onValueChange={(value) => setRoleRequestTarget(value as ProfileType)}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder="Başvurmak istediğin rolü seç" />
                </SelectTrigger>
                <SelectContent>
                  {availableRoleTargets.map((option) => (
                    <SelectItem key={option.type} value={option.type}>
                      {option.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Textarea
                value={roleRequestNote}
                onChange={(event) => setRoleRequestNote(event.target.value)}
                placeholder="Kısa bir açıklama veya ek bilgi yazabilirsin."
                className="min-h-[60px] text-sm"
              />
              <Button size="sm" className="w-full" disabled={!roleRequestTarget || submittingRoleRequest} onClick={() => void handleSubmitRoleRequest()}>
                {submittingRoleRequest ? "Gönderiliyor..." : "Rol Başvurusu Gönder"}
              </Button>
            </CardContent>
          </Card>

          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="guide-features" className="rounded-lg border bg-amber-50/50 px-3">
              <AccordionTrigger className="py-2 text-sm font-medium hover:no-underline">
                <span className="inline-flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-amber-600" />
                  Feature Talepleri Kılavuzu
                </span>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2 text-xs text-muted-foreground">
                  <p><strong className="text-foreground">Directory Görünürlüğü:</strong> Profilinizin public dizinde görünmesini sağlar. Onaylandıktan sonra diğer üyeler sizi bulabilir.</p>
                  <p><strong className="text-foreground">Featured Profil:</strong> Profil kartınızın dizinde öne çıkarılır. Daha fazla görünürlük sağlar.</p>
                  <p><strong className="text-foreground">WhatsApp Yayınlama:</strong> WhatsApp numaranızın profil kartınızda public olarak gösterilmesi için onay gerekir.</p>
                  <p><strong className="text-foreground">Etkinlik Oluşturma:</strong> Platformda etkinlik yayınlama yetkisi talep edin.</p>
                  <p><strong className="text-foreground">Teklif / Hizmet Oluşturma:</strong> Hizmet veya ürün tekliflerinizi yayınlama erişimi talep edin.</p>
                  <p><strong className="text-foreground">Referral Oluşturma:</strong> Davet kodu oluşturarak yeni üye kazandırma erişimi talep edin.</p>
                  <p><strong className="text-foreground">Talep Durumu:</strong> Her talebiniz admin onay sürecinden geçer. "Beklemede" etiketi göründüğünde talebiniz kuyruktadır.</p>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Feature Talepleri</CardTitle>
              <CardDescription className="text-xs">Kapalı veya onay gerektiren akışlar için tek tıkla talep bırak.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {REQUESTABLE_FEATURES.map((item) => {
                const state = featureMap.get(item.key);
                const isPending = profile?.pendingRequests.some((request) => request.targetFeatureKey === item.key) ?? false;
                return (
                  <div key={item.key} className="rounded-lg border p-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-medium">{item.title}</p>
                        <p className="text-xs text-muted-foreground">{item.description}</p>
                        <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs">
                           <Badge variant="outline" className="text-[10px] px-1.5 py-0">Kaynak: {state?.source ?? "fallback"}</Badge>
                           {isPending ? <Badge variant="outline" className="text-[10px] px-1.5 py-0">Beklemede</Badge> : null}
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="shrink-0 text-xs h-7 px-2"
                        disabled={Boolean(state?.isEnabled) || isPending || featureRequestingKey === item.key}
                        onClick={() => void handleRequestFeature(item.key)}
                      >
                        {featureRequestingKey === item.key ? "Gönderiliyor..." : state?.isEnabled ? "Aktif" : "Talep Et"}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Açık Dashboard Erişimleri</CardTitle>
              <CardDescription className="text-xs">
                {isIndividualProfile
                  ? "Merge edilen panel yapısına uyumlu olarak açık erişimlerini burada kart düzeninde gösteriyoruz."
                  : "Rolün ve override kayıtlarınla şu anda açık olan dashboard tabları."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {isDashboardLoading ? <p className="text-xs text-muted-foreground">Dashboard erişimleri yükleniyor...</p> : null}
              {!isDashboardLoading && dashboardItems.length ? (
                dashboardItems.map((item) => (
                  <div key={item.feature_key} className={`rounded-lg border p-2 ${isIndividualProfile ? "bg-slate-50/60" : ""}`}>
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-medium">{item.label}</p>
                        <p className="text-xs text-muted-foreground">{item.description ?? item.feature_key}</p>
                      </div>
                      <Badge variant="outline" className="text-[10px]">
                        {item.source}
                      </Badge>
                    </div>
                  </div>
                ))
              ) : null}
              {!isDashboardLoading && dashboardItems.length === 0 ? (
                <p className="text-xs text-muted-foreground">Açık dashboard modülü bulunamadı.</p>
              ) : null}
            </CardContent>
          </Card>

          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="guide-pending" className="rounded-lg border bg-slate-50 px-3">
              <AccordionTrigger className="py-2 text-sm font-medium hover:no-underline">
                <span className="inline-flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-slate-600" />
                  Bekleyen Talepler Kılavuzu
                </span>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2 text-xs text-muted-foreground">
                  <p>Bu bölümde admin onayı bekleyen tüm talepleriniz listelenir. Talep türü ve oluşturulma tarihi bilgileri gösterilir.</p>
                  <p><strong className="text-foreground">Rol değişikliği talepleri:</strong> Yeni rol başvurusu yapıldığında burada görünür. Onaylanana veya reddedilene kadar bekler.</p>
                  <p><strong className="text-foreground">Feature talepleri:</strong> Kapalı özellikler için erişim talebinde bulunduğunuzda burada listelenir.</p>
                  <p><strong className="text-foreground">Profil alanı değişiklikleri:</strong> Admin onayı gerektiren alanlarda yapılan güncellemeler burada takip edilir.</p>
                  <p>Talepler genellikle 1-3 iş günü içinde değerlendirilir. Sorularınız için admin ekibiyle iletişime geçebilirsiniz.</p>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Bekleyen Talepler</CardTitle>
              <CardDescription className="text-xs">
                {isIndividualProfile
                  ? "Panel görünümüne etki eden onay süreçleri burada toplanır."
                  : "Admin değerlendirmesi bekleyen son işlemler burada görünür."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {profile?.pendingRequests.length ? (
                profile.pendingRequests.map((request) => (
                  <div key={request.id} className={`rounded-lg border p-2 ${isIndividualProfile ? "bg-slate-50/60" : ""}`}>
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="text-sm font-medium">{request.requestType}</p>
                        <p className="text-xs text-muted-foreground">{new Date(request.createdAt).toLocaleString("tr-TR")}</p>
                      </div>
                      <Badge variant="outline" className="text-[10px]">Pending</Badge>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-muted-foreground">Şu anda bekleyen talebin yok.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

type ProfileAttributeEditorProps = {
  attribute: ProfileAttributeState;
  draftValue: string | boolean | undefined;
  draftVisibility: AttributeVisibility;
  displayNameLabel: string;
  isSaving: boolean;
  onValueChange: (value: string | boolean) => void;
  onVisibilityChange: (value: AttributeVisibility) => void;
  onSave: () => void;
};

const ProfileAttributeEditor = ({
  attribute,
  draftValue,
  draftVisibility,
  displayNameLabel,
  isSaving,
  onValueChange,
  onVisibilityChange,
  onSave,
}: ProfileAttributeEditorProps) => {
  const attributeLabel = attribute.attributeKey === "full_name" ? displayNameLabel : attribute.label;

  return (
    <div className="rounded-lg border p-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="space-y-0.5">
          <div className="flex flex-wrap items-center gap-1.5">
            <p className="text-sm font-semibold">{attributeLabel}</p>
            {attribute.isRequired ? <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Zorunlu</Badge> : null}
            {attribute.requiresAdminApprovalOnChange ? <Badge variant="outline" className="text-[10px] px-1.5 py-0">Onaylı</Badge> : null}
          </div>
          {attribute.description ? <p className="text-xs text-muted-foreground">{attribute.description}</p> : null}
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {attribute.approvalStatus === "approved" ? (
            <span className="inline-flex items-center gap-1 text-emerald-700">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Onaylı
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-amber-700">
              <Clock3 className="h-3.5 w-3.5" />
              Beklemede
            </span>
          )}
          <span className="inline-flex items-center gap-1 text-slate-600">
            {draftVisibility === "public" ? <Globe2 className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />}
            {draftVisibility}
          </span>
        </div>
      </div>

      <div className="mt-3 space-y-2">
        <AttributeInput attribute={attribute} value={draftValue} onChange={onValueChange} />

        <div className="grid gap-2 md:grid-cols-[1fr_auto] md:items-center">
          <div className="max-w-xs">
            <Select
              value={draftVisibility}
              onValueChange={(value) => onVisibilityChange(value as AttributeVisibility)}
              disabled={!attribute.userCanHide}
            >
              <SelectTrigger className="h-8 text-sm">
                <SelectValue placeholder="Görünürlük seç" />
              </SelectTrigger>
              <SelectContent>
                {VISIBILITY_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button size="sm" onClick={onSave} disabled={!attribute.userCanEdit || isSaving}>
            {isSaving ? "Kaydediliyor..." : "Kaydet"}
          </Button>
        </div>

        {attribute.requiresAdminApprovalOnChange ? (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-xs text-amber-900">
            <div className="flex items-start gap-1.5">
              <ShieldCheck className="mt-0.5 h-3.5 w-3.5" />
              <p>Bu alan güncellendiğinde public görünmeden önce admin onayı bekler.</p>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};

type AttributeInputProps = {
  attribute: ProfileAttributeState;
  value: string | boolean | undefined;
  onChange: (value: string | boolean) => void;
};

const AttributeInput = ({ attribute, value, onChange }: AttributeInputProps) => {
  if (attribute.dataType === "textarea" || attribute.dataType === "multi_select" || attribute.dataType === "json") {
    return (
      <Textarea
        value={typeof value === "string" ? value : ""}
        onChange={(event) => onChange(event.target.value)}
        placeholder={attribute.dataType === "multi_select" ? "Virgülle ayırarak yaz" : attribute.label}
      />
    );
  }

  if (attribute.dataType === "boolean") {
    return (
      <div className="flex items-center justify-between rounded-xl border px-3 py-2">
        <p className="text-sm font-medium">{attribute.label}</p>
        <Switch checked={Boolean(value)} onCheckedChange={(checked) => onChange(checked)} />
      </div>
    );
  }

  return (
    <Input
      type={attribute.dataType === "url" ? "url" : "text"}
      value={typeof value === "string" ? value : ""}
      onChange={(event) => onChange(event.target.value)}
      placeholder={attribute.label}
    />
  );
};

export default ProfilePage;
