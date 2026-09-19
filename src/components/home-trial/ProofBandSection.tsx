/**
 * 5. Kanıt bandı — startup metrik duvarı değil, editöryel kavramsal kanıt.
 * Değerler kavramsal/placeholder'dır (uydurma kesin metrik YOK); "∞" için
 * sembolik gösterim, sayısal kavramlar için CountUp animasyonu kullanılır.
 *
 * RENK (2026-09-19): bölüm düz beyaz zeminde siyah rakam + gri etiketle
 * çevresindeki bölümlerin içinde kayboluyordu. Zemin artık MARKANIN KENDİ
 * logo paletinden (teal · mavi · indigo · pembe — `index.css`'teki
 * `--glow-teal` / `--brand-*` belirteçleri) türetilen yumuşak radyal
 * yıkamalarla renklendirildi ve her istatistik kendi rengini taşıyor.
 * Renkler koddan uydurulmaz, belirteçten okunur — tema değişirse birlikte döner.
 *
 * Erişilebilirlik: renk TEK BAŞINA anlam taşımaz (her sütunun kendi metin
 * etiketi var), etiketler koyu slate kalır ve zemin yıkamaları düşük opaklıkta
 * tutulur ki rakam/etiket kontrastı AA üstünde kalsın.
 */

import CountUp from "@/components/motion/CountUp";
import { PROOF_STATS } from "./home-trial.data";

/**
 * Sütun başına bir marka rengi. `PROOF_STATS` saf veri kalsın diye renk burada
 * eşlenir; liste uzar/kısalırsa modulo ile döner, eksik renk kalmaz.
 */
const STAT_TONES = [
  "var(--glow-teal)",
  "var(--brand-blue)",
  "var(--brand-indigo)",
  "var(--brand-pink)",
] as const;

/**
 * Zemin yıkamaları — köşelerden gelen, birbirine karışan marka renkleri.
 * Ortadaki turuncu yıkama, tek başına kalan "Büyüyen bir ağ" başlığını zemine
 * bağlar; yoksa turuncu, teal→mavi→indigo→pembe dizisinde yabancı durur.
 * Opaklıklar bilinçli olarak 0.24–0.34 bandında: daha düşüğü "silik" görünüyordu,
 * daha yükseği slate etiketlerin kontrastını AA'nın altına düşürür.
 */
const COLOR_WASH = [
  "radial-gradient(62% 135% at 4% 0%, hsl(var(--glow-teal) / 0.34), transparent 64%)",
  "radial-gradient(52% 125% at 34% 100%, hsl(var(--brand-blue) / 0.30), transparent 66%)",
  "radial-gradient(40% 70% at 50% 6%, hsl(var(--glow-orange) / 0.16), transparent 70%)",
  "radial-gradient(52% 125% at 70% 0%, hsl(var(--brand-indigo) / 0.28), transparent 66%)",
  "radial-gradient(62% 135% at 100% 100%, hsl(var(--brand-pink) / 0.28), transparent 64%)",
].join(", ");

const ProofBandSection = () => {
  return (
    <section className="relative overflow-hidden bg-[#f2f6fb] py-20 sm:py-24">
      <div className="pointer-events-none absolute inset-0" aria-hidden="true" style={{ background: COLOR_WASH }} />
      {/* Üst/alt saç teli sınır: bandın beyaz komşularından ayrıldığı yeri belli eder. */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px"
        aria-hidden="true"
        style={{
          background:
            "linear-gradient(90deg, transparent, hsl(var(--glow-teal) / 0.45), hsl(var(--brand-indigo) / 0.45), transparent)",
        }}
      />
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-px"
        aria-hidden="true"
        style={{
          background:
            "linear-gradient(90deg, transparent, hsl(var(--brand-pink) / 0.4), hsl(var(--brand-blue) / 0.4), transparent)",
        }}
      />

      <div className="relative z-10 mx-auto max-w-5xl px-6">
        <p className="text-center font-display text-sm font-semibold uppercase tracking-[0.2em] text-brand-orange">
          Büyüyen bir ağ
        </p>
        <dl className="mt-10 grid grid-cols-2 gap-y-10 sm:grid-cols-4">
          {PROOF_STATS.map((stat, index) => {
            const tone = STAT_TONES[index % STAT_TONES.length];
            return (
              <div
                key={stat.label}
                className="relative px-2 text-center sm:border-l sm:border-slate-900/[0.14] sm:first:border-l-0"
              >
                <dt
                  className="font-display text-4xl font-bold tracking-tight sm:text-5xl"
                  style={{ color: `hsl(${tone})` }}
                >
                  {stat.value === null ? (
                    <span>{stat.display}</span>
                  ) : (
                    <CountUp to={stat.value} />
                  )}
                  {stat.suffix ? <span>{stat.suffix}</span> : null}
                </dt>
                {/* Rakamı etiketine bağlayan kısa renkli çizgi — süs değil, eşleme. */}
                <span
                  className="mx-auto mt-3 block h-0.5 w-8 rounded-full"
                  aria-hidden="true"
                  style={{ background: `hsl(${tone} / 0.55)` }}
                />
                <dd className="mt-3 text-sm font-medium text-slate-700">{stat.label}</dd>
              </div>
            );
          })}
        </dl>
        <p className="mt-10 text-center text-xs text-slate-500">
          * Değerler ağın ölçeğini temsil eden kavramsal ifadelerdir.
        </p>
      </div>
    </section>
  );
};

export default ProofBandSection;
