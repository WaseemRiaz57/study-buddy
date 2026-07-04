"use client";

import { useCallback, memo, lazy, Suspense, useMemo, useState, useRef, useEffect } from "react";
import type { Engine, ISourceOptions, Container } from "@tsparticles/engine";
import { useTheme } from "next-themes";
import { Activity } from "lucide-react";

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
  const [nodes, setNodes] = useState(0);
  const [links, setLinks] = useState(0);
  const containerRef = useRef<Container | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      const container = containerRef.current;
      if (!container) return;
      
      // tsParticles engine stores particles in container.particles.array
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const particles = (container.particles as any).array || [];
      setNodes(particles.length);
      
      let linkCount = 0;
      for (const p of particles) {
        if (p.links) {
          linkCount += p.links.length;
        }
      }
      // Each link is counted twice (once for each node)
      setLinks(Math.floor(linkCount / 2));
    }, 500);

    return () => clearInterval(interval);
  }, []);

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
          value: 65,
          density: { enable: true, width: 1200, height: 800 },
        },
        color: { value: ["#a855f7", "#06b6d4", "#c084fc", "#22d3ee", "#e879f9"] },
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

  const particlesLoaded = useCallback(async (container?: Container) => {
    if (container) {
      containerRef.current = container;
    }
  }, []);

  return (
    <Suspense fallback={null}>
      <div className="pointer-events-none absolute left-4 top-4 z-50 md:left-8 md:top-8">
        <div className="flex items-center gap-3 rounded-full border border-slate-200/50 bg-white/70 px-4 py-2 shadow-sm backdrop-blur-md dark:border-white/10 dark:bg-[#0D1428]/60 dark:shadow-2xl">
          <Activity className="h-4 w-4 animate-pulse text-purple-600 dark:text-cyan-400" />
          <div className="flex items-center gap-4 text-xs font-semibold tracking-wide">
            <span className="text-slate-700 dark:text-white/80">
              <span className="text-purple-600 dark:text-cyan-400">{nodes}</span> Nodes
            </span>
            <span className="h-3 w-px bg-slate-300 dark:bg-white/20" />
            <span className="text-slate-700 dark:text-white/80">
              <span className="text-purple-600 dark:text-cyan-400">{links}</span> Links
            </span>
          </div>
        </div>
      </div>
      
      <ParticlesProviderLazy init={initEngine}>
        <ParticlesComponent
          id="hero-particles"
          className="absolute inset-0 z-0"
          options={particlesConfig}
          particlesLoaded={particlesLoaded}
        />
      </ParticlesProviderLazy>
    </Suspense>
  );
});

export default ParticleNetwork;
