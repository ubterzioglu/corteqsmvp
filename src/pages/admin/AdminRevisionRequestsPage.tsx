// Revizyon İstekleri — admin sayfası.
// Serbest revizyon talepleri (revision_requests) + talep başına çoklu yorum thread'i.
// DB katmanı: src/lib/admin-shell/revision-requests.ts (RLS: admin-only, ortak).
// Yorumlar drawer yerine satırın altında inline açılır (2026-07-18).

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, ChevronDown, MessageSquarePlus, Pencil, Plus, Trash2 } from "lucide-react";

import { RevisionAttachmentGrid } from "@/components/admin/revision/RevisionAttachmentGrid";
import { RevisionCommentThread } from "@/components/admin/revision/RevisionCommentThread";
import { RevisionRequestForm } from "@/components/admin/revision/RevisionRequestForm";
import {
  AdminEmptyState,
  AdminErrorState,
  AdminFilterBar,
  AdminLoadingState,
  AdminPageShell,
  AdminStatusBadge,
  type AdminStatusTone,
} from "@/components/admin/page";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  createRevisionRequest,
  deleteRevisionRequest,
  fetchRevisionRequests,
  fetchUserEmails,
  getRevisionStatusLabel,
  REVISION_STATUSES,
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

const STATUS_FILTER_OPTIONS = [
  { value: "all", label: "Tüm durumlar" },
  ...REVISION_STATUSES.map((status) => ({ value: status, label: getRevisionStatusLabel(status) })),
] as const;

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
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [statusFilter, setStatusFilter] = useState<(typeof STATUS_FILTER_OPTIONS)[number]["value"]>("all");
  const [areaFilter, setAreaFilter] = useState("all");
  const [searchText, setSearchText] = useState("");

  const requestsQuery = useQuery({
    queryKey: REQUESTS_KEY,
    queryFn: fetchRevisionRequests,
  });
  const requests = useMemo(() => requestsQuery.data ?? [], [requestsQuery.data]);

  const areaOptions = useMemo(() => {
    const labels = new Set(requests.map((r) => r.areaLabel).filter((label) => label.trim().length > 0));
    return Array.from(labels).sort((a, b) => a.localeCompare(b, "tr"));
  }, [requests]);

  const filteredRequests = useMemo(() => {
    const query = searchText.trim().toLowerCase();
    return requests.filter((request) => {
      if (statusFilter !== "all" && request.status !== statusFilter) return false;
      if (areaFilter !== "all" && request.areaLabel !== areaFilter) return false;
      if (query) {
        const haystack = `${request.title} ${request.detail}`.toLowerCase();
        if (!haystack.includes(query)) return false;
      }
      return true;
    });
  }, [requests, statusFilter, areaFilter, searchText]);

  const hasActiveFilters = statusFilter !== "all" || areaFilter !== "all" || searchText.trim().length > 0;

  const openRequests = useMemo(
    () => filteredRequests.filter((request) => request.status !== "yapildi"),
    [filteredRequests],
  );
  const completedRequests = useMemo(
    () => filteredRequests.filter((request) => request.status === "yapildi"),
    [filteredRequests],
  );

  const emailsQuery = useQuery({
    queryKey: ["revision-request-emails", requests.map((r) => r.createdBy).join(",")],
    queryFn: () => fetchUserEmails(requests.map((r) => r.createdBy)),
    enabled: requests.length > 0,
  });
  const emails = emailsQuery.data ?? {};

  const upsertMutation = useMutation({
    mutationFn: (form: RevisionRequestFormState) =>
      editing ? updateRevisionRequest(editing.id, form) : createRevisionRequest(form),
    onSuccess: async (saved) => {
      const wasCreate = !editing;
      setFormOpen(false);
      setEditing(null);
      await queryClient.invalidateQueries({ queryKey: REQUESTS_KEY });
      toast({ title: wasCreate ? "Revizyon isteği oluşturuldu" : "Revizyon isteği güncellendi" });
      if (wasCreate) {
        setExpandedId(saved.id);
      }
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
      if (expandedId === id) setExpandedId(null);
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

  const toggleExpanded = (id: string) => {
    setExpandedId((current) => (current === id ? null : id));
  };

  const resetFilters = () => {
    setStatusFilter("all");
    setAreaFilter("all");
    setSearchText("");
  };

  const renderRequestRow = (request: RevisionRequest) => {
    const isExpanded = expandedId === request.id;
    return (
      <div key={request.id} className="rounded-xl border border-border bg-card">
        <div className="flex items-center gap-2 p-2.5">
          <button
            type="button"
            className="flex min-w-0 flex-1 items-center gap-2 text-left"
            onClick={() => toggleExpanded(request.id)}
            aria-expanded={isExpanded}
          >
            <ChevronDown
              className={cn(
                "h-4 w-4 shrink-0 text-muted-foreground transition-transform",
                isExpanded && "rotate-180",
              )}
            />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-1.5">
                <AdminStatusBadge tone={STATUS_TONES[request.status]}>
                  {getRevisionStatusLabel(request.status)}
                </AdminStatusBadge>
                <span className="text-xs text-muted-foreground">Ö{request.priority}</span>
                {request.areaLabel ? (
                  <span className="truncate rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                    {request.areaLabel}
                  </span>
                ) : null}
                <span className="truncate text-sm font-medium text-foreground">{request.title}</span>
              </div>
              <p className="mt-0.5 truncate text-xs text-muted-foreground">
                {request.createdBy ? emails[request.createdBy] || "Admin" : "Bilinmeyen"} ·{" "}
                {formatDate(request.createdAt)}
              </p>
            </div>
          </button>

          <div className="flex shrink-0 items-center gap-0.5">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => openEdit(request)}
              aria-label="Düzenle"
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-red-500"
              onClick={() => deleteMutation.mutate(request.id)}
              disabled={deleteMutation.isPending}
              aria-label="Sil"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {isExpanded ? (
          <div className="border-t border-border p-3">
            {request.detail ? (
              <p className="whitespace-pre-wrap rounded-lg bg-muted/40 p-3 text-sm text-foreground">
                {request.detail}
              </p>
            ) : null}
            <div className="mt-2 mb-3">
              <RevisionAttachmentGrid parent={{ requestId: request.id }} />
            </div>
            <RevisionCommentThread requestId={request.id} />
          </div>
        ) : null}
      </div>
    );
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
      filters={
        <AdminFilterBar onReset={hasActiveFilters ? resetFilters : undefined}>
          <div className="w-full max-w-[220px]">
            <Select
              value={statusFilter}
              onValueChange={(value) => setStatusFilter(value as (typeof STATUS_FILTER_OPTIONS)[number]["value"])}
            >
              <SelectTrigger>
                <SelectValue placeholder="Durum" />
              </SelectTrigger>
              <SelectContent>
                {STATUS_FILTER_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="w-full max-w-[220px]">
            <Select value={areaFilter} onValueChange={setAreaFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Alan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm alanlar</SelectItem>
                {areaOptions.map((label) => (
                  <SelectItem key={label} value={label}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="w-full max-w-xs">
            <Input
              value={searchText}
              onChange={(event) => setSearchText(event.target.value)}
              placeholder="Başlık veya içerikte ara…"
            />
          </div>
        </AdminFilterBar>
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
      ) : filteredRequests.length === 0 ? (
        <AdminEmptyState
          title="Filtreyle eşleşen istek yok"
          description="Filtreleri değiştirip tekrar deneyin."
          action={
            <Button onClick={resetFilters} size="sm" variant="outline">
              Filtreleri sıfırla
            </Button>
          }
        />
      ) : (
        <div className="space-y-4">
          {openRequests.length > 0 ? (
            <div className="space-y-2">{openRequests.map(renderRequestRow)}</div>
          ) : null}

          {completedRequests.length === 0 ? null : (
            <Accordion type="single" collapsible className="rounded-xl border border-border bg-card px-3">
              <AccordionItem value="completed" className="border-b-0">
                <AccordionTrigger className="py-3 hover:no-underline">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    <span className="text-sm font-medium text-foreground">
                      Tamamlanan istekler ({completedRequests.length})
                    </span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-2">{completedRequests.map(renderRequestRow)}</div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          )}
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
    </AdminPageShell>
  );
};

export default AdminRevisionRequestsPage;
