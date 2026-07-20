// /admin/social-share-vault genelinde (4 sekmenin tamamında) her kalem/varyant
// için medya paneli. Görsel yükle VEYA görsel linki (Gmail/Drive) + Drive video
// butonu & video linki + not. Hepsi opsiyonel, bağımsız; değişiklik anında
// social_share_assets'e upsert edilir. Bileşen adı tarihsel nedenle "Burak"
// içeriyor (özellik ilk o sekmede çıktı) ama artık tab-agnostik.

import { useEffect, useRef, useState } from "react";
import { ExternalLink, ImageIcon, Loader2, Trash2, Upload, Video } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { ExtraImagesGallery } from "@/components/admin/social-share/ExtraImagesGallery";
import {
  BURAK_DRIVE_FOLDER_URL,
  getBurakShareImageUrl,
  removeBurakShareImage,
  uploadBurakShareImage,
  upsertBurakShareAsset,
  type BurakAssetPatch,
  type BurakShareAsset,
} from "@/lib/admin-shell/burak-share-assets";
import type { ShareTab } from "@/lib/admin-shell/social-share-log";

type BurakMediaPanelProps = {
  slotKey: string;
  tab: ShareTab;
  itemId: string;
  variantIndex: number;
  asset: BurakShareAsset | undefined;
  onExtraImageCountChange?: (count: number) => void;
};

const errMessage = (error: unknown): string =>
  error instanceof Error ? error.message : "Beklenmeyen hata";

export function BurakMediaPanel({
  slotKey,
  tab,
  itemId,
  variantIndex,
  asset,
  onExtraImageCountChange,
}: BurakMediaPanelProps) {
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement | null>(null);

  const [imageBucket, setImageBucket] = useState<string | null>(asset?.imageBucket ?? null);
  const [imagePath, setImagePath] = useState<string | null>(asset?.imagePath ?? null);
  const [imageUrl, setImageUrl] = useState(asset?.imageUrl ?? "");
  const [videoUrl, setVideoUrl] = useState(asset?.videoUrl ?? "");
  const [note, setNote] = useState(asset?.note ?? "");

  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  // Yüklü görselin signed URL önizlemesi.
  useEffect(() => {
    let active = true;
    if (imageBucket && imagePath) {
      getBurakShareImageUrl(imageBucket, imagePath)
        .then((url) => {
          if (active) setPreview(url);
        })
        .catch(() => {
          if (active) setPreview(null);
        });
    } else {
      setPreview(null);
    }
    return () => {
      active = false;
    };
  }, [imageBucket, imagePath]);

  const saveText = async (patch: BurakAssetPatch) => {
    try {
      await upsertBurakShareAsset(slotKey, patch);
    } catch (error: unknown) {
      toast({ title: "Kaydedilemedi", description: errMessage(error), variant: "destructive" });
    }
  };

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      const { bucket, path } = await uploadBurakShareImage(tab, itemId, variantIndex, file);
      await upsertBurakShareAsset(slotKey, { imageBucket: bucket, imagePath: path });
      setImageBucket(bucket);
      setImagePath(path);
      toast({ title: "Görsel yüklendi" });
    } catch (error: unknown) {
      toast({ title: "Yüklenemedi", description: errMessage(error), variant: "destructive" });
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const handleRemoveImage = async () => {
    try {
      if (imageBucket && imagePath) await removeBurakShareImage(imageBucket, imagePath);
      await upsertBurakShareAsset(slotKey, { imageBucket: null, imagePath: null });
      setImageBucket(null);
      setImagePath(null);
      toast({ title: "Görsel kaldırıldı" });
    } catch (error: unknown) {
      toast({ title: "Kaldırılamadı", description: errMessage(error), variant: "destructive" });
    }
  };

  return (
    <div className="mt-2 space-y-3 rounded-lg border border-dashed bg-muted/30 p-3">
      {/* Görsel */}
      <div className="space-y-2">
        <Label className="flex items-center gap-1.5 text-xs font-semibold">
          <ImageIcon className="h-3.5 w-3.5" /> Görsel
        </Label>
        {preview ? (
          <div className="flex items-center gap-3">
            <img src={preview} alt="" className="h-16 w-16 rounded object-cover" />
            <Button variant="ghost" size="sm" onClick={handleRemoveImage}>
              <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Kaldır
            </Button>
          </div>
        ) : (
          <div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void handleUpload(file);
              }}
            />
            <Button
              variant="outline"
              size="sm"
              disabled={uploading}
              onClick={() => fileRef.current?.click()}
            >
              {uploading ? (
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
              ) : (
                <Upload className="mr-1.5 h-3.5 w-3.5" />
              )}
              Görsel Yükle
            </Button>
          </div>
        )}
      </div>

      {/* Ek görseller (kapak görselinden ayrı, sınırsız sayıda) */}
      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">Ek görseller</Label>
        <ExtraImagesGallery
          slotKey={slotKey}
          tab={tab}
          itemId={itemId}
          variantIndex={variantIndex}
          onCountChange={onExtraImageCountChange}
        />
      </div>

      {/* Görsel linki (foto yüklenmezse) */}
      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">
          Görsel linki (foto yüklenmezse Gmail/Drive)
        </Label>
        <div className="flex items-center gap-2">
          <Input
            value={imageUrl}
            placeholder="https://drive.google.com/..."
            className="h-8 text-xs"
            onChange={(e) => setImageUrl(e.target.value)}
            onBlur={() => void saveText({ imageUrl: imageUrl.trim() || null })}
          />
          {imageUrl.trim() ? (
            <a href={imageUrl.trim()} target="_blank" rel="noopener noreferrer">
              <Button variant="ghost" size="sm" className="h-8 px-2">
                <ExternalLink className="h-3.5 w-3.5" />
              </Button>
            </a>
          ) : null}
        </div>
      </div>

      {/* Video */}
      <div className="space-y-1">
        <Label className="flex items-center gap-1.5 text-xs font-semibold">
          <Video className="h-3.5 w-3.5" /> Video
        </Label>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open(BURAK_DRIVE_FOLDER_URL, "_blank", "noopener,noreferrer")}
          >
            <Upload className="mr-1.5 h-3.5 w-3.5" /> Videoyu Drive'a Yükle
          </Button>
          <Input
            value={videoUrl}
            placeholder="Drive video linki yapıştır"
            className="h-8 flex-1 text-xs"
            onChange={(e) => setVideoUrl(e.target.value)}
            onBlur={() => void saveText({ videoUrl: videoUrl.trim() || null })}
          />
          {videoUrl.trim() ? (
            <a href={videoUrl.trim()} target="_blank" rel="noopener noreferrer">
              <Button variant="ghost" size="sm" className="h-8 px-2">
                <ExternalLink className="mr-1 h-3.5 w-3.5" /> Aç
              </Button>
            </a>
          ) : null}
        </div>
      </div>

      {/* Not */}
      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">Not</Label>
        <Textarea
          value={note}
          placeholder="Kısa not (opsiyonel)"
          className="min-h-[52px] resize-y text-xs"
          onChange={(e) => setNote(e.target.value)}
          onBlur={() => void saveText({ note: note.trim() || null })}
        />
      </div>
    </div>
  );
}
