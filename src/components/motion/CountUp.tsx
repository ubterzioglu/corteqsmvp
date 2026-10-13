import { useEffect, useRef, useState } from "react";

import { isPrerenderEnvironment } from "@/lib/prerender-agent";
import { easeOutQuint, useInViewOnce, usePrefersReducedMotion } from "./motion-hooks";

interface CountUpProps {
  /** Hedef sayı. */
  to: number;
  /** Animasyon süresi (saniye). */
  duration?: number;
  /** Sayıyı yerele göre biçimlendir (varsayılan tr-TR binlik ayraç). */
  locale?: string;
  className?: string;
}

/**
 * 0'dan hedefe sayan animasyonlu sayaç. Viewport'a girince bir kez tetiklenir.
 * `prefers-reduced-motion` açıkken ve prerender'da doğrudan son değeri gösterir —
 * headless tarayıcı kaydırmadığı için bot aksi hâlde "0" görür.
 *
 * framer-motion KULLANMAZ (Lighthouse 2026-10-13): IntersectionObserver + requestAnimationFrame.
 */
const CountUp = ({ to, duration = 1.4, locale = "tr-TR", className }: CountUpProps) => {
  const ref = useRef<HTMLSpanElement>(null);
  const reduceMotion = usePrefersReducedMotion();
  const animate = !reduceMotion && !isPrerenderEnvironment();
  const inView = useInViewOnce(ref, { threshold: 0.6, enabled: animate });
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!animate || !inView) return;
    let frame = 0;
    const start = performance.now();
    const totalMs = Math.max(0, duration * 1000);

    const tick = (now: number) => {
      const progress = totalMs === 0 ? 1 : (now - start) / totalMs;
      setValue(to * easeOutQuint(progress));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [animate, inView, to, duration]);

  if (!animate) {
    return <span className={className}>{to.toLocaleString(locale)}</span>;
  }

  return (
    <span ref={ref} className={className}>
      {Math.round(value).toLocaleString(locale)}
    </span>
  );
};

export default CountUp;
