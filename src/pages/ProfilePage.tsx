import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent, type ComponentType } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import {
  Briefcase,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Eye,
  EyeOff,
  FileText,
  Facebook,
  Globe2,
  HelpCircle,
  ImagePlus,
  Instagram,
  Linkedin,
  Lock,
  MapPin,
  MessageCircle,
  Music2,
  Plane,
  ShieldCheck,
  Sparkles,
  Trash2,
  Twitter,
  UserCircle2,
  UserCheck,
  Youtube,
} from "lucide-react";

import { useAuth } from "@/components/auth/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useCurrentUserProfile } from "@/hooks/useCurrentUserProfile";
import { GENERIC_FEATURE_KEYS, INDIVIDUAL_FEATURE_KEYS } from "@/lib/features";
import { getReferralSourceOptions } from "@/lib/pending-onboarding-normalize";
import {
  updateProfileAttribute,
  updateProfileAvatar,
} from "@/lib/member-profile-api";
import { getAttributeStringValue, type AttributeVisibility, type ProfileAttributeState } from "@/lib/member-profile";
import { getProfileDocumentAccessUrl, parseProfileDocumentRecord, removeProfileDocument, uploadProfileDocument, type ProfileDocumentRecord } from "@/lib/profile-documents";
import { defaultProfileType, getRoleMeta, isProfileType } from "@/lib/profile-types";
import { validateCvFile, validatePresentationFile } from "@/lib/security";
import { formatBytes } from "@/lib/submissions";
import { supabase } from "@/integrations/supabase/client";
import SearchableCountrySelect from "@/components/SearchableCountrySelect";
import SearchableCitySelect from "@/components/SearchableCitySelect";

type DraftValueMap = Record<string, string | boolean>;
type DraftVisibilityMap = Record<string, AttributeVisibility>;

type SocialAttributeConfig = {
  key: string;
  label: string;
  placeholder: string;
  icon: ComponentType<{ className?: string }>;
  iconClassName: string;
};

const VISIBILITY_OPTIONS: { value: AttributeVisibility; label: string }[] = [
  { value: "public", label: "Görünür" },
  { value: "private", label: "Gizli" },
];

const SOCIAL_ATTRIBUTE_CONFIGS: SocialAttributeConfig[] = [
  {
    key: "instagram_url",
    label: "Instagram",
    placeholder: "@kullanıcıadı veya tam URL",
    icon: Instagram,
    iconClassName: "text-pink-500",
  },
  {
    key: "facebook_url",
    label: "Facebook",
    placeholder: "Sayfa URL'si",
    icon: Facebook,
    iconClassName: "text-blue-600",
  },
  {
    key: "youtube_url",
    label: "YouTube",
    placeholder: "@kanal veya URL",
    icon: Youtube,
    iconClassName: "text-red-600",
  },
  {
    key: "tiktok_url",
    label: "TikTok",
    placeholder: "@kullanıcıadı",
    icon: Music2,
    iconClassName: "text-foreground",
  },
  {
    key: "x_url",
    label: "X (Twitter)",
    placeholder: "@kullanıcıadı",
    icon: Twitter,
    iconClassName: "text-foreground",
  },
  {
    key: "reddit_url",
    label: "Reddit",
    placeholder: "u/kullanıcıadı veya URL",
    icon: MessageCircle,
    iconClassName: "text-orange-500",
  },
] as const;

const SOCIAL_ATTRIBUTE_KEYS = new Set(SOCIAL_ATTRIBUTE_CONFIGS.map((config) => config.key));
const PROFILE_PHOTO_ATTRIBUTE_KEY = "profile_photo_url";
const LINKEDIN_ATTRIBUTE_KEY = "linkedin_url";
const WEBSITE_ATTRIBUTE_KEY = "website_url";
const JOB_SEEKING_OPT_IN_ATTRIBUTE_KEY = "job_seeking_opt_in";
const MOVING_SOON_OPT_IN_ATTRIBUTE_KEY = "moving_soon_opt_in";
const VOLUNTEER_MENTORSHIP_OPT_IN_ATTRIBUTE_KEY = "volunteer_mentorship_opt_in";
const CV_DOCUMENT_ATTRIBUTE_KEY = "cv_doc";
const PRESENTATION_DOCUMENT_ATTRIBUTE_KEY = "presentation_doc";
const REFERRAL_CODE_ATTRIBUTE_KEY = "referral_code";
const REFERRAL_SOURCE_ATTRIBUTE_KEY = "referral_source";
const PRIVATE_ONLY_ONBOARDING_ATTRIBUTE_KEYS = new Set([
  REFERRAL_CODE_ATTRIBUTE_KEY,
  REFERRAL_SOURCE_ATTRIBUTE_KEY,
]);
const HIDDEN_ROLE_SPECIFIC_ATTRIBUTE_KEYS = new Set([
  "full_name",
  "interests",
]);
const SPECIAL_PROFILE_ATTRIBUTE_KEYS = new Set([
  PROFILE_PHOTO_ATTRIBUTE_KEY,
  LINKEDIN_ATTRIBUTE_KEY,
  WEBSITE_ATTRIBUTE_KEY,
  JOB_SEEKING_OPT_IN_ATTRIBUTE_KEY,
  MOVING_SOON_OPT_IN_ATTRIBUTE_KEY,
  VOLUNTEER_MENTORSHIP_OPT_IN_ATTRIBUTE_KEY,
  CV_DOCUMENT_ATTRIBUTE_KEY,
  PRESENTATION_DOCUMENT_ATTRIBUTE_KEY,
]);
const AVATARS_BUCKET = "avatars";
const PROFILE_CV_BUCKET = "profile-cv-files";
const PROFILE_PRESENTATION_BUCKET = "profile-presentation-files";
const MAX_PROFILE_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;

const GOOGLE_SOFT_CARD_HERO =
  "overflow-hidden border-orange-100/60 shadow-[0_2px_16px_-4px_rgba(0,0,0,0.1),0_0_24px_-6px_rgba(249,115,22,0.22)]";
const GOOGLE_SOFT_CARD_SECTION =
  "border-orange-100/50 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.08),0_0_18px_-6px_rgba(249,115,22,0.18)]";
const GOOGLE_SOFT_CARD_BLUE_SECTION =
  "border-blue-100/60 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.08),0_0_28px_-4px_rgba(66,133,244,0.40)]";
const GOOGLE_SOFT_CARD_YELLOW_SECTION =
  "border-yellow-100/60 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.08),0_0_28px_-4px_rgba(251,188,4,0.40)]";
const GOOGLE_SOFT_CARD_GREEN_SECTION =
  "border-green-100/60 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.08),0_0_28px_-4px_rgba(52,168,83,0.40)]";
const GOOGLE_SOFT_CARD_RED_SECTION =
  "border-red-100/60 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.08),0_0_28px_-4px_rgba(234,67,53,0.40)]";
const GOOGLE_SOFT_CARD_SUBTLE =
  "border border-gray-100 bg-gray-50/80";
const GOOGLE_SOFT_CARD_SUBTLE_INTERACTIVE =
  "border border-gray-100 bg-gray-50/80 transition hover:bg-gray-100/80 hover:-translate-y-0.5";

const GOOGLE_SOFT_SUBTLE_WARM =
  "border border-orange-100 bg-orange-50/60";
const GOOGLE_SOFT_SUBTLE_COOL =
  "border border-blue-100 bg-blue-50/60";
const GOOGLE_SOFT_SUBTLE_GREEN =
  "border border-green-100 bg-green-50/60";
const GOOGLE_SOFT_SUBTLE_RED =
  "border border-red-100 bg-red-50/60";

const GOOGLE_SOFT_HERO_SURFACE =
  "border-b border-gray-100 bg-white";
const GOOGLE_SOFT_ACTION_PANEL =
  "rounded-2xl border border-gray-200 bg-gray-50 p-3 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.08)]";
const GOOGLE_SOFT_SUCCESS_PANEL =
  "border border-green-200 bg-green-50";
const GOOGLE_SOFT_DANGER_PANEL =
  "border border-red-200 bg-red-50";
const GOOGLE_SOFT_WARNING_PANEL =
  "border border-orange-200 bg-orange-50";
const GOOGLE_SOFT_SWITCH_PANEL =
  "border border-gray-100 bg-gray-50";

const AMBER_BUTTON_PRIMARY =
  "text-[11px] border border-[rgba(234,88,12,0.3)] bg-[linear-gradient(180deg,rgba(249,115,22,0.95),rgba(234,88,0,0.9))] text-white shadow-[0_10px_24px_-12px_rgba(249,115,22,0.5)] hover:bg-[linear-gradient(180deg,rgba(251,146,60,0.97),rgba(249,115,22,0.95))] hover:shadow-[0_12px_28px_-10px_rgba(249,115,22,0.62)]";
const AMBER_BUTTON_OUTLINE =
  "text-[11px] border border-[rgba(249,115,22,0.38)] bg-[rgba(255,255,255,0.82)] text-orange-700 shadow-[0_8px_18px_-14px_rgba(249,115,22,0.24)] hover:bg-[rgba(249,115,22,0.09)] hover:border-[rgba(249,115,22,0.55)] hover:text-orange-800";
const AMBER_ACTION_BUTTON =
  "h-10 w-full min-w-0 justify-center rounded-xl border border-[rgba(249,115,22,0.28)] bg-[rgba(255,255,255,0.85)] px-3 text-[11px] font-medium text-orange-700 shadow-[0_12px_26px_-24px_rgba(249,115,22,0.3)] backdrop-blur-[2px] hover:bg-[rgba(249,115,22,0.1)] hover:border-[rgba(249,115,22,0.46)] hover:text-orange-800";


const buildAvatarStoragePath = (userId: string, file: File) => {
  const safeExtension = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
  return `${userId}/profile-${Date.now()}.${safeExtension}`;
};

const getPublicAvatarUrl = (path: string) => supabase.storage.from(AVATARS_BUCKET).getPublicUrl(path).data.publicUrl;

const getAvatarStoragePathFromUrl = (url: string | null) => {
  if (!url) return null;
  const marker = `/storage/v1/object/public/${AVATARS_BUCKET}/`;
  const index = url.indexOf(marker);
  if (index === -1) return null;
  return decodeURIComponent(url.slice(index + marker.length));
};

const ensureHttpsUrl = (value: string) => (value.match(/^https?:\/\//i) ? value : `https://${value}`);

const normalizeSocialMediaValue = (attributeKey: string, rawValue: string) => {
  const value = rawValue.trim();
  if (!value) return "";

  if (/^https?:\/\//i.test(value)) {
    return value;
  }

  switch (attributeKey) {
    case "instagram_url": {
      if (/instagram\.com/i.test(value)) return ensureHttpsUrl(value);
      return `https://www.instagram.com/${value.replace(/^@+/, "")}`;
    }
    case "facebook_url": {
      if (/facebook\.com/i.test(value)) return ensureHttpsUrl(value);
      return `https://www.facebook.com/${value.replace(/^@+/, "")}`;
    }
    case "linkedin_url": {
      if (/linkedin\.com/i.test(value)) return ensureHttpsUrl(value);
      return `https://www.linkedin.com/in/${value.replace(/^@+/, "")}`;
    }
    case "youtube_url": {
      if (/youtube\.com|youtu\.be/i.test(value)) return ensureHttpsUrl(value);
      const cleaned = value.replace(/^@+/, "");
      return `https://www.youtube.com/@${cleaned}`;
    }
    case "tiktok_url": {
      if (/tiktok\.com/i.test(value)) return ensureHttpsUrl(value);
      return `https://www.tiktok.com/@${value.replace(/^@+/, "")}`;
    }
    case "x_url": {
      if (/x\.com|twitter\.com/i.test(value)) return ensureHttpsUrl(value);
      return `https://x.com/${value.replace(/^@+/, "")}`;
    }
    case "reddit_url": {
      if (/reddit\.com/i.test(value)) return ensureHttpsUrl(value);
      const cleaned = value.replace(/^\/+/, "");
      if (/^(u|r)\//i.test(cleaned)) {
        return `https://www.reddit.com/${cleaned}`;
      }
      return `https://www.reddit.com/u/${cleaned.replace(/^@+/, "")}`;
    }
    default:
      return value;
  }
};

const mapAttributeDraftValue = (attribute: ProfileAttributeState): string | boolean => {
  if (attribute.dataType === "boolean") {
    return Boolean(attribute.valueJson);
  }

  if (attribute.dataType === "multi_select" && Array.isArray(attribute.valueJson)) {
    return attribute.valueJson.join(", ");
  }

  return getAttributeStringValue(attribute);
};

const readBooleanAttributeValue = (attribute: ProfileAttributeState | null | undefined) => {
  return attribute?.valueJson === true;
};

const formatDocumentMeta = (document: ProfileDocumentRecord | null) => {
  if (!document) return "Henüz dosya yüklenmedi.";

  const details = [
    document.contentType ? document.contentType.toUpperCase() : "",
    document.sizeBytes ? formatBytes(document.sizeBytes) : "",
  ].filter(Boolean);

  return details.length ? `${details.join(" • ")}` : "Dosya hazır";
};

const ProfilePage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { type } = useParams<{ type: string }>();
  const { isLoading, errorMessage, profile, refreshProfile } = useCurrentUserProfile(true);

  const [draftValues, setDraftValues] = useState<DraftValueMap>({});
  const [draftVisibilities, setDraftVisibilities] = useState<DraftVisibilityMap>({});
  const [socialMediaAllVisible, setSocialMediaAllVisible] = useState(true);
  const [commonAttributesAllVisible, setCommonAttributesAllVisible] = useState(true);
  const [savingAttributeKey, setSavingAttributeKey] = useState<string | null>(null);
  const [savingCommonAttributes, setSavingCommonAttributes] = useState(false);
  const [savingSocialMedia, setSavingSocialMedia] = useState(false);
  const [savingRoleSpecificAttributes, setSavingRoleSpecificAttributes] = useState(false);
  const [savingPreferenceKey, setSavingPreferenceKey] = useState<string | null>(null);
  const [uploadingDocumentKey, setUploadingDocumentKey] = useState<string | null>(null);
  const [removingDocumentKey, setRemovingDocumentKey] = useState<string | null>(null);
  const [openingDocumentKey, setOpeningDocumentKey] = useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarRemoving, setAvatarRemoving] = useState(false);
  const [isProfileSummaryOpen, setIsProfileSummaryOpen] = useState(false);
  const helpCardRef = useRef<HTMLDivElement | null>(null);
  const avatarInputRef = useRef<HTMLInputElement | null>(null);
  const cvInputRef = useRef<HTMLInputElement | null>(null);
  const presentationInputRef = useRef<HTMLInputElement | null>(null);

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

  const roleMeta = useMemo(() => getRoleMeta(profile?.profileType ?? type), [profile?.profileType, type]);

  const featureMap = useMemo(() => {
    return new Map((profile?.features ?? []).map((feature) => [feature.key, feature]));
  }, [profile?.features]);

  const isFeatureEnabled = useCallback((featureKey: string) => {
    return featureMap.get(featureKey)?.isEnabled ?? false;
  }, [featureMap]);

  const groupedAttributes = useMemo(() => {
    const common: ProfileAttributeState[] = [];
    const socialMedia: ProfileAttributeState[] = [];
    const roleSpecific: ProfileAttributeState[] = [];

    for (const attribute of profile?.attributes ?? []) {
      if (["country", "city", "bio_short"].includes(attribute.attributeKey)) {
        common.push(attribute);
      } else if (SPECIAL_PROFILE_ATTRIBUTE_KEYS.has(attribute.attributeKey)) {
        continue;
      } else if (SOCIAL_ATTRIBUTE_KEYS.has(attribute.attributeKey)) {
        socialMedia.push(attribute);
      } else if (HIDDEN_ROLE_SPECIFIC_ATTRIBUTE_KEYS.has(attribute.attributeKey)) {
        continue;
      } else {
        roleSpecific.push(attribute);
      }
    }

    socialMedia.sort((left, right) => {
      const leftIndex = SOCIAL_ATTRIBUTE_CONFIGS.findIndex((item) => item.key === left.attributeKey);
      const rightIndex = SOCIAL_ATTRIBUTE_CONFIGS.findIndex((item) => item.key === right.attributeKey);
      return leftIndex - rightIndex;
    });

    return { common, socialMedia, roleSpecific };
  }, [profile?.attributes]);

  const attributeMap = useMemo(() => {
    return new Map((profile?.attributes ?? []).map((attribute) => [attribute.attributeKey, attribute]));
  }, [profile?.attributes]);
  const displayNameAttribute = attributeMap.get("full_name") ?? null;

  const readAttributeValue = useCallback((attributeKey: string) => {
    const attribute = attributeMap.get(attributeKey);
    return attribute ? getAttributeStringValue(attribute) : "";
  }, [attributeMap]);

  const linkedinAttribute = attributeMap.get(LINKEDIN_ATTRIBUTE_KEY) ?? null;
  const websiteAttribute = attributeMap.get(WEBSITE_ATTRIBUTE_KEY) ?? null;
  const jobSeekingOptInAttribute = attributeMap.get(JOB_SEEKING_OPT_IN_ATTRIBUTE_KEY) ?? null;
  const movingSoonOptInAttribute = attributeMap.get(MOVING_SOON_OPT_IN_ATTRIBUTE_KEY) ?? null;
  const volunteerMentorshipOptInAttribute = attributeMap.get(VOLUNTEER_MENTORSHIP_OPT_IN_ATTRIBUTE_KEY) ?? null;
  const cvDocumentAttribute = attributeMap.get(CV_DOCUMENT_ATTRIBUTE_KEY) ?? null;
  const presentationDocumentAttribute = attributeMap.get(PRESENTATION_DOCUMENT_ATTRIBUTE_KEY) ?? null;
  const cvDocument = parseProfileDocumentRecord(cvDocumentAttribute?.valueJson);
  const presentationDocument = parseProfileDocumentRecord(presentationDocumentAttribute?.valueJson);

  const isIndividualProfile = roleMeta?.canonicalSlug === "individual";
  const jobSeekingFeatureEnabled = isFeatureEnabled(INDIVIDUAL_FEATURE_KEYS.jobSeekingBadge);
  const movingSoonFeatureEnabled = isFeatureEnabled(INDIVIDUAL_FEATURE_KEYS.movingSoonBadge);
  const volunteerMentorshipFeatureEnabled = isFeatureEnabled(INDIVIDUAL_FEATURE_KEYS.volunteerMentorship);
  const linkedinCardEnabled = isFeatureEnabled(GENERIC_FEATURE_KEYS.profileLinkedinCard);
  const websiteCardEnabled = isFeatureEnabled(GENERIC_FEATURE_KEYS.profileWebsiteCard);
  const cvUploadEnabled = isFeatureEnabled(GENERIC_FEATURE_KEYS.profileCvUpload);
  const presentationUploadEnabled = isFeatureEnabled(GENERIC_FEATURE_KEYS.profilePresentationUpload);
  const displayName = readAttributeValue("full_name") || profile?.fullName || user?.user_metadata?.name || "CorteQS Üyesi";
  const displayNameLabel = roleMeta?.displayNameLabel ?? "Görünen İsim";
  const shortBio = readAttributeValue("bio_short");
  const country = readAttributeValue("country");
  const city = readAttributeValue("city");
  const currentAvatarUrl = readAttributeValue(PROFILE_PHOTO_ATTRIBUTE_KEY);
  const roleSpotlight = readAttributeValue(roleMeta?.defaultAttributeKey ?? "interests");
  const locationLabel = [city, country].filter(Boolean).join(", ");
  const heroDescription = shortBio
    ? `Profil özeti: ${shortBio}`
    : isIndividualProfile
      ? ""
      : roleMeta?.description || "Profil kartını, görünürlüğünü ve taleplerini tek yerden yönet.";
  const initials = displayName
    .split(/\s+/)
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase() || "CQ";
  const pendingCount = profile?.pendingRequests.length ?? 0;
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
  const featureToggleCards = [
    {
      key: JOB_SEEKING_OPT_IN_ATTRIBUTE_KEY,
      enabled: jobSeekingFeatureEnabled,
      checked: readBooleanAttributeValue(jobSeekingOptInAttribute),
      title: "İş Arıyorum Badge'i",
      description: "Profilinde \"İş Arıyorum\" etiketi görünür.",
      icon: Briefcase,
      toneClassName: GOOGLE_SOFT_CARD_SUBTLE,
    },
    {
      key: MOVING_SOON_OPT_IN_ATTRIBUTE_KEY,
      enabled: movingSoonFeatureEnabled,
      checked: readBooleanAttributeValue(movingSoonOptInAttribute),
      title: "Yakında Taşınacağım",
      description: "Profilinde yakında taşınacağını belirten rozet görünür.",
      icon: Plane,
      toneClassName: GOOGLE_SOFT_WARNING_PANEL,
    },
    {
      key: VOLUNTEER_MENTORSHIP_OPT_IN_ATTRIBUTE_KEY,
      enabled: volunteerMentorshipFeatureEnabled,
      checked: readBooleanAttributeValue(volunteerMentorshipOptInAttribute),
      title: "Gönüllü Mentörlük",
      description: "Açıldığında profilinden gönüllü mentör görünürlüğü aktif olur.",
      icon: UserCheck,
      toneClassName: GOOGLE_SOFT_SUCCESS_PANEL,
    },
  ].filter((item) => item.enabled);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/login", { replace: true });
  };

  const scrollToHelpCard = () => {
    helpCardRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleAvatarFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!user || !file) return;

    if (!file.type.startsWith("image/")) {
      toast({
        title: "Geçersiz dosya",
        description: "Lütfen bir görsel dosyası seç.",
        variant: "destructive",
      });
      return;
    }

    if (file.size > MAX_PROFILE_IMAGE_SIZE_BYTES) {
      toast({
        title: "Dosya çok büyük",
        description: "Profil resmi en fazla 5 MB olabilir.",
        variant: "destructive",
      });
      return;
    }

    const nextPath = buildAvatarStoragePath(user.id, file);
    const previousPath = getAvatarStoragePathFromUrl(currentAvatarUrl);

    setAvatarUploading(true);
    try {
      const { error: uploadError } = await supabase.storage
        .from(AVATARS_BUCKET)
        .upload(nextPath, file, { contentType: file.type, upsert: true });

      if (uploadError) throw uploadError;

      const publicUrl = getPublicAvatarUrl(nextPath);
      await updateProfileAvatar(publicUrl);

      if (previousPath && previousPath !== nextPath) {
        await supabase.storage.from(AVATARS_BUCKET).remove([previousPath]);
      }

      await refreshProfile();
      toast({
        title: "Profil resmi güncellendi",
        description: "Yeni görsel profilinde kullanılmaya başlandı.",
      });
    } catch (error) {
      toast({
        title: "Profil resmi yüklenemedi",
        description: error instanceof Error ? error.message : "Beklenmeyen bir hata oluştu.",
        variant: "destructive",
      });
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleRemoveAvatar = async () => {
    const previousPath = getAvatarStoragePathFromUrl(currentAvatarUrl);

    setAvatarRemoving(true);
    try {
      await updateProfileAvatar(null);

      if (previousPath) {
        await supabase.storage.from(AVATARS_BUCKET).remove([previousPath]);
      }

      await refreshProfile();
      toast({
        title: "Profil resmi kaldırıldı",
        description: "Avatar ve public profil görseli temizlendi.",
      });
    } catch (error) {
      toast({
        title: "Profil resmi kaldırılamadı",
        description: error instanceof Error ? error.message : "Beklenmeyen bir hata oluştu.",
        variant: "destructive",
      });
    } finally {
      setAvatarRemoving(false);
    }
  };

  const handleCvFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    const validationError = validateCvFile(file);
    if (validationError) {
      toast({
        title: "CV yüklenemedi",
        description: validationError,
        variant: "destructive",
      });
      return;
    }

    await handleUploadDocument(CV_DOCUMENT_ATTRIBUTE_KEY, PROFILE_CV_BUCKET, file, cvDocument);
  };

  const handlePresentationFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    const validationError = validatePresentationFile(file);
    if (validationError) {
      toast({
        title: "Sunum yüklenemedi",
        description: validationError,
        variant: "destructive",
      });
      return;
    }

    await handleUploadDocument(PRESENTATION_DOCUMENT_ATTRIBUTE_KEY, PROFILE_PRESENTATION_BUCKET, file, presentationDocument);
  };

  const handleDraftChange = (attributeKey: string, nextValue: string | boolean) => {
    setDraftValues((current) => ({ ...current, [attributeKey]: nextValue }));
  };

  const buildAttributePayload = (attribute: ProfileAttributeState) => {
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
      const textValue = String(rawValue ?? "").trim();
      valueToSend = SOCIAL_ATTRIBUTE_KEYS.has(attribute.attributeKey) || attribute.attributeKey === LINKEDIN_ATTRIBUTE_KEY
        ? normalizeSocialMediaValue(attribute.attributeKey, textValue)
        : attribute.attributeKey === WEBSITE_ATTRIBUTE_KEY && textValue
          ? ensureHttpsUrl(textValue)
        : textValue;
    }

    return { valueToSend, visibility };
  };

  const handleSaveAttribute = async (attribute: ProfileAttributeState) => {
    const { valueToSend, visibility } = buildAttributePayload(attribute);

    if (attribute.dataType !== "boolean") {
      const textValue = String(valueToSend ?? "").trim();
      if (!textValue) {
        toast({
          title: "Alan boş",
          description: `${attribute.label} alanını doldurmadan kaydedemezsiniz.`,
          variant: "destructive",
        });
        return;
      }
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

  const handleSaveCommonAttributes = async () => {
    if (!groupedAttributes.common.length) return;

    const attributesToSave = groupedAttributes.common.filter((attribute) => {
      const rawValue = draftValues[attribute.attributeKey];
      if (attribute.dataType === "boolean") return true;
      const textValue = String(rawValue ?? "").trim();
      return textValue.length > 0;
    });

    if (!attributesToSave.length) {
      toast({ title: "Kaydedilecek alan bulunamadı", description: "En az bir ortak alanı doldurun." });
      return;
    }

    setSavingCommonAttributes(true);
    try {
      for (const attribute of attributesToSave) {
        const { valueToSend, visibility } = buildAttributePayload(attribute);
        await updateProfileAttribute(attribute.attributeKey, valueToSend, visibility);
      }

      await refreshProfile();
      toast({
        title: "Ortak profil alanları kaydedildi",
        description: "İsim, konum, biyografi ve görünürlük ayarları güncellendi.",
      });
    } catch (error) {
      toast({
        title: "Ortak alanlar kaydedilemedi",
        description: error instanceof Error ? error.message : "Beklenmeyen bir hata oluştu.",
        variant: "destructive",
      });
    } finally {
      setSavingCommonAttributes(false);
    }
  };

  const handleSaveSocialMedia = async () => {
    if (!groupedAttributes.socialMedia.length) return;

    setSavingSocialMedia(true);
    try {
      for (const attribute of groupedAttributes.socialMedia) {
        const rawValue = String(draftValues[attribute.attributeKey] ?? "").trim();
        if (!rawValue) continue;
        const normalizedValue = normalizeSocialMediaValue(attribute.attributeKey, rawValue);
        const visibility = draftVisibilities[attribute.attributeKey] ?? attribute.visibility;
        await updateProfileAttribute(attribute.attributeKey, normalizedValue, visibility);
      }

      await refreshProfile();
      toast({
        title: "Sosyal medya alanları kaydedildi",
        description: "Bağlantılar ve görünürlük ayarları güncellendi.",
      });
    } catch (error) {
      toast({
        title: "Sosyal medya alanları kaydedilemedi",
        description: error instanceof Error ? error.message : "Beklenmeyen bir hata oluştu.",
        variant: "destructive",
      });
    } finally {
      setSavingSocialMedia(false);
    }
  };

  const handleSaveRoleSpecificAttributes = async () => {
    if (!groupedAttributes.roleSpecific.length) return;

    const attributesToSave = groupedAttributes.roleSpecific.filter((attribute) => {
      const rawValue = draftValues[attribute.attributeKey];
      if (attribute.dataType === "boolean") return true;
      return String(rawValue ?? "").trim().length > 0;
    });

    if (!attributesToSave.length) {
      toast({
        title: "Kaydedilecek alan bulunamadı",
        description: "En az bir rolüne özel alanı doldurun.",
      });
      return;
    }

    setSavingRoleSpecificAttributes(true);
    try {
      for (const attribute of attributesToSave) {
        const { valueToSend, visibility } = buildAttributePayload(attribute);
        await updateProfileAttribute(attribute.attributeKey, valueToSend, visibility);
      }

      await refreshProfile();
      toast({
        title: "Rolüne özel alanlar kaydedildi",
        description: "Yeni bireysel onboarding alanları ve diğer rol özel alanlar güncellendi.",
      });
    } catch (error) {
      toast({
        title: "Rolüne özel alanlar kaydedilemedi",
        description: error instanceof Error ? error.message : "Beklenmeyen bir hata oluştu.",
        variant: "destructive",
      });
    } finally {
      setSavingRoleSpecificAttributes(false);
    }
  };

  const patchIndividualProfileDetails = async (
    patchBuilder: (
      current: {
        front_card: Record<string, unknown> | null;
        detail_card: Record<string, unknown> | null;
        profile_settings: Record<string, unknown> | null;
      } | null,
    ) => Record<string, unknown>,
  ) => {
    if (!user || !isIndividualProfile) return;

    const { data: currentRow, error: currentError } = await supabase
      .from("individual_profile_details")
      .select("front_card, detail_card, profile_settings")
      .eq("user_id", user.id)
      .maybeSingle();

    if (currentError) throw currentError;

    const payload = patchBuilder(currentRow as {
      front_card: Record<string, unknown> | null;
      detail_card: Record<string, unknown> | null;
      profile_settings: Record<string, unknown> | null;
    } | null);

    const { error: upsertError } = await supabase.from("individual_profile_details").upsert({
      user_id: user.id,
      ...payload,
    });

    if (upsertError) throw upsertError;
  };

  const handleSavePreferenceToggle = async (attributeKey: string, checked: boolean) => {
    setSavingPreferenceKey(attributeKey);
    try {
      await updateProfileAttribute(attributeKey, checked, "public");

      if (attributeKey === JOB_SEEKING_OPT_IN_ATTRIBUTE_KEY) {
        await patchIndividualProfileDetails(() => ({
          job_seeking: checked,
        }));
      }

      if (attributeKey === MOVING_SOON_OPT_IN_ATTRIBUTE_KEY) {
        await patchIndividualProfileDetails((current) => {
          const existingDetailCard =
            current?.detail_card && typeof current.detail_card === "object" ? current.detail_card : {};
          const existingRelocation =
            existingDetailCard.relocation && typeof existingDetailCard.relocation === "object"
              ? (existingDetailCard.relocation as Record<string, unknown>)
              : {};

          return {
            detail_card: {
              ...existingDetailCard,
              relocation: {
                ...existingRelocation,
                enabled: checked,
              },
            },
          };
        });
      }

      if (attributeKey === VOLUNTEER_MENTORSHIP_OPT_IN_ATTRIBUTE_KEY) {
        await patchIndividualProfileDetails(() => ({
          mentor_opt_in: checked,
        }));
      }

      await refreshProfile();
      toast({
        title: "Tercih güncellendi",
        description: checked ? "Profil tercihi görünür oldu." : "Profil tercihi kapatıldı.",
      });
    } catch (error) {
      toast({
        title: "Tercih kaydedilemedi",
        description: error instanceof Error ? error.message : "Beklenmeyen bir hata oluştu.",
        variant: "destructive",
      });
    } finally {
      setSavingPreferenceKey(null);
    }
  };

  const handleSaveLinkCard = async (attribute: ProfileAttributeState) => {
    const { valueToSend, visibility } = buildAttributePayload(attribute);
    const normalizedValue = typeof valueToSend === "string" ? valueToSend : String(valueToSend ?? "");

    setSavingAttributeKey(attribute.attributeKey);
    try {
      await updateProfileAttribute(attribute.attributeKey, normalizedValue, visibility);

      if (attribute.attributeKey === LINKEDIN_ATTRIBUTE_KEY) {
        await patchIndividualProfileDetails((current) => {
          const frontCard =
            current?.front_card && typeof current.front_card === "object" ? current.front_card : {};
          const profileSettings =
            current?.profile_settings && typeof current.profile_settings === "object" ? current.profile_settings : {};

          return {
            front_card: {
              ...frontCard,
              linkedin_url: normalizedValue || null,
              linkedin_visible: visibility === "public",
            },
            profile_settings: {
              ...profileSettings,
              linkedin: normalizedValue || "",
            },
          };
        });
      }

      if (attribute.attributeKey === WEBSITE_ATTRIBUTE_KEY) {
        await patchIndividualProfileDetails((current) => {
          const profileSettings =
            current?.profile_settings && typeof current.profile_settings === "object" ? current.profile_settings : {};

          return {
            profile_settings: {
              ...profileSettings,
              website_links: normalizedValue ? [normalizedValue] : [],
              websites: normalizedValue ? [normalizedValue] : [],
            },
          };
        });
      }

      await refreshProfile();
      toast({
        title: "Bağlantı kaydedildi",
        description: `${attribute.label} güncellendi.`,
      });
    } catch (error) {
      toast({
        title: "Bağlantı kaydedilemedi",
        description: error instanceof Error ? error.message : "Beklenmeyen bir hata oluştu.",
        variant: "destructive",
      });
    } finally {
      setSavingAttributeKey(null);
    }
  };

  const handleOpenDocument = async (documentKey: string, document: ProfileDocumentRecord | null) => {
    if (!document) return;
    setOpeningDocumentKey(documentKey);
    try {
      const signedUrl = await getProfileDocumentAccessUrl(document);
      window.open(signedUrl, "_blank", "noopener,noreferrer");
    } catch (error) {
      toast({
        title: "Dosya açılamadı",
        description: error instanceof Error ? error.message : "Beklenmeyen bir hata oluştu.",
        variant: "destructive",
      });
    } finally {
      setOpeningDocumentKey(null);
    }
  };

  const handleUploadDocument = async (
    attributeKey: string,
    bucket: string,
    file: File,
    currentDocument: ProfileDocumentRecord | null,
  ) => {
    if (!user) return;

    setUploadingDocumentKey(attributeKey);
    let nextDocument: ProfileDocumentRecord | null = null;
    try {
      nextDocument = await uploadProfileDocument(bucket, user.id, file);
      await updateProfileAttribute(attributeKey, nextDocument, "private");

      if (currentDocument) {
        await removeProfileDocument(currentDocument);
      }

      await refreshProfile();
      toast({
        title: "Dosya yüklendi",
        description: `${file.name} profil dosyalarına eklendi.`,
      });
    } catch (error) {
      toast({
        title: "Dosya yüklenemedi",
        description: error instanceof Error ? error.message : "Beklenmeyen bir hata oluştu.",
        variant: "destructive",
      });
      if (nextDocument) {
        await removeProfileDocument(nextDocument).catch(() => undefined);
      }
    } finally {
      setUploadingDocumentKey(null);
    }
  };

  const handleRemoveDocument = async (attributeKey: string, document: ProfileDocumentRecord | null) => {
    setRemovingDocumentKey(attributeKey);
    try {
      await updateProfileAttribute(attributeKey, null, "private");

      if (document) {
        await removeProfileDocument(document);
      }

      await refreshProfile();
      toast({
        title: "Dosya kaldırıldı",
        description: "Profil dosyası güvenli şekilde silindi.",
      });
    } catch (error) {
      toast({
        title: "Dosya kaldırılamadı",
        description: error instanceof Error ? error.message : "Beklenmeyen bir hata oluştu.",
        variant: "destructive",
      });
    } finally {
      setRemovingDocumentKey(null);
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

  const avatarActionButtons = (
    <div className="flex flex-wrap gap-2">
      <Card className="w-full">
        <div className="flex gap-2 p-2">
          <Button
            size="sm"
            className={AMBER_BUTTON_PRIMARY}
            onClick={() => avatarInputRef.current?.click()}
            disabled={avatarUploading || avatarRemoving}
          >
            <ImagePlus className="mr-1.5 h-4 w-4" />
            {avatarUploading ? "Yükleniyor..." : currentAvatarUrl ? "Resmi Değiştir" : "Resim Yükle"}
          </Button>
          <Button
            size="sm"
            className={AMBER_BUTTON_OUTLINE}
            onClick={() => void handleRemoveAvatar()}
            disabled={!currentAvatarUrl || avatarUploading || avatarRemoving}
          >
            <Trash2 className="mr-1.5 h-4 w-4" />
            {avatarRemoving ? "Kaldırılıyor..." : "Resmi Kaldır"}
          </Button>
        </div>
      </Card>
    </div>
  );

  const heroActionButtons = (
    <div className={`w-full max-w-[280px] shrink-0 self-start ${GOOGLE_SOFT_ACTION_PANEL}`}>
      <div className="mb-1.5 px-1 text-center text-[11px] font-medium text-orange-700">
        Profil Fotoğrafı
      </div>
      <div className="grid grid-cols-2 gap-1.5">
        <Card className="col-span-2">
          <div className="flex gap-1.5 p-1">
            <Button
              className={`${AMBER_ACTION_BUTTON} h-8 text-[11px] flex-1`}
              onClick={() => avatarInputRef.current?.click()}
              disabled={avatarUploading || avatarRemoving}
            >
              <ImagePlus className="mr-1 h-3.5 w-3.5" />
              {avatarUploading ? "Yükleniyor..." : currentAvatarUrl ? "Değiştir" : "Yükle"}
            </Button>
            <Button
              className={`${AMBER_ACTION_BUTTON} h-8 text-[11px] flex-1`}
              onClick={() => void handleRemoveAvatar()}
              disabled={!currentAvatarUrl || avatarUploading || avatarRemoving}
            >
              <Trash2 className="mr-1 h-3.5 w-3.5" />
              {avatarRemoving ? "Kaldırılıyor..." : "Kaldır"}
            </Button>
          </div>
        </Card>
        <Button className={`${AMBER_ACTION_BUTTON} h-8 text-[11px]`} onClick={scrollToHelpCard}>
          <HelpCircle className="mr-1 h-3.5 w-3.5" />
          Yardım
        </Button>
        <Button className={`${AMBER_ACTION_BUTTON} h-8 text-[11px]`} onClick={() => void refreshProfile()}>
          Yenile
        </Button>
      </div>
      <Button className={`${AMBER_ACTION_BUTTON} h-8 mt-1.5 text-[11px]`} onClick={handleSignOut}>
        Çıkış Yap
      </Button>
    </div>
  );

  return (
    <div className={`relative mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-10 ${isIndividualProfile ? "pb-16" : ""}`}>
      <input
        ref={avatarInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/jpg"
        className="hidden"
        onChange={(event) => void handleAvatarFileChange(event)}
      />
      <input
        ref={cvInputRef}
        type="file"
        accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        className="hidden"
        onChange={(event) => void handleCvFileChange(event)}
      />
      <input
        ref={presentationInputRef}
        type="file"
        accept=".pdf,.ppt,.pptx,.key,application/pdf,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation,application/x-iwork-keynote-sffkey"
        className="hidden"
        onChange={(event) => void handlePresentationFileChange(event)}
      />
      <Card className={isIndividualProfile ? GOOGLE_SOFT_CARD_HERO : GOOGLE_SOFT_CARD_BLUE_SECTION}>
        {isIndividualProfile ? (
          <div className={GOOGLE_SOFT_HERO_SURFACE}>
            <CardHeader className="flex flex-col gap-5 pb-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="flex min-w-0 flex-1 items-start gap-4">
                {currentAvatarUrl ? (
                  <img
                    src={currentAvatarUrl}
                    alt={displayName}
                    className="h-40 w-40 shrink-0 rounded-2xl object-cover shadow-[0_4px_16px_-4px_rgba(249,115,22,0.3)]"
                  />
                ) : (
                  <div className="flex h-40 w-40 shrink-0 items-center justify-center rounded-2xl bg-orange-500 text-[11px] font-bold text-white shadow-[0_6px_20px_-6px_rgba(249,115,22,0.45)]">
                    {initials}
                  </div>
                )}
                <div className="space-y-2">
                  {errorMessage ? (
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="destructive" className="text-[11px]">Kısmi veri yüklendi</Badge>
                    </div>
                  ) : null}
                  <div>
                    <CardTitle className="text-[11px] tracking-tight text-slate-950 md:text-[11px]">{displayName}</CardTitle>
                    {heroDescription ? (
                      <CardDescription className="mt-1 max-w-2xl text-[11px] text-slate-600">
                        {heroDescription}
                      </CardDescription>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] text-slate-600">
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
              {heroActionButtons}
            </CardHeader>
          </div>
        ) : null}
        {!isIndividualProfile ? (
          <>
            <CardHeader className="flex flex-col gap-3 pb-3 md:flex-row md:items-center md:justify-between">
              <div className="space-y-1">
                <CardTitle className="text-[11px]">{roleMeta?.title ?? "Profilim"}</CardTitle>
                <div className="flex flex-wrap items-center gap-1.5">
                  <Badge variant="secondary" className="text-[11px]">{profile?.roleLabel ?? roleMeta?.adminLabel ?? "Rol"}</Badge>
                  <Badge variant="outline" className="text-[11px]">Tamamlanma %{profile?.profileCompletion.percentage ?? 0}</Badge>
                  {errorMessage ? <Badge variant="destructive" className="text-[11px]">Kısmi veri yüklendi</Badge> : null}
                </div>
                <div className="pt-1">
                  {avatarActionButtons}
                </div>
              </div>
            </CardHeader>
            <CardContent className="grid gap-2 pb-4 md:grid-cols-3">
              <div className={`rounded-lg p-2.5 ${GOOGLE_SOFT_CARD_SUBTLE}`}>
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Görünen İsim</p>
                <p className="mt-1 text-[11px] font-semibold">{displayName}</p>
              </div>
              <div className={`rounded-lg p-2.5 ${GOOGLE_SOFT_CARD_SUBTLE}`}>
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">E-posta</p>
                <p className="mt-1 break-all text-[11px]">{profile?.email ?? user?.email ?? "-"}</p>
              </div>
              <div className={`rounded-lg p-2.5 ${GOOGLE_SOFT_CARD_SUBTLE}`}>
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Bekleyen Talep</p>
                <p className="mt-1 text-[11px] font-semibold">{pendingCount}</p>
              </div>
            </CardContent>
          </>
        ) : null}
      </Card>

      {isIndividualProfile ? (
        <Card className={`overflow-hidden ${GOOGLE_SOFT_CARD_BLUE_SECTION}`}>
          <CardHeader className="p-0">
            <button
              type="button"
              className="flex w-full items-center justify-between gap-3 px-6 py-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              aria-expanded={isProfileSummaryOpen}
              aria-controls="profile-summary-content"
              onClick={() => setIsProfileSummaryOpen((current) => !current)}
            >
              <CardTitle className="text-[11px]">Profil Durumu</CardTitle>
              <ChevronDown
                className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${isProfileSummaryOpen ? "rotate-180" : ""}`}
              />
            </button>
          </CardHeader>
          {isProfileSummaryOpen ? (
            <CardContent id="profile-summary-content" className="pt-0 pb-4">
              <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-6">
                <div className={`flex items-center gap-2 rounded-[20px] px-2.5 py-1.5 text-[11px] ${GOOGLE_SOFT_CARD_SUBTLE}`}>
                  <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500">Profil Skoru</p>
                  <p className="font-bold text-slate-950">%{profile?.profileCompletion.percentage ?? 0}</p>
                </div>
                {completionHighlights.map((item) => (
                  <div
                    key={item.key}
                    className={`flex items-center gap-1.5 rounded-2xl px-2.5 py-1.5 text-[11px] ${item.complete ? GOOGLE_SOFT_SUCCESS_PANEL : GOOGLE_SOFT_DANGER_PANEL}`}
                  >
                    <div className="flex items-center gap-1.5">
                      {item.complete ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                      ) : (
                        <Clock3 className="h-3.5 w-3.5 text-rose-500" />
                      )}
                      <p className="font-semibold text-slate-900">{item.label}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          ) : null}
        </Card>
      ) : null}

      <div className="space-y-4">
          {displayNameAttribute ? (
            <Card className={GOOGLE_SOFT_CARD_BLUE_SECTION}>
              <CardHeader className="pb-2">
                <CardTitle className="text-[11px]">Profil Alanları</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 shrink-0 w-32">
                    <span className="text-[10px] font-medium text-foreground truncate">{roleMeta?.displayNameLabel ?? "Görünen İsim"}</span>
                    {displayNameAttribute.isRequired ? (
                      <Badge variant="secondary" className="px-1.5 py-0 text-[9px] shrink-0">Zorunlu</Badge>
                    ) : null}
                  </div>
                  <Input
                    type="text"
                    value={typeof draftValues[displayNameAttribute.attributeKey] === "string" ? draftValues[displayNameAttribute.attributeKey] : ""}
                    onChange={(event) => handleDraftChange(displayNameAttribute.attributeKey, event.target.value)}
                    placeholder={displayNameAttribute.label}
                    className="h-8 flex-1 text-[10px] placeholder:text-[10px]"
                  />
                  <div className={`flex items-center gap-1.5 rounded-full px-2 shrink-0 ${GOOGLE_SOFT_SWITCH_PANEL}`} style={{ height: '32px' }}>
                    {draftVisibilities[displayNameAttribute.attributeKey] ?? displayNameAttribute.visibility === "public" ? (
                      <Eye className="h-3.5 w-3.5 shrink-0 text-primary" />
                    ) : (
                      <EyeOff className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    )}
                    <Switch
                      checked={(draftVisibilities[displayNameAttribute.attributeKey] ?? displayNameAttribute.visibility) === "public"}
                      onCheckedChange={(checked) => setDraftVisibilities((current) => ({ ...current, [displayNameAttribute.attributeKey]: checked ? "public" : "private" }))}
                      disabled={!displayNameAttribute.userCanHide}
                      aria-label={`${roleMeta?.displayNameLabel ?? "Görünen İsim"} görünürlük`}
                    />
                  </div>
                  <Button size="sm" className={AMBER_BUTTON_PRIMARY} onClick={() => void handleSaveAttribute(displayNameAttribute)} disabled={!displayNameAttribute.userCanEdit || savingAttributeKey === displayNameAttribute.attributeKey}>
                    {savingAttributeKey === displayNameAttribute.attributeKey ? "Kaydediliyor..." : displayNameAttribute.attributeKey === "full_name" ? "Ad Soyadı Kaydet" : "İsmi Kaydet"}
                  </Button>
                </div>

                <Separator className="my-2" />

                <div className="flex flex-col gap-3">
                  <div className="grid gap-3 sm:grid-cols-2">
                    {groupedAttributes.common
                      .filter((attr) => ["country", "city"].includes(attr.attributeKey))
                      .map((attribute) => (
                        <div key={attribute.attributeKey} className="space-y-1">
                          <label className="text-[10px] font-medium text-foreground">
                            {attribute.attributeKey === "country" ? "Ülke" : "Şehir"}
                          </label>
                          {attribute.attributeKey === "country" ? (
                            <SearchableCountrySelect
                              value={typeof draftValues[attribute.attributeKey] === "string" ? draftValues[attribute.attributeKey] : ""}
                              onChange={(nextValue) => handleDraftChange(attribute.attributeKey, nextValue)}
                              size="sm"
                            />
                          ) : (
                            <SearchableCitySelect
                              value={typeof draftValues[attribute.attributeKey] === "string" ? draftValues[attribute.attributeKey] : ""}
                              onChange={(nextValue) => handleDraftChange(attribute.attributeKey, nextValue)}
                              countryName={typeof draftValues["country"] === "string" ? draftValues["country"] : undefined}
                              size="sm"
                            />
                          )}
                        </div>
                      ))}
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex-1 space-y-1">
                      <label className="text-[10px] font-medium text-foreground">Kısa Açıklama</label>
                      {groupedAttributes.common
                      .filter((attr) => attr.attributeKey === "bio_short")
                      .map((attribute) => (
                        <Input
                          key={attribute.attributeKey}
                          type="text"
                          value={typeof draftValues[attribute.attributeKey] === "string" ? draftValues[attribute.attributeKey] : ""}
                          onChange={(event) => handleDraftChange(attribute.attributeKey, event.target.value)}
                          placeholder={attribute.label}
                          className="h-8 text-[10px] placeholder:text-[10px]"
                        />
                      ))}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <div className={`flex items-center gap-1.5 rounded-full px-2 ${GOOGLE_SOFT_SWITCH_PANEL}`} style={{ height: '32px' }}>
                        {commonAttributesAllVisible ? (
                          <Eye className="h-3.5 w-3.5 text-primary" />
                        ) : (
                          <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />
                        )}
                        <Switch
                          checked={commonAttributesAllVisible}
                          onCheckedChange={(checked) => {
                            setCommonAttributesAllVisible(checked);
                            setDraftVisibilities((current) => {
                              const updated = { ...current };
                              groupedAttributes.common.forEach((attr) => {
                                updated[attr.attributeKey] = checked ? "public" : "private";
                              });
                              return updated;
                            });
                          }}
                        />
                      </div>
                      <Button size="sm" className={AMBER_BUTTON_PRIMARY} onClick={() => void handleSaveCommonAttributes()} disabled={savingCommonAttributes}>
                        {savingCommonAttributes ? "Kaydediliyor..." : "Ortak Alanları Kaydet"}
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : null}

          {featureToggleCards.length ? (
            <Card className={GOOGLE_SOFT_CARD_GREEN_SECTION}>
              <CardHeader className="pb-2">
                <CardTitle className="text-[11px]">Profil Rozetleri</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {featureToggleCards.map((item) => (
                  <PreferenceToggleCard
                    key={item.key}
                    title={item.title}
                    description={item.description}
                    checked={item.checked}
                    toneClassName={item.toneClassName}
                    icon={item.icon}
                    disabled={savingPreferenceKey === item.key}
                    onCheckedChange={(checked) => void handleSavePreferenceToggle(item.key, checked)}
                  />
                ))}
              </CardContent>
            </Card>
          ) : null}

          <Card className={GOOGLE_SOFT_CARD_RED_SECTION}>
            <CardHeader className="pb-2">
              <CardTitle className="text-[11px]">Sosyal Medya Hesapları</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {groupedAttributes.socialMedia.length ? (
                <>
                  <div className="grid gap-3 md:grid-cols-2">
                    {groupedAttributes.socialMedia.map((attribute) => {
                      const config = SOCIAL_ATTRIBUTE_CONFIGS.find((item) => item.key === attribute.attributeKey);
                      if (!config) return null;
                      const Icon = config.icon;

                      return (
                        <div key={attribute.attributeKey} className="flex items-center gap-2">
                          <div className="flex items-center gap-1.5 shrink-0 w-32">
                            <Icon className={`h-4 w-4 ${config.iconClassName}`} />
                            <span className="text-[10px] font-medium text-foreground truncate">{config.label}</span>
                          </div>
                          <Input
                            value={typeof draftValues[attribute.attributeKey] === "string" ? String(draftValues[attribute.attributeKey] ?? "") : ""}
                            onChange={(event) => handleDraftChange(attribute.attributeKey, event.target.value)}
                            placeholder={config.placeholder}
                            className="h-8 flex-1 text-[10px] placeholder:text-[10px]"
                          />
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex items-center justify-end gap-2">
                    <div className={`flex items-center gap-1.5 rounded-full px-2 ${GOOGLE_SOFT_SWITCH_PANEL}`} style={{ height: '32px' }}>
                      {socialMediaAllVisible ? (
                        <Eye className="h-3.5 w-3.5 text-primary" />
                      ) : (
                        <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />
                      )}
                      <Switch
                        checked={socialMediaAllVisible}
                        onCheckedChange={(checked) => {
                          setSocialMediaAllVisible(checked);
                          setDraftVisibilities((current) => {
                            const updated = { ...current };
                            groupedAttributes.socialMedia.forEach((attr) => {
                              updated[attr.attributeKey] = checked ? "public" : "private";
                            });
                            return updated;
                          });
                        }}
                      />
                    </div>
                    <Button size="sm" className={AMBER_BUTTON_PRIMARY} onClick={() => void handleSaveSocialMedia()} disabled={savingSocialMedia}>
                      {savingSocialMedia ? "Kaydediliyor..." : "Sosyal Medya Kartını Kaydet"}
                    </Button>
                  </div>
                </>
              ) : (
                <p className="text-[11px] text-muted-foreground">Bu profil için sosyal medya alanları henüz etkin değil.</p>
              )}
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            {linkedinCardEnabled && linkedinAttribute ? (
              <StandaloneLinkAttributeCard
                attribute={linkedinAttribute}
                cardClassName={GOOGLE_SOFT_CARD_BLUE_SECTION}
                title="LinkedIn"
                description="LinkedIn profil linkini ayrı kartta yönet ve istersen public göster."
                icon={Linkedin}
                iconClassName="text-sky-700"
                draftValue={draftValues[linkedinAttribute.attributeKey]}
                draftVisibility={draftVisibilities[linkedinAttribute.attributeKey] ?? linkedinAttribute.visibility}
                isSaving={savingAttributeKey === linkedinAttribute.attributeKey}
                onValueChange={(nextValue) => handleDraftChange(linkedinAttribute.attributeKey, nextValue)}
                onVisibilityChange={(nextVisibility) =>
                  setDraftVisibilities((current) => ({ ...current, [linkedinAttribute.attributeKey]: nextVisibility }))
                }
                onSave={() => void handleSaveLinkCard(linkedinAttribute)}
              />
            ) : null}

            {websiteCardEnabled && websiteAttribute ? (
              <StandaloneLinkAttributeCard
                attribute={websiteAttribute}
                cardClassName={GOOGLE_SOFT_CARD_GREEN_SECTION}
                title="Web Sitesi"
                description="Kişisel veya kurumsal web siteni ayrı kartta yönet."
                icon={Globe2}
                iconClassName="text-emerald-700"
                draftValue={draftValues[websiteAttribute.attributeKey]}
                draftVisibility={draftVisibilities[websiteAttribute.attributeKey] ?? websiteAttribute.visibility}
                isSaving={savingAttributeKey === websiteAttribute.attributeKey}
                onValueChange={(nextValue) => handleDraftChange(websiteAttribute.attributeKey, nextValue)}
                onVisibilityChange={(nextVisibility) =>
                  setDraftVisibilities((current) => ({ ...current, [websiteAttribute.attributeKey]: nextVisibility }))
                }
                onSave={() => void handleSaveLinkCard(websiteAttribute)}
              />
            ) : null}
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            {cvUploadEnabled ? (
              <ProfileDocumentCard
                cardClassName={GOOGLE_SOFT_CARD_YELLOW_SECTION}
                title="CV / Özgeçmiş"
                description="Private bucket içinde saklanır. Sadece sen ve admin erişebilir."
                icon={FileText}
                document={cvDocument}
                acceptLabel="PDF, DOC, DOCX"
                statusLabel={formatDocumentMeta(cvDocument)}
                isUploading={uploadingDocumentKey === CV_DOCUMENT_ATTRIBUTE_KEY}
                isRemoving={removingDocumentKey === CV_DOCUMENT_ATTRIBUTE_KEY}
                isOpening={openingDocumentKey === CV_DOCUMENT_ATTRIBUTE_KEY}
                onUploadClick={() => cvInputRef.current?.click()}
                onOpenClick={() => void handleOpenDocument(CV_DOCUMENT_ATTRIBUTE_KEY, cvDocument)}
                onRemoveClick={() => void handleRemoveDocument(CV_DOCUMENT_ATTRIBUTE_KEY, cvDocument)}
              />
            ) : null}

            {presentationUploadEnabled ? (
              <ProfileDocumentCard
                cardClassName={GOOGLE_SOFT_CARD_RED_SECTION}
                title="Sunum / Tanıtım"
                description="Private bucket içinde saklanır. Public profile linklerine eklenmez."
                icon={BookOpen}
                document={presentationDocument}
                acceptLabel="PDF, PPT, PPTX, KEY"
                statusLabel={formatDocumentMeta(presentationDocument)}
                isUploading={uploadingDocumentKey === PRESENTATION_DOCUMENT_ATTRIBUTE_KEY}
                isRemoving={removingDocumentKey === PRESENTATION_DOCUMENT_ATTRIBUTE_KEY}
                isOpening={openingDocumentKey === PRESENTATION_DOCUMENT_ATTRIBUTE_KEY}
                onUploadClick={() => presentationInputRef.current?.click()}
                onOpenClick={() => void handleOpenDocument(PRESENTATION_DOCUMENT_ATTRIBUTE_KEY, presentationDocument)}
                onRemoveClick={() => void handleRemoveDocument(PRESENTATION_DOCUMENT_ATTRIBUTE_KEY, presentationDocument)}
              />
            ) : null}
          </div>

          <Card className={GOOGLE_SOFT_CARD_GREEN_SECTION}>
            <CardHeader className="pb-2">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-[11px]">Rolüne Özel Alanlar</CardTitle>
                  <CardDescription className="text-[11px]">
                    Aktif rolüne bağlı alanları tek kartta güncelle. Referral alanları backend tarafından private tutulur.
                  </CardDescription>
                </div>
                <Button
                  size="sm"
                  className={AMBER_BUTTON_PRIMARY}
                  onClick={() => void handleSaveRoleSpecificAttributes()}
                  disabled={savingRoleSpecificAttributes || !groupedAttributes.roleSpecific.length}
                >
                  {savingRoleSpecificAttributes ? "Kaydediliyor..." : "Rolüne Özel Alanları Kaydet"}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {groupedAttributes.roleSpecific.length ? (
                groupedAttributes.roleSpecific.map((attribute) => (
                  <ProfileAttributeEditor
                    key={attribute.attributeKey}
                    attribute={attribute}
                    draftValue={draftValues[attribute.attributeKey]}
                    draftVisibility={draftVisibilities[attribute.attributeKey] ?? attribute.visibility}
                    displayNameLabel={displayNameLabel}
                    isSaving={savingRoleSpecificAttributes}
                    saveMode="section"
                    visibilityMode="inline-switch"
                    hideVisibilityControl={PRIVATE_ONLY_ONBOARDING_ATTRIBUTE_KEYS.has(attribute.attributeKey)}
                    onValueChange={(nextValue) => handleDraftChange(attribute.attributeKey, nextValue)}
                    onVisibilityChange={(nextVisibility) =>
                      setDraftVisibilities((current) => ({ ...current, [attribute.attributeKey]: nextVisibility }))
                    }
                  />
                ))
              ) : (
                <p className="text-[11px] text-muted-foreground">
                  Bu rol için şu an kullanıcı tarafından düzenlenebilir özel alan bulunmuyor.
                </p>
              )}
            </CardContent>
          </Card>

          <LockedProfileSectionCard
            title="Alt Kategori / Alt Tip"
            description="Rolüne bağlı taxonomy seçimleri profildeki görünüm ve zorunlu alanları etkiler."
            className={GOOGLE_SOFT_CARD_YELLOW_SECTION}
          />
      </div>

      <LockedProfileSectionCard
        title="Başvurular & Erişimler"
        description="Rol başvurularını, feature taleplerini, açık erişimlerini ve bekleyen süreçlerini tek kartta yönet."
        className={GOOGLE_SOFT_CARD_RED_SECTION}
      />

      <div ref={helpCardRef}>
        <LockedProfileSectionCard
          title="Yardım & Kılavuzlar"
          description="Profilini doldururken ihtiyaç duyacağın tüm açıklamaları tek yerde topladık."
          className={GOOGLE_SOFT_CARD_BLUE_SECTION}
          titleIcon={HelpCircle}
        />
      </div>
  </div>
);
};

type LockedProfileSectionCardProps = {
  title: string;
  description: string;
  className: string;
  titleIcon?: ComponentType<{ className?: string }>;
};

const LockedProfileSectionCard = ({
  title,
  description,
  className,
  titleIcon: TitleIcon,
}: LockedProfileSectionCardProps) => (
  <Card className={`overflow-hidden ${className}`}>
    <CardHeader className="p-0">
      <button
        type="button"
        disabled
        aria-disabled="true"
        aria-expanded="false"
        className="flex w-full items-center justify-between gap-3 rounded-[30px] px-6 py-4 text-left opacity-100"
      >
        <div className="space-y-1">
          <CardTitle className="flex items-center gap-2 text-[11px]">
            {TitleIcon ? <TitleIcon className="h-4 w-4 text-primary" /> : null}
            {title}
          </CardTitle>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="border-slate-300 bg-white/85 text-[11px] uppercase tracking-[0.18em] text-slate-600">
            Locked
          </Badge>
          <Lock className="h-4 w-4 text-slate-500" />
        </div>
      </button>
    </CardHeader>
  </Card>
);

type ProfileAttributeEditorProps = {
  attribute: ProfileAttributeState;
  draftValue: string | boolean | undefined;
  draftVisibility: AttributeVisibility;
  displayNameLabel: string;
  isSaving: boolean;
  saveMode: "single" | "section";
  visibilityMode: "select" | "collapsible-radio" | "inline-switch";
  hideVisibilityControl?: boolean;
  onValueChange: (value: string | boolean) => void;
  onVisibilityChange: (value: AttributeVisibility) => void;
  onSave?: () => void;
};

type DisplayNameAttributeCardProps = {
  attribute: ProfileAttributeState;
  displayNameLabel: string;
  draftValue: string | boolean | undefined;
  draftVisibility: AttributeVisibility;
  isSaving: boolean;
  onValueChange: (value: string | boolean) => void;
  onVisibilityChange: (value: AttributeVisibility) => void;
  onSave: () => void;
};

const DisplayNameAttributeCard = ({
  attribute,
  displayNameLabel,
  draftValue,
  draftVisibility,
  isSaving,
  onValueChange,
  onVisibilityChange,
  onSave,
}: DisplayNameAttributeCardProps) => {
  const visibilityLocked = !attribute.userCanHide;
  const saveButtonLabel = displayNameLabel.toLowerCase().includes("ad soyad")
    ? "Ad Soyadı Kaydet"
    : "İsmi Kaydet";

  return (
    <Card className={GOOGLE_SOFT_CARD_BLUE_SECTION}>
      <CardHeader className="pb-2">
        <CardTitle className="text-[11px]">{displayNameLabel}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-col gap-3 md:flex-row md:items-start">
          <div className="flex-1 space-y-2">
            {attribute.isRequired ? (
              <Badge variant="secondary" className="px-1.5 py-0 text-[11px]">Zorunlu</Badge>
            ) : null}
            <AttributeInput attribute={attribute} value={draftValue} onChange={onValueChange} />
          </div>
          <div className="w-full md:w-[92px]">
            <div className={`flex h-10 items-center justify-between gap-1.5 rounded-full px-2 text-[11px] ${GOOGLE_SOFT_SWITCH_PANEL}`}>
              {draftVisibility === "public" ? (
                <Eye className="h-3.5 w-3.5 shrink-0 text-primary" />
              ) : (
                <EyeOff className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              )}
              <Switch
                checked={draftVisibility === "public"}
                onCheckedChange={(checked) => onVisibilityChange(checked ? "public" : "private")}
                disabled={visibilityLocked}
                aria-label={`${displayNameLabel} görünürlük`}
              />
            </div>
          </div>
        </div>
        <div className="flex justify-end">
          <Button size="sm" className={AMBER_BUTTON_PRIMARY} onClick={onSave} disabled={!attribute.userCanEdit || isSaving}>
            {isSaving ? "Kaydediliyor..." : saveButtonLabel}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

const ProfileAttributeEditor = ({
  attribute,
  draftValue,
  draftVisibility,
  displayNameLabel,
  isSaving,
  saveMode,
  visibilityMode,
  hideVisibilityControl = false,
  onValueChange,
  onVisibilityChange,
  onSave,
}: ProfileAttributeEditorProps) => {
  const [isVisibilityOpen, setIsVisibilityOpen] = useState(false);
  const attributeLabel = attribute.attributeKey === "full_name" ? displayNameLabel : attribute.label;
  const visibilityLabel = VISIBILITY_OPTIONS.find((option) => option.value === draftVisibility)?.label ?? draftVisibility;
  const visibilityLocked = !attribute.userCanHide;
  const approvalLabel = attribute.approvalStatus === "approved" ? "Onaylı" : "Beklemede";

  if (visibilityMode === "inline-switch") {
    return (
      <div className={`rounded-lg px-2.5 py-2 ${GOOGLE_SOFT_CARD_SUBTLE}`}>
        <div className="flex items-start gap-2">
          <div className="w-28 shrink-0 space-y-1 sm:w-36">
            <div className="flex flex-wrap items-center gap-1">
              <p className="text-[11px] font-semibold leading-4">{attributeLabel}</p>
              {attribute.isRequired ? <Badge variant="secondary" className="px-1.5 py-0 text-[11px]">Zorunlu</Badge> : null}
            </div>
          </div>

          <div className="min-w-0 flex-1">
            <AttributeInput attribute={attribute} value={draftValue} onChange={onValueChange} compact />
          </div>

          {hideVisibilityControl ? null : (
            <div className="w-[84px] shrink-0">
              <div className={`flex h-9 items-center justify-between gap-1.5 rounded-full px-2 text-[11px] ${GOOGLE_SOFT_SWITCH_PANEL}`}>
                {draftVisibility === "public" ? (
                  <Eye className="h-3.5 w-3.5 shrink-0 text-primary" />
                ) : (
                  <EyeOff className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                )}
                <Switch
                  checked={draftVisibility === "public"}
                  onCheckedChange={(checked) => onVisibilityChange(checked ? "public" : "private")}
                  disabled={visibilityLocked}
                  aria-label={`${attributeLabel} görünürlük`}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-lg p-3 ${GOOGLE_SOFT_CARD_SUBTLE}`}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="space-y-0.5">
          <div className="flex flex-wrap items-center gap-1.5">
            <p className="text-[11px] font-semibold">{attributeLabel}</p>
            {attribute.isRequired ? <Badge variant="secondary" className="text-[11px] px-1.5 py-0">Zorunlu</Badge> : null}
            {attribute.requiresAdminApprovalOnChange ? (
              <Badge variant="outline" className="text-[11px] px-1.5 py-0">Onaylı</Badge>
            ) : null}
          </div>
          {attribute.description ? <p className="text-[11px] text-muted-foreground">{attribute.description}</p> : null}
        </div>
        <div className="flex flex-wrap items-center gap-2 text-[11px]">
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
          {!hideVisibilityControl ? (
            <span className="inline-flex items-center gap-1 text-slate-600">
              {draftVisibility === "public" ? <Globe2 className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />}
              {visibilityLabel}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-slate-600">
              <Lock className="h-3.5 w-3.5" />
              Private
            </span>
          )}
        </div>
      </div>

      <div className="mt-3 space-y-2">
        <AttributeInput attribute={attribute} value={draftValue} onChange={onValueChange} />

        {hideVisibilityControl ? null : visibilityMode === "collapsible-radio" ? (
          <Collapsible open={isVisibilityOpen} onOpenChange={setIsVisibilityOpen}>
            <div className={`rounded-xl ${GOOGLE_SOFT_CARD_SUBTLE}`}>
              <CollapsibleTrigger asChild>
                <button
                  type="button"
                  className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left"
                  disabled={visibilityLocked}
                >
                  <div>
                    <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Görünürlük</p>
                    <p className="text-[11px] font-medium text-foreground">{visibilityLabel}</p>
                  </div>
                  <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${isVisibilityOpen ? "rotate-180" : ""}`} />
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent className="data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down overflow-hidden border-t">
                <RadioGroup
                  value={draftVisibility}
                  onValueChange={(value) => onVisibilityChange(value as AttributeVisibility)}
                  className="gap-2 p-3"
                >
                  {VISIBILITY_OPTIONS.map((option) => {
                    const optionId = `${attribute.attributeKey}-${option.value}`;
                    return (
                      <label
                        key={option.value}
                        htmlFor={optionId}
                        className={`flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-[11px] ${GOOGLE_SOFT_CARD_SUBTLE_INTERACTIVE}`}
                      >
                        <RadioGroupItem value={option.value} id={optionId} />
                        <span>{option.label}</span>
                      </label>
                    );
                  })}
                </RadioGroup>
              </CollapsibleContent>
            </div>
          </Collapsible>
        ) : (
          <div className="max-w-xs">
            <Select
              value={draftVisibility}
              onValueChange={(value) => onVisibilityChange(value as AttributeVisibility)}
              disabled={visibilityLocked}
            >
              <SelectTrigger className="h-8 text-[11px]">
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
        )}

        {saveMode === "single" && onSave ? (
          <div className="flex justify-end">
            <Button size="sm" className={AMBER_BUTTON_PRIMARY} onClick={onSave} disabled={!attribute.userCanEdit || isSaving}>
              {isSaving ? "Kaydediliyor..." : "Kaydet"}
            </Button>
          </div>
        ) : null}

        {attribute.requiresAdminApprovalOnChange ? (
          <div className={`rounded-lg px-2.5 py-1.5 text-[11px] text-amber-900 ${GOOGLE_SOFT_WARNING_PANEL}`}>
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

type PreferenceToggleCardProps = {
  title: string;
  description: string;
  checked: boolean;
  disabled: boolean;
  toneClassName: string;
  icon: ComponentType<{ className?: string }>;
  onCheckedChange: (checked: boolean) => void;
};

const PreferenceToggleCard = ({
  title,
  description,
  checked,
  disabled,
  toneClassName,
  icon: Icon,
  onCheckedChange,
}: PreferenceToggleCardProps) => {
  return (
    <div className={`rounded-xl p-3 ${toneClassName}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2">
          <Icon className="mt-0.5 h-4 w-4 text-foreground" />
          <div>
            <p className="text-[11px] font-medium text-foreground">{title}</p>
            <p className="text-[11px] text-muted-foreground">{description}</p>
          </div>
        </div>
        <Switch checked={checked} disabled={disabled} onCheckedChange={onCheckedChange} />
      </div>
    </div>
  );
};

type StandaloneLinkAttributeCardProps = {
  attribute: ProfileAttributeState;
  cardClassName?: string;
  title: string;
  description: string;
  icon: ComponentType<{ className?: string }>;
  iconClassName: string;
  draftValue: string | boolean | undefined;
  draftVisibility: AttributeVisibility;
  isSaving: boolean;
  onValueChange: (value: string | boolean) => void;
  onVisibilityChange: (value: AttributeVisibility) => void;
  onSave: () => void;
};

const StandaloneLinkAttributeCard = ({
  attribute,
  cardClassName,
  title,
  description,
  icon: Icon,
  iconClassName,
  draftValue,
  draftVisibility,
  isSaving,
  onValueChange,
  onVisibilityChange,
  onSave,
}: StandaloneLinkAttributeCardProps) => {
  const visible = draftVisibility === "public";

  return (
    <Card className={cardClassName ?? GOOGLE_SOFT_CARD_SECTION}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-[11px]">
          <Icon className={`h-4 w-4 ${iconClassName}`} />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-0">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 shrink-0 min-w-fit">
            <span className="text-[11px] font-medium text-foreground">{title}</span>
          </div>
          <Input
            type="url"
            value={typeof draftValue === "string" ? draftValue : ""}
            onChange={(event) => onValueChange(event.target.value)}
            placeholder={attribute.label}
            className="h-8 flex-1 text-[10px] placeholder:text-[10px]"
          />
          <div className={`flex items-center gap-1.5 rounded-full px-2 shrink-0 ${GOOGLE_SOFT_SWITCH_PANEL}`} style={{ height: '32px' }}>
            {visible ? <Eye className="h-3.5 w-3.5 text-primary" /> : <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />}
            <Switch checked={visible} disabled={!attribute.userCanHide} onCheckedChange={(checked) => onVisibilityChange(checked ? "public" : "private")} />
          </div>
          <Button size="sm" className={AMBER_BUTTON_PRIMARY} onClick={onSave} disabled={isSaving}>
            {isSaving ? "Kaydediliyor..." : "Kaydet"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

type ProfileDocumentCardProps = {
  cardClassName?: string;
  title: string;
  description: string;
  icon: ComponentType<{ className?: string }>;
  document: ProfileDocumentRecord | null;
  acceptLabel: string;
  statusLabel: string;
  isUploading: boolean;
  isRemoving: boolean;
  isOpening: boolean;
  onUploadClick: () => void;
  onOpenClick: () => void;
  onRemoveClick: () => void;
};

const ProfileDocumentCard = ({
  cardClassName,
  title,
  description,
  icon: Icon,
  document,
  acceptLabel,
  statusLabel,
  isUploading,
  isRemoving,
  isOpening,
  onUploadClick,
  onOpenClick,
  onRemoveClick,
}: ProfileDocumentCardProps) => {
  return (
    <Card className={cardClassName ?? GOOGLE_SOFT_CARD_SECTION}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-[11px]">
          <Icon className="h-4 w-4 text-primary" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className={`rounded-xl px-3 py-3 ${GOOGLE_SOFT_CARD_SUBTLE}`}>
          <p className="text-[11px] font-medium text-foreground">{document?.name ?? "Henüz dosya yok"}</p>
          <p className="mt-1 text-[11px] text-muted-foreground">{acceptLabel} desteklenir.</p>
          <p className="mt-1 text-[11px] text-slate-600">{statusLabel}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" className={AMBER_BUTTON_PRIMARY} onClick={onUploadClick} disabled={isUploading || isRemoving}>
            {isUploading ? "Yükleniyor..." : document ? "Dosyayı Değiştir" : "Dosya Yükle"}
          </Button>
          <Button size="sm" className={AMBER_BUTTON_OUTLINE} onClick={onOpenClick} disabled={!document || isOpening || isUploading}>
            {isOpening ? "Açılıyor..." : "Dosyayı Aç"}
          </Button>
          <Button size="sm" className={AMBER_BUTTON_OUTLINE} onClick={onRemoveClick} disabled={!document || isRemoving || isUploading}>
            {isRemoving ? "Siliniyor..." : "Dosyayı Kaldır"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

type AttributeInputProps = {
  attribute: ProfileAttributeState;
  value: string | boolean | undefined;
  onChange: (value: string | boolean) => void;
  compact?: boolean;
};

const AttributeInput = ({ attribute, value, onChange, compact = false }: AttributeInputProps) => {
  if (attribute.dataType === "textarea" || attribute.dataType === "multi_select" || attribute.dataType === "json") {
    return (
      <Textarea
        className={compact ? "min-h-[40px] text-[11px]" : undefined}
        value={typeof value === "string" ? value : ""}
        onChange={(event) => onChange(event.target.value)}
        placeholder={attribute.dataType === "multi_select" ? "Virgülle ayırarak yaz" : attribute.label}
      />
    );
  }

  if (attribute.dataType === "boolean") {
    return (
      <div className={`flex items-center justify-between rounded-xl px-3 ${GOOGLE_SOFT_CARD_SUBTLE} ${compact ? "h-9 py-1.5" : "py-2"}`}>
        <p className={`${compact ? "text-[11px]" : "text-[11px]"} font-medium`}>{attribute.label}</p>
        <Switch checked={Boolean(value)} onCheckedChange={(checked) => onChange(checked)} />
      </div>
    );
  }

  if (attribute.dataType === "select" && attribute.attributeKey === REFERRAL_SOURCE_ATTRIBUTE_KEY) {
    return (
      <Select value={typeof value === "string" && value.trim() ? value : "__empty__"} onValueChange={(nextValue) => onChange(nextValue === "__empty__" ? "" : nextValue)}>
        <SelectTrigger className={compact ? "h-9 text-[10px]" : undefined}>
          <SelectValue placeholder={attribute.label} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__empty__">Seçiniz...</SelectItem>
          {getReferralSourceOptions().map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  return (
    <Input
      className={compact ? "h-9 text-[10px] md:text-[10px] placeholder:text-[10px]" : "text-[10px] placeholder:text-[10px]"}
      type={attribute.dataType === "url" ? "url" : "text"}
      value={typeof value === "string" ? value : ""}
      onChange={(event) => onChange(event.target.value)}
      placeholder={attribute.label}
    />
  );
};

export default ProfilePage;
