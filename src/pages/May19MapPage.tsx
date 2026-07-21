import May19CampaignShell from "@/components/may19/May19CampaignShell";
import { useSeo } from "@/lib/seo";

export default function May19MapPage() {
  useSeo(
    {
      title: "19 Mayıs Global Diaspora Haritası | CorteQS",
      description:
        "Global diaspora haritasında yerinizi işaretleyin ve 19 Mayıs coşkusunu dünyanın dört bir yanındaki Türk diasporasıyla paylaşın.",
      canonicalPath: "/19051919/harita",
    },
    [],
  );

  return (
    <May19CampaignShell
      eyebrow="GLOBAL DIASPORA HARİTASI"
      title="19 Mayıs Global Harita"
      description="Global diaspora haritasına katılım için aşağıdaki butonu kullanarak doğrudan harita platformuna geçebilirsin."
      primaryCta={{ label: "Haritaya Katıl", to: "https://globe.corteqs.net/" }}
      secondaryCta={{ label: "Modüllere Git", to: "/19051919#modules" }}
    >
      <main className="bg-[linear-gradient(180deg,#fffaf5_0%,#fff_50%,#f8fbff_100%)]">
        <section className="container mx-auto px-4 pb-16 pt-10 text-center lg:px-6 lg:pb-20">
          <a
            href="https://globe.corteqs.net/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-14 items-center justify-center rounded-full bg-emerald-600 px-10 text-lg font-extrabold text-white shadow-[0_20px_50px_rgba(5,150,105,0.35)] transition hover:-translate-y-0.5 hover:bg-emerald-700"
          >
            Hadi sen de katıl!
          </a>
        </section>
      </main>
    </May19CampaignShell>
  );
}
