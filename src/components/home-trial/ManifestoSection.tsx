/**
 * 2. Devasa beyan (manifesto) bölümü — "büyüyen ağ".
 *
 * Özellik gridi değil: diaspora ölçeğini ve aidiyeti tanımlayan büyük tipografi.
 * 2026-09-20'de bölüm RENKLENDİRİLDİ (kullanıcı kararı): düz kirli beyaz zeminde
 * duran gri bir metin bloğuydu, artık arkasında marka renklerinden bir AĞ çizimi
 * ve altında şehir çipleri var. Amaç süs değil anlam: "görünmez ağ" cümlesinin
 * karşılığını sayfada göstermek.
 *
 * ÜÇ KURAL
 * 1. Ağ çizimi DEKORATİFTİR — `aria-hidden`, ekran okuyucuya hiçbir şey demez.
 *    Bilgi yalnız metinde ve çiplerde durur.
 * 2. Hareket `prefers-reduced-motion` ile TAMAMEN durur (index.css'te
 *    `.manifesto-*` kuralları). Düğümler sönmez, son karede kalır — hareketi
 *    kapatan kullanıcı eksik bir görsel görmez.
 * 3. Renkler logonun altı kolundan gelir (--glow-teal, --brand-blue,
 *    --brand-indigo, --brand-pink, --glow-orange, --brand-yellow). Yeni renk
 *    icat etme; hero ve header de aynı altılıyı kullanıyor.
 */

/** Ağ düğümleri — 1200x420 viewBox içinde elle yerleştirildi. */
const NETWORK_NODES = [
  { x: 80, y: 300, r: 7, color: "--glow-teal" },
  { x: 215, y: 120, r: 5, color: "--brand-blue" },
  { x: 330, y: 330, r: 6, color: "--brand-indigo" },
  { x: 470, y: 85, r: 8, color: "--brand-pink" },
  { x: 600, y: 245, r: 5, color: "--glow-orange" },
  { x: 745, y: 110, r: 6, color: "--brand-yellow" },
  { x: 870, y: 325, r: 7, color: "--glow-teal" },
  { x: 1010, y: 155, r: 5, color: "--brand-blue" },
  { x: 1130, y: 295, r: 6, color: "--brand-indigo" },
];

/** Kenarlar düğüm indislerine göre verilir — koordinat kopyalanmaz. */
const NETWORK_EDGES: [number, number][] = [
  [0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7], [7, 8],
  [0, 2], [1, 3], [2, 4], [3, 5], [4, 6], [5, 7], [6, 8],
];

/**
 * Diasporanın yayıldığı şehirler. Liste TEMSİLİDİR, veri değildir — bir sayıya
 * ya da DB kaydına bağlanmaz, bu yüzden bayatlayamaz.
 */
const CITY_CHIPS = [
  { city: "Berlin", color: "--glow-teal" },
  { city: "Londra", color: "--brand-blue" },
  { city: "Amsterdam", color: "--brand-indigo" },
  { city: "Toronto", color: "--brand-pink" },
  { city: "Dubai", color: "--glow-orange" },
  { city: "Doha", color: "--brand-yellow" },
  { city: "New York", color: "--glow-teal" },
  { city: "Sidney", color: "--brand-blue" },
];

const ManifestoSection = () => {
  return (
    <section className="relative overflow-hidden py-24 sm:py-32">
      {/* Renk katmanı: altı marka renginden çok düşük yoğunluklu radial yıkamalar.
          Renk METNİN üstünden değil ZEMİNDEN gelir; böylece gövde metni koyu
          kalır ve kontrast AA üstünde durur. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background: [
            "radial-gradient(60% 70% at 12% 18%, hsl(var(--glow-teal) / 0.14), transparent 62%)",
            "radial-gradient(55% 65% at 88% 12%, hsl(var(--brand-pink) / 0.12), transparent 62%)",
            "radial-gradient(60% 70% at 78% 92%, hsl(var(--glow-orange) / 0.13), transparent 64%)",
            "radial-gradient(55% 65% at 22% 88%, hsl(var(--brand-indigo) / 0.12), transparent 64%)",
          ].join(", "),
        }}
      />

      {/* Ağ çizimi — tam genişlik, metnin ARKASINDA, dekoratif. */}
      <svg
        aria-hidden="true"
        viewBox="0 0 1200 420"
        preserveAspectRatio="xMidYMid slice"
        className="pointer-events-none absolute inset-0 h-full w-full opacity-70"
      >
        {NETWORK_EDGES.map(([from, to], index) => {
          const a = NETWORK_NODES[from];
          const b = NETWORK_NODES[to];
          return (
            <line
              key={`${from}-${to}`}
              x1={a.x}
              y1={a.y}
              x2={b.x}
              y2={b.y}
              stroke={`hsl(var(${a.color}) / 0.28)`}
              strokeWidth="1.25"
              className="manifesto-edge"
              // Kenarlar sırayla "çizilir" — ağın büyüdüğü hissi buradan gelir.
              style={{ animationDelay: `${index * 0.12}s` }}
            />
          );
        })}

        {NETWORK_NODES.map((node, index) => (
          <g key={`${node.x}-${node.y}`}>
            {/* Hâle: düğümün etrafında genişleyip sönen halka. */}
            <circle
              cx={node.x}
              cy={node.y}
              r={node.r * 2.6}
              fill={`hsl(var(${node.color}) / 0.16)`}
              className="manifesto-halo"
              style={{ animationDelay: `${index * 0.35}s` }}
            />
            <circle
              cx={node.x}
              cy={node.y}
              r={node.r}
              fill={`hsl(var(${node.color}))`}
              className="manifesto-node"
              style={{ animationDelay: `${index * 0.35}s` }}
            />
          </g>
        ))}
      </svg>

      <div className="relative z-10 mx-auto max-w-5xl px-6 text-center">
        <p className="inline-flex items-center gap-2 rounded-full border border-slate-900/10 bg-white/75 px-4 py-1.5 font-display text-xs font-semibold uppercase tracking-[0.2em] text-brand-indigo shadow-sm backdrop-blur">
          <span
            aria-hidden="true"
            className="manifesto-node h-1.5 w-1.5 rounded-full bg-glow-orange"
          />
          Bir manifesto
        </p>

        <h2 className="mt-6 font-display text-3xl font-bold leading-[1.1] tracking-[-0.02em] text-foreground sm:text-5xl lg:text-6xl">
          8.8 Milyon Türk.
          <br />
          <span className="text-gradient-logo">Tek küresel ağ.</span>
        </h2>

        <p className="mx-auto mt-8 max-w-3xl text-lg leading-relaxed text-slate-700 sm:text-xl">
          Dünyanın dört bir yanına dağılmış bir halk, görünmez bir ağla birbirine bağlı.
          CorteQS bu ağı görünür kılıyor: nerede olursan ol, kendi insanını, kendi
          topluluğunu ve kendi fırsatını bulabilmen için.
        </p>

        {/* Şehir çipleri: "dağılmış bir halk" cümlesinin görünür karşılığı. */}
        <ul className="mx-auto mt-10 flex max-w-3xl flex-wrap items-center justify-center gap-2">
          {CITY_CHIPS.map((chip) => (
            <li
              key={chip.city}
              className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/80 px-3.5 py-1.5 text-sm font-semibold text-slate-700 shadow-sm backdrop-blur-sm"
              style={{ borderColor: `hsl(var(${chip.color}) / 0.35)` }}
            >
              <span
                aria-hidden="true"
                className="h-2 w-2 rounded-full"
                style={{ background: `hsl(var(${chip.color}))` }}
              />
              {chip.city}
            </li>
          ))}
          <li className="inline-flex items-center rounded-full border border-dashed border-slate-400/60 px-3.5 py-1.5 text-sm font-semibold text-slate-500">
            ve her gün bir yenisi
          </li>
        </ul>
      </div>
    </section>
  );
};

export default ManifestoSection;
