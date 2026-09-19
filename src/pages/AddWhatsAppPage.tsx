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
  buildSubmitterDescription,
  getErrorMessage,
  initialGroupForm,
  initialJoinForm,
  type GroupFormState,
  type JoinFormState,
} from "@/lib/whatsapp-landing-form";
import { placeholderLandings } from "@/lib/whatsapp-landing-placeholders";
import {
  buildLandingDescription,
  canCurrentUserEditLanding,
  createJoinRequest,
  getEditableLandingForCurrentUser,
  getLanding,
  listLandings,
  submitLanding,
  type LandingCategory,
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
  const [filterApproval, setFilterApproval] = useState<"admin" | "">("");
  const [joinDialogOpen, setJoinDialogOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [groupFormOpen, setGroupFormOpen] = useState(false);
  const [oauthSubmitting, setOauthSubmitting] = useState(false);
  const [submittingGroup, setSubmittingGroup] = useState(false);
  const [submittingJoin, setSubmittingJoin] = useState(false);
  const [canEditSelectedLanding, setCanEditSelectedLanding] = useState(false);
  const [groupForm, setGroupForm] = useState<GroupFormState>(initialGroupForm);
  const [joinForm, setJoinForm] = useState<JoinFormState>(initialJoinForm);

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

      return true;
    });
  }, [landings, searchQuery, filterCategory, filterCity, filterApproval]);

  const uniqueCities = useMemo(() => [...new Set(landings.map((l) => l.city).filter(Boolean))].sort(), [landings]);

  const updateGroupForm = <K extends keyof GroupFormState>(field: K, value: GroupFormState[K]) => {
    setGroupForm((current) => ({ ...current, [field]: value }));
  };

  const updateJoinForm = <K extends keyof JoinFormState>(field: K, value: JoinFormState[K]) => {
    setJoinForm((current) => ({ ...current, [field]: value }));
  };

  const resetGroupForm = () => {
    setGroupForm(initialGroupForm);
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
    if (!groupForm.groupName.trim() || !groupForm.whatsappLink.trim() || !groupForm.country.trim() || !groupForm.city.trim()) {
      toast({
        title: "Eksik alan",
        description: "Grup adı, link, ülke ve şehir zorunludur.",
        variant: "destructive",
      });
      return;
    }

    if (!(await ensureSignedInForGroupSubmit())) return;

    setSubmittingGroup(true);
    try {
      const description = buildLandingDescription({
        description: buildSubmitterDescription(groupForm),
        platform: groupForm.platform,
        memberApproved: true,
        adminApproved: false,
        editorReviewPending: false,
      });

      await submitLanding({
        groupName: groupForm.groupName,
        category: "diger",
        country: groupForm.country,
        city: groupForm.city,
        mode: "text",
        whatsappLink: groupForm.whatsappLink,
        description,
      });

      toast({
        title: "Grubunuz alındı",
        description: "Admin onayından sonra listede yayınlanacak.",
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
          heroImageFile={null}
          onHeroImageFileChange={() => undefined}
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
          />

          <div className="mt-5">
            <div>
              <h2 className="text-3xl font-bold text-slate-900">WhatsApp Grupları</h2>
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
