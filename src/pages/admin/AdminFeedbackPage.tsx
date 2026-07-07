// Üye Geri Bildirimleri — admin sayfası.
// /feedback formundan gelen member_feedback kayıtları: liste + durum güncelleme + soft-delete.
// DB katmanı: src/lib/feedback.ts (RLS: SELECT/UPDATE admin-only).
// Desen kaynağı: AdminRevisionRequestsPage.tsx.

import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Inbox, Trash2 } from "lucide-react";

import {
  AdminEmptyState,
  AdminErrorState,
  AdminLoadingState,
  AdminPageShell,
  AdminStatusBadge,
  type AdminStatusTone,
} from "@/components/admin/page";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { fetchUserEmails } from "@/lib/admin-shell/revision-requests";
import {
  FEEDBACK_STATUSES,
  deleteFeedback,
  fetchFeedbackList,
  getFeedbackStatusLabel,
  updateFeedbackStatus,
  type FeedbackStatus,
} from "@/lib/feedback";

const FEEDBACK_KEY = ["member-feedback"] as const;

const STATUS_TONES: Record<FeedbackStatus, AdminStatusTone> = {
  yeni: "info",
  okundu: "success",
  arsiv: "neutral",
};

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const AdminFeedbackPage = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const feedbackQuery = useQuery({
    queryKey: FEEDBACK_KEY,
    queryFn: fetchFeedbackList,
  });
  const feedbackList = useMemo(() => feedbackQuery.data ?? [], [feedbackQuery.data]);

  const emailsQuery = useQuery({
    queryKey: ["member-feedback-emails", feedbackList.map((f) => f.createdBy).join(",")],
    queryFn: () => fetchUserEmails(feedbackList.map((f) => f.createdBy)),
    enabled: feedbackList.length > 0,
  });
  const emails = emailsQuery.data ?? {};

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: FeedbackStatus }) =>
      updateFeedbackStatus(id, status),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: FEEDBACK_KEY });
      toast({ title: "Durum güncellendi" });
    },
    onError: (error: unknown) => {
      toast({
        title: "Durum güncellenemedi",
        description: error instanceof Error ? error.message : "Bilinmeyen hata",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteFeedback(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: FEEDBACK_KEY });
      toast({ title: "Geri bildirim silindi" });
    },
    onError: (error: unknown) => {
      toast({
        title: "Silinemedi",
        description: error instanceof Error ? error.message : "Bilinmeyen hata",
        variant: "destructive",
      });
    },
  });

  return (
    <AdminPageShell
      title="Üye Geri Bildirimleri"
      description="Üyelerin sitedeki 'Feedback Ver' formundan gönderdiği geri bildirimler. Durumu güncelleyin (Yeni / Okundu / Arşiv) veya listeden kaldırın. Tüm adminler ortak görür."
      icon={Inbox}
      accent="violet"
      contentWidth="wide"
    >
      {feedbackQuery.isLoading ? (
        <AdminLoadingState label="Geri bildirimler yükleniyor" rows={4} />
      ) : feedbackQuery.isError ? (
        <AdminErrorState
          description="Geri bildirimler yüklenemedi."
          onRetry={() => feedbackQuery.refetch()}
        />
      ) : feedbackList.length === 0 ? (
        <AdminEmptyState
          icon={Inbox}
          title="Henüz geri bildirim yok"
          description="Üyeler sitedeki 'Feedback Ver' butonunu kullandığında kayıtlar burada listelenir."
        />
      ) : (
        <div className="space-y-3">
          {feedbackList.map((feedback) => (
            <div
              key={feedback.id}
              className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 sm:flex-row sm:items-start sm:justify-between"
            >
              <div className="flex-1">
                <div className="mb-1.5 flex flex-wrap items-center gap-2">
                  <AdminStatusBadge tone={STATUS_TONES[feedback.status]}>
                    {getFeedbackStatusLabel(feedback.status)}
                  </AdminStatusBadge>
                  {feedback.pagePath ? (
                    <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                      {feedback.pagePath}
                    </span>
                  ) : null}
                </div>
                <p className="whitespace-pre-wrap text-sm text-foreground">{feedback.body}</p>
                <p className="mt-1.5 text-xs text-muted-foreground">
                  {feedback.createdBy
                    ? emails[feedback.createdBy] || "Üye"
                    : "Bilinmeyen üye"}{" "}
                  · {formatDate(feedback.createdAt)}
                </p>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <Select
                  value={feedback.status}
                  onValueChange={(status) =>
                    statusMutation.mutate({ id: feedback.id, status: status as FeedbackStatus })
                  }
                  disabled={statusMutation.isPending}
                >
                  <SelectTrigger className="h-9 w-[120px]" aria-label="Durum">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FEEDBACK_STATUSES.map((status) => (
                      <SelectItem key={status} value={status}>
                        {getFeedbackStatusLabel(status)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-red-500"
                  onClick={() => deleteMutation.mutate(feedback.id)}
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
    </AdminPageShell>
  );
};

export default AdminFeedbackPage;
