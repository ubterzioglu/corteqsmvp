/**
 * Diaspora ağ katmanı — dünyaya yayılmış Türk diasporasının CorteQS üzerinden
 * birbirine bağlanışını temsil eden, SVG tabanlı ince düğüm + bağlantı çizgisi ağı.
 *
 * Bağlantı çizgileri boyunca minik ışık parçacıkları akar ("canlı veri akışı").
 * Tamamen dekoratif: pointer-events yok, aria-hidden, odaklanılamaz, z-0.
 * Düğümler yavaşça nabız atar; çizgiler ince parlaklık dalgalanması yapar.
 * `prefers-reduced-motion` CSS tarafında tüm animasyonları durdurur.
 */

type NetworkDensity = "full" | "reduced";

interface NetworkNode {
  /** SVG viewBox koordinatı (0–100 yüzde tabanlı). */
  x: number;
  y: number;
  r: number;
}

interface DiasporaNetworkLayerProps {
  /** Mobilde "reduced" daha az düğüm/çizgi/parçacık gösterir. */
  density?: NetworkDensity;
  className?: string;
}

// Deterministik koordinatlar — render sırasında rastgelelik yok (SSR/hydration güvenli).
const NODES: readonly NetworkNode[] = [
  { x: 8, y: 22, r: 1.4 },
  { x: 20, y: 60, r: 1.1 },
  { x: 30, y: 30, r: 1.6 },
  { x: 42, y: 72, r: 1.2 },
  { x: 50, y: 40, r: 1.8 },
  { x: 58, y: 18, r: 1.1 },
  { x: 66, y: 64, r: 1.4 },
  { x: 74, y: 36, r: 1.2 },
  { x: 86, y: 58, r: 1.5 },
  { x: 92, y: 26, r: 1.1 },
  { x: 14, y: 84, r: 1.0 },
  { x: 78, y: 82, r: 1.0 },
];

// Bağlantılar düğüm indekslerine referans verir (komşu ağ hissi).
const LINKS: readonly [number, number][] = [
  [0, 2],
  [2, 4],
  [4, 5],
  [5, 7],
  [7, 9],
  [4, 6],
  [6, 8],
  [1, 3],
  [3, 4],
  [2, 1],
  [6, 11],
  [1, 10],
  [8, 7],
];

// "reduced" modda gösterilecek düğüm/çizgi sayısı (mobil performans).
const REDUCED_NODE_COUNT = 7;
const REDUCED_LINK_COUNT = 6;

// Akan parçacık için çizgi başına süre/gecikme çeşitliliği.
const FLOW_DURATIONS = [5.5, 7, 6, 8, 6.5, 7.5];

const DiasporaNetworkLayer = ({ density = "full", className }: DiasporaNetworkLayerProps) => {
  const nodes = density === "reduced" ? NODES.slice(0, REDUCED_NODE_COUNT) : NODES;
  const links =
    density === "reduced"
      ? LINKS.filter(([a, b]) => a < REDUCED_NODE_COUNT && b < REDUCED_NODE_COUNT).slice(
          0,
          REDUCED_LINK_COUNT,
        )
      : LINKS;

  return (
    <svg
      className={`corteqs-network-bg pointer-events-none absolute inset-0 h-full w-full ${className ?? ""}`}
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      aria-hidden="true"
      focusable="false"
    >
      {links.map(([a, b], i) => (
        <line
          key={`l-${i}`}
          className="corteqs-network-line"
          x1={NODES[a].x}
          y1={NODES[a].y}
          x2={NODES[b].x}
          y2={NODES[b].y}
          stroke="hsl(var(--glow-teal))"
          strokeWidth={0.18}
          style={{ animationDelay: `${(i % 6) * 0.7}s` }}
        />
      ))}

      {/* Çizgiler boyunca akan ışık parçacıkları — "canlı veri akışı".
          SMIL animateMotion: reduced-motion'da CSS ile devre dışı bırakılır. */}
      {links.map(([a, b], i) => {
        const dur = FLOW_DURATIONS[i % FLOW_DURATIONS.length];
        const path = `M${NODES[a].x},${NODES[a].y} L${NODES[b].x},${NODES[b].y}`;
        return (
          <circle
            key={`f-${i}`}
            className="corteqs-network-flow"
            r={0.55}
            fill={i % 2 === 0 ? "hsl(var(--glow-orange))" : "hsl(var(--glow-teal))"}
          >
            <animateMotion
              dur={`${dur}s`}
              begin={`${(i % 5) * 0.8}s`}
              repeatCount="indefinite"
              path={path}
              rotate="auto"
            />
          </circle>
        );
      })}

      {nodes.map((node, i) => (
        <circle
          key={`n-${i}`}
          className="corteqs-network-node"
          cx={node.x}
          cy={node.y}
          r={node.r}
          fill={i % 3 === 0 ? "hsl(var(--glow-orange))" : "hsl(var(--glow-teal))"}
          style={{ animationDelay: `${(i % 5) * 0.9}s` }}
        />
      ))}
    </svg>
  );
};

export default DiasporaNetworkLayer;
