// Sade mimari diyagramı. ⚠️ Host/IP/proje kimliği YAZILMAZ — yalnız katman adları.
// Renkler sabit hex: SVG sunum niteliklerinde CSS değişkeni güvenilir çalışmaz.

interface Box {
  x: number;
  y: number;
  title: string;
  lines: readonly string[];
  tone: "navy" | "gold" | "light";
}

const W = 200;
const H = 84;

const BOXES: readonly Box[] = [
  { x: 20, y: 138, title: "Kullanıcı", lines: ["Tarayıcı · mobil"], tone: "light" },
  { x: 260, y: 26, title: "CDN · TLS", lines: ["Önbellek ve şifreleme"], tone: "light" },
  { x: 500, y: 26, title: "nginx konteyneri", lines: ["Docker · kendi PaaS'ımız", "Güvenlik başlıkları · CSP"], tone: "navy" },
  { x: 260, y: 250, title: "Yönetilen API", lines: ["Kimlik · REST · Dosya", "Oturum jetonu + RLS"], tone: "navy" },
  { x: 500, y: 250, title: "PostgreSQL", lines: ["RLS · pgvector · PostGIS", "Zamanlanmış işler"], tone: "gold" },
  { x: 740, y: 250, title: "Sunucu fonksiyonları", lines: ["Deno çalışma ortamı", "Yapay zekâ ve e-posta işleri"], tone: "navy" },
  { x: 740, y: 26, title: "Dış servisler", lines: ["Yapay zekâ modeli", "E-posta gönderimi"], tone: "light" },
];

const FILL ={ navy: "#10264a", gold: "#fbf6e9", light: "#ffffff" } as const;
const STROKE = { navy: "#10264a", gold: "#c8a24a", light: "#cfd8e6" } as const;
const TITLE = { navy: "#ffffff", gold: "#0a1a33", light: "#0a1a33" } as const;
const TEXT = { navy: "#9fb0cb", gold: "#56657c", light: "#56657c" } as const;

const ARROWS: readonly string[] = [
  "M220 170 C240 170 240 68 258 68",
  "M460 68 L498 68",
  "M220 190 C240 190 240 292 258 292",
  "M460 292 L498 292",
  "M738 292 L702 292",
  "M840 248 L840 112",
];

const InfraDiagram = () => (
  <div className="inv-card inv-diagram">
    <svg viewBox="0 0 960 360" role="img" aria-labelledby="inv-infra-title inv-infra-desc">
      <title id="inv-infra-title">Altyapı mimarisi</title>
      <desc id="inv-infra-desc">
        Kullanıcı, uygulamayı CDN arkasındaki nginx konteynerinden alır; veri istekleri yönetilen API üzerinden
        satır düzeyi güvenlikle PostgreSQL'e gider. Sunucu fonksiyonları dış yapay zekâ ve e-posta servislerini çağırır.
      </desc>
      <defs>
        <marker id="inv-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto">
          <path d="M0 0 L10 5 L0 10 z" fill="#3b5b94" />
        </marker>
      </defs>

      <text x="260" y="16" fontSize="11" letterSpacing="2" fill="#a86b12" fontFamily="IBM Plex Mono, monospace">
        SUNUM KATMANI
      </text>
      <text x="260" y="240" fontSize="11" letterSpacing="2" fill="#a86b12" fontFamily="IBM Plex Mono, monospace">
        VERİ VE İŞ MANTIĞI KATMANI
      </text>

      {ARROWS.map((d) => (
        <path key={d} d={d} fill="none" stroke="#3b5b94" strokeWidth="1.6" markerEnd="url(#inv-arrow)" />
      ))}

      {BOXES.map((box) => (
        <g key={box.title}>
          <rect
            x={box.x}
            y={box.y}
            width={W}
            height={H}
            rx="12"
            fill={FILL[box.tone]}
            stroke={STROKE[box.tone]}
            strokeWidth="1.2"
          />
          <text x={box.x + 16} y={box.y + 28} fontSize="15" fontWeight="600" fill={TITLE[box.tone]}>
            {box.title}
          </text>
          {box.lines.map((line, index) => (
            <text key={line} x={box.x + 16} y={box.y + 50 + index * 18} fontSize="12" fill={TEXT[box.tone]}>
              {line}
            </text>
          ))}
        </g>
      ))}
    </svg>
    {/* Telefon genişliğinde SVG gizlenir; aynı akış dikey liste olarak okunur. */}
    <ol className="inv-flow" aria-label="Altyapı akışı">
      {BOXES.map((box, position) => (
        <li key={box.title}>
          {position > 0 ? (
            <div className="inv-flow__arrow" aria-hidden="true">
              ↓
            </div>
          ) : null}
          <div className={`inv-flow__step inv-flow__step--${box.tone}`}>
            <div className="inv-flow__title">{box.title}</div>
            <div className="inv-flow__text">{box.lines.join(" · ")}</div>
          </div>
        </li>
      ))}
    </ol>
  </div>
);

export default InfraDiagram;
