// "BURAK BURAYA BAK" sekmesinde her Canva yuvası için otomatik üretilmiş
// LinkedIn görselinin (scripts/social-generate CLI çıktısı) önizlemesi.
// public/social/generated/posts/<toolId>/variant-N.png yoksa sessizce gizlenir
// (henüz üretilmemiş olabilir) — BurakMediaPanel'in manuel yükleme akışını değiştirmez.

import { useState } from "react";
import { Download } from "lucide-react";

import { Button } from "@/components/ui/button";

type GeneratedImagePreviewProps = {
  toolId: string;
  variantNo: number;
};

export function GeneratedImagePreview({ toolId, variantNo }: GeneratedImagePreviewProps) {
  const [missing, setMissing] = useState(false);
  const src = `/social/generated/posts/${toolId}/variant-${variantNo}.png`;

  if (missing) return null;

  return (
    <div className="mt-2 flex items-center gap-3 rounded-lg border border-dashed bg-muted/20 p-2">
      <img
        src={src}
        alt=""
        className="h-16 w-16 rounded object-cover"
        onError={() => setMissing(true)}
      />
      <div className="flex flex-1 items-center justify-between gap-2">
        <span className="text-xs text-muted-foreground">Otomatik üretilmiş önizleme</span>
        <a href={src} download>
          <Button variant="ghost" size="sm">
            <Download className="mr-1.5 h-3.5 w-3.5" /> İndir
          </Button>
        </a>
      </div>
    </div>
  );
}
