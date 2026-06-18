/**
 * 5. Kanıt bandı — startup metrik duvarı değil, editöryel kavramsal kanıt.
 * Değerler kavramsal/placeholder'dır (uydurma kesin metrik YOK); "∞" için
 * sembolik gösterim, sayısal kavramlar için CountUp animasyonu kullanılır.
 */

import CountUp from "@/components/motion/CountUp";
import { PROOF_STATS } from "./home-trial.data";

const ProofBandSection = () => {
  return (
    <section className="relative overflow-hidden bg-white py-20 sm:py-24">
      <div className="relative z-10 mx-auto max-w-5xl px-6">
        <p className="text-center font-display text-sm font-semibold uppercase tracking-[0.2em] text-brand-orange">
          Büyüyen bir ağ
        </p>
        <dl className="mt-10 grid grid-cols-2 gap-y-10 sm:grid-cols-4">
          {PROOF_STATS.map((stat) => (
            <div key={stat.label} className="text-center">
              <dt className="font-display text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
                {stat.value === null ? (
                  <span>{stat.display}</span>
                ) : (
                  <CountUp to={stat.value} />
                )}
                {stat.suffix ? <span>{stat.suffix}</span> : null}
              </dt>
              <dd className="mt-2 text-sm text-muted-foreground">{stat.label}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-10 text-center text-xs text-muted-foreground/70">
          * Değerler ağın ölçeğini temsil eden kavramsal ifadelerdir.
        </p>
      </div>
    </section>
  );
};

export default ProofBandSection;
