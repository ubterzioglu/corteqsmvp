// Ana sayfa animasyonları için framer-motion'sız yardımcılar.
//
// Lighthouse 2026-10-13: `/` yalnız Reveal ve CountUp için framer-motion'ı (44 KB gzip,
// %76'sı kullanılmıyor) ana sayfa parçasının kritik zincirine sokuyordu. Bu iki
// sarmalayıcı yalnız "görünüme girince bir kez" + "reduced-motion" bilgisine ihtiyaç
// duyar; ikisi de tarayıcı API'siyle karşılanır.

import { useEffect, useState, type RefObject } from "react";

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

function readPrefersReducedMotion(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return false;
  return window.matchMedia(REDUCED_MOTION_QUERY).matches;
}

/** `prefers-reduced-motion: reduce` — ilk render'da EŞZAMANLI okunur (animasyon parlaması olmasın). */
export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(readPrefersReducedMotion);

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return;
    const query = window.matchMedia(REDUCED_MOTION_QUERY);
    const onChange = () => setReduced(query.matches);
    query.addEventListener?.("change", onChange);
    return () => query.removeEventListener?.("change", onChange);
  }, []);

  return reduced;
}

interface InViewOnceOptions {
  /** Görünür sayılmak için gereken oran (0–1). */
  threshold: number;
  rootMargin?: string;
  /** false iken gözlem yapılmaz (ör. animasyon zaten kapalıyken). */
  enabled?: boolean;
}

/**
 * Öğe görünüme ilk kez girdiğinde true olur ve öyle kalır.
 * IntersectionObserver yoksa (çok eski tarayıcı) içerik gizli kalmasın diye hemen true döner.
 */
export function useInViewOnce(
  ref: RefObject<Element | null>,
  { threshold, rootMargin = "0px", enabled = true }: InViewOnceOptions,
): boolean {
  const [inView, setInView] = useState(false);

  useEffect(() => {
    if (!enabled || inView) return;
    const element = ref.current;
    if (!element) return;
    if (typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold, rootMargin },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [ref, threshold, rootMargin, enabled, inView]);

  return inView;
}

/** framer'daki `[0.22, 1, 0.36, 1]` eğrisine çok yakın, hızlı başlayıp yumuşak biten easing. */
export function easeOutQuint(t: number): number {
  const clamped = Math.min(1, Math.max(0, t));
  return 1 - Math.pow(1 - clamped, 5);
}
