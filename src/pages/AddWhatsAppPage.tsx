import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";

import { trIncludes } from "@/lib/text-normalization";
import { useAuth } from "@/components/auth/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { AddCommunityFormSection } from "@/components/whatsapp/AddCommunityFormSection";
import { AddCommunityHero } from "@/components/whatsapp/AddCommunityHero";
import { CommunityFilters } from "@/components/whatsapp/CommunityFilters";
import { LandingCard } from "@/components/whatsapp/LandingCard";
import { LandingDetailView } from "@/components/whatsapp/LandingDetailView";
import {
  buildAdminContact,
  buildSubmitterDescription,
  getErrorMessage,
  initialGroupForm,
  initialJoinForm,
  type GroupFormState,
  type JoinFormState,
} from "@/lib/whatsapp-landing-form";
import { placeholderLandings } from "@/lib/whatsapp-landing-placeholders";
import { waPlaceholderImage } from "@/lib/whatsapp-landing-presentation";
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
  type LandingLanguage,
  type LandingOrigin,
  type WhatsAppLanding,
} from "@/lib/whatsapp-landings";

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
  const [filterCategory, setFilterCategory] = useState<LandingCategory | "">("");
  const [filterCity, setFilterCity] = useState("");
  const [filterApproval, setFilterApproval] = useState<"member" | "admin" | "">("");
  const [filterOrigin, setFilterOrigin] = useState<LandingOrigin | "">("");
  const [filterLanguage, setFilterLanguage] = useState<LandingLanguage | "">("");
  const [joinDialogOpen, setJoinDialogOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [groupFormOpen, setGroupFormOpen] = useState(false);
  const [oauthSubmitting, setOauthSubmitting] = useState(false);
  const [submittingGroup, setSubmittingGroup] = useState(false);
  const [submittingJoin, setSubmittingJoin] = useState(false);
  const [canEditSelectedLanding, setCanEditSelectedLanding] = useState(false);
  const [groupForm, setGroupForm] = useState<GroupFormState>(initialGroupForm);
  const [joinForm, setJoinForm] = useState<JoinFormState>(initialJoinForm);
  const [heroImageFile, setHeroImageFile] = useState<File | null>(null);

  useEffect(() => {
    document.dispatchEvent(new Event("render-complete"));
  }, []);

  useEffect(() => {
    const shouldOpenGroupForm = searchParams.get("openGroupForm") === "1";
    if (!user || !shouldOpenGroupForm) return;

    setGroupFormOpen(true);
    setOauthSubmitting(false);

    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete("openGroupForm");
    nextParams.delete("group");
    setSearchParams(nextParams, { replace: true });
  }, [searchParams, setSearchParams, user]);

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
    const mergedLandings = landings.length >= 6 ? landings : [...landings, ...placeholderLandings.slice(0, 6 - landings.length)];

    return mergedLandings.filter((landing) => {
      if (searchQuery.trim()) {
        const haystack = [
          landing.groupName,
          landing.tagline,
          landing.country,
          landing.city,
          landing.description,
        ]
          .filter(Boolean)
          .join(" ");

        if (!trIncludes(haystack, searchQuery)) return false;
      }

      if (filterCategory && landing.category !== filterCategory) return false;
      if (filterCity && landing.city !== filterCity) return false;
      if (filterApproval === "admin" && !landing.adminApproved) return false;
      if (filterApproval === "member" && !landing.memberApproved) return false;
      if (filterOrigin && landing.origin !== filterOrigin) return false;
      if (filterLanguage && landing.language !== filterLanguage) return false;

      return true;
    });
  }, [landings, searchQuery, filterCategory, filterCity, filterApproval, filterOrigin, filterLanguage]);

  const uniqueCities = useMemo(() => [...new Set(landings.map((l) => l.city).filter(Boolean))].sort(), [landings]);

  const updateGroupForm = <K extends keyof GroupFormState>(field: K, value: GroupFormState[K]) => {
    setGroupForm((current) => ({ ...current, [field]: value }));
  };

  const updateJoinForm = <K extends keyof JoinFormState>(field: K, value: JoinFormState[K]) => {
    setJoinForm((current) => ({ ...current, [field]: value }));
  };

  const resetGroupForm = () => {
    setGroupForm(initialGroupForm);
    setHeroImageFile(null);
  };

  const startGoogleAuthForGroupForm = async () => {
    if (user) {
      setGroupFormOpen(true);
      return true;
    }

    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete("group");
    nextParams.set("openGroupForm", "1");
    const nextQuery = nextParams.toString();
    const nextPath = nextQuery ? `${location.pathname}?${nextQuery}` : location.pathname;

    setOauthSubmitting(true);

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: new URL(nextPath, window.location.origin).toString(),
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

  const ensureSignedInForGroupSubmit = async () => {
    if (user) return true;

    toast({
      title: "Google girişi gerekli",
      description: "Topluluk formunu göndermek için önce Google hesabınla giriş yapmalısın.",
    });
    return false;
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

    if (!(await ensureSignedInForGroupSubmit())) return;

    setSubmittingGroup(true);
    try {
      let heroImageUrl: string | undefined;
      if (groupForm.submitterRole === "manager" && heroImageFile) {
        heroImageUrl = await uploadWhatsAppLandingHeroImage(heroImageFile);
      }

      const adminContact = buildAdminContact(groupForm);
      const description = buildLandingDescription({
        description: buildSubmitterDescription(groupForm),
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
        memberCount: groupForm.memberCount ? parseInt(groupForm.memberCount, 10) : undefined,
        language: groupForm.language || undefined,
        origin: groupForm.origin || undefined,
      });

      toast({
        title: "Başvurun alındı",
        description: groupForm.submitterRole === "manager"
          ? "Landing sayfan admin onayından sonra /addcom altında görünecek."
          : "Grubun onay sonrası listede yayınlanacak.",
      });

      resetGroupForm();
      setGroupFormOpen(false);
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

  if (groupSlug) {
    return (
      <LandingDetailView
        loading={loadingLanding}
        landing={selectedLanding}
        canEdit={canEditSelectedLanding}
        copied={copied}
        onBackToList={backToList}
        onShare={() => void handleShare()}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#fffdfa_0%,#f9fafb_100%)]">
      <main className="container mx-auto px-4 pb-16 pt-6">
        <AddCommunityHero />

        <AddCommunityFormSection
          isSignedIn={Boolean(user)}
          open={groupFormOpen}
          onOpenChange={setGroupFormOpen}
          form={groupForm}
          onFieldChange={updateGroupForm}
          heroImageFile={heroImageFile}
          onHeroImageFileChange={setHeroImageFile}
          oauthSubmitting={oauthSubmitting}
          submitting={submittingGroup}
          onStartGoogleAuth={() => void startGoogleAuthForGroupForm()}
          onSubmit={() => void handleGroupSubmit()}
        />

        <section className="mt-8">
          <CommunityFilters
            searchQuery={searchQuery}
            onSearchQueryChange={setSearchQuery}
            cities={uniqueCities}
            category={filterCategory}
            onCategoryChange={setFilterCategory}
            city={filterCity}
            onCityChange={setFilterCity}
            approval={filterApproval}
            onApprovalChange={setFilterApproval}
            origin={filterOrigin}
            onOriginChange={setFilterOrigin}
            language={filterLanguage}
            onLanguageChange={setFilterLanguage}
          />

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
                {filteredLandings.map((landing) => (
                  <LandingCard key={landing.id} landing={landing} />
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
