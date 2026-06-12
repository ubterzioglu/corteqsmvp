import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * Route (pathname) değiştiğinde sayfayı en üste kaydırır.
 * Hash'li navigasyonlarda (#bolum) tarayıcının/sayfanın kendi
 * anchor davranışını bozmamak için dokunmaz.
 */
const ScrollToTop = () => {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) return;
    window.scrollTo({ top: 0, left: 0, behavior: "instant" as ScrollBehavior });
  }, [pathname, hash]);

  return null;
};

export default ScrollToTop;
