import type { ComponentType } from "react";
import { ArrowRight, ExternalLink, LogOut, ScrollText, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

import {
  adminPanelDocNavItems,
  communityNavItems,
  dataNavItems,
  externalAdminNavItems,
  may19RecordNavItems,
  newMemberSystemNavItems,
  otherActionNavItems,
  otherRecordNavItems,
  primaryAdminNavItems,
  workspaceAdminNavItems,
} from "@/components/admin/admin-navigation";
import { useAdminOutletContext } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { advisorProfileSections } from "@/lib/resource-links";

type NavIcon = ComponentType<{ className?: string }>;

type NavCardItem =
  | {
      key: string;
      label: string;
      description: string;
      icon: NavIcon;
      kind: "internal";
      to: string;
      eyebrow?: string;
    }
  | {
      key: string;
      label: string;
      description: string;
      icon: NavIcon;
      kind: "external";
      href: string;
      eyebrow?: string;
    };

type NavSection = {
  key: string;
  eyebrow: string;
  title: string;
  description: string;
  accentClassName: string;
  iconWrapClassName: string;
  buttonClassName: string;
  items: NavCardItem[];
};

const newMemberDescriptions: Record<string, string> = {
  "Üye Takibi": "Yeni kayıtları, operasyon akışını ve günlük incelemeleri merkezden yönet.",
  "Genel Kullanım Kılavuzu": "Yeni üye sisteminin uçtan uca kullanım notlarını tek yerden aç.",
  "Loginli Kullanıcılar & Roller": "Kullanıcı rol atamaları, görünürlükler ve profil alanlarını düzenle.",
  "Roller & Featurelar": "Rol bazlı feature açma, kapama ve varsayılanları stratejik olarak kurgula.",
  "Attribute Yönetimi": "Alan kuralları, zorunluluklar ve görünürlük davranışlarını güncelle.",
  "Profile Sections": "Profil bileşen sıralarını ve role göre section akışını şekillendir.",
  "Taxonomy Yönetimi": "Alt kategori, alt tip ve seçilebilir taxonomy seçeneklerini yönet.",
  "Feature Override": "Kullanıcı bazlı override ile standart akıştan kontrollü sapmalar oluştur.",
};

const primaryDescriptions: Record<string, string> = {
  "Ref Kod": "Referral kaynaklarını, kod yapısını ve performansını hızlıca denetle.",
  Dosyalar: "Operasyonel kaynaklar, linkler ve ortak çalışma belgelerine kısa yoldan geç.",
};

const otherActionDescriptions: Record<string, string> = {
  Muhasebe: "Gelir, gider ve nakit akışını operasyon odaklı olarak takip et.",
  "Haber Bandı": "Üst bantta dönen duyuruları, tonunu ve görünürlüğünü düzenle.",
  Cadde: "Cadde akışını, içeriklerini ve yönetim araçlarını tek noktadan aç.",
  "Sosyal Medya": "Dış ağ bağlantıları, sosyal medya linkleri ve yayın uçlarını güncelle.",
  "Approval Queue": "Onay bekleyen profil, rol ve feature taleplerini sıradan geçir.",
  "Audit Logs": "Kritik admin işlemlerinin geçmişini ve değişiklik izlerini incele.",
  Güncellemeler: "Ürün güncellemeleri ve yönetim notlarını güncel tut.",
};

const communityDescriptions: Record<string, string> = {
  Topluluklar: "Topluluk landing kayıtlarını incele, onayla ve yayına al.",
  "Topluluk Editörleri": "Landing bazlı editör atamalarını güvenli şekilde yönet.",
  "Topluluk Kullanma Kılavuzu": "Topluluk akışının editör ve admin kullanım rehberine ulaş.",
  "Diplomatik Profiller": "Misyon ve diplomatik profil içeriklerini merkezi şekilde aç.",
};

const dataDescriptions: Record<string, string> = {
  Büyükelçilik: "Büyükelçilik veri setini güncelle ve kaynak bütünlüğünü denetle.",
  Başkonsolosluk: "Başkonsolosluk kayıtlarını operasyon panelinden düzenle.",
  Konsolosluk: "Konsolosluk girişlerini, filtreleri ve eşleşmeleri doğrula.",
  "Konsolosluk Ofisi": "Ofis seviyesindeki kayıtları ve lokasyon bilgilerini yönet.",
  "Kullanıcı Rolleri": "Sistem rollerini veri seviyesinde hızla incele.",
};

const otherRecordDescriptions: Record<string, string> = {
  "Lansman Katılım": "Lansman akışındaki katılımcıları ve form çıktısını ayrıntılı incele.",
  Anketler: "Anket setlerini, cevapları ve yayın akışını yönet.",
  "19 Mayıs Kelime": "19 kelimelik fikir gönderimlerini moderasyon kuyruğundan yönet.",
  "19 Mayıs Anı": "19 Mayıs anı içeriklerini tek ekranda gözden geçir.",
  "19 Mayıs Fikir": "İnaktif fikir akışını ayrı bir kayıt paneli olarak aç.",
};

const dashboardDescriptions: Record<string, string> = {
  "CC": "Command Center akışını, görev yoğunluğunu ve koordinasyon araçlarını aç.",
  "Dosyalar ve Linkler": "Workspace dokümanları ve ortak bağlantılara tek panelden geç.",
  "MVP Listesi": "MVP önceliklerini ve ürün akışını aynı yerden takip et.",
};

const externalAdminLinkDescriptions: Record<string, string> = {
  Engine: "Operasyon ve sistem akışlarına ayrılmış dış platform.",
  Globe: "Global ağ ve görünürlük tarafı için ayrı giriş noktası.",
  Founders: "Kurucu vizyonunu ve platform anlatısını açan ayrı yüzey.",
};

const advisorRecordItems = advisorProfileSections.map((section) => ({
  key: `advisor-${section.key}`,
  to: `/admin/advisors/${section.key}`,
  label: section.label,
  description: `${section.label} profil bağlantılarını ve içerik akışını yönet.`,
  icon: ScrollText,
  kind: "internal" as const,
  eyebrow: "Sosyal Link Profilleri",
}));

const inactiveRecordItems = [
  {
    key: "inactive-may19-ani",
    to: "/admin/may19/ani",
    label: "19 Mayıs Anı",
    description: "İnaktif başlık altındaki 19 Mayıs anı akışını doğrudan aç.",
    icon: ScrollText,
    kind: "internal" as const,
    eyebrow: "İnaktif",
  },
  {
    key: "inactive-may19-fikir",
    to: "/admin/may19/kelime",
    label: "19 Mayıs Fikir",
    description: "İnaktif fikir akışı için hızlı moderasyon girişini kullan.",
    icon: ScrollText,
    kind: "internal" as const,
    eyebrow: "İnaktif",
  },
];

const sections: NavSection[] = [
  {
    key: "new-member",
    eyebrow: "Üyeler",
    title: "Yeni Üye Sistemi",
    description: "Header’daki Üyeler menüsünün tamamı burada kart düzeninde açılır.",
    accentClassName: "border-sky-200/80 bg-gradient-to-br from-sky-50 via-white to-cyan-50",
    iconWrapClassName: "border-sky-200 bg-sky-100 text-sky-700",
    buttonClassName: "border-sky-200 bg-white/90 text-sky-900 hover:bg-sky-100",
    items: newMemberSystemNavItems.map((item) => ({
      key: item.to,
      label: item.label,
      description: newMemberDescriptions[item.label] ?? "Bu admin ekranını aç.",
      icon: item.icon,
      kind: "internal",
      to: item.to,
    })),
  },
  {
    key: "primary",
    eyebrow: "Kısa Yollar",
    title: "Admin Çekirdeği",
    description: "Header’da doğrudan görünen temel admin bağlantılarını premium kartlar olarak kullan.",
    accentClassName: "border-violet-200/80 bg-gradient-to-br from-violet-50 via-white to-fuchsia-50",
    iconWrapClassName: "border-violet-200 bg-violet-100 text-violet-700",
    buttonClassName: "border-violet-200 bg-white/90 text-violet-900 hover:bg-violet-100",
    items: primaryAdminNavItems.map((item) => ({
      key: item.to,
      label: item.label,
      description: primaryDescriptions[item.label] ?? "Bu admin ekranını aç.",
      icon: item.icon,
      kind: "internal",
      to: item.to,
    })),
  },
  {
    key: "actions",
    eyebrow: "Diğer İşlemler",
    title: "Operasyon Modülleri",
    description: "Harici akışlar dışındaki operasyonel tüm yönetim modülleri tek bakışta burada.",
    accentClassName: "border-amber-200/80 bg-gradient-to-br from-amber-50 via-white to-orange-50",
    iconWrapClassName: "border-amber-200 bg-amber-100 text-amber-700",
    buttonClassName: "border-amber-200 bg-white/90 text-amber-900 hover:bg-amber-100",
    items: otherActionNavItems.map((item) => ({
      key: item.to,
      label: item.label,
      description: otherActionDescriptions[item.label] ?? "Bu admin ekranını aç.",
      icon: item.icon,
      kind: "internal",
      to: item.to,
    })),
  },
  {
    key: "community",
    eyebrow: "Topluluklar",
    title: "Community Kontrol Merkezi",
    description: "Topluluklar dropdown’ındaki tüm yüzeyleri renkli kartlarla aç.",
    accentClassName: "border-emerald-200/80 bg-gradient-to-br from-emerald-50 via-white to-teal-50",
    iconWrapClassName: "border-emerald-200 bg-emerald-100 text-emerald-700",
    buttonClassName: "border-emerald-200 bg-white/90 text-emerald-900 hover:bg-emerald-100",
    items: communityNavItems.map((item) => ({
      key: item.to,
      label: item.label,
      description: communityDescriptions[item.label] ?? "Bu topluluk ekranını aç.",
      icon: item.icon,
      kind: "internal",
      to: item.to,
    })),
  },
  {
    key: "data",
    eyebrow: "Data",
    title: "Veri Katmanı",
    description: "Header’daki Data menüsünü tek sayfalık bir operasyon ızgarasına dönüştür.",
    accentClassName: "border-cyan-200/80 bg-gradient-to-br from-cyan-50 via-white to-blue-50",
    iconWrapClassName: "border-cyan-200 bg-cyan-100 text-cyan-700",
    buttonClassName: "border-cyan-200 bg-white/90 text-cyan-900 hover:bg-cyan-100",
    items: dataNavItems.map((item) => ({
      key: item.to,
      label: item.label,
      description: dataDescriptions[item.label] ?? "Bu veri ekranını aç.",
      icon: item.icon,
      kind: "internal",
      to: item.to,
    })),
  },
  {
    key: "records",
    eyebrow: "Diğer Kayıtlar",
    title: "Kayıt ve Moderasyon Alanları",
    description: "Dropdown içindeki kayıt, moderasyon, inaktif ve sosyal link profili akışlarını birlikte göster.",
    accentClassName: "border-rose-200/80 bg-gradient-to-br from-rose-50 via-white to-pink-50",
    iconWrapClassName: "border-rose-200 bg-rose-100 text-rose-700",
    buttonClassName: "border-rose-200 bg-white/90 text-rose-900 hover:bg-rose-100",
    items: [
      ...otherRecordNavItems.map((item) => ({
        key: item.to,
        label: item.label,
        description: otherRecordDescriptions[item.label] ?? "Bu kayıt ekranını aç.",
        icon: item.icon,
        kind: "internal" as const,
        to: item.to,
      })),
      ...may19RecordNavItems.map((item) => ({
        key: item.to,
        label: item.label,
        description: otherRecordDescriptions[item.label] ?? "Bu moderasyon ekranını aç.",
        icon: item.icon,
        kind: "internal" as const,
        to: item.to,
        eyebrow: "19 Mayıs",
      })),
      ...inactiveRecordItems,
      ...advisorRecordItems,
    ],
  },
  {
    key: "dashboard",
    eyebrow: "Dashboard",
    title: "Workspace ve Dokümanlar",
    description: "Header’daki dashboard araçlarını ve doküman girişlerini altı kolonlu vitrinde topla.",
    accentClassName: "border-slate-200/90 bg-gradient-to-br from-slate-50 via-white to-zinc-100",
    iconWrapClassName: "border-slate-200 bg-white text-slate-700",
    buttonClassName: "border-slate-200 bg-white/90 text-slate-900 hover:bg-slate-100",
    items: [
      ...workspaceAdminNavItems
        .filter((item) => item.key !== "workspace-home")
        .map((item) => ({
          key: item.key,
          label: item.label,
          description: dashboardDescriptions[item.label] ?? "Bu workspace aracını aç.",
          icon: item.icon,
          kind: "internal" as const,
          to: item.to,
          eyebrow: item.label === "CC" ? "Command Center" : "Workspace",
        })),
      ...adminPanelDocNavItems.map((item) => ({
        key: item.key,
        label: item.label,
        description: "Admin wiki ve doküman setindeki ilgili sayfayı doğrudan aç.",
        icon: item.icon,
        kind: "internal" as const,
        to: item.to,
        eyebrow: "Doküman",
      })),
    ],
  },
  {
    key: "external",
    eyebrow: "Dış Bağlantılar",
    title: "Harici Yüzeyler",
    description: "Admin header’ındaki dış bağlantıları aynı premium hissiyle ayrı kartlar halinde göster.",
    accentClassName: "border-indigo-200/80 bg-gradient-to-br from-indigo-50 via-white to-blue-50",
    iconWrapClassName: "border-indigo-200 bg-indigo-100 text-indigo-700",
    buttonClassName: "border-indigo-200 bg-white/90 text-indigo-900 hover:bg-indigo-100",
    items: externalAdminNavItems.map((item) => ({
      key: item.href,
      label: item.label,
      description: externalAdminLinkDescriptions[item.label] ?? "Dış bağlantıyı yeni sekmede aç.",
      icon: item.icon,
      kind: "external",
      href: item.href,
    })),
  },
];

function SectionCard({ section }: { section: NavSection }) {
  return (
    <Card className={`overflow-hidden rounded-[30px] border shadow-[0_24px_80px_-42px_rgba(15,23,42,0.38)] ${section.accentClassName}`}>
      <CardHeader className="pb-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="inline-flex items-center rounded-full border border-white/80 bg-white/80 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.28em] text-slate-700 shadow-sm backdrop-blur">
            {section.eyebrow}
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/70 px-3 py-1 text-[11px] text-slate-600 backdrop-blur">
            <Sparkles className="h-3.5 w-3.5 text-amber-500" />
            Premium admin kısayolları
          </div>
        </div>
        <div className="space-y-2">
          <CardTitle className="text-2xl text-slate-950">{section.title}</CardTitle>
          <CardDescription className="max-w-3xl text-sm leading-6 text-slate-600">{section.description}</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-6">
          {section.items.map((item) => (
            <article
              key={item.key}
              className="group relative overflow-hidden rounded-[26px] border border-white/70 bg-white/88 p-4 shadow-[0_18px_55px_-40px_rgba(15,23,42,0.55)] backdrop-blur transition duration-200 hover:-translate-y-1 hover:shadow-[0_24px_70px_-34px_rgba(15,23,42,0.42)]"
            >
              <div className="pointer-events-none absolute inset-x-5 top-0 h-20 rounded-b-full bg-gradient-to-b from-white/80 to-transparent opacity-80" />
              <div className="relative flex h-full flex-col gap-4">
                <div className="flex items-start justify-between gap-3">
                  <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border shadow-sm ${section.iconWrapClassName}`}>
                    <item.icon className="h-4.5 w-4.5" />
                  </div>
                  {item.eyebrow ? (
                    <div className="rounded-full border border-slate-200/80 bg-white/90 px-2.5 py-1 text-[10px] font-medium tracking-[0.16em] text-slate-500 uppercase">
                      {item.eyebrow}
                    </div>
                  ) : null}
                </div>

                <div className="space-y-2">
                  <h3 className="text-sm font-semibold leading-5 text-slate-950">{item.label}</h3>
                  <p className="text-xs leading-5 text-slate-600">{item.description}</p>
                </div>

                <div className="mt-auto">
                  {item.kind === "internal" ? (
                    <Button asChild variant="outline" size="sm" className={`h-9 w-full justify-between rounded-xl text-xs shadow-sm ${section.buttonClassName}`}>
                      <Link to={item.to}>
                        Ekranı Aç
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </Button>
                  ) : (
                    <Button asChild variant="outline" size="sm" className={`h-9 w-full justify-between rounded-xl text-xs shadow-sm ${section.buttonClassName}`}>
                      <a href={item.href} target="_blank" rel="noreferrer">
                        Bağlantıyı Aç
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

const AdminHomePage = () => {
  const { session, onLogout } = useAdminOutletContext();

  return (
    <div className="space-y-5">
      <Card className="overflow-hidden rounded-[34px] border-slate-200 bg-[radial-gradient(circle_at_top_left,_rgba(125,211,252,0.42),_transparent_32%),radial-gradient(circle_at_top_right,_rgba(251,191,36,0.22),_transparent_30%),linear-gradient(135deg,_rgba(255,255,255,0.98),_rgba(248,250,252,0.92))] shadow-[0_30px_100px_-48px_rgba(15,23,42,0.52)]">
        <CardContent className="flex flex-col gap-5 p-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/85 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.34em] text-slate-700 shadow-sm backdrop-blur">
              <Sparkles className="h-3.5 w-3.5 text-amber-500" />
              CorteQS Admin Atelier
            </div>
            <div className="space-y-2">
              <h1 className="text-3xl font-semibold tracking-tight text-slate-950 lg:text-4xl">Header’daki tüm yönetim yüzeyleri artık tek vitrinde.</h1>
              <p className="max-w-3xl text-sm leading-6 text-slate-600 lg:text-base">
                Açılış ekranı, admin header menüsündeki tüm bağlantıları renkli kartlara dönüştürür. Böylece dropdown dolaşmadan bütün yönetim
                alanlarını aynı ekranda altı kolonlu premium bir düzen içinde açabilirsin.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <div className="inline-flex items-center rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-xs text-slate-700 shadow-sm">
                6 kolonlu hızlı erişim
              </div>
              <div className="inline-flex items-center rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-xs text-slate-700 shadow-sm">
                Tüm header menüsü tek ekranda
              </div>
              <div className="inline-flex items-center rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-xs text-slate-700 shadow-sm">
                Renk kodlu premium kartlar
              </div>
            </div>
          </div>

          <div className="grid min-w-full gap-3 sm:grid-cols-2 lg:min-w-[350px] lg:max-w-[390px]">
            <div className="rounded-[24px] border border-white/80 bg-white/86 p-4 shadow-sm backdrop-blur">
              <div className="text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-500">Aktif kullanıcı</div>
              <div className="mt-2 text-sm font-semibold text-slate-950">{session.user.email}</div>
              <div className="mt-1 text-xs leading-5 text-slate-600">Bu admin hub görünümü oturum açan hesap için kişiselleştirilmiş olarak yüklenir.</div>
            </div>
            <div className="rounded-[24px] border border-white/80 bg-white/86 p-4 shadow-sm backdrop-blur">
              <div className="text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-500">Bölüm sayısı</div>
              <div className="mt-2 text-3xl font-semibold text-slate-950">{sections.length}</div>
              <div className="mt-1 text-xs leading-5 text-slate-600">Header kaynaklarının tamamı section section aynı ekranda listeleniyor.</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {sections.map((section) => (
        <SectionCard key={section.key} section={section} />
      ))}

      <div className="flex justify-end">
        <Button variant="outline" size="sm" className="gap-2 rounded-xl bg-white/90 shadow-sm" onClick={() => void onLogout()}>
          <LogOut className="h-3.5 w-3.5" />
          Çıkış
        </Button>
      </div>
    </div>
  );
};

export default AdminHomePage;
