import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { BookOpen, RadioTower } from "lucide-react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import RadarHaberlerSection from "@/components/radar/RadarHaberlerSection";
import RadarRehberlerSection from "@/components/radar/RadarRehberlerSection";
import { PAGE_SEO } from "@/lib/page-seo";
import { applySeo } from "@/lib/seo";

type RadarTab = "haberler" | "rehberler";

const TAB_PATHS: Record<RadarTab, string> = {
  haberler: "/radar",
  rehberler: "/radar/rehberler",
};

const TAB_SEO: Record<RadarTab, { title: string; description: string; canonicalPath: string }> = {
  haberler: PAGE_SEO.radarNews,
  rehberler: PAGE_SEO.radarGuides,
};

/**
 * Radar + Blog birleşik hub'ı.
 * "Haberler" (marquee akışı) ve "Rehberler" (ülke blog rehberleri) sekmelerini
 * tek sayfada toplar. Aktif sekme URL'den belirlenir:
 *   /radar            → Haberler
 *   /radar/rehberler  → Rehberler
 */
const RadarHubPage = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const activeTab: RadarTab = location.pathname.startsWith("/radar/rehberler") ? "rehberler" : "haberler";

  useEffect(() => {
    return applySeo({ ...TAB_SEO[activeTab], ogType: "website" });
  }, [activeTab]);

  const handleTabChange = (value: string) => {
    const next = value as RadarTab;
    if (next !== activeTab) {
      navigate(TAB_PATHS[next]);
    }
  };

  return (
    <main className="min-h-screen bg-background">
      <section className="border-b border-border bg-[linear-gradient(90deg,hsl(var(--background)),hsl(var(--secondary)),hsl(var(--background)))]">
        <div className="container mx-auto px-4 py-8 md:py-12">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="min-w-0 flex-1 space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-sm font-semibold text-primary">
                <RadioTower className="h-4 w-4" />
                CorteQS Radar
              </div>
              <div className="space-y-2">
                <h1 className="truncate text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl md:text-4xl">
                  Haberler, Duyurular ve Ülke Rehberleri
                </h1>
                <p className="text-sm leading-relaxed text-muted-foreground md:text-base">
                  Türk diasporasından haberler, topluluk sinyalleri ve ülke ülke rehberler — tek sayfada.
                </p>
              </div>
            </div>
            <img
              src="/radar-hero.png"
              alt=""
              aria-hidden="true"
              loading="lazy"
              width={1376}
              height={768}
              className="hidden h-28 w-auto shrink-0 rounded-2xl object-cover shadow-[0_18px_45px_-28px_rgba(15,23,42,0.4)] md:block lg:h-32"
            />
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-8 md:py-12">
        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList className="mb-8 h-auto flex-wrap gap-1">
            <TabsTrigger value="haberler" className="gap-2">
              <RadioTower className="h-4 w-4" />
              Haberler
            </TabsTrigger>
            <TabsTrigger value="rehberler" className="gap-2">
              <BookOpen className="h-4 w-4" />
              Rehberler
            </TabsTrigger>
          </TabsList>

          <TabsContent value="haberler">
            <RadarHaberlerSection />
          </TabsContent>
          <TabsContent value="rehberler">
            <RadarRehberlerSection />
          </TabsContent>
        </Tabs>
      </section>
    </main>
  );
};

export default RadarHubPage;
