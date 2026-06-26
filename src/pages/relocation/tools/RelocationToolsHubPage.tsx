// Taşınma Araçları hub sayfası — /relocation/tools. Login zorunlu (App.tsx RequireAuth).
import { useQuery } from "@tanstack/react-query";
import { RelocationToolsHub } from "@/components/relocation/tools/RelocationToolsHub";
import { listTools } from "@/lib/relocation-tools-api";
import { relocationToolsKeys } from "@/lib/relocation-tools-query-keys";

export default function RelocationToolsHubPage() {
  const toolsQuery = useQuery({
    queryKey: relocationToolsKeys.list(),
    queryFn: listTools,
  });

  return (
    <div className="container mx-auto max-w-4xl px-4 py-6">
      <RelocationToolsHub
        tools={toolsQuery.data ?? []}
        isLoading={toolsQuery.isLoading}
        isError={toolsQuery.isError}
      />
    </div>
  );
}
