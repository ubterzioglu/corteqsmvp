// Bir paylaşımın yorum paneli — workshop m57 (kafe içi yorum).
//
// Kafe akışında yorum SAYISI gösteriliyordu ama yazma/okuma arayüzü hiç yoktu.
// Panel buraya bağımsız bir bileşen olarak yazıldı; ana akıştaki (CaddePage) satır
// içi panelle aynı API'leri kullanır: listCaddePostComments (sayfalı) + createCaddeComment.
//
// Davranış sözleşmeleri (ana akışla birebir aynı olmalı):
// - m81: yorum YALNIZ "Gönder" butonuyla yayınlanır; Enter satır atlar.
// - m21: yorumlar panel açılınca çekilir, sayfa sayfa ("Devamını yükle").
// - m62: emoji imleç noktasına, kod noktası sınırına saygılı biçimde eklenir.

import { useRef, useState } from "react";
import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MessageCircle, Send } from "lucide-react";

import CaddeEmojiPickerButton from "@/components/cadde/CaddeEmojiPickerButton";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { createCaddeComment, listCaddePostComments } from "@/lib/cadde-api";
import { caddeQueryKeys } from "@/lib/cadde-query-keys";
import { insertTextAtSelection, type TextSelection } from "@/lib/cadde-text-insert";
import type { CaddeCommentCursor } from "@/lib/cadde-types";

const PAGE_SIZE = 5;

export interface CaddePostCommentsProps {
  postId: string;
  commentCount: number;
  /** Oturumu olmayan / odaya katılmamış kullanıcı yalnız okur. */
  canComment: boolean;
  /** Yorum eklenince çağrılır — çağıran taraf kendi sayaçlarını tazeler. */
  onCommentAdded?: () => void;
}

const CaddePostComments = ({ postId, commentCount, canComment, onCommentAdded }: CaddePostCommentsProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [selection, setSelection] = useState<TextSelection>({ start: 0, end: 0 });
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const commentsQuery = useInfiniteQuery({
    queryKey: caddeQueryKeys.postComments(postId),
    initialPageParam: null as CaddeCommentCursor,
    queryFn: ({ pageParam }) => listCaddePostComments(postId, PAGE_SIZE, pageParam),
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    // m21: panel kapalıyken DB'ye hiç gidilmez.
    enabled: open,
  });

  const commentMutation = useMutation({
    mutationFn: (body: string) => createCaddeComment(postId, body),
    onSuccess: async () => {
      setDraft("");
      await queryClient.invalidateQueries({ queryKey: caddeQueryKeys.postComments(postId) });
      onCommentAdded?.();
    },
    onError: (error: unknown) => {
      toast({
        title: "Yorum gönderilemedi",
        description: error instanceof Error ? error.message : "Bilinmeyen hata",
        variant: "destructive",
      });
    },
  });

  const comments = (commentsQuery.data?.pages ?? []).flatMap((page) => page.items);

  const syncSelection = () => {
    const element = textareaRef.current;
    if (!element) return;
    setSelection({ start: element.selectionStart ?? 0, end: element.selectionEnd ?? 0 });
  };

  const insertEmoji = (emoji: string) => {
    const next = insertTextAtSelection(draft, emoji, selection);
    setDraft(next.value);
    setSelection({ start: next.caret, end: next.caret });
    requestAnimationFrame(() => {
      textareaRef.current?.focus();
      textareaRef.current?.setSelectionRange(next.caret, next.caret);
    });
  };

  const submit = () => {
    if (!draft.trim() || commentMutation.isPending) return;
    commentMutation.mutate(draft);
  };

  return (
    <div className="mt-2" data-testid="cadde-post-comments">
      <button
        type="button"
        data-testid="cadde-post-comments-toggle"
        onClick={() => setOpen((current) => !current)}
        className="inline-flex items-center gap-1.5 rounded-md text-xs text-slate-500 transition hover:text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
      >
        <MessageCircle className="h-3.5 w-3.5" aria-hidden />
        {commentCount} yorum
      </button>

      {open ? (
        <div className="mt-2 space-y-2 rounded-[20px] border border-slate-200/90 bg-slate-50/80 p-3">
          {commentsQuery.isLoading ? <p className="text-sm text-slate-500">Yorumlar yükleniyor…</p> : null}

          {comments.map((comment) => (
            <div
              key={comment.id}
              data-testid="cadde-post-comment"
              className="rounded-xl border border-slate-200/80 bg-white px-3 py-2"
            >
              <p className="text-xs font-medium text-slate-700">{comment.authorName}</p>
              <p className="whitespace-pre-wrap text-sm leading-6 text-slate-700">{comment.body}</p>
            </div>
          ))}

          {!commentsQuery.isLoading && comments.length === 0 ? (
            <p className="text-sm text-slate-500">İlk yorumu sen bırak ve konuşmayı başlat.</p>
          ) : null}

          {commentsQuery.hasNextPage ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => void commentsQuery.fetchNextPage()}
              disabled={commentsQuery.isFetchingNextPage}
            >
              {commentsQuery.isFetchingNextPage ? "Yükleniyor..." : "Devamını yükle"}
            </Button>
          ) : null}

          {canComment ? (
            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="flex min-w-0 flex-1 items-end gap-2">
                {/* m80+m81: onKeyDown YOK — Enter satır atlar, gönderim yalnız butonda. */}
                <Textarea
                  ref={textareaRef}
                  value={draft}
                  onChange={(event) => {
                    setDraft(event.target.value);
                    syncSelection();
                  }}
                  onClick={syncSelection}
                  onKeyUp={syncSelection}
                  onSelect={syncSelection}
                  placeholder="Yorum yaz"
                  rows={2}
                  className="min-h-[64px] bg-white"
                />
                <CaddeEmojiPickerButton onSelect={insertEmoji} className="mb-0.5" />
              </div>
              <Button
                className="self-end whitespace-nowrap sm:min-w-[112px]"
                onClick={submit}
                disabled={commentMutation.isPending}
              >
                <Send className="mr-1.5 h-4 w-4" />
                Gönder
              </Button>
            </div>
          ) : (
            <p className="text-xs text-slate-500">Yorum yazmak için bu odaya katılmalısın.</p>
          )}
        </div>
      ) : null}
    </div>
  );
};

export default CaddePostComments;
