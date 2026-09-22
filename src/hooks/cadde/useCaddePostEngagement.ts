import { useEffect, useMemo, useRef, useState, type SyntheticEvent } from "react";
import { useInfiniteQuery, useMutation, useQueryClient, type QueryKey } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";

import { useToast } from "@/hooks/use-toast";
import {
  createCaddeComment,
  listCaddePostComments,
  recordCaddeShare,
  reportCaddeEntity,
  toggleCaddeReaction,
} from "@/lib/cadde-api";
import { caddeOpenCommentsPollInterval } from "@/lib/cadde-feed-polling";
import { caddeQueryKeys } from "@/lib/cadde-query-keys";
import { applyReactionToFeedPages } from "@/lib/cadde-reactions";
import { resolveCaddeRpcErrorMessage } from "@/lib/cadde-rules";
import { insertTextAtSelection, type TextSelection } from "@/lib/cadde-text-insert";
import type { CaddeCommentCursor, CaddeReactionType } from "@/lib/cadde-types";

const COMMENT_PAGE_SIZE = 5;
export const CADDE_REACTION_CLOSE_DELAY_MS = 180;

const caddePostShareUrl = (postId: string): string => {
  const url = new URL("/cadde", window.location.origin);
  url.searchParams.set("post", postId);
  return url.toString();
};

type UseCaddePostEngagementInput = {
  currentUserId: string | null;
  feedQueryKey: QueryKey;
  onInvalidateCadde: () => Promise<void>;
};

export function useCaddePostEngagement({
  currentUserId,
  feedQueryKey,
  onInvalidateCadde,
}: UseCaddePostEngagementInput) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
  const [commentSelections, setCommentSelections] = useState<Record<string, TextSelection>>({});
  const [expandedCommentPostId, setExpandedCommentPostId] = useState<string | null>(null);
  const [openReactionsPostId, setOpenReactionsPostId] = useState<string | null>(null);
  const reactionPointerDownRef = useRef(false);
  const reactionOpenedByHoverRef = useRef(false);
  const reactionCloseTimerRef = useRef<number | null>(null);
  const commentsZeroStreakRef = useRef(0);
  const commentsSignatureRef = useRef<string | null>(null);
  const commentTextareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(
    () => () => {
      if (reactionCloseTimerRef.current !== null) window.clearTimeout(reactionCloseTimerRef.current);
    },
    [],
  );

  const commentsQuery = useInfiniteQuery({
    queryKey: caddeQueryKeys.postComments(expandedCommentPostId),
    initialPageParam: null as CaddeCommentCursor,
    queryFn: ({ pageParam }) => listCaddePostComments(expandedCommentPostId ?? "", COMMENT_PAGE_SIZE, pageParam),
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    enabled: Boolean(expandedCommentPostId),
    refetchInterval: () =>
      expandedCommentPostId ? caddeOpenCommentsPollInterval(commentsZeroStreakRef.current) : false,
    refetchOnWindowFocus: "always",
  });
  const expandedComments = useMemo(
    () => commentsQuery.data?.pages.flatMap((page) => page.items) ?? [],
    [commentsQuery.data],
  );
  const commentsSignature = useMemo(
    () => expandedComments.map((comment) => `${comment.id}:${comment.createdAt}`).join("|"),
    [expandedComments],
  );

  useEffect(() => {
    commentsZeroStreakRef.current = 0;
    commentsSignatureRef.current = null;
  }, [expandedCommentPostId]);

  useEffect(() => {
    if (!expandedCommentPostId || !commentsQuery.dataUpdatedAt) return;
    if (commentsSignatureRef.current === null) {
      commentsSignatureRef.current = commentsSignature;
      commentsZeroStreakRef.current = 0;
      return;
    }
    if (commentsSignatureRef.current === commentsSignature) {
      commentsZeroStreakRef.current += 1;
      return;
    }
    commentsSignatureRef.current = commentsSignature;
    commentsZeroStreakRef.current = 0;
  }, [commentsQuery.dataUpdatedAt, commentsSignature, expandedCommentPostId]);

  const reactionMutation = useMutation({
    mutationFn: async ({ postId, reactionType }: { postId: string; reactionType: CaddeReactionType }) => {
      if (!currentUserId) throw new Error("Bu işlem için giriş yapın.");
      await toggleCaddeReaction(postId, reactionType);
    },
    onMutate: async ({ postId, reactionType }: { postId: string; reactionType: CaddeReactionType }) => {
      if (!currentUserId) return { previousFeed: undefined };
      await queryClient.cancelQueries({ queryKey: feedQueryKey });
      const previousFeed = queryClient.getQueryData(feedQueryKey);
      queryClient.setQueryData(feedQueryKey, (current: Parameters<typeof applyReactionToFeedPages>[0]) =>
        applyReactionToFeedPages(current, postId, reactionType),
      );
      return { previousFeed };
    },
    onError: (error, _variables, context) => {
      if (context?.previousFeed !== undefined) {
        queryClient.setQueryData(feedQueryKey, context.previousFeed);
      }
      if (!currentUserId) {
        navigate("/login");
        return;
      }
      toast({
        title: "Reaksiyon güncellenemedi",
        description: error instanceof Error ? error.message : "Bilinmeyen hata",
        variant: "destructive",
      });
    },
  });

  const commentMutation = useMutation({
    mutationFn: async ({ postId, body }: { postId: string; body: string }) => {
      if (!currentUserId) throw new Error("Bu işlem için giriş yapın.");
      if (!body.trim()) throw new Error("Yorum boş olamaz.");
      await createCaddeComment(postId, body);
    },
    onSuccess: async (_data, variables) => {
      setCommentDrafts((current) => ({ ...current, [variables.postId]: "" }));
      await Promise.all([
        onInvalidateCadde(),
        queryClient.invalidateQueries({ queryKey: caddeQueryKeys.postComments(variables.postId) }),
      ]);
    },
    onError: (error) => {
      if (!currentUserId) {
        navigate("/login");
        return;
      }
      toast({
        title: "Yorum gönderilemedi",
        description: error instanceof Error ? error.message : resolveCaddeRpcErrorMessage(error),
        variant: "destructive",
      });
    },
  });

  const syncCommentSelection = (postId: string, event: SyntheticEvent<HTMLTextAreaElement>) => {
    setCommentSelections((current) => ({
      ...current,
      [postId]: {
        start: event.currentTarget.selectionStart ?? 0,
        end: event.currentTarget.selectionEnd ?? event.currentTarget.selectionStart ?? 0,
      },
    }));
  };

  const insertCommentEmoji = (postId: string, emoji: string) => {
    const body = commentDrafts[postId] ?? "";
    const next = insertTextAtSelection(
      body,
      emoji,
      commentSelections[postId] ?? { start: body.length, end: body.length },
    );
    setCommentDrafts((current) => ({ ...current, [postId]: next.value }));
    setCommentSelections((current) => ({ ...current, [postId]: { start: next.caret, end: next.caret } }));
    requestAnimationFrame(() => {
      commentTextareaRef.current?.focus();
      commentTextareaRef.current?.setSelectionRange(next.caret, next.caret);
    });
  };

  const shareMutation = useMutation({
    mutationFn: async ({ postId, title, body }: { postId: string; title: string | null; body: string }) => {
      if (!currentUserId) throw new Error("Bu işlem için giriş yapın.");
      const url = caddePostShareUrl(postId);
      const text = body.trim().slice(0, 180);
      if (typeof navigator.share === "function") {
        await navigator.share({ title: title ?? "CorteQS Cadde", text, url });
        await recordCaddeShare(postId, "web_share");
        return "web_share" as const;
      }
      if (!navigator.clipboard?.writeText) throw new Error("Paylaşım bağlantısı kopyalanamadı.");
      await navigator.clipboard.writeText(url);
      await recordCaddeShare(postId, "copy_link");
      return "copy_link" as const;
    },
    onSuccess: async (channel) => {
      await onInvalidateCadde();
      toast({ title: channel === "copy_link" ? "Bağlantı kopyalandı" : "Paylaşım kaydedildi" });
    },
    onError: (error) => {
      if (!currentUserId) {
        navigate("/login");
        return;
      }
      toast({
        title: "Paylaşım yapılamadı",
        description: error instanceof Error ? error.message : "Bilinmeyen hata",
        variant: "destructive",
      });
    },
  });

  const reportMutation = useMutation({
    mutationFn: async (postId: string) => {
      if (!currentUserId) throw new Error("Bu işlem için giriş yapın.");
      const reason = window.prompt("Şikayet sebebini kısaca yaz (3-200 karakter):");
      if (reason === null) return false;
      await reportCaddeEntity("post", postId, reason);
      return true;
    },
    onSuccess: (submitted) => {
      if (submitted) toast({ title: "Şikayetin moderasyona iletildi" });
    },
    onError: (error) => {
      toast({
        title: "Şikayet gönderilemedi",
        description: error instanceof Error ? error.message : "Bilinmeyen hata",
        variant: "destructive",
      });
    },
  });

  return {
    commentDrafts,
    commentMutation,
    commentTextareaRef,
    commentsQuery,
    expandedComments,
    expandedCommentPostId,
    insertCommentEmoji,
    openReactionsPostId,
    reactionCloseTimerRef,
    reactionMutation,
    reactionOpenedByHoverRef,
    reactionPointerDownRef,
    reportMutation,
    setCommentDrafts,
    setExpandedCommentPostId,
    setOpenReactionsPostId,
    shareMutation,
    syncCommentSelection,
  };
}
