import { useCallback, useEffect, useState } from "react";

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

  return { haptic, isSupported };
}
