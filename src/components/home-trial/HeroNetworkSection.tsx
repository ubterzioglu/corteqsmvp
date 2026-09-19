/**
 * 1. Tam-viewport ağ hero (deneme landing) — Vodafone "everyone.connected" tarzı.
 * Kart YOK: tam ekran soyut "geometrik ağ" videosu (açık/beyaz zemin) + soldan başlayan
 * büyük başlık, dikey vurgu çizgili kısa açıklama ve dolu birincil CTA + sessiz ikincil CTA.
 * Video açık renkli olduğu için metin KOYU, okunabilirlik örtüsü de soldan BEYAZ.
 */

import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

// Telifsiz soyut "beyaz geometrik ağ" hero videosu (Pexels #29718114, telifsiz).
// Açık zemin → metin koyu, gradyan örtü beyaz tarafta. Yeni videoyu aynı isimle
// (public/landing-assets/hero-network.mp4) değiştirirsin — kod değişmez.
// NOT: route adıyla (/landingtrial) çakışmayan bir klasörde tutulur — public/landingtrial/
// olsaydı Vite dist/landingtrial/ dizini üretir, nginx onu /landingtrial route'unun
// önüne geçirip 403 verirdi (CLAUDE.md "dist/<slug>/ dizini oluşmamalı" uyarısı).
const HERO_VIDEO_SRC = "/landing-assets/hero-network.mp4";

/**
 * Hero'nun ikincil kısayolları — üst menüdeki (SiteHeader) şeridin aynısı.
 * "Araçlar" LİSTEDE YOKTUR: yukarıda turuncu birincil buton olarak zaten var,
 * iki kez göstermek ölü tekrar olurdu.
 *
 * ⚠️ `/feedback` rotası `RequireAuth` arkasındadır (App.tsx). Giriş yapmamış
 * ziyaretçi buraya tıklayınca giriş ekranına düşer — bu bilinçlidir; `carryOrigin`
 * ile geldiği sayfa taşınır, böylece geri bildirim kaydı `page_path` alanını
 * doğru doldurur (SiteHeader'daki `state.from` deseniyle aynı).
 */
const HERO_QUICK_LINKS: { to: string; label: string; carryOrigin?: boolean }[] = [
  { to: "/radar", label: "Radar" },
  { to: "/addcom", label: "Dijital Gruplar" },
  { to: "/events", label: "Etkinlikler" },
  { to: "/feedback", label: "Geri Bildirim", carryOrigin: true },
];

const scrollToAtlas = () => {
  const el = document.getElementById("landingtrial-atlas");
  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
};

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

          <div className="mt-7 flex flex-col items-start gap-3 sm:flex-row sm:items-center">
            <Link
              to="/login?mode=signup"
              className="group inline-flex min-h-[46px] items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#00ACC1] to-[#0097A7] px-8 text-sm font-semibold text-white shadow-[0_16px_34px_-12px_hsl(var(--glow-teal)/0.6)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-glow-teal"
            >
              Ağa Katıl
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" aria-hidden="true" />
            </Link>
            <Link
              to="/tools"
              className="group inline-flex min-h-[46px] items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#F59E0B] to-[#EA580C] px-8 text-sm font-semibold text-white shadow-[0_16px_34px_-12px_rgba(234,88,12,0.55)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_20px_38px_-12px_rgba(234,88,12,0.65)]"
            >
              Araçlar!
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" aria-hidden="true" />
            </Link>
            <button
              type="button"
              onClick={scrollToAtlas}
              className="group inline-flex min-h-[46px] items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#34A853] to-[#2F9B4D] px-8 text-sm font-semibold text-white shadow-[0_16px_34px_-12px_rgba(52,168,83,0.55)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_20px_38px_-12px_rgba(52,168,83,0.65)]"
            >
              Ağı keşfet
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" aria-hidden="true" />
            </button>
          </div>

          {/*
           * İkincil kısayol şeridi — üst menüdeki (SiteHeader) bağlantıların hero'daki
           * karşılığı. Bilerek HAFİF stilde: dolu gradyan yapılsaydı yedi eşit ağırlıklı
           * buton olur ve birincil çağrı "Ağa Katıl" kaybolurdu.
           * "Araçlar" burada TEKRARLANMAZ — yukarıda turuncu ana buton olarak duruyor.
           */}
          <nav aria-label="Hızlı erişim" className="mt-4 flex flex-wrap items-center gap-2">
            {HERO_QUICK_LINKS.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                state={link.carryOrigin ? { from: "/" } : undefined}
                className="inline-flex min-h-[38px] items-center rounded-full border border-slate-300/70 bg-white/70 px-4 text-sm font-medium text-slate-700 backdrop-blur-sm transition-colors duration-200 hover:border-slate-400 hover:bg-white hover:text-slate-900"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </section>
  );
};

export default HeroNetworkSection;
