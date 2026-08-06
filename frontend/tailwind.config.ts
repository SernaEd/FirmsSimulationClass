import type { Config } from "tailwindcss";

// UI minimalista oscura con acento rojo IBERO (plan §12.1).
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        ibero: {
          red: "#C8102E",
          "red-dark": "#8E0B20",
        },
        surface: {
          DEFAULT: "#0B0B0D",
          raised: "#141418",
          border: "#26262C",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
