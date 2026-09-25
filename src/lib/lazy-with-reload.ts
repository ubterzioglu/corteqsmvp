/**
 * `React.lazy` sarmalayıcısı — eski JS paketi (stale chunk) kurtarma akışıyla uyumlu.
 *
 * Sorun: deploy sonrası eski sekmede bir lazy chunk'ı yüklemek başarısız olur. Vite
 * `vite:preloadError` olayını atar; `recoveryReload.ts` sayfayı yenilemeye başlarsa
 * `preventDefault()` çağırır ve Vite dinamik import'u **`undefined` ile çözer**.
 * Çıplak `lazy()` bu durumda `undefined.default` okur ve sayfa yenilenmeden hemen önce
 * "Cannot read properties of undefined (reading 'default')" ile çöker — bu hata
 * `client_error_reports`'a da düşer.
 *
 * Kural:
 * - Yenileme GERÇEKTEN sürüyorsa (import `undefined` döndü veya reddedildi) asla
 *   çözülmeyen bir promise döndür → Suspense fallback'i yenilemeye kadar görünür kalır.
 * - Reddedilen import bir chunk hatasıysa ve yenileme henüz başlamadıysa yenilemeyi
 *   dene; başlatılabildiyse yine bekle.
 * - Yenileme engellendiyse (cooldown) hata NORMAL akar ve en yakın hata sınırına ulaşır.
 *
 * Tüm rota ve dinamik lazy import'lar bu yardımcıyı kullanmalıdır. İsimli export için:
 * `lazyWithReload(() => import("./X").then((m) => ({ default: m.X })))`.
 */
import { lazy, type ComponentType, type LazyExoticComponent } from "react";

import {
  isRecoveryReloadInProgress,
  looksLikeChunkLoadError,
  recoverFromWhiteScreen,
} from "@/lib/recoveryReload";

export type LazyModule<T> = { default: T };
export type LazyFactory<T> = () => Promise<LazyModule<T>>;

/** Asla çözülmeyen promise — sayfa yenilenene kadar Suspense'i askıda tutar. */
const pendingForever = <T>(): Promise<T> => new Promise<T>(() => undefined);

const hasDefaultExport = <T>(mod: unknown): mod is LazyModule<T> =>
  typeof mod === "object" && mod !== null && "default" in mod && (mod as LazyModule<T>).default != null;

/**
 * Bir lazy factory'yi yenileme-farkında hâle getirir. `React.lazy` dışında (ör. elle
 * çağrılan loader'lar) da kullanılabilir.
 */
export function withReloadGuard<T>(factory: LazyFactory<T>): LazyFactory<T> {
  return () =>
    factory().then(
      (mod) => {
        if (hasDefaultExport<T>(mod)) return mod;
        if (isRecoveryReloadInProgress()) return pendingForever<LazyModule<T>>();
        throw new Error("Lazy module resolved without a default export");
      },
      (error: unknown) => {
        if (isRecoveryReloadInProgress()) return pendingForever<LazyModule<T>>();
        if (looksLikeChunkLoadError(error) && recoverFromWhiteScreen()) {
          return pendingForever<LazyModule<T>>();
        }
        throw error;
      },
    );
}

// React.lazy'nin kendi imzası ComponentType<any> ister; props tipi çağırana aittir.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function lazyWithReload<T extends ComponentType<any>>(
  factory: LazyFactory<T>,
): LazyExoticComponent<T> {
  return lazy(withReloadGuard(factory));
}
