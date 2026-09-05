// Sonuç görünümü — result_kind'a göre özet + breakdown + CTA. RelocationToolPage ve
// RelocationToolResultPage paylaşır. docs/10tool/00 §UX (sonuç ekranı).
import { AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BackToToolsButton } from "@/components/relocation/tools/BackToToolsButton";
import { ScoreMeter } from "@/components/relocation/tools/ScoreMeter";
import { ScoreBreakdownCard } from "@/components/relocation/tools/ScoreBreakdownCard";
import { RankedListCard } from "@/components/relocation/tools/RankedListCard";
import { ChecklistTimeline } from "@/components/relocation/tools/ChecklistTimeline";
import { ComparisonTable } from "@/components/relocation/tools/ComparisonTable";
import { MatchList } from "@/components/relocation/tools/MatchList";
import { ResultCtaPanel } from "@/components/relocation/tools/ResultCtaPanel";
import { WeakestAreasCard } from "@/components/relocation/tools/WeakestAreasCard";
import { ReportDeliveryCard } from "@/components/relocation/tools/ReportDeliveryCard";
import { parseWeakestAreas } from "@/lib/relocation-tools-weakest";
import {
  TOOLS_UI_COPY,
  bucketDescription,
  bucketLabel,
  dimensionActionsForResult,
  dimensionDescriptionsForResult,
  dimensionLabelsForResult,
  dimensionWeightsForResult,
} from "@/lib/relocation-tools-copy";
import {
  hasNoTargetMatchFallback,
  type RelocationToolResultPayload,
  type ToolCta,
} from "@/lib/relocation-tools-types";

/**
 * "Hedef ülkede veri yok" şeridinin metni. TOOLS_UI_COPY'de DEĞİL çünkü yalnız bu
 * görünüm kullanır; ikinci bir kullanıcı çıkarsa copy dosyasına taşınmalıdır.
 * SQL zaten iki açıklama satırı yazıyor ama onlar gri madde listesinde kayboluyordu —
 * kullanıcı bu yüzden sonucu "şehir bulunamadı" sanıyordu (revizyon 371da675).
 */
const NO_TARGET_MATCH_COPY = {
  title: "Hedef ülkende henüz şehir verimiz yok",
  body:
    "Bu sıralama, seçtiğin ülke için veri bulunmadığından DİĞER ülkelerdeki şehirlerle " +
    "üretildi. Tercihlerine göre puanlama doğrudur; ancak aşağıdaki şehirler seçtiğin " +
    "ülkeden değildir. Ülke verisi eklendiğinde testi tekrar çözersen sonuç değişecektir.",
} as const;

interface ToolResultViewProps {
  result: RelocationToolResultPayload;
  onCtaClick?: (cta: ToolCta) => void;
  /** #5 diaspora: güvenli kartta tanışma isteği (candidate_id). */
  onRequestIntro?: (candidateId: string) => void;
  /** Verilirse "Tekrar Çöz" CTA ızgarasının son hücresi olarak gösterilir. */
  onRetake?: () => void;
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

export function ToolResultView({
  result,
  onCtaClick,
  onRequestIntro,
  onRetake,
}: ToolResultViewProps) {
  const labels = dimensionLabelsForResult(result.result_kind, result.tool_key);
  const descriptions = dimensionDescriptionsForResult(result.result_kind, result.tool_key);
  const weights = dimensionWeightsForResult(result.tool_key);
  const dimensionActions = dimensionActionsForResult(result.tool_key);
  // weakest3 SQL'de üretilip primary_result'a yazılıyor ama bugüne kadar hiç
  // çizilmiyordu. persona/ranked_list gibi türlerde alan yok → boş dizi döner.
  const weakestAreas = parseWeakestAreas(result.primary_result);
  const bucketNote =
    result.tool_key === "top_relocation_challenge" ? "" : bucketDescription(result.score_bucket);
  // SQL 2026-07-30'dan beri bu bayrağı yazıyor; arayüz bugüne kadar hiç okumuyordu.
  const noTargetMatchFallback = hasNoTargetMatchFallback(result.primary_result);
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
          {bucketNote && <p className="text-sm text-foreground">{bucketNote}</p>}
          {result.explanations.length > 0 && (
            <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
              {result.explanations.map((line, i) => (
                <li key={i}>{line}</li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Sonuç gövdesinin ÜSTÜNDE: kullanıcı listeyi okumadan önce listenin neden
          başka ülkelerden geldiğini görmeli. */}
      {noTargetMatchFallback && (
        <div
          role="status"
          className="flex items-start gap-3 rounded-lg border border-amber-400 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-100"
        >
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
          <div className="space-y-1">
            <p className="font-semibold">{NO_TARGET_MATCH_COPY.title}</p>
            <p className="leading-snug">{NO_TARGET_MATCH_COPY.body}</p>
          </div>
        </div>
      )}

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
        <>
          <ScoreBreakdownCard
            subScores={result.sub_scores}
            dimensionLabels={labels}
            dimensionDescriptions={descriptions}
            dimensionWeights={weights}
          />
          <WeakestAreasCard areas={weakestAreas} dimensionActions={dimensionActions} />
        </>
      )}

      <ResultCtaPanel ctas={result.ctas} onCtaClick={onCtaClick} onRetake={onRetake} />

      <ReportDeliveryCard result={result} />

      {/* Araç hub'ına dönüş — CTA ızgarasının ALTINDA, tam genişlikte tek satır.
          Bilinçli olarak ResultCtaPanel'in DIŞINDA: panel 2×2 eşit hücre sözleşmesini
          taşır, bu satır ise tam genişlikte durur. (Eski yorum "panel hiç link
          üretmez" diyordu — 6aa64b5'in CTA'ları kilitlediği döneme aitti; 2026-09-05
          onarımından sonra panel her CTA için gerçek bir link üretir.)
          Buradan yalnız MOTOR araçları kapsanır; standalone araçlar bu bileşenden
          geçmez, onların dönüş butonu RelocationToolPage'dedir. */}
      <BackToToolsButton />

      <p className="text-xs text-muted-foreground">{TOOLS_UI_COPY.privacyNote}</p>
    </div>
  );
}
