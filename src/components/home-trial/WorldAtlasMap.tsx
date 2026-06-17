/**
 * WorldAtlasMap — diaspora ağını "marka argümanı" olarak gösteren d3-geo haritası.
 *
 * Düz (equirectangular) dünya hattı + diaspora şehir düğümleri + İstanbul merkezli
 * animasyonlu route çizgileri. Tamamen dekoratif (aria-hidden, pointer-events yok).
 * Deterministik: render sırasında rastgelelik yok → SSR/hydration güvenli.
 * `prefers-reduced-motion` açıkken framer-motion akışları durur; harita statik kalır.
 */

import { useMemo } from "react";
// d3-geo tip paketi (@types/d3-geo) kurulu değil; repo noImplicitAny:false olduğu
// için runtime import çalışır, tipler implicit any olarak gelir.
import { geoEquirectangular, geoPath } from "d3-geo";
import { motion, useReducedMotion } from "framer-motion";
import {
  ATLAS_CITIES,
  ATLAS_LINKS,
  WORLD_LAND_GEOJSON,
} from "./home-trial.data";

const VIEW_WIDTH = 1000;
const VIEW_HEIGHT = 500;

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
  const { landPaths, cityPoints, linkPaths } = useMemo(() => {
    const projection = geoEquirectangular().fitSize(
      [VIEW_WIDTH, VIEW_HEIGHT],
      WORLD_LAND_GEOJSON,
    );
    const pathGen = geoPath(projection);

    const paths = WORLD_LAND_GEOJSON.features
      .map((feature) => pathGen(feature))
      .filter((d): d is string => Boolean(d));

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

    return { landPaths: paths, cityPoints: points, linkPaths: links };
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
      {/* Kara hatları — ince teal dış çizgi + çok hafif dolgu. */}
      <g>
        {landPaths.map((d, i) => (
          <path
            key={`land-${i}`}
            d={d}
            fill="hsl(var(--glow-teal) / 0.05)"
            stroke="hsl(var(--glow-teal) / 0.28)"
            strokeWidth={1}
            strokeLinejoin="round"
          />
        ))}
      </g>

      {/* Route çizgileri (statik iz) + üzerinde akan parçacık. */}
      <g>
        {linkPaths.map((d, i) => (
          <g key={`link-${i}`}>
            <path
              d={d}
              fill="none"
              stroke="hsl(var(--glow-teal) / 0.35)"
              strokeWidth={1}
              strokeDasharray="3 5"
            />
            {!reduceMotion && (
              <motion.circle
                r={2.6}
                fill={i % 2 === 0 ? "hsl(var(--glow-orange))" : "hsl(var(--glow-teal))"}
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
          const labelDx = city.align === "left" ? -8 : 8;
          const labelAnchor = city.align === "left" ? "end" : "start";
          return (
            <g key={`city-${i}`}>
              {!reduceMotion && (
                <motion.circle
                  cx={point.x}
                  cy={point.y}
                  fill="none"
                  stroke={core}
                  strokeWidth={1.2}
                  initial={{ r: 4, opacity: 0.7 }}
                  animate={{ r: [4, 14], opacity: [0.7, 0] }}
                  transition={{
                    duration: 2.8,
                    delay: (i % 6) * 0.5,
                    repeat: Infinity,
                    ease: "easeOut",
                  }}
                />
              )}
              <circle cx={point.x} cy={point.y} r={isHub ? 4.5 : 3.2} fill={core} />
              <text
                x={point.x + labelDx}
                y={point.y + 3.5}
                textAnchor={labelAnchor}
                fontSize={isHub ? 15 : 13}
                fontWeight={isHub ? 700 : 600}
                fill="hsl(var(--foreground) / 0.78)"
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
