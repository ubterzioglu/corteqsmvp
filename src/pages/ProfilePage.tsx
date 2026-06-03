import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent, type ComponentType, type ReactNode } from "react";
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
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useCurrentUserProfile } from "@/hooks/useCurrentUserProfile";
import { useCurrentUserDashboard } from "@/hooks/useCurrentUserDashboard";
import { GENERIC_FEATURE_KEYS, INDIVIDUAL_FEATURE_KEYS, type GenericFeatureKey } from "@/lib/features";
import {
  submitFeatureRequest,
  submitRoleChangeRequest,
  updateProfileAttribute,
  updateProfileAvatar,
  updateUserTaxonomySelection,
} from "@/lib/member-profile-api";
import { getAttributeStringValue, type AttributeVisibility, type ProfileAttributeState, type TaxonomyGroupState } from "@/lib/member-profile";
import { getProfileDocumentAccessUrl, parseProfileDocumentRecord, removeProfileDocument, uploadProfileDocument, type ProfileDocumentRecord } from "@/lib/profile-documents";
import { defaultProfileType, getRoleMeta, isProfileType, profileTypeOptions, type ProfileType } from "@/lib/profile-types";
import { validateCvFile, validatePresentationFile } from "@/lib/security";
import { formatBytes } from "@/lib/submissions";
import { supabase } from "@/integrations/supabase/client";

type DraftValueMap = Record<string, string | boolean>;
type DraftVisibilityMap = Record<string, AttributeVisibility>;

type SocialAttributeConfig = {
  key: string;
  label: string;
  placeholder: string;
  icon: ComponentType<{ className?: string }>;
  iconClassName: string;
};

type GuideSection = {
  key: string;
  title: string;
  accentClassName: string;
  content: ReactNode;
};

const VISIBILITY_OPTIONS: { value: AttributeVisibility; label: string }[] = [
  { value: "public", label: "Görünür" },
  { value: "private", label: "Gizli" },
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
  "overflow-hidden border-[rgba(66,133,244,0.16)] bg-white shadow-[0_30px_80px_-40px_rgba(66,133,244,0.36)]";
const GOOGLE_SOFT_CARD_SECTION =
  "border-[rgba(66,133,244,0.14)] bg-[radial-gradient(circle_at_top_left,rgba(66,133,244,0.11),transparent_34%),radial-gradient(circle_at_top_right,rgba(251,188,5,0.11),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(234,67,53,0.08),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(52,168,83,0.09),transparent_30%),linear-gradient(180deg,rgba(255,255,255,0.97),rgba(255,255,255,0.9))] shadow-[0_24px_55px_-42px_rgba(66,133,244,0.42)] backdrop-blur-[2px]";
const GOOGLE_SOFT_CARD_BLUE_SECTION =
  "border-[rgba(66,133,244,0.15)] bg-[radial-gradient(circle_at_top_left,rgba(66,133,244,0.16),transparent_34%),radial-gradient(circle_at_top_right,rgba(251,188,5,0.08),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(52,168,83,0.08),transparent_30%),linear-gradient(180deg,rgba(255,255,255,0.97),rgba(244,248,255,0.9))] shadow-[0_24px_55px_-42px_rgba(66,133,244,0.4)] backdrop-blur-[2px]";
const GOOGLE_SOFT_CARD_YELLOW_SECTION =
  "border-[rgba(251,188,5,0.18)] bg-[radial-gradient(circle_at_top_right,rgba(251,188,5,0.17),transparent_30%),radial-gradient(circle_at_top_left,rgba(66,133,244,0.09),transparent_34%),radial-gradient(circle_at_bottom_left,rgba(234,67,53,0.08),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.97),rgba(255,251,238,0.9))] shadow-[0_24px_55px_-42px_rgba(251,188,5,0.32)] backdrop-blur-[2px]";
const GOOGLE_SOFT_CARD_GREEN_SECTION =
  "border-[rgba(52,168,83,0.16)] bg-[radial-gradient(circle_at_top_left,rgba(52,168,83,0.16),transparent_32%),radial-gradient(circle_at_top_right,rgba(66,133,244,0.08),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(251,188,5,0.08),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.97),rgba(242,249,244,0.9))] shadow-[0_24px_55px_-42px_rgba(52,168,83,0.3)] backdrop-blur-[2px]";
const GOOGLE_SOFT_CARD_RED_SECTION =
  "border-[rgba(234,67,53,0.14)] bg-[radial-gradient(circle_at_top_left,rgba(234,67,53,0.14),transparent_32%),radial-gradient(circle_at_top_right,rgba(251,188,5,0.1),transparent_26%),radial-gradient(circle_at_bottom_right,rgba(66,133,244,0.09),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.97),rgba(253,245,244,0.9))] shadow-[0_24px_55px_-42px_rgba(234,67,53,0.28)] backdrop-blur-[2px]";
const GOOGLE_SOFT_CARD_SUBTLE =
  "border border-white/80 bg-[radial-gradient(circle_at_top_left,rgba(66,133,244,0.12),transparent_36%),radial-gradient(circle_at_top_right,rgba(251,188,5,0.1),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(52,168,83,0.1),transparent_32%),linear-gradient(180deg,rgba(255,255,255,0.94),rgba(255,255,255,0.84))] shadow-[0_18px_35px_-30px_rgba(66,133,244,0.3)]";
const GOOGLE_SOFT_CARD_SUBTLE_INTERACTIVE =
  "border border-white/80 bg-[radial-gradient(circle_at_top_left,rgba(66,133,244,0.12),transparent_36%),radial-gradient(circle_at_top_right,rgba(251,188,5,0.1),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(52,168,83,0.1),transparent_32%),linear-gradient(180deg,rgba(255,255,255,0.94),rgba(255,255,255,0.84))] shadow-[0_18px_35px_-30px_rgba(66,133,244,0.3)] transition hover:-translate-y-0.5 hover:shadow-[0_22px_40px_-28px_rgba(66,133,244,0.34)]";
const GOOGLE_SOFT_HERO_SURFACE =
  "border-b border-[rgba(66,133,244,0.1)] bg-[radial-gradient(circle_at_top_left,rgba(66,133,244,0.26),transparent_30%),radial-gradient(circle_at_top_right,rgba(251,188,5,0.24),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(234,67,53,0.12),transparent_24%),radial-gradient(circle_at_bottom_right,rgba(52,168,83,0.14),transparent_28%),linear-gradient(135deg,rgba(255,255,255,0.98),rgba(247,250,255,0.95)_44%,rgba(255,252,244,0.94)_100%)]";
const GOOGLE_SOFT_ACTION_PANEL =
  "rounded-[26px] border border-white/75 bg-[radial-gradient(circle_at_top_left,rgba(66,133,244,0.16),transparent_34%),radial-gradient(circle_at_top_right,rgba(251,188,5,0.14),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(52,168,83,0.12),transparent_30%),linear-gradient(180deg,rgba(255,255,255,0.94),rgba(255,255,255,0.82))] p-3 shadow-[0_24px_45px_-36px_rgba(66,133,244,0.36)]";
const GOOGLE_SOFT_ACTION_BUTTON =
  "h-10 w-full min-w-0 justify-center rounded-xl border-white/85 bg-white/82 px-3 text-xs font-medium shadow-[0_12px_26px_-24px_rgba(66,133,244,0.34)] backdrop-blur-[2px] hover:bg-white";
const GOOGLE_SOFT_SUCCESS_PANEL =
  "border border-[rgba(52,168,83,0.22)] bg-[linear-gradient(180deg,rgba(255,255,255,0.95),rgba(241,248,242,0.88)),radial-gradient(circle_at_top_left,rgba(52,168,83,0.15),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(66,133,244,0.08),transparent_28%)]";
const GOOGLE_SOFT_DANGER_PANEL =
  "border border-[rgba(234,67,53,0.2)] bg-[linear-gradient(180deg,rgba(255,255,255,0.95),rgba(253,242,240,0.88)),radial-gradient(circle_at_top_left,rgba(234,67,53,0.13),transparent_34%),radial-gradient(circle_at_top_right,rgba(251,188,5,0.1),transparent_26%)]";
const GOOGLE_SOFT_WARNING_PANEL =
  "border border-[rgba(251,188,5,0.26)] bg-[linear-gradient(180deg,rgba(255,255,255,0.95),rgba(255,249,230,0.9)),radial-gradient(circle_at_top_left,rgba(251,188,5,0.16),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(234,67,53,0.08),transparent_30%)]";
const GOOGLE_SOFT_SWITCH_PANEL =
  "border border-white/75 bg-[linear-gradient(180deg,rgba(255,255,255,0.93),rgba(255,255,255,0.82)),radial-gradient(circle_at_top_left,rgba(66,133,244,0.1),transparent_36%),radial-gradient(circle_at_top_right,rgba(251,188,5,0.1),transparent_28%)]";

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
  const { items: dashboardItems, isLoading: isDashboardLoading } = useCurrentUserDashboard(true);

  const [draftValues, setDraftValues] = useState<DraftValueMap>({});
  const [draftVisibilities, setDraftVisibilities] = useState<DraftVisibilityMap>({});
  const [savingAttributeKey, setSavingAttributeKey] = useState<string | null>(null);
  const [savingTaxonomyGroupKey, setSavingTaxonomyGroupKey] = useState<string | null>(null);
  const [savingCommonAttributes, setSavingCommonAttributes] = useState(false);
  const [savingSocialMedia, setSavingSocialMedia] = useState(false);
  const [savingPreferenceKey, setSavingPreferenceKey] = useState<string | null>(null);
  const [uploadingDocumentKey, setUploadingDocumentKey] = useState<string | null>(null);
  const [removingDocumentKey, setRemovingDocumentKey] = useState<string | null>(null);
  const [openingDocumentKey, setOpeningDocumentKey] = useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarRemoving, setAvatarRemoving] = useState(false);
  const [isProfileSummaryOpen, setIsProfileSummaryOpen] = useState(false);
  const [isAccessCardOpen, setIsAccessCardOpen] = useState(false);
  const [isHelpCardOpen, setIsHelpCardOpen] = useState(false);
  const [roleRequestTarget, setRoleRequestTarget] = useState<ProfileType | "">("");
  const [roleRequestNote, setRoleRequestNote] = useState("");
  const [submittingRoleRequest, setSubmittingRoleRequest] = useState(false);
  const [featureRequestingKey, setFeatureRequestingKey] = useState<string | null>(null);
  const [taxonomyDrafts, setTaxonomyDrafts] = useState<Record<string, string[]>>({});
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

  const visibleTaxonomyGroups = useMemo(() => {
    return profile?.taxonomyGroups ?? [];
  }, [profile?.taxonomyGroups]);

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
  const publicAttributesCount = (profile?.attributes ?? []).filter((attribute) => draftVisibilities[attribute.attributeKey] === "public").length;
  const pendingCount = profile?.pendingRequests.length ?? 0;
  const dashboardCount = dashboardItems.length;
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

  const guideSections = useMemo<GuideSection[]>(
    () => [
      {
        key: "guide-common",
        title: "Ortak Profil Alanları Kullanım Kılavuzu",
        accentClassName: "bg-[radial-gradient(circle_at_top_left,rgba(66,133,244,0.12),transparent_34%),linear-gradient(180deg,rgba(255,255,255,0.9),rgba(243,248,255,0.84))]",
        content: (
          <div className="space-y-2 text-xs text-muted-foreground">
            <p><strong className="text-foreground">Görünen İsim:</strong> Directory ve profil kartında gösterilecek adınız. Değişiklikler anında yansır.</p>
            <p><strong className="text-foreground">Ülke / Şehir:</strong> Konum bilgileriniz. Harita ve filtreleme için kullanılır. Görünürlük ayarını değiştirebilirsiniz.</p>
            <p><strong className="text-foreground">Profil Fotoğrafı:</strong> Yüklediğiniz görsel avatar ve public profil önizlemesinde birlikte kullanılır.</p>
            <p><strong className="text-foreground">Kısa Biyografi:</strong> Kendinizi tanıtan 1-2 cümlelik özet. Directory listelemelerinde görünür.</p>
            <p><strong className="text-foreground">Görünürlük Ayarı:</strong> Her alan için <em>Görünür</em> veya <em>Gizli</em> seçebilirsiniz.</p>
            <p><strong className="text-foreground">Onay Süreci:</strong> Bazı alanlarda değişiklik yapıldığında admin onayı gerekir. Bu alanlar "Onaylı" etiketi ile işaretlenir.</p>
          </div>
        ),
      },
      {
        key: "guide-role",
        title: "Rolüne Özel Alanlar Kullanım Kılavuzu",
        accentClassName: "bg-[radial-gradient(circle_at_top_right,rgba(251,188,5,0.13),transparent_32%),radial-gradient(circle_at_bottom_left,rgba(66,133,244,0.1),transparent_30%),linear-gradient(180deg,rgba(255,255,255,0.9),rgba(255,251,238,0.86))]",
        content: (
          <div className="space-y-2 text-xs text-muted-foreground">
            <p>Rolüne özel alanlar, seçtiğin rol türüne göre dinamik olarak belirlenir. Örneğin <strong className="text-foreground">Ambassador</strong> rolünde bölge bilgisi, <strong className="text-foreground">Blogger</strong> rolünde blog URL&apos;si gibi alanlar görünebilir.</p>
            <p>Bu alanların bir kısmı admin onayı gerektirebilir. Onay gerektiren alanlarda değişiklik yapıldığında "Beklemede" durumu görünür ve admin onaylayana kadar public gösterilmez.</p>
            <p>Her alan için görünürlük ayarını değiştirebilirsin: <em>Görünür</em> veya <em>Gizli</em>.</p>
          </div>
        ),
      },
      {
        key: "guide-role-application",
        title: "Rol Başvurusu Kılavuzu",
        accentClassName: "bg-[radial-gradient(circle_at_top_left,rgba(52,168,83,0.13),transparent_34%),linear-gradient(180deg,rgba(255,255,255,0.9),rgba(241,248,242,0.86))]",
        content: (
          <div className="space-y-2 text-xs text-muted-foreground">
            <p>Her üyenin aynı anda sadece <strong className="text-foreground">bir aktif rolü</strong> olabilir. Mevcut rolünüzden farklı bir role başvurmak için açılır menüden seçim yapın.</p>
            <p><strong className="text-foreground">Başvuru süreci:</strong> Başvurunuz admin onay kuyruğuna eklenir. Onaylanırsa yeni rolünüz aktifleşir ve eski rolünüz kaldırılır.</p>
            <p><strong className="text-foreground">Açıklama alanı:</strong> Başvurunuzu destekleyen kısa bir metin yazın. Bu not admin değerlendirmesinde kullanılır.</p>
            <p><strong className="text-foreground">Mevcut rolünüz:</strong> Profil kartındaki "Rol" etiketi mevcut aktif rolünüzü gösterir. Başvuru onaylanana kadar mevcut rolünüz değişmez.</p>
          </div>
        ),
      },
      {
        key: "guide-features",
        title: "Feature Talepleri Kılavuzu",
        accentClassName: "bg-[radial-gradient(circle_at_top_right,rgba(251,188,5,0.15),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(234,67,53,0.08),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.9),rgba(255,249,232,0.88))]",
        content: (
          <div className="space-y-2 text-xs text-muted-foreground">
            <p><strong className="text-foreground">Directory Görünürlüğü:</strong> Profilinizin public dizinde görünmesini sağlar. Onaylandıktan sonra diğer üyeler sizi bulabilir.</p>
            <p><strong className="text-foreground">Featured Profil:</strong> Profil kartınızın dizinde öne çıkarılır. Daha fazla görünürlük sağlar.</p>
            <p><strong className="text-foreground">WhatsApp Yayınlama:</strong> WhatsApp numaranızın profil kartınızda public olarak gösterilmesi için onay gerekir.</p>
            <p><strong className="text-foreground">Etkinlik Oluşturma:</strong> Platformda etkinlik yayınlama yetkisi talep edin.</p>
            <p><strong className="text-foreground">Teklif / Hizmet Oluşturma:</strong> Hizmet veya ürün tekliflerinizi yayınlama erişimi talep edin.</p>
            <p><strong className="text-foreground">Referral Oluşturma:</strong> Davet kodu oluşturarak yeni üye kazandırma erişimi talep edin.</p>
            <p><strong className="text-foreground">Talep Durumu:</strong> Her talebiniz admin onay sürecinden geçer. "Beklemede" etiketi göründüğünde talebiniz kuyruktadır.</p>
          </div>
        ),
      },
      {
        key: "guide-pending",
        title: "Bekleyen Talepler Kılavuzu",
        accentClassName: "bg-[radial-gradient(circle_at_top_left,rgba(234,67,53,0.1),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(66,133,244,0.08),transparent_32%),linear-gradient(180deg,rgba(255,255,255,0.9),rgba(248,249,250,0.88))]",
        content: (
          <div className="space-y-2 text-xs text-muted-foreground">
            <p>Bu bölümde admin onayı bekleyen tüm talepleriniz listelenir. Talep türü ve oluşturulma tarihi bilgileri gösterilir.</p>
            <p><strong className="text-foreground">Rol değişikliği talepleri:</strong> Yeni rol başvurusu yapıldığında burada görünür. Onaylanana veya reddedilene kadar bekler.</p>
            <p><strong className="text-foreground">Feature talepleri:</strong> Kapalı özellikler için erişim talebinde bulunduğunuzda burada listelenir.</p>
            <p><strong className="text-foreground">Profil alanı değişiklikleri:</strong> Admin onayı gerektiren alanlarda yapılan güncellemeler burada takip edilir.</p>
            <p>Talepler genellikle 1-3 iş günü içinde değerlendirilir. Sorularınız için admin ekibiyle iletişime geçebilirsiniz.</p>
          </div>
        ),
      },
    ],
    [],
  );

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/login", { replace: true });
  };

  const scrollToHelpCard = () => {
    setIsHelpCardOpen(true);
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

    setSavingCommonAttributes(true);
    try {
      for (const attribute of groupedAttributes.common) {
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

  const avatarActionButtons = (
    <div className="flex flex-wrap gap-2">
      <input
        ref={avatarInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/jpg"
        className="hidden"
        onChange={(event) => void handleAvatarFileChange(event)}
      />
      <Button
        size="sm"
        onClick={() => avatarInputRef.current?.click()}
        disabled={avatarUploading || avatarRemoving}
      >
        <ImagePlus className="mr-1.5 h-4 w-4" />
        {avatarUploading ? "Yükleniyor..." : currentAvatarUrl ? "Resmi Değiştir" : "Resim Yükle"}
      </Button>
      <Button
        size="sm"
        variant="outline"
        onClick={() => void handleRemoveAvatar()}
        disabled={!currentAvatarUrl || avatarUploading || avatarRemoving}
      >
        <Trash2 className="mr-1.5 h-4 w-4" />
        {avatarRemoving ? "Kaldırılıyor..." : "Resmi Kaldır"}
      </Button>
    </div>
  );

  const heroActionButtons = (
    <div className={`w-full max-w-[320px] shrink-0 self-start ${GOOGLE_SOFT_ACTION_PANEL}`}>
      <div className="grid grid-cols-2 gap-2">
        <Button
          size="sm"
          className={GOOGLE_SOFT_ACTION_BUTTON}
          onClick={() => avatarInputRef.current?.click()}
          disabled={avatarUploading || avatarRemoving}
        >
          <ImagePlus className="mr-1.5 h-4 w-4" />
          {avatarUploading ? "Yükleniyor..." : currentAvatarUrl ? "Resmi Değiştir" : "Resim Yükle"}
        </Button>
        <Button
          size="sm"
          variant="outline"
          className={GOOGLE_SOFT_ACTION_BUTTON}
          onClick={() => void handleRemoveAvatar()}
          disabled={!currentAvatarUrl || avatarUploading || avatarRemoving}
        >
          <Trash2 className="mr-1.5 h-4 w-4" />
          {avatarRemoving ? "Kaldırılıyor..." : "Resmi Kaldır"}
        </Button>
        <Button size="sm" variant="outline" className={GOOGLE_SOFT_ACTION_BUTTON} onClick={scrollToHelpCard}>
          <HelpCircle className="mr-1.5 h-4 w-4" />
          Yardım
        </Button>
        <Button size="sm" variant="outline" className={GOOGLE_SOFT_ACTION_BUTTON} onClick={() => void refreshProfile()}>
          Yenile
        </Button>
        <Button size="sm" variant="outline" className={GOOGLE_SOFT_ACTION_BUTTON} onClick={handleSignOut}>
          Çıkış Yap
        </Button>
      </div>
    </div>
  );

  return (
    <div className={`mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-10 ${isIndividualProfile ? "pb-16" : ""}`}>
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
      <Card className={isIndividualProfile ? GOOGLE_SOFT_CARD_HERO : GOOGLE_SOFT_CARD_SECTION}>
        {isIndividualProfile ? (
          <div className={GOOGLE_SOFT_HERO_SURFACE}>
            <CardHeader className="flex flex-col gap-5 pb-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="flex min-w-0 flex-1 items-start gap-4">
                {currentAvatarUrl ? (
                  <img
                    src={currentAvatarUrl}
                    alt={displayName}
                    className="h-20 w-20 shrink-0 rounded-[28px] object-cover shadow-[0_24px_45px_-24px_rgba(66,133,244,0.5)]"
                  />
                ) : (
                  <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-[28px] bg-[linear-gradient(145deg,#4285F4,#34A853_55%,#FBBC05)] text-2xl font-bold text-white shadow-[0_24px_45px_-24px_rgba(66,133,244,0.52)]">
                    {initials}
                  </div>
                )}
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className="border-[rgba(66,133,244,0.28)] bg-white/85 text-[#3367D6]">
                      <Sparkles className="mr-1 h-3 w-3" /> Bireysel Panelim
                    </Badge>
                    <Badge variant="secondary" className="bg-[rgba(66,133,244,0.12)] text-slate-900 hover:bg-[rgba(66,133,244,0.12)]">
                      {profile?.roleLabel ?? roleMeta?.adminLabel ?? "Rol"}
                    </Badge>
                    <Badge variant="outline" className="border-[rgba(251,188,5,0.26)] bg-white/80 text-xs">
                      Tamamlanma %{profile?.profileCompletion.percentage ?? 0}
                    </Badge>
                    {errorMessage ? <Badge variant="destructive" className="text-xs">Kısmi veri yüklendi</Badge> : null}
                  </div>
                  <div>
                    <CardTitle className="text-3xl tracking-tight text-slate-950 md:text-4xl">{displayName}</CardTitle>
                    {heroDescription ? (
                      <CardDescription className="mt-1 max-w-2xl text-sm text-slate-600">
                        {heroDescription}
                      </CardDescription>
                    ) : null}
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
              {heroActionButtons}
            </CardHeader>
          </div>
        ) : null}
        {!isIndividualProfile ? (
          <>
            <CardHeader className="flex flex-col gap-3 pb-3 md:flex-row md:items-center md:justify-between">
              <div className="space-y-1">
                <CardTitle className="text-2xl">{roleMeta?.title ?? "Profilim"}</CardTitle>
                <CardDescription className="max-w-2xl text-xs">
                  {roleMeta?.description}
                </CardDescription>
                <div className="flex flex-wrap items-center gap-1.5">
                  <Badge variant="secondary" className="text-xs">{profile?.roleLabel ?? roleMeta?.adminLabel ?? "Rol"}</Badge>
                  <Badge variant="outline" className="text-xs">Tamamlanma %{profile?.profileCompletion.percentage ?? 0}</Badge>
                  {errorMessage ? <Badge variant="destructive" className="text-xs">Kısmi veri yüklendi</Badge> : null}
                </div>
                <div className="pt-1">
                  {avatarActionButtons}
                </div>
              </div>
            </CardHeader>
            <CardContent className="grid gap-2 pb-4 md:grid-cols-3">
              <div className={`rounded-lg p-2.5 ${GOOGLE_SOFT_CARD_SUBTLE}`}>
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Görünen İsim</p>
                <p className="mt-1 text-sm font-semibold">{displayName}</p>
              </div>
              <div className={`rounded-lg p-2.5 ${GOOGLE_SOFT_CARD_SUBTLE}`}>
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">E-posta</p>
                <p className="mt-1 break-all text-xs">{profile?.email ?? user?.email ?? "-"}</p>
              </div>
              <div className={`rounded-lg p-2.5 ${GOOGLE_SOFT_CARD_SUBTLE}`}>
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Bekleyen Talep</p>
                <p className="mt-1 text-sm font-semibold">{pendingCount}</p>
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
              <CardTitle className="text-base">Profil Özeti & Tamamlanma</CardTitle>
              <ChevronDown
                className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${isProfileSummaryOpen ? "rotate-180" : ""}`}
              />
            </button>
          </CardHeader>
          {isProfileSummaryOpen ? (
            <CardContent id="profile-summary-content" className="pt-0 pb-4">
              <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-6">
                <div className={`rounded-[20px] px-2.5 py-2 text-xs leading-4 ${GOOGLE_SOFT_CARD_SUBTLE}`}>
                  <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500">Profil Skoru</p>
                  <p className="mt-1 font-bold text-slate-950">%{profile?.profileCompletion.percentage ?? 0}</p>
                  <p className="mt-1 text-slate-600">
                    {(profile?.profileCompletion.requiredCompleted ?? 0)} / {(profile?.profileCompletion.requiredTotal ?? 0)} zorunlu alan dolu
                  </p>
                </div>
                {completionHighlights.map((item) => (
                  <div
                    key={item.key}
                    className={`rounded-2xl px-2.5 py-2 text-xs leading-4 ${item.complete ? GOOGLE_SOFT_SUCCESS_PANEL : GOOGLE_SOFT_DANGER_PANEL}`}
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
            <DisplayNameAttributeCard
              attribute={displayNameAttribute}
              displayNameLabel={roleMeta?.displayNameLabel ?? "Görünen İsim"}
              draftValue={draftValues[displayNameAttribute.attributeKey]}
              draftVisibility={draftVisibilities[displayNameAttribute.attributeKey] ?? displayNameAttribute.visibility}
              isSaving={savingAttributeKey === displayNameAttribute.attributeKey}
              onValueChange={(nextValue) => handleDraftChange(displayNameAttribute.attributeKey, nextValue)}
              onVisibilityChange={(nextVisibility) =>
                setDraftVisibilities((current) => ({ ...current, [displayNameAttribute.attributeKey]: nextVisibility }))
              }
              onSave={() => void handleSaveAttribute(displayNameAttribute)}
            />
          ) : null}

          <Card className={GOOGLE_SOFT_CARD_YELLOW_SECTION}>
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
                  isSaving={savingCommonAttributes}
                  saveMode="section"
                  visibilityMode="inline-switch"
                  onValueChange={(nextValue) => handleDraftChange(attribute.attributeKey, nextValue)}
                  onVisibilityChange={(nextVisibility) =>
                    setDraftVisibilities((current) => ({ ...current, [attribute.attributeKey]: nextVisibility }))
                  }
                />
              ))}
              <div className="flex justify-end pt-1">
                <Button size="sm" onClick={() => void handleSaveCommonAttributes()} disabled={savingCommonAttributes}>
                  {savingCommonAttributes ? "Kaydediliyor..." : "Ortak Alanları Kaydet"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {featureToggleCards.length ? (
            <Card className={GOOGLE_SOFT_CARD_GREEN_SECTION}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Profil Rozetleri</CardTitle>
                <CardDescription className="text-xs">
                  Açık feature&apos;lar için görünürlük tercihlerini ayrı ayrı yönet.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
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
              <CardTitle className="text-base">Sosyal Medya Hesapları</CardTitle>
              <CardDescription className="text-xs">
                Profesyoneller, işletme ve kuruluşlar için tavsiye edilir. Hesaplarını ekle ve her biri için profilde gösterimi ayrı ayrı aç/kapat.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {groupedAttributes.socialMedia.length ? (
                <>
                  <div className="grid gap-4 md:grid-cols-2">
                    {groupedAttributes.socialMedia.map((attribute) => {
                      const config = SOCIAL_ATTRIBUTE_CONFIGS.find((item) => item.key === attribute.attributeKey);
                      if (!config) return null;
                      const Icon = config.icon;
                      const visible = (draftVisibilities[attribute.attributeKey] ?? attribute.visibility) === "public";

                      return (
                        <div key={attribute.attributeKey} className={`rounded-xl p-3 ${GOOGLE_SOFT_CARD_SUBTLE}`}>
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                              <Icon className={`h-4 w-4 ${config.iconClassName}`} />
                              <span>{config.label}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              {visible ? (
                                <Eye className="h-3.5 w-3.5 text-primary" />
                              ) : (
                                <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />
                              )}
                              <Switch
                                checked={visible}
                                onCheckedChange={(checked) =>
                                  setDraftVisibilities((current) => ({
                                    ...current,
                                    [attribute.attributeKey]: checked ? "public" : "private",
                                  }))
                                }
                              />
                            </div>
                          </div>
                          <div className="mt-3 space-y-2">
                            <Input
                              value={typeof draftValues[attribute.attributeKey] === "string" ? String(draftValues[attribute.attributeKey] ?? "") : ""}
                              onChange={(event) => handleDraftChange(attribute.attributeKey, event.target.value)}
                              placeholder={config.placeholder}
                            />
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex flex-wrap items-center gap-1.5">
                                {attribute.requiresAdminApprovalOnChange ? (
                                  <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                    Onaylı
                                  </Badge>
                                ) : null}
                                <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                  {visible ? "Görünür" : "Gizli"}
                                </Badge>
                              </div>
                              <p className="text-[11px] text-muted-foreground">Boş alanlar public profilde görünmez.</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex justify-end">
                    <Button size="sm" onClick={() => void handleSaveSocialMedia()} disabled={savingSocialMedia}>
                      {savingSocialMedia ? "Kaydediliyor..." : "Sosyal Medya Kartını Kaydet"}
                    </Button>
                  </div>
                </>
              ) : (
                <p className="text-xs text-muted-foreground">Bu profil için sosyal medya alanları henüz etkin değil.</p>
              )}
            </CardContent>
          </Card>

          <div className="grid gap-4 lg:grid-cols-2">
            {linkedinCardEnabled && linkedinAttribute ? (
              <StandaloneLinkAttributeCard
                attribute={linkedinAttribute}
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
                  saveMode="single"
                  visibilityMode="select"
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

          <Card className={GOOGLE_SOFT_CARD_YELLOW_SECTION}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Alt Kategori / Alt Tip</CardTitle>
              <CardDescription className="text-xs">Rolüne bağlı taxonomy seçimleri profildeki görünüm ve zorunlu alanları etkiler.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {visibleTaxonomyGroups.length ? (
                visibleTaxonomyGroups.map((group) => {
                  const selectedKeys = taxonomyDrafts[group.groupKey] ?? [];
                  return (
                    <div key={group.groupKey} className={`rounded-lg p-3 ${GOOGLE_SOFT_CARD_SUBTLE}`}>
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
                              className={`rounded-lg px-3 py-2 text-left ${selected ? GOOGLE_SOFT_CARD_SUBTLE : GOOGLE_SOFT_CARD_SUBTLE_INTERACTIVE} ${
                                selected ? "border-primary/50" : ""
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

      <Card className={GOOGLE_SOFT_CARD_SECTION}>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Başvurular & Erişimler</CardTitle>
          <CardDescription className="text-xs">
            Rol başvurularını, feature taleplerini, açık erişimlerini ve bekleyen süreçlerini tek kartta yönet.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="multiple" className="space-y-2">
            <AccordionItem value="role-request" className={`overflow-hidden rounded-lg px-3 ${GOOGLE_SOFT_CARD_SUBTLE}`}>
              <AccordionTrigger className="py-3 text-sm font-medium hover:no-underline">
                Rol Başvurusu
              </AccordionTrigger>
              <AccordionContent className="space-y-2 pb-3">
                <p className="text-xs text-muted-foreground">Tek aktif rol modeli korunur. Yeni rol için başvuru admin onayına düşer.</p>
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
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="feature-requests" className={`overflow-hidden rounded-lg px-3 ${GOOGLE_SOFT_CARD_SUBTLE}`}>
              <AccordionTrigger className="py-3 text-sm font-medium hover:no-underline">
                Feature Talepleri
              </AccordionTrigger>
              <AccordionContent className="space-y-2 pb-3">
                <p className="text-xs text-muted-foreground">Kapalı veya onay gerektiren akışlar için tek tıkla talep bırak.</p>
                {REQUESTABLE_FEATURES.map((item) => {
                  const state = featureMap.get(item.key);
                  const isPending = profile?.pendingRequests.some((request) => request.targetFeatureKey === item.key) ?? false;
                  return (
                    <div key={item.key} className={`rounded-lg p-2 ${GOOGLE_SOFT_CARD_SUBTLE}`}>
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
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="dashboard-access" className={`overflow-hidden rounded-lg px-3 ${GOOGLE_SOFT_CARD_SUBTLE}`}>
              <AccordionTrigger className="py-3 text-sm font-medium hover:no-underline">
                Açık Dashboard Erişimleri
              </AccordionTrigger>
              <AccordionContent className="space-y-2 pb-3">
                <p className="text-xs text-muted-foreground">
                  {isIndividualProfile
                    ? "Merge edilen panel yapısına uyumlu olarak açık erişimlerini burada kart düzeninde gösteriyoruz."
                    : "Rolün ve override kayıtlarınla şu anda açık olan dashboard tabları."}
                </p>
                {isDashboardLoading ? <p className="text-xs text-muted-foreground">Dashboard erişimleri yükleniyor...</p> : null}
                {!isDashboardLoading && dashboardItems.length ? (
                  dashboardItems.map((item) => (
                    <div key={item.feature_key} className={`rounded-lg p-2 ${GOOGLE_SOFT_CARD_SUBTLE}`}>
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
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="pending-requests" className={`overflow-hidden rounded-lg px-3 ${GOOGLE_SOFT_CARD_SUBTLE}`}>
              <AccordionTrigger className="py-3 text-sm font-medium hover:no-underline">
                Bekleyen Talepler
              </AccordionTrigger>
              <AccordionContent className="space-y-2 pb-3">
                <p className="text-xs text-muted-foreground">
                  {isIndividualProfile
                    ? "Panel görünümüne etki eden onay süreçleri burada toplanır."
                    : "Admin değerlendirmesi bekleyen son işlemler burada görünür."}
                </p>
                {profile?.pendingRequests.length ? (
                  profile.pendingRequests.map((request) => (
                    <div key={request.id} className={`rounded-lg p-2 ${GOOGLE_SOFT_CARD_SUBTLE}`}>
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
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>

      <Card ref={helpCardRef} className={GOOGLE_SOFT_CARD_SECTION}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <HelpCircle className="h-4 w-4 text-primary" />
            Yardım & Kılavuzlar
          </CardTitle>
          <CardDescription className="text-xs">
            Profilini doldururken ihtiyaç duyacağın tüm açıklamaları tek yerde topladık.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full space-y-2">
            {guideSections.map((section) => (
              <AccordionItem key={section.key} value={section.key} className={`rounded-lg border border-white/80 px-3 shadow-[0_18px_32px_-30px_rgba(66,133,244,0.28)] ${section.accentClassName}`}>
                <AccordionTrigger className="py-2 text-sm font-medium hover:no-underline">
                  <span className="inline-flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-primary" />
                    {section.title}
                  </span>
                </AccordionTrigger>
                <AccordionContent>{section.content}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>
    </div>
  );
};

type ProfileAttributeEditorProps = {
  attribute: ProfileAttributeState;
  draftValue: string | boolean | undefined;
  draftVisibility: AttributeVisibility;
  displayNameLabel: string;
  isSaving: boolean;
  saveMode: "single" | "section";
  visibilityMode: "select" | "collapsible-radio" | "inline-switch";
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
    <Card className={GOOGLE_SOFT_CARD_SECTION}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{displayNameLabel}</CardTitle>
        <CardDescription className="text-xs">
          Profil başlığında ve directory görünümünde kullanılacak ismini ayrı kaydedebilirsin.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-col gap-3 md:flex-row md:items-start">
          <div className="flex-1 space-y-2">
            <div className="flex flex-wrap items-center gap-1.5">
              <p className="text-sm font-semibold">{displayNameLabel}</p>
              {attribute.isRequired ? <Badge variant="secondary" className="px-1.5 py-0 text-[10px]">Zorunlu</Badge> : null}
            </div>
            <AttributeInput attribute={attribute} value={draftValue} onChange={onValueChange} />
          </div>
          <div className="w-full md:w-[92px]">
            <div className={`flex h-10 items-center justify-between gap-1.5 rounded-full px-2 text-xs ${GOOGLE_SOFT_SWITCH_PANEL}`}>
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
          <Button size="sm" onClick={onSave} disabled={!attribute.userCanEdit || isSaving}>
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
              <p className="text-sm font-semibold leading-4">{attributeLabel}</p>
              {attribute.isRequired ? <Badge variant="secondary" className="px-1.5 py-0 text-[10px]">Zorunlu</Badge> : null}
            </div>
          </div>

          <div className="min-w-0 flex-1">
            <AttributeInput attribute={attribute} value={draftValue} onChange={onValueChange} compact />
          </div>

          <div className="w-[84px] shrink-0">
            <div className={`flex h-9 items-center justify-between gap-1.5 rounded-full px-2 text-xs ${GOOGLE_SOFT_SWITCH_PANEL}`}>
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
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-lg p-3 ${GOOGLE_SOFT_CARD_SUBTLE}`}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="space-y-0.5">
          <div className="flex flex-wrap items-center gap-1.5">
            <p className="text-sm font-semibold">{attributeLabel}</p>
            {attribute.isRequired ? <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Zorunlu</Badge> : null}
            {attribute.requiresAdminApprovalOnChange ? (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0">Onaylı</Badge>
            ) : null}
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
            {visibilityLabel}
          </span>
        </div>
      </div>

      <div className="mt-3 space-y-2">
        <AttributeInput attribute={attribute} value={draftValue} onChange={onValueChange} />

        {visibilityMode === "collapsible-radio" ? (
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
                    <p className="text-sm font-medium text-foreground">{visibilityLabel}</p>
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
                        className={`flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm ${GOOGLE_SOFT_CARD_SUBTLE_INTERACTIVE}`}
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
        )}

        {saveMode === "single" && onSave ? (
          <div className="flex justify-end">
            <Button size="sm" onClick={onSave} disabled={!attribute.userCanEdit || isSaving}>
              {isSaving ? "Kaydediliyor..." : "Kaydet"}
            </Button>
          </div>
        ) : null}

        {attribute.requiresAdminApprovalOnChange ? (
          <div className={`rounded-lg px-2.5 py-1.5 text-xs text-amber-900 ${GOOGLE_SOFT_WARNING_PANEL}`}>
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
            <p className="text-sm font-medium text-foreground">{title}</p>
            <p className="text-xs text-muted-foreground">{description}</p>
          </div>
        </div>
        <Switch checked={checked} disabled={disabled} onCheckedChange={onCheckedChange} />
      </div>
    </div>
  );
};

type StandaloneLinkAttributeCardProps = {
  attribute: ProfileAttributeState;
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
    <Card className={GOOGLE_SOFT_CARD_SECTION}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Icon className={`h-4 w-4 ${iconClassName}`} />
          {title}
        </CardTitle>
        <CardDescription className="text-xs">{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className={`flex items-center justify-between rounded-xl px-3 py-2 ${GOOGLE_SOFT_SWITCH_PANEL}`}>
          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            {visible ? <Eye className="h-3.5 w-3.5 text-primary" /> : <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />}
          </div>
          <Switch checked={visible} disabled={!attribute.userCanHide} onCheckedChange={(checked) => onVisibilityChange(checked ? "public" : "private")} />
        </div>
        <Input
          type="url"
          value={typeof draftValue === "string" ? draftValue : ""}
          onChange={(event) => onValueChange(event.target.value)}
          placeholder={attribute.label}
        />
        <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
          <span>Boş kalırsa public profilde gösterilmez.</span>
          <Button size="sm" onClick={onSave} disabled={isSaving}>
            {isSaving ? "Kaydediliyor..." : "Kaydet"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

type ProfileDocumentCardProps = {
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
    <Card className={GOOGLE_SOFT_CARD_SECTION}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Icon className="h-4 w-4 text-primary" />
          {title}
        </CardTitle>
        <CardDescription className="text-xs">{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className={`rounded-xl px-3 py-3 ${GOOGLE_SOFT_CARD_SUBTLE}`}>
          <p className="text-sm font-medium text-foreground">{document?.name ?? "Henüz dosya yok"}</p>
          <p className="mt-1 text-xs text-muted-foreground">{acceptLabel} desteklenir.</p>
          <p className="mt-1 text-xs text-slate-600">{statusLabel}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" onClick={onUploadClick} disabled={isUploading || isRemoving}>
            {isUploading ? "Yükleniyor..." : document ? "Dosyayı Değiştir" : "Dosya Yükle"}
          </Button>
          <Button size="sm" variant="outline" onClick={onOpenClick} disabled={!document || isOpening || isUploading}>
            {isOpening ? "Açılıyor..." : "Dosyayı Aç"}
          </Button>
          <Button size="sm" variant="outline" onClick={onRemoveClick} disabled={!document || isRemoving || isUploading}>
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
        className={compact ? "min-h-[40px] text-xs" : undefined}
        value={typeof value === "string" ? value : ""}
        onChange={(event) => onChange(event.target.value)}
        placeholder={attribute.dataType === "multi_select" ? "Virgülle ayırarak yaz" : attribute.label}
      />
    );
  }

  if (attribute.dataType === "boolean") {
    return (
      <div className={`flex items-center justify-between rounded-xl px-3 ${GOOGLE_SOFT_CARD_SUBTLE} ${compact ? "h-9 py-1.5" : "py-2"}`}>
        <p className={`${compact ? "text-xs" : "text-sm"} font-medium`}>{attribute.label}</p>
        <Switch checked={Boolean(value)} onCheckedChange={(checked) => onChange(checked)} />
      </div>
    );
  }

  return (
    <Input
      className={compact ? "h-9 text-xs md:text-xs" : undefined}
      type={attribute.dataType === "url" ? "url" : "text"}
      value={typeof value === "string" ? value : ""}
      onChange={(event) => onChange(event.target.value)}
      placeholder={attribute.label}
    />
  );
};

export default ProfilePage;
