import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        shell: "#F3EDE0",
        paper: "#FFFEF8",
        ink: "#163037",
        "ink-soft": "#5B7176",
        tide: "#1A6A6E",
        "tide-mist": "#E4F1EF",
        gold: "#C18426",
        "gold-mist": "#F8EED8",
        coral: "#C45B54",
        "coral-mist": "#F6E3DF",
        sand: "#5B7176",
        foam: "#1A6A6E"
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"]
      },
      boxShadow: {
        glow: "0 10px 28px rgba(22,48,55,.06)"
      }
    }
  },
  plugins: []
};

export default config;
