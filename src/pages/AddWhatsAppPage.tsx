import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";

import { trIncludes } from "@/lib/text-normalization";
import { PAGE_SEO } from "@/lib/page-seo";
import { useSeo } from "@/lib/seo";
import { useAuth } from "@/components/auth/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { AddCommunityFormSection } from "@/components/whatsapp/AddCommunityFormSection";
import { AddCommunityHero } from "@/components/whatsapp/AddCommunityHero";
import { CommunityFilters } from "@/components/whatsapp/CommunityFilters";
import { GroupOwnershipClaim } from "@/components/whatsapp/GroupOwnershipClaim";
import { GroupOwnerPanel } from "@/components/whatsapp/GroupOwnerPanel";
import { LandingCard } from "@/components/whatsapp/LandingCard";
import { LandingDetailView, type LandingInviteState } from "@/components/whatsapp/LandingDetailView";
import {
  checkGroupSubmissionBanned,
  detectMotorPlatform,
  fetchGroupPreview,
  resolveMotorLocation,
  submitGroupV1,
  type GroupPreviewState,
} from "@/lib/group-submit";
import {
  getErrorMessage,
  initialGroupForm,
  initialJoinForm,
  type GroupFormState,
  type JoinFormState,
} from "@/lib/whatsapp-landing-form";
import { placeholderLandings } from "@/lib/whatsapp-landing-placeholders";
import {
  canCurrentUserEditLanding,
  createJoinRequest,
  fetchLandingInviteUrl,
  getEditableLandingForCurrentUser,
  getLanding,
  LANDING_INVITE_FAILURE_MESSAGES,
  listLandings,
  type LandingCategory,
  type WhatsAppLanding,
} from "@/lib/whatsapp-landings";

export default function AddWhatsAppPage() {
  // 449 satırlık, gerçek içerikli public sayfa 2026-09-20'ye kadar SEO yazmıyordu.
  useSeo(PAGE_SEO.addCommunity);

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
  const [filterApproval, setFilterApproval] = useState<"verified" | "">("");
  const [joinDialogOpen, setJoinDialogOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [groupFormOpen, setGroupFormOpen] = useState(false);
  const [oauthSubmitting, setOauthSubmitting] = useState(false);
  const [submittingGroup, setSubmittingGroup] = useState(false);
  const [submittingJoin, setSubmittingJoin] = useState(false);
  const [canEditSelectedLanding, setCanEditSelectedLanding] = useState(false);
  const [invite, setInvite] = useState<LandingInviteState>({ kind: "signed_out" });
  const [groupForm, setGroupForm] = useState<GroupFormState>(initialGroupForm);
  const [joinForm, setJoinForm] = useState<JoinFormState>(initialJoinForm);
  // G18: link önizleme durumu (tasarım §3.A 3-4) + G15 yasak ön kontrolü.
  const [groupPreview, setGroupPreview] = useState<GroupPreviewState>({ status: "idle" });
  const [submissionBanned, setSubmissionBanned] = useState(false);
  const previewedLinkRef = useRef("");
  const prefilledGroupNameRef = useRef("");
  // G20: sahiplik doğrulanınca detayı tazelemek için (rozet dili anında değişir).
  const [landingRefreshKey, setLandingRefreshKey] = useState(0);

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
  }, [groupSlug, user, landingRefreshKey]);

  // G03b · Davet linki artık satırla gelmiyor; yalnız girişli kullanıcıya RPC ile
  // veriliyor. Link SAYFA AÇILIRKEN çekilir, düğmeye basılınca DEĞİL — tıklamadan
  // sonra `window.open` çağırmak mobil tarayıcılarda açılır pencere engeline takılır
  // ve kullanıcı hiçbir şey olmadığını görür. Böylece düğme normal bir <a> kalır.
  useEffect(() => {
    let cancelled = false;

    if (!selectedLanding?.id) {
      setInvite({ kind: "signed_out" });
      return;
    }

    if (!user) {
      setInvite({ kind: "signed_out" });
      return;
    }

    setInvite({ kind: "loading" });
    void fetchLandingInviteUrl(selectedLanding.id).then((result) => {
      if (cancelled) return;
      setInvite(
        result.url
          ? { kind: "ready", url: result.url }
          : {
              kind: "unavailable",
              message: LANDING_INVITE_FAILURE_MESSAGES[result.failure ?? "unknown"],
            },
      );
    });

    return () => {
      cancelled = true;
    };
  }, [selectedLanding?.id, user]);

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
      // G19: sahiplik filtresi (politika §6 dili) — eski adminApproved tag'i değil.
      if (filterApproval === "verified" && landing.ownership !== "verified") return false;

      return true;
    });
  }, [landings, searchQuery, filterCategory, filterCity, filterApproval]);

  const uniqueCities = useMemo(() => [...new Set(landings.map((l) => l.city).filter(Boolean))].sort(), [landings]);

  const updateGroupForm = <K extends keyof GroupFormState>(field: K, value: GroupFormState[K]) => {
    setGroupForm((current) => ({ ...current, [field]: value }));
    // Link değişince önizleme bayatlar — sessizce eski sonuca güvenme.
    if (field === "link") setGroupPreview({ status: "idle" });
  };

  // G15: yasaklı gönderici form açılışında okunur (yardımcının kendi notu:
  // "G18 formu da bunu okuyacak"). Hata çıkarsa sessiz düşer — sunucu trigger'ı
  // INSERT'te zaten keser.
  useEffect(() => {
    let cancelled = false;

    if (!groupFormOpen || !user) {
      setSubmissionBanned(false);
      return;
    }

    void checkGroupSubmissionBanned().then((value) => {
      if (!cancelled) setSubmissionBanned(value);
    });

    return () => {
      cancelled = true;
    };
  }, [groupFormOpen, user]);

  /**
   * Link önizlemesi (onBlur): dedup + ad/görsel ön doldurma. Form bu adıma
   * ASLA takılmaz (tasarım §3.A adım 4) — hata/unknown yalnız bilgidir;
   * gönderimi bloklayan tek okuma sonucu `invalid` (kesin ölü link) ve
   * `exists` (kabul #1) — ikisi de `previewBlocksSubmit`'te.
   */
  const handleLinkPreview = async () => {
    const link = groupForm.link.trim();
    if (!link || link === previewedLinkRef.current) return;
    previewedLinkRef.current = link;

    if (!user) {
      // Önizleme girişli kullanıcı ister (edge getUser); girişsiz form zaten
      // gönderimde OAuth'a düşer. Sessiz bekle.
      setGroupPreview({ status: "idle" });
      return;
    }

    if (!detectMotorPlatform(link)) {
      setGroupPreview({ status: "unsupported" });
      return;
    }

    setGroupPreview({ status: "loading" });
    try {
      const data = await fetchGroupPreview(link);
      setGroupPreview({ status: "done", data });

      if (!data.exists && data.read_result === "ok" && data.name) {
        const readName = data.name;
        const previousPrefill = prefilledGroupNameRef.current;
        setGroupForm((current) => ({
          ...current,
          // Kullanıcının ELLE yazdığı adı ezme; yalnız boşsa veya önceki
          // önizlemeden geldiyse güncelle.
          groupName:
            current.groupName.trim() === "" || current.groupName === previousPrefill
              ? readName
              : current.groupName,
          heroImage: current.heroImage || data.image_url || "",
        }));
        prefilledGroupNameRef.current = readName;
      }

      if (data.exists) {
        toast({
          title: "Bu grup zaten listede",
          description: data.group_name
            ? `${data.group_name} — sahibiysen grup sayfasından doğrulama başlatabilirsin.`
            : "Sahibiysen grup sayfasından doğrulama başlatabilirsin.",
        });
      }
    } catch (error) {
      setGroupPreview({ status: "failed", message: getErrorMessage(error, "Önizleme alınamadı") });
    }
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

  /**
   * Girişsiz kullanıcıyı Google ile girişe yollar ve DÖNÜŞ ADRESİNİ korur.
   *
   * ⚠️ `description` ve dönüş parametreleri çağrı yerine göre DEĞİŞİR; tek bir
   * metinle iki akışı kullanmak kullanıcıyı yanlış yere götürür: grup EKLEME
   * akışı dönüşte formu açmalı (`openGroupForm=1`), grup KATILMA akışı ise
   * bulunduğu grubun sayfasında kalmalı.
   */
  const ensureSignedIn = async (intent: "submit_group" | "join_group" | "claim_group") => {
    if (user) return true;

    toast({
      title: "Üye olmalısınız",
      description:
        intent === "submit_group"
          ? "Grup eklemek için önce üye olmalısınız. Google ile giriş yapılıyor..."
          : intent === "claim_group"
            ? "Sahiplik doğrulaması için önce üye olmalısınız. Google ile giriş yapılıyor..."
            : "Davet linkini görmek için önce üye olmalısınız. Google ile giriş yapılıyor...",
    });

    const nextParams = new URLSearchParams(searchParams);
    if (intent === "submit_group") {
      nextParams.delete("group");
      nextParams.set("openGroupForm", "1");
    }
    const nextQuery = nextParams.toString();
    const nextPath = nextQuery ? `${location.pathname}?${nextQuery}` : location.pathname;

    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: new URL(nextPath, window.location.origin).toString(),
      },
    });

    return false;
  };

  const ensureSignedInForGroupSubmit = () => ensureSignedIn("submit_group");

  // G18: gönderim TEK kapıdan — `submit_group_v1` RPC (doğrudan tabloya insert
  // YOK). Dedup/kara liste/hızlı şerit/günlük sınır/Grup Sözü hepsi sunucuda;
  // istemci yalnız alan bütünlüğünü ön kontrol eder.
  const handleGroupSubmit = async () => {
    const link = groupForm.link.trim();

    if (
      !link ||
      !groupForm.groupName.trim() ||
      !groupForm.category ||
      !groupForm.shortDescription.trim() ||
      !groupForm.countryName.trim() ||
      (!groupForm.isGlobal && !groupForm.cityName.trim()) ||
      !groupForm.claimsAdmin
    ) {
      toast({
        title: "Eksik alan",
        description: "Link, grup adı, kategori, kısa açıklama, konum ve admin sorusu zorunludur.",
        variant: "destructive",
      });
      return;
    }

    if (!groupForm.pledgeAccepted) {
      toast({
        title: "Grup Sözü gerekli",
        description: "Grup Sözü onaylanmadan gönderim yapılamaz.",
        variant: "destructive",
      });
      return;
    }

    if (!detectMotorPlatform(link)) {
      toast({
        title: "Desteklenmeyen link",
        description: "Yalnızca WhatsApp, Telegram ve Discord davet linkleri kabul edilir.",
        variant: "destructive",
      });
      return;
    }

    if (!(await ensureSignedInForGroupSubmit())) return;

    setSubmittingGroup(true);
    try {
      // Konum adları kataloğa çözülür (serbest metin konum YOK — G10 şeması
      // country_code + city_id ister; geo_* tek kaynak).
      const motorLocation = await resolveMotorLocation({
        countryName: groupForm.countryName,
        cityName: groupForm.cityName,
        isGlobal: groupForm.isGlobal,
      });

      const result = await submitGroupV1({
        link,
        groupName: groupForm.groupName.trim(),
        category: groupForm.category,
        shortDescription: groupForm.shortDescription.trim(),
        countryCode: motorLocation.countryCode,
        cityId: motorLocation.cityId,
        isGlobal: groupForm.isGlobal,
        claimsAdmin: groupForm.claimsAdmin === "yes",
        pledgeAccepted: true,
        heroImage: groupForm.heroImage.trim() || null,
      });

      if (result.result === "already_listed") {
        // Kabul #1'in sunucu yakası: önizlemeyi atlayan/aşan yarış burada durur.
        toast({
          title: "Bu grup zaten listede",
          description: `${result.group_name} — sahibiysen grup sayfasından sahiplik doğrulamayı başlatabilirsin.`,
          variant: "destructive",
        });
        return;
      }

      const published = result.listing_status === "published";
      toast({
        title: published ? "Grubun yayınlandı" : "Grubun alındı",
        description: published
          ? "Hızlı şerit açık ve admin sahipliğin doğrulandı — grup doğrudan yayına çıktı."
          : "İnceleme genelde 24 saat sürer." +
            (result.ownership === "claim_pending"
              ? " Sahiplik doğrulama adımı grup sayfasında seni bekliyor."
              : ""),
      });

      resetGroupForm();
      setGroupPreview({ status: "idle" });
      previewedLinkRef.current = "";
      prefilledGroupNameRef.current = "";
      setGroupFormOpen(false);

      // Yeni kayıt dizinde hemen görünsün (liste önbelleği tazelenir).
      const rows = await listLandings();
      setLandings(rows);
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

  /** "Bu grup zaten listede" → grup sayfası (sahiplik akışının girişi G20'de). */
  const openGroupBySlug = (slug: string) => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set("group", slug);
    nextParams.delete("openGroupForm");
    setSearchParams(nextParams);
    setGroupFormOpen(false);
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
        invite={invite}
        onBackToList={backToList}
        onShare={() => void handleShare()}
        onRequestSignIn={() => void ensureSignedIn("join_group")}
        ownershipClaim={
          selectedLanding ? (
            <>
              {/* G21: sahip paneli — verified SAHİPSE çizilir (RPC kendini
                  sahiple sınırlar, is_owner:false → hiçbir şey render olmaz). */}
              <GroupOwnerPanel
                landing={selectedLanding}
                isSignedIn={Boolean(user)}
                onHidden={() => {
                  toast({
                    title: "Grup listeden kaldırıldı",
                    description:
                      "Grup anında gizlendi. 24 saat içinde moderatör kalıcı kaldırmaya çevirir.",
                  });
                  backToList();
                }}
              />
              {/* G20: sahiplik doğrulama — verified değilse çizilir. İkisi
                  ownership durumuna göre birbirini dışlar. */}
              <GroupOwnershipClaim
                landing={selectedLanding}
                isSignedIn={Boolean(user)}
                onRequestSignIn={() => void ensureSignedIn("claim_group")}
                onVerified={() => setLandingRefreshKey((key) => key + 1)}
              />
            </>
          ) : null
        }
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
          preview={groupPreview}
          onPreviewLink={() => void handleLinkPreview()}
          banned={submissionBanned}
          oauthSubmitting={oauthSubmitting}
          submitting={submittingGroup}
          onStartGoogleAuth={() => void startGoogleAuthForGroupForm()}
          onSubmit={() => void handleGroupSubmit()}
          onOpenExistingGroup={openGroupBySlug}
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
              <h2 className="text-3xl font-bold text-slate-900">Dijital Gruplar</h2>
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
