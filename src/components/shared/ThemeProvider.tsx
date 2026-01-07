"use client";

import { useEffect } from "react";
import { useThemeStore } from "@/store/theme";

/**
 * ThemeProvider - Initializes theme on app load
 * This component should be placed in the root layout
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const initializeTheme = useThemeStore((state) => state.initializeTheme);

  useEffect(() => {
    const cleanup = initializeTheme();
    return cleanup;
  }, [initializeTheme]);

  return <>{children}</>;
}
