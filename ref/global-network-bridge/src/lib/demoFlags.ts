// Lightweight flags that hide demo data once real activity exists.
// Trigger by calling markRealCouponPurchase() / markRealTransaction()
// from the relevant flow (e.g. after a successful Stripe checkout).
const COUPON_KEY = "corteqs:hasRealCoupons";
const TXN_KEY = "corteqs:hasRealTransactions";
const REQ_KEY = "corteqs:hasRealServiceRequests";

const read = (k: string) => {
  try { return localStorage.getItem(k) === "1"; } catch { return false; }
};
const write = (k: string, v: boolean) => {
  try {
    if (v) localStorage.setItem(k, "1");
    else localStorage.removeItem(k);
    window.dispatchEvent(new CustomEvent("corteqs:demo-flags-change"));
  } catch {}
};

export const hasRealCoupons = () => read(COUPON_KEY);
export const hasRealTransactions = () => read(TXN_KEY);
export const hasRealServiceRequests = () => read(REQ_KEY);

export const markRealCouponPurchase = () => write(COUPON_KEY, true);
export const markRealTransaction = () => write(TXN_KEY, true);
export const markRealServiceRequest = () => write(REQ_KEY, true);

export const resetDemoFlags = () => {
  write(COUPON_KEY, false);
  write(TXN_KEY, false);
  write(REQ_KEY, false);
};

import { useEffect, useState } from "react";

export function useDemoFlag(kind: "coupons" | "transactions" | "serviceRequests") {
  const getter = kind === "coupons" ? hasRealCoupons : kind === "transactions" ? hasRealTransactions : hasRealServiceRequests;
  const [hasReal, setHasReal] = useState<boolean>(() =>
    typeof window !== "undefined" ? getter() : false
  );
  useEffect(() => {
    const sync = () => setHasReal(getter());
    window.addEventListener("storage", sync);
    window.addEventListener("corteqs:demo-flags-change", sync as EventListener);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("corteqs:demo-flags-change", sync as EventListener);
    };
  }, [getter]);
  return hasReal;
}
