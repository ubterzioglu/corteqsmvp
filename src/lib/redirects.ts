// Legacy URL yönlendirmeleri — TEK KAYNAK.
//
// NEDEN VAR: bu liste 2026-08-04'e kadar üç ayrı yerde, üçü de farklı içerikle duruyordu:
//   1. App.tsx        → <Navigate> route'ları (client-side, 200 döner)
//   2. server.mjs     → legacyRedirectMap (yalnız 4 madde) — PROD'DA ÖLÜ, çünkü prod
//                       runtime nginx'tir, server.mjs değil (bkz. Dockerfile)
//   3. nginx          → hiç yoktu
// Sonuç: canlıda /hakkimizda 301 yerine 200 + SPA kabuğu dönüyordu; arama motorları
// için bu "iki ayrı sayfa aynı içerik" demek, yönlendirme sinyali hiç ulaşmıyordu.
//
// DEĞİŞMEZ SÖZLEŞME: buraya bir madde eklerken nginx.conf.template'e de karşılık gelen
// `return 301` satırını ekle. src/lib/redirects.test.ts ikisinin ayrışmasını yakalar ve
// build'i kırar — testi atlatmak için değil, ikinci yeri güncellemek için tasarlandı.
//
// KATMAN AYRIMI: nginx 301'i prod'da ilk sırada devreye girer (gerçek HTTP yönlendirme,
// SEO sinyali burada). App.tsx'teki client-side <Navigate> savunma katmanıdır —
// nginx'in devrede olmadığı yollarda (npm run dev, nixpacks/server.mjs, doğrudan
// client-side gezinme) kullanıcıyı yine doğru sayfaya taşır. İkisi de kalmalı.

export type LegacyRedirect = {
  /** Eski yol — tam eşleşme (React Router path'i ve nginx `location =` karşılığı). */
  from: string;
  /** Yeni yol. */
  to: string;
};

/**
 * Statik (parametresiz) legacy yönlendirmeler.
 *
 * Davranış farkı — bilinçli: nginx tarafı `$is_args$args` ile query string'i korur,
 * client-side `<Navigate>` korumaz. Prod'da nginx önce çalıştığı için kullanıcıya
 * görünen davranış query'nin korunmasıdır.
 */
export const LEGACY_REDIRECTS: readonly LegacyRedirect[] = [
  { from: "/hakkimizda", to: "/founders" },
  { from: "/blog", to: "/radar/rehberler" },
  { from: "/campaign/founding-1000", to: "/founding-1000" },
  { from: "/190519", to: "/190519memory" },
  { from: "/aiform", to: "/login" },
  { from: "/form", to: "/login" },
  { from: "/privacy-policy", to: "/legal/privacy" },
  { from: "/addwa", to: "/addcom" },
  { from: "/whatsapp-groups", to: "/addcom" },
  { from: "/contributor", to: "/commercial/contributor" },
  { from: "/influencer-partner", to: "/commercial/influencer-partner" },
  { from: "/strategic-partner", to: "/commercial/strategic-partner" },
  { from: "/community-leader", to: "/commercial/community-leader" },
  { from: "/ambassador", to: "/commercial/ambassador" },
] as const;

/**
 * Parametre/query taşıdığı için tabloya sığmayan yönlendirmeler.
 *
 * App.tsx'te kendi bileşenleri vardır (`AuthRouteRedirect`,
 * `WhatsAppGroupDetailRedirect`); nginx tarafında regex `location` ile karşılanır.
 * Anti-drift testi bunların nginx karşılığını da arar — listeden çıkarma.
 */
export const DYNAMIC_LEGACY_REDIRECTS: readonly string[] = [
  "/auth",
  "/whatsapp-groups/:id",
] as const;
