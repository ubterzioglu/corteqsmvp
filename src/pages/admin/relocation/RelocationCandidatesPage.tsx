// Admin — Relocation aday inceleme/publish (service-finder candidate review kalıbı, sade).
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  listCandidates,
  publishCandidate,
  reviewCandidate,
} from "@/lib/relocation-admin-api";

const REVIEW_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  pending: "secondary",
  approved: "default",
  rejected: "destructive",
  needs_edit: "outline",
  published: "outline",
};

export default function RelocationCandidatesPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const candidatesQuery = useQuery({
    queryKey: ["relocation", "admin", "candidates"],
    queryFn: () => listCandidates(),
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["relocation", "admin", "candidates"] });

  const reviewMutation = useMutation({
    mutationFn: (v: { id: string; action: "approved" | "rejected" }) =>
      reviewCandidate(v.id, v.action),
    onSuccess: invalidate,
    onError: (e: unknown) =>
      toast({
        title: "İşlem başarısız",
        description: e instanceof Error ? e.message : "Hata",
        variant: "destructive",
      }),
  });

  const publishMutation = useMutation({
    mutationFn: (id: string) => publishCandidate(id),
    onSuccess: () => {
      toast({ title: "Yayınlandı", description: "Aday hedef tabloya eklendi." });
      invalidate();
    },
    onError: (e: unknown) =>
      toast({
        title: "Yayınlanamadı",
        description: e instanceof Error ? e.message : "Hata",
        variant: "destructive",
      }),
  });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-foreground">Taşınma — Aday İnceleme</h1>
        <p className="text-sm text-muted-foreground">
          Worker'ın bulduğu adayları onayla → yayınla (servis / bürokrasi adımı / acil iletişim).
        </p>
      </div>

      {candidatesQuery.isLoading && <p className="text-sm text-muted-foreground">Yükleniyor…</p>}

      <div className="space-y-2">
        {(candidatesQuery.data ?? []).map((c) => {
          const name =
            (c.normalized_payload.provider_name as string) ??
            (c.normalized_payload.name as string) ??
            (c.normalized_payload.label as string) ??
            c.duplicate_key;
          return (
            <Card key={c.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="text-sm">{name}</CardTitle>
                  <Badge variant={REVIEW_VARIANT[c.review_status] ?? "outline"} className="text-xs">
                    {c.review_status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  <span>Tür: {c.target_kind}</span>
                  <span>Güven: {Math.round(c.confidence_score * 100)}%</span>
                  {c.source_url && (
                    <a
                      href={c.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      Kaynak
                    </a>
                  )}
                </div>
                {c.review_status !== "published" && (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={reviewMutation.isPending}
                      onClick={() => reviewMutation.mutate({ id: c.id, action: "approved" })}
                    >
                      Onayla
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={reviewMutation.isPending}
                      onClick={() => reviewMutation.mutate({ id: c.id, action: "rejected" })}
                    >
                      Reddet
                    </Button>
                    <Button
                      size="sm"
                      disabled={publishMutation.isPending || c.review_status === "pending"}
                      onClick={() => publishMutation.mutate(c.id)}
                    >
                      Yayınla
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
        {candidatesQuery.data?.length === 0 && (
          <p className="text-sm text-muted-foreground">İnceleme bekleyen aday yok.</p>
        )}
      </div>
    </div>
  );
}
