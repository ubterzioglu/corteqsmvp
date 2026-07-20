// BurakMediaPanel'in alt bileşeni — kapak görselinin yanına eklenen ek
// görseller (sınırsız sayıda, sıralı küçük resim galerisi). social_share_asset_images
// tablosunu kullanır; kapak görselinden bağımsız, ayrı ayrı silinebilir.

import { useEffect, useState } from "react";
import { Loader2, Plus, Trash2 } from "lucide-react";

import { useToast } from "@/hooks/use-toast";
import {
  addBurakShareExtraImage,
  getBurakShareImageUrl,
  listBurakShareExtraImages,
  removeBurakShareExtraImage,
  type BurakShareExtraImage,
} from "@/lib/admin-shell/burak-share-assets";
import type { ShareTab } from "@/lib/admin-shell/social-share-log";

type ExtraImagesGalleryProps = {
  slotKey: string;
  tab: ShareTab;
  itemId: string;
  variantIndex: number;
  onCountChange?: (count: number) => void;
};

type GalleryEntry = BurakShareExtraImage & { previewUrl: string | null };

const errMessage = (error: unknown): string =>
  error instanceof Error ? error.message : "Beklenmeyen hata";

export function ExtraImagesGallery({
  slotKey,
  tab,
  itemId,
  variantIndex,
  onCountChange,
}: ExtraImagesGalleryProps) {
  const { toast } = useToast();
  const [entries, setEntries] = useState<GalleryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    listBurakShareExtraImages(slotKey)
      .then(async (images) => {
        const withPreviews = await Promise.all(
          images.map(async (image) => {
            try {
              const previewUrl = await getBurakShareImageUrl(image.imageBucket, image.imagePath);
              return { ...image, previewUrl };
            } catch {
              return { ...image, previewUrl: null };
            }
          }),
        );
        if (active) {
          setEntries(withPreviews);
          onCountChange?.(withPreviews.length);
        }
      })
      .catch((error: unknown) => {
        if (active) {
          toast({
            title: "Görseller yüklenemedi",
            description: errMessage(error),
            variant: "destructive",
          });
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slotKey]);

  const handleAdd = async (file: File) => {
    setUploading(true);
    try {
      const nextOrder = entries.length;
      const image = await addBurakShareExtraImage(tab, itemId, variantIndex, slotKey, file, nextOrder);
      const previewUrl = await getBurakShareImageUrl(image.imageBucket, image.imagePath).catch(
        () => null,
      );
      setEntries((current) => {
        const next = [...current, { ...image, previewUrl }];
        onCountChange?.(next.length);
        return next;
      });
      toast({ title: "Görsel eklendi" });
    } catch (error: unknown) {
      toast({ title: "Eklenemedi", description: errMessage(error), variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = async (image: GalleryEntry) => {
    try {
      await removeBurakShareExtraImage(image);
      setEntries((current) => {
        const next = current.filter((entry) => entry.id !== image.id);
        onCountChange?.(next.length);
        return next;
      });
      toast({ title: "Görsel kaldırıldı" });
    } catch (error: unknown) {
      toast({ title: "Kaldırılamadı", description: errMessage(error), variant: "destructive" });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Loader2 className="h-3 w-3 animate-spin" /> Ek görseller yükleniyor…
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <div className="flex flex-wrap items-center gap-2">
        {entries.map((entry) => (
          <div key={entry.id} className="group relative h-16 w-16">
            {entry.previewUrl ? (
              <img
                src={entry.previewUrl}
                alt=""
                className="h-16 w-16 rounded object-cover"
              />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded bg-muted text-[0.6rem] text-muted-foreground">
                yüklenemedi
              </div>
            )}
            <button
              type="button"
              onClick={() => void handleRemove(entry)}
              className="absolute -right-1.5 -top-1.5 rounded-full bg-destructive p-1 text-destructive-foreground opacity-0 shadow transition-opacity group-hover:opacity-100"
              aria-label="Görseli kaldır"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          </div>
        ))}
        <label className="flex h-16 w-16 cursor-pointer flex-col items-center justify-center gap-1 rounded border border-dashed text-muted-foreground hover:bg-muted/50">
          <input
            type="file"
            accept="image/*"
            className="hidden"
            disabled={uploading}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void handleAdd(file);
              e.target.value = "";
            }}
          />
          {uploading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Plus className="h-4 w-4" />
          )}
          <span className="text-[0.6rem]">Ekle</span>
        </label>
      </div>
    </div>
  );
}
