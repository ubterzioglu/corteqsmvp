import type { ComponentType } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ProfileDocumentRecord } from "@/lib/profile-documents";

import {
  AMBER_BUTTON_OUTLINE,
  AMBER_BUTTON_PRIMARY,
  GOOGLE_SOFT_CARD_SECTION,
  GOOGLE_SOFT_CARD_SUBTLE,
} from "./profile-card-styles";

export type ProfileDocumentCardProps = {
  cardClassName?: string;
  title: string;
  description: string;
  icon: ComponentType<{ className?: string }>;
  document: ProfileDocumentRecord | null;
  acceptLabel: string;
  statusLabel: string;
  isUploading: boolean;
  isRemoving: boolean;
  isOpening: boolean;
  onUploadClick: () => void;
  onOpenClick: () => void;
  onRemoveClick: () => void;
};

/** CV / sunum gibi private bucket'ta duran tek belgeyi yöneten kart. */
export const ProfileDocumentCard = ({
  cardClassName,
  title,
  description,
  icon: Icon,
  document,
  acceptLabel,
  statusLabel,
  isUploading,
  isRemoving,
  isOpening,
  onUploadClick,
  onOpenClick,
  onRemoveClick,
}: ProfileDocumentCardProps) => {
  return (
    <Card className={cardClassName ?? GOOGLE_SOFT_CARD_SECTION}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-[11px]">
          <Icon className="h-4 w-4 text-primary" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className={`rounded-xl px-3 py-3 ${GOOGLE_SOFT_CARD_SUBTLE}`}>
          <p className="text-[11px] font-medium text-foreground">{document?.name ?? "Henüz dosya yok"}</p>
          <p className="mt-1 text-[11px] text-muted-foreground">{acceptLabel} desteklenir.</p>
          <p className="mt-1 text-[11px] text-slate-600">{statusLabel}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" className={AMBER_BUTTON_PRIMARY} onClick={onUploadClick} disabled={isUploading || isRemoving}>
            {isUploading ? "Yükleniyor..." : document ? "Dosyayı Değiştir" : "Dosya Yükle"}
          </Button>
          <Button size="sm" className={AMBER_BUTTON_OUTLINE} onClick={onOpenClick} disabled={!document || isOpening || isUploading}>
            {isOpening ? "Açılıyor..." : "Dosyayı Aç"}
          </Button>
          <Button size="sm" className={AMBER_BUTTON_OUTLINE} onClick={onRemoveClick} disabled={!document || isRemoving || isUploading}>
            {isRemoving ? "Siliniyor..." : "Dosyayı Kaldır"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProfileDocumentCard;
