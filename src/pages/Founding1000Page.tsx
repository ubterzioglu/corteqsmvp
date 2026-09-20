import Founding1000Section from "@/components/Founding1000Section";
import { Founding1000Hero } from "@/components/founding/Founding1000Hero";
import { PAGE_SEO } from "@/lib/page-seo";
import { useSeo } from "@/lib/seo";

const Founding1000Page = () => {
  useSeo(PAGE_SEO.founding1000, []);

  return (
    <div className="min-h-screen bg-background">
      <main id="main">
        {/* Hero, Etkinlikler/Radar/Araçlar ile aynı kabuk; sayfanın tek `h1`'i buradan gelir. */}
        <div className="container mx-auto px-4 pt-6">
          <Founding1000Hero />
        </div>
        <Founding1000Section />
      </main>
    </div>
  );
};

export default Founding1000Page;
