import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        shell: "#F5F1E6",
        paper: "#FFFFFF",
        ink: "#14303A",
        "ink-soft": "#3F5C64",
        tide: "#1F6F6B",
        "tide-mist": "#DCEEEB",
        gold: "#C89B3C",
        "gold-mist": "#F3E4BE",
        coral: "#D65F45",
        "coral-mist": "#F6E1DA",
        sand: "#3F5C64",
        foam: "#1F6F6B"
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"]
      },
      boxShadow: { glow: "0 12px 32px rgba(20,48,58,.08)" }
    }
  },
  plugins: []
};

export default config;
