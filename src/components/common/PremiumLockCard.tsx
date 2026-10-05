// A3 · PremiumLockCard — Genel kilit kutusu (CV/ilan görüntüleme paywall).
//
// ProLockedInboxCard deseninden türedi: başlık + açıklama + "Premium'a geç" CTA.
// ÖDEME AKIŞI YOK — CTA yalnız /pricing'e yönlendirir. Stripe gelince aynı
// yetkileri açar, çağıran kod değişmez.
//
// 🔴 Fiyat/₺/telefon bilgisi BU KARTTA YOK — ProLockedInboxCard testindeki
// yasak regex'i bu bileşen için de geçerli (fiyat/₺/telefon içermemeli).
//
// Kullanım: A8'de ilan detayında ve CV görüntülemede bağlanır.

import { Link } from "react-router-dom";
import { Crown, Lock } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface PremiumLockCardProps {
  /** Başlık (örn: "CV görüntüleme Premium'da") */
  title: string;
  /** Açıklama (örn: "Bu özelliği kullanmak için Premium'a geçin") */
  description: string;
  /** CTA metni (varsayılan: "Premium'a geç") */
  ctaLabel?: string;
  /** data-testid (her kullanım için benzersiz olmalı) */
  testId?: string;
}

/**
 * Genel Premium kilit kutusu.
 *
 * Kullanım:
 * ```tsx
 * <PremiumLockCard
 *   title="CV görüntüleme Premium'da"
 *   description="Bu özelliği kullanmak için Premium'a geçin."
 * />
 * ```
 */
export function PremiumLockCard({
  title,
  description,
  ctaLabel = "Premium'a geç",
  testId = "premium-lock-card",
}: PremiumLockCardProps) {
  return (
    <Card
      data-testid={testId}
      className="border-amber-200 bg-amber-50/60"
      aria-label={`${title} (kilitli)`}
    >
      <CardContent className="flex items-start gap-3 p-4">
        <span className="relative mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-200 text-amber-700">
          <Crown className="h-4.5 w-4.5" aria-hidden="true" />
          <Lock
            className="absolute -bottom-1 -right-1 h-3.5 w-3.5 rounded-full bg-amber-600 p-0.5 text-white"
            aria-hidden="true"
          />
        </span>
        <div className="min-w-0 flex-1 text-left">
          <p className="text-sm font-semibold text-slate-800">{title}</p>
          <p className="mt-0.5 text-xs leading-relaxed text-slate-500">{description}</p>
          <Button asChild variant="outline" size="sm" className="mt-2" data-testid={`${testId}-cta`}>
            <Link to="/pricing">{ctaLabel}</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default PremiumLockCard;
