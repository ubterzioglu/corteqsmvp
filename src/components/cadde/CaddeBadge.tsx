// Cadde rozet sistemi — üç tip, başka yok (T6, m142).
//
// SORUN (denetim, 27.08.2026): Cadde yüzeylerinde ONÜÇ farklı rozet stili dolaşıyordu
// ve hiçbirinin görsel ağırlığı anlamsal önemiyle örtüşmüyordu — "Canlı" ile "Köprü"
// aynı yeşil ailesindeydi, "Sabit" siyah dolu (en ağır stil) olmasına rağmen en az
// bilgi taşıyandı. Kullanıcı hangi rozetin ne söylediğini renkten çıkaramıyordu.
//
// KURAL (docs/modules/cadde-design-tokens.md §3):
//   durum    → DOLU renk. Değişen, dinamik hâl. "Canlı", "Arşiv", "Sabit".
//   kimlik   → tek ikon + nötr. Kim/ne olduğunu söyler. "Onaylı", rol adı, "Sponsorlu".
//   kategori → outline, nötr. Sınıflandırır. İlgi alanı, tür, tema.
//
// ⚠️ `durum` iki tona sınırlıdır (`positive` / `neutral`). Üçüncü bir durum rengi
// eklemek tam da kapatılan sorunu geri getirir: renk sayısı arttıkça hiçbiri anlam
// taşımaz. Yeni bir hâl gerekiyorsa önce "bu gerçekten durum mu, kategori mi?" diye sor.

import type { ReactNode } from "react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type CaddeBadgeTone = "durum" | "kimlik" | "kategori";
/** Yalnız `durum` için anlamlıdır; diğer tiplerde yok sayılır. */
export type CaddeBadgeIntent = "positive" | "neutral";

export interface CaddeBadgeProps {
  tone: CaddeBadgeTone;
  intent?: CaddeBadgeIntent;
  /** Yalnız `kimlik` tipinde çizilir — kimlik rozetinin sözleşmesi "tek ikon + nötr". */
  icon?: ReactNode;
  className?: string;
  children: ReactNode;
}

const TONE_CLASS: Record<CaddeBadgeTone, string> = {
  // Dolu: en ağır görsel ağırlık, yalnız değişen hâl için.
  durum: "border-transparent",
  // Nötr dolgu: kimlik sabittir, dikkat çekmesi gerekmez.
  kimlik: "border-transparent bg-slate-100 text-slate-700 hover:bg-slate-100",
  // Outline: en hafif, sınıflandırma bilgisi.
  kategori: "border-slate-300 bg-transparent font-normal text-slate-700",
};

const DURUM_INTENT_CLASS: Record<CaddeBadgeIntent, string> = {
  positive: "bg-emerald-600 text-white hover:bg-emerald-600",
  neutral: "bg-slate-700 text-white hover:bg-slate-700",
};

const CaddeBadge = ({ tone, intent = "neutral", icon, className, children }: CaddeBadgeProps) => (
  <Badge
    className={cn(
      "gap-1",
      TONE_CLASS[tone],
      tone === "durum" && DURUM_INTENT_CLASS[intent],
      className,
    )}
  >
    {tone === "kimlik" && icon ? icon : null}
    {children}
  </Badge>
);

export default CaddeBadge;
