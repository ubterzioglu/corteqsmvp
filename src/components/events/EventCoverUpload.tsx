// Etkinlik kapak görseli: yükleme + önizleme.
//
// ⚠️ Bu bileşen A10a'da BİLEREK forma bağlanmadan yazıldı. `CreateEventFormSection.tsx`
// 578 satırlık tek dosyadır; yükleme mantığını oraya doğrudan eklemek diff'i okunmaz
// yapardı. Forma bağlama ve ham URL kutusunun değiştirilmesi A10b'nin işidir.
//
// ⚠️ `event-covers` bucket'ı CANLIDA HENÜZ YOK —
// `docs/operations/2026-09-28-event-covers-bucket.sql` uygulanmayı bekliyor.
// O uygulanmadan bu bileşen canlıda yükleme hatası döndürür.

import { ImagePlus, Loader2, X } from "lucide-react";
import { useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { EVENT_COVER_ACCEPT, removeEventCover, uploadEventCover } from "@/lib/event-media";

export interface EventCoverValue {
  url: string;
  /** Bucket yolu. Dışarıdan gelen (eski) URL'lerde null olur — o kayıtlar silinemez. */
  path: string | null;
}

interface EventCoverUploadProps {
  value: EventCoverValue | null;
  onChange: (value: EventCoverValue | null) => void;
  /** Hata kullanıcıya nasıl gösterilecek — form kendi toast'unu verebilsin diye dışarıda. */
  onError?: (message: string) => void;
  disabled?: boolean;
}

export function EventCoverUpload({ value, onChange, onError, disabled }: EventCoverUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const reportError = (message: string) => {
    if (onError) onError(message);
  };

  const handleSelect = async (file: File | undefined) => {
    if (!file) return;
    setIsUploading(true);
    try {
      const uploaded = await uploadEventCover(file);

      // Yerine yenisi geldiyse eskisini bırakma — yetim dosya bırakmamak için.
      // ⚠️ Yalnız BİZİM yüklediğimiz (path'i olan) dosya silinir; forma elle
      // yapıştırılmış bir URL'in arkasında silinecek bir nesne yoktur.
      if (value?.path) {
        await removeEventCover(value.path);
      }

      onChange(uploaded);
    } catch (error: unknown) {
      // uploadEventCover kullanıcıya gösterilebilir Türkçe mesajla fırlatır.
      reportError(error instanceof Error ? error.message : "Kapak görseli yüklenemedi.");
    } finally {
      setIsUploading(false);
      // Aynı dosyanın tekrar seçilebilmesi için input sıfırlanmalı.
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const handleRemove = async () => {
    const path = value?.path;
    onChange(null);
    if (path) {
      await removeEventCover(path);
    }
  };

  return (
    <div>
      <Label htmlFor="event-cover-file">Kapak Görseli</Label>

      <input
        ref={inputRef}
        id="event-cover-file"
        type="file"
        className="sr-only"
        accept={EVENT_COVER_ACCEPT}
        disabled={disabled || isUploading}
        onChange={(event) => void handleSelect(event.target.files?.[0])}
      />

      {value ? (
        <div className="mt-2 space-y-2">
          <div className="relative overflow-hidden rounded-md border">
            <img src={value.url} alt="Etkinlik kapak görseli önizlemesi" className="h-40 w-full object-cover" />
            <Button
              type="button"
              variant="secondary"
              size="icon"
              className="absolute right-2 top-2 h-8 w-8"
              aria-label="Kapak görselini kaldır"
              disabled={disabled || isUploading}
              onClick={() => void handleRemove()}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={disabled || isUploading}
            onClick={() => inputRef.current?.click()}
          >
            {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Görseli değiştir
          </Button>
        </div>
      ) : (
        <div className="mt-2">
          <Button
            type="button"
            variant="outline"
            disabled={disabled || isUploading}
            onClick={() => inputRef.current?.click()}
          >
            {isUploading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <ImagePlus className="mr-2 h-4 w-4" />
            )}
            {isUploading ? "Yükleniyor..." : "Görsel yükle"}
          </Button>
          <p className="mt-1 text-xs text-muted-foreground">JPG, PNG, WebP veya AVIF · en fazla 5MB</p>
        </div>
      )}
    </div>
  );
}
