import { useCallback } from "react";

export function useHaptics() {
  const haptic = useCallback((pattern: number | number[]) => {
    if (typeof window !== "undefined" && navigator?.vibrate) {
      navigator.vibrate(pattern);
    }
  }, []);

  return { haptic };
}
