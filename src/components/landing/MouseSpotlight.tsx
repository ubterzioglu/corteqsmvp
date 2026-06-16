/**
 * İmleç takip eden yumuşak radyal parlama — yalnız masaüstü.
 * Mobilde veya `prefers-reduced-motion` açıkken hiç render edilmez.
 *
 * Tamamen dekoratif: pointer-events yok, aria-hidden, sabit (fixed) z-0.
 * Yumuşak takip için framer-motion spring kullanır; throttle yerine rAF benzeri
 * spring damping ile tek bir pointermove dinleyicisi yeterli.
 */

import { useEffect } from "react";
import { motion, useMotionValue, useReducedMotion, useSpring } from "framer-motion";
import { useIsMobile } from "@/hooks/use-mobile";

const SPOTLIGHT_SIZE = 520;

const MouseSpotlight = () => {
  const isMobile = useIsMobile();
  const reduceMotion = useReducedMotion();

  const x = useMotionValue(-9999);
  const y = useMotionValue(-9999);
  const springX = useSpring(x, { stiffness: 120, damping: 30, mass: 0.6 });
  const springY = useSpring(y, { stiffness: 120, damping: 30, mass: 0.6 });

  const enabled = !isMobile && !reduceMotion;

  useEffect(() => {
    if (!enabled) return;

    const handleMove = (event: PointerEvent) => {
      x.set(event.clientX - SPOTLIGHT_SIZE / 2);
      y.set(event.clientY - SPOTLIGHT_SIZE / 2);
    };

    window.addEventListener("pointermove", handleMove, { passive: true });
    return () => window.removeEventListener("pointermove", handleMove);
  }, [enabled, x, y]);

  if (!enabled) return null;

  return (
    <motion.div
      className="corteqs-spotlight pointer-events-none fixed z-0 rounded-full"
      aria-hidden="true"
      style={{
        width: SPOTLIGHT_SIZE,
        height: SPOTLIGHT_SIZE,
        x: springX,
        y: springY,
      }}
    />
  );
};

export default MouseSpotlight;
