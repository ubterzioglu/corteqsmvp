import "@testing-library/jest-dom";
import { configure } from "@testing-library/react";

/**
 * `waitFor` / `findBy*` varsayılan bekleme süresi 1 SANİYEDİR ve tam koşudaki
 * flake'lerin GERÇEK darboğazı buydu (2026-09-28 ölçümü).
 *
 * ⚠️ Yanlış teşhis edilmesi kolay: `vitest.config.ts`'teki `testTimeout` 15 sn'dir,
 * yani "zaman aşımı zaten bol" görünür. Ama düşen testler o duvara değil, Testing
 * Library'nin 1 sn'lik ASENKRON İDDİA duvarına tosluyordu. Beş ayrı dosyada aynı
 * desen görüldü (commercial, CaddePage, CaddeComposer): izole koşuda saniyeler
 * içinde geçen dosya, tam koşuda tek testte kırmızı.
 *
 * Neden 1 sn yetmiyor: bu testlerin çoğu `<App />` render ediyor ve App 61 `lazy()`
 * import taşıyor. Yük altında bir Suspense parçasının çözülmesi 1 sn'yi rahatça
 * aşar — test yavaş değildir, İDDİA erken pes eder.
 *
 * ⚠️ Bu bir "bekleyip geçsin" gevşetmesi DEĞİLDİR: gerçekten bozuk bir test yine
 * düşer, yalnız 5 sn sonra. Zaman aşımını büyütmek yerine burayı ayarlamak doğru
 * olan, çünkü kusur iddia katmanındaydı.
 */
configure({ asyncUtilTimeout: 5_000 });

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
  }),
});

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

Object.defineProperty(window, "ResizeObserver", {
  writable: true,
  value: ResizeObserverMock,
});

Object.defineProperty(globalThis, "ResizeObserver", {
  writable: true,
  value: ResizeObserverMock,
});

// jsdom IntersectionObserver implement etmez; framer-motion'ın whileInView /
// useInView özelliği (scroll-reveal animasyonları) bunu kullanır.
class IntersectionObserverMock {
  readonly root = null;
  readonly rootMargin = "";
  readonly thresholds: ReadonlyArray<number> = [];
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }
}

Object.defineProperty(window, "IntersectionObserver", {
  writable: true,
  value: IntersectionObserverMock,
});

Object.defineProperty(globalThis, "IntersectionObserver", {
  writable: true,
  value: IntersectionObserverMock,
});

// jsdom scrollIntoView implement etmez; cmdk (command palette) seçili
// item'ı görünür kılmak için çağırır.
if (!Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = () => {};
}

// jsdom pencere kaydırmasını da uygulamaz. Route değişimlerinde ScrollToTop
// bunu çağırdığı için test ortamında sessiz ve deterministik bir no-op kullan.
Object.defineProperty(window, "scrollTo", {
  configurable: true,
  writable: true,
  value: () => {},
});

/**
 * Supabase Realtime (m89/m90) bağlandığında GERÇEK bir WebSocket açar. Test
 * ortamında bu iki ayrı soruna yol açıyordu:
 *
 *  1. Node'un yerleşik WebSocket'i (undici) ile jsdom'un `Event` sınıfı farklı
 *     gerçeklemelerdir; bağlantı kurulduğunda undici olayı Node'un hedefine
 *     yollar ve şu kafa karıştırıcı hata düşer:
 *     "The 'event' argument must be an instance of Event. Received an instance of Event".
 *     Bu hata bir TESTİN İÇİNDE değil, arka planda oluştuğu için testler yeşil
 *     görünür ama koşu "unhandled error" ile biter ve CI kırmızı olur —
 *     27 Eylül'de tam olarak bu yaşandı.
 *  2. Test ortamı dışarıya ağ bağlantısı açmamalıdır; deterministik değildir.
 *
 * Bu sahte sınıf bağlantıyı hiç kurmaz, olay da yollamaz. Realtime davranışını
 * DOĞRULAYAN testler hook'u kendileri mock'lamalıdır (useCaddeFeedRealtime.test.ts
 * ve useCaddeCommentsRealtime.test.ts böyle yapar) — burada yalnız gerçek soket
 * susturulur.
 */
class WebSocketMock {
  static readonly CONNECTING = 0;
  static readonly OPEN = 1;
  static readonly CLOSING = 2;
  static readonly CLOSED = 3;

  readonly url: string;
  readyState = WebSocketMock.CLOSED;
  onopen: (() => void) | null = null;
  onclose: (() => void) | null = null;
  onerror: (() => void) | null = null;
  onmessage: (() => void) | null = null;

  constructor(url: string) {
    this.url = url;
  }

  send() {}
  close() {}
  addEventListener() {}
  removeEventListener() {}
  dispatchEvent() {
    return false;
  }
}

Object.defineProperty(globalThis, "WebSocket", {
  configurable: true,
  writable: true,
  value: WebSocketMock,
});
