/**
 * 7. Final CTA — tek, yüksek-niyetli çağrı. Footer (PublicLayout) hemen altında gelir.
 */

import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

const FinalCtaSection = () => {
  return (
    <section className="relative mx-auto max-w-4xl px-6 pb-28 pt-12 text-center">
      <div className="glass-tech relative overflow-hidden rounded-3xl px-6 py-16 sm:px-12 sm:py-20">
        {/* İnce çok renkli logo şeridi — kartın üst kenarında (kapanışta marka imzası). */}
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-1"
          aria-hidden="true"
          style={{
            background:
              "linear-gradient(90deg, hsl(var(--glow-teal)), hsl(var(--brand-blue)), hsl(var(--brand-indigo)), hsl(var(--brand-pink)), hsl(var(--glow-orange)), hsl(var(--brand-yellow)))",
          }}
        />
        <div
          className="pointer-events-none absolute inset-0"
          aria-hidden="true"
          style={{
            background:
              "radial-gradient(50% 80% at 50% 0%, hsl(var(--glow-orange) / 0.12), transparent 70%)",
          }}
        />
        <div className="relative z-10">
          <h2 className="font-display text-3xl font-bold leading-[1.1] tracking-[-0.02em] text-foreground sm:text-4xl">
            Yurt dışındaki hayatı
            <br className="hidden sm:block" /> şekillendiren sisteme katıl
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            Ücretsiz kayıt ol, kendi şehrindeki ağını keşfet ve büyümenin parçası ol.
          </p>
          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              to="/login?mode=signup"
              className="group inline-flex min-h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#00ACC1] to-[#0097A7] px-8 text-sm font-semibold text-white shadow-[0_16px_34px_-12px_hsl(var(--glow-teal)/0.6)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-glow-teal sm:w-auto"
            >
              Ücretsiz Kayıt Ol
              <ArrowRight
                className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5"
                aria-hidden="true"
              />
            </Link>
            <Link
              to="/founders"
              className="inline-flex min-h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-slate-800 to-slate-950 px-8 text-sm font-semibold text-white shadow-[0_16px_34px_-12px_rgba(15,23,42,0.5)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_20px_40px_-12px_rgba(15,23,42,0.65)] sm:w-auto"
            >
              Biz kimiz?
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FinalCtaSection;
