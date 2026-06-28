import { useSyncExternalStore } from "react";

/**
 * Demo bayrakları (demo flags).
 *
 * Bazı paneller (Hizmet Talepleri, İşlemlerim, Kuponlar) kullanıcının henüz
 * gerçek verisi yokken örnek/demo içerik gösterir. Kullanıcı ilk GERÇEK kaydı
 * oluşturduğunda ilgili bayrak set edilir ve demo görünüm kalıcı olarak kapanır.
 *
 * Bayraklar `localStorage`'da saklanır (cihaz bazında kalıcı) ve `useDemoFlag`
 * üzerinden reaktif tüketilir: bir `markReal*` çağrısı, o anda ekranda olan
 * bileşenleri anında günceller (custom event ile).
 */

export type DemoFlagKey = "serviceRequests" | "transactions" | "coupons";

const STORAGE_PREFIX = "corteqs.demoFlag.";
const EVENT_NAME = "corteqs:demoFlag";

const storageKey = (key: DemoFlagKey): string => `${STORAGE_PREFIX}${key}`;

function readFlag(key: DemoFlagKey): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(storageKey(key)) === "1";
  } catch {
    // localStorage erişilemiyorsa (gizli mod / kısıtlı) demo göster.
    return false;
  }
}

function setFlag(key: DemoFlagKey): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(storageKey(key), "1");
  } catch {
    // Yazılamazsa sessizce geç — en kötü ihtimalle demo görünüm kalır.
  }
  // Aynı sekmedeki dinleyicileri uyandır (storage event sadece diğer sekmelerde tetiklenir).
  window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: key }));
}

/** İlk gerçek hizmet talebi oluşturulduğunda çağrılır. */
export function markRealServiceRequest(): void {
  setFlag("serviceRequests");
}

/** İlk gerçek Stripe işlemi gerçekleştiğinde çağrılır. */
export function markRealTransaction(): void {
  setFlag("transactions");
}

/** İlk gerçek kupon satın alımı yapıldığında çağrılır. */
export function markRealCouponPurchase(): void {
  setFlag("coupons");
}

/**
 * Bir demo bayrağını reaktif olarak okur.
 * @returns `true` ise kullanıcının gerçek verisi var (demo görünümü gizle).
 */
export function useDemoFlag(key: DemoFlagKey): boolean {
  return useSyncExternalStore(
    (onStoreChange) => {
      if (typeof window === "undefined") return () => {};
      const handler = (e: Event) => {
        // Sadece ilgili bayrak değiştiğinde (veya cross-tab storage event) güncelle.
        if (e instanceof CustomEvent && e.detail !== key) return;
        onStoreChange();
      };
      window.addEventListener(EVENT_NAME, handler);
      window.addEventListener("storage", handler);
      return () => {
        window.removeEventListener(EVENT_NAME, handler);
        window.removeEventListener("storage", handler);
      };
    },
    () => readFlag(key),
    () => false, // SSR / sunucu anlık görüntüsü: demo göster.
  );
}
