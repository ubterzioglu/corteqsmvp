// Tanıtım kampanya onay kuyruğu (/admin/cadde/promotions, spec §15.3 admin akışı).
// Bekleyen kampanyaları listeler; onay/red admin_review_cadde_promotion_v1 RPC'siyle
// (audit: approved_by + review_note). Billboard/sponsored CRUD'u AdminCaddePage'de kalır;
// kampanya katmanı D-01 gereği ayrı paneldir.

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ExternalLink, Megaphone } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  CADDE_PROMOTION_TYPE_LABELS,
  adminListPendingPromotions,
  adminReviewPromotion,
} from "@/lib/cadde-tanitim-api";
import { caddeQueryKeys } from "@/lib/cadde-query-keys";

const AdminCaddePromotionsPage = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [notes, setNotes] = useState<Record<string, string>>({});

  const pendingQuery = useQuery({
    queryKey: caddeQueryKeys.pendingPromotions,
    queryFn: adminListPendingPromotions,
  });

  const reviewMutation = useMutation({
    mutationFn: ({ campaignId, approve }: { campaignId: string; approve: boolean }) =>
      adminReviewPromotion(campaignId, approve, notes[campaignId]),
    onSuccess: async (_data, variables) => {
      setNotes((current) => ({ ...current, [variables.campaignId]: "" }));
      await queryClient.invalidateQueries({ queryKey: caddeQueryKeys.promotionsRoot });
      toast({ title: variables.approve ? "Kampanya onaylandı" : "Kampanya reddedildi" });
    },
    onError: (error) => {
      toast({ title: "İnceleme kaydedilemedi", description: error instanceof Error ? error.message : "Bilinmeyen hata", variant: "destructive" });
    },
  });

  const pending = pendingQuery.data ?? [];

  return (
    <div className="space-y-5 p-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Megaphone className="h-5 w-5 text-orange-500" />
            Tanıtım Onay Kuyruğu
          </CardTitle>
          <CardDescription>
            {pendingQuery.isLoading ? "Yükleniyor..." : `${pending.length} bekleyen kampanya. Onaylanan kampanya tarih aralığında otomatik yayınlanır.`}
          </CardDescription>
        </CardHeader>
      </Card>

      {pending.map((campaign) => (
        <Card key={campaign.id}>
          <CardHeader className="pb-2">
            <div className="flex flex-wrap items-center gap-2">
              <CardTitle className="text-base">{campaign.title}</CardTitle>
              <Badge variant="outline">{CADDE_PROMOTION_TYPE_LABELS[campaign.campaignType]}</Badge>
            </div>
            <CardDescription>{campaign.description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-3 text-xs text-slate-600">
              <a href={campaign.targetUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-medium text-blue-700 hover:underline">
                {campaign.targetUrl}
                <ExternalLink className="h-3 w-3" />
              </a>
              <span>Placement: {campaign.placementKeys.join(", ") || "—"}</span>
              {campaign.startsAt ? <span>Başlangıç: {new Date(campaign.startsAt).toLocaleDateString("tr-TR")}</span> : null}
              {campaign.endsAt ? <span>Bitiş: {new Date(campaign.endsAt).toLocaleDateString("tr-TR")}</span> : null}
            </div>
            {campaign.imageUrl ? (
              <img src={campaign.imageUrl} alt={campaign.title} className="h-32 rounded-xl border border-slate-200 object-cover" loading="lazy" />
            ) : null}
            <Textarea
              value={notes[campaign.id] ?? ""}
              onChange={(event) => setNotes((current) => ({ ...current, [campaign.id]: event.target.value }))}
              placeholder="İnceleme notu (red durumunda sahibine gösterilir)"
              rows={2}
            />
            <div className="flex gap-2">
              <Button onClick={() => reviewMutation.mutate({ campaignId: campaign.id, approve: true })} disabled={reviewMutation.isPending}>
                Onayla
              </Button>
              <Button variant="outline" onClick={() => reviewMutation.mutate({ campaignId: campaign.id, approve: false })} disabled={reviewMutation.isPending}>
                Reddet
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}

      {!pendingQuery.isLoading && pending.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-slate-500">Bekleyen kampanya yok.</CardContent>
        </Card>
      ) : null}
    </div>
  );
};

export default AdminCaddePromotionsPage;
