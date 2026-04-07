import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#FAFAF8",
        foreground: "#1A1A1A",
        muted: "#F5F3F0",
        "muted-foreground": "#6B6B6B",
        accent: "#B8860B",
        border: "#E8E4DF",
      },
      fontFamily: {
        serif: ["var(--font-playfair-display)", "serif"],
        body: ["var(--font-source-sans-3)", "sans-serif"],
        mono: ["var(--font-ibm-plex-mono)", "monospace"],
      },
      maxWidth: {
        editorial: "64rem",
      },
      spacing: {
        32: "8rem",
      },
      transitionDuration: {
        200: "200ms",
      },
    },
  },
};

export default config;
