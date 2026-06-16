/**
 * CorteQS animasyonlu arka plan kompozisyonu — diaspora ağı + ek aurora katmanı.
 *
 * İki kullanım:
 *  - variant="page": tüm görünüm ardına sabit (fixed) katman (Index.tsx, ambient orb'ların kardeşi).
 *  - variant="hero": Hero arkasındaki mevcut tech katman yığınına gömülü mutlak (absolute) katman.
 *
 * Mobil yoğunluğu burada bir kez `useIsMobile()` ile çözülüp alt katmanlara aktarılır.
 * Tüm katmanlar dekoratif: pointer-events yok, aria-hidden, z-0.
 */

import { useIsMobile } from "@/hooks/use-mobile";
import DiasporaNetworkLayer from "./DiasporaNetworkLayer";

type BackgroundVariant = "page" | "hero";

interface CorteqsAnimatedBackgroundProps {
  variant: BackgroundVariant;
  className?: string;
}

const CorteqsAnimatedBackground = ({ variant, className }: CorteqsAnimatedBackgroundProps) => {
  const isMobile = useIsMobile();
  const density = isMobile ? "reduced" : "full";

  const positionClass = variant === "page" ? "fixed" : "absolute";

  return (
    <div
      className={`${positionClass} inset-0 z-0 ${className ?? ""}`}
      aria-hidden="true"
      style={{ pointerEvents: "none" }}
    >
      <div className="corteqs-aurora-plus absolute inset-0" />
      <DiasporaNetworkLayer density={density} />
    </div>
  );
};

export default CorteqsAnimatedBackground;
