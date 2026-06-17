/**
 * 1. Tam-viewport ağ hero (deneme landing).
 * Kategori-tanımlayıcı kısa başlık + tek birincil CTA + sessiz ikincil CTA.
 * Arka planda WorldAtlasMap (dekoratif marka katmanı) + ambient gradyan.
 */

import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import WorldAtlasMap from "./WorldAtlasMap";

const scrollToAtlas = () => {
  const el = document.getElementById("landingtrial-atlas");
  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
};

const HeroNetworkSection = () => {
  return (
    <section className="relative flex min-h-[88vh] items-center overflow-hidden">
      {/* Arka plan harita katmanı — içerikten soluk, dekoratif. */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.55]" aria-hidden="true">
        <WorldAtlasMap />
      </div>
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden="true"
        style={{
          background:
            "radial-gradient(60% 70% at 50% 38%, transparent 0%, hsl(var(--background) / 0.55) 70%, hsl(var(--background)) 100%)",
        }}
      />

      <div className="relative z-10 mx-auto w-full max-w-5xl px-6 text-center">
        <span className="corteqs-floating-chip inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold text-slate-600">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-glow-orange" aria-hidden="true" />
          Küresel Türk Diaspora Ağı
        </span>

        <h1 className="mt-6 font-display text-4xl font-bold leading-[1.04] tracking-[-0.02em] text-foreground sm:text-6xl lg:text-7xl">
          Dünyanın Her Yerindeki
          <br />
          <span className="text-gradient-tech">Türkler İçin Tek Ağ</span>
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
          Berlin'den Sidney'e, Toronto'dan Dubai'ye — insanları, toplulukları ve işletmeleri
          tek bir güven ağında buluşturuyoruz. Bir dizin değil, yaşayan bir ağ.
        </p>

        <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            to="/login?mode=signup"
            className="group inline-flex min-h-[52px] items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#00ACC1] to-[#0097A7] px-7 text-sm font-semibold text-white shadow-[0_16px_34px_-12px_hsl(var(--glow-teal)/0.6)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-glow-teal"
          >
            Ağa Katıl
            <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" aria-hidden="true" />
          </Link>
          <button
            type="button"
            onClick={scrollToAtlas}
            className="inline-flex min-h-[52px] items-center justify-center rounded-xl px-6 text-sm font-semibold text-slate-600 underline-offset-4 transition-colors hover:text-slate-900 hover:underline"
          >
            Ağı keşfet
          </button>
        </div>
      </div>
    </section>
  );
};

export default HeroNetworkSection;
