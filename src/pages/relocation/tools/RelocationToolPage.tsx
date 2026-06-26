// Araç sayfası — /relocation/tools/:toolSlug. Landing → mod seçimi → stepper → sonuç (inline).
// Login zorunlu (App.tsx RequireAuth). docs/10tool/00 §UX akışı.
import { useState } from "react";
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
import type { ToolMode } from "@/lib/relocation-tools-types";

export default function RelocationToolPage() {
  const { toolSlug = "" } = useParams<{ toolSlug: string }>();
  const { toast } = useToast();
  const [mode, setMode] = useState<ToolMode | null>(null);

  const toolQuery = useQuery({
    queryKey: relocationToolsKeys.tool(toolSlug),
    queryFn: () => getToolBySlug(toolSlug),
    enabled: !!toolSlug,
  });

  const tool = toolQuery.data;

  const session = useRelocationToolSession({
    toolKey: tool?.key ?? "",
    onError: (message) =>
      toast({ title: "Sonuç hesaplanamadı", description: message, variant: "destructive" }),
  });

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

  return (
    <div className="container mx-auto max-w-3xl px-4 py-6">
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
