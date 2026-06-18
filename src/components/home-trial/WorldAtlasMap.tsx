/**
 * WorldAtlasMap — diaspora ağını "marka argümanı" olarak gösteren d3-geo haritası.
 *
 * Gerçekçi dünya kara hattı (world-atlas land-110m → world-geojson.ts) +
 * diaspora şehir düğümleri + İstanbul merkezli animasyonlu route çizgileri.
 * Tamamen dekoratif (aria-hidden, pointer-events yok). Deterministik → SSR/hydration güvenli.
 * `prefers-reduced-motion` açıkken framer-motion akışları durur; harita statik kalır.
 *
 * Projeksiyon: equirectangular, elle ayarlı scale/translate. Antarktika'yı çerçeveden
 * çıkarmak için dikey görünüm enlem ~[-58°, 80°] bandına kırpılır (yoğun dünya dolu görünür).
 */

import { useMemo } from "react";
// d3-geo tip paketi (@types/d3-geo) kurulu değil; repo noImplicitAny:false olduğu
// için runtime import çalışır, tipler implicit any olarak gelir.
import { geoEquirectangular, geoPath } from "d3-geo";
import { motion, useReducedMotion } from "framer-motion";
import { ATLAS_CITIES, ATLAS_LINKS } from "./home-trial.data";
import { WORLD_LAND_GEOJSON } from "./world-geojson";

// Tam dünya genişliği W için equirectangular: 360° boylam = W piksel.
const VIEW_WIDTH = 1000;
// Görünür enlem bandı [LAT_MIN, LAT_MAX] — kutuplar/Antarktika kırpılır.
const LAT_MAX = 80;
const LAT_MIN = -58;

const SCALE = VIEW_WIDTH / (2 * Math.PI); // equirectangular: x = scale * lng(rad)
// Enlem bandının piksel karşılığı → viewBox yüksekliği.
const RAW_TOP = SCALE * (Math.PI / 180) * (90 - LAT_MAX);
const RAW_BOTTOM = SCALE * (Math.PI / 180) * (90 - LAT_MIN);
const VIEW_HEIGHT = RAW_BOTTOM - RAW_TOP;

// Akış parçacıklarının döndüğü logo paleti (turuncu hub'a saklanır — burada yok).
// "Canlı çok renkli ağ" hissi: her route farklı bir logo tonunda akar.
const FLOW_COLORS = [
  "hsl(var(--glow-teal))",
  "hsl(var(--brand-blue))",
  "hsl(var(--brand-indigo))",
  "hsl(var(--brand-pink))",
  "hsl(var(--brand-yellow))",
] as const;

interface ScreenPoint {
  x: number;
  y: number;
}

interface WorldAtlasMapProps {
  className?: string;
}

const WorldAtlasMap = ({ className }: WorldAtlasMapProps) => {
  const reduceMotion = useReducedMotion();

  // Projeksiyon + türetilmiş geometriler bir kez hesaplanır (deterministik).
  const { landPath, cityPoints, linkPaths } = useMemo(() => {
    // Equirectangular: merkez [0,0], elle scale; üst enlemi (LAT_MAX) y=0'a hizala.
    const projection = geoEquirectangular()
      .scale(SCALE)
      .translate([VIEW_WIDTH / 2, SCALE * (Math.PI / 180) * 90 - RAW_TOP]);

    const pathGen = geoPath(projection);
    const land = pathGen(WORLD_LAND_GEOJSON) ?? "";

    const points: ScreenPoint[] = ATLAS_CITIES.map((city) => {
      const projected = projection([city.lng, city.lat]);
      const [x, y] = projected ?? [0, 0];
      return { x, y };
    });

    const links = ATLAS_LINKS.map(([from, to]) => {
      const a = points[from];
      const b = points[to];
      // Hafif yay (kontrol noktası iki uç ortasının yukarısında) — "ağ" hissi.
      const midX = (a.x + b.x) / 2;
      const midY = (a.y + b.y) / 2 - Math.abs(b.x - a.x) * 0.12 - 14;
      return `M${a.x},${a.y} Q${midX},${midY} ${b.x},${b.y}`;
    });

    return { landPath: land, cityPoints: points, linkPaths: links };
  }, []);

  return (
    <svg
      className={`h-full w-full ${className ?? ""}`}
      viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
      focusable="false"
      role="presentation"
    >
      {/* Gerçek dünya kara hattı — ince teal dış çizgi + çok hafif dolgu. */}
      <path
        d={landPath}
        fill="hsl(var(--glow-teal) / 0.06)"
        stroke="hsl(var(--glow-teal) / 0.30)"
        strokeWidth={0.6}
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />

      {/* Route çizgileri (statik iz) + üzerinde akan parçacık. */}
      <g>
        {linkPaths.map((d, i) => (
          <g key={`link-${i}`}>
            <path
              d={d}
              fill="none"
              stroke="hsl(var(--glow-teal) / 0.40)"
              strokeWidth={1}
              strokeDasharray="2 4"
              vectorEffect="non-scaling-stroke"
            />
            {!reduceMotion && (
              <motion.circle
                r={2.4}
                fill={FLOW_COLORS[i % FLOW_COLORS.length]}
                initial={{ offsetDistance: "0%", opacity: 0 }}
                animate={{
                  offsetDistance: ["0%", "100%"],
                  opacity: [0, 1, 1, 0],
                }}
                transition={{
                  duration: 4.5 + (i % 4) * 0.8,
                  delay: (i % 5) * 0.6,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                style={{ offsetPath: `path("${d}")`, offsetRotate: "0deg" }}
              />
            )}
          </g>
        ))}
      </g>

      {/* Şehir düğümleri — nabız atan halka + sabit çekirdek + etiket. */}
      <g>
        {cityPoints.map((point, i) => {
          const city = ATLAS_CITIES[i];
          const isHub = i === ATLAS_CITIES.length - 1; // İstanbul = merkez
          const core = isHub ? "hsl(var(--glow-orange))" : "hsl(var(--glow-teal))";
          // Etiket yerleşimi — çakışmayı önlemek için per-city dx/dy (home-trial.data.ts).
          const dx = city.labelDx ?? (city.align === "left" ? -7 : 7);
          const dy = city.labelDy ?? 3;
          const anchor = city.align === "left" ? "end" : "start";
          return (
            <g key={`city-${i}`}>
              {!reduceMotion && (
                <motion.circle
                  cx={point.x}
                  cy={point.y}
                  fill="none"
                  stroke={core}
                  strokeWidth={1}
                  initial={{ r: 3, opacity: 0.7 }}
                  animate={{ r: [3, 11], opacity: [0.7, 0] }}
                  transition={{
                    duration: 2.8,
                    delay: (i % 6) * 0.5,
                    repeat: Infinity,
                    ease: "easeOut",
                  }}
                  vectorEffect="non-scaling-stroke"
                />
              )}
              <circle cx={point.x} cy={point.y} r={isHub ? 3.6 : 2.6} fill={core} />
              <text
                x={point.x + dx}
                y={point.y + dy}
                textAnchor={anchor}
                fontSize={isHub ? 13 : 11}
                fontWeight={isHub ? 700 : 600}
                fill="hsl(var(--foreground) / 0.82)"
                paintOrder="stroke"
                stroke="hsl(var(--background))"
                strokeWidth={2.5}
                style={{ fontFamily: '"Space Grotesk", Inter, system-ui, sans-serif' }}
              >
                {city.name}
              </text>
            </g>
          );
        })}
      </g>
    </svg>
  );
};

export default WorldAtlasMap;
