/**
 * Ufuk rotaları katmanı — footer bandı için tasarlanmış dekoratif arka plan.
 *
 * Dünyaya yayılmış diasporanın şehirleri arasında süzülen "uçuş rotası" yayları:
 * geniş-kısa banda özel yatay kompozisyon. DiasporaNetworkLayer'ın aksine
 * `preserveAspectRatio="slice"` kullanır — dar ekranda esnemez, kenarlardan kırpılır.
 * Yaylar boyunca seyrek ışık pulse'ları akar (20-30sn — sakin, ambiyans).
 *
 * Tamamen dekoratif: pointer-events yok, aria-hidden, odaklanılamaz, z-0.
 * Animasyon sınıfları mevcut corteqs-network-* setini yeniden kullanır;
 * `prefers-reduced-motion` aynı CSS bloğundan tümünü durdurur/gizler.
 */

interface RouteArc {
  /** SVG path — 1440x220 viewBox koordinatında sığ yay. */
  d: string;
  stroke: string;
  width: number;
}

interface CityDot {
  x: number;
  y: number;
  r: number;
  fill: string;
}

interface RoutePulse {
  /** Pulse'ın izlediği yol — yaylardan biri (veya tersine çevrilmişi). */
  path: string;
  dur: number;
  begin: number;
  r: number;
  fill: string;
}

const TEAL = "hsl(var(--glow-teal))";
const ORANGE = "hsl(var(--glow-orange))";

// Deterministik geometri — render sırasında rastgelelik yok (SSR/hydration güvenli).
const ARCS: readonly RouteArc[] = [
  { d: "M -60 150 Q 340 64 720 118 T 1500 86", stroke: "hsl(var(--glow-teal) / 0.22)", width: 1.2 },
  { d: "M -60 92 Q 420 188 900 122 T 1500 140", stroke: "hsl(var(--glow-teal) / 0.13)", width: 1 },
  { d: "M 160 62 Q 720 22 1280 66", stroke: "hsl(var(--glow-orange) / 0.16)", width: 1 },
];

// Rotaların üzerindeki "şehir" durakları (yay üzerinde hesaplanmış noktalar).
const DOTS: readonly CityDot[] = [
  { x: 139, y: 116, r: 3.2, fill: TEAL },
  { x: 335, y: 99, r: 2.6, fill: ORANGE },
  { x: 720, y: 118, r: 3.8, fill: TEAL },
  { x: 1105, y: 137, r: 3, fill: TEAL },
  { x: 720, y: 43, r: 2.4, fill: ORANGE },
  { x: 1280, y: 66, r: 2.6, fill: TEAL },
];

const PULSES: readonly RoutePulse[] = [
  { path: "M -60 150 Q 340 64 720 118 T 1500 86", dur: 22, begin: 0, r: 2.4, fill: TEAL },
  { path: "M 1500 86 Q 1100 172 720 118 T -60 150", dur: 30, begin: 9, r: 2, fill: ORANGE },
  { path: "M -60 92 Q 420 188 900 122 T 1500 140", dur: 26, begin: 4, r: 2, fill: TEAL },
  { path: "M 160 62 Q 720 22 1280 66", dur: 24, begin: 14, r: 1.8, fill: ORANGE },
];

const DiasporaRoutesLayer = ({ className }: { className?: string }) => {
  return (
    <svg
      className={`corteqs-routes-bg pointer-events-none absolute inset-0 h-full w-full ${className ?? ""}`}
      viewBox="0 0 1440 220"
      preserveAspectRatio="xMidYMax slice"
      aria-hidden="true"
      focusable="false"
    >
      {ARCS.map((arc, i) => (
        <path
          key={`a-${i}`}
          className="corteqs-network-line"
          d={arc.d}
          fill="none"
          stroke={arc.stroke}
          strokeWidth={arc.width}
          strokeLinecap="round"
          style={{ animationDelay: `${i * 1.4}s` }}
        />
      ))}

      {/* Rotalar boyunca süzülen ışık pulse'ları — "yolda olan" bağlantılar. */}
      {PULSES.map((pulse, i) => (
        <circle key={`p-${i}`} className="corteqs-network-flow" r={pulse.r} fill={pulse.fill}>
          <animateMotion
            dur={`${pulse.dur}s`}
            begin={`${pulse.begin}s`}
            repeatCount="indefinite"
            path={pulse.path}
          />
        </circle>
      ))}

      {DOTS.map((dot, i) => (
        <circle
          key={`d-${i}`}
          className="corteqs-network-node"
          cx={dot.x}
          cy={dot.y}
          r={dot.r}
          fill={dot.fill}
          opacity={0.55}
          style={{ animationDelay: `${(i % 5) * 1.1}s` }}
        />
      ))}
    </svg>
  );
};

export default DiasporaRoutesLayer;
