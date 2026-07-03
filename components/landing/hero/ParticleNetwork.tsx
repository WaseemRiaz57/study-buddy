"use client";

import { useCallback, memo, lazy, Suspense, useMemo } from "react";
import type { Engine, ISourceOptions } from "@tsparticles/engine";
import { useTheme } from "next-themes";

// Lazy-load the heavy particles runtime so it never blocks LCP.
// Both the Provider and the Particles component are loaded together.
const ParticlesComponent = lazy(() =>
  import("@tsparticles/react").then((m) => ({ default: m.default }))
);
const ParticlesProviderLazy = lazy(() =>
  import("@tsparticles/react").then((m) => ({
    default: m.ParticlesProvider,
  }))
);

/**
 * Interactive particle network background.
 * Lazy-loaded so it never blocks LCP. Falls back to nothing during SSR.
 * Represents real-time connections between students and teachers.
 *
 * Uses @tsparticles/react v4 API: ParticlesProvider wraps the Particles
 * component and handles engine initialization via its `init` callback.
 */
const ParticleNetwork = memo(function ParticleNetwork() {
  const { resolvedTheme } = useTheme();

  const particlesConfig = useMemo<ISourceOptions>(() => {
    const isLight = resolvedTheme === "light";
    
    return {
      fullScreen: false,
      fpsLimit: 60,
      detectRetina: true,
      pauseOnBlur: true,
      pauseOnOutsideViewport: true,
      particles: {
        number: {
          value: 55,
          density: { enable: true, width: 1200, height: 800 },
        },
        color: { value: ["#a855f7", "#8b5cf6", "#c084fc", "#7c3aed", "#e879f9"] },
        shape: { type: "circle" },
        opacity: {
          value: { 
            min: isLight ? 0.3 : 0.15, 
            max: isLight ? 0.8 : 0.55 
          },
          animation: {
            enable: true,
            speed: 0.6,
            sync: false,
            startValue: "random",
          },
        },
        size: {
          value: { min: 1.2, max: 3 },
          animation: {
            enable: true,
            speed: 1.5,
            sync: false,
            startValue: "random",
          },
        },
        links: {
          enable: true,
          distance: 160,
          color: "#a855f7",
          opacity: isLight ? 0.25 : 0.12,
          width: 1,
        },
        move: {
          enable: true,
          speed: 0.6,
          direction: "none" as const,
          random: true,
          straight: false,
          outModes: { default: "bounce" as const },
        },
      },
      interactivity: {
        detectsOn: "window" as const,
        events: {
          onHover: {
            enable: true,
            mode: "grab",
          },
          resize: { enable: true },
        },
        modes: {
          grab: {
            distance: 180,
            links: { opacity: isLight ? 0.6 : 0.35, color: "#c084fc" },
          },
        },
      },
    };
  }, [resolvedTheme]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const initEngine = useCallback(async (engine: any) => {
    const { loadSlim } = await import("@tsparticles/slim");
    await loadSlim(engine as Engine);
  }, []);

  return (
    <Suspense fallback={null}>
      <ParticlesProviderLazy init={initEngine}>
        <ParticlesComponent
          id="hero-particles"
          className="absolute inset-0 z-0"
          options={particlesConfig}
        />
      </ParticlesProviderLazy>
    </Suspense>
  );
});

export default ParticleNetwork;
