import type { Config } from "tailwindcss";

// Tokens del design system "Nocturne" con el override de acento IBERO —
// ver UiDesign/README.md (sección "Design Tokens") y
// UiDesign/prototype/_ds/nocturne-.../styles.css, que son la fuente de
// verdad. `ibero.red`/`ibero.red-dark` se conservan como alias de
// `accent.500`/`accent.700` (mismo color calculado) para no tener que
// renombrar los ~50 usos existentes de `bg-ibero-red` en un solo cambio;
// código nuevo debe usar `accent-*` directamente.
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        ibero: {
          red: "#C8102E",
          "red-dark": "#7C0B1E",
        },
        surface: {
          DEFAULT: "#161826",
          raised: "#232532",
          border: "rgba(233, 233, 237, 0.16)",
        },
        // Acento primario (rojo IBERO) — reemplaza el blurple original de Nocturne.
        accent: {
          100: "#fdecee",
          200: "#f7cfd5",
          300: "#ee9fab",
          400: "#e26775",
          500: "#c8102e",
          600: "#a30e26",
          700: "#7c0b1e",
          800: "#571626",
          900: "#34121b",
        },
        // Acento secundario — el blurple original de Nocturne, usado para
        // tags de rol (p. ej. "Modelador") y notas informativas.
        accent2: {
          100: "#f5f4ff",
          200: "#e7e5fe",
          300: "#d2cefd",
          400: "#b5afe8",
          500: "#9690c9",
          600: "#7972a9",
          700: "#5c5783",
          800: "#423e5d",
          900: "#2b293a",
        },
        // Rampa neutra azul-grisácea de Nocturne — reemplaza los grises
        // por defecto de Tailwind en los ~112 usos existentes de
        // `text-neutral-*`/`border-neutral-*` sin tocar cada archivo.
        neutral: {
          100: "#f3f5fe",
          200: "#e4e7f5",
          300: "#cfd3e5",
          400: "#b2b6ca",
          500: "#9397ab",
          600: "#75798c",
          700: "#595d6c",
          800: "#3f424d",
          900: "#292b31",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      borderRadius: {
        sm: "4px",
        md: "8px",
        lg: "14px",
      },
      boxShadow: {
        sm: "0 0 0 1px #3f424d",
        md: "0 0 0 1px #595d6c, 0 6px 18px rgba(0,0,0,0.55)",
        lg: "0 0 0 1px #9397ab, 0 16px 40px rgba(0,0,0,0.65)",
      },
      keyframes: {
        fadeUp: {
          from: { opacity: "0", transform: "translateY(10px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        popIn: {
          from: { opacity: "0", transform: "scale(.6)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
      },
      animation: {
        fadeUp: "fadeUp .5s ease both",
        popIn: "popIn .4s cubic-bezier(.2,1.4,.4,1) both",
      },
    },
  },
  plugins: [],
};

export default config;
