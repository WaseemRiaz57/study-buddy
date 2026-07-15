"use client";

import dynamic from "next/dynamic";
import { useState, memo } from "react";

const Spline = dynamic(
  // @ts-expect-error — webpack ESM resolution workaround
  () => import("@splinetool/react-spline/dist/react-spline.js"),
  { ssr: false }
);

// Replace with your own exported Spline brain scene. The fallback visual stays
// in place until the 3D scene finishes loading.
const DEFAULT_BRAIN_SCENE =
  "https://prod.spline.design/hl1JnOAz2tPu8j1T/scene.splinecode";

function NeuralFallback() {
  return (
    <div className="relative flex h-full w-full items-center justify-center">
      {/* Soft glass nucleus */}
      <div className="absolute h-40 w-40 rounded-full bg-violet-500/10 blur-2xl dark:bg-violet-400/10" />
      <div className="relative flex h-48 w-48 items-center justify-center rounded-full border border-violet-400/20 bg-gradient-to-br from-violet-500/[0.08] to-fuchsia-500/[0.08] backdrop-blur-xl shadow-[0_0_80px_rgba(124,58,237,0.15)]">
        <svg
          viewBox="0 0 200 200"
          className="h-32 w-32 animate-[spin_12s_linear_infinite] text-violet-400/40"
          fill="none"
        >
          <circle cx="100" cy="60" r="6" fill="currentColor" />
          <circle cx="140" cy="90" r="6" fill="currentColor" />
          <circle cx="125" cy="140" r="6" fill="currentColor" />
          <circle cx="75" cy="140" r="6" fill="currentColor" />
          <circle cx="60" cy="90" r="6" fill="currentColor" />
          <circle cx="100" cy="100" r="8" fill="currentColor" />
          <path
            d="M100 60 L140 90 M140 90 L125 140 M125 140 L75 140 M75 140 L60 90 M60 90 L100 60 M100 60 L100 100 M140 90 L100 100 M125 140 L100 100 M75 140 L100 100 M60 90 L100 100"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      </div>
      <p className="absolute bottom-0 translate-y-8 text-[10px] font-medium uppercase tracking-[0.2em] text-violet-500/60">
        Loading neural model
      </p>
    </div>
  );
}

interface SplineBrainProps {
  scene?: string;
  className?: string;
}

export default memo(function SplineBrain({
  scene = DEFAULT_BRAIN_SCENE,
  className = "",
}: SplineBrainProps) {
  const [loaded, setLoaded] = useState(false);

  return (
    <div
      className={`relative flex items-center justify-center ${className}`}
      aria-label="3D glassmorphism brain centerpiece"
    >
      {!loaded && <NeuralFallback />}
      <div
        className={`h-full w-full transition-opacity duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          loaded ? "opacity-100" : "pointer-events-none absolute inset-0 opacity-0"
        }`}
      >
        <Spline scene={scene} onLoad={() => setLoaded(true)} />
      </div>
    </div>
  );
});
