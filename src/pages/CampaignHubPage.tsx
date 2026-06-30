import { Link } from "react-router-dom";
import { ArrowRight, Crown, PenLine, Sparkles, Video } from "lucide-react";
import { PAGE_SEO } from "@/lib/page-seo";
import { useSeo } from "@/lib/seo";

interface CampaignCard {
  to: string;
  icon: React.ElementType;
  title: string;
  desc: string;
}

const campaigns: CampaignCard[] = [
  {
    to: "/campaign/founding-1000",
    icon: Crown,
    title: "Founding 1000",
    desc: "Global Türk diasporasının dijital haritasında erken yerinizi alın. Founding Verified User avantajları ve sınırlı kontenjan.",
  },
  {
    to: "/campaign/vlogger",
    icon: Video,
    title: "Vlogger Yarışması",
    desc: "Hikâyeni ya da Global Türklerin hikâyesini video ile anlat, dünyaya duyur ve €1.500 büyük ödülü kazan.",
  },
  {
    to: "/campaign/blogger",
    icon: PenLine,
    title: "Blogger Yarışması",
    desc: "Diasporadaki yaşamını, kültürünü ve deneyimlerini en iyi blog yazısıyla anlat, ödüller için yarış.",
  },
];

const cardClass =
  "group flex h-full flex-col rounded-2xl border border-white/60 bg-card/85 p-7 shadow-sm backdrop-blur-sm transition-all hover:-translate-y-1 hover:border-primary/35 hover:shadow-lg";

const CampaignHubPage = () => {
  useSeo(PAGE_SEO.campaign, []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <main id="main">
        <section className="relative overflow-hidden bg-gradient-to-br from-background via-card to-secondary/40">
          <div
            className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,hsl(var(--accent)/0.08),hsl(var(--primary)/0.07),hsl(var(--background)))]"
            aria-hidden
          />

          <div className="container mx-auto px-4 py-16 lg:py-24 relative z-10">
            {/* Header */}
            <div className="text-center max-w-3xl mx-auto mb-12 lg:mb-16">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="text-primary text-sm font-semibold tracking-wider uppercase">
                  CorteQS Kampanyaları
                </span>
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight mb-6">
                Aktif <span className="text-accent">kampanyalar</span> ve yarışmalar
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
                Founding 1000 erken üyelik programından içerik yarışmalarına; CorteQS topluluğunda
                erken görünürlük kazanmanın yollarını keşfedin.
              </p>
            </div>

            {/* Cards */}
            <div className="grid gap-6 md:grid-cols-3 max-w-5xl mx-auto">
              {campaigns.map((c) => (
                <Link key={c.to} to={c.to} className={cardClass}>
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 mb-5">
                    <c.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h2 className="text-xl font-bold text-foreground mb-2">{c.title}</h2>
                  <p className="text-muted-foreground text-sm leading-relaxed flex-1">{c.desc}</p>
                  <span className="mt-6 inline-flex items-center gap-2 text-primary text-sm font-semibold">
                    Detayları gör
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default CampaignHubPage;
