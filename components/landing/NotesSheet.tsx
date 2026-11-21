"use client";

import { useEffect, useRef } from "react";
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from "framer-motion";

/**
 * The hero's "page of notes" — sits on the desk at an angle, leans toward the
 * pointer, and lies flat as the hero scrolls away. All transforms are on one
 * element (GPU-composited); pointer tracking only runs for fine pointers.
 */
export default function NotesSheet({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();

  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const sx = useSpring(px, { stiffness: 70, damping: 18 });
  const sy = useSpring(py, { stiffness: 70, damping: 18 });

  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 80%", "end start"] });
  const scrollTilt = useTransform(scrollYProgress, [0, 1], [0, 16]);
  const lift = useTransform(scrollYProgress, [0, 1], [0, -60]);

  const rotateX = useTransform([sy, scrollTilt], ([y, t]: number[]) => 7 - y * 6 + t);
  const rotateY = useTransform(sx, (x) => -11 + x * 8);

  useEffect(() => {
    if (reduce) return;
    const fine = window.matchMedia("(pointer: fine) and (min-width: 1024px)");
    if (!fine.matches) return;
    let frame = 0;
    const onMove = (e: PointerEvent) => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        px.set(e.clientX / window.innerWidth - 0.5);
        py.set(e.clientY / window.innerHeight - 0.5);
      });
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", onMove);
    };
  }, [px, py, reduce]);

  return (
    <div ref={ref} className="relative [perspective:1600px]">
      <motion.div
        style={reduce ? undefined : { rotateX, rotateY, y: lift, transformStyle: "preserve-3d" }}
        className="will-change-transform max-lg:!transform-none"
      >
        {children}
      </motion.div>
    </div>
  );
}
