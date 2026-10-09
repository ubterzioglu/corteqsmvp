// Yatırımcı sayfası yolu — tek kaynak. App.tsx (rota + yüzen bileşen istisnası)
// ve sözleşme testi buradan okur. Sitemap'e ve robots.txt'e EKLENMEZ.
export const INVESTOR_PATH = "/information";

/**
 * Bize ait olmayan ekosistem adresleri için kendi kısa yollarımız:
 * `/information/<slug>` → dış adres. Yalnız bu SABİT tablo yönlendirilir;
 * kullanıcıdan gelen adrese yönlendirme YOKTUR (açık yönlendirme açığı olmasın).
 */
export const INFORMATION_REDIRECTS: Readonly<Record<string, string>> = {
  "venture-studio": "https://www.qualtronsinclair.com/qs-networks",
  product: "https://global-diaspora-connect.lovable.app",
};

export const informationRedirectPath = (slug: keyof typeof INFORMATION_REDIRECTS | string): string =>
  `${INVESTOR_PATH}/${slug}`;

/**
 * Sitenin yüzen bileşenleri (asistan balonu, yukarı çık) bu yollarda çizilmez:
 * sayfanın kendisi + tablodaki yönlendirme yolları. Tanımsız alt yol yatırımcı
 * sayfasına geri yönlenir (InformationRedirect).
 */
export const isInvestorPath = (pathname: string): boolean => {
  const path = pathname.replace(/\/+$/, "");
  if (path === INVESTOR_PATH) return true;
  const slug = path.startsWith(`${INVESTOR_PATH}/`) ? path.slice(INVESTOR_PATH.length + 1) : "";
  return Object.prototype.hasOwnProperty.call(INFORMATION_REDIRECTS, slug);
};
