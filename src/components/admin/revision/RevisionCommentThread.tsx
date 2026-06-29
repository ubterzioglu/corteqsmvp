// Revizyon talebi yorum thread'i — bir talebin yorumlarını listeler ve yeni yorum ekler.
// AdminRevisionRequestsPage'in detay drawer'ı içinde render edilir.

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Send, Trash2 } from "lucide-react";

import { AdminEmptyState } from "@/components/admin/page";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  addComment,
  deleteComment,
  fetchComments,
  fetchUserEmails,
  type RevisionComment,
} from "@/lib/admin-shell/revision-requests";

const commentsKey = (requestId: string) => ["revision-comments", requestId] as const;

function formatDateTime(value: string): string {
  return new Date(value).toLocaleString("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function authorLabel(comment: RevisionComment, emails: Record<string, string>): string {
  if (!comment.createdBy) return "Bilinmeyen";
  return emails[comment.createdBy] || "Admin";
}

export type RevisionCommentThreadProps = {
  requestId: string;
};

export function RevisionCommentThread({ requestId }: RevisionCommentThreadProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState("");

  const commentsQuery = useQuery({
    queryKey: commentsKey(requestId),
    queryFn: () => fetchComments(requestId),
  });

  const comments = commentsQuery.data ?? [];

  const emailsQuery = useQuery({
    queryKey: ["revision-comment-emails", requestId, comments.map((c) => c.createdBy).join(",")],
    queryFn: () => fetchUserEmails(comments.map((c) => c.createdBy)),
    enabled: comments.length > 0,
  });
  const emails = emailsQuery.data ?? {};

  const addMutation = useMutation({
    mutationFn: (body: string) => addComment(requestId, body),
    onSuccess: async () => {
      setDraft("");
      await queryClient.invalidateQueries({ queryKey: commentsKey(requestId) });
      await queryClient.invalidateQueries({ queryKey: ["revision-requests"] });
    },
    onError: (error: unknown) => {
      toast({
        title: "Yorum eklenemedi",
        description: error instanceof Error ? error.message : "Bilinmeyen hata",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteComment(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: commentsKey(requestId) });
      await queryClient.invalidateQueries({ queryKey: ["revision-requests"] });
    },
    onError: (error: unknown) => {
      toast({
        title: "Yorum silinemedi",
        description: error instanceof Error ? error.message : "Bilinmeyen hata",
        variant: "destructive",
      });
    },
  });

  const handleSend = () => {
    if (!draft.trim()) return;
    addMutation.mutate(draft);
  };

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto">
        {commentsQuery.isLoading ? (
          <div className="flex items-center justify-center py-6 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : comments.length === 0 ? (
          <AdminEmptyState
            title="Henüz yorum yok"
            description="İlk yorumu ekleyerek tartışmayı başlatın."
          />
        ) : (
          comments.map((comment) => (
            <div
              key={comment.id}
              className="rounded-lg border border-border bg-muted/30 p-3"
            >
              <div className="mb-1 flex items-center justify-between gap-2 text-xs text-muted-foreground">
                <span className="font-medium text-foreground">{authorLabel(comment, emails)}</span>
                <span className="flex items-center gap-2">
                  {formatDateTime(comment.createdAt)}
                  <button
                    type="button"
                    aria-label="Yorumu sil"
                    className="text-muted-foreground transition hover:text-red-500"
                    onClick={() => deleteMutation.mutate(comment.id)}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </span>
              </div>
              <p className="whitespace-pre-wrap text-sm text-foreground">{comment.body}</p>
            </div>
          ))
        )}
      </div>

      <div className="space-y-2 border-t border-border pt-3">
        <Textarea
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Yorum yazın…"
          rows={3}
        />
        <div className="flex justify-end">
          <Button
            size="sm"
            onClick={handleSend}
            disabled={addMutation.isPending || !draft.trim()}
          >
            {addMutation.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Send className="mr-2 h-4 w-4" />
            )}
            Gönder
          </Button>
        </div>
      </div>
    </div>
  );
}
