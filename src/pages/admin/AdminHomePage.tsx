import type { ComponentType } from "react";
import { ArrowRight, ExternalLink, LogOut } from "lucide-react";
import { Link } from "react-router-dom";

import {
  adminPanelDocNavItems,
  externalAdminNavItems,
  may19RecordNavItems,
  otherActionNavItems,
  otherRecordNavItems,
  primaryAdminNavItems,
  workspaceAdminNavItems,
} from "@/components/admin/admin-navigation";
import { useAdminOutletContext } from "@/components/admin/AdminLayout";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { advisorProfileSections } from "@/lib/resource-links";

const internalAdminLinkDescriptions: Record<string, string> = {
  "Üye Takibi": "Üyeleri, başvuruları ve günlük operasyonları tek ekrandan yönetin.",
  "Ref Kod": "Referral akışını, kaynakları ve kullanım performansını takip edin.",
  Dosyalar: "Genel kaynakları, CV kayıtlarını ve bağlantıları tek ekrandan yönetin.",
};

const externalAdminLinkDescriptions: Record<string, string> = {
  Engine: "Operasyon ve sistem akışlarına ayrılmış dış platform.",
  Globe: "Global ağ ve görünürlük tarafı için ayrı giriş noktası.",
  Founders: "Kurucu vizyonunu ve platform anlatısını açan sayfa.",
};

const otherActionDescriptions: Record<string, string> = {
  Muhasebe: "Gelir, gider ve nakit akışı ekranlarına hızlıca geçin.",
  "Haber Bandı": "Site içindeki kayan haber alanını ve görünür metinleri yönetin.",
  "Sosyal Medya": "Sosyal medya linkleri ve dış ağ bağlantılarını düzenleyin.",
  Güncellemeler: "Hakkımızda ve güncelleme içeriklerini admin panelinden kontrol edin.",
};

const otherRecordDescriptions: Record<string, string> = {
  "Üye Takibi": "Üye kayıtlarını, filtreleri ve operasyon adımlarını tek ekrandan yönetin.",
  "Lansman Katılım": "Lansman kayıtlarını, filtreleri ve form cevaplarını inceleyin.",
  "WhatsApp Grupları": "WhatsApp grup ve landing başvurularını moderasyon ekranından yönetin.",
  "19 Mayıs Kelime": "19 kelimelik fikir gönderimlerini onaylayın, reddedin ve not alın.",
  "19 Mayıs Anı": "19 Mayıs anı gönderimlerini moderasyon akışından yönetin.",
};

const advisorRecordItems = advisorProfileSections.map((section) => ({
  to: `/admin/advisors/${section.key}`,
  label: section.label,
  description: `${section.label} profil bağlantılarını ve içeriklerini yönetin.`,
}));

const sectionLabelClassName = "text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-500";

const renderDashboardCard = (item: {
  key: string;
  to: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
}) => (
  <Card key={item.key} className="border-slate-200 bg-white shadow-none">
    <CardHeader className="p-3 pb-2">
      <div className="flex items-center gap-2.5">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-violet-100 bg-violet-50 text-violet-700">
          <item.icon className="h-3.5 w-3.5" />
        </div>
        <CardTitle className="text-[13px] leading-5 text-slate-950">{item.label}</CardTitle>
      </div>
    </CardHeader>
    <CardContent className="p-3 pt-0">
      <Button asChild variant="outline" size="xs" className="h-6 px-2 text-xs">
        <Link to={item.to}>
          Ekranı Aç
          <ArrowRight className="h-3 w-3 ml-1" />
        </Link>
      </Button>
    </CardContent>
  </Card>
);

const AdminHomePage = () => {
  const { session, onLogout } = useAdminOutletContext();

  return (
    <div className="space-y-4">
      <Card className="border-primary/15 bg-gradient-to-r from-white via-sky-50/70 to-amber-50/50 shadow-sm">
        <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
          <div className="flex min-w-0 flex-wrap items-center gap-3">
            <div className="inline-flex items-center rounded-full border border-primary/15 bg-white/90 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.28em] text-primary shadow-sm">
              CorteQS Admin Hub
            </div>
            <div className="text-xs text-slate-600">
              Giriş yapan kullanıcı: <span className="font-semibold text-slate-900">{session.user.email}</span>
            </div>
          </div>
          <Button variant="outline" size="sm" className="gap-2" onClick={() => void onLogout()}>
            <LogOut className="h-3.5 w-3.5" />
            Çıkış
          </Button>
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-[1.02fr_0.98fr]">
        <section className="space-y-4">
          <section className="space-y-2">
            <div className="space-y-1">
              <h2 className={sectionLabelClassName}>Admin İşlemleri</h2>
              <p className="text-xs text-slate-600">Operasyonel admin ekranlarını tek kolonda toplayın.</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {primaryAdminNavItems.map((item) => (
                <Card
                  key={item.to}
                  className="border-slate-200 bg-white shadow-sm transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-md"
                >
                  <CardHeader className="space-y-3 p-4 pb-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-sky-100 bg-sky-50 text-sky-700 shadow-sm">
                      <item.icon className="h-4 w-4" />
                    </div>
                    <div className="space-y-1">
                      <CardTitle className="text-base text-slate-950">{item.label}</CardTitle>
                      <CardDescription className="text-xs leading-5 text-slate-600">
                        {internalAdminLinkDescriptions[item.label]}
                      </CardDescription>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <Button asChild size="sm" className="w-full justify-between text-xs">
                      <Link to={item.to}>
                        Ekranı Aç
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          <section className="space-y-2">
            <div className="space-y-1">
              <h2 className={sectionLabelClassName}>Dış Bağlantılar</h2>
              <p className="text-xs text-slate-600">Harici platformlara tek satırlık kompakt çıkışlar.</p>
            </div>
            <div className="grid gap-3">
              {externalAdminNavItems.map((item, index) => (
                <Card
                  key={item.href}
                  className={`border shadow-sm ${
                    index === 0
                      ? "border-sky-200 bg-sky-50/70"
                      : index === 1
                        ? "border-emerald-200 bg-emerald-50/70"
                        : "border-amber-200 bg-amber-50/70"
                  }`}
                >
                  <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <h3 className="text-sm font-semibold text-slate-950">{item.label}</h3>
                      <p className="mt-1 text-xs leading-5 text-slate-600">{externalAdminLinkDescriptions[item.label]}</p>
                    </div>
                    <Button asChild variant="outline" size="sm" className="justify-between bg-white/90 text-xs sm:min-w-36">
                      <a href={item.href} target="_blank" rel="noreferrer">
                        Bağlantıyı Aç
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          <Card className="border-slate-200 bg-white shadow-sm">
            <CardContent className="p-2 sm:p-3">
              <Accordion type="multiple" className="space-y-2">
                <AccordionItem value="other-actions" className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50/70 px-3">
                  <AccordionTrigger className="py-3 text-left hover:no-underline">
                    <div className="space-y-1">
                      <div className="text-sm font-semibold text-slate-950">Diğer İşlemler</div>
                      <div className="text-xs text-slate-600">Haber bandı, sosyal medya ve güncelleme ekranları.</div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pb-3">
                    <div className="grid gap-2">
                      {otherActionNavItems.map((item) => (
                        <div key={item.to} className="rounded-xl border border-slate-200 bg-white p-3">
                          <div className="flex items-start gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-700">
                              <item.icon className="h-3.5 w-3.5" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <h3 className="text-sm font-semibold text-slate-900">{item.label}</h3>
                              <p className="mt-0.5 text-xs leading-5 text-slate-600">{otherActionDescriptions[item.label]}</p>
                            </div>
                          </div>
                          <Button asChild variant="ghost" size="sm" className="mt-2 h-8 w-full justify-between px-2 text-xs">
                            <Link to={item.to}>
                              Sayfayı Aç
                              <ArrowRight className="h-3.5 w-3.5" />
                            </Link>
                          </Button>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="other-records" className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50/70 px-3">
                  <AccordionTrigger className="py-3 text-left hover:no-underline">
                    <div className="space-y-1">
                      <div className="text-sm font-semibold text-slate-950">Diğer Kayıtlar</div>
                      <div className="text-xs text-slate-600">Lansman ve danışman profili ekranlarını açın.</div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pb-3">
                    <div className="grid gap-2">
                      {otherRecordNavItems.map((item) => (
                        <div key={item.to} className="rounded-xl border border-slate-200 bg-white p-3">
                          <div className="flex items-start gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-700">
                              <item.icon className="h-3.5 w-3.5" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <h3 className="text-sm font-semibold text-slate-900">{item.label}</h3>
                              <p className="mt-0.5 text-xs leading-5 text-slate-600">{otherRecordDescriptions[item.label]}</p>
                            </div>
                          </div>
                          <Button asChild variant="ghost" size="xs" className="mt-2 h-6 px-2 text-xs">
                            <Link to={item.to}>
                              Sayfayı Aç
                              <ArrowRight className="h-3 w-3 ml-1" />
                            </Link>
                          </Button>
                        </div>
                      ))}

                      {advisorRecordItems.map((item) => (
                        <div key={item.to} className="rounded-xl border border-slate-200 bg-white p-3">
                          <div className="min-w-0">
                            <h3 className="text-sm font-semibold text-slate-900">{item.label}</h3>
                            <p className="mt-0.5 text-xs leading-5 text-slate-600">{item.description}</p>
                          </div>
                          <Button asChild variant="ghost" size="xs" className="mt-2 h-6 px-2 text-xs">
                            <Link to={item.to}>
                              Sayfayı Aç
                              <ArrowRight className="h-3 w-3 ml-1" />
                            </Link>
                          </Button>
                        </div>
                      ))}

                      {may19RecordNavItems.map((item) => (
                        <div key={item.to} className="rounded-xl border border-slate-200 bg-white p-3">
                          <div className="flex items-start gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-700">
                              <item.icon className="h-3.5 w-3.5" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <h3 className="text-sm font-semibold text-slate-900">{item.label}</h3>
                              <p className="mt-0.5 text-xs leading-5 text-slate-600">{otherRecordDescriptions[item.label]}</p>
                            </div>
                          </div>
                          <Button asChild variant="ghost" size="xs" className="mt-2 h-6 px-2 text-xs">
                            <Link to={item.to}>
                              Sayfayı Aç
                              <ArrowRight className="h-3 w-3 ml-1" />
                            </Link>
                          </Button>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>
        </section>

        <section className="space-y-2">
          <div className="space-y-1">
            <h2 className={sectionLabelClassName}>Dashboard</h2>
            <p className="text-xs text-slate-600">Yeni workspace araçları ve wiki dökümanlarına tek panelden ulaşın.</p>
          </div>
          <Card className="border-slate-200 bg-white shadow-sm">
            <CardContent className="space-y-3 p-3">
              <div className="grid gap-2 sm:grid-cols-2">{workspaceAdminNavItems.map(renderDashboardCard)}</div>

              <div className="space-y-2.5">
                <div className="border-t border-slate-200 pt-2.5">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-500">Diğer Dokümanlar</div>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">{adminPanelDocNavItems.map(renderDashboardCard)}</div>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
};

export default AdminHomePage;
