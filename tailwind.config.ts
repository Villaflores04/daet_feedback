import type { Config } from "tailwindcss";
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#07131c",
        tide: "#0c2433",
        foam: "#d7f3ea",
        gold: "#e8c572",
        sand: "#f4efe4",
        coral: "#e07a5f"
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"]
      },
      boxShadow: { glow: "0 30px 80px rgba(8, 28, 40, 0.45)" }
    }
  },
  plugins: []
};
export default config;
