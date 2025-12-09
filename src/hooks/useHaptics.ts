import { useCallback, useEffect, useState } from "react";

/**
 * Patrones de feedback háptico basados en US-006 del PRD
 */
export type HapticPattern =
  | "light"     // 10ms - tap en botón
  | "medium"    // 20ms - agregar item
  | "success"   // 15ms-pause-15ms - scan exitoso
  | "warning"   // 30ms - eliminar
  | "error"     // 50ms-50ms-50ms - error
  | "selection"; // 10ms - swipe reveal

const HAPTIC_PATTERNS: Record<HapticPattern, number | number[]> = {
  light: 10,
  medium: 20,
  success: [15, 50, 15],
  warning: 30,
  error: [50, 30, 50, 30, 50],
  selection: 10,
};

export function useHaptics() {
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    // Verificar soporte de vibración
    const supported =
      typeof window !== "undefined" &&
      "vibrate" in navigator &&
      // Excluir iOS explícitamente (no soporta vibración web)
      !/iPhone|iPad|iPod/.test(navigator.userAgent);

    setIsSupported(supported);

    if (process.env.NODE_ENV === "development") {
      console.log("Haptics supported:", supported);
    }
  }, []);

  const haptic = useCallback(
    (pattern: number | number[]) => {
      if (!isSupported) {
        // Fallback visual para dispositivos sin soporte
        if (process.env.NODE_ENV === "development") {
          console.log("Haptic feedback requested:", pattern);
        }
        return;
      }

      try {
        // Convertir array a formato compatible
        const vibrationPattern = Array.isArray(pattern) ? pattern : [pattern];

        // Llamar a la API con patrón válido
        const success = navigator.vibrate(vibrationPattern);

        if (!success && process.env.NODE_ENV === "development") {
          console.warn("Vibration API returned false");
        }
      } catch (error) {
        console.error("Error triggering haptic feedback:", error);
      }
    },
    [isSupported]
  );

  /**
   * Trigger haptic usando patrones predefinidos
   */
  const trigger = useCallback(
    (pattern: HapticPattern) => {
      haptic(HAPTIC_PATTERNS[pattern]);
    },
    [haptic]
  );

  return { haptic, trigger, isSupported };
}
