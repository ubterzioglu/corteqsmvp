import { useEffect, useMemo, useState } from "react";
import { AdminPageLayout } from "@/components/admin/AdminPageLayout";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminPageLayout } from "@/components/admin/AdminPageLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { reviewApprovalRequestAsAdmin } from "@/lib/admin";

type ApprovalRow = {
  id: string;
  request_type: string;
  user_id: string;
  target_role_key: string | null;
  target_feature_key: string | null;
  target_entity_type: string | null;
  payload: Record<string, unknown> | null;
  status: string;
  admin_note: string | null;
  created_at: string;
};

type UserRow = {
  user_id: string;
  email: string | null;
  full_name: string | null;
};

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
  const [requests, setRequests] = useState<ApprovalRow[]>([]);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [filterType, setFilterType] = useState<(typeof FILTER_OPTIONS)[number]["value"]>("all");
  const [decisionNotes, setDecisionNotes] = useState<Record<string, string>>({});
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    void (async () => {
      const [requestsResult, usersResult] = await Promise.all([
        supabase
          .from("approval_requests")
          .select("id, request_type, user_id, target_role_key, target_feature_key, target_entity_type, payload, status, admin_note, created_at")
          .order("created_at", { ascending: false }),
        supabase.from("user_role_assignments").select("user_id, roles!inner(key)"),
      ]);

      if (!isMounted) return;

      if (requestsResult.error || usersResult.error) {
        toast({
          title: "Approval queue alınamadı",
          description: requestsResult.error?.message ?? usersResult.error?.message ?? "Bilinmeyen hata",
          variant: "destructive",
        });
        return;
      }

      // Fetch full_name attributes for all users in parallel
      const userIds = (usersResult.data ?? []).map((u: any) => u.user_id);
      const attrsResult = userIds.length > 0
        ? await supabase
            .from("user_profile_attributes")
            .select("user_id, value_text, attribute_catalog!inner(key)")
            .in("user_id", userIds)
            .eq("attribute_catalog.key", "full_name")
        : { data: [] };

      const nameByUser: Record<string, string | null> = {};
      for (const row of (attrsResult.data ?? []) as any[]) {
        nameByUser[row.user_id] = row.value_text ?? null;
      }

      const enrichedUsers: UserRow[] = (usersResult.data ?? []).map((u: any) => ({
        user_id: u.user_id,
        email: null,
        full_name: nameByUser[u.user_id] ?? null,
      }));

      setRequests((requestsResult.data ?? []) as ApprovalRow[]);
      setUsers(enrichedUsers);
    })();

    return () => {
      isMounted = false;
    };
  }, [toast]);

  const filteredRequests = useMemo(() => {
    return requests.filter((request) => {
      if (filterType === "all") return true;
      return request.request_type === filterType;
    });
  }, [filterType, requests]);

  const handleDecision = async (request: ApprovalRow, decision: "approved" | "rejected") => {
    setProcessingId(request.id);
    try {
      await reviewApprovalRequestAsAdmin(request.id, decision, decisionNotes[request.id]?.trim() || null);
      setRequests((current) =>
        current.map((item) =>
          item.id === request.id
            ? {
                ...item,
                status: decision,
                admin_note: decisionNotes[request.id]?.trim() || null,
              }
            : item,
        ),
      );
      toast({
        title: decision === "approved" ? "Talep onaylandı" : "Talep reddedildi",
        description: `${request.request_type} kararı kaydedildi.`,
      });
    } catch (error) {
      toast({
        title: "Talep işlenemedi",
        description: error instanceof Error ? error.message : "Beklenmeyen bir hata oluştu.",
        variant: "destructive",
      });
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Approval Queue</CardTitle>
          <CardDescription>Bekleyen, onaylanan ve reddedilen talepleri tek ekranda filtreleyip yönet.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="max-w-sm">
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

          <div className="space-y-3">
            {filteredRequests.map((request) => {
              const user = users.find((item) => item.user_id === request.user_id);
              const isProcessing = processingId === request.id;
              return (
                <div key={request.id} className="rounded-xl border p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-medium">{request.request_type}</p>
                      <p className="text-xs text-muted-foreground">{user?.full_name ?? user?.email ?? request.user_id}</p>
                      <p className="text-xs text-muted-foreground">{new Date(request.created_at).toLocaleString("tr-TR")}</p>
                      <p className="mt-2 text-sm text-muted-foreground">
                        Hedef rol: {request.target_role_key ?? "-"} • Feature: {request.target_feature_key ?? "-"}
                      </p>
                      <pre className="mt-2 overflow-x-auto rounded-lg bg-muted p-3 text-xs">
                        {JSON.stringify(request.payload ?? {}, null, 2)}
                      </pre>
                    </div>
                    <div className="min-w-[280px] space-y-2">
                      <span className="rounded border px-2 py-1 text-xs">{request.status}</span>
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
              <p className="text-sm text-muted-foreground">Filtreye uygun approval request bulunamadı.</p>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminApprovalsPage;
