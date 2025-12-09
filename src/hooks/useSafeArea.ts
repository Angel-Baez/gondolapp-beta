import { useEffect, useState } from "react";

/**
 * Safe area insets para dispositivos con notch/home indicator
 * 
 * Basado en ADR-003 para soportar safe areas en iOS y Android
 */
export interface SafeAreaInsets {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

/**
 * Hook para obtener los valores de safe area del dispositivo
 * 
 * @returns {SafeAreaInsets} Valores de padding para safe areas
 */
export function useSafeArea(): SafeAreaInsets {
  const [insets, setInsets] = useState<SafeAreaInsets>({
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  });

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const updateInsets = () => {
      // Obtener valores de CSS env()
      const computedStyle = getComputedStyle(document.documentElement);
      
      const top = parseInt(
        computedStyle.getPropertyValue("--safe-area-inset-top") || "0",
        10
      );
      const right = parseInt(
        computedStyle.getPropertyValue("--safe-area-inset-right") || "0",
        10
      );
      const bottom = parseInt(
        computedStyle.getPropertyValue("--safe-area-inset-bottom") || "0",
        10
      );
      const left = parseInt(
        computedStyle.getPropertyValue("--safe-area-inset-left") || "0",
        10
      );

      setInsets({ top, right, bottom, left });
    };

    // Actualizar en mount y en resize
    updateInsets();
    window.addEventListener("resize", updateInsets);

    return () => {
      window.removeEventListener("resize", updateInsets);
    };
  }, []);

  return insets;
}

/**
 * Hook simplificado para obtener solo el bottom safe area (más común)
 * 
 * @returns {number} Altura del safe area inferior en pixels
 */
export function useBottomSafeArea(): number {
  const { bottom } = useSafeArea();
  return bottom;
}
