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

export const spring = { type: "spring", stiffness: 320, damping: 24 } as const;

export function useStagger(): { parent: Variants; child: Variants } {
  const reduce = useReducedMotion();
  return {
    parent: { hidden: {}, show: { transition: { staggerChildren: 0.1 } } },
    child: {
      hidden: { opacity: 0, y: reduce ? 0 : 24 },
      show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
    },
  };
}

// Scroll-triggered fade-up; the one wrapper every section uses.
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
      initial={{ opacity: 0, y: reduce ? 0 : 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{ duration: 0.6, ease: "easeOut", delay }}
    >
      {children}
    </m.div>
  );
}

export { m, useReducedMotion };
