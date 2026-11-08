/**
 * 1. Tam-viewport ağ hero (deneme landing) — Vodafone "everyone.connected" tarzı.
 * Kart YOK: tam ekran soyut "geometrik ağ" videosu (açık/beyaz zemin) + soldan başlayan
 * büyük başlık, dikey vurgu çizgili kısa açıklama, birincil CTA ve ikincil eylemler.
 * Video açık renkli olduğu için metin KOYU, okunabilirlik örtüsü de soldan BEYAZ.
 */

import { useEffect, useState } from "react";

import { HeroActions } from "./HeroActions";

// L5 (2026-11-08): hero düzeni Lovable CORTEQS+ ile hizalandı — eyebrow, üç satırlık
// başlık, açıklama, birincil CTA, dört ikincil düğme ve iki kampanya kartı
// (bkz. HeroActions.tsx / hero-cta-data.ts). Eski 5 + 4 eylem şeridi artık YALNIZ
// kapanış kartında (FinalCtaSection) durur. Arka plan (poster + video) DEĞİŞMEDİ:
// LCP öğesi poster kalır, bkz. aşağıdaki Lighthouse notları.

// Telifsiz soyut "beyaz geometrik ağ" hero videosu (Pexels #29718114, telifsiz).
// Açık zemin → metin koyu, gradyan örtü beyaz tarafta. Yeni videoyu aynı isimle
// (public/landing-assets/hero-network.mp4) değiştirirsin — kod değişmez.
// NOT: route adıyla (/landingtrial) çakışmayan bir klasörde tutulur — public/landingtrial/
// olsaydı Vite dist/landingtrial/ dizini üretir, nginx onu /landingtrial route'unun
// önüne geçirip 403 verirdi (CLAUDE.md "dist/<slug>/ dizini oluşmamalı" uyarısı).
const HERO_VIDEO_SRC = "/landing-assets/hero-network.mp4";
// Videonun İLK karesi (ffmpeg, 1280px WebP ~10 KB). Video değişirse poster de
// yeniden üretilir, yoksa video başlarken görüntü sıçrar. index.html bu dosyayı
// preload eder — adı değişirse orayı da güncelle.
const HERO_POSTER_SRC = "/landing-assets/hero-network-poster.webp";

// Lighthouse 2026-10-12: LCP öğesi 8 MB'lık bu videoydu (mobil LCP 8,8 sn).
// Kullanıcı kararı 2026-10-12: dar ekranda (≤640px) ve "azaltılmış hareket"
// tercihinde video HİÇ çizilmez; yalnız poster durur. Geniş ekranda video, sayfa
// `load` olduktan SONRA poster'ın üstüne gelir — LCP'yi poster belirler.
const HERO_VIDEO_QUERY = "(min-width: 641px) and (prefers-reduced-motion: no-preference)";

// React 18 `fetchPriority` prop'unu tanımaz (uyarı verir); küçük harfli DOM
// özniteliği olarak geçirilir. React 19'a geçince `fetchPriority="high"` yazılır.
const HIGH_FETCH_PRIORITY = { fetchpriority: "high" } as Record<string, string>;

function useHeroVideoEnabled(): boolean {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    if (!window.matchMedia(HERO_VIDEO_QUERY).matches) return undefined;

    const enable = () => setEnabled(true);
    if (document.readyState === "complete") {
      enable();
      return undefined;
    }
    window.addEventListener("load", enable, { once: true });
    return () => window.removeEventListener("load", enable);
  }, []);

  return enabled;
}

const HeroNetworkSection = () => {
  const videoEnabled = useHeroVideoEnabled();

  return (
    // `min-h-[75vh]` (Lovable'daki gibi): arama çubuğu hero'nun hemen altında,
    // ilk ekranın yakınında görünür. İçerik uzadığında (mobilde) bölüm kendiliğinden büyür.
    <section className="relative flex min-h-[75vh] items-center overflow-hidden bg-white pb-14 pt-8 sm:pb-16 sm:pt-10">
      {/* Poster her ekranda çizilir ve LCP öğesidir; video (yalnız geniş ekranda)
          aynı karede başladığı için üstüne geçiş görünmez. Dekoratif → alt="". */}
      <img
        src={HERO_POSTER_SRC}
        alt=""
        aria-hidden="true"
        decoding="async"
        {...HIGH_FETCH_PRIORITY}
        className="pointer-events-none absolute inset-0 h-full w-full object-cover"
      />
      {videoEnabled ? (
        <video
          src={HERO_VIDEO_SRC}
          poster={HERO_POSTER_SRC}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 h-full w-full object-cover"
        />
      ) : null}
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
          background: "linear-gradient(0deg, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0) 42%)",
        }}
      />

      <div className="relative z-10 mx-auto w-full max-w-7xl px-6 sm:px-10">
        <div className="max-w-2xl text-left">
          {/* Eyebrow satırı: kısa marka çizgisi + tek satır etiket (Lovable düzeni). */}
          <p className="flex items-center gap-3">
            <span className="h-0.5 w-8 shrink-0 bg-glow-teal" aria-hidden="true" />
            <span className="text-xs font-semibold leading-relaxed text-slate-700 sm:text-sm">
              CORTEQS — Yurt Dışında Yaşayan Türklerin Sistemi
            </span>
          </p>

          <h1 className="mt-5 font-display text-4xl font-bold leading-[1.02] tracking-[-0.02em] text-slate-900 sm:text-6xl lg:text-[4.5rem]">
            Gittiğin ülkede
            <br />
            <span className="text-gradient-logo">organize bir ağ</span>
            <br />
            seni bekliyor
          </h1>

          {/* Vodafone tarzı sol dikey vurgu çizgili açıklama. */}
          <p className="mt-6 max-w-xl border-l-2 border-glow-teal pl-5 text-sm leading-relaxed text-slate-700 sm:text-base">
            Danışmanlar, dernekler, etkinlikler ve ücretsiz araçlarla diasporadaki yaşamını kolaylaştır. Bir dizin
            değil, yaşayan bir ağ.
          </p>
        </div>

        <HeroActions />
      </div>
    </section>
  );
};

export default HeroNetworkSection;
