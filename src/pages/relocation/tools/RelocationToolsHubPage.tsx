// Taşınma Araçları hub sayfası — /tools. Login gerekmez; bir araca tıklayınca
// /tools/:toolSlug RequireAuth'a takılır ve next parametresiyle login'e yönlenir.
import { useQuery } from "@tanstack/react-query";
import { RelocationToolsHub } from "@/components/relocation/tools/RelocationToolsHub";
import { listTools } from "@/lib/relocation-tools-api";
import { relocationToolsKeys } from "@/lib/relocation-tools-query-keys";
import { useSeo } from "@/lib/seo";
import { PAGE_SEO } from "@/lib/page-seo";

export default function RelocationToolsHubPage() {
  useSeo(PAGE_SEO.relocationToolsHub);
  const toolsQuery = useQuery({
    queryKey: relocationToolsKeys.list(),
    queryFn: listTools,
  });

  return (
    // max-w-6xl: 3 sütunlu kart gridi max-w-4xl'de (896px) sıkışıyordu — 16/9 görselli
    // kart ~280px'e düşüyor, başlık 3 satıra kırılıyordu.
    <div className="container mx-auto max-w-6xl px-4 py-6">
      <RelocationToolsHub
        tools={toolsQuery.data ?? []}
        isLoading={toolsQuery.isLoading}
        isError={toolsQuery.isError}
        onRetry={() => void toolsQuery.refetch()}
      />
    </div>
  );
}
