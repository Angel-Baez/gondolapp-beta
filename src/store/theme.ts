import { create } from "zustand";
import { persist } from "zustand/middleware";

type Theme = "light" | "dark" | "system";

interface ThemeStore {
  theme: Theme;
  resolvedTheme: "light" | "dark";
  setTheme: (theme: Theme) => void;
  initializeTheme: () => () => void;
}

// Store the media query listener cleanup function
let mediaQueryCleanup: (() => void) | null = null;

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set, get) => ({
      theme: "system",
      resolvedTheme: "light",

      setTheme: (theme: Theme) => {
        const resolvedTheme = resolveTheme(theme);
        set({ theme, resolvedTheme });
        applyTheme(resolvedTheme);
      },

      initializeTheme: () => {
        const { theme } = get();
        const resolvedTheme = resolveTheme(theme);
        set({ resolvedTheme });
        applyTheme(resolvedTheme);

        // Clean up any existing listener
        if (mediaQueryCleanup) {
          mediaQueryCleanup();
        }

        // Listen for system theme changes
        if (typeof window !== "undefined") {
          const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
          const handleChange = (e: MediaQueryListEvent) => {
            const { theme } = get();
            if (theme === "system") {
              const newResolvedTheme = e.matches ? "dark" : "light";
              set({ resolvedTheme: newResolvedTheme });
              applyTheme(newResolvedTheme);
            }
          };
          
          mediaQuery.addEventListener("change", handleChange);
          
          // Store cleanup function
          mediaQueryCleanup = () => {
            mediaQuery.removeEventListener("change", handleChange);
          };
          
          // Return cleanup function for component unmount
          return () => {
            if (mediaQueryCleanup) {
              mediaQueryCleanup();
              mediaQueryCleanup = null;
            }
          };
        }
        
        return () => {}; // Return no-op if window is undefined
      },
    }),
    {
      name: "gondolapp-theme",
      partialize: (state) => ({ theme: state.theme }),
    }
  )
);

function resolveTheme(theme: Theme): "light" | "dark" {
  if (theme === "system") {
    if (typeof window !== "undefined") {
      return window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
    }
    return "light";
  }
  return theme;
}

function applyTheme(resolvedTheme: "light" | "dark") {
  if (typeof document !== "undefined") {
    const root = document.documentElement;
    if (resolvedTheme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }
}
