// Araç sayfası — /relocation/tools/:toolSlug. Landing → mod seçimi → stepper → sonuç (inline).
// Login zorunlu (App.tsx RequireAuth). docs/10tool/00 §UX akışı.
// NOT: Bazı Almanya araçları DB skorlama motoruna uymaz (deterministik hesaplayıcı / karar ağacı /
// soru havuzu) → germany-standalone-tools registry üzerinden kendi bileşenleriyle render edilir.
import { Suspense, lazy, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { QuestionStepper } from "@/components/relocation/tools/QuestionStepper";
import { ToolModeSelector } from "@/components/relocation/tools/ToolModeSelector";
import { ToolResultView } from "@/components/relocation/tools/ToolResultView";
import { Button } from "@/components/ui/button";
import { getToolBySlug, requestDiasporaIntro } from "@/lib/relocation-tools-api";
import { relocationToolsKeys } from "@/lib/relocation-tools-query-keys";
import { useRelocationToolSession } from "@/hooks/useRelocationToolSession";
import { TOOLS_UI_COPY } from "@/lib/relocation-tools-copy";
import { toolHeroImage } from "@/lib/relocation-tools-images";
import { getGermanyStandaloneTool } from "@/lib/germany-standalone-tools";
import type { ToolMode } from "@/lib/relocation-tools-types";

export default function RelocationToolPage() {
  const { toolSlug = "" } = useParams<{ toolSlug: string }>();
  const { toast } = useToast();
  const [mode, setMode] = useState<ToolMode | null>(null);

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
    setMode(null);
    session.reset();
  };

  const result = session.result;
  // Hero görsel yalnızca karşılama ekranında (mod seçimi öncesi) gösterilir; soru/sonuç akışını sadeleştir.
  const heroImage = toolHeroImage(tool.slug);
  const showHero = !result && mode === null && !!heroImage;

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
      ) : mode === null ? (
        <ToolModeSelector
          quickCount={tool.quick_question_count}
          detailedCount={tool.detailed_question_count}
          onSelect={setMode}
        />
      ) : (
        <QuestionStepper
          questions={tool.questions}
          mode={mode}
          isSubmitting={session.isRunning}
          onComplete={(answers) => session.run({ mode, answers })}
        />
      )}
    </div>
  );
}
