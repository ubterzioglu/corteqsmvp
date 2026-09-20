import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { BookOpen, RadioTower } from "lucide-react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadarHero } from "@/components/radar/RadarHero";
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
      {/* Hero — Etkinlikler ile aynı kabuk (components/common/PageHero). */}
      <div className="container mx-auto px-4 pt-6">
        <RadarHero />
      </div>

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
