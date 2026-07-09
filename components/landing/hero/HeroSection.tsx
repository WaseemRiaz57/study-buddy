"use client";

import Link from "next/link";
import { useMotionValue } from "framer-motion";
import { useEffect, useRef } from "react";
import { useIsMobile } from "@/hooks/useIsMobile";
import { FloatingEcosystem } from "./FloatingEcosystem";

/**
 * The landing-page introduction. The feature previews remain real DOM content,
 * so their context is available to both visitors and search engines.
 */
export default function StudyBuddyParallaxHero() {
  const isMobile = useIsMobile();
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const frameRef = useRef<number | null>(null);
  const latestPointerRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const handlePointerMove = (event: PointerEvent) => {
      latestPointerRef.current = {
        x: event.clientX / window.innerWidth - 0.5,
        y: event.clientY / window.innerHeight - 0.5,
      };

      if (frameRef.current !== null) return;

      frameRef.current = window.requestAnimationFrame(() => {
        mouseX.set(latestPointerRef.current.x);
        mouseY.set(latestPointerRef.current.y);
        frameRef.current = null;
      });
    };

    window.addEventListener("pointermove", handlePointerMove, { passive: true });

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      if (frameRef.current !== null) window.cancelAnimationFrame(frameRef.current);
    };
  }, [mouseX, mouseY]);

  return (
    <section
      className="relative isolate flex min-h-[720px] items-center justify-center overflow-hidden bg-[#fbfaff] px-5 py-24 sm:px-8 lg:min-h-[780px]"
      aria-labelledby="studybuddy-hero-heading"
    >
      <div
        className="pointer-events-none absolute inset-0 -z-10"
        aria-hidden="true"
        style={{
          background:
            "radial-gradient(circle at 16% 27%, rgba(221, 214, 254, 0.62), transparent 26%), radial-gradient(circle at 84% 22%, rgba(233, 213, 255, 0.56), transparent 25%), radial-gradient(circle at 50% 88%, rgba(243, 232, 255, 0.72), transparent 34%)",
        }}
      />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-48 bg-gradient-to-t from-white/75 to-transparent" aria-hidden="true" />

      <FloatingEcosystem mouseX={mouseX} mouseY={mouseY} isMobile={isMobile} />

      <div className="relative z-20 mx-auto max-w-3xl text-center">
        <p className="mb-6 inline-flex rounded-full border border-violet-200 bg-violet-100/80 px-4 py-2 text-xs font-bold tracking-[0.14em] text-violet-700 shadow-sm backdrop-blur-sm">
          ✨ GET STARTED FREE
        </p>

        <h1
          id="studybuddy-hero-heading"
          className="text-balance text-5xl font-extrabold leading-[1.04] tracking-[-0.055em] text-slate-900 sm:text-6xl md:text-7xl"
        >
          <span className="block">Stop Procrastinating.</span>
          <span className="block text-violet-600">Start Achieving.</span>
        </h1>

        <p className="mx-auto mt-7 max-w-xl text-pretty text-base leading-7 text-slate-600 sm:text-lg">
          Join the smartest study community today. Setup takes less than 60 seconds.
        </p>

        <div className="mt-9">
          <Link
            href="/register"
            className="inline-flex min-h-12 items-center justify-center rounded-xl bg-slate-900 px-6 py-3 text-base font-bold text-white shadow-[0_14px_30px_rgba(15,23,42,0.18)] transition duration-200 hover:-translate-y-0.5 hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-600 focus-visible:ring-offset-2"
          >
            Create Free Account -&gt;
          </Link>
        </div>

        <p className="mt-5 text-sm font-medium text-slate-500">
          Free forever plan • No credit card required
        </p>
      </div>
    </section>
  );
}
