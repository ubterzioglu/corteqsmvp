import type { ReactNode } from "react";

import PremiumProfileHero from "@/components/profile/premium/PremiumProfileHero";
import PremiumProfileTabs, { PREMIUM_TAB_KEYS } from "@/components/profile/premium/PremiumProfileTabs";
import ProfileCompletionCard from "@/components/profile/premium/ProfileCompletionCard";
import ProfilePublicPreviewCard from "@/components/profile/premium/ProfilePublicPreviewCard";
import ProfileSwitcherMenu from "@/components/profile/ProfileSwitcherMenu";
import { PROFILE_TYPE_TIP } from "@/lib/profile-attribute-keys";

/**
 * Premium düzenin gövdesini oluşturan hazır kartlar. Hepsi `ProfilePage`'de
 * kurulur; bu bileşen yalnız yerleşimi bilir.
 *
 * ⚠️ Tek nesne olarak geçilir, tek tek prop'a bölünmez (A06b'de ölçülen tuzak:
 * bölünce imza her yeni bölümde değişir ve prop sayısı patlar).
 */
export type ProfilePremiumSections = {
  /** Gizli `<input type="file">` öğeleri — düzenin en üstünde kalmalıdır. */
  hiddenFileInputs: ReactNode;
  /** M08: hızlı eylemler — hero'nun altında, sekmelerden BAĞIMSIZ görünür. */
  quickActionsCard?: ReactNode;
  profileFieldsCard: ReactNode;
  interestsCard: ReactNode;
  badgesCard: ReactNode;
  caddeCards: ReactNode;
  socialMediaCard: ReactNode;
  linkCardsGrid: ReactNode;
  documentsGrid: ReactNode;
  roleSpecificCard: ReactNode;
  accessCard: ReactNode;
  helpCard: ReactNode;
  contributorResourcesCard: ReactNode;
};

/** Üst karttaki kimlik/özet alanları. */
export type ProfilePremiumHero = {
  displayName: string;
  initials: string;
  avatarUrl: string | null;
  roleLabel: string;
  eyebrow: string;
  email: string | null;
  locationLabel: string | null;
  shortBio: string | null;
  completionPercentage: number;
  /** Profil kısmi veriyle yüklendiyse kullanıcıya uyarı gösterilir. */
  hasPartialData: boolean;
  publicProfileSlug: string | null;
};

/** Avatar yükleme/kaldırma durumu ve eylemleri. */
export type ProfilePremiumAvatar = {
  uploading: boolean;
  removing: boolean;
  onChangePhoto: () => void;
  onRemovePhoto: () => void;
};

/** Sağ sütundaki tamamlanma kartının beslediği değerler. */
export type ProfilePremiumCompletion = {
  requiredTotal: number;
  requiredCompleted: number;
  percentage: number;
  highlights: React.ComponentProps<typeof ProfileCompletionCard>["highlights"];
};

export interface ProfilePremiumLayoutProps {
  sections: ProfilePremiumSections;
  hero: ProfilePremiumHero;
  avatar: ProfilePremiumAvatar;
  completion: ProfilePremiumCompletion;
  publicPreview: { slug: string | null; isLoading: boolean };
  activeTab: string;
  onActiveTabChange: (tab: string) => void;
  onShowHelp: () => void;
  onSignOut: () => void;
}

/**
 * Premium profil düzeni: kimlik kartı + "Bireysel Panelim" sekmeli gövde.
 *
 * ⚠️ Bu düzen bir "pilot" DEĞİLDİR (dosyadaki eski yorum öyle diyordu):
 * `resolveProfilePresentation` tüm `User_*` rollerini bireysel → premium
 * sunuma çözer, tek istisna `Admin_SuperAdmin`. Yani üyelerin neredeyse
 * tamamının gördüğü **ana yol** budur; yan panelli düzen azınlıktır.
 * Ölçüm: `docs/kalanlar/2026-09-27-A07a-profilepage-guvenlik-agi.md`.
 *
 * Tüm handler'lar ve veri sözleşmeleri yan panelli düzenle birebir aynıdır —
 * değişen yalnız sunumdur.
 */
export default function ProfilePremiumLayout({
  sections,
  hero,
  avatar,
  completion,
  publicPreview,
  activeTab,
  onActiveTabChange,
  onShowHelp,
  onSignOut,
}: ProfilePremiumLayoutProps) {
  // 8/4 kolonlu düzenleme içeriği "Profil Ayarları" sekmesinin gövdesidir.
  const settingsContent = (
    <div className="space-y-4">
      <div className="grid gap-6 lg:grid-cols-12">
        <div className="flex min-w-0 flex-col gap-4 lg:col-span-8">
          {sections.profileFieldsCard}
          {sections.interestsCard}
          {sections.badgesCard}
          {sections.caddeCards}
          {sections.socialMediaCard}
          {sections.linkCardsGrid}
          {sections.documentsGrid}
          {sections.roleSpecificCard}
        </div>
        <aside className="flex flex-col gap-4 lg:col-span-4 lg:sticky lg:top-24 lg:self-start">
          <ProfileCompletionCard
            requiredTotal={completion.requiredTotal}
            requiredCompleted={completion.requiredCompleted}
            percentage={completion.percentage}
            highlights={completion.highlights}
          />
          <ProfilePublicPreviewCard slug={publicPreview.slug} isLoading={publicPreview.isLoading} />
        </aside>
      </div>
      {sections.accessCard}
      {sections.helpCard}
    </div>
  );

  return (
    <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-10 pb-16">
      {sections.hiddenFileInputs}
      <PremiumProfileHero
        displayName={hero.displayName}
        initials={hero.initials}
        avatarUrl={hero.avatarUrl}
        roleLabel={hero.roleLabel}
        roleTip={PROFILE_TYPE_TIP}
        eyebrow={hero.eyebrow}
        email={hero.email}
        locationLabel={hero.locationLabel}
        shortBio={hero.shortBio}
        completionPercentage={hero.completionPercentage}
        hasPartialData={hero.hasPartialData}
        publicProfileSlug={hero.publicProfileSlug}
        switcherSlot={
          <ProfileSwitcherMenu
            currentItemId={null}
            triggerClassName="h-8 w-full justify-start rounded-lg text-xs font-medium"
          />
        }
        avatarUploading={avatar.uploading}
        avatarRemoving={avatar.removing}
        onChangePhoto={avatar.onChangePhoto}
        onRemovePhoto={avatar.onRemovePhoto}
        onShowSettings={() => onActiveTabChange(PREMIUM_TAB_KEYS.settings)}
        onShowNotifications={() => onActiveTabChange(PREMIUM_TAB_KEYS.notifications)}
        onShowHelp={onShowHelp}
        onSignOut={onSignOut}
      />
      {sections.quickActionsCard ?? null}
      {sections.contributorResourcesCard}
      <PremiumProfileTabs
        settingsContent={settingsContent}
        activeTab={activeTab}
        onActiveTabChange={onActiveTabChange}
      />
    </div>
  );
}
