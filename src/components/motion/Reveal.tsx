import { useRef, type CSSProperties, type ReactNode } from "react";

import { isPrerenderEnvironment } from "@/lib/prerender-agent";
import { useInViewOnce, usePrefersReducedMotion } from "./motion-hooks";

type RevealDirection = "up" | "left" | "right" | "none";

interface RevealProps {
  children: ReactNode;
  /** Giriş gecikmesi (saniye) — stagger için sıralı değerler verilebilir. */
  delay?: number;
  /** Giriş yönü. "none" sadece fade yapar. */
  direction?: RevealDirection;
  className?: string;
  /** İçerik wrapper'ı blok yerine inline-akış gerektiriyorsa override edilir. */
  as?: "div" | "section" | "li" | "article";
}

const OFFSET = 28;
const EASING = "cubic-bezier(0.22, 1, 0.36, 1)";

const offsetFor = (direction: RevealDirection): { x: number; y: number } => {
  switch (direction) {
    case "left":
      return { x: -OFFSET, y: 0 };
    case "right":
      return { x: OFFSET, y: 0 };
    case "none":
      return { x: 0, y: 0 };
    case "up":
    default:
      return { x: 0, y: OFFSET };
  }
};

/**
 * Scroll-reveal sarmalı. İçerik viewport'a girince bir kez fade + translate ile gelir.
 * `prefers-reduced-motion` açıkken hiç animasyon yapmaz — içerik anında görünür.
 * Prerender'da da animasyon YOKTUR: headless tarayıcı kaydırmaz ve içerik bota
 * `opacity: 0` ile gider (bkz. src/lib/prerender-agent.ts).
 *
 * framer-motion KULLANMAZ (Lighthouse 2026-10-13): IntersectionObserver + CSS transition.
 */
const Reveal = ({ children, delay = 0, direction = "up", className, as = "div" }: RevealProps) => {
  const Tag = as;
  const ref = useRef<HTMLElement>(null);
  const reduceMotion = usePrefersReducedMotion();
  const animate = !reduceMotion && !isPrerenderEnvironment();
  const visible = useInViewOnce(ref, { threshold: 0.2, rootMargin: "0px 0px -10% 0px", enabled: animate });

  if (!animate) {
    return <Tag className={className}>{children}</Tag>;
  }

  const { x, y } = offsetFor(direction);
  const style: CSSProperties = {
    opacity: visible ? 1 : 0,
    transform: visible ? "none" : `translate3d(${x}px, ${y}px, 0)`,
    transition: `opacity 0.6s ${EASING} ${delay}s, transform 0.6s ${EASING} ${delay}s`,
  };

  return (
    // `as` dört etiketin birleşimi olduğu için ref tipi daraltılamaz; hepsi HTMLElement'tir.
    <Tag ref={ref as never} className={className} style={style} data-reveal={visible ? "in" : "pending"}>
      {children}
    </Tag>
  );
};

export default Reveal;
