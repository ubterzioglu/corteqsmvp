// Cadde gönderi kartı — üç nokta menüsü (A11c).
//
// YALNIZ kendi gönderisinde gösterilir (CaddeFeedView `authorUserId === user.id`
// ile kapılar); yetkinin GERÇEK denetimi DB'dedir (delete_cadde_post_v1, A11a).
// Silme onay diyaloğu AlertDialog ile alınır — geri alınamaz kullanıcı akışı.
//
// ⚠️ RPC hataları supabase-js'te DÜZ NESNEDİR (`Error` örneği DEĞİL, m75 dersi).
// `deleteCaddePost` hatayı `caddeWriteError` ile Error'a sarıp Türkçeleştirir;
// toast'taki daraltma yine `instanceof Error` + `resolveCaddeRpcErrorMessage`
// yedeğiyle yapılır.

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { MoreHorizontal, Pencil, Share2, Trash2 } from "lucide-react";
import { useState } from "react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { deleteCaddePost } from "@/lib/cadde-api";
import { caddeQueryKeys } from "@/lib/cadde-query-keys";
import { resolveCaddeRpcErrorMessage } from "@/lib/cadde-rules";

export type CaddePostMenuProps = {
  postId: string;
  /**
   * A11d: "Paylaş" maddesi MEVCUT paylaşım altyapısına bağlanır —
   * `useCaddePostEngagement.shareMutation` (web share → pano → sayaç).
   * Yeni mekanizma YAZMA; çağıran FeedView'de mutation'ı geçirir.
   */
  onShare?: () => void;
  /**
   * CD03: "Düzenle" maddesi composer'ı edit moduna alır (startEditing +
   * scrollToComposer FeedView'de). Yetkinin gerçek denetimi DB'de
   * (update_cadde_post_v1: sahip veya admin/moderatör) — buradaki koşul
   * A11c'deki gibi yalnız görünürlük.
   */
  onEdit?: () => void;
};

export default function CaddePostMenu({ postId, onShare, onEdit }: CaddePostMenuProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const deleteMutation = useMutation({
    mutationFn: () => deleteCaddePost(postId),
    onSuccess: async () => {
      setConfirmOpen(false);
      toast({ title: "Paylaşımın akıştan kaldırıldı" });
      await queryClient.invalidateQueries({ queryKey: caddeQueryKeys.feedRoot });
    },
    onError: (error: unknown) => {
      setConfirmOpen(false);
      toast({
        title: "Paylaşım silinemedi",
        description: error instanceof Error ? error.message : resolveCaddeRpcErrorMessage(error),
        variant: "destructive",
      });
    },
  });

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            data-testid="cadde-post-menu-trigger"
            aria-label="Paylaşım seçenekleri"
            className="min-h-10 text-slate-500 hover:text-slate-800"
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {onShare ? (
            <DropdownMenuItem onSelect={onShare}>
              <Share2 className="mr-2 h-4 w-4" aria-hidden="true" />
              Paylaş
            </DropdownMenuItem>
          ) : null}
          {onEdit ? (
            <DropdownMenuItem data-testid="cadde-post-menu-edit" onSelect={onEdit}>
              <Pencil className="mr-2 h-4 w-4" aria-hidden="true" />
              Düzenle
            </DropdownMenuItem>
          ) : null}
          <DropdownMenuItem
            className="text-red-600 focus:text-red-600"
            onSelect={() => setConfirmOpen(true)}
          >
            <Trash2 className="mr-2 h-4 w-4" aria-hidden="true" />
            Sil
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Bu paylaşımı silmek istiyor musun?</AlertDialogTitle>
            <AlertDialogDescription>
              Paylaşımın akıştan kaldırılacak ve yorumlarıyla birlikte görünmez olacak.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>Vazgeç</AlertDialogCancel>
            <AlertDialogAction
              data-testid="cadde-post-delete-confirm"
              className="bg-red-600 text-white hover:bg-red-700"
              disabled={deleteMutation.isPending}
              onClick={(event) => {
                // AlertDialogAction kendi kapanışını tetikler; mutation sonucunu
                // bekleyebilmek için varsayılanı durdurup open state'i elle yönetiyoruz.
                event.preventDefault();
                deleteMutation.mutate();
              }}
            >
              {deleteMutation.isPending ? "Siliniyor…" : "Sil"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
