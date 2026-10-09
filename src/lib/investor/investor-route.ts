// Yatırımcı sayfası yolu — tek kaynak. App.tsx (rota + yüzen bileşen istisnası)
// ve sözleşme testi buradan okur. Sitemap'e ve robots.txt'e EKLENMEZ.
export const INVESTOR_PATH = "/yatirimci";

/**
 * Sitenin yüzen bileşenleri (asistan balonu, yukarı çık) bu yolda çizilmez.
 * Tam eşleşme: rota alt yol kabul etmez; `/yatirimci/x` NotFound'dur, site bileşenleri durur.
 */
export const isInvestorPath = (pathname: string): boolean => pathname.replace(/\/+$/, "") === INVESTOR_PATH;
