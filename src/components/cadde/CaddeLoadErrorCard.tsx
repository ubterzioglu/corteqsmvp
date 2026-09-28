import { AlertTriangle, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

/**
 * "Yüklenemedi" kartı — Cadde okuma yüzeylerinin ORTAK hata durumu (S06a).
 *
 * Neden ayrı bir bileşen: hata ≠ içerik yok. Okuma API'leri eskiden hatayı yutup boş
 * dizi dönüyordu; React Query açısından bu BAŞARILI bir sorgudur, `isError` hiç true
 * olmaz ve ekranda "henüz içerik yok" yazar. Kullanıcı sistemin bozuk olduğunu değil,
 * içeriğin olmadığını görür (04.08.2026'da feed'de canlı ölçüldü).
 *
 * API'ler artık fırlatıyor; bu kart o durumu AYRI yüzeyde ve kurtarma yoluyla gösterir.
 * ⚠️ Kullandığın yerde boş-durum kartını `!isError` ile KAPILA — ikisi asla birlikte
 * çıkmamalı, yoksa kullanıcı hem "yok" hem "yüklenemedi" görür.
 */
export function CaddeLoadErrorCard({
  testId,
  title = "İçerik yüklenemedi.",
  description = "Bu bir içerik eksikliği değil — sunucudan yanıt alınamadı. Bağlantını kontrol edip tekrar deneyebilirsin.",
  onRetry,
  isRetrying = false,
}: {
  testId?: string;
  title?: string;
  description?: string;
  onRetry: () => void;
  isRetrying?: boolean;
}) {
  return (
    <Card data-testid={testId} className="cadde-card border-amber-200 bg-amber-50">
      <CardContent className="p-6 text-center">
        <AlertTriangle className="mx-auto h-5 w-5 text-amber-600" aria-hidden="true" />
        <p className="mt-2 text-base font-semibold text-amber-900">{title}</p>
        <p className="mt-2 text-sm leading-relaxed text-amber-800">{description}</p>
        <Button
          variant="outline"
          className="cadde-secondary-action mt-4 rounded-lg"
          onClick={onRetry}
          disabled={isRetrying}
        >
          <RefreshCw
            className={isRetrying ? "h-4 w-4 animate-spin" : "h-4 w-4"}
            aria-hidden="true"
          />
          {isRetrying ? "Deneniyor..." : "Tekrar dene"}
        </Button>
      </CardContent>
    </Card>
  );
}
