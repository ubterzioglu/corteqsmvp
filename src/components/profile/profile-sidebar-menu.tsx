import type { ReactNode } from "react";

import {
  AlertTriangle,
  Award,
  BookOpen,
  Briefcase,
  CalendarDays,
  HelpCircle,
  Home,
  KeyRound,
  Link2,
  Share2,
  Signpost,
  User,
  Users,
} from "lucide-react";

import MyEventsPanel from "@/components/events/MyEventsPanel";
import type { SidebarMenuItem } from "@/components/profile/ProfileSidebarLayout";

/**
 * Yan panel menüsünün beslendiği hazır bölümler. Hepsi `ProfilePage`'de
 * kurulur; bu modül yalnız sıralama ve koşullu ekleme kurallarını taşır.
 *
 * ⚠️ Tek nesne olarak geçilir, tek tek prop'a bölünmez — bölünürse imza
 * her yeni bölümde değişir (A06b'de ölçülen tuzak).
 */
export type ProfileSidebarSections = {
  /** M08: hızlı eylemler — ilk ekranın (overview) EN ÜSTÜNE çizilir. */
  quickActionsCard: ReactNode;
  /** M09: başlangıç ilerleme kartı — hızlı eylemlerin altında. */
  gettingStartedCard: ReactNode;
  legacyHeroCard: ReactNode;
  legacySummaryCard: ReactNode;
  personalInfoSection: ReactNode;
  /** Boş/`null` ise "Rozetler" öğesi hiç eklenmez. */
  badgesCard: ReactNode;
  caddeCards: ReactNode;
  socialMediaCard: ReactNode;
  linkCardsGrid: ReactNode;
  documentsGrid: ReactNode;
  roleSpecificCard: ReactNode;
  accessCard: ReactNode;
  /** Boş/`null` ise "Contributor Kaynakları" öğesi hiç eklenmez. */
  contributorResourcesCard: ReactNode;
  /** A4.4: Tehlikeli Bölge (hesap silme) — en altta, kırmızı uyarı. */
  dangerZoneCard: ReactNode;
  helpCard: ReactNode;
};

/**
 * Kurumsal/danışman düzenindeki yan panel menüsünü kurar.
 *
 * Öğe sırası ürün kararıdır ve `ProfilePage.test.tsx` içindeki
 * "yan panel menüsü (kurumsal düzen)" bloğu tarafından kilitlenir —
 * sırayı değiştirirsen testi de güncellemen gerekir.
 *
 * ⚠️ `contributorResourcesCard` dalı bugün **erişilemezdir**: kart yalnız
 * `roleKey === "User_Contributor"` iken kurulur, ama o anahtar premium sunuma
 * çözülür (`profile-types.ts` `User_` → bireysel) ve premium yol yan paneli
 * hiç çizmez. Dal, rol eşlemesi değişirse diye **bilerek** korundu; kaynağın
 * bugün gerçekten çizildiği yer premium düzendir.
 */
export function buildProfileSidebarMenu(sections: ProfileSidebarSections): SidebarMenuItem[] {
  return [
    {
      id: "overview",
      label: "Profil Özeti",
      icon: <Home className="h-4 w-4" />,
      content: (
        <div className="space-y-4">
          {sections.quickActionsCard}
          {sections.gettingStartedCard}
          {sections.legacyHeroCard}
          {sections.legacySummaryCard}
        </div>
      ),
    },
    {
      id: "fields",
      label: "Profil Bilgileri",
      icon: <User className="h-4 w-4" />,
      content: sections.personalInfoSection,
    },
    ...(sections.badgesCard
      ? [
          {
            id: "badges",
            label: "Rozetler",
            icon: <Award className="h-4 w-4" />,
            content: sections.badgesCard,
          } as SidebarMenuItem,
        ]
      : []),
    {
      id: "cadde",
      // Yalnız Cadde: Çarşı verisi/sorgusu/bağlantısı bu bölümde YOK (plan 2026-09-25).
      // İlgi alanları buradan "Profil Bilgileri"ne, kişisel bilgilerin hemen altına taşındı.
      label: "Cadde",
      icon: <Signpost className="h-4 w-4" />,
      content: sections.caddeCards,
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
      content: sections.socialMediaCard,
    },
    {
      id: "links",
      label: "Bağlantılar",
      icon: <Link2 className="h-4 w-4" />,
      content: sections.linkCardsGrid,
    },
    {
      id: "documents",
      label: "Belgeler",
      icon: <BookOpen className="h-4 w-4" />,
      content: sections.documentsGrid,
    },
    {
      id: "role",
      label: "Rol Detayları",
      icon: <Briefcase className="h-4 w-4" />,
      content: sections.roleSpecificCard,
    },
    {
      id: "access",
      label: "Rol Talepleri",
      icon: <KeyRound className="h-4 w-4" />,
      content: sections.accessCard,
    },
    ...(sections.contributorResourcesCard
      ? [
          {
            id: "contributor",
            label: "Contributor Kaynakları",
            icon: <Users className="h-4 w-4" />,
            content: sections.contributorResourcesCard,
          } as SidebarMenuItem,
        ]
      : []),
    {
      id: "danger",
      label: "Tehlikeli Bölge",
      icon: <AlertTriangle className="h-4 w-4" />,
      content: sections.dangerZoneCard,
    },
    {
      id: "help",
      label: "Yardım",
      icon: <HelpCircle className="h-4 w-4" />,
      content: sections.helpCard,
    },
  ];
}
