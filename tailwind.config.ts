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
      boxShadow: {
        // Native-like shadows
        "native-sm": "0 1px 2px rgba(0, 0, 0, 0.05)",
        "native": "0 2px 8px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.04)",
        "native-md": "0 4px 16px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.05)",
        "native-lg": "0 8px 32px rgba(0, 0, 0, 0.12), 0 4px 8px rgba(0, 0, 0, 0.06)",
        "native-xl": "0 12px 48px rgba(0, 0, 0, 0.15), 0 6px 12px rgba(0, 0, 0, 0.08)",
        // FAB shadows
        "fab": "0 4px 12px rgba(0, 0, 0, 0.15), 0 2px 4px rgba(0, 0, 0, 0.1)",
        "fab-hover": "0 8px 24px rgba(0, 0, 0, 0.2), 0 4px 8px rgba(0, 0, 0, 0.12)",
      },
      borderRadius: {
        "4xl": "2rem",
        "5xl": "2.5rem",
      },
      animation: {
        "fade-in": "fadeIn 0.3s ease-out forwards",
        "scale-in": "scaleIn 0.2s ease-out forwards",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        scaleIn: {
          "0%": { opacity: "0", transform: "scale(0.95)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
      },
      transitionTimingFunction: {
        "native": "cubic-bezier(0.25, 0.1, 0.25, 1)",
        "spring": "cubic-bezier(0.175, 0.885, 0.32, 1.275)",
      },
    },
  },
  plugins: [],
};
export default config;
