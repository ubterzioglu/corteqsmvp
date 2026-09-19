import Founding1000Section from "@/components/Founding1000Section";
import { PAGE_SEO } from "@/lib/page-seo";
import { useSeo } from "@/lib/seo";

const Founding1000Page = () => {
  useSeo(PAGE_SEO.founding1000, []);

  return (
    <div className="min-h-screen bg-background">
      <main id="main">
        <Founding1000Section />
      </main>
    </div>
  );
};

export default Founding1000Page;
