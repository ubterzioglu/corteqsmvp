// Araç sayfası — /tools/:toolSlug. Landing → stepper → sonuç (inline).
// Login zorunlu (App.tsx RequireAuth); hub (/tools) login'siz, tıklayınca buraya
// gelince guard'a takılıp next parametresiyle login'e yönlenir. docs/10tool/00 §UX akışı.
// NOT: Bazı Almanya araçları DB skorlama motoruna uymaz (deterministik hesaplayıcı / karar ağacı /
// soru havuzu) → germany-standalone-tools registry üzerinden kendi bileşenleriyle render edilir.
// Mod seçimi (hızlı/detaylı) kaldırıldı — her araç tek modlu sabit 20 sorudan oluşur
// (relocation_tool_questions.mode = 'both'); session RPC'si şema uyumluluğu için sabit
// 'detailed' mode değeriyle çağrılır.
import { Suspense, lazy, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { QuestionStepper } from "@/components/relocation/tools/QuestionStepper";
import { ToolResultView } from "@/components/relocation/tools/ToolResultView";
import { Button } from "@/components/ui/button";
import { getToolBySlug, requestDiasporaIntro } from "@/lib/relocation-tools-api";
import { relocationToolsKeys } from "@/lib/relocation-tools-query-keys";
import { useRelocationToolSession } from "@/hooks/useRelocationToolSession";
import { TOOLS_UI_COPY } from "@/lib/relocation-tools-copy";
import { toolHeroImage } from "@/lib/relocation-tools-images";
import { getGermanyStandaloneTool } from "@/lib/germany-standalone-tools";

const TOOL_SESSION_MODE = "detailed" as const;

export default function RelocationToolPage() {
  const { toolSlug = "" } = useParams<{ toolSlug: string }>();
  const { toast } = useToast();
  const [started, setStarted] = useState(false);

  // Standalone Almanya aracı mı? Öyleyse session motorunu atla, kendi bileşenini lazy yükle.
  // Hook sırası bozulmasın diye TÜM hook'lar koşulsuz çağrılır; standalone return en sonda.
  const standalone = getGermanyStandaloneTool(toolSlug);
  const StandaloneComponent = useMemo(
    () => (standalone ? lazy(standalone.load) : null),
    [standalone],
  );

  const toolQuery = useQuery({
    queryKey: relocationToolsKeys.tool(toolSlug),
    queryFn: () => getToolBySlug(toolSlug),
    enabled: !!toolSlug && !standalone,
  });

  const tool = toolQuery.data;

  const session = useRelocationToolSession({
    toolKey: tool?.key ?? "",
    onError: (message) =>
      toast({ title: "Sonuç hesaplanamadı", description: message, variant: "destructive" }),
  });

  // Standalone araç: kendi bileşenini render et (session/landing/stepper akışını atla).
  if (StandaloneComponent) {
    return (
      <Suspense
        fallback={
          <div className="container mx-auto max-w-3xl px-4 py-6 text-sm text-muted-foreground">
            {TOOLS_UI_COPY.loading}
          </div>
        }
      >
        <StandaloneComponent />
      </Suspense>
    );
  }

  if (toolQuery.isLoading) {
    return (
      <div className="container mx-auto max-w-3xl px-4 py-6 text-sm text-muted-foreground">
        {TOOLS_UI_COPY.loading}
      </div>
    );
  }
  if (!tool) {
    return (
      <div className="container mx-auto max-w-3xl px-4 py-6 text-sm text-destructive">
        {TOOLS_UI_COPY.notFound}
      </div>
    );
  }

  const resetAll = () => {
    setStarted(false);
    session.reset();
  };

  const result = session.result;
  // Hero görsel yalnızca karşılama ekranında (sorular başlamadan önce) gösterilir.
  const heroImage = toolHeroImage(tool.slug);
  const showHero = !result && !started && !!heroImage;

  return (
    <div className="container mx-auto max-w-3xl px-4 py-6">
      {showHero && (
        <img
          src={heroImage}
          alt=""
          className="mb-6 aspect-[16/9] w-full rounded-xl object-cover shadow-sm"
        />
      )}
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-extrabold text-foreground">{tool.title_tr}</h1>
        <p className="text-sm text-muted-foreground">{tool.summary_tr}</p>
      </div>

      {result ? (
        <div className="space-y-4">
          <ToolResultView
            result={result}
            onRequestIntro={(candidateId) => {
              void requestDiasporaIntro(candidateId)
                .then(() =>
                  toast({
                    title: "Tanışma isteği gönderildi",
                    description: "Karşı taraf kabul ederse iletişim açılır.",
                  }),
                )
                .catch((err: unknown) =>
                  toast({
                    title: "İstek gönderilemedi",
                    description: err instanceof Error ? err.message : "Beklenmeyen hata",
                    variant: "destructive",
                  }),
                );
            }}
          />
          <div className="flex justify-end">
            <Button variant="ghost" onClick={resetAll}>
              {TOOLS_UI_COPY.retake}
            </Button>
          </div>
        </div>
      ) : (
        <QuestionStepper
          questions={tool.questions}
          isSubmitting={session.isRunning}
          onAnswerStart={() => setStarted(true)}
          onComplete={(answers) => session.run({ mode: TOOL_SESSION_MODE, answers })}
        />
      )}
    </div>
  );
}
