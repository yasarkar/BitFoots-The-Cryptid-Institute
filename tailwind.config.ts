import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bitfoot: {
          abyss: "#14171c",
          panel: "#1a1f26",
          field: "#0f1216",
          gold: "#eaba49",
          goldHover: "#f3c85f",
          heading: "#ffddcc",
          text: "#aab6c9",
          lead: "#c9ccd2",
          muted: "#7d8898",
          line: "#3a475c",
          ok: "#7fc98f",
          bad: "#e07a6b",
          unk: "#d8c27a",
          dark: "#080e17",
          forest: "#071410",
        },
      },
      fontFamily: {
        serif: ["var(--font-serif)", "'IBM Plex Serif'", "Georgia", "serif"],
        sans: ["var(--font-sans)", "'Plus Jakarta Sans'", "Inter", "sans-serif"],
        mono: ["var(--font-mono)", "'JetBrains Mono'", "ui-monospace", "monospace"],
        arcade: ["var(--font-arcade)", "'Press Start 2P'", "monospace"],
        tech: ["var(--font-tech)", "'Chakra Petch'", "sans-serif"],
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "bounce-subtle": "bounce 2s infinite",
        "radar-sweep": "radar 4s linear infinite",
        scanline: "scanline 8s linear infinite",
        "glow-pulse": "glowPulse 2s ease-in-out infinite alternate",
      },
      keyframes: {
        radar: {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
        scanline: {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(1000%)" },
        },
        glowPulse: {
          "0%": { opacity: "0.4" },
          "100%": { opacity: "0.9" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
