import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Tokens semánticos (CSS vars en globals.css, dark-aware)
        canvas: "hsl(var(--bg-canvas) / <alpha-value>)",
        surface: {
          DEFAULT: "hsl(var(--bg-surface) / <alpha-value>)",
          2: "hsl(var(--bg-surface-2) / <alpha-value>)",
        },
        fg: {
          DEFAULT: "hsl(var(--fg-primary) / <alpha-value>)",
          secondary: "hsl(var(--fg-secondary) / <alpha-value>)",
          tertiary: "hsl(var(--fg-tertiary) / <alpha-value>)",
        },
        border: "hsl(var(--border) / <alpha-value>)",
        accent: {
          DEFAULT: "hsl(var(--accent) / <alpha-value>)",
          strong: "hsl(var(--accent-strong) / <alpha-value>)",
          soft: "hsl(var(--accent-soft) / <alpha-value>)",
        },
        "on-accent": "hsl(var(--on-accent) / <alpha-value>)",
        estado: {
          pendiente: "hsl(var(--estado-pendiente) / <alpha-value>)",
          repuesto: "hsl(var(--estado-repuesto) / <alpha-value>)",
          "sin-stock": "hsl(var(--estado-sin-stock) / <alpha-value>)",
        },
        alert: {
          vencido: "hsl(var(--alert-vencido) / <alpha-value>)",
          critico: "hsl(var(--alert-critico) / <alpha-value>)",
          advertencia: "hsl(var(--alert-advertencia) / <alpha-value>)",
          precaucion: "hsl(var(--alert-precaucion) / <alpha-value>)",
          normal: "hsl(var(--alert-normal) / <alpha-value>)",
        },
      },
      borderRadius: {
        chip: "var(--radius-chip)",
        field: "var(--radius-field)",
        card: "var(--radius-card)",
        sheet: "var(--radius-sheet)",
      },
      boxShadow: {
        island: "var(--shadow-island)",
        float: "var(--shadow-float)",
      },
      fontSize: {
        display: [
          "2.125rem",
          { lineHeight: "1.15", fontWeight: "800", letterSpacing: "-0.02em" },
        ],
        title1: [
          "1.75rem",
          { lineHeight: "1.2", fontWeight: "700", letterSpacing: "-0.01em" },
        ],
        title2: ["1.375rem", { lineHeight: "1.25", fontWeight: "700" }],
        headline: ["1.0625rem", { lineHeight: "1.35", fontWeight: "600" }],
        body: ["1rem", { lineHeight: "1.45" }],
        subhead: ["0.9375rem", { lineHeight: "1.4" }],
        footnote: ["0.8125rem", { lineHeight: "1.35" }],
        caption: ["0.75rem", { lineHeight: "1.3" }],
      },
      spacing: {
        "tabbar-clearance": "var(--tabbar-clearance)",
      },
    },
  },
  plugins: [],
};
export default config;
