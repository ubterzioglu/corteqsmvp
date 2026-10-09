import { useEffect } from "react";

const FONT_LINK_ID = "inv-plex-fonts";
const FONT_HREF =
  "https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@400;500;600;700&display=swap";

/** Plex yazı ailesini yalnız yatırımcı sayfaları açıkken yükler (CSP: fonts.googleapis.com izinli). */
export function useInvestorFonts(): void {
  useEffect(() => {
    if (document.getElementById(FONT_LINK_ID)) return;
    const link = document.createElement("link");
    link.id = FONT_LINK_ID;
    link.rel = "stylesheet";
    link.href = FONT_HREF;
    document.head.appendChild(link);
    // Sayfadan çıkınca kaldır: site geneline üçüncü taraf isteği taşımasın.
    return () => link.remove();
  }, []);
}
