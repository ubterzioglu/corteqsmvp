// Sonuç görünümü — result_kind'a göre özet + breakdown + CTA. RelocationToolPage ve
// RelocationToolResultPage paylaşır. docs/10tool/00 §UX (sonuç ekranı).
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScoreMeter } from "@/components/relocation/tools/ScoreMeter";
import { ScoreBreakdownCard } from "@/components/relocation/tools/ScoreBreakdownCard";
import { RankedListCard } from "@/components/relocation/tools/RankedListCard";
import { ChecklistTimeline } from "@/components/relocation/tools/ChecklistTimeline";
import { ComparisonTable } from "@/components/relocation/tools/ComparisonTable";
import { MatchList } from "@/components/relocation/tools/MatchList";
import { ResultCtaPanel } from "@/components/relocation/tools/ResultCtaPanel";
import { TOOLS_UI_COPY, bucketLabel, dimensionLabelsForResult } from "@/lib/relocation-tools-copy";
import type { RelocationToolResultPayload, ToolCta } from "@/lib/relocation-tools-types";

interface ToolResultViewProps {
  result: RelocationToolResultPayload;
  onCtaClick?: (cta: ToolCta) => void;
  /** #5 diaspora: güvenli kartta tanışma isteği (candidate_id). */
  onRequestIntro?: (candidateId: string) => void;
}

/** persona aracında başlık = persona etiketi; diğerlerinde skor göstergesi. */
function ResultHeadline({ result }: { result: RelocationToolResultPayload }) {
  if (result.result_kind === "persona") {
    const personaLabel = (result.primary_result.persona_label as string) ?? result.score_bucket ?? "";
    return (
      <div>
        <span className="text-2xl font-extrabold text-foreground">{personaLabel}</span>
        {(result.primary_result.is_hybrid as boolean) && (
          <span className="ml-2 text-sm text-muted-foreground">(hibrit)</span>
        )}
      </div>
    );
  }
  // #9 (top_relocation_challenge) bucket = kategori anahtarı (kalite bandı değil) → rozet gösterme.
  const showBucket = result.tool_key !== "top_relocation_challenge";
  return (
    <ScoreMeter
      score={result.total_score}
      bucketLabel={showBucket ? bucketLabel(result.score_bucket) : null}
    />
  );
}

export function ToolResultView({ result, onCtaClick, onRequestIntro }: ToolResultViewProps) {
  const labels = dimensionLabelsForResult(result.result_kind, result.tool_key);
  const rankedItems = Array.isArray(result.recommendations)
    ? (result.recommendations as Array<Record<string, unknown>>)
    : [];
  // checklist: görevler primary_result.tasks içinde.
  const checklistTasks = Array.isArray(
    (result.primary_result as Record<string, unknown>)?.tasks,
  )
    ? ((result.primary_result as Record<string, unknown>).tasks as Array<Record<string, unknown>>)
    : [];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{TOOLS_UI_COPY.resultTitle}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <ResultHeadline result={result} />
          {result.explanations.length > 0 && (
            <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
              {result.explanations.map((line, i) => (
                <li key={i}>{line}</li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {result.result_kind === "checklist" ? (
        <ChecklistTimeline title={TOOLS_UI_COPY.checklistTitle} tasks={checklistTasks} />
      ) : result.result_kind === "match_list" ? (
        <MatchList
          title={TOOLS_UI_COPY.matchListTitle}
          matches={rankedItems}
          onRequestIntro={onRequestIntro}
        />
      ) : result.result_kind === "comparison" ? (
        <ComparisonTable title={TOOLS_UI_COPY.comparisonTitle} rows={rankedItems} />
      ) : result.result_kind === "ranked_list" ? (
        <RankedListCard
          title={TOOLS_UI_COPY.rankedListTitle}
          items={rankedItems}
          dimensionLabels={labels}
        />
      ) : (
        <ScoreBreakdownCard subScores={result.sub_scores} dimensionLabels={labels} />
      )}

      <ResultCtaPanel ctas={result.ctas} onCtaClick={onCtaClick} />

      <p className="text-xs text-muted-foreground">{TOOLS_UI_COPY.privacyNote}</p>
    </div>
  );
}
