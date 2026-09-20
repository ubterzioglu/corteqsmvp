import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Navigate, useLocation, useNavigate, useParams } from "react-router-dom";
import {
  CalendarDays,
  Award,
  BookOpen,
  Briefcase,
  FileText,
  Globe2,
  HelpCircle,
  Home,
  ImagePlus,
  KeyRound,
  Linkedin,
  Link2,
  MapPin,
  Plane,
  Share2,
  Sparkles,
  Store,
  Trash2,
  User,
  UserCheck,
  Users,
} from "lucide-react";

import { useAuth } from "@/components/auth/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useCurrentUserProfile } from "@/hooks/useCurrentUserProfile";
import { useCurrentUserDashboard } from "@/hooks/useCurrentUserDashboard";
import { useMemberCatalogSlug } from "@/hooks/useMemberCatalogSlug";
import { useProfileAttributeForm } from "@/hooks/profile/useProfileAttributeForm";
import { useProfileAvatar } from "@/hooks/profile/useProfileAvatar";
import { useProfileDocuments } from "@/hooks/profile/useProfileDocuments";
import { useProfileRoleRequests } from "@/hooks/profile/useProfileRoleRequests";
import { GENERIC_FEATURE_KEYS, INDIVIDUAL_FEATURE_KEYS } from "@/lib/features";
import { PHONE_ATTRIBUTE_KEY } from "@/lib/profile-phone";
import { getMyReferralCodeUsage, type MyReferralCodeUsage } from "@/lib/member-profile-api";
import { getAttributeStringValue, type ProfileAttributeState } from "@/lib/member-profile";
import { formatDocumentMeta, readBooleanAttributeValue } from "@/lib/profile-attribute-drafts";
import {
  CV_DOCUMENT_ATTRIBUTE_KEY,
  HIDDEN_ROLE_SPECIFIC_ATTRIBUTE_KEYS,
  JOB_SEEKING_OPT_IN_ATTRIBUTE_KEY,
  LINKEDIN_ATTRIBUTE_KEY,
  MOVING_SOON_OPT_IN_ATTRIBUTE_KEY,
  PRESENTATION_DOCUMENT_ATTRIBUTE_KEY,
  PROFILE_PHOTO_ATTRIBUTE_KEY,
  PROFILE_TYPE_TIP,
  SPECIAL_PROFILE_ATTRIBUTE_KEYS,
  VOLUNTEER_MENTORSHIP_OPT_IN_ATTRIBUTE_KEY,
  WEBSITE_ATTRIBUTE_KEY,
} from "@/lib/profile-attribute-keys";
import { SOCIAL_ATTRIBUTE_CONFIGS, SOCIAL_ATTRIBUTE_KEYS } from "@/lib/profile-social-links";
import { parseProfileDocumentRecord } from "@/lib/profile-documents";
import {
  isPremiumPresentation,
  resolveProfilePresentation,
} from "@/lib/profile-presentation";
import { getRoleMeta, getUiProfileType, isProfileType } from "@/lib/profile-types";
import { supabase } from "@/integrations/supabase/client";
import PremiumProfileHero from "@/components/profile/premium/PremiumProfileHero";
import ProfileSwitcherMenu from "@/components/profile/ProfileSwitcherMenu";
import PremiumProfileTabs, { PREMIUM_TAB_KEYS } from "@/components/profile/premium/PremiumProfileTabs";
import MyEventsPanel from "@/components/events/MyEventsPanel";
import ProfileCompletionCard from "@/components/profile/premium/ProfileCompletionCard";
import ProfilePublicPreviewCard from "@/components/profile/premium/ProfilePublicPreviewCard";
import { ProfileAccessCard } from "@/components/profile/ProfileAccessCard";
import { ProfileDocumentCard } from "@/components/profile/ProfileDocumentCard";
import { ProfileFieldsCard } from "@/components/profile/ProfileFieldsCard";
import { ProfileHelpCard } from "@/components/profile/ProfileHelpCard";
import { ProfileLegacyHeroCard } from "@/components/profile/ProfileLegacyHeroCard";
import { ProfileLegacySummaryCard } from "@/components/profile/ProfileLegacySummaryCard";
import { ProfileRoleSpecificCard } from "@/components/profile/ProfileRoleSpecificCard";
import { ProfileSocialMediaCard } from "@/components/profile/ProfileSocialMediaCard";
import { PreferenceToggleCard } from "@/components/profile/PreferenceToggleCard";
import { StandaloneLinkAttributeCard } from "@/components/profile/StandaloneLinkAttributeCard";
import { PROFILE_GUIDE_SECTIONS } from "@/components/profile/profile-guide-sections";
import {
  AMBER_ACTION_BUTTON,
  AMBER_BUTTON_OUTLINE,
  AMBER_BUTTON_PRIMARY,
  GOOGLE_SOFT_ACTION_PANEL,
  GOOGLE_SOFT_CARD_BLUE_SECTION,
  GOOGLE_SOFT_CARD_GREEN_SECTION,
  GOOGLE_SOFT_CARD_RED_SECTION,
  GOOGLE_SOFT_CARD_SUBTLE,
  GOOGLE_SOFT_CARD_YELLOW_SECTION,
  GOOGLE_SOFT_SUCCESS_PANEL,
  GOOGLE_SOFT_WARNING_PANEL,
} from "@/components/profile/profile-card-styles";
import CaddeInterestsCard from "@/components/cadde/CaddeInterestsCard";
import CaddeMyContentCard from "@/components/cadde/CaddeMyContentCard";
import CaddeTanitimPanel from "@/components/cadde/CaddeTanitimPanel";
import ProfileSidebarLayout from "@/components/profile/ProfileSidebarLayout";
import type { SidebarMenuItem } from "@/components/profile/ProfileSidebarLayout";
import { trUpper } from "@/lib/text-normalization";

const ProfilePage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { type } = useParams<{ type: string }>();
  const location = useLocation();
  const { isLoading, errorMessage, profile, refreshProfile } = useCurrentUserProfile(true);
  const { items: dashboardItems, isLoading: isDashboardLoading } = useCurrentUserDashboard(true);

  // Referral kilit durumu — kullanım kaydı varsa alan salt-okunur gösterilir (B12).
  const [myReferralUsage, setMyReferralUsage] = useState<MyReferralCodeUsage | null>(null);

  useEffect(() => {
    let cancelled = false;
    getMyReferralCodeUsage()
      .then((usage) => {
        if (!cancelled) setMyReferralUsage(usage);
      })
      .catch(() => {
        // Kilit bilgisi ikincil: okunamazsa alan düzenlenebilir kalır, SQL backstop korur.
      });
    return () => {
      cancelled = true;
    };
  }, [profile]);

  // F14: hash'li derin bağlantı (ör. Cadde CTA'sından "/profile#cadde-tanitim").
  // SPA'da tarayıcı bu çapaya kendiliğinden kaydırmaz — hedef kart profil verisi
  // geldikten SONRA mount olduğu için eleman görünene kadar birkaç frame denenir.
  useEffect(() => {
    if (!location.hash || isLoading) return;
    const targetId = location.hash.slice(1);
    let attempts = 0;
    let frame = requestAnimationFrame(function tryScroll() {
      const target = document.getElementById(targetId);
      if (target) {
        if (typeof target.scrollIntoView === "function") {
          target.scrollIntoView({ behavior: "smooth", block: "start" });
        }
        return;
      }
      if (attempts++ < 20) frame = requestAnimationFrame(tryScroll);
    });
    return () => cancelAnimationFrame(frame);
  }, [location.hash, isLoading]);

  const [isProfileSummaryOpen, setIsProfileSummaryOpen] = useState(false);
  const [isAccessCardOpen, setIsAccessCardOpen] = useState(false);
  const [isHelpCardOpen, setIsHelpCardOpen] = useState(false);
  // Premium pilot dashboard active tab — lifted here so the owner hero buttons
  // (Profil Ayarları / Bildirimler) can drive the tab bar below.
  const [premiumActiveTab, setPremiumActiveTab] = useState<string>(PREMIUM_TAB_KEYS.settings);
  const helpCardRef = useRef<HTMLDivElement | null>(null);
  const avatarInputRef = useRef<HTMLInputElement | null>(null);
  const cvInputRef = useRef<HTMLInputElement | null>(null);
  const presentationInputRef = useRef<HTMLInputElement | null>(null);

  const roleMeta = useMemo(
    () => getRoleMeta(getUiProfileType(profile?.profileType ?? type)),
    [profile?.profileType, type],
  );

  // Pilot izolasyonu: premium layout yalnızca flat rol anahtarından çözülür
  // (UI kategorisi değil). Tanımsız roller generic config alır.
  const presentation = useMemo(
    () => resolveProfilePresentation(profile?.roleKey),
    [profile?.roleKey],
  );
  const isPremiumPilot = isPremiumPresentation(presentation);
  const { slug: memberCatalogSlug, isLoading: isMemberSlugLoading } = useMemberCatalogSlug(
    isPremiumPilot && Boolean(profile),
  );

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
  // WS1 madde 1: telefon kuralı role_attributes'ta yoksa alan hiç çizilmez (RPC döndürmez).
  const phoneAttribute = attributeMap.get(PHONE_ATTRIBUTE_KEY) ?? null;

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
  const initials =
    trUpper(
      displayName
        .split(/\s+/)
        .map((part) => part[0])
        .filter(Boolean)
        .slice(0, 2)
        .join("")
    ) || "CQ";
  const pendingCount = profile?.pendingRequests.length ?? 0;
  const profileTypeLabel = profile?.roleLabel ?? roleMeta?.adminLabel ?? "Bireysel";

  const form = useProfileAttributeForm({
    profile,
    groupedAttributes,
    phoneAttribute,
    myReferralUsage,
    isIndividualProfile,
    userId: user?.id,
    refreshProfile,
  });

  const {
    avatarUploading,
    avatarRemoving,
    handleAvatarFileChange,
    handleRemoveAvatar,
  } = useProfileAvatar({ userId: user?.id, currentAvatarUrl, refreshProfile });

  const {
    uploadingDocumentKey,
    removingDocumentKey,
    openingDocumentKey,
    handleCvFileChange,
    handlePresentationFileChange,
    handleOpenDocument,
    handleRemoveDocument,
  } = useProfileDocuments({ userId: user?.id, cvDocument, presentationDocument, refreshProfile });

  const roleRequests = useProfileRoleRequests({
    isAccessCardOpen,
    currentRoleKey: profile?.roleKey,
    refreshProfile,
  });

  const completionHighlights = [
    ...(phoneAttribute ? [{ key: PHONE_ATTRIBUTE_KEY, label: "Telefon" }] : []),
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
      info: "Açıkken herkese açık profilinde ve Cadde'de \"İş Arıyorum\" rozeti görünür; işverenler ve topluluk seni bu rozetle bulur. İstediğin zaman kapatabilirsin.",
      icon: Briefcase,
      toneClassName: GOOGLE_SOFT_CARD_SUBTLE,
    },
    {
      key: MOVING_SOON_OPT_IN_ATTRIBUTE_KEY,
      enabled: movingSoonFeatureEnabled,
      checked: readBooleanAttributeValue(movingSoonOptInAttribute),
      title: "Yakında Taşınacağım",
      description: "Profilinde yakında taşınacağını belirten rozet görünür.",
      info: "Yeni bir şehre ya da ülkeye taşınmayı planladığını gösterir. Taşınma araçları ve hedef şehirdeki üyeler için eşleştirme sinyalidir.",
      icon: Plane,
      toneClassName: GOOGLE_SOFT_WARNING_PANEL,
    },
    {
      key: VOLUNTEER_MENTORSHIP_OPT_IN_ATTRIBUTE_KEY,
      enabled: volunteerMentorshipFeatureEnabled,
      checked: readBooleanAttributeValue(volunteerMentorshipOptInAttribute),
      title: "Gönüllü Mentörlük",
      description: "Açıldığında profilinden gönüllü mentör görünürlüğü aktif olur.",
      info: "Topluluğa gönüllü mentörlük verebileceğini duyurur; profilinde mentör rozeti görünür ve mentör arayan üyeler sana ulaşabilir.",
      icon: UserCheck,
      toneClassName: GOOGLE_SOFT_SUCCESS_PANEL,
    },
  ].filter((item) => item.enabled);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/login", { replace: true });
  };

  const scrollToHelpCard = () => {
    setIsHelpCardOpen(true);
    helpCardRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  // /profile/:type segmenti kozmetik UI kategorisidir; DB'deki flat rol anahtarı
  // (örn. User_DiasporaMember) URL'e asla yazılmaz — getUiProfileType her zaman
  // geçerli bir segment döndürdüğü için redirect döngüsü oluşamaz.
  //
  // F14: derin bağlantılar (ör. Cadde'den "/profile#cadde-tanitim") bu redirect'lerden
  // geçiyor — search+hash KORUNMAZSA çapa kaybolur ve kullanıcı sayfanın tepesine düşer.
  if (!type || !isProfileType(type)) {
    return <Navigate to={`/profile/${getUiProfileType(profile?.profileType)}${location.search}${location.hash}`} replace />;
  }

  if (isLoading) {
    return <div className="flex min-h-[70vh] items-center justify-center">Profiliniz hazırlanıyor...</div>;
  }

  const expectedUiType = profile?.profileType ? getUiProfileType(profile.profileType) : null;
  if (expectedUiType && expectedUiType !== type) {
    return <Navigate to={`/profile/${expectedUiType}${location.search}${location.hash}`} replace />;
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

  const hiddenFileInputs = (
    <>
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
    </>
  );

  const legacyHeroCard = (
    <ProfileLegacyHeroCard
      isIndividualProfile={isIndividualProfile}
      avatarUrl={currentAvatarUrl}
      displayName={displayName}
      initials={initials}
      hasPartialData={Boolean(errorMessage)}
      heroDescription={heroDescription}
      email={profile?.email ?? user?.email ?? "-"}
      profileTypeLabel={profileTypeLabel}
      locationLabel={locationLabel}
      roleSpotlight={roleSpotlight}
      roleTitle={roleMeta?.title ?? "Profilim"}
      completionPercentage={profile?.profileCompletion.percentage ?? 0}
      pendingCount={pendingCount}
      heroActionButtons={heroActionButtons}
      avatarActionButtons={avatarActionButtons}
    />
  );

  const legacySummaryCard = isIndividualProfile ? (
    <ProfileLegacySummaryCard
      open={isProfileSummaryOpen}
      onOpenToggle={() => setIsProfileSummaryOpen((current) => !current)}
      profileTypeLabel={profileTypeLabel}
      completionPercentage={profile?.profileCompletion.percentage ?? 0}
      highlights={completionHighlights}
    />
  ) : null;

  const profileFieldsCard = displayNameAttribute ? (
    <ProfileFieldsCard
      displayNameAttribute={displayNameAttribute}
      displayNameLabel={displayNameLabel}
      phoneAttribute={phoneAttribute}
      phoneError={form.phoneError}
      isPhoneSaving={form.savingAttributeKey === PHONE_ATTRIBUTE_KEY}
      isDisplayNameSaving={form.savingAttributeKey === displayNameAttribute.attributeKey}
      commonAttributes={groupedAttributes.common}
      commonAllVisible={form.commonAttributesAllVisible}
      isSavingCommonAttributes={form.savingCommonAttributes}
      draftValues={form.draftValues}
      draftVisibilities={form.draftVisibilities}
      onValueChange={form.handleDraftChange}
      onVisibilityChange={form.handleDraftVisibilityChange}
      onPhoneChange={form.handlePhoneDraftChange}
      onPhoneSave={() => void form.handleSavePhone()}
      onDisplayNameSave={() => void form.handleSaveAttribute(displayNameAttribute)}
      onCommonAllVisibleChange={form.handleCommonAllVisibleChange}
      onCommonSave={() => void form.handleSaveCommonAttributes()}
    />
  ) : null;

  const badgesCard = featureToggleCards.length ? (
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
            info={item.info}
            checked={item.checked}
            toneClassName={item.toneClassName}
            icon={item.icon}
            disabled={form.savingPreferenceKey === item.key}
            onCheckedChange={(checked) => void form.handleSavePreferenceToggle(item.key, checked)}
          />
        ))}
      </CardContent>
    </Card>
  ) : null;

  const interestsAttribute = attributeMap.get("interests") ?? null;
  const caddeCards = (
    <>
      {/* WS1 madde 5 (T19 kararı): ilgi alanları herkese açık. Kural role_attributes'ta
          (user_can_hide=false, mig 20260904200000); kural yoksa da varsayılan "gizlenemez". */}
      <CaddeInterestsCard
        onSaved={() => void refreshProfile()}
        visibility={interestsAttribute?.visibility ?? "public"}
        canHide={interestsAttribute?.userCanHide ?? false}
      />
      <CaddeMyContentCard />
      <CaddeTanitimPanel />
    </>
  );

  const socialMediaCard = (
    <ProfileSocialMediaCard
      attributes={groupedAttributes.socialMedia}
      draftValues={form.draftValues}
      allVisible={form.socialMediaAllVisible}
      isSaving={form.savingSocialMedia}
      onValueChange={form.handleDraftChange}
      onAllVisibleChange={form.handleSocialAllVisibleChange}
      onSave={() => void form.handleSaveSocialMedia()}
    />
  );

  const linkCardsGrid = (
    <div className="grid gap-4 md:grid-cols-2">
      {linkedinCardEnabled && linkedinAttribute ? (
        <StandaloneLinkAttributeCard
          attribute={linkedinAttribute}
          cardClassName={GOOGLE_SOFT_CARD_BLUE_SECTION}
          title="LinkedIn"
          description="Opsiyonel — ama şiddetle tavsiye ederiz: LinkedIn profilin, eşleştirme ve ağ önerilerinin en güçlü kaynağı."
          recommended
          icon={Linkedin}
          iconClassName="text-sky-700"
          draftValue={form.draftValues[linkedinAttribute.attributeKey]}
          draftVisibility={form.draftVisibilities[linkedinAttribute.attributeKey] ?? linkedinAttribute.visibility}
          isSaving={form.savingAttributeKey === linkedinAttribute.attributeKey}
          onValueChange={(nextValue) => form.handleDraftChange(linkedinAttribute.attributeKey, nextValue)}
          onVisibilityChange={(nextVisibility) =>
            form.handleDraftVisibilityChange(linkedinAttribute.attributeKey, nextVisibility)
          }
          onSave={() => void form.handleSaveLinkCard(linkedinAttribute)}
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
          draftValue={form.draftValues[websiteAttribute.attributeKey]}
          draftVisibility={form.draftVisibilities[websiteAttribute.attributeKey] ?? websiteAttribute.visibility}
          isSaving={form.savingAttributeKey === websiteAttribute.attributeKey}
          onValueChange={(nextValue) => form.handleDraftChange(websiteAttribute.attributeKey, nextValue)}
          onVisibilityChange={(nextVisibility) =>
            form.handleDraftVisibilityChange(websiteAttribute.attributeKey, nextVisibility)
          }
          onSave={() => void form.handleSaveLinkCard(websiteAttribute)}
        />
      ) : null}
    </div>
  );

  const documentsGrid = (
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
  );

  const roleSpecificCard = (
    <ProfileRoleSpecificCard
      attributes={groupedAttributes.roleSpecific}
      draftValues={form.draftValues}
      draftVisibilities={form.draftVisibilities}
      displayNameLabel={displayNameLabel}
      isSaving={form.savingRoleSpecificAttributes}
      referralUsage={myReferralUsage}
      onValueChange={form.handleDraftChange}
      onVisibilityChange={form.handleDraftVisibilityChange}
      onSave={() => void form.handleSaveRoleSpecificAttributes()}
    />
  );

  const contributorResourcesCard = profile?.roleKey === "User_Contributor" ? (
    <Card className={`overflow-hidden ${GOOGLE_SOFT_CARD_GREEN_SECTION}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <MapPin className="h-5 w-5 text-emerald-600" />
          Contributor Kaynakları
        </CardTitle>
        <CardDescription>
          Şehrinde kontrol ettiğin işletme, topluluk, etkinlik ve hizmetleri incelemeye gönder.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <a
          href="/contributor/resources"
          className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Şehrinden kaynak öner
        </a>
      </CardContent>
    </Card>
  ) : null;

  const accessCard = (
    <ProfileAccessCard
      open={isAccessCardOpen}
      onOpenToggle={() => setIsAccessCardOpen((current) => !current)}
      roleRequestTarget={roleRequests.roleRequestTarget}
      onRoleRequestTargetChange={roleRequests.setRoleRequestTarget}
      roleRequestNote={roleRequests.roleRequestNote}
      onRoleRequestNoteChange={roleRequests.setRoleRequestNote}
      availableRoleTargets={roleRequests.availableRoleTargets}
      flatRolesLoading={roleRequests.flatRolesLoading}
      submittingRoleRequest={roleRequests.submittingRoleRequest}
      onSubmitRoleRequest={() => void roleRequests.handleSubmitRoleRequest()}
      featureMap={featureMap}
      pendingRequests={profile?.pendingRequests ?? []}
      featureRequestingKey={roleRequests.featureRequestingKey}
      onRequestFeature={(featureKey) => void roleRequests.handleRequestFeature(featureKey)}
      isDashboardLoading={isDashboardLoading}
      dashboardItems={dashboardItems}
    />
  );

  const helpCard = (
    <ProfileHelpCard
      ref={helpCardRef}
      open={isHelpCardOpen}
      onOpenToggle={() => setIsHelpCardOpen((current) => !current)}
      sections={PROFILE_GUIDE_SECTIONS}
    />
  );

  if (isPremiumPilot) {
    // Experimental_2 premium pilot: owner hero + altında "Bireysel Panelim"
    // sekmeli düzen (proref). İlk kart (hero) değişmedi; bugünkü 8/4 kolonlu
    // düzenleme içeriği "Profil Ayarları" sekmesine taşındı. Tüm handler'lar ve
    // veri sözleşmeleri generic layout ile birebir aynı (sadece sunum değişti).
    const premiumSettingsContent = (
      <div className="space-y-4">
        <div className="grid gap-6 lg:grid-cols-12">
          <div className="flex min-w-0 flex-col gap-4 lg:col-span-8">
            {profileFieldsCard}
            {badgesCard}
            {caddeCards}
            {socialMediaCard}
            {linkCardsGrid}
            {documentsGrid}
            {roleSpecificCard}
          </div>
          <aside className="flex flex-col gap-4 lg:col-span-4 lg:sticky lg:top-24 lg:self-start">
            <ProfileCompletionCard
              requiredTotal={profile?.profileCompletion.requiredTotal ?? 0}
              requiredCompleted={profile?.profileCompletion.requiredCompleted ?? 0}
              percentage={profile?.profileCompletion.percentage ?? 0}
              highlights={completionHighlights}
            />
            <ProfilePublicPreviewCard slug={memberCatalogSlug} isLoading={isMemberSlugLoading} />
          </aside>
        </div>
        {accessCard}
        {helpCard}
      </div>
    );

    return (
      <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-10 pb-16">
        {hiddenFileInputs}
        <PremiumProfileHero
          displayName={displayName}
          initials={initials}
          avatarUrl={currentAvatarUrl || null}
          roleLabel={profileTypeLabel}
          roleTip={PROFILE_TYPE_TIP}
          eyebrow={presentation.eyebrow}
          email={profile?.email ?? user?.email ?? null}
          locationLabel={locationLabel || null}
          shortBio={shortBio || null}
          completionPercentage={profile?.profileCompletion.percentage ?? 0}
          hasPartialData={Boolean(errorMessage)}
          publicProfileSlug={memberCatalogSlug}
          switcherSlot={
            <ProfileSwitcherMenu
              currentItemId={null}
              triggerClassName="h-8 w-full justify-start rounded-lg text-xs font-medium"
            />
          }
          avatarUploading={avatarUploading}
          avatarRemoving={avatarRemoving}
          onChangePhoto={() => avatarInputRef.current?.click()}
          onRemovePhoto={() => void handleRemoveAvatar()}
          onShowSettings={() => setPremiumActiveTab(PREMIUM_TAB_KEYS.settings)}
          onShowNotifications={() => setPremiumActiveTab(PREMIUM_TAB_KEYS.notifications)}
          onShowHelp={scrollToHelpCard}
          onSignOut={() => void handleSignOut()}
        />
        {contributorResourcesCard}
        <PremiumProfileTabs
          settingsContent={premiumSettingsContent}
          activeTab={premiumActiveTab}
          onActiveTabChange={setPremiumActiveTab}
        />
      </div>
    );
  }

  const sidebarMenuItems: SidebarMenuItem[] = [
    {
      id: "overview",
      label: "Profil Özeti",
      icon: <Home className="h-4 w-4" />,
      content: (
        <div className="space-y-4">
          {legacyHeroCard}
          {legacySummaryCard}
        </div>
      ),
    },
    {
      id: "fields",
      label: "Profil Bilgileri",
      icon: <User className="h-4 w-4" />,
      content: profileFieldsCard,
    },
    ...(badgesCard
      ? [
          {
            id: "badges",
            label: "Rozetler",
            icon: <Award className="h-4 w-4" />,
            content: badgesCard,
          } as SidebarMenuItem,
        ]
      : []),
    {
      id: "cadde",
      label: "Çarşı & İlgi Alanları",
      icon: <Store className="h-4 w-4" />,
      content: caddeCards,
    },
    {
      // Premium pilot dışındaki üyeler premium sekme çubuğunu HİÇ görmez
      // (o düzen yalnız `isPremiumPilot` için çizilir). Etkinliklerim yalnız
      // oraya eklenseydi üyelerin ezici çoğunluğu kendi etkinliğini yine
      // göremezdi — bu yüzden iki düzende de var.
      id: "events",
      label: "Etkinliklerim",
      icon: <CalendarDays className="h-4 w-4" />,
      content: <MyEventsPanel />,
    },
    {
      id: "social",
      label: "Sosyal Medya",
      icon: <Share2 className="h-4 w-4" />,
      content: socialMediaCard,
    },
    {
      id: "links",
      label: "Bağlantılar",
      icon: <Link2 className="h-4 w-4" />,
      content: linkCardsGrid,
    },
    {
      id: "documents",
      label: "Belgeler",
      icon: <BookOpen className="h-4 w-4" />,
      content: documentsGrid,
    },
    {
      id: "role",
      label: "Rol Detayları",
      icon: <Briefcase className="h-4 w-4" />,
      content: roleSpecificCard,
    },
    {
      id: "access",
      label: "Erişim & Talepler",
      icon: <KeyRound className="h-4 w-4" />,
      content: accessCard,
    },
    ...(contributorResourcesCard
      ? [
          {
            id: "contributor",
            label: "Contributor Kaynakları",
            icon: <Users className="h-4 w-4" />,
            content: contributorResourcesCard,
          } as SidebarMenuItem,
        ]
      : []),
    {
      id: "help",
      label: "Yardım",
      icon: <HelpCircle className="h-4 w-4" />,
      content: helpCard,
    },
  ];

  return (
    <div className="relative">
      {hiddenFileInputs}
      <ProfileSidebarLayout
        menuItems={sidebarMenuItems}
        defaultActiveId="overview"
      />
    </div>
  );
};

export default ProfilePage;
