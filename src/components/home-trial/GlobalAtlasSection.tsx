/**
 * 3. Global network atlas — ağı "altyapı" olarak gösteren bölüm.
 * Tam genişlikte WorldAtlasMap + kısa manifesto + restrained kanıt şeridi.
 * Burada harita arka plan değil, içeriğin kendisidir (marka argümanı).
 */

import WorldAtlasMap from "./WorldAtlasMap";

const ATLAS_PROOF: readonly { value: string; label: string }[] = [
  { value: "8+", label: "kıtaya yayılmış şehir" },
  { value: "7/24", label: "yaşayan bağlantı akışı" },
  { value: "Tek", label: "güven ağı" },
];

const GlobalAtlasSection = () => {
  return (
    <section id="landingtrial-atlas" className="relative mx-auto max-w-6xl px-6 py-20 sm:py-28">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="font-display text-3xl font-bold leading-[1.1] tracking-[-0.02em] text-foreground sm:text-4xl">
          Ağı haritada gör
        </h2>
        <p className="mt-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
          CorteQS'in omurgası fiber ya da uydu değil — insanlar, topluluklar ve güvenilir
          düğümler. İstanbul'dan dünyaya uzanan canlı bağlantılar.
        </p>
      </div>

      <div className="glass-tech mt-12 overflow-hidden rounded-3xl p-3 sm:p-5">
        <div className="aspect-[2/1] w-full">
          <WorldAtlasMap />
        </div>
      </div>

      <ul className="mx-auto mt-10 flex max-w-3xl flex-wrap items-center justify-center gap-x-12 gap-y-6">
        {ATLAS_PROOF.map((item) => (
          <li key={item.label} className="text-center">
            <div className="font-display text-3xl font-bold text-glow-teal sm:text-4xl">
              {item.value}
            </div>
            <div className="mt-1 text-sm text-muted-foreground">{item.label}</div>
          </li>
        ))}
      </ul>
    </section>
  );
};

export default GlobalAtlasSection;
