/**
 * 1. Tam-viewport ağ hero (deneme landing) — Vodafone "everyone.connected" tarzı.
 * Kart YOK: tam ekran insan/topluluk videosu + soldan başlayan büyük başlık,
 * dikey vurgu çizgili kısa açıklama ve dolu birincil CTA + sessiz ikincil CTA.
 */

import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

// Geçici telifsiz "insan/topluluk" hero videosu (Pexels, telifsiz).
// Sen sonra public/landing-assets/hero-people.mp4 dosyasını gerçek videoyla
// değiştirirsin — kod değişmez. Eski "gece dünyası" videosu yedek olarak durur.
// NOT: route adıyla (/landingtrial) çakışmayan bir klasörde tutulur — public/landingtrial/
// olsaydı Vite dist/landingtrial/ dizini üretir, nginx onu /landingtrial route'unun
// önüne geçirip 403 verirdi (CLAUDE.md "dist/<slug>/ dizini oluşmamalı" uyarısı).
const HERO_VIDEO_SRC = "/landing-assets/hero-people.mp4";

const scrollToAtlas = () => {
  const el = document.getElementById("landingtrial-atlas");
  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
};

const HeroNetworkSection = () => {
  return (
    <section className="relative flex min-h-[92vh] items-center overflow-hidden bg-slate-950">
      {/* Tam ekran arka plan video — dekoratif, loop, sessiz, autoplay. */}
      <video
        src={HERO_VIDEO_SRC}
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 h-full w-full object-cover"
      />
      {/* Okunabilirlik örtüsü: soldan koyu → sağa şeffaf (başlığın bittiği taraf görünür kalır)
          + alttan hafif karartma. Vodafone hero'sundaki sinematik kontrastı verir. */}
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden="true"
        style={{
          background:
            "linear-gradient(90deg, rgba(2,6,23,0.85) 0%, rgba(2,6,23,0.6) 38%, rgba(2,6,23,0.15) 70%, rgba(2,6,23,0.05) 100%)",
        }}
      />
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden="true"
        style={{
          background:
            "linear-gradient(0deg, rgba(2,6,23,0.65) 0%, rgba(2,6,23,0) 40%)",
        }}
      />

      <div className="relative z-10 mx-auto w-full max-w-7xl px-6 sm:px-10">
        <div className="max-w-2xl text-left">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-semibold text-white/85 backdrop-blur">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-glow-orange" aria-hidden="true" />
            Küresel Türk Diaspora Ağı
          </span>

          <h1 className="mt-6 font-display text-5xl font-bold leading-[0.98] tracking-[-0.02em] text-white sm:text-7xl lg:text-[5.5rem]">
            Dünyanın Her Yerindeki
            <br />
            <span className="text-gradient-tech">Türkler İçin Tek Ağ</span>
          </h1>

          {/* Vodafone tarzı sol dikey vurgu çizgili açıklama. */}
          <p className="mt-8 max-w-xl border-l-2 border-glow-teal pl-5 text-base leading-relaxed text-white/80 sm:text-lg">
            Berlin'den Sidney'e, Toronto'dan Dubai'ye — insanları, toplulukları ve işletmeleri
            tek bir güven ağında buluşturuyoruz. Bir dizin değil, yaşayan bir ağ.
          </p>

          <div className="mt-10 flex flex-col items-start gap-3 sm:flex-row sm:items-center">
            <Link
              to="/login?mode=signup"
              className="group inline-flex min-h-[54px] items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#00ACC1] to-[#0097A7] px-8 text-sm font-semibold text-white shadow-[0_16px_34px_-12px_hsl(var(--glow-teal)/0.6)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-glow-teal"
            >
              Ağa Katıl
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" aria-hidden="true" />
            </Link>
            <button
              type="button"
              onClick={scrollToAtlas}
              className="inline-flex min-h-[54px] items-center justify-center rounded-full px-6 text-sm font-semibold text-white/75 underline-offset-4 transition-colors hover:text-white hover:underline"
            >
              Ağı keşfet
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroNetworkSection;
