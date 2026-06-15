import { type ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";

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
 */
const Reveal = ({ children, delay = 0, direction = "up", className, as = "div" }: RevealProps) => {
  const reduceMotion = useReducedMotion();
  const MotionTag = motion[as];

  if (reduceMotion) {
    const Tag = as;
    return <Tag className={className}>{children}</Tag>;
  }

  const { x, y } = offsetFor(direction);

  return (
    <MotionTag
      className={className}
      initial={{ opacity: 0, x, y }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once: true, amount: 0.2, margin: "0px 0px -10% 0px" }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </MotionTag>
  );
};

export default Reveal;
