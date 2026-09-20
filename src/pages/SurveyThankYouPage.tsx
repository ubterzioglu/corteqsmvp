import SurveySuccessMessage from "@/components/surveys/SurveySuccessMessage";
import { useSeo } from "@/lib/seo";

export default function SurveyThankYouPage() {
  // Thin content teşekkür sayfası — indekslenirse anket sayfasıyla rekabet eder.
  useSeo({ title: "Teşekkürler | CorteQS", robots: "noindex, follow" });

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#fffdf9_0%,#f8fafc_100%)] px-4 py-14">
      <SurveySuccessMessage />
    </main>
  );
}
