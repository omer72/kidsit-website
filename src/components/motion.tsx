"use client";

import {
  LazyMotion,
  domAnimation,
  m,
  useReducedMotion,
  type Variants,
} from "framer-motion";

// LazyMotion + m keeps the framer-motion bundle small (Lighthouse budget).
export function MotionRoot({ children }: { children: React.ReactNode }) {
  return <LazyMotion features={domAnimation}>{children}</LazyMotion>;
}

// Critically damped: UI state settles without overshoot.
export const spring = { type: "spring", stiffness: 320, damping: 36 } as const;
// The one bouncy spring: hero store buttons and chips only.
export const pop = { type: "spring", stiffness: 320, damping: 24 } as const;

export function useStagger(): { parent: Variants; child: Variants } {
  const reduce = useReducedMotion();
  return {
    parent: { hidden: {}, show: { transition: { staggerChildren: 0.1 } } },
    child: {
      hidden: { y: reduce ? 0 : 24 },
      show: { y: 0, transition: { duration: 0.5, ease: "easeOut" } },
    },
  };
}

// Scroll-triggered rise; the one wrapper every section uses.
// Transform only: content is readable at rest, before hydration and in full-page captures.
export function Reveal({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const reduce = useReducedMotion();
  return (
    <m.div
      className={className}
      initial={{ y: reduce ? 0 : 28 }}
      whileInView={{ y: 0 }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{ duration: 0.6, ease: "easeOut", delay }}
    >
      {children}
    </m.div>
  );
}

export { m, useReducedMotion };
