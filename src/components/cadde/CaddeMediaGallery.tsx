// Feed kartı ve ilan detayındaki medya ızgarası + büyütme (lightbox).
//
// Yerleşim ek sayısına göre değişir: 1 tam genişlik, 2 yan yana, 3'te ilki büyük,
// 4'te 2x2. Video her zaman tam genişlik ve native kontrollerle (otomatik oynatma YOK —
// akışta ses patlaması kullanıcıyı kaçırır).

import { useCallback, useEffect, useState } from "react";
import { Play, X } from "lucide-react";

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import type { CaddeMediaAsset } from "@/lib/cadde-types";

export interface CaddeMediaGalleryProps {
  media: readonly CaddeMediaAsset[];
  /** Erişilebilirlik için alt metin bağlamı (paylaşım sahibi / ilan başlığı). */
  contextLabel?: string;
}

/** Ek sayısına göre ızgara sınıfı — 3'lüde ilk görsel iki satır kaplar. */
const gridClassFor = (count: number): string => {
  if (count <= 1) return "grid-cols-1";
  if (count === 3) return "grid-cols-2 grid-rows-2";
  return "grid-cols-2";
};

const cellClassFor = (count: number, index: number): string => {
  if (count === 3 && index === 0) return "row-span-2 aspect-[3/4]";
  // m64: tek görselde sabit oran YOK — görsel kendi oranıyla, büyük ve gömülü durur.
  if (count === 1) return "";
  return "aspect-square";
};

// m64: "ek dosya gibi duruyor" şikayetinin iki kaynağı vardı:
// (1) tek görselde yükseklik zinciri kopuktu — buton `max-h` taşıyordu ama yüksekliği
//     yoktu, içindeki `h-full` görsel buna dayanamıyordu;
// (2) `object-cover` dikey fotoğrafı ince bir şeride kırpıyordu.
// Tek görsel artık `object-contain` + yüksek tavanla kendi oranında çizilir; çoklu
// ızgarada `object-cover` doğru davranıştır (hücreler eşit kalmalı), o korunur.
const imageClassFor = (count: number): string =>
  count === 1
    ? "max-h-[560px] w-full object-contain transition duration-300"
    : "h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]";

const CaddeMediaGallery = ({ media, contextLabel }: CaddeMediaGalleryProps) => {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const images = media.filter((asset) => asset.kind === "image");
  const videos = media.filter((asset) => asset.kind === "video");

  const closeLightbox = useCallback(() => setLightboxIndex(null), []);

  // Lightbox açıkken ok tuşlarıyla gezinme.
  useEffect(() => {
    if (lightboxIndex === null) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "ArrowRight") setLightboxIndex((current) => (current === null ? null : (current + 1) % images.length));
      if (event.key === "ArrowLeft") setLightboxIndex((current) => (current === null ? null : (current - 1 + images.length) % images.length));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [images.length, lightboxIndex]);

  if (media.length === 0) return null;

  const altFor = (index: number) =>
    contextLabel ? `${contextLabel} — görsel ${index + 1}` : `Paylaşım görseli ${index + 1}`;

  return (
    <div className="space-y-3" data-testid="cadde-media-gallery">
      {images.length > 0 ? (
        <div className={`grid gap-1.5 overflow-hidden rounded-2xl ${gridClassFor(images.length)}`}>
          {images.map((asset, index) => (
            <button
              key={asset.path}
              type="button"
              onClick={() => setLightboxIndex(index)}
              className={`group relative overflow-hidden bg-slate-100 ${cellClassFor(images.length, index)}`}
              aria-label={`${altFor(index)} — büyüt`}
            >
              <img
                src={asset.url}
                alt={altFor(index)}
                loading="lazy"
                className={imageClassFor(images.length)}
              />
            </button>
          ))}
        </div>
      ) : null}

      {videos.map((asset) => (
        <div key={asset.path} className="overflow-hidden rounded-2xl bg-slate-900">
          <video
            src={asset.url}
            controls
            preload="metadata"
            playsInline
            className="max-h-[460px] w-full"
            aria-label={contextLabel ? `${contextLabel} — video` : "Paylaşım videosu"}
          >
            {/* Tarayıcı <video> desteklemezse en azından indirilebilir bir bağlantı kalsın. */}
            <a href={asset.url}>Videoyu aç</a>
          </video>
        </div>
      ))}

      <Dialog open={lightboxIndex !== null} onOpenChange={(open) => (open ? null : closeLightbox())}>
        <DialogContent className="max-w-4xl border-0 bg-transparent p-0 shadow-none">
          <DialogTitle className="sr-only">{contextLabel ?? "Paylaşım görseli"}</DialogTitle>
          {lightboxIndex !== null && images[lightboxIndex] ? (
            <div className="relative">
              <img
                src={images[lightboxIndex].url}
                alt={altFor(lightboxIndex)}
                className="max-h-[85vh] w-full rounded-2xl object-contain"
              />
              {images.length > 1 ? (
                <div className="mt-3 flex items-center justify-center gap-2">
                  {images.map((asset, index) => (
                    <button
                      key={asset.path}
                      type="button"
                      onClick={() => setLightboxIndex(index)}
                      aria-label={`${index + 1}. görsele geç`}
                      aria-current={index === lightboxIndex}
                      className={`h-2 rounded-full transition-all ${index === lightboxIndex ? "w-6 bg-white" : "w-2 bg-white/50"}`}
                    />
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CaddeMediaGallery;

/** Composer'daki yüklenmiş ek önizlemesi — kaldırma butonlu küçük şerit. */
export interface CaddeMediaPreviewStripProps {
  media: readonly CaddeMediaAsset[];
  onRemove: (asset: CaddeMediaAsset) => void;
  disabled?: boolean;
}

export const CaddeMediaPreviewStrip = ({ media, onRemove, disabled }: CaddeMediaPreviewStripProps) => {
  if (media.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2" data-testid="cadde-media-preview">
      {media.map((asset) => (
        <div key={asset.path} className="relative h-20 w-20 overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
          {asset.kind === "image" ? (
            <img src={asset.url} alt="Yüklenen görsel" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-slate-900 text-white">
              <Play className="h-6 w-6" aria-hidden />
              <span className="sr-only">Yüklenen video</span>
            </div>
          )}
          <button
            type="button"
            onClick={() => onRemove(asset)}
            disabled={disabled}
            aria-label="Eki kaldır"
            className="absolute right-1 top-1 rounded-full bg-slate-900/80 p-1 text-white transition hover:bg-slate-900 disabled:opacity-50"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      ))}
    </div>
  );
};
