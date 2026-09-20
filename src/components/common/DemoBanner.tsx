/**
 * Demo sayfa bandı — açık beta bandının HEMEN ALTINDA durur.
 *
 * Desenin öbür yarısı `DemoBadge`. Kural ve gerekçe: `src/lib/demo-pages.ts`
 * dosya başı ile `docs/guides/demo-icerik-deseni.md`.
 *
 * ⚠️ Bu bant KAPATILAMAZ. Beta bandı kapatılabilir çünkü tüm siteye dair genel
 * bir duyurudur; bu bant ise BU SAYFADAKİ içeriğin gerçek olmadığını söyler —
 * kapatılabilseydi ziyaretçi örnek ödülleri gerçek sanabilirdi.
 *
 * Rengi beta bandından BİLEREK farklı (kehribar değil arduvaz): iki bant üst
 * üste geldiğinde tek bir blok gibi görünmemeli.
 */

import { AlertTriangle } from "lucide-react";

import { DEMO_COPY, type DemoRoute } from "@/lib/demo-pages";

interface DemoBannerProps {
  route: DemoRoute;
}

export function DemoBanner({ route }: DemoBannerProps) {
  return (
    <div
      role="status"
      className="border-b border-slate-700/40 bg-gradient-to-r from-slate-800 via-slate-900 to-slate-800 px-4 py-1.5 sm:py-2"
    >
      <p className="mx-auto flex max-w-5xl flex-wrap items-center justify-center gap-x-2.5 gap-y-1 text-center text-[0.74rem] leading-snug text-slate-200 sm:text-[0.82rem]">
        <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-amber-400/50 bg-amber-400/15 px-2.5 py-0.5 text-[0.6rem] font-bold uppercase tracking-[0.18em] text-amber-300">
          <AlertTriangle aria-hidden="true" className="h-3 w-3" />
          {DEMO_COPY.badge}
        </span>
        <span>
          <span className="font-semibold text-white">
            {DEMO_COPY.bannerPrefix} {route.label}.
          </span>{" "}
          <span className="hidden sm:inline">{route.note || DEMO_COPY.bannerFallbackNote}</span>
        </span>
      </p>
    </div>
  );
}

export default DemoBanner;
