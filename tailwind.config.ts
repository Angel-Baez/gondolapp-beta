import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
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
      },
    },
  },
  plugins: [],
};
export default config;
