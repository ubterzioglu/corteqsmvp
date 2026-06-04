import { useMemo, useState, type ComponentType } from "react";
import { ArrowRight, ExternalLink, LogOut, ScrollText, Search, Sparkles } from "lucide-react";
import { AdminPageLayout } from "@/components/admin/AdminPageLayout";
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
import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { advisorProfileSections } from "@/lib/resource-links";

type NavIcon = ComponentType<{ className?: string }>;
type NavTone = "sky" | "violet" | "amber" | "emerald" | "cyan" | "rose" | "slate" | "indigo" | "neutral";

type BaseNavCard = {
  key: string;
  label: string;
  description: string;
  icon: NavIcon;
  eyebrow: string;
  tone: NavTone;
};

type NavCardItem =
  | (BaseNavCard & {
      kind: "internal";
      to: string;
    })
  | (BaseNavCard & {
      kind: "external";
      href: string;
    })
  | (BaseNavCard & {
      kind: "action";
      action: "logout";
    });

const toneClasses: Record<NavTone, { card: string; iconWrap: string; button: string }> = {
  sky: {
    card: "border-sky-200/80 bg-gradient-to-br from-sky-50 via-white to-cyan-50",
    iconWrap: "border-sky-200 bg-sky-100 text-sky-700",
    button: "border-sky-200 bg-white/90 text-sky-900 hover:bg-sky-100",
  },
  violet: {
    card: "border-violet-200/80 bg-gradient-to-br from-violet-50 via-white to-fuchsia-50",
    iconWrap: "border-violet-200 bg-violet-100 text-violet-700",
    button: "border-violet-200 bg-white/90 text-violet-900 hover:bg-violet-100",
  },
  amber: {
    card: "border-amber-200/80 bg-gradient-to-br from-amber-50 via-white to-orange-50",
    iconWrap: "border-amber-200 bg-amber-100 text-amber-700",
    button: "border-amber-200 bg-white/90 text-amber-900 hover:bg-amber-100",
  },
  emerald: {
    card: "border-emerald-200/80 bg-gradient-to-br from-emerald-50 via-white to-teal-50",
    iconWrap: "border-emerald-200 bg-emerald-100 text-emerald-700",
    button: "border-emerald-200 bg-white/90 text-emerald-900 hover:bg-emerald-100",
  },
  cyan: {
    card: "border-cyan-200/80 bg-gradient-to-br from-cyan-50 via-white to-blue-50",
    iconWrap: "border-cyan-200 bg-cyan-100 text-cyan-700",
    button: "border-cyan-200 bg-white/90 text-cyan-900 hover:bg-cyan-100",
  },
  rose: {
    card: "border-rose-200/80 bg-gradient-to-br from-rose-50 via-white to-pink-50",
    iconWrap: "border-rose-200 bg-rose-100 text-rose-700",
    button: "border-rose-200 bg-white/90 text-rose-900 hover:bg-rose-100",
  },
  slate: {
    card: "border-slate-200/90 bg-gradient-to-br from-slate-50 via-white to-zinc-100",
    iconWrap: "border-slate-200 bg-white text-slate-700",
    button: "border-slate-200 bg-white/90 text-slate-900 hover:bg-slate-100",
  },
  indigo: {
    card: "border-indigo-200/80 bg-gradient-to-br from-indigo-50 via-white to-blue-50",
    iconWrap: "border-indigo-200 bg-indigo-100 text-indigo-700",
    button: "border-indigo-200 bg-white/90 text-indigo-900 hover:bg-indigo-100",
  },
  neutral: {
    card: "border-slate-200/80 bg-gradient-to-br from-white via-slate-50 to-zinc-50",
    iconWrap: "border-slate-200 bg-white text-slate-700",
    button: "border-slate-200 bg-white/90 text-slate-900 hover:bg-slate-100",
  },
};

const newMemberDescriptions: Record<string, string> = {
  "Üye Takibi": "Yeni kayıtları, operasyon akışını ve günlük incelemeleri merkezden yönet.",
  "Loginli Üyeler & Roller": "Loginli üye rol atamaları, görünürlükler ve profil alanlarını düzenle.",
  "Roller & Featurelar": "Rol bazlı feature açma, kapama ve varsayılanları stratejik olarak kurgula.",
  "Attribute Yönetimi": "Alan kuralları, zorunluluklar ve görünürlük davranışlarını güncelle.",
  "Profile Sections": "Profil bileşen sıralarını ve role göre section akışını şekillendir.",
  "Taxonomy Yönetimi": "Alt kategori, alt tip ve seçilebilir taxonomy seçeneklerini yönet.",
  "Feature Override": "Kullanıcı bazlı override ile standart akıştan kontrollü sapmalar oluştur.",
  "Kullanım Klavuzu": "Yeni üyeler sistemindeki ekranları hangi sırayla ve hangi durumda kullanacağını madde madde aç.",
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
  Yardım: "Yetkilendirme sisteminin basit rehberini ve kullanım kılavuzunu aç.",
};

const communityDescriptions: Record<string, string> = {
  Topluluklar: "Topluluk landing kayıtlarını incele, onayla ve yayına al.",
  "Topluluk Editörleri": "Landing bazlı editör atamalarını güvenli şekilde yönet.",
  "Topluluk Kullanma Kılavuzu": "Topluluk akışının editör ve admin kullanım rehberine ulaş.",
  "Diplomatik Profiller": "Misyon ve diplomatik profil içeriklerini merkezi şekilde aç.",
};

const dataDescriptions: Record<string, string> = {
  Kataloglar: "Yeni katalog kayıtlarını tek ekranda ara, filtrele ve detaylarını incele.",
};

const otherRecordDescriptions: Record<string, string> = {
  Anketler: "Anket setlerini, cevapları ve yayın akışını yönet.",
  "19 Mayıs Kelime": "19 kelimelik fikir gönderimlerini moderasyon kuyruğundan yönet.",
  "19 Mayıs Anı": "19 Mayıs anı içeriklerini tek ekranda gözden geçir.",
  "19 Mayıs Fikir": "İnaktif fikir akışını ayrı bir kayıt paneli olarak aç.",
};

const dashboardDescriptions: Record<string, string> = {
  "Dashboard Merkezi": "Admin workspace girişini ve genel paneli tek karttan aç.",
  CC: "Command Center akışını, görev yoğunluğunu ve koordinasyon araçlarını aç.",
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
  tone: "rose" as const,
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
    tone: "rose" as const,
  },
  {
    key: "inactive-may19-fikir",
    to: "/admin/may19/kelime",
    label: "19 Mayıs Fikir",
    description: "İnaktif fikir akışı için hızlı moderasyon girişini kullan.",
    icon: ScrollText,
    kind: "internal" as const,
    eyebrow: "İnaktif",
    tone: "rose" as const,
  },
] satisfies NavCardItem[];

const orderedNavCards: NavCardItem[] = [
  ...newMemberSystemNavItems.map((item) => ({
    key: item.to,
    label: item.label,
    description: newMemberDescriptions[item.label] ?? "Bu admin ekranını aç.",
    icon: item.icon,
    kind: "internal" as const,
    to: item.to,
    eyebrow: "Üyeler",
    tone: "sky" as const,
  })),
  ...primaryAdminNavItems.map((item) => ({
    key: item.to,
    label: item.label,
    description: primaryDescriptions[item.label] ?? "Bu admin ekranını aç.",
    icon: item.icon,
    kind: "internal" as const,
    to: item.to,
    eyebrow: "Kısa Yollar",
    tone: "violet" as const,
  })),
  ...otherActionNavItems.map((item) => ({
    key: item.to,
    label: item.label,
    description: otherActionDescriptions[item.label] ?? "Bu admin ekranını aç.",
    icon: item.icon,
    kind: "internal" as const,
    to: item.to,
    eyebrow: "Diğer İşlemler",
    tone: "amber" as const,
  })),
  ...communityNavItems.map((item) => ({
    key: item.to,
    label: item.label,
    description: communityDescriptions[item.label] ?? "Bu topluluk ekranını aç.",
    icon: item.icon,
    kind: "internal" as const,
    to: item.to,
    eyebrow: "Topluluklar",
    tone: "emerald" as const,
  })),
  ...dataNavItems.map((item) => ({
    key: item.to,
    label: item.label,
    description: dataDescriptions[item.label] ?? "Bu veri ekranını aç.",
    icon: item.icon,
    kind: "internal" as const,
    to: item.to,
    eyebrow: "Data",
    tone: "cyan" as const,
  })),
  ...otherRecordNavItems.map((item) => ({
    key: item.to,
    label: item.label,
    description: otherRecordDescriptions[item.label] ?? "Bu kayıt ekranını aç.",
    icon: item.icon,
    kind: "internal" as const,
    to: item.to,
    eyebrow: "Diğer Kayıtlar",
    tone: "rose" as const,
  })),
  ...may19RecordNavItems.map((item) => ({
    key: item.to,
    label: item.label,
    description: otherRecordDescriptions[item.label] ?? "Bu moderasyon ekranını aç.",
    icon: item.icon,
    kind: "internal" as const,
    to: item.to,
    eyebrow: "19 Mayıs",
    tone: "rose" as const,
  })),
  ...inactiveRecordItems,
  ...advisorRecordItems,
  ...workspaceAdminNavItems.map((item) => ({
    key: item.key,
    label: item.label,
    description: dashboardDescriptions[item.label] ?? "Bu workspace aracını aç.",
    icon: item.icon,
    kind: "internal" as const,
    to: item.to,
    eyebrow: item.label === "CC" ? "Command Center" : "Dashboard",
    tone: "slate" as const,
  })),
  ...adminPanelDocNavItems.map((item) => ({
    key: item.key,
    label: item.label,
    description: "Admin wiki ve doküman setindeki ilgili sayfayı doğrudan aç.",
    icon: item.icon,
    kind: "internal" as const,
    to: item.to,
    eyebrow: "Doküman",
    tone: "slate" as const,
  })),
  ...externalAdminNavItems.map((item) => ({
    key: item.href,
    label: item.label,
    description: externalAdminLinkDescriptions[item.label] ?? "Dış bağlantıyı yeni sekmede aç.",
    icon: item.icon,
    kind: "external" as const,
    href: item.href,
    eyebrow: "Dış Bağlantılar",
    tone: "indigo" as const,
  })),
];

function AdminNavCard({ item, onLogout }: { item: NavCardItem; onLogout: () => void | Promise<void> }) {
  const tone = toneClasses[item.tone];

  return (
    <article
      className={`group relative overflow-hidden rounded-[26px] border p-4 shadow-[0_18px_55px_-40px_rgba(15,23,42,0.55)] backdrop-blur transition duration-200 hover:-translate-y-1 hover:shadow-[0_24px_70px_-34px_rgba(15,23,42,0.42)] ${tone.card}`}
    >
      <div className="pointer-events-none absolute inset-x-5 top-0 h-20 rounded-b-full bg-gradient-to-b from-white/80 to-transparent opacity-80" />
      <div className="relative flex h-full flex-col gap-4">
        <div className="flex items-start justify-between gap-3">
          <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border shadow-sm ${tone.iconWrap}`}>
            <item.icon className="h-4.5 w-4.5" />
          </div>
          <div className="rounded-full border border-slate-200/80 bg-white/90 px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.16em] text-slate-500">
            {item.eyebrow}
          </div>
        </div>

        <div className="space-y-2">
          <h2 className="text-sm font-semibold leading-5 text-slate-950">{item.label}</h2>
          <p className="text-xs leading-5 text-slate-600">{item.description}</p>
        </div>

        <div className="mt-auto">
          {item.kind === "internal" ? (
            <Button asChild variant="outline" size="sm" className={`h-9 w-full justify-between rounded-xl text-xs shadow-sm ${tone.button}`}>
              <Link to={item.to}>
                Ekranı Aç
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          ) : item.kind === "external" ? (
            <Button asChild variant="outline" size="sm" className={`h-9 w-full justify-between rounded-xl text-xs shadow-sm ${tone.button}`}>
              <a href={item.href} target="_blank" rel="noreferrer">
                Bağlantıyı Aç
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </Button>
          ) : (
            <Button variant="outline" size="sm" className={`h-9 w-full justify-between rounded-xl text-xs shadow-sm ${tone.button}`} onClick={() => void onLogout()}>
              Çıkış
              <LogOut className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>
    </article>
  );
}

const AdminHomePage = () => {
  const { session, onLogout } = useAdminOutletContext();
  const [searchQuery, setSearchQuery] = useState("");
  const navCards = [
    ...orderedNavCards,
    {
      key: "logout",
      label: "Çıkış",
      description: "Admin oturumunu güvenli şekilde kapat ve giriş ekranına dön.",
      icon: LogOut,
      kind: "action" as const,
      action: "logout" as const,
      eyebrow: "Çıkış",
      tone: "neutral" as const,
    },
  ];
  const normalizedSearchQuery = searchQuery.trim().toLocaleLowerCase("tr-TR");
  const filteredNavCards = useMemo(() => {
    if (!normalizedSearchQuery) return navCards;

    return navCards.filter((item) =>
      [item.label, item.description, item.eyebrow]
        .join(" ")
        .toLocaleLowerCase("tr-TR")
        .includes(normalizedSearchQuery),
    );
  }, [navCards, normalizedSearchQuery]);

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
              <CardTitle className="text-3xl tracking-tight text-slate-950 lg:text-4xl">Header menüsündeki tüm item&apos;lar artık tek gridde.</CardTitle>
              <CardDescription className="max-w-3xl text-sm leading-6 text-slate-600 lg:text-base">
                Tüm admin bağlantıları soldan sağa aynı akışta dizilir. Dropdown dolaşmadan her ekranı renkli kartlardan açabilir, doküman ve dış yüzeylere aynı landing üzerinden ulaşabilirsin.
              </CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <div className="inline-flex items-center rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-xs text-slate-700 shadow-sm">
                6 kolonlu hızlı erişim
              </div>
              <div className="inline-flex items-center rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-xs text-slate-700 shadow-sm">
                Soldan sağa sıralı kart akışı
              </div>
              <div className="inline-flex items-center rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-xs text-slate-700 shadow-sm">
                Premium renk kodlu görünüm
              </div>
            </div>
          </div>

          <div className="grid min-w-full gap-3 sm:grid-cols-2 lg:min-w-[350px] lg:max-w-[390px]">
            <div className="rounded-[24px] border border-white/80 bg-white/86 p-4 shadow-sm backdrop-blur">
              <div className="text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-500">Aktif kullanıcı</div>
              <div className="mt-2 text-sm font-semibold text-slate-950">{session.user.email}</div>
              <div className="mt-1 text-xs leading-5 text-slate-600">Bu admin landing görünümü oturum açan hesap için kişiselleştirilmiş olarak yüklenir.</div>
            </div>
            <div className="rounded-[24px] border border-white/80 bg-white/86 p-4 shadow-sm backdrop-blur">
              <div className="text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-500">Kart sayısı</div>
              <div className="mt-2 text-3xl font-semibold text-slate-950">{navCards.length}</div>
              <div className="mt-1 text-xs leading-5 text-slate-600">Header kaynaklarının tamamı tek bir ordered grid içinde sunuluyor.</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="rounded-[26px] border border-slate-200/80 bg-white/90 p-3 shadow-[0_18px_60px_-42px_rgba(15,23,42,0.35)] backdrop-blur">
        <label className="flex items-center gap-3 rounded-[20px] border border-slate-200 bg-slate-50/80 px-4 py-3 shadow-inner transition focus-within:border-sky-300 focus-within:bg-white focus-within:ring-2 focus-within:ring-sky-100">
          <Search className="h-4 w-4 shrink-0 text-slate-400" />
          <Input
            type="search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            aria-label="Admin kartlarında ara"
            placeholder="Kart adı, açıklama veya kategori ara"
            className="h-auto border-0 bg-transparent px-0 py-0 text-sm shadow-none ring-0 placeholder:text-slate-400 focus-visible:ring-0"
          />
        </label>
      </div>

      {filteredNavCards.length ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
          {filteredNavCards.map((item) => (
            <AdminNavCard key={item.key} item={item} onLogout={onLogout} />
          ))}
        </div>
      ) : (
        <Card className="rounded-[26px] border-dashed border-slate-300 bg-white/80 shadow-[0_18px_60px_-42px_rgba(15,23,42,0.22)]">
          <CardContent className="flex flex-col items-start gap-2 p-6">
            <div className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              Filtre Sonucu
            </div>
            <CardTitle className="text-base text-slate-950">Aramayla eslesen kart bulunamadi.</CardTitle>
            <CardDescription className="text-sm text-slate-600">
              Daha genel bir kelime dene ya da aramayi temizleyip tum admin kartlarini yeniden goster.
            </CardDescription>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AdminHomePage;
