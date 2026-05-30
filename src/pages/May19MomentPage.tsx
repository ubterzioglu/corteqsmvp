import May19CampaignShell from "@/components/may19/May19CampaignShell";
import May19SubmissionForm from "@/components/may19/May19SubmissionForm";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import heroLandmarks from "../../denemeremake.png";

export default function May19MomentPage() {
  return (
    <May19CampaignShell
      eyebrow="19 MAYIS ATATÜRK'Ü ANMA, GENÇLİK VE SPOR BAYRAMI"
      title="19 Mayıs Anını Paylaş"
      description="Bayram coşkusunu gösteren anı, not veya içeriğini bu formdan ilet. Seçilen gönderimler moderasyon sonrası global yayınlara eklenir."
      heroImageSrc={heroLandmarks}
      heroImageAlt="CorteQS kahraman gorseli"
    >
      <main className="container mx-auto px-4 pb-16 pt-10 lg:px-6 lg:pb-20">
        <section className="mx-auto max-w-3xl space-y-4">
          <p className="text-sm leading-7 text-slate-700">
            Hadi bayram coşkusunu birlikte yaşayalım. 19 Mayıs anını bizimle paylaş!
          </p>
          <div className="flex justify-end">
            <Button
              asChild
              size="sm"
              className="border border-rose-200 bg-white text-rose-700 hover:bg-rose-50"
            >
              <Link to="/19051919">19 Mayıs Sayfasına Dön</Link>
            </Button>
          </div>
          <May19SubmissionForm kind="moment" />
        </section>
      </main>
    </May19CampaignShell>
  );
}
