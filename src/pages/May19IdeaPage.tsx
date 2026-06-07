import May19CampaignShell from "@/components/may19/May19CampaignShell";
import May19SubmissionForm from "@/components/may19/May19SubmissionForm";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
const heroLandmarks = "/denemeremake.png";

export default function May19IdeaPage() {
  return (
    <May19CampaignShell
      eyebrow="19 MAYIS ATATÜRK'Ü ANMA, GENÇLİK VE SPOR BAYRAMI"
      title="19 Kelimelik Fikrini Gönder"
      description="Diasporayı güçlendirecek fikrini bu formdan ilet. Uygun içerikler moderasyon sonrası global akışa dahil edilir."
      heroImageSrc={heroLandmarks}
      heroImageAlt="CorteQS kahraman görseli"
    >
      <main className="container mx-auto px-4 pb-16 pt-10 lg:px-6 lg:pb-20">
        <section className="mx-auto max-w-3xl space-y-4">
          <p className="text-sm leading-7 text-slate-700">
            Hadi bayram coşkusunu birlikte yaşayalım. 19 kelimelik fikrini gönder.
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
          <May19SubmissionForm kind="idea" />
        </section>
      </main>
    </May19CampaignShell>
  );
}
