// Cadde moderasyon paneli (/admin/cadde/moderation, spec §18.4).
// Açık kuyruk: entity tipi filtresi + rapor sayısı + aksiyonlar (kapat/gizle/yayınla/ban)
// + audit notu. Aksiyonlar admin_moderate_cadde_entity_v1 RPC'sinden (resolved_by kaydı).

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ShieldAlert } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  CADDE_MODERATION_ENTITY_LABELS,
  listModerationQueue,
  moderateCaddeEntity,
  type CaddeModerationAction,
  type CaddeModerationEntityType,
  type CaddeModerationQueueItem,
} from "@/lib/cadde-moderation-api";
import { caddeQueryKeys } from "@/lib/cadde-query-keys";

const ACTION_BUTTONS: Array<{ action: CaddeModerationAction; label: string; variant: "default" | "outline" | "destructive" }> = [
  { action: "dismiss", label: "Kapat (sorun yok)", variant: "outline" },
  { action: "hide", label: "Gizle", variant: "default" },
  { action: "publish", label: "Geri Yayınla", variant: "outline" },
  { action: "ban_owner", label: "Sahibini Banla (7g)", variant: "destructive" },
];

const AdminCaddeModerationPage = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [entityFilter, setEntityFilter] = useState<CaddeModerationEntityType | "all">("all");
  const [notes, setNotes] = useState<Record<string, string>>({});

  const queueQuery = useQuery({
    queryKey: caddeQueryKeys.moderationQueue("open"),
    queryFn: () => listModerationQueue("open"),
  });

  const moderateMutation = useMutation({
    mutationFn: ({ item, action }: { item: CaddeModerationQueueItem; action: CaddeModerationAction }) =>
      moderateCaddeEntity({
        entityType: item.entityType,
        entityId: item.entityId,
        action,
        note: notes[item.id],
        banDays: 7,
      }),
    onSuccess: async (_data, variables) => {
      setNotes((current) => ({ ...current, [variables.item.id]: "" }));
      await queryClient.invalidateQueries({ queryKey: caddeQueryKeys.moderationQueue("open") });
      toast({ title: "Moderasyon aksiyonu uygulandı" });
    },
    onError: (error) => {
      toast({ title: "Aksiyon uygulanamadı", description: error instanceof Error ? error.message : "Bilinmeyen hata", variant: "destructive" });
    },
  });

  const items = useMemo(
    () => (queueQuery.data ?? []).filter((item) => entityFilter === "all" || item.entityType === entityFilter),
    [queueQuery.data, entityFilter],
  );

  return (
    <div className="space-y-5 p-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-red-500" />
            Cadde Moderasyon Kuyruğu
          </CardTitle>
          <CardDescription>
            {queueQuery.isLoading ? "Yükleniyor..." : `${items.length} açık kayıt. Aksiyonlar audit notuyla birlikte kaydedilir.`}
          </CardDescription>
          <div className="flex flex-wrap gap-2 pt-2">
            <button
              type="button"
              onClick={() => setEntityFilter("all")}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium ${entityFilter === "all" ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-white text-slate-700"}`}
            >
              Tümü
            </button>
            {(Object.keys(CADDE_MODERATION_ENTITY_LABELS) as CaddeModerationEntityType[]).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setEntityFilter(type)}
                className={`rounded-full border px-3 py-1.5 text-xs font-medium ${entityFilter === type ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-white text-slate-700"}`}
              >
                {CADDE_MODERATION_ENTITY_LABELS[type]}
              </button>
            ))}
          </div>
        </CardHeader>
      </Card>

      {items.map((item) => (
        <Card key={item.id}>
          <CardHeader className="pb-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline">{CADDE_MODERATION_ENTITY_LABELS[item.entityType]}</Badge>
              <Badge variant={item.reportCount > 2 ? "destructive" : "secondary"}>{item.reportCount} rapor</Badge>
              <span className="text-xs text-slate-500">{new Date(item.createdAt).toLocaleString("tr-TR")}</span>
            </div>
            <CardTitle className="text-sm">Sebep: {item.reason}</CardTitle>
            <CardDescription className="font-mono text-xs">{item.entityType}/{item.entityId}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Textarea
              value={notes[item.id] ?? ""}
              onChange={(event) => setNotes((current) => ({ ...current, [item.id]: event.target.value }))}
              placeholder="Audit notu (ban/gizleme durumunda içerik sahibine gösterilir)"
              rows={2}
            />
            <div className="flex flex-wrap gap-2">
              {ACTION_BUTTONS.map((button) => (
                <Button
                  key={button.action}
                  variant={button.variant}
                  size="sm"
                  onClick={() => moderateMutation.mutate({ item, action: button.action })}
                  disabled={moderateMutation.isPending}
                >
                  {button.label}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}

      {!queueQuery.isLoading && items.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-slate-500">Açık moderasyon kaydı yok.</CardContent>
        </Card>
      ) : null}
    </div>
  );
};

export default AdminCaddeModerationPage;
