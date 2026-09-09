// Scroll'da header'ı daraltan öznitelik anahtarı (Y2, m153).
//
// TASARIM KARARI — neden React state DEĞİL, neden `scrollY`:
//
// 1. **Yazım `document.documentElement.dataset`'e gider, React state'e DEĞİL.**
//    SiteHeader 61 public rotanın paylaştığı bileşen. Ona state/prop/koşul eklemek
//    her scroll tikinde tüm public ağacı yeniden render ettirirdi. Öznitelik yazımı
//    React'i hiç uyandırmaz; küçülmeyi CSS yapar (bkz. index.css `[data-header-compact]`).
//    Bu yüzden SiteHeader.tsx'te SIFIR mantık var, yalnız 4 sınıf adı.
//
// 2. **`scrollY` eşiği kullanılıyor, IntersectionObserver sentinel DEĞİL.**
//    Sentinel'i normal akışa koymak BU DURUMDA ÇALIŞMAZ: header küçülünce altındaki
//    içerik delta kadar YUKARI kayar, sentinel de onunla kayar, eşik geri döner,
//    header tekrar büyür, içerik aşağı iner… yani salınım. `scrollY` header
//    yüksekliğinden BAĞIMSIZ olduğu için bu tuzağı hiç yaşamaz.
//
// 3. **Histerezis ZORUNLU.** Tek eşik kullanılsaydı, eşiğin tam üstünde duran
//    kullanıcıda küçülme/büyüme titremesi olurdu (küçülme sayfayı kısaltır, scrollY
//    eşiğin altına düşebilir). Açma ve kapama eşikleri ayrı: 120 / 64.
//
// Hook'u ÇAĞIRAN sayfa küçülmeyi almış olur; çağırmayan sayfa hiç etkilenmez.
// Bugün yalnız /cadde çağırıyor (kritiğin şikâyeti oradaydı).

import { useEffect } from "react";

/** Bu değerin ÜSTÜNDE header daralır. */
export const HEADER_COMPACT_ON_SCROLL_Y = 120;
/** Bu değerin ALTINDA header eski haline döner. Aradaki bant titremeyi keser. */
export const HEADER_COMPACT_OFF_SCROLL_Y = 64;

const DATASET_KEY = "headerCompact";

export function useCompactHeaderOnScroll(): void {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const root = document.documentElement;
    let frame: number | null = null;
    // rAF başına tek okuma: scroll olayı saniyede onlarca kez gelir, layout okuması
    // (scrollY) her seferinde yapılırsa gereksiz reflow baskısı doğar.
    let ticking = false;

    const apply = () => {
      ticking = false;
      const y = window.scrollY;
      const current = root.dataset[DATASET_KEY];

      if (y > HEADER_COMPACT_ON_SCROLL_Y) {
        if (current !== "on") root.dataset[DATASET_KEY] = "on";
        return;
      }
      if (y < HEADER_COMPACT_OFF_SCROLL_Y) {
        if (current !== "idle") root.dataset[DATASET_KEY] = "idle";
        return;
      }
      // Histerezis bandı: hiçbir şey değişmez.
    };

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      frame = window.requestAnimationFrame(apply);
    };

    // Mount'ta mevcut konuma göre bir kez yaz — sayfaya kaydırılmış halde girilirse
    // (geri tuşu, derin bağlantı) header yanlış boyda başlamasın.
    apply();
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame !== null) window.cancelAnimationFrame(frame);
      // Özniteliği BIRAKMA: hook'u çağırmayan bir sayfaya geçilince küçülme
      // takılı kalırdı.
      delete root.dataset[DATASET_KEY];
    };
  }, []);
}
