import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class", ".dark"],
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "var(--background)", 
        foreground: "var(--foreground)", 
        card: {
          DEFAULT: "var(--card)",
          foreground: "var(--card-foreground)",
        },
        muted: {
          DEFAULT: "var(--muted)",
          foreground: "var(--muted-foreground)",
        },
        border: "var(--border)",
        primary: {
          DEFAULT: "var(--primary)",
          foreground: "var(--primary-foreground)",
        },
        accent: {
          DEFAULT: "#ec4899",
          foreground: "#ffffff",
          mint: "var(--accent-mint)",
          gold: "var(--accent-gold)",
        },
        "sidebar-dark": "#0d1117",
        "electric-mint": "#00FFA3",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
        pulse: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.6" },
        },
        liquid: {
          "0%": { backgroundPosition: "0% 50%", transform: "scaleY(1)" },
          "25%": { transform: "scaleY(1.1)" },
          "50%": { backgroundPosition: "100% 50%", transform: "scaleY(0.95)" },
          "75%": { transform: "scaleY(1.05)" },
          "100%": { backgroundPosition: "0% 50%", transform: "scaleY(1)" },
        },
      },
      animation: {
        float: "float 6s ease-in-out infinite",
        pulse: "pulse 2.5s ease-in-out infinite",
        liquid: "liquid 3s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;