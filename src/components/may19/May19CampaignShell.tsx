import type { ReactNode } from "react";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";

type May19CampaignShellProps = {
  eyebrow: string;
  title: ReactNode;
  description: string;
  headerBgImageSrc?: string;
  headerPoeticImageSrc?: string;
  heroImageSrc?: string;
  heroImageAlt?: string;
  primaryCta?: {
    label: string;
    to: string;
  };
  secondaryCta?: {
    label: string;
    to: string;
  };
  children: ReactNode;
};

export default function May19CampaignShell({
  eyebrow,
  title,
  description,
  headerBgImageSrc,
  headerPoeticImageSrc,
  heroImageSrc,
  heroImageAlt = "CorteQS Hero",
  primaryCta,
  secondaryCta,
  children,
}: May19CampaignShellProps) {
  const isExternal = (to: string) => /^https?:\/\//i.test(to);

  const headerStyle = headerBgImageSrc
    ? {
        backgroundImage: `linear-gradient(180deg,rgba(255,250,245,0.92)_0%,rgba(255,246,246,0.9)_54%,rgba(255,255,255,0.94)_100%), url(${headerBgImageSrc})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }
    : undefined;

  return (
    <div className="bg-[linear-gradient(180deg,#fffaf5_0%,#fff_28%,#f8fbff_100%)] text-slate-950">
      <header
        className="relative overflow-hidden border-b border-rose-100/80 bg-[linear-gradient(180deg,#fffaf5_0%,#fff6f6_54%,#fff_100%)]"
        style={headerStyle}
      >
        {headerPoeticImageSrc ? (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 right-0 hidden w-[56%] opacity-28 lg:block"
            style={{
              backgroundImage: `url(${headerPoeticImageSrc})`,
              backgroundPosition: "right center",
              backgroundRepeat: "no-repeat",
              backgroundSize: "cover",
              mixBlendMode: "soft-light",
              WebkitMaskImage: "linear-gradient(to left, transparent 0%, rgba(0,0,0,0.7) 24%, rgba(0,0,0,1) 52%)",
              maskImage: "linear-gradient(to left, transparent 0%, rgba(0,0,0,0.7) 24%, rgba(0,0,0,1) 52%)",
            }}
          />
        ) : null}
        <div className="container mx-auto px-4 pb-10 pt-5 lg:px-6 lg:pb-12">
          <div className="grid items-center gap-6 pt-3 lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.9fr)]">
            <div className="max-w-4xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-rose-200 bg-[linear-gradient(135deg,#fff_0%,#fff5f5_100%)] px-4 py-2 text-xs font-bold tracking-[0.18em] text-rose-700 shadow-[0_10px_30px_rgba(244,63,94,0.16)]">
              <span aria-hidden="true">🇹🇷</span>
              {eyebrow}
            </div>

            <h1 className="mt-6 text-4xl font-black leading-tight tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
              {title}
            </h1>
            <p className="mt-5 max-w-3xl whitespace-pre-line text-sm leading-8 text-slate-700 sm:text-base">
              {description}
            </p>

            {(primaryCta || secondaryCta) && (
              <div className="mt-8 flex flex-wrap gap-3">
                {primaryCta ? (
                  <Button
                    asChild
                    size="lg"
                    className="rounded-full bg-rose-500 px-6 text-sm font-semibold text-white shadow-[0_18px_45px_rgba(244,63,94,0.32)] hover:bg-rose-600"
                  >
                    {isExternal(primaryCta.to) ? (
                      <a href={primaryCta.to} target="_blank" rel="noopener noreferrer">
                        {primaryCta.label}
                      </a>
                    ) : (
                      <Link to={primaryCta.to}>{primaryCta.label}</Link>
                    )}
                  </Button>
                ) : null}
                {secondaryCta ? (
                  <Button
                    asChild
                    size="lg"
                    variant="outline"
                    className="rounded-full border-white/25 bg-white/10 px-6 text-sm font-semibold text-white backdrop-blur hover:bg-white/20 hover:text-white"
                  >
                    {isExternal(secondaryCta.to) ? (
                      <a href={secondaryCta.to} target="_blank" rel="noopener noreferrer">
                        {secondaryCta.label}
                      </a>
                    ) : (
                      <Link to={secondaryCta.to}>{secondaryCta.label}</Link>
                    )}
                  </Button>
                ) : null}
              </div>
            )}
            </div>
            {heroImageSrc ? (
              <div className="hidden lg:flex lg:justify-end">
                <img
                  src={heroImageSrc}
                  alt={heroImageAlt}
                  className="h-auto w-full max-w-[680px] object-contain"
                />
              </div>
            ) : null}
          </div>
        </div>
      </header>

      {children}
    </div>
  );
}
