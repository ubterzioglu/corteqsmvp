import { Link } from "react-router-dom";
import { Compass, Globe, Home } from "lucide-react";

import { useSeo } from "@/lib/seo";

const maskot = "/lmaskot.png";

const NotFound = () => {
  // SOFT-404 KORUMASI: SPA gerçek HTTP 404 döndüremez — olmayan bir yol 200 + bu
  // kabuk olarak servis edilir. index.html'deki global `robots: index, follow`
  // devrede kaldığı için, uydurma her URL indekslenebilir "sayfa" gibi görünüyordu.
  // noindex bunu durdurur; follow, sayfadaki iç bağlantıların taranmasını sürdürür.
  // Prerender çıktısına da yansır (applySeo render-complete'i dispatch eder).
  //
  // Gerçek HTTP 404 backlog'da (B-4) — sunucu tarafı route bilgisi gerektirir.
  //
  // Eski `console.error` kaldırıldı: her 404'te konsola kırmızı hata basmak gerçek
  // hataları gölgeliyordu ve kullanıcıya hiçbir şey katmıyordu.
  useSeo(
    {
      title: "Sayfa bulunamadı | CorteQS",
      description: "Aradığınız sayfa bulunamadı. Ana sayfadan devam edebilirsiniz.",
      robots: "noindex, follow",
    },
    [],
  );

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-background via-card to-secondary/30">
      <div
        className="pointer-events-none absolute -right-32 -top-32 h-[500px] w-[500px] rounded-full opacity-20 blur-3xl"
        style={{ background: "hsl(var(--primary))" }}
      />
      <div
        className="pointer-events-none absolute -bottom-32 -left-32 h-[400px] w-[400px] rounded-full opacity-15 blur-3xl"
        style={{ background: "hsl(var(--accent))" }}
      />

      <div className="relative z-10 mx-auto max-w-2xl px-4 text-center">
        <div className="relative mb-3 inline-block">
          <img
            src={maskot}
            alt="CorteQS"
            className="mx-auto mb-1 h-56 w-auto"
          />
          <span className="bg-gradient-to-br from-primary to-accent bg-clip-text text-[72px] font-extrabold leading-none text-transparent md:text-[104px]">
            404
          </span>
          <div className="absolute -right-4 -top-2 animate-pulse">
            <Compass className="h-8 w-8 text-accent/60" />
          </div>
        </div>

        <h1 className="mb-2 text-xl font-bold text-foreground md:text-2xl">
          Bu sayfa <span className="text-accent">kayıp</span> — ama sen
          değilsin!
        </h1>

        <p className="mx-auto mb-5 max-w-xl text-base leading-relaxed text-muted-foreground md:text-lg">
          <span className="block">Diaspora ağında yolunu bulamadık gibi görünüyor.</span>
          <span className="block">Ama endişelenme, ana sayfadan haritana ulaşabilirsin.</span>
        </p>

        <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link
            to="/"
            className="inline-flex w-60 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-primary/90 px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:shadow-primary/30 hover:brightness-105"
          >
            <Home className="h-4 w-4" />
            Ana Sayfaya Dön
          </Link>
          <Link
            to="/#kaydol"
            className="inline-flex w-60 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-accent to-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:shadow-primary/30 hover:brightness-105"
          >
            <Globe className="h-4 w-4" />
            Kayıt Ol
          </Link>
        </div>

        <Link
          to="/"
          className="mt-6 inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-primary"
        >
          ← corteqs.net
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
