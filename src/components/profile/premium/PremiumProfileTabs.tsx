import { type ComponentType, type ReactNode } from "react";
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

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import MessagesInbox from "@/components/messaging/MessagesInbox";
import ServiceRequestForm from "@/components/ServiceRequestForm";
import ServiceRequestsList from "@/components/ServiceRequestsList";

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
/**
 * Tab keys the owner hero needs to drive directly (settings + notifications are
 * triggered from hero buttons, not from the tab bar). Exported so ProfilePage
 * and the hero share one source of truth.
 */
export const PREMIUM_TAB_KEYS = {
  settings: "settings",
  notifications: "notifications",
} as const;

const SETTINGS_TAB_KEY = PREMIUM_TAB_KEYS.settings;

type PremiumTabKind = "settings" | "messages" | "service-requests" | "placeholder";

type PremiumTabConfig = {
  key: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  kind: PremiumTabKind;
  /** Hidden from the tab bar but its panel still renders (driven by hero buttons). */
  hiddenFromTabBar?: boolean;
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
    hiddenFromTabBar: true,
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
    kind: "service-requests",
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
    key: PREMIUM_TAB_KEYS.notifications,
    label: "Bildirimler",
    icon: Bell,
    kind: "placeholder",
    hiddenFromTabBar: true,
    placeholder: {
      title: "Bildirimler",
      description:
        "Platform bildirimlerin ve uyarıların burada toplanacak. Bu panel yakında açılacak.",
    },
  },
];

/**
 * "Hizmet Talepleri" sekmesi: yeni talep oluşturma formu (göstermelik Stripe
 * ödemesiyle) ve kullanıcının mevcut talepleri/teklifleri. Form gönderimi
 * ServiceRequestForm içindeki MockStripeCheckout'a yönlenir; ödeme "başarılı"
 * olunca talep gerçekten kaydedilir ve liste yenilenir.
 */
const ServiceRequestsPanel = () => {
  const [showForm, setShowForm] = useState(false);
  const [listKey, setListKey] = useState(0);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold text-foreground">Hizmet Taleplerim</h3>
          <p className="text-sm text-muted-foreground">
            Danışman ve işletmelerden teklif almak için yeni bir talep oluştur.
          </p>
        </div>
        {!showForm && (
          <Button onClick={() => setShowForm(true)} className="gap-1.5 shrink-0">
            <FileText className="h-4 w-4" /> Yeni Talep
          </Button>
        )}
      </div>

      {showForm ? (
        <Card>
          <CardContent className="p-4 sm:p-6">
            <ServiceRequestForm
              onSuccess={() => {
                setShowForm(false);
                setListKey((k) => k + 1);
              }}
              onCancel={() => setShowForm(false)}
            />
          </CardContent>
        </Card>
      ) : (
        <ServiceRequestsList key={listKey} />
      )}
    </div>
  );
};

type PremiumProfileTabsProps = {
  /** Real profile-editing content (existing premium card stack) for the settings tab. */
  settingsContent: ReactNode;
  /** Active tab key (controlled by ProfilePage so hero buttons can switch tabs). */
  activeTab: string;
  /** Called when the user selects a visible tab. */
  onActiveTabChange: (value: string) => void;
};

const PremiumProfileTabs = ({
  settingsContent,
  activeTab,
  onActiveTabChange,
}: PremiumProfileTabsProps) => {
  const visibleTabs = PREMIUM_TABS.filter((tab) => !tab.hiddenFromTabBar);

  return (
    <Card>
      <CardContent className="p-4">
        <Tabs value={activeTab} onValueChange={onActiveTabChange} className="w-full">
          <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1 p-1">
            {visibleTabs.map((tab) => {
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
              ) : tab.kind === "service-requests" ? (
                <ServiceRequestsPanel />
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
