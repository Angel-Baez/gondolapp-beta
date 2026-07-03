"use client";

import { motion } from "framer-motion";
import { Moon, Sun, Monitor } from "lucide-react";
import { useThemeStore } from "@/store/theme";

type Theme = "light" | "dark" | "system";

const themeOptions: { value: Theme; icon: typeof Sun; label: string }[] = [
  { value: "light", icon: Sun, label: "Claro" },
  { value: "dark", icon: Moon, label: "Oscuro" },
  { value: "system", icon: Monitor, label: "Sistema" },
];

/**
 * ThemeToggle - Button to toggle between light/dark/system themes
 */
export function ThemeToggle() {
  const { theme, setTheme } = useThemeStore();

  const currentIndex = themeOptions.findIndex((opt) => opt.value === theme);
  const safeIndex = currentIndex === -1 ? 0 : currentIndex;
  const CurrentIcon = themeOptions[safeIndex].icon;

  const cycleTheme = () => {
    const nextIndex = (safeIndex + 1) % themeOptions.length;
    setTheme(themeOptions[nextIndex].value);
  };

  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      onClick={cycleTheme}
      className="w-11 h-11 flex items-center justify-center rounded-full text-fg-secondary hover:bg-surface-2 transition-colors"
      aria-label={`Tema actual: ${themeOptions[safeIndex].label}. Click para cambiar.`}
      title={`Tema: ${themeOptions[safeIndex].label}`}
    >
      <motion.div
        key={theme}
        initial={{ rotate: -90, opacity: 0 }}
        animate={{ rotate: 0, opacity: 1 }}
        transition={{ duration: 0.2 }}
      >
        <CurrentIcon size={20} />
      </motion.div>
    </motion.button>
  );
}
