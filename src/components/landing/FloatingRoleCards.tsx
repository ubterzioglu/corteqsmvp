/**
 * Yüzen rol çipleri — diaspora ağının canlı öğeleri (topluluk, uzman, işletme…).
 * Hero arkasında yavaşça süzülen cam çipler; buton değil, ağ düğümü hissi.
 *
 * Tamamen dekoratif: pointer-events yok, aria-hidden, z-0. Mobilde daha az çip.
 * `prefers-reduced-motion` CSS tarafında süzülmeyi durdurur.
 */

interface RoleChip {
  label: string;
  /** Hero kapsayıcısına göre yüzde konum. */
  top: string;
  left: string;
  /** Süzülme süresi/gecikmesi — çeşitlilik için. */
  duration: number;
  delay: number;
}

// Türkçe görünür etiketler (domain tonuyla uyumlu).
const CHIPS: readonly RoleChip[] = [
  { label: "Topluluk", top: "12%", left: "6%", duration: 15, delay: 0 },
  { label: "Uzman", top: "70%", left: "10%", duration: 18, delay: 1.5 },
  { label: "İşletme", top: "30%", left: "82%", duration: 16, delay: 0.8 },
  { label: "Etkinlik", top: "78%", left: "74%", duration: 19, delay: 2.2 },
  { label: "Şehir Elçisi", top: "8%", left: "60%", duration: 17, delay: 1.1 },
  { label: "Öğrenci", top: "52%", left: "88%", duration: 20, delay: 0.4 },
  { label: "Kurucu", top: "20%", left: "30%", duration: 16, delay: 2.6 },
  { label: "Danışman", top: "60%", left: "44%", duration: 18, delay: 1.8 },
  { label: "Yerel Rehber", top: "40%", left: "16%", duration: 19, delay: 0.6 },
  { label: "Fırsat", top: "84%", left: "34%", duration: 15, delay: 2.0 },
];

// Mobilde yalnız ilk birkaç çip gösterilir.
const MOBILE_CHIP_COUNT = 3;

interface FloatingRoleCardsProps {
  /** Mobilde çip sayısını düşürmek için. */
  reduced?: boolean;
  className?: string;
}

const FloatingRoleCards = ({ reduced = false, className }: FloatingRoleCardsProps) => {
  const chips = reduced ? CHIPS.slice(0, MOBILE_CHIP_COUNT) : CHIPS;

  return (
    <div
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className ?? ""}`}
      aria-hidden="true"
    >
      {chips.map((chip) => (
        <span
          key={chip.label}
          className="corteqs-floating-chip absolute select-none whitespace-nowrap rounded-full px-3 py-1 text-[11px] font-semibold text-slate-600 md:text-xs"
          style={
            {
              top: chip.top,
              left: chip.left,
              "--chip-duration": `${chip.duration}s`,
              "--chip-delay": `${chip.delay}s`,
            } as React.CSSProperties
          }
        >
          {chip.label}
        </span>
      ))}
    </div>
  );
};

export default FloatingRoleCards;
