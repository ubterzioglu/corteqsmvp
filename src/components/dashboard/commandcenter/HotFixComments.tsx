// TOP 10 HOT FIX maddesinin altındaki soru/cevap bölümü.
//
// NEDEN: Acil maddeler tek cümleyle yazılıyor; netleştirme yazışması bugüne kadar
// listenin DIŞINDA (sohbet, mail) yürüyordu ve madde ile cevabı arasındaki bağ
// kayboluyordu. Artık soru ve cevap maddenin altında durur.
//
// Bilinçli sadelik: bu bir sohbet arayüzü değil. Düzenleme, yanıtlama, bildirim yok —
// yalnız yaz/oku/sil. Kullanım tipik olarak "10 soruyu yapıştır, cevabı yapıştır".

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MessageSquare, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  HOT_FIX_COMMENT_BODY_MAX,
  createHotFixComment,
  deleteHotFixComment,
  listHotFixComments,
} from "@/lib/dashboard/hot-fix-comments";

const formatWhen = (value: string) =>
  new Intl.DateTimeFormat("tr-TR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));

export interface HotFixCommentsProps {
  hotFixId: string;
  /** Yorum kutusuna varsayılan yazar adı — oturumdaki kişinin adı. */
  defaultAuthorName?: string;
}

const HotFixComments = ({ hotFixId, defaultAuthorName = "" }: HotFixCommentsProps) => {
  const [open, setOpen] = useState(false);
  const [author, setAuthor] = useState(defaultAuthorName);
  const [body, setBody] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const queryKey = ["command-center", "hot-fix-comments", hotFixId];

  const commentsQuery = useQuery({
    queryKey,
    queryFn: () => listHotFixComments(hotFixId),
    // ⚠️ Bir zamanlar `enabled: open` idi — "kapalıyken sorgu açılmasın" diye.
    // Bu, ÖZELLİĞİ İŞE YARAMAZ HALE GETİRİYORDU: kapalıyken yorum sayısı bilinmediği
    // için sayı rozeti hiç çizilmiyor, kullanıcı yorum OLDUĞUNU göremiyordu — her
    // maddeyi tek tek açmak zorunda kalıyordu. Tablo en fazla 10 satır ve yorumlar
    // küçük; maliyet endişesi yersizdi.
    staleTime: 30_000,
  });

  const createMutation = useMutation({
    mutationFn: () => createHotFixComment(hotFixId, author, body),
    onSuccess: async (result) => {
      if (!result.ok) {
        toast({ title: "Yorum eklenemedi", description: result.message ?? undefined, variant: "destructive" });
        return;
      }
      setBody("");
      await queryClient.invalidateQueries({ queryKey });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteHotFixComment(id),
    onSuccess: async (ok) => {
      if (!ok) {
        toast({ title: "Yorum silinemedi", variant: "destructive" });
        return;
      }
      await queryClient.invalidateQueries({ queryKey });
    },
  });

  const comments = commentsQuery.data ?? [];
  const remaining = HOT_FIX_COMMENT_BODY_MAX - body.trim().length;

  return (
    <div className="px-4 pb-3">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        data-testid={`hot-fix-comments-toggle-${hotFixId}`}
        className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-2.5 py-1 text-[11px] font-medium text-gray-600 transition hover:border-gray-300 hover:text-gray-900"
      >
        <MessageSquare className="h-3.5 w-3.5" />
        {/* Sayı ETİKETİN İÇİNDE: yalnız rozet göstermek "4 ne demek?" sorusunu
            doğuruyordu ve kapalıyken hiç okunmuyordu. */}
        {open
          ? "Soru / cevabı gizle"
          : comments.length > 0
            ? `Soru / cevap (${comments.length})`
            : "Soru / cevap ekle"}
      </button>

      {open ? (
        <div className="mt-2 space-y-2 rounded-xl border border-gray-200 bg-gray-50/60 p-3">
          {commentsQuery.isLoading ? (
            <p className="text-[12px] text-gray-500">Yükleniyor…</p>
          ) : comments.length === 0 ? (
            <p className="text-[12px] text-gray-500">
              Henüz yorum yok. Soruları ya da cevapları buraya yapıştırabilirsin.
            </p>
          ) : (
            <ul className="space-y-2">
              {comments.map((comment) => (
                <li key={comment.id} className="rounded-lg border border-gray-200 bg-white p-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-semibold text-gray-800">{comment.authorName}</span>
                    <span className="flex items-center gap-2">
                      <span className="text-[10px] text-gray-500">{formatWhen(comment.createdAt)}</span>
                      <button
                        type="button"
                        aria-label="Yorumu sil"
                        onClick={() => deleteMutation.mutate(comment.id)}
                        disabled={deleteMutation.isPending}
                        className="rounded p-0.5 text-gray-400 transition hover:text-red-600"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </span>
                  </div>
                  {/* whitespace-pre-wrap: yapıştırılan çok satırlı soru listesi biçimini korusun. */}
                  <p className="mt-1 whitespace-pre-wrap text-[12px] leading-5 text-gray-700">{comment.body}</p>
                </li>
              ))}
            </ul>
          )}

          <div className="space-y-1.5 pt-1">
            <Input
              value={author}
              onChange={(event) => setAuthor(event.target.value)}
              placeholder="Adın (ör. Barış)"
              className="h-8 text-[12px]"
            />
            <Textarea
              value={body}
              onChange={(event) => setBody(event.target.value)}
              placeholder="Soruları ya da cevapları buraya yapıştır…"
              rows={4}
              className="text-[12px]"
            />
            <div className="flex items-center justify-between gap-2">
              <span className={`text-[10px] ${remaining < 0 ? "text-red-600" : "text-gray-400"}`}>
                {remaining < 0 ? `${-remaining} karakter fazla` : `${remaining} karakter kaldı`}
              </span>
              <Button
                type="button"
                size="sm"
                onClick={() => createMutation.mutate()}
                disabled={createMutation.isPending || !body.trim() || remaining < 0}
                className="h-7 text-[12px]"
              >
                {createMutation.isPending ? "Ekleniyor…" : "Ekle"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default HotFixComments;
