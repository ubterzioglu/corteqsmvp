// Sonuç sayfası — /relocation/tools/:toolSlug/result/:resultId.
// Kaydedilmiş bir sonucu resultId ile yükler (RLS sahip; başkasınınki açılamaz).
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ToolResultView } from "@/components/relocation/tools/ToolResultView";
import { getResult } from "@/lib/relocation-tools-api";
import { relocationToolsKeys } from "@/lib/relocation-tools-query-keys";
import { TOOLS_UI_COPY } from "@/lib/relocation-tools-copy";

export default function RelocationToolResultPage() {
  const { toolSlug = "", resultId = "" } = useParams<{ toolSlug: string; resultId: string }>();
  const navigate = useNavigate();

  const resultQuery = useQuery({
    queryKey: relocationToolsKeys.result(resultId),
    queryFn: () => getResult(resultId),
    enabled: !!resultId,
  });

  if (resultQuery.isLoading) {
    return (
      <div className="container mx-auto max-w-3xl px-4 py-6 text-sm text-muted-foreground">
        {TOOLS_UI_COPY.loading}
      </div>
    );
  }

  const result = resultQuery.data;
  if (!result) {
    return (
      <div className="container mx-auto max-w-3xl px-4 py-6 text-sm text-destructive">
        Sonuç bulunamadı.
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-3xl px-4 py-6">
      {/* B22: kayıtlı sonuçtan da "Tekrar Çöz" ile araca dönülebilir. */}
      <ToolResultView
        result={result}
        onRetake={toolSlug ? () => navigate(`/tools/${toolSlug}`) : undefined}
      />
    </div>
  );
}
