/**
 * 1. Tam-viewport ağ hero (deneme landing).
 * Kategori-tanımlayıcı kısa başlık + tek birincil CTA + sessiz ikincil CTA.
 * Arka planda loop eden yazısız "gece dönen dünya" videosu (NASA SVS, public domain),
 * üstte içeriği taşıyan KOYU frosted-glass kart — video net döner, metin cam kartta okunur.
 */

import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

// Yazısız, telifsiz hero videosu: NASA "Animation of Rotating Earth at Night"
// (Wikimedia Commons, public domain). Gece şehir ışıkları = küresel diaspora ağı.
// NOT: route adıyla (/landingtrial) çakışmayan bir klasörde tutulur — public/landingtrial/
// olsaydı Vite dist/landingtrial/ dizini üretir, nginx onu /landingtrial route'unun
// önüne geçirip 403 verirdi (CLAUDE.md "dist/<slug>/ dizini oluşmamalı" uyarısı).
const HERO_VIDEO_SRC = "/landing-assets/earth-night.webm";

const scrollToAtlas = () => {
  const el = document.getElementById("landingtrial-atlas");
  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
};

const HeroNetworkSection = () => {
  return (
    <section className="relative flex min-h-[88vh] items-center overflow-hidden bg-slate-950">
      {/* Arka plan video katmanı — dekoratif, loop, sessiz, autoplay. Net döner. */}
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
      {/* Çok hafif kenar karartması: videoyu net bırakır, sadece kenarları zemine kaynaştırır. */}
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden="true"
        style={{
          background:
            "radial-gradient(80% 85% at 50% 45%, rgba(2,6,23,0) 0%, rgba(2,6,23,0.25) 70%, rgba(2,6,23,0.6) 100%)",
        }}
      />

      <div className="relative z-10 mx-auto w-full max-w-3xl px-6">
        {/* Koyu frosted-glass hero kartı — video üstte net dururken metin kontrastını garanti eder. */}
        <div className="rounded-3xl border border-white/15 bg-slate-900/45 px-6 py-12 text-center shadow-[0_30px_70px_-28px_rgba(0,0,0,0.7)] backdrop-blur-xl sm:px-12 sm:py-16">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-1.5 text-xs font-semibold text-white/80 backdrop-blur">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-glow-orange" aria-hidden="true" />
            Küresel Türk Diaspora Ağı
          </span>

          <h1 className="mt-6 font-display text-4xl font-bold leading-[1.04] tracking-[-0.02em] text-white sm:text-6xl lg:text-7xl">
            Dünyanın Her Yerindeki
            <br />
            <span className="text-gradient-tech">Türkler İçin Tek Ağ</span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-white/75 sm:text-lg">
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
              className="inline-flex min-h-[52px] items-center justify-center rounded-xl px-6 text-sm font-semibold text-white/70 underline-offset-4 transition-colors hover:text-white hover:underline"
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
