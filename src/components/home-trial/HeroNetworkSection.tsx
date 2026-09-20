/**
 * 1. Tam-viewport ağ hero (deneme landing) — Vodafone "everyone.connected" tarzı.
 * Kart YOK: tam ekran soyut "geometrik ağ" videosu (açık/beyaz zemin) + soldan başlayan
 * büyük başlık, dikey vurgu çizgili kısa açıklama ve dolu birincil CTA + sessiz ikincil CTA.
 * Video açık renkli olduğu için metin KOYU, okunabilirlik örtüsü de soldan BEYAZ.
 */

import { ActionButtons } from "./ActionButtons";
import { PRIMARY_ACTIONS, QUICK_ACTIONS } from "./action-buttons-data";

// Telifsiz soyut "beyaz geometrik ağ" hero videosu (Pexels #29718114, telifsiz).
// Açık zemin → metin koyu, gradyan örtü beyaz tarafta. Yeni videoyu aynı isimle
// (public/landing-assets/hero-network.mp4) değiştirirsin — kod değişmez.
// NOT: route adıyla (/landingtrial) çakışmayan bir klasörde tutulur — public/landingtrial/
// olsaydı Vite dist/landingtrial/ dizini üretir, nginx onu /landingtrial route'unun
// önüne geçirip 403 verirdi (CLAUDE.md "dist/<slug>/ dizini oluşmamalı" uyarısı).
const HERO_VIDEO_SRC = "/landing-assets/hero-network.mp4";

const HeroNetworkSection = () => {
  return (
    // İçerik dikeyde ortalıdır; üst boşluğu azaltmak için `py-8` yerine ASİMETRİK
    // dolgu kullanılır. Alt dolgunun fazlası, ortalama kutusunu yukarı taşır —
    // içerik ~36px (sm+ ~48px) yukarı çıkar, `min-h` DEĞİŞMEDİĞİ için hero'nun
    // yüksekliği aynı kalır. `items-start`'a geçmek yüksekliği korurdu ama içeriği
    // ekran boyundan bağımsız olarak tepeye yapıştırırdı; uzun ekranlarda kötü durur.
    <section className="relative flex min-h-[calc(100vh-8rem)] items-center overflow-hidden bg-white pb-24 pt-6 sm:min-h-[calc(100vh-6rem)] sm:pb-32 sm:pt-8">
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
      {/* Okunabilirlik örtüsü: açık videoda KOYU metnin okunması için soldan beyaz → sağa şeffaf.
          Başlığın olduğu sol taraf süt beyaza yaklaşır, sağdaki ağ deseni görünür kalır. */}
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden="true"
        style={{
          background:
            "linear-gradient(90deg, rgba(255,255,255,0.92) 0%, rgba(255,255,255,0.78) 38%, rgba(255,255,255,0.35) 70%, rgba(255,255,255,0.12) 100%)",
        }}
      />
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden="true"
        style={{
          background:
            "linear-gradient(0deg, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0) 42%)",
        }}
      />

      <div className="relative z-10 mx-auto w-full max-w-7xl px-6 sm:px-10">
        <div className="max-w-2xl text-left">
          <span className="inline-flex items-center gap-2 rounded-full border border-slate-900/10 bg-white/70 px-4 py-1.5 text-xs font-semibold text-slate-700 shadow-sm backdrop-blur">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-glow-orange" aria-hidden="true" />
            Küresel Türk Diaspora Ağı
          </span>

          <h1 className="mt-4 font-display text-4xl font-bold leading-[0.98] tracking-[-0.02em] text-slate-900 sm:text-6xl lg:text-[4.5rem]">
            Dünyanın
            <br />
            Her Yerindeki
            <br />
            <span className="text-gradient-logo">Türkler İçin</span>
            <br />
            <span className="text-gradient-logo">Tek Ağ</span>
          </h1>

          {/* Vodafone tarzı sol dikey vurgu çizgili açıklama. */}
          <p className="mt-6 max-w-xl border-l-2 border-glow-teal pl-5 text-sm leading-relaxed text-slate-700 sm:text-base">
            Berlin'den Sidney'e, Toronto'dan Dubai'ye insanları, toplulukları ve işletmeleri
            tek bir güven ağında buluşturuyoruz. Bir dizin değil, yaşayan bir ağ.
          </p>

          {/* Birincil eylemler — ikincil kısayollarla AYNI ölçüde (bkz. ActionButtons). */}
          <ActionButtons buttons={[PRIMARY_ACTIONS.join, PRIMARY_ACTIONS.tools, PRIMARY_ACTIONS.explore]} className="mt-7 max-w-xl" ariaLabel="Ana eylemler" />
          <ActionButtons buttons={QUICK_ACTIONS} className="mt-2.5 max-w-xl" ariaLabel="Hızlı erişim" />
        </div>
      </div>
    </section>
  );
};

export default HeroNetworkSection;
