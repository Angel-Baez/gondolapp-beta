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
        background: "#FFFFFF",
        surface: "#000000",
        "text-primary": "#000000",
        "text-secondary": "#FFFFFF",
        // Deep Glass palette
        "deep-navy": "#0a0e17",
        glass: {
          light: "rgba(255, 255, 255, 0.05)",
          medium: "rgba(255, 255, 255, 0.1)",
          strong: "rgba(255, 255, 255, 0.15)",
        },
        neon: {
          cyan: "#00f0ff",
          lime: "#ccff00",
          purple: "#b47aff",
        },
        accent: {
          primary: "#00bcd4",
          secondary: "#FF0000",
          tertiary: "#10B981",
        },
        alert: {
          critico: "#EF4444",
          advertencia: "#FBBF24",
          precaucion: "#F97316",
          normal: "#6B7280",
        },
        // Dark mode specific colors
        dark: {
          bg: "#0f172a",
          surface: "#1e293b",
          card: "#334155",
          border: "#475569",
        },
      },
      borderRadius: {
        xl: "16px",
        "2xl": "24px",
        "3xl": "32px",
        "4xl": "40px",
      },
      backdropBlur: {
        xs: "2px",
        sm: "4px",
        DEFAULT: "8px",
        md: "12px",
        lg: "16px",
        xl: "20px",
        "2xl": "24px",
        "3xl": "32px",
      },
    },
  },
  plugins: [],
};
export default config;
