/**
 * 7. Final CTA — tek, yüksek-niyetli çağrı. Footer (PublicLayout) hemen altında gelir.
 */

import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

const FinalCtaSection = () => {
  return (
    <section className="relative mx-auto max-w-4xl px-6 pb-28 pt-12 text-center">
      <div className="glass-tech relative overflow-hidden rounded-3xl px-6 py-16 sm:px-12 sm:py-20">
        <div
          className="pointer-events-none absolute inset-0"
          aria-hidden="true"
          style={{
            background:
              "radial-gradient(50% 80% at 50% 0%, hsl(var(--glow-teal) / 0.12), transparent 70%)",
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
              className="group inline-flex min-h-[52px] items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#00ACC1] to-[#0097A7] px-8 text-sm font-semibold text-white shadow-[0_16px_34px_-12px_hsl(var(--glow-teal)/0.6)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-glow-teal"
            >
              Ücretsiz Kayıt Ol
              <ArrowRight
                className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5"
                aria-hidden="true"
              />
            </Link>
            <Link
              to="/founders"
              className="inline-flex min-h-[52px] items-center justify-center rounded-xl px-6 text-sm font-semibold text-slate-600 underline-offset-4 transition-colors hover:text-slate-900 hover:underline"
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
