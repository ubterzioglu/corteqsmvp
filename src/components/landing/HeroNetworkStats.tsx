/**
 * Hero "ağ durumu" kavramsal etiketleri — CANLI istatistik DEĞİL, kavram etiketi.
 * Diaspora ağının kapsamını sezdiren küçük, statik cam çip satırı.
 *
 * İçerik akışının parçası (z-10 içinde, okunur) — dekoratif arka plan değil.
 * Yanıltıcı "canlı sayaç" yok; "8M+" diaspora potansiyeli kavramsal bir ifadedir.
 */

interface StatChip {
  value: string;
  label: string;
}

const STATS: readonly StatChip[] = [
  { value: "8M+", label: "diaspora potansiyeli" },
  { value: "∞", label: "şehir" },
  { value: "∞", label: "topluluk" },
  { value: "∞", label: "uzman" },
];

interface HeroNetworkStatsProps {
  className?: string;
}

const HeroNetworkStats = ({ className }: HeroNetworkStatsProps) => {
  return (
    <ul
      className={`flex flex-wrap items-center gap-2 ${className ?? ""}`}
      aria-label="CorteQS ağı kapsamı"
    >
      {STATS.map((stat) => (
        <li
          key={stat.label}
          className="corteqs-floating-chip flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-medium text-slate-600"
          style={{ animation: "none" }}
        >
          <span className="font-bold text-glow-teal">{stat.value}</span>
          <span>{stat.label}</span>
        </li>
      ))}
    </ul>
  );
};

export default HeroNetworkStats;
