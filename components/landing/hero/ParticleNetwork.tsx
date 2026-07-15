"use client";

import { useEffect, useMemo, useState } from "react";
import Particles, { initParticlesEngine } from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";
import { useTheme } from "next-themes";
import type { ISourceOptions, Engine } from "@tsparticles/engine";

/**
 * Premium interactive node network used as a background layer.
 * Theme-aware so it inverts between light and dark modes.
 */
export default function ParticleNetwork() {
  const [init, setInit] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
    void initParticlesEngine(async (engine: Engine) => {
      await loadSlim(engine);
    }).then(() => setInit(true));
  }, []);

  const isDark = resolvedTheme === "dark";

  const options: ISourceOptions = useMemo(
    () => ({
      fullScreen: { enable: false },
      particles: {
        number: { value: 90, density: { enable: true, area: 900 } },
        color: { value: isDark ? "#c084fc" : "#7c3aed" },
        shape: { type: "circle" },
        opacity: { value: 0.35 },
        size: { value: { min: 1, max: 3 } },
        links: {
          enable: true,
          distance: 160,
          color: isDark ? "#c084fc" : "#7c3aed",
          opacity: 0.12,
          width: 1,
        },
        move: {
          enable: true,
          speed: 0.45,
          direction: "none",
          outModes: { default: "bounce" },
        },
      },
      interactivity: {
        events: {
          onHover: { enable: true, mode: "grab" },
          onClick: { enable: false },
        },
        modes: {
          grab: { distance: 150, links: { opacity: 0.3 } },
        },
      },
      detectRetina: true,
    }),
    [isDark]
  );

  if (!mounted || !init) return null;

  return (
    <Particles
      id="hero-particles"
      options={options}
      className="pointer-events-none absolute inset-0 z-0 opacity-70"
    />
  );
}
