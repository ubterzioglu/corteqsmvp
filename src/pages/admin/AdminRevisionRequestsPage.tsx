// Revizyon İstekleri — admin sayfası.
// Serbest revizyon talepleri (revision_requests) + talep başına çoklu yorum thread'i.
// DB katmanı: src/lib/admin-shell/revision-requests.ts (RLS: admin-only, ortak).

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MessageSquare, MessageSquarePlus, Pencil, Plus, Trash2 } from "lucide-react";

import { RevisionCommentThread } from "@/components/admin/revision/RevisionCommentThread";
import { RevisionRequestForm } from "@/components/admin/revision/RevisionRequestForm";
import {
  AdminDetailDrawer,
  AdminEmptyState,
  AdminErrorState,
  AdminLoadingState,
  AdminPageShell,
  AdminStatusBadge,
  type AdminStatusTone,
} from "@/components/admin/page";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  createRevisionRequest,
  deleteRevisionRequest,
  fetchRevisionRequests,
  fetchUserEmails,
  getRevisionStatusLabel,
  updateRevisionRequest,
  type RevisionRequest,
  type RevisionRequestForm as RevisionRequestFormState,
  type RevisionStatus,
} from "@/lib/admin-shell/revision-requests";

const REQUESTS_KEY = ["revision-requests"] as const;

const STATUS_TONES: Record<RevisionStatus, AdminStatusTone> = {
  acik: "info",
  inceleniyor: "warning",
  yapildi: "success",
  iptal: "neutral",
};

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

const AdminRevisionRequestsPage = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<RevisionRequest | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const requestsQuery = useQuery({
    queryKey: REQUESTS_KEY,
    queryFn: fetchRevisionRequests,
  });
  const requests = useMemo(() => requestsQuery.data ?? [], [requestsQuery.data]);

  const emailsQuery = useQuery({
    queryKey: ["revision-request-emails", requests.map((r) => r.createdBy).join(",")],
    queryFn: () => fetchUserEmails(requests.map((r) => r.createdBy)),
    enabled: requests.length > 0,
  });
  const emails = emailsQuery.data ?? {};

  const selected = useMemo(
    () => requests.find((request) => request.id === selectedId) ?? null,
    [requests, selectedId],
  );

  const upsertMutation = useMutation({
    mutationFn: (form: RevisionRequestFormState) =>
      editing ? updateRevisionRequest(editing.id, form) : createRevisionRequest(form),
    onSuccess: async () => {
      setFormOpen(false);
      setEditing(null);
      await queryClient.invalidateQueries({ queryKey: REQUESTS_KEY });
      toast({ title: editing ? "Revizyon isteği güncellendi" : "Revizyon isteği oluşturuldu" });
    },
    onError: (error: unknown) => {
      toast({
        title: "İşlem başarısız",
        description: error instanceof Error ? error.message : "Bilinmeyen hata",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteRevisionRequest(id),
    onSuccess: async (_data, id) => {
      if (selectedId === id) setSelectedId(null);
      await queryClient.invalidateQueries({ queryKey: REQUESTS_KEY });
      toast({ title: "Revizyon isteği silindi" });
    },
    onError: (error: unknown) => {
      toast({
        title: "Silinemedi",
        description: error instanceof Error ? error.message : "Bilinmeyen hata",
        variant: "destructive",
      });
    },
  });

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (request: RevisionRequest) => {
    setEditing(request);
    setFormOpen(true);
  };

  return (
    <AdminPageShell
      title="Revizyon İstekleri"
      description="Site ve ürün üzerinde yapılmasını istediğiniz değişiklikleri açın, durumlarını takip edin ve her isteğin altında yorumlaşın. Tüm adminler ortak görür."
      icon={MessageSquarePlus}
      accent="violet"
      contentWidth="wide"
      actions={
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Yeni Revizyon İsteği
        </Button>
      }
    >
      {requestsQuery.isLoading ? (
        <AdminLoadingState label="Revizyon istekleri yükleniyor" rows={4} />
      ) : requestsQuery.isError ? (
        <AdminErrorState
          description="Revizyon istekleri yüklenemedi."
          onRetry={() => requestsQuery.refetch()}
        />
      ) : requests.length === 0 ? (
        <AdminEmptyState
          icon={MessageSquarePlus}
          title="Henüz revizyon isteği yok"
          description="İlk isteği oluşturarak başlayın."
          action={
            <Button onClick={openCreate} size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Yeni Revizyon İsteği
            </Button>
          }
        />
      ) : (
        <div className="space-y-3">
          {requests.map((request) => (
            <div
              key={request.id}
              className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 sm:flex-row sm:items-start sm:justify-between"
            >
              <button
                type="button"
                className="flex-1 text-left"
                onClick={() => setSelectedId(request.id)}
              >
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  <AdminStatusBadge tone={STATUS_TONES[request.status]}>
                    {getRevisionStatusLabel(request.status)}
                  </AdminStatusBadge>
                  <span className="text-xs text-muted-foreground">Öncelik {request.priority}</span>
                  {request.areaLabel ? (
                    <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                      {request.areaLabel}
                    </span>
                  ) : null}
                </div>
                <p className="font-medium text-foreground">{request.title}</p>
                {request.detail ? (
                  <p className="mt-0.5 line-clamp-2 text-sm text-muted-foreground">{request.detail}</p>
                ) : null}
                <p className="mt-1.5 text-xs text-muted-foreground">
                  {request.createdBy ? emails[request.createdBy] || "Admin" : "Bilinmeyen"} ·{" "}
                  {formatDate(request.createdAt)}
                </p>
              </button>

              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedId(request.id)}
                  aria-label="Yorumları gör"
                >
                  <MessageSquare className="mr-1.5 h-4 w-4" />
                  Yorumlar
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => openEdit(request)}
                  aria-label="Düzenle"
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-red-500"
                  onClick={() => deleteMutation.mutate(request.id)}
                  disabled={deleteMutation.isPending}
                  aria-label="Sil"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <RevisionRequestForm
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditing(null);
        }}
        request={editing}
        onSubmit={(form) => upsertMutation.mutate(form)}
        isSubmitting={upsertMutation.isPending}
      />

      <AdminDetailDrawer
        open={Boolean(selected)}
        onOpenChange={(open) => {
          if (!open) setSelectedId(null);
        }}
        title={selected?.title ?? "Revizyon İsteği"}
        description={
          selected
            ? `${getRevisionStatusLabel(selected.status)} · Öncelik ${selected.priority}`
            : undefined
        }
      >
        {selected ? (
          <div className="flex h-full flex-col gap-4">
            {selected.detail ? (
              <p className="whitespace-pre-wrap rounded-lg bg-muted/40 p-3 text-sm text-foreground">
                {selected.detail}
              </p>
            ) : null}
            <RevisionCommentThread requestId={selected.id} />
          </div>
        ) : null}
      </AdminDetailDrawer>
    </AdminPageShell>
  );
};

export default AdminRevisionRequestsPage;
