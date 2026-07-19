"use client";

import { memo, useMemo } from "react";
import { Particles, ParticlesProvider } from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";
import { useReducedMotion } from "framer-motion";
import { useTheme } from "next-themes";
import type { Engine, ISourceOptions } from "@tsparticles/engine";

const initializeParticles = async (engine: Engine) => loadSlim(engine);

interface ParticleNetworkProps {
  id?: string;
  density?: number;
  className?: string;
}

function ParticleNetwork({
  id = "landing-particles",
  density = 64,
  className = "",
}: ParticleNetworkProps) {
  const { resolvedTheme } = useTheme();
  const prefersReducedMotion = useReducedMotion();

  const isDark = resolvedTheme === "dark";
  const options: ISourceOptions = useMemo(
    () => ({
      fullScreen: { enable: false },
      pauseOnBlur: true,
      pauseOnOutsideViewport: true,
      fpsLimit: 60,
      background: { color: { value: "transparent" } },
      particles: {
        number: {
          value: prefersReducedMotion ? Math.round(density * 0.4) : density,
          density: { enable: true, area: 1000 },
        },
        color: { value: isDark ? ["#c4b5fd", "#67e8f9"] : ["#7c3aed", "#0891b2"] },
        shape: { type: "circle" },
        opacity: { value: { min: 0.12, max: isDark ? 0.42 : 0.3 } },
        size: { value: { min: 0.8, max: 2.2 } },
        links: {
          enable: true,
          distance: 150,
          color: isDark ? "#a78bfa" : "#7c3aed",
          opacity: isDark ? 0.13 : 0.1,
          width: 0.7,
          triangles: { enable: false },
        },
        move: {
          enable: !prefersReducedMotion,
          speed: 0.28,
          direction: "none",
          random: true,
          straight: false,
          outModes: { default: "bounce" },
        },
      },
      interactivity: {
        detectsOn: "window",
        events: {
          onHover: { enable: !prefersReducedMotion, mode: "grab" },
          onClick: { enable: false },
          resize: { enable: true },
        },
        modes: {
          grab: { distance: 170, links: { opacity: isDark ? 0.3 : 0.22 } },
        },
      },
      detectRetina: true,
    }),
    [density, isDark, prefersReducedMotion]
  );

  return (
    <ParticlesProvider init={initializeParticles}>
      <Particles
        id={id}
        options={options}
        className={`pointer-events-none absolute inset-0 opacity-80 ${className}`}
        aria-hidden="true"
      />
    </ParticlesProvider>
  );
}

export default memo(ParticleNetwork);
