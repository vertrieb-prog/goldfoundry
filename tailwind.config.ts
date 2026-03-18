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
          obsidian: "#09090b",
          dark: "#0f0f11",
          panel: "#131316",
          "panel-hover": "#18181c",
          surface: "#1c1c21",
          gold: "#FAEF70",
          "gold-light": "#fdf8c4",
          "gold-dim": "#b8a830",
          red: "#ef4444",
          green: "#22c55e",
          blue: "#3b82f6",
          purple: "#a855f7",
        },
        brand: {
          50: "#fefce8",
          100: "#fef9c3",
          500: "#FAEF70",
          600: "#d4c84a",
          700: "#b8a830",
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
