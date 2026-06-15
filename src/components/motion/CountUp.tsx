import { useEffect, useRef } from "react";
import {
  animate,
  useInView,
  useMotionValue,
  useReducedMotion,
  useTransform,
  motion,
} from "framer-motion";

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
 * `prefers-reduced-motion` açıkken doğrudan son değeri (animasyonsuz) gösterir.
 */
const CountUp = ({ to, duration = 1.4, locale = "tr-TR", className }: CountUpProps) => {
  const reduceMotion = useReducedMotion();
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.6 });
  const count = useMotionValue(0);
  const rounded = useTransform(count, (value) => Math.round(value).toLocaleString(locale));

  useEffect(() => {
    if (reduceMotion || !inView) return;
    const controls = animate(count, to, { duration, ease: [0.22, 1, 0.36, 1] });
    return () => controls.stop();
  }, [count, to, duration, inView, reduceMotion]);

  if (reduceMotion) {
    return <span className={className}>{to.toLocaleString(locale)}</span>;
  }

  return <motion.span ref={ref} className={className}>{rounded}</motion.span>;
};

export default CountUp;
