// Linkler (/admin/links) — admin'in sık kullandığı dış araç/panel kısayolları.
// Her giriş, yeni sekmede açılan bir karttır. Yeni bir dış araç eklemek için
// adminLinkCards listesine bir kayıt ekle.

import { BarChart3, ExternalLink, type LucideIcon } from "lucide-react";

import { AdminPageShell } from "@/components/admin/page";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type AdminLinkCard = {
  id: string;
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
};

const adminLinkCards: AdminLinkCard[] = [
  {
    id: "site-trafik-durumu",
    title: "Site Trafik Durumu",
    description:
      "Microsoft Clarity panosu — ziyaretçi oturumları, ısı haritaları ve davranış kayıtları.",
    href: "https://clarity.microsoft.com/projects/view/wdkgdje6rb/",
    icon: BarChart3,
  },
];

const AdminLinksPage = () => (
  <AdminPageShell
    title="Linkler"
    description="Admin panelinden hızlı erişilen dış araçlar ve panolar."
    eyebrow="Dış Bağlantılar"
    icon={ExternalLink}
    accent="indigo"
  >
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {adminLinkCards.map((card) => {
        const Icon = card.icon;
        return (
          <a
            key={card.id}
            href={card.href}
            target="_blank"
            rel="noreferrer"
            className="group focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-lg"
          >
            <Card className="h-full transition-colors group-hover:border-primary/60 group-hover:bg-accent/40">
              <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
                    <Icon aria-hidden="true" className="h-5 w-5" />
                  </span>
                  <CardTitle className="text-base">{card.title}</CardTitle>
                </div>
                <ExternalLink
                  aria-hidden="true"
                  className="h-4 w-4 shrink-0 text-muted-foreground transition-colors group-hover:text-foreground"
                />
              </CardHeader>
              <CardContent>
                <CardDescription>{card.description}</CardDescription>
              </CardContent>
            </Card>
          </a>
        );
      })}
    </div>
  </AdminPageShell>
);

export default AdminLinksPage;
