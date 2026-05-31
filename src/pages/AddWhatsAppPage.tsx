import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  Check,
  ExternalLink,
  Globe,
  GraduationCap,
  HandHeart,
  Heart,
  MapPin,
  MessageSquare,
  Pencil,
  Search,
  Share2,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  TrendingUp,
  UserPlus,
  Users,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useAuth } from "@/components/auth/useAuth";
import { useToast } from "@/hooks/use-toast";
import {
  buildLandingDescription,
  canCurrentUserEditLanding,
  createJoinRequest,
  getEditableLandingForCurrentUser,
  getLanding,
  listLandings,
  submitLanding,
  uploadWhatsAppLandingHeroImage,
  type LandingCategory,
  type WhatsAppLanding,
} from "@/lib/whatsapp-landings";
import messagingHeroImage from "../../addwaimage.png";
import waPlaceholderImage from "../../waplaceholder.png";

const categoryMeta: Record<
  LandingCategory,
  { icon: typeof Users; label: string; chipClass: string }
> = {
  alumni: {
    icon: GraduationCap,
    label: "Alumni",
    chipClass: "border-primary bg-primary text-primary-foreground",
  },
  doktor: {
    icon: Stethoscope,
    label: "Doktor / Sağlık",
    chipClass: "border-emerald-600 bg-emerald-500 text-white",
  },
  hobi: {
    icon: Heart,
    label: "Hobi",
    chipClass: "border-cyan-600 bg-cyan-500 text-white",
  },
  is: {
    icon: Users,
    label: "İş Grubu",
    chipClass: "border-amber-600 bg-amber-500 text-white",
  },
  yatirim: {
    icon: TrendingUp,
    label: "Yatırım & Girişim",
    chipClass: "border-emerald-600 bg-emerald-500 text-white",
  },
  girisim: {
    icon: TrendingUp,
    label: "Yatırım & Girişim",
    chipClass: "border-emerald-600 bg-emerald-500 text-white",
  },
  akademik: {
    icon: Globe,
    label: "Akademik",
    chipClass: "border-indigo-600 bg-indigo-500 text-white",
  },
  dayanisma: {
    icon: HandHeart,
    label: "Dayanışma",
    chipClass: "border-rose-600 bg-rose-500 text-white",
  },
  diger: {
    icon: Sparkles,
    label: "Diğer",
    chipClass: "border-slate-500 bg-slate-400 text-white",
  },
};

const placeholderLandings: WhatsAppLanding[] = [
  {
    id: "placeholder-berlin-girisim",
    groupName: "Berlin Girişim Ağı",
    platform: "Discord",
    category: "girisim",
    country: "Almanya",
    city: "Berlin",
    mode: "visual",
    heroImage: waPlaceholderImage,
    tagline: "",
    callToActionText: "Girişimciler, operatörler ve yatırım odaklı profesyoneller için tanışma ve bilgi paylaşım alanı.",
    conditions: "",
    whatsappLink: "#",
    description: "Erken aşama girişimlerden büyüme evresindeki projelere kadar nitelikli bağlantılar kurmak isteyenler için.",
    submitterRole: "manager",
    status: "approved",
    createdAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "placeholder-dubai-yatirim",
    groupName: "Dubai Yatırım Çevresi",
    platform: "LinkedIn",
    category: "yatirim",
    country: "Birleşik Arap Emirlikleri",
    city: "Dubai",
    mode: "visual",
    heroImage: waPlaceholderImage,
    tagline: "",
    callToActionText: "Melek yatırım, fonlar ve girişim ekosistemi etrafında buluşan Türk profesyoneller için seçili topluluk.",
    conditions: "",
    whatsappLink: "#",
    description: "Yatırım, ortaklık ve bölgesel network geliştirmek isteyenler için tasarlandı.",
    submitterRole: "manager",
    status: "approved",
    createdAt: "2026-01-02T00:00:00.000Z",
  },
  {
    id: "placeholder-londra-kariyer",
    groupName: "Londra Kariyer ve İş İlişkileri",
    platform: "WhatsApp",
    category: "is",
    country: "Birleşik Krallık",
    city: "Londra",
    mode: "visual",
    heroImage: waPlaceholderImage,
    tagline: "",
    callToActionText: "Kurumsal kariyer, iş geliştirme ve sektör içi bağlantılar için aktif Türk profesyonel topluluğu.",
    conditions: "",
    whatsappLink: "#",
    description: "Deneyim paylaşımı, yönlendirme ve iş birlikleri odaklı bir ağ.",
    submitterRole: "member",
    status: "approved",
    createdAt: "2026-01-03T00:00:00.000Z",
  },
  {
    id: "placeholder-amsterdam-akademik",
    groupName: "Amsterdam Akademik Türkler",
    platform: "Telegram",
    category: "akademik",
    country: "Hollanda",
    city: "Amsterdam",
    mode: "visual",
    heroImage: waPlaceholderImage,
    tagline: "",
    callToActionText: "Araştırmacılar, yüksek lisans öğrencileri ve akademisyenler için bilgi ve duyuru topluluğu.",
    conditions: "",
    whatsappLink: "#",
    description: "Konferans, burs ve ortak çalışma fırsatları etrafında buluşan akademik çevre.",
    submitterRole: "manager",
    status: "approved",
    createdAt: "2026-01-04T00:00:00.000Z",
  },
  {
    id: "placeholder-toronto-dayanisma",
    groupName: "Toronto Dayanışma Hattı",
    platform: "Facebook",
    category: "dayanisma",
    country: "Kanada",
    city: "Toronto",
    mode: "visual",
    heroImage: waPlaceholderImage,
    tagline: "",
    callToActionText: "Yeni taşınanlar ve yerleşik üyeler arasında hızlı destek, yönlendirme ve yardımlaşma için kuruldu.",
    conditions: "",
    whatsappLink: "#",
    description: "Şehirde hayata uyum, sosyal destek ve güvenilir tavsiyeler için canlı topluluk.",
    submitterRole: "member",
    status: "approved",
    createdAt: "2026-01-05T00:00:00.000Z",
  },
  {
    id: "placeholder-paris-hobi",
    groupName: "Paris Sosyal ve Hobi Kulübü",
    platform: "Instagram",
    category: "hobi",
    country: "Fransa",
    city: "Paris",
    mode: "visual",
    heroImage: waPlaceholderImage,
    tagline: "",
    callToActionText: "Etkinlik, kültür, hafta sonu planları ve ortak ilgi alanları etrafında buluşan sosyal grup.",
    conditions: "",
    whatsappLink: "#",
    description: "Gündelik sosyalleşme ve şehirde birlikte aktivite yapmak isteyenler için.",
    submitterRole: "manager",
    status: "approved",
    createdAt: "2026-01-06T00:00:00.000Z",
  },
];

const approvalBadgeMeta = {
  member: {
    label: "Üye onaylı!",
    tooltip: "Bu topluluk kaydı bir topluluk üyesi tarafından gönderildi.",
    className: "border-sky-600 bg-sky-500 text-white",
  },
  admin: {
    label: "Admin onaylı!",
    tooltip: "Bu topluluk CorteQS admin ekibi tarafından incelenip onaylandı.",
    className: "border-orange-600 bg-orange-500 text-white",
  },
} as const;

function stripCommunityPrefix(text?: string | null) {
  return text?.replace(/^Topluluk\s*[:;]\s*/i, "").trim() ?? "";
}

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

const platformMarkMeta: Record<string, { short: string; className: string }> = {
  WhatsApp: { short: "WA", className: "bg-[#e7f9ee] text-[#1f9d55]" },
  Telegram: { short: "TG", className: "bg-[#e7f4ff] text-[#229ED9]" },
  Discord: { short: "DS", className: "bg-[#eef0ff] text-[#5865F2]" },
  Facebook: { short: "f", className: "bg-[#ecf3ff] text-[#1877F2]" },
  Instagram: { short: "IG", className: "bg-[#fff0f6] text-[#E1306C]" },
  LinkedIn: { short: "in", className: "bg-[#eef7ff] text-[#0A66C2]" },
  X: { short: "X", className: "bg-slate-900 text-white" },
  TikTok: { short: "TT", className: "bg-slate-100 text-slate-900" },
  YouTube: { short: "YT", className: "bg-[#fff0f0] text-[#FF0000]" },
  Reddit: { short: "R", className: "bg-[#fff3ea] text-[#FF5700]" },
};

type GroupFormState = {
  submitterRole: "manager" | "member";
  platform: string;
  category: LandingCategory | "";
  groupName: string;
  country: string;
  whatsappLink: string;
  description: string;
  callToActionText: string;
  conditions: string;
  adminName: string;
  adminEmail: string;
  adminPhone: string;
};

type JoinFormState = {
  fullName: string;
  email: string;
  phone: string;
  note: string;
};

const initialGroupForm: GroupFormState = {
  submitterRole: "member",
  platform: "",
  category: "",
  groupName: "",
  country: "",
  whatsappLink: "",
  description: "",
  callToActionText: "",
  conditions: "",
  adminName: "",
  adminEmail: "",
  adminPhone: "",
};

const initialJoinForm: JoinFormState = {
  fullName: "",
  email: "",
  phone: "",
  note: "",
};

function getErrorMessage(error: unknown, fallback = "Beklenmeyen hata") {
  if (error instanceof Error && error.message.trim()) return error.message;
  if (typeof error === "object" && error && "message" in error && typeof error.message === "string" && error.message.trim()) {
    return error.message;
  }
  if (typeof error === "string" && error.trim()) return error;
  return fallback;
}

export default function AddWhatsAppPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const groupSlug = searchParams.get("group")?.trim() ?? "";

  const [landings, setLandings] = useState<WhatsAppLanding[]>([]);
  const [selectedLanding, setSelectedLanding] = useState<WhatsAppLanding | null>(null);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingLanding, setLoadingLanding] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [joinDialogOpen, setJoinDialogOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [submittingGroup, setSubmittingGroup] = useState(false);
  const [submittingJoin, setSubmittingJoin] = useState(false);
  const [canEditSelectedLanding, setCanEditSelectedLanding] = useState(false);
  const [groupForm, setGroupForm] = useState<GroupFormState>(initialGroupForm);
  const [joinForm, setJoinForm] = useState<JoinFormState>(initialJoinForm);
  const [heroImageFile, setHeroImageFile] = useState<File | null>(null);
  const heroImageInputRef = useRef<HTMLInputElement | null>(null);
  const formFieldInsetClass = "mx-0.5 w-[calc(100%-4px)]";

  useEffect(() => {
    document.dispatchEvent(new Event("render-complete"));
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoadingList(true);

    listLandings()
      .then((rows) => {
        if (!cancelled) setLandings(rows);
      })
      .finally(() => {
        if (!cancelled) setLoadingList(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!groupSlug) {
      setSelectedLanding(null);
      return;
    }

    let cancelled = false;
    setLoadingLanding(true);

    getLanding(groupSlug)
      .then(async (landing) => {
        if (!cancelled) {
          const placeholderLanding = placeholderLandings.find((item) => item.id === groupSlug);
          if (landing) {
            setSelectedLanding(landing);
            return;
          }

          if (user) {
            const editableLanding = await getEditableLandingForCurrentUser(groupSlug);
            if (!cancelled && editableLanding) {
              setSelectedLanding(editableLanding);
              return;
            }
          }

          setSelectedLanding(placeholderLanding ?? null);
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingLanding(false);
      });

    return () => {
      cancelled = true;
    };
  }, [groupSlug, user]);

  useEffect(() => {
    let cancelled = false;

    if (!selectedLanding?.dbId || !user) {
      setCanEditSelectedLanding(false);
      return;
    }

    void canCurrentUserEditLanding(selectedLanding.dbId).then((value) => {
      if (!cancelled) setCanEditSelectedLanding(value);
    });

    return () => {
      cancelled = true;
    };
  }, [selectedLanding?.dbId, user]);

  const filteredLandings = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const mergedLandings = landings.length >= 6 ? landings : [...landings, ...placeholderLandings.slice(0, 6 - landings.length)];

    return mergedLandings.filter((landing) => {
      if (!query) return true;

      const haystack = [
        landing.groupName,
        landing.tagline,
        landing.country,
        landing.city,
        landing.description,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(query);
    });
  }, [landings, searchQuery]);

  const selectedConditionItems = useMemo(
    () =>
      selectedLanding?.conditions
        ?.split("\n")
        .map((condition) => condition.trim())
        .filter(Boolean) ?? [],
    [selectedLanding],
  );

  const updateGroupForm = <K extends keyof GroupFormState>(field: K, value: GroupFormState[K]) => {
    setGroupForm((current) => ({ ...current, [field]: value }));
  };

  const updateJoinForm = <K extends keyof JoinFormState>(field: K, value: JoinFormState[K]) => {
    setJoinForm((current) => ({ ...current, [field]: value }));
  };

  const ensureSignedInForGroupSubmit = () => {
    if (user) return true;

    const nextPath = `${location.pathname}${location.search}`;
    toast({
      title: "Üyelik gerekli",
      description: "Topluluk başvurusu göndermek için Google veya e-posta/şifre ile giriş yapmalısın.",
    });
    navigate(`/login?next=${encodeURIComponent(nextPath)}`);
    return false;
  };

  const resetGroupForm = () => {
    setGroupForm(initialGroupForm);
    setHeroImageFile(null);
  };

  const handleGroupSubmit = async () => {
    if (!groupForm.platform.trim() || !groupForm.groupName.trim() || !groupForm.country.trim() || !groupForm.whatsappLink.trim()) {
      toast({
        title: "Eksik alan",
        description: "Platform, grup adı, ülke ve topluluk linki zorunludur.",
        variant: "destructive",
      });
      return;
    }

    if (groupForm.submitterRole === "manager" && !groupForm.adminName.trim()) {
      toast({
        title: "Yönetici bilgisi eksik",
        description: "Topluluk yöneticisi adı soyad alanını doldurun.",
        variant: "destructive",
      });
      return;
    }

    if (!ensureSignedInForGroupSubmit()) return;

    setSubmittingGroup(true);
    try {
      let heroImageUrl: string | undefined;
      if (groupForm.submitterRole === "manager" && heroImageFile) {
        heroImageUrl = await uploadWhatsAppLandingHeroImage(heroImageFile);
      }

      const adminContact = [groupForm.adminEmail.trim() ? `E-posta: ${groupForm.adminEmail.trim()}` : "", groupForm.adminPhone.trim() ? `Telefon: ${groupForm.adminPhone.trim()}` : ""]
        .filter(Boolean)
        .join("\n");
      const submitterLabel = groupForm.submitterRole === "manager" ? "Topluluk Yöneticisiyim" : "Topluluk Üyesiyim";
      const description = buildLandingDescription({
        description: `[Başvuru tipi: ${submitterLabel}] ${groupForm.description}`.trim(),
        platform: groupForm.platform,
        memberApproved: true,
        adminApproved: false,
        editorReviewPending: false,
      });

      await submitLanding({
        groupName: groupForm.groupName,
        category: groupForm.category || "diger",
        country: groupForm.country,
        city: "Genel",
        mode: groupForm.submitterRole === "manager" ? "visual" : "text",
        heroImage: groupForm.submitterRole === "manager" ? heroImageUrl ?? waPlaceholderImage : undefined,
        callToActionText: groupForm.callToActionText || groupForm.description,
        conditions: groupForm.conditions,
        whatsappLink: groupForm.whatsappLink,
        adminName: groupForm.adminName,
        adminContact,
        description,
      });

      toast({
        title: "Başvurun alındı",
        description: groupForm.submitterRole === "manager"
          ? "Landing sayfan admin onayından sonra /addcom altında görünecek."
          : "Grubun onay sonrası listede yayınlanacak.",
      });

      resetGroupForm();
    } catch (error) {
      toast({
        title: "Gönderilemedi",
        description: getErrorMessage(error),
        variant: "destructive",
      });
    } finally {
      setSubmittingGroup(false);
    }
  };

  const handleJoinSubmit = async () => {
    if (!selectedLanding?.dbId) {
      toast({
        title: "Kayıt bulunamadı",
        description: "Bu grup için aktif katılım kaydı bulunamadı.",
      });
      return;
    }

    if (groupForm.submitterRole === "manager" && !groupForm.adminEmail.trim()) {
      toast({
        title: "Yönetici bilgisi eksik",
        description: "Topluluk yöneticisi mail adresini doldurun.",
        variant: "destructive",
      });
      return;
    }

    if (groupForm.submitterRole === "manager" && !groupForm.adminPhone.trim()) {
      toast({
        title: "Yönetici bilgisi eksik",
        description: "Topluluk yöneticisi telefon alanını doldurun.",
        variant: "destructive",
      });
      return;
    }

    if (!joinForm.fullName.trim() || !joinForm.email.trim()) {
      toast({
        title: "Eksik alan",
        description: "Ad ve e-posta zorunludur.",
        variant: "destructive",
      });
      return;
    }

    setSubmittingJoin(true);
    try {
      await createJoinRequest({
        landingDbId: selectedLanding.dbId,
        fullName: joinForm.fullName,
        email: joinForm.email,
        phone: joinForm.phone,
        note: joinForm.note,
      });

      toast({
        title: "Talebin alındı",
        description: "Yönetici bilgilendirildi. Onay sonrası iletişime geçilecek.",
      });
      setJoinDialogOpen(false);
      setJoinForm(initialJoinForm);
    } catch (error) {
      toast({
        title: "Talep gönderilemedi",
        description: getErrorMessage(error),
        variant: "destructive",
      });
    } finally {
      setSubmittingJoin(false);
    }
  };

  const handleShare = async () => {
    if (!selectedLanding) return;

    const shareUrl = `${window.location.origin}/addcom?group=${encodeURIComponent(selectedLanding.id)}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: selectedLanding.groupName,
          text: selectedLanding.tagline,
          url: shareUrl,
        });
        return;
      } catch {
        // Fall through to clipboard.
      }
    }

    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    toast({
      title: "Link kopyalandı",
      description: "Landing sayfası artık yeni /addcom adresi ile paylaşılabilir.",
    });
    window.setTimeout(() => setCopied(false), 1800);
  };

  const backToList = () => {
    setSearchParams({});
    navigate("/addcom", { replace: true });
  };

  const renderApprovalBadges = (landing: WhatsAppLanding, isDetailView = false) => {
    const badges = [];

    if (landing.memberApproved) {
      badges.push(approvalBadgeMeta.member);
    }

    if (landing.adminApproved) {
      badges.push(approvalBadgeMeta.admin);
    }

    if (badges.length === 0) return null;

    return (
      <div className="flex flex-col gap-2">
        {badges.map((badge) => (
          <Tooltip key={badge.label}>
            <TooltipTrigger asChild>
              <Badge className={`flex h-8 w-full cursor-default items-center justify-center border px-3 text-center text-xs font-semibold ${badge.className}`}>
                {badge.label}
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p>{badge.tooltip}</p>
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    );
  };

  const renderDetailMetaBadges = (landing: WhatsAppLanding) => {
    const badges: JSX.Element[] = [];

    // Approval badges (detail view style)
    if (landing.memberApproved) {
      badges.push(
        <Tooltip key="member-badge">
          <TooltipTrigger asChild>
            <Badge className={`flex w-full cursor-default justify-center border px-3 py-1.5 text-center text-sm font-semibold ${approvalBadgeMeta.member.className}`}>
              {approvalBadgeMeta.member.label}
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p>{approvalBadgeMeta.member.tooltip}</p>
          </TooltipContent>
        </Tooltip>
      );
    }

    if (landing.adminApproved) {
      badges.push(
        <Tooltip key="admin-badge">
          <TooltipTrigger asChild>
            <Badge className={`flex w-full cursor-default justify-center border px-3 py-1.5 text-center text-sm font-semibold ${approvalBadgeMeta.admin.className}`}>
              {approvalBadgeMeta.admin.label}
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p>{approvalBadgeMeta.admin.tooltip}</p>
          </TooltipContent>
        </Tooltip>
      );
    }

    // Category badge (vibrant colors)
    const Icon = categoryMeta[landing.category].icon;
    badges.push(
      <Badge key="category" className={`flex h-8 w-full cursor-default items-center justify-center border px-3 text-center text-xs font-semibold ${categoryMeta[landing.category].chipClass}`}>
        <Icon className="mr-1.5 h-3 w-3" />
        {categoryMeta[landing.category].label}
      </Badge>
    );

    // City badge (vivid slate)
    badges.push(
      <Badge key="city" className="flex w-full cursor-default justify-center border border-slate-700 bg-slate-600 px-3 py-1.5 text-center text-sm font-semibold text-white">
        <MapPin className="mr-2 h-4 w-4" />
        {landing.city}, {landing.country}
      </Badge>
    );

    // Admin badge (if present, vivid violet)
    if (landing.adminName) {
      badges.push(
        <Badge key="admin" className="flex w-full cursor-default justify-center border border-violet-600 bg-violet-500 px-3 py-1.5 text-center text-sm font-semibold text-white">
          <Users className="mr-2 h-4 w-4" />
          Yönetici: {landing.adminName}
        </Badge>
      );
    }

    if (badges.length === 0) return null;

    return <div className="flex flex-col gap-2">{badges}</div>;
  };

  const renderPlatformLogo = (platform?: string, size: "md" | "lg" = "md") => {
    if (!platform) return null;

    const platformLogoMap: Record<string, { svg: JSX.Element; className: string }> = {
      WhatsApp: {
        className: "bg-[radial-gradient(circle_at_30%_30%,#5af08a_0%,#25D366_45%,#0f9f4f_100%)]",
        svg: (
          <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <path
              fill="white"
              d="M12 3.15a8.85 8.85 0 0 0-7.537 13.49L3.3 20.7a.7.7 0 0 0 .872.872l4.022-1.147A8.85 8.85 0 1 0 12 3.15Zm0 15.97a7.08 7.08 0 0 1-3.61-.987.72.72 0 0 0-.544-.083l-2.21.63.64-2.184a.72.72 0 0 0-.09-.588A7.08 7.08 0 1 1 12 19.12Z"
            />
            <path
              fill="white"
              d="M15.92 13.846c-.214-.107-1.263-.623-1.459-.694-.195-.071-.338-.107-.48.107-.143.214-.552.694-.677.837-.125.143-.25.16-.463.053-.214-.107-.904-.333-1.722-1.061-.636-.567-1.065-1.267-1.19-1.48-.125-.214-.013-.33.094-.436.096-.095.214-.25.321-.374.107-.125.143-.214.214-.357.072-.143.036-.268-.017-.374-.054-.107-.481-1.156-.659-1.584-.173-.414-.349-.358-.48-.365l-.409-.007a.784.784 0 0 0-.57.267c-.196.214-.748.73-.748 1.78s.766 2.064.873 2.206c.107.143 1.507 2.301 3.651 3.225.51.22.908.35 1.219.448.512.162.979.139 1.347.084.411-.061 1.263-.516 1.441-1.014.178-.498.178-.925.125-1.014-.054-.09-.196-.143-.409-.25Z"
            />
          </svg>
        ),
      },
      Telegram: {
        className: "bg-[#e7f4ff]",
        svg: (
          <svg viewBox="0 0 24 24" fill="#229ED9" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12l-6.869 4.332-2.96-.924c-.64-.203-.658-.64.135-.954l11.566-4.461c.54-.203 1.01.132.84.943z" />
          </svg>
        ),
      },
      Discord: {
        className: "bg-[#eef0ff]",
        svg: (
          <svg viewBox="0 0 24 24" fill="#5865F2" xmlns="http://www.w3.org/2000/svg">
            <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.211.375-.444.864-.607 1.25a18.27 18.27 0 0 0-5.487 0c-.163-.386-.395-.875-.607-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.873-1.295 1.226-1.994a.076.076 0 0 0-.042-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.294.075.075 0 0 1 .078-.01c3.928 1.793 8.18 1.793 12.062 0a.075.075 0 0 1 .079.009c.12.098.246.198.373.295a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.076.076 0 0 0-.041.107c.36.699.77 1.364 1.225 1.994a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.057c.5-4.761-.838-8.895-3.549-12.55a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-.965-2.157-2.156 0-1.193.960-2.157 2.157-2.157 1.198 0 2.167.964 2.157 2.157 0 1.19-.96 2.155-2.157 2.155zm7.975 0c-1.183 0-2.157-.965-2.157-2.156 0-1.193.960-2.157 2.157-2.157 1.198 0 2.167.964 2.157 2.157 0 1.19-.959 2.155-2.157 2.155z" />
          </svg>
        ),
      },
      Facebook: {
        className: "bg-[#ecf3ff]",
        svg: (
          <svg viewBox="0 0 24 24" fill="#1877F2" xmlns="http://www.w3.org/2000/svg">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
          </svg>
        ),
      },
      Instagram: {
        className: "bg-[#fff0f6]",
        svg: (
          <svg viewBox="0 0 24 24" fill="#E1306C" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.117.63c-.79.297-1.427.645-2.03 1.24-.595.593-.943 1.232-1.24 2.02-.297.788-.5 1.658-.56 2.936C.035 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.263 2.148.56 2.936.297.787.645 1.427 1.24 2.02.593.595 1.232.943 2.02 1.24.788.297 1.659.5 2.936.56C8.333 23.965 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.263 2.936-.56.787-.297 1.427-.645 2.02-1.24.595-.593.943-1.232 1.24-2.02.297-.788.5-1.659.56-2.936.057-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.263-2.148-.56-2.936-.297-.787-.645-1.427-1.24-2.02-.593-.595-1.232-.943-2.02-1.24-.788-.297-1.659-.5-2.936-.56C15.667.048 15.26 0 12 0zm0 2.16c3.203 0 3.585.009 4.849.07 1.171.054 1.805.244 2.227.408.56.217.96.477 1.382.896.419.42.679.822.896 1.381.164.422.354 1.057.408 2.227.061 1.264.07 1.646.07 4.849s-.009 3.585-.07 4.849c-.054 1.171-.244 1.805-.408 2.227-.217.56-.477.96-.896 1.382-.42.419-.822.679-1.381.896-.422.164-1.057.354-2.227.408-1.264.061-1.646.07-4.849.07s-3.585-.009-4.849-.07c-1.171-.054-1.805-.244-2.227-.408-.56-.217-.96-.477-1.382-.896-.419-.42-.679-.822-.896-1.381-.164-.422-.354-1.057-.408-2.227-.061-1.264-.07-1.646-.07-4.849s.009-3.585.07-4.849c.054-1.171.244-1.805.408-2.227.217-.56.477-.96.896-1.382.42-.419.822-.679 1.381-.896.422-.164 1.057-.354 2.227-.408 1.264-.061 1.646-.07 4.849-.07z" />
            <path d="M12 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm4.965-10.322a1.44 1.44 0 1 1 0-2.881 1.44 1.44 0 0 1 0 2.881z" />
          </svg>
        ),
      },
      LinkedIn: {
        className: "bg-[#eef7ff]",
        svg: (
          <svg viewBox="0 0 24 24" fill="#0A66C2" xmlns="http://www.w3.org/2000/svg">
            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.225 0z" />
          </svg>
        ),
      },
      X: {
        className: "bg-slate-900",
        svg: (
          <svg viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24h-6.657l-5.07-6.63-5.848 6.63H2.42l7.723-8.835L1.254 2.25h6.554l4.882 6.268L18.244 2.25zM17.51 19.31h1.828L5.84 4.126H3.863L17.51 19.31z" />
          </svg>
        ),
      },
      TikTok: {
        className: "bg-slate-100",
        svg: (
          <svg viewBox="0 0 24 24" fill="#000" xmlns="http://www.w3.org/2000/svg">
            <path d="M19.498 4.667c-1.625-1.44-1.562-3.643-1.562-3.667h-3.33v12.3c0 1.36-1.088 2.46-2.444 2.46-1.36 0-2.46-1.1-2.46-2.46 0-1.36 1.1-2.46 2.46-2.46.28 0 .56.04.814.12v-3.3a5.844 5.844 0 0 0-.814-.06c-3.4 0-6.166 2.76-6.166 6.16s2.766 6.166 6.166 6.166c3.4 0 6.166-2.766 6.166-6.166V9.3c1.242.872 2.746 1.35 4.404 1.35v-3.328c-.986 0-1.922-.22-2.768-.656z" />
          </svg>
        ),
      },
      YouTube: {
        className: "bg-[#fff0f0]",
        svg: (
          <svg viewBox="0 0 24 24" fill="#FF0000" xmlns="http://www.w3.org/2000/svg">
            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
          </svg>
        ),
      },
      Reddit: {
        className: "bg-[#fff3ea]",
        svg: (
          <svg viewBox="0 0 24 24" fill="#FF5700" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.385 4.859-7.563 4.859-4.178 0-7.562-2.165-7.562-4.859 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.53l.375-1.844z" />
          </svg>
        ),
      },
    };

    const logoMeta = platformLogoMap[platform];
    if (!logoMeta) return null;

    const isWhatsApp = platform === "WhatsApp";
    const outerSize = size === "lg" ? "h-20 w-20" : "h-16 w-16";
    const innerSize = size === "lg" ? "h-12 w-12" : "h-10 w-10";
    const ringClass = isWhatsApp
      ? "ring-2 ring-emerald-200 shadow-[0_18px_40px_rgba(37,211,102,0.28)]"
      : "ring-2 ring-white shadow-lg";

    return (
      <div
        title={platform}
        className={`inline-flex ${outerSize} items-center justify-center rounded-full ${ringClass} ${logoMeta.className}`}
      >
        <div className={innerSize}>{logoMeta.svg}</div>
      </div>
    );
  };

  const getLandingHeroImage = (landing: WhatsAppLanding) => landing.heroImage?.trim() || waPlaceholderImage;

  const getApprovalStatusMeta = (landing: WhatsAppLanding) => {
    if (landing.adminApproved) {
      return {
        label: approvalBadgeMeta.admin.label,
        tooltip: approvalBadgeMeta.admin.tooltip,
        className: approvalBadgeMeta.admin.className,
      };
    }

    if (landing.memberApproved) {
      return {
        label: approvalBadgeMeta.member.label,
        tooltip: approvalBadgeMeta.member.tooltip,
        className: approvalBadgeMeta.member.className,
      };
    }

    return {
      label: "Onay bekliyor",
      tooltip: "Bu topluluk henüz topluluk üyesi veya yönetici onayı almamış.",
      className: "border-amber-300 bg-amber-50 text-amber-700",
    };
  };

  if (groupSlug) {
    return (
      <div className="min-h-screen bg-background">
        <main className="container mx-auto max-w-5xl px-4 pb-16 pt-10">
          {loadingLanding ? (
            <div className="rounded-3xl border border-border bg-card p-10 text-center text-muted-foreground">
              Landing yükleniyor...
            </div>
          ) : !selectedLanding ? (
            <div className="rounded-3xl border border-border bg-card p-10 text-center">
              <h1 className="text-2xl font-bold text-foreground">Landing sayfası bulunamadı</h1>
              <p className="mt-3 text-muted-foreground">
                Bu slug için yayınlanmış bir grup sayfası yok veya henüz onaylanmamış olabilir.
              </p>
              <Button className="mt-6" variant="outline" onClick={backToList}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Tüm gruplara dön
              </Button>
            </div>
          ) : (
            <div className="space-y-8">
              <Link
                to="/addcom"
                onClick={(event) => {
                  event.preventDefault();
                  backToList();
                }}
                className="flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white/95 px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700"
              >
                <ArrowLeft className="h-4 w-4" />
                Tüm gruplar
              </Link>

              {selectedLanding.mode === "visual" || selectedLanding.heroImage ? (
                <section className="relative overflow-hidden rounded-[2rem] border border-border">
                  <img
                    src={getLandingHeroImage(selectedLanding)}
                    alt={selectedLanding.groupName}
                    className="aspect-video w-full object-cover"
                    onError={(event) => {
                      if (event.currentTarget.src !== waPlaceholderImage) {
                        event.currentTarget.src = waPlaceholderImage;
                      }
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-900/35 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-6 text-white md:p-8">
                    <div className="mb-4 flex items-center gap-4">
                      <div className="shrink-0">{renderPlatformLogo(selectedLanding.platform, "lg")}</div>
                      <h1 className="text-3xl font-black leading-tight md:text-5xl">{selectedLanding.groupName}</h1>
                    </div>
                    <p className="mt-3 max-w-2xl text-sm text-slate-100 md:text-lg">{selectedLanding.tagline}</p>
                  </div>
                </section>
              ) : (
                <section className="rounded-[2rem] border border-border bg-[linear-gradient(135deg,#ecfdf5_0%,#ffffff_55%,#f8fafc_100%)] p-8 shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
                  <div className="mb-4 flex items-center gap-4">
                    <div className="shrink-0">{renderPlatformLogo(selectedLanding.platform, "lg")}</div>
                    <h1 className="text-3xl font-black text-foreground md:text-5xl">{selectedLanding.groupName}</h1>
                  </div>
                  <p className="mt-3 max-w-2xl text-base text-muted-foreground md:text-xl">
                    {selectedLanding.tagline}
                  </p>
                </section>
              )}

              {(() => {
                const cat = categoryMeta[selectedLanding.category];
                const CatIcon = cat.icon;
                const approvalStatus = getApprovalStatusMeta(selectedLanding);
                const managerName = selectedLanding.adminName?.trim() || "-";
                const detailMetaCardClass =
                  "flex min-h-[76px] items-center gap-3 rounded-2xl border px-4 py-3 text-left shadow-sm";

                return (
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <div className={`${detailMetaCardClass} border-slate-700 bg-slate-600 text-white`}>
                      <MapPin className="h-4.5 w-4.5 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/70">Lokasyon</p>
                        <p className="truncate text-sm font-semibold">{selectedLanding.city}, {selectedLanding.country}</p>
                      </div>
                    </div>

                    <div className={`${detailMetaCardClass} ${cat.chipClass}`}>
                      <CatIcon className="h-4.5 w-4.5 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-[11px] font-bold uppercase tracking-[0.18em] opacity-70">Kategori</p>
                        <p className="truncate text-sm font-semibold">{cat.label}</p>
                      </div>
                    </div>

                    <div className={`${detailMetaCardClass} border-violet-600 bg-violet-500 text-white`}>
                      <Users className="h-4.5 w-4.5 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/70">Yönetici</p>
                        <p className="truncate text-sm font-semibold">{managerName}</p>
                      </div>
                    </div>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className={`${detailMetaCardClass} cursor-default ${approvalStatus.className}`}>
                          <ShieldCheck className="h-4.5 w-4.5 shrink-0" />
                          <div className="min-w-0">
                            <p className="text-[11px] font-bold uppercase tracking-[0.18em] opacity-70">Onay Durumu</p>
                            <p className="truncate text-sm font-semibold">{approvalStatus.label}</p>
                          </div>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{approvalStatus.tooltip}</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                );
              })()}

              <section className="rounded-[1.75rem] border border-border bg-card p-6 shadow-[0_20px_60px_rgba(15,23,42,0.06)] md:p-8">
                <h2 className="text-xl font-bold text-foreground">Grubun çağrı metni</h2>
                <p className="mt-4 whitespace-pre-line text-foreground/85">{stripCommunityPrefix(selectedLanding.callToActionText)}</p>

                <div className="mt-6 flex flex-col gap-3">
                  {canEditSelectedLanding ? (
                    <Button
                      size="lg"
                      asChild
                      variant="outline"
                      className="w-full gap-2 border-[#4285F4] bg-[#4285F4] text-black hover:bg-[#357AE8] hover:text-black"
                    >
                      <Link to={`/addcom/edit/${encodeURIComponent(selectedLanding.id)}`}>
                        <Pencil className="h-5 w-5" />
                        Landing'i Düzenle
                      </Link>
                    </Button>
                  ) : null}

                  <Button size="lg" asChild className="w-full gap-2 bg-emerald-600 text-white hover:bg-emerald-700">
                    <a href={selectedLanding.whatsappLink} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-5 w-5" />
                      Platforma git!
                    </a>
                  </Button>

                  <Button size="lg" className="w-full gap-2 bg-orange-500 text-white hover:bg-orange-600" onClick={() => void handleShare()}>
                    {copied ? <Check className="h-4 w-4" /> : <Share2 className="h-4 w-4" />}
                    {copied ? "Kopyalandı" : "Sayfayı Paylaş"}
                  </Button>
                </div>
              </section>

              {selectedConditionItems.length > 0 ? (
                <section className="rounded-[1.75rem] border border-border bg-card p-2 md:p-3">
                  <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="group-conditions" className="border-none">
                      <AccordionTrigger className="rounded-[1.25rem] px-4 py-4 text-left text-lg font-bold text-foreground hover:no-underline md:px-5">
                        <span className="flex items-center gap-2">
                          <ShieldCheck className="h-5 w-5 text-emerald-600" />
                          Grup koşulları
                        </span>
                      </AccordionTrigger>
                      <AccordionContent className="px-4 pb-4 pt-1 md:px-5">
                        <ul className="space-y-2">
                          {selectedConditionItems.map((condition) => (
                            <li key={condition} className="flex items-start gap-2 text-sm text-foreground/85">
                              <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                              <span>{condition}</span>
                            </li>
                          ))}
                        </ul>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </section>
              ) : null}
            </div>
          )}
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#fffdfa_0%,#f9fafb_100%)]">
      <main className="container mx-auto px-4 pb-16 pt-6">
        <section className="relative overflow-hidden rounded-[1.75rem] border border-emerald-100 bg-[radial-gradient(circle_at_top_left,#f1fbf8_0%,#f7fafc_45%,#ffffff_100%)] shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
          <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(16,185,129,0.06),transparent_45%,rgba(14,165,233,0.08))]" />
          <div className="relative">
            <img
              src={messagingHeroImage}
              alt="Türk diaspora topluluklarını temsil eden mesajlaşma grupları görseli"
              className="h-[24rem] w-full object-cover md:h-[30rem]"
            />
            <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.97)_0%,rgba(255,255,255,0.92)_22%,rgba(255,255,255,0.72)_40%,rgba(255,255,255,0.34)_58%,rgba(255,255,255,0.08)_72%,rgba(255,255,255,0)_82%)]" />
            <div className="absolute inset-y-0 left-0 flex w-full items-center p-6 md:w-[52%] md:p-10">
              <div className="max-w-full text-slate-950">
                <h1 className="flex items-start gap-3 text-[1.9rem] font-black tracking-tight md:text-[3rem]">
                  <MessageSquare className="mt-1 h-7 w-7 shrink-0 text-emerald-600 md:h-9 md:w-9" />
                  <span className="flex flex-col leading-[0.95]">
                    <span className="bg-[linear-gradient(90deg,#059669_0%,#06b6d4_30%,#2563eb_65%)] bg-clip-text text-transparent drop-shadow-[0_3px_14px_rgba(255,255,255,0.52)]">
                      Sosyal Medya
                    </span>
                    <span className="bg-[linear-gradient(90deg,#2563eb_0%,#7c3aed_45%,#f97316_100%)] bg-clip-text text-transparent drop-shadow-[0_3px_14px_rgba(255,255,255,0.52)]">
                      Türk Toplulukları
                    </span>
                  </span>
                </h1>
                <div className="mt-4 grid max-w-[28rem] grid-cols-3 gap-3">
                  <Badge className="flex h-9 w-full items-center justify-center border border-emerald-200/70 bg-white/88 px-4 text-center text-sm font-semibold text-emerald-700 shadow-sm backdrop-blur-sm">
                    WhatsApp
                  </Badge>
                  <Badge className="flex h-9 w-full items-center justify-center border border-sky-200/70 bg-white/88 px-4 text-center text-sm font-semibold text-sky-700 shadow-sm backdrop-blur-sm">
                    Telegram
                  </Badge>
                  <Badge className="flex h-9 w-full items-center justify-center border border-indigo-200/70 bg-white/88 px-4 text-center text-sm font-semibold text-indigo-700 shadow-sm backdrop-blur-sm">
                    Discord
                  </Badge>
                  <Badge className="flex h-9 w-full items-center justify-center border border-blue-200/70 bg-white/88 px-4 text-center text-sm font-semibold text-blue-700 shadow-sm backdrop-blur-sm">
                    Facebook
                  </Badge>
                  <Badge className="flex h-9 w-full items-center justify-center border border-pink-200/70 bg-white/88 px-4 text-center text-sm font-semibold text-pink-700 shadow-sm backdrop-blur-sm">
                    Instagram
                  </Badge>
                  <Badge className="flex h-9 w-full items-center justify-center border border-blue-200/70 bg-white/88 px-4 text-center text-sm font-semibold text-blue-800 shadow-sm backdrop-blur-sm">
                    LinkedIn
                  </Badge>
                  <Badge className="flex h-9 w-full items-center justify-center border border-slate-300/70 bg-white/88 px-4 text-center text-sm font-semibold text-slate-900 shadow-sm backdrop-blur-sm">
                    X
                  </Badge>
                  <Badge className="flex h-9 w-full items-center justify-center border border-red-200/70 bg-white/88 px-4 text-center text-sm font-semibold text-red-600 shadow-sm backdrop-blur-sm">
                    YouTube
                  </Badge>
                  <Badge className="flex h-9 w-full items-center justify-center border border-orange-200/70 bg-white/88 px-4 text-center text-sm font-semibold text-orange-600 shadow-sm backdrop-blur-sm">
                    Reddit
                  </Badge>
                </div>
                <div className="mt-5 space-y-2">
                  <p className="text-[1.05rem] font-semibold text-slate-900 md:text-[1.22rem] md:whitespace-nowrap">
                    Dünyadaki Türk topluluklarını keşfet.
                  </p>
                  <p className="text-[1.05rem] font-bold text-slate-950 md:text-[1.22rem] md:whitespace-nowrap">
                    Her konuda toplulukları saniyeler içinde bul.
                  </p>
                  <p className="text-[1.05rem] font-bold text-slate-950 md:text-[1.22rem] md:whitespace-nowrap">
                    Sana uygun topluluğa katıl!
                  </p>
                  <p className="text-[1.05rem] font-bold text-slate-950 md:text-[1.22rem] md:whitespace-nowrap">
                    Toplulukları ücretsiz ekle.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="mt-8 rounded-[1.9rem] border border-emerald-200/70 bg-[linear-gradient(135deg,rgba(236,253,245,0.96)_0%,rgba(255,255,255,0.98)_42%,rgba(239,246,255,0.94)_100%)] p-3 shadow-[0_20px_60px_rgba(15,23,42,0.08)] ring-1 ring-white/80 backdrop-blur-sm">
          <Accordion type="single" collapsible defaultValue={undefined} className="w-full">
            <AccordionItem value="addwa-form" className="border-b-0">
              <AccordionTrigger
                className="min-h-[62px] rounded-[1.45rem] bg-white/55 px-3 py-0 text-slate-900 hover:no-underline"
                chevronWrapperClassName="border border-emerald-200/70 bg-[linear-gradient(135deg,rgba(255,255,255,0.95)_0%,rgba(220,252,231,0.92)_100%)] shadow-[0_12px_28px_rgba(16,185,129,0.15)] ring-1 ring-white/90"
                chevronClassName="h-4.5 w-4.5 text-emerald-700"
              >
                <div className="flex min-h-[56px] items-center gap-3 text-left">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[linear-gradient(135deg,#ecfdf5_0%,#d1fae5_100%)] shadow-[0_10px_24px_rgba(16,185,129,0.16)] ring-1 ring-emerald-200/80">
                    <Sparkles className="h-4 w-4 text-emerald-700" />
                  </span>
                  <div className="flex items-center">
                    <h2 className="text-base font-bold tracking-[0.01em] text-slate-900 md:text-lg">Topluluk Ekle</h2>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-4">
                <div className="space-y-5">
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">1. Grup Bilgileri</h3>
                    <div>
                      <Label>Başvuru Tipi</Label>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <Button
                          type="button"
                          variant={groupForm.submitterRole === "member" ? "default" : "outline"}
                          onClick={() => updateGroupForm("submitterRole", "member")}
                          className={groupForm.submitterRole === "member" ? "border-orange-500 bg-orange-500 text-white hover:bg-orange-600" : ""}
                        >
                          Topluluk Üyesiyim
                        </Button>
                        <Button
                          type="button"
                          variant={groupForm.submitterRole === "manager" ? "default" : "outline"}
                          onClick={() => updateGroupForm("submitterRole", "manager")}
                          className={groupForm.submitterRole === "manager" ? "border-orange-500 bg-orange-500 text-white hover:bg-orange-600" : ""}
                        >
                          Topluluk Yöneticisiyim
                        </Button>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="platform">Platform *</Label>
                      <Select value={groupForm.platform} onValueChange={(value) => updateGroupForm("platform", value)}>
                        <SelectTrigger id="platform" className={`mt-1 ${formFieldInsetClass}`}>
                          <SelectValue placeholder="Platform seç" />
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

                    <div>
                      <Label htmlFor="category">Kategori</Label>
                      <Select value={groupForm.category} onValueChange={(value) => updateGroupForm("category", value as LandingCategory)}>
                        <SelectTrigger id="category" className={`mt-1 ${formFieldInsetClass}`}>
                          <SelectValue placeholder="İsteğe bağlı kategori seç" />
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

                    <div>
                      <Label htmlFor="group-name">Grup Adı *</Label>
                      <Input
                        id="group-name"
                        className={formFieldInsetClass}
                        lang="tr"
                        spellCheck
                        value={groupForm.groupName}
                        onChange={(event) => updateGroupForm("groupName", event.target.value)}
                        placeholder="Örn: Berlin Türk Girişimciler"
                      />
                    </div>

                    <div>
                      <Label htmlFor="whatsapp-link">Topluluk Linki *</Label>
                      <Input
                        id="whatsapp-link"
                        className={formFieldInsetClass}
                        value={groupForm.whatsappLink}
                        onChange={(event) => updateGroupForm("whatsappLink", event.target.value)}
                        placeholder="https://..."
                      />
                    </div>

                    <div>
                      <Label htmlFor="country">Ülke *</Label>
                      <Input
                        id="country"
                        className={formFieldInsetClass}
                        lang="tr"
                        spellCheck
                        value={groupForm.country}
                        onChange={(event) => updateGroupForm("country", event.target.value)}
                        placeholder="Global veya ülke adı giriniz"
                      />
                    </div>

                    <div>
                      <Label htmlFor="description">Kısa Açıklama</Label>
                      <Textarea
                        id="description"
                        className={formFieldInsetClass}
                        lang="tr"
                        spellCheck
                        rows={3}
                        value={groupForm.description}
                        onChange={(event) => updateGroupForm("description", event.target.value)}
                        placeholder="Grup hakkında 1-2 cümle"
                      />
                    </div>
                  </div>

                  {groupForm.submitterRole === "manager" ? (
                    <div className="space-y-3">
                      <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                        2. Topluluk Kartı Özelliklerini Belirtin (Sadece Yöneticiler İçindir.)
                      </h3>

                      <div>
                        <Label htmlFor="hero-image-file">Topluluk Kartı İçin Görsel Yükle</Label>
                        <input
                          ref={heroImageInputRef}
                          id="hero-image-file"
                          type="file"
                          accept="image/jpeg,image/png,image/webp,image/gif"
                          className="hidden"
                          onChange={(event) => setHeroImageFile(event.target.files?.[0] ?? null)}
                        />
                        <button
                          type="button"
                          onClick={() => heroImageInputRef.current?.click()}
                          className="ml-3 inline-flex h-11 items-center gap-2 rounded-xl border border-orange-200 bg-orange-500 px-4 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(249,115,22,0.22)] transition hover:-translate-y-0.5 hover:bg-orange-600 hover:shadow-[0_16px_36px_rgba(249,115,22,0.28)]"
                        >
                          Dosya Seç
                        </button>
                          <p className="mt-2 text-xs text-muted-foreground">
                            {heroImageFile
                              ? `Seçilen dosya: ${heroImageFile.name}`
                              : "Dosya tipi: JPG, PNG, WEBP, GIF. Önerilen oran: 16:9 yatay. Maksimum dosya boyutu: 5 MB."}
                          </p>
                      </div>

                      <div>
                        <Label htmlFor="cta-text">Yeni üyeler için mesaj</Label>
                        <Textarea
                          id="cta-text"
                          className={formFieldInsetClass}
                          lang="tr"
                          spellCheck
                          rows={4}
                          value={groupForm.callToActionText}
                          onChange={(event) => updateGroupForm("callToActionText", event.target.value)}
                          placeholder="Yeni üyelere çağrı amacıyla metin yaz."
                        />
                      </div>

                      <div>
                        <Label htmlFor="conditions">Topluluk Kuralları</Label>
                        <Textarea
                          id="conditions"
                          className={formFieldInsetClass}
                          lang="tr"
                          spellCheck
                          rows={4}
                          value={groupForm.conditions}
                          onChange={(event) => updateGroupForm("conditions", event.target.value)}
                          placeholder={"Her satıra bir kural yazın\nÖrn: Grup içi reklam yasak"}
                        />
                      </div>

                      <div>
                        <Label htmlFor="admin-name">Topluluk Yöneticisi Adı Soyad *</Label>
                        <Input
                          id="admin-name"
                          className={formFieldInsetClass}
                          lang="tr"
                          spellCheck
                          value={groupForm.adminName}
                          onChange={(event) => updateGroupForm("adminName", event.target.value)}
                          placeholder="Ad Soyad"
                        />
                      </div>

                      <div>
                        <Label htmlFor="admin-email">Topluluk Yöneticisi Mail Adresi *</Label>
                        <Input
                          id="admin-email"
                          type="email"
                          className={formFieldInsetClass}
                          value={groupForm.adminEmail}
                          onChange={(event) => updateGroupForm("adminEmail", event.target.value)}
                          placeholder="ornek@email.com"
                        />
                      </div>

                      <div>
                        <Label htmlFor="admin-phone">Topluluk Yöneticisi Telefon *</Label>
                        <Input
                          id="admin-phone"
                          className={formFieldInsetClass}
                          value={groupForm.adminPhone}
                          onChange={(event) => updateGroupForm("adminPhone", event.target.value)}
                          placeholder="+49 ..."
                        />
                      </div>
                    </div>
                  ) : null}

                  <Button
                    className="w-full bg-emerald-600 text-white hover:bg-emerald-700"
                    onClick={() => void handleGroupSubmit()}
                    disabled={submittingGroup}
                  >
                    {submittingGroup ? "Gönderiliyor..." : "Başvuruyu Gönder"}
                  </Button>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>

        <section className="mt-8">
          <div className="relative w-full">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="pl-9"
              placeholder="Topluluk ara!"
            />
          </div>

          <div className="mt-5">
            <div>
              <h2 className="text-3xl font-bold text-slate-900">Katılabileceğin Topluluklar</h2>
            </div>
          </div>

          <div className="mt-6">
            {loadingList ? (
              <div className="rounded-[1.75rem] border border-border bg-card p-10 text-center text-muted-foreground">
                Gruplar yükleniyor...
              </div>
            ) : filteredLandings.length === 0 ? (
              <div className="rounded-[1.75rem] border border-dashed border-border bg-card p-10 text-center">
                <h3 className="text-lg font-bold text-foreground">Filtreye uygun grup bulunamadı</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Aramayı temizleyebilir veya ilk başvurulardan birini siz gönderebilirsiniz.
                </p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {filteredLandings.map((landing) => {
                  const Icon = categoryMeta[landing.category].icon;
                  const cardSummary =
                    stripCommunityPrefix(landing.callToActionText) ||
                    stripCommunityPrefix(
                      landing.description
                      ?.replace(/\[Platform:\s*[^\]]+\]\s*/gi, "")
                      .replace(/\[Başvuru tipi:[^\]]+\]\s*/gi, "")
                      .replace(/\[Badge member:\s*(true|false)\]\s*/gi, "")
                      .replace(/\[Badge admin:\s*(true|false)\]\s*/gi, "")
                      .trim(),
                    ) ||
                    "Topluluk detaylarını görmek için karta tıkla.";

                  return (
                    <Link
                      key={landing.id}
                      to={`/addcom?group=${encodeURIComponent(landing.id)}`}
                      className="group flex flex-col overflow-hidden rounded-[1.75rem] border border-border bg-white shadow-[0_16px_50px_rgba(15,23,42,0.05)] transition-transform duration-200 hover:-translate-y-1"
                    >
                      {landing.mode === "visual" || landing.heroImage ? (
                        <div className="relative">
                          <img
                            src={getLandingHeroImage(landing)}
                            alt={landing.groupName}
                            className="aspect-video w-full object-cover"
                            onError={(event) => {
                              if (event.currentTarget.src !== waPlaceholderImage) {
                                event.currentTarget.src = waPlaceholderImage;
                              }
                            }}
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-slate-900/20 to-transparent" />
                        </div>
                      ) : null}

                      <div className="flex flex-1 flex-col p-5">
                        <div className="flex flex-col gap-2">
                          {renderApprovalBadges(landing)}
                          <Badge className={`flex h-8 w-full items-center justify-center border px-3 text-xs font-semibold ${categoryMeta[landing.category].chipClass}`}>
                            <Icon className="mr-1.5 h-3 w-3" />
                            {categoryMeta[landing.category].label}
                          </Badge>
                        </div>
                        <h3 className="mt-4 text-xl font-bold text-foreground group-hover:text-emerald-700">
                          {landing.groupName}
                        </h3>
                        <p className="mt-2 flex-1 line-clamp-2 text-sm text-muted-foreground">{cardSummary}</p>
                        <hr className="mt-4 border-t border-border/40" />
                        <div className="flex items-center justify-between pt-3 text-muted-foreground">
                          <span className="flex items-center gap-1.5 text-sm">
                            <MapPin className="h-3.5 w-3.5" />
                            {landing.city}, {landing.country}
                          </span>
                          {renderPlatformLogo(landing.platform)}
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
