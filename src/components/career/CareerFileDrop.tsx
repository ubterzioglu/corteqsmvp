import { useRef, useState } from "react";
import { FileText, Upload, X } from "lucide-react";

import { Button } from "@/components/ui/button";

type CareerFileDropProps = {
  id: string;
  label: string;
  accept: string;
  hint: string;
  required?: boolean;
  file: File | null;
  onChange: (file: File | null) => void;
  /** Dosyayı reddeden Türkçe mesaj döndürür, kabul ediyorsa `null`. */
  validate: (file: File) => string | null;
};

const formatSize = (bytes: number) => `${(bytes / (1024 * 1024)).toFixed(1)} MB`;

/**
 * Sürükle-bırak + tıkla dosya alanı (KR06).
 *
 * ⚠️ `accept` niteliği YALNIZCA dosya seçiciye verilen bir tavsiyedir: kullanıcı
 * "Tüm dosyalar"ı seçerek, sürükleyip bırakarak ya da DOM'u düzenleyerek onu
 * atlar. Gerçek denetim `validate` ile BURADA yapılır; sunucu tarafında kova
 * MIME/boyut sınırı üçüncü savunmadır.
 */
export function CareerFileDrop({
  id,
  label,
  accept,
  hint,
  required,
  file,
  onChange,
  validate,
}: CareerFileDropProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  const accept_ = (candidate: File | undefined) => {
    if (!candidate) return;
    const message = validate(candidate);
    setError(message);
    onChange(message ? null : candidate);
  };

  return (
    <div>
      <label htmlFor={id} className="text-sm font-medium">
        {label}
        {required && <span className="ml-1 text-destructive">*</span>}
      </label>

      <div
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          accept_(event.dataTransfer.files[0]);
        }}
        className={`mt-2 rounded-lg border-2 border-dashed p-4 transition-colors ${
          dragging ? "border-primary bg-primary/5" : "border-border"
        }`}
      >
        {file ? (
          <div className="flex items-center justify-between gap-3">
            <span className="flex min-w-0 items-center gap-2 text-sm">
              <FileText className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
              <span className="truncate">{file.name}</span>
              <span className="shrink-0 text-muted-foreground">{formatSize(file.size)}</span>
            </span>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => {
                onChange(null);
                setError(null);
                if (inputRef.current) inputRef.current.value = "";
              }}
            >
              <X className="h-4 w-4" aria-hidden="true" />
              <span className="sr-only">Dosyayı kaldır</span>
            </Button>
          </div>
        ) : (
          <div className="text-center">
            <Upload className="mx-auto h-5 w-5 text-muted-foreground" aria-hidden="true" />
            <p className="mt-2 text-sm text-muted-foreground">
              Dosyayı buraya sürükle ya da{" "}
              <button
                type="button"
                className="font-medium text-primary underline-offset-2 hover:underline"
                onClick={() => inputRef.current?.click()}
              >
                bilgisayarından seç
              </button>
            </p>
            <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
          </div>
        )}

        <input
          ref={inputRef}
          id={id}
          type="file"
          accept={accept}
          className="sr-only"
          onChange={(event) => accept_(event.target.files?.[0])}
        />
      </div>

      {error && (
        <p role="alert" className="mt-2 text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

export default CareerFileDrop;
