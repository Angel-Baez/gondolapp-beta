import { useEffect, useState } from "react";

/**
 * Hook para detectar preferencia de movimiento reducido
 * 
 * Respeta la configuración de accesibilidad del usuario según
 * WCAG 2.1 - 2.3.3 Animation from Interactions
 * 
 * @returns {boolean} true si el usuario prefiere movimiento reducido
 */
export function useReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    // Verificar soporte del media query
    if (typeof window === "undefined") {
      return;
    }

    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    
    // Establecer valor inicial
    setPrefersReducedMotion(mediaQuery.matches);

    // Listener para cambios en la preferencia
    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };

    // Agregar listener (sintaxis compatible con navegadores antiguos)
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", handleChange);
    } else {
      // Fallback para Safari < 14
      mediaQuery.addListener(handleChange);
    }

    // Cleanup
    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener("change", handleChange);
      } else {
        mediaQuery.removeListener(handleChange);
      }
    };
  }, []);

  return prefersReducedMotion;
}

/**
 * Obtiene la configuración de animación apropiada basada en preferencias
 * 
 * @example
 * const animationConfig = useAnimationConfig();
 * <motion.div {...animationConfig} />
 */
export function useAnimationConfig() {
  const prefersReducedMotion = useReducedMotion();

  return {
    // Si el usuario prefiere movimiento reducido, desactivar animaciones
    initial: prefersReducedMotion ? false : undefined,
    animate: prefersReducedMotion ? false : undefined,
    exit: prefersReducedMotion ? false : undefined,
    transition: prefersReducedMotion 
      ? { duration: 0 } 
      : undefined,
  };
}
