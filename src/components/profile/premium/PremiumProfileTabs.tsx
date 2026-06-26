import { type ComponentType, type ReactNode, useState } from "react";
import {
  Bell,
  Calendar,
  FileText,
  Inbox,
  MessageSquare,
  Plane,
  Settings,
  Store,
  Ticket,
  Users,
} from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import MessagesInbox from "@/components/messaging/MessagesInbox";

import PremiumPanelPlaceholder from "./PremiumPanelPlaceholder";

/**
 * Premium dashboard tab bar (Experimental_2 pilot). Hero card sits above this
 * component in ProfilePage; here we render the horizontal shadcn Tabs and the
 * active panel. The settings tab renders the (real) profile-editing content
 * passed down from ProfilePage — this component owns NO profile state.
 *
 * Tabs are data-driven: flipping a placeholder tab to a real panel later is a
 * single `kind` change here, not a structural rewrite.
 */
const SETTINGS_TAB_KEY = "settings";

type PremiumTabKind = "settings" | "messages" | "placeholder";

type PremiumTabConfig = {
  key: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  kind: PremiumTabKind;
  /** Placeholder copy (only used when kind === "placeholder"). */
  placeholder?: { title: string; description: string };
};

/**
 * proref "Bireysel Panelim" menu order. Profil Ayarları is the default/active
 * tab and holds the existing premium editing experience.
 */
const PREMIUM_TABS: PremiumTabConfig[] = [
  {
    key: SETTINGS_TAB_KEY,
    label: "Profil Ayarları",
    icon: Settings,
    kind: "settings",
  },
  {
    key: "messages",
    label: "Mesaj Kutusu",
    icon: Inbox,
    kind: "messages",
  },
  {
    key: "service-requests",
    label: "Hizmet Talepleri",
    icon: FileText,
    kind: "placeholder",
    placeholder: {
      title: "Hizmet Talepleri",
      description:
        "Oluşturduğun hizmet talepleri ve durumları burada listelenecek. Bu panel yakında gerçek verilerinle çalışacak.",
    },
  },
  {
    key: "relocation",
    label: "Taşınma Yönetimi",
    icon: Plane,
    kind: "placeholder",
    placeholder: {
      title: "Taşınma Yönetimi",
      description:
        "Taşınma planın, kontrol listelerin ve önerilerin tek yerden yönetilecek. Bu panel yakında açılacak.",
    },
  },
  {
    key: "calendar",
    label: "Takvim",
    icon: Calendar,
    kind: "placeholder",
    placeholder: {
      title: "Takvim",
      description:
        "Etkinliklerin, randevuların ve hatırlatmaların bir takvim görünümünde toplanacak. Bu panel yakında açılacak.",
    },
  },
  {
    key: "events",
    label: "Etkinliklerim",
    icon: Calendar,
    kind: "placeholder",
    placeholder: {
      title: "Etkinliklerim",
      description:
        "Katıldığın ve oluşturduğun etkinlikler burada görünecek. Bu panel yakında gerçek verilerinle çalışacak.",
    },
  },
  {
    key: "coupons",
    label: "Kuponlar",
    icon: Ticket,
    kind: "placeholder",
    placeholder: {
      title: "Kuponlar",
      description:
        "Sana özel kuponlar ve indirim kodları burada toplanacak. Bu panel yakında açılacak.",
    },
  },
  {
    key: "carsi",
    label: "Çarşı",
    icon: Store,
    kind: "placeholder",
    placeholder: {
      title: "Çarşı",
      description:
        "Çarşı ilanların ve favori ürünlerin buraya bağlanacak. Bu panel yakında açılacak.",
    },
  },
  {
    key: "following",
    label: "Takip",
    icon: Users,
    kind: "placeholder",
    placeholder: {
      title: "Takip",
      description:
        "Takip ettiğin profiller ve seni takip edenler burada görünecek. Bu panel yakında gerçek verilerinle çalışacak.",
    },
  },
  {
    key: "whatsapp",
    label: "WhatsApp",
    icon: MessageSquare,
    kind: "placeholder",
    placeholder: {
      title: "WhatsApp Grupları",
      description:
        "Üyesi olduğun WhatsApp grupları ve davetlerin burada listelenecek. Bu panel yakında açılacak.",
    },
  },
  {
    key: "notifications",
    label: "Bildirimler",
    icon: Bell,
    kind: "placeholder",
    placeholder: {
      title: "Bildirimler",
      description:
        "Platform bildirimlerin ve uyarıların burada toplanacak. Bu panel yakında açılacak.",
    },
  },
];

type PremiumProfileTabsProps = {
  /** Real profile-editing content (existing premium card stack) for the settings tab. */
  settingsContent: ReactNode;
};

const PremiumProfileTabs = ({ settingsContent }: PremiumProfileTabsProps) => {
  const [activeTab, setActiveTab] = useState<string>(SETTINGS_TAB_KEY);

  return (
    <Card>
      <CardContent className="p-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1 p-1">
            {PREMIUM_TABS.map((tab) => {
              const Icon = tab.icon;
              return (
                <TabsTrigger
                  key={tab.key}
                  value={tab.key}
                  className="gap-1.5 text-xs"
                >
                  <Icon className="h-3.5 w-3.5" aria-hidden="true" /> {tab.label}
                </TabsTrigger>
              );
            })}
          </TabsList>

          {PREMIUM_TABS.map((tab) => (
            <TabsContent key={tab.key} value={tab.key} className="mt-4">
              {tab.kind === "settings" ? (
                settingsContent
              ) : tab.kind === "messages" ? (
                <MessagesInbox />
              ) : tab.placeholder ? (
                <PremiumPanelPlaceholder
                  title={tab.placeholder.title}
                  description={tab.placeholder.description}
                  icon={tab.icon}
                />
              ) : null}
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default PremiumProfileTabs;
