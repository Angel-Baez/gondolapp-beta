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
  const CurrentIcon = themeOptions[currentIndex]?.icon || Sun;

  const cycleTheme = () => {
    const nextIndex = (currentIndex + 1) % themeOptions.length;
    setTheme(themeOptions[nextIndex].value);
  };

  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      onClick={cycleTheme}
      className="p-3 bg-white/10 hover:bg-white/20 dark:bg-gray-700/50 dark:hover:bg-gray-700 rounded-lg transition-colors flex items-center gap-2"
      aria-label={`Tema actual: ${themeOptions[currentIndex]?.label}. Click para cambiar.`}
      title={`Tema: ${themeOptions[currentIndex]?.label}`}
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

/**
 * ThemeSelector - Dropdown-style selector for theme selection
 */
export function ThemeSelector() {
  const { theme, setTheme } = useThemeStore();

  return (
    <div className="flex items-center gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
      {themeOptions.map((option) => {
        const Icon = option.icon;
        const isActive = theme === option.value;

        return (
          <motion.button
            key={option.value}
            whileTap={{ scale: 0.95 }}
            onClick={() => setTheme(option.value)}
            className={`
              relative p-2 rounded-md transition-colors flex items-center justify-center
              ${isActive
                ? "text-accent-primary"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              }
            `}
            aria-label={option.label}
            title={option.label}
          >
            {isActive && (
              <motion.div
                layoutId="theme-indicator"
                className="absolute inset-0 bg-white dark:bg-gray-700 rounded-md shadow-sm"
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            )}
            <Icon size={18} className="relative z-10" />
          </motion.button>
        );
      })}
    </div>
  );
}
