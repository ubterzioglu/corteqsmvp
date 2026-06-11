import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  ComposableMap, Geographies, Geography, Marker, Line, Sphere, Graticule,
} from "react-simple-maps";
import { geoDistance } from "d3-geo";
import { ArrowLeft, MapPin, Sparkles, Users, Globe2, Loader2, Pause, Play, UserPlus } from "lucide-react";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import ataturkMarker from "@/assets/ataturk-marker.png";

/**
 * 19 Mayıs Global Diaspora — Animated rotating globe.
 * Public, auto-rotates, hover names, CorteQS palette.
 */

const GEO_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";
const ORIGIN: [number, number] = [32.85, 39.93];
const SAMSUN: [number, number] = [36.33, 41.29]; // 19 Mayıs 1919 — Atatürk's landing

type Seed = { name: string; coords: [number, number]; country: string };
const SEED_CITIES: Seed[] = [
  { name: "Berlin",     coords: [13.40, 52.52], country: "Almanya" },
  { name: "Londra",     coords: [-0.13, 51.51], country: "Birleşik Krallık" },
  { name: "Paris",      coords: [2.35, 48.85],  country: "Fransa" },
  { name: "Amsterdam",  coords: [4.90, 52.37],  country: "Hollanda" },
  { name: "Brüksel",    coords: [4.35, 50.85],  country: "Belçika" },
  { name: "Viyana",     coords: [16.37, 48.21], country: "Avusturya" },
  { name: "Stockholm",  coords: [18.07, 59.33], country: "İsveç" },
  { name: "Kopenhag",   coords: [12.57, 55.68], country: "Danimarka" },
  { name: "Zürih",      coords: [8.54, 47.37],  country: "İsviçre" },
  { name: "Roma",       coords: [12.50, 41.90], country: "İtalya" },
  { name: "Madrid",     coords: [-3.70, 40.42], country: "İspanya" },
  { name: "Atina",      coords: [23.73, 37.98], country: "Yunanistan" },
  { name: "Lefkoşa",    coords: [33.38, 35.19], country: "KKTC" },
  { name: "Bakü",       coords: [49.87, 40.41], country: "Azerbaycan" },
  { name: "Doha",       coords: [51.53, 25.29], country: "Katar" },
  { name: "Dubai",      coords: [55.30, 25.20], country: "BAE" },
  { name: "Riyad",      coords: [46.72, 24.71], country: "Suudi Arabistan" },
  { name: "Kahire",     coords: [31.24, 30.04], country: "Mısır" },
  { name: "Johannesburg", coords: [28.04, -26.20], country: "Güney Afrika" },
  { name: "Lagos",      coords: [3.38, 6.52],   country: "Nijerya" },
  { name: "New York",   coords: [-74.00, 40.71], country: "ABD" },
  { name: "Washington", coords: [-77.04, 38.91], country: "ABD" },
  { name: "Los Angeles",coords: [-118.24, 34.05], country: "ABD" },
  { name: "Chicago",    coords: [-87.65, 41.88], country: "ABD" },
  { name: "Toronto",    coords: [-79.38, 43.65], country: "Kanada" },
  { name: "Montreal",   coords: [-73.57, 45.50], country: "Kanada" },
  { name: "São Paulo",  coords: [-46.63, -23.55], country: "Brezilya" },
  { name: "Buenos Aires", coords: [-58.38, -34.60], country: "Arjantin" },
  { name: "Mexico City",coords: [-99.13, 19.43], country: "Meksika" },
  { name: "Tokyo",      coords: [139.69, 35.69], country: "Japonya" },
  { name: "Seul",       coords: [126.98, 37.57], country: "Güney Kore" },
  { name: "Pekin",      coords: [116.40, 39.90], country: "Çin" },
  { name: "Singapur",   coords: [103.82, 1.35],  country: "Singapur" },
  { name: "Bangkok",    coords: [100.50, 13.75], country: "Tayland" },
  { name: "Sidney",     coords: [151.21, -33.87], country: "Avustralya" },
  { name: "Melbourne",  coords: [144.96, -37.81], country: "Avustralya" },
  { name: "Auckland",   coords: [174.76, -36.85], country: "Yeni Zelanda" },
  { name: "Moskova",    coords: [37.62, 55.76],  country: "Rusya" },
  { name: "Astana",     coords: [71.45, 51.18],  country: "Kazakistan" },
  { name: "Taşkent",    coords: [69.24, 41.31],  country: "Özbekistan" },
];

type LivePin = {
  id: string;
  full_name: string | null;
  country: string | null;
  city: string | null;
  message: string | null;
};

const TURQUOISE = "hsl(174, 72%, 46%)";
const TURQUOISE_LIGHT = "hsl(174, 65%, 56%)";
const PRIMARY = "hsl(14, 85%, 55%)";
const NAVY = "hsl(220, 30%, 12%)";

const May19Map = () => {
  const [livePins, setLivePins] = useState<LivePin[]>([]);
  const [loading, setLoading] = useState(true);
  const [hovered, setHovered] = useState<string | null>(null);
  const [rotation, setRotation] = useState<[number, number, number]>([-30, -15, 0]);
  const [paused, setPaused] = useState(false);
  const rafRef = useRef<number | null>(null);
  const lastRef = useRef<number>(performance.now());

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("may19_submissions")
        .select("id, full_name, country, city, message")
        .eq("kind", "map_pin")
        .eq("status", "approved")
        .eq("show_on_map", true)
        .limit(500);
      setLivePins(data ?? []);
      setLoading(false);
    })();
  }, []);

  // Smooth rotation loop
  useEffect(() => {
    const tick = (t: number) => {
      const dt = t - lastRef.current;
      lastRef.current = t;
      if (!paused && !hovered) {
        setRotation((r) => [(r[0] + dt * 0.012) % 360, r[1], r[2]]);
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [paused, hovered]);

  const arcs = useMemo(
    () => SEED_CITIES.map((c, i) => ({ ...c, delay: (i * 120) % 4000 })),
    [],
  );

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      {/* Header */}
      <header className="relative pt-20 pb-5 bg-gradient-hero border-b border-border">
        <div className="container mx-auto px-4">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <Link to="/19-mayis" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-2">
                <ArrowLeft className="h-3.5 w-3.5" /> 19 Mayıs Buluşması
              </Link>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-turquoise/15 border border-turquoise/30 mb-2">
                <Sparkles className="h-3.5 w-3.5 text-turquoise" />
                <span className="text-xs font-semibold text-turquoise">Canlı Yayın · 5 Kıta · 19 Saat</span>
              </div>
              <h1 className="text-2xl md:text-4xl font-extrabold leading-tight">
                19 Mayıs <span className="text-gradient-primary">Global Diaspora Haritası</span>
              </h1>
              <p className="text-xs md:text-sm text-muted-foreground mt-1.5 max-w-2xl font-body">
                Dünya kendi ekseninde dönerken, diasporanın kalp atışı Ankara'dan tüm dünyaya yayılıyor. Şehir üzerine gelin, ismi parlasın.
              </p>
            </div>
            <div className="flex flex-col gap-2 items-end">
              <Link to="/19-mayis#modules">
                <Button size="lg" className="bg-turquoise hover:bg-turquoise-light text-primary-foreground gap-2">
                  <MapPin className="h-4 w-4" /> Haritada Yerimi İşaretle
                </Button>
              </Link>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1.5"><Globe2 className="h-3.5 w-3.5 text-turquoise" /> {arcs.length}+ Şehir</span>
                <span className="inline-flex items-center gap-1.5"><Users className="h-3.5 w-3.5 text-primary" /> {livePins.length} Canlı Pin</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Map area */}
      <main className="flex-1 relative bg-[hsl(220,30%,8%)] overflow-hidden">
        {/* Decorative glows */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-[600px] h-[600px] rounded-full blur-3xl opacity-20" style={{ background: TURQUOISE }} />
          <div className="absolute bottom-0 right-1/4 w-[700px] h-[700px] rounded-full blur-3xl opacity-15" style={{ background: PRIMARY }} />
          <svg className="absolute inset-0 w-full h-full opacity-40" aria-hidden>
            <defs>
              <pattern id="stars" x="0" y="0" width="120" height="120" patternUnits="userSpaceOnUse">
                <circle cx="20"  cy="30" r="0.6" fill="white" opacity="0.6"/>
                <circle cx="80"  cy="60" r="0.4" fill="white" opacity="0.4"/>
                <circle cx="50"  cy="100" r="0.5" fill="white" opacity="0.5"/>
                <circle cx="100" cy="20" r="0.3" fill="white" opacity="0.3"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#stars)"/>
          </svg>
        </div>

        {/* Top-right floating controls */}
        <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
          {loading && (
            <div className="flex items-center gap-2 text-xs text-white/70 bg-white/5 backdrop-blur px-3 py-1.5 rounded-full border border-white/10">
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Canlı pinler…
            </div>
          )}
          <button
            onClick={() => setPaused((p) => !p)}
            className="flex items-center gap-1.5 text-xs font-semibold text-white/90 bg-white/10 hover:bg-white/20 backdrop-blur px-3 py-1.5 rounded-full border border-white/15 transition"
          >
            {paused ? <><Play className="h-3.5 w-3.5" /> Döndür</> : <><Pause className="h-3.5 w-3.5" /> Durdur</>}
          </button>
        </div>

        <div className="relative w-full" style={{ height: "min(82vh, 880px)" }}>
          <ComposableMap
            projection="geoOrthographic"
            projectionConfig={{ scale: 340, rotate: rotation }}
            style={{ width: "100%", height: "100%" }}
          >
            {/* Globe sphere + atmosphere */}
            <defs>
              <radialGradient id="atmo" cx="50%" cy="50%" r="50%">
                <stop offset="85%" stopColor="hsl(174,72%,46%)" stopOpacity="0" />
                <stop offset="100%" stopColor="hsl(174,72%,46%)" stopOpacity="0.55" />
              </radialGradient>
              <radialGradient id="ocean" cx="35%" cy="35%" r="75%">
                <stop offset="0%" stopColor="hsl(220, 35%, 22%)" />
                <stop offset="100%" stopColor="hsl(220, 35%, 10%)" />
              </radialGradient>
            </defs>
            <Sphere id="atmo-sphere" stroke="none" strokeWidth={0} fill="url(#atmo)" />
            <Sphere id="ocean-sphere" stroke="hsl(174,72%,46% / 0.3)" strokeWidth={0.6} fill="url(#ocean)" />
            <Graticule stroke="hsl(174,72%,46% / 0.12)" strokeWidth={0.4} />

            <Geographies geography={GEO_URL}>
              {({ geographies }) => {
                // Vibrant CorteQS-aligned palette
                const palette = [
                  "hsl(174, 65%, 38%)", // turquoise
                  "hsl(14, 75%, 50%)",  // primary orange
                  "hsl(45, 85%, 50%)",  // gold
                  "hsl(265, 55%, 50%)", // violet
                  "hsl(200, 70%, 45%)", // azure
                  "hsl(340, 65%, 52%)", // rose
                  "hsl(150, 55%, 42%)", // emerald
                  "hsl(25, 85%, 55%)",  // amber
                  "hsl(220, 60%, 55%)", // royal blue
                  "hsl(290, 50%, 55%)", // magenta
                ];
                const colorFor = (id: string) => {
                  let h = 0;
                  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
                  return palette[h % palette.length];
                };
                return geographies.map((geo) => {
                  const base = colorFor(String(geo.rsmKey || geo.id || geo.properties?.name || ""));
                  return (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      fill={base}
                      stroke="hsl(0,0%,100% / 0.35)"
                      strokeWidth={0.4}
                      style={{
                        default: { outline: "none", opacity: 0.78, transition: "all 0.35s ease", transformBox: "fill-box", transformOrigin: "center" } as React.CSSProperties,
                        hover:   { outline: "none", opacity: 1, fill: base, stroke: "white", strokeWidth: 1.2, filter: "drop-shadow(0 0 6px rgba(255,255,255,0.55))", transform: "scale(1.06)", cursor: "pointer" } as React.CSSProperties,
                        pressed: { outline: "none" } as React.CSSProperties,
                      }}
                    />
                  );
                });
              }}
            </Geographies>

            {/* Visibility center for orthographic projection (longitude, latitude in degrees).
                rotation = [yaw, pitch, roll] where projection center = [-yaw, -pitch]. */}
            {(() => {
              const center: [number, number] = [-rotation[0], -rotation[1]];
              const isVisible = (coords: [number, number]) =>
                geoDistance(coords, center) < Math.PI / 2 - 0.05;

              return (
                <>
                  {/* Animated arcs — only when destination is on visible hemisphere */}
                  {arcs.map((c) => isVisible(c.coords) && (
                    <Line
                      key={`arc-${c.name}`}
                      from={ORIGIN}
                      to={c.coords}
                      stroke={TURQUOISE_LIGHT}
                      strokeWidth={0.7}
                      strokeOpacity={0.4}
                      strokeLinecap="round"
                      strokeDasharray="2 4"
                      style={{
                        animation: `dashFlow 6s linear infinite`,
                        animationDelay: `${c.delay}ms`,
                      } as React.CSSProperties}
                    />
                  ))}

                  {/* Origin – Türkiye */}
                  {isVisible(ORIGIN) && (
                    <Marker coordinates={ORIGIN}>
                      <circle r={9} fill={PRIMARY} opacity={0.25}>
                        <animate attributeName="r" from="6" to="22" dur="2.4s" repeatCount="indefinite" />
                        <animate attributeName="opacity" from="0.55" to="0" dur="2.4s" repeatCount="indefinite" />
                      </circle>
                      <circle r={5} fill={PRIMARY} stroke="white" strokeWidth={1.5} />
                      <text y={-12} textAnchor="middle" style={{ fontFamily: "Plus Jakarta Sans", fontSize: 11, fontWeight: 800, fill: "white", paintOrder: "stroke", stroke: NAVY, strokeWidth: 3 }}>
                        Türkiye
                      </text>
                    </Marker>
                  )}

                  {/* Samsun — 19 Mayıs 1919, marked with Atatürk silhouette */}
                  {isVisible(SAMSUN) && (
                    <Marker coordinates={SAMSUN}>
                      <circle r={14} fill={PRIMARY} opacity={0.2}>
                        <animate attributeName="r" from="10" to="26" dur="2.8s" repeatCount="indefinite" />
                        <animate attributeName="opacity" from="0.5" to="0" dur="2.8s" repeatCount="indefinite" />
                      </circle>
                      <circle r={11} fill="white" stroke={PRIMARY} strokeWidth={1.5} />
                      <image href={ataturkMarker} x={-9} y={-10} width={18} height={18} preserveAspectRatio="xMidYMid meet" />
                      <text y={22} textAnchor="middle" style={{ fontFamily: "Plus Jakarta Sans", fontSize: 10, fontWeight: 800, fill: "white", paintOrder: "stroke", stroke: NAVY, strokeWidth: 3 }}>
                        Samsun · 19 Mayıs 1919
                      </text>
                    </Marker>
                  )}

                  {/* City markers — labels always visible on the front hemisphere */}
                  {arcs.map((c, i) => isVisible(c.coords) && (
                    <Marker key={c.name} coordinates={c.coords}
                      onMouseEnter={() => setHovered(c.name)}
                      onMouseLeave={() => setHovered(null)}
                    >
                      <circle r={3} fill={TURQUOISE} opacity={0.35}>
                        <animate attributeName="r" from="2" to="10" dur="2.6s" begin={`${(i % 18) * 0.18}s`} repeatCount="indefinite" />
                        <animate attributeName="opacity" from="0.55" to="0" dur="2.6s" begin={`${(i % 18) * 0.18}s`} repeatCount="indefinite" />
                      </circle>
                      <circle r={hovered === c.name ? 3.6 : 2.4} fill={hovered === c.name ? "white" : TURQUOISE_LIGHT} stroke="white" strokeWidth={0.7}
                        style={{ cursor: "pointer", transition: "r 0.2s" }} />
                      <text
                        x={5} y={-5}
                        style={{
                          fontFamily: "Inter",
                          fontSize: hovered === c.name ? 11 : 8.5,
                          fontWeight: hovered === c.name ? 800 : 600,
                          fill: hovered === c.name ? "white" : "hsl(0,0%,92%)",
                          paintOrder: "stroke",
                          stroke: NAVY,
                          strokeWidth: hovered === c.name ? 3 : 2.4,
                          pointerEvents: "none",
                          transition: "all 0.2s",
                        }}
                      >
                        {c.name}
                      </text>
                      {hovered === c.name && (
                        <text x={5} y={6} style={{ fontFamily: "Inter", fontSize: 8, fontWeight: 600, fill: TURQUOISE_LIGHT, paintOrder: "stroke", stroke: NAVY, strokeWidth: 2.2, pointerEvents: "none" }}>
                          {c.country}
                        </text>
                      )}
                    </Marker>
                  ))}
                </>
              );
            })()}

            {/* Live submitted pins */}
            {livePins.map((p) => {
              const seed = SEED_CITIES.find(
                (s) => s.name.toLowerCase() === (p.city || "").toLowerCase(),
              );
              if (!seed) return null;
              return (
                <Marker key={p.id} coordinates={seed.coords}>
                  <circle r={3} fill="hsl(40, 90%, 55%)" opacity={0.9}>
                    <animate attributeName="r" from="3" to="9" dur="1.8s" repeatCount="indefinite" />
                    <animate attributeName="opacity" from="0.9" to="0" dur="1.8s" repeatCount="indefinite" />
                  </circle>
                </Marker>
              );
            })}
          </ComposableMap>
        </div>

        {/* Persistent registration CTA — top-left floating */}
        <div className="absolute top-4 left-4 z-10 max-w-xs">
          <Link to="/19-mayis#modules" className="block group">
            <div className="rounded-xl border border-turquoise/40 bg-gradient-to-br from-turquoise/30 via-turquoise/10 to-primary/15 backdrop-blur-md px-4 py-3 shadow-lg hover:shadow-2xl hover:border-turquoise transition-all">
              <div className="flex items-center gap-2 mb-1.5">
                <UserPlus className="h-4 w-4 text-turquoise" />
                <span className="text-[11px] font-extrabold uppercase tracking-wide text-turquoise">Haritaya Katıl</span>
              </div>
              <p className="text-xs font-semibold text-white leading-snug">
                Kayıt tamamlanınca <span className="text-turquoise-light">haritada kendini bul</span>.
              </p>
              <div className="mt-2 inline-flex items-center gap-1 text-[10px] font-bold text-white/90 group-hover:text-white">
                Kaydı Tamamla <span aria-hidden>→</span>
              </div>
            </div>
          </Link>
        </div>

        {/* Legend */}
        <div className="absolute bottom-4 left-4 right-4 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-4 bg-white/5 backdrop-blur border border-white/10 rounded-full px-4 py-2 text-white/80">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: PRIMARY, boxShadow: `0 0 8px ${PRIMARY}` }} /> Türkiye
            </span>
            <span className="inline-flex items-center gap-1.5">
              <img src={ataturkMarker} alt="" className="w-3.5 h-3.5" /> Samsun · 19 Mayıs 1919
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: TURQUOISE, boxShadow: `0 0 8px ${TURQUOISE}` }} /> Diaspora şehri
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: "hsl(40,90%,55%)", boxShadow: "0 0 8px hsl(40,90%,55%)" }} /> Canlı katılımcı
            </span>
          </div>
          <p className="text-white/50">
            19 Mayıs · 19.00 TR · 19 saat canlı yayın · 5 kıta
          </p>
        </div>
      </main>

      <style>{`
        @keyframes dashFlow { to { stroke-dashoffset: -120; } }
      `}</style>
    </div>
  );
};

export default May19Map;
