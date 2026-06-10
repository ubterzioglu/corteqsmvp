import { useMemo, useState } from "react";
import { ClipboardList } from "lucide-react";

import {
  AdminEmptyState,
  AdminErrorState,
  AdminFilterBar,
  AdminLoadingState,
  AdminPageShell,
  AdminStatusBadge,
  statusToTone,
} from "@/components/admin/page";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAdminApprovals } from "@/hooks/admin/useAdminApprovals";
import { resolveAdminUserLabel } from "@/lib/admin-shell/admin-user-labels";
import type { AdminApprovalRequest } from "@/lib/admin-shell/admin-approvals-api";

const FILTER_OPTIONS = [
  { value: "all", label: "Tüm talepler" },
  { value: "role_change", label: "Rol başvuruları" },
  { value: "directory_visibility", label: "Directory görünürlük" },
  { value: "contact_visibility", label: "İletişim görünürlük" },
  { value: "featured_listing", label: "Featured talebi" },
  { value: "event_create", label: "Etkinlik talebi" },
  { value: "offer_create", label: "Teklif talebi" },
  { value: "referral_create", label: "Referral talebi" },
  { value: "attribute_change", label: "Attribute değişikliği" },
  { value: "city_manage", label: "Şehir yönetimi" },
] as const;

const AdminApprovalsPage = () => {
  const { toast } = useToast();
  const { data, isLoading, error, refetch, reviewMutation } = useAdminApprovals();
  const [filterType, setFilterType] = useState<(typeof FILTER_OPTIONS)[number]["value"]>("all");
  const [decisionNotes, setDecisionNotes] = useState<Record<string, string>>({});

  const requests = useMemo(() => data?.requests ?? [], [data]);
  const users = data?.users ?? [];

  const filteredRequests = useMemo(() => {
    return requests.filter((request) => {
      if (filterType === "all") return true;
      return request.request_type === filterType;
    });
  }, [filterType, requests]);

  const handleDecision = async (request: AdminApprovalRequest, decision: "approved" | "rejected") => {
    try {
      await reviewMutation.mutateAsync({
        requestId: request.id,
        decision,
        note: decisionNotes[request.id]?.trim() || null,
      });
      toast({
        title: decision === "approved" ? "Talep onaylandı" : "Talep reddedildi",
        description: `${request.request_type} kararı kaydedildi.`,
      });
    } catch (mutationError) {
      toast({
        title: "Talep işlenemedi",
        description: mutationError instanceof Error ? mutationError.message : "Beklenmeyen bir hata oluştu.",
        variant: "destructive",
      });
    }
  };

  return (
    <AdminPageShell
      title="Approval Queue"
      description="Bekleyen, onaylanan ve reddedilen talepleri tek ekranda filtreleyip yönet."
      icon={ClipboardList}
      accent="sky"
      filters={
        <AdminFilterBar>
          <div className="w-full max-w-sm">
            <Select value={filterType} onValueChange={(value) => setFilterType(value as (typeof FILTER_OPTIONS)[number]["value"])}>
              <SelectTrigger>
                <SelectValue placeholder="Talep türü filtrele" />
              </SelectTrigger>
              <SelectContent>
                {FILTER_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </AdminFilterBar>
      }
    >
      {isLoading ? <AdminLoadingState label="Approval queue yükleniyor..." /> : null}

      {error ? (
        <AdminErrorState
          title="Approval queue alınamadı"
          description={error instanceof Error ? error.message : "Bilinmeyen hata"}
          onRetry={() => void refetch()}
        />
      ) : null}

      {!isLoading && !error ? (
        <div className="space-y-3">
          {filteredRequests.map((request) => {
            const isProcessing =
              reviewMutation.isPending && reviewMutation.variables?.requestId === request.id;
            return (
              <div key={request.id} className="rounded-xl border p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">{request.request_type}</p>
                    <p className="text-xs text-muted-foreground">{resolveAdminUserLabel(users, request.user_id)}</p>
                    <p className="text-xs text-muted-foreground">{new Date(request.created_at).toLocaleString("tr-TR")}</p>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Hedef rol: {request.target_role_key ?? "-"} • Feature: {request.target_feature_key ?? "-"}
                    </p>
                    <pre className="mt-2 overflow-x-auto rounded-lg bg-muted p-3 text-xs">
                      {JSON.stringify(request.payload ?? {}, null, 2)}
                    </pre>
                  </div>
                  <div className="min-w-[280px] space-y-2">
                    <AdminStatusBadge tone={statusToTone(request.status)}>{request.status}</AdminStatusBadge>
                    <Input
                      value={decisionNotes[request.id] ?? request.admin_note ?? ""}
                      onChange={(event) =>
                        setDecisionNotes((current) => ({ ...current, [request.id]: event.target.value }))
                      }
                      placeholder="Admin notu"
                    />
                    <div className="flex gap-2">
                      <Button
                        className="flex-1"
                        disabled={request.status !== "pending" || isProcessing}
                        onClick={() => void handleDecision(request, "approved")}
                      >
                        {isProcessing ? "İşleniyor..." : "Onayla"}
                      </Button>
                      <Button
                        className="flex-1"
                        variant="outline"
                        disabled={request.status !== "pending" || isProcessing}
                        onClick={() => void handleDecision(request, "rejected")}
                      >
                        Reddet
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {filteredRequests.length === 0 ? (
            <AdminEmptyState
              icon={ClipboardList}
              title="Approval request bulunamadı"
              description="Filtreye uygun approval request bulunamadı."
            />
          ) : null}
        </div>
      ) : null}
    </AdminPageShell>
  );
};

export default AdminApprovalsPage;
