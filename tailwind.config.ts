import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        gf: {
          obsidian: "#040302",
          dark: "#0f0f11",
          panel: "#131316",
          "panel-hover": "#18181c",
          surface: "#1c1c21",
          gold: "#d4a537",
          "gold-light": "#f0d060",
          "gold-dim": "#9e7a1f",
          warm: "#cec0a0",
          red: "#ef4444",
          green: "#22c55e",
          blue: "#3b82f6",
          purple: "#a855f7",
        },
        brand: {
          50: "#fefce8",
          100: "#fef9c3",
          500: "#d4a537",
          600: "#b8922e",
          700: "#9e7a1f",
          900: "#713f12",
        },
      },
      fontFamily: {
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "sans-serif"],
        mono: ["JetBrains Mono", "Fira Code", "monospace"],
      },
      borderRadius: {
        "2xl": "16px",
        "3xl": "24px",
      },
      animation: {
        "fade-in": "fadeIn 0.7s ease-out forwards",
        "ticker": "ticker 30s linear infinite",
        "glow": "glow-pulse 3s ease-in-out infinite",
        "float": "float 4s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
