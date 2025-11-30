"use client";

import { useState, useEffect, useCallback } from "react";

/**
 * Helper para detectar si es móvil en el servidor (SSR) o cliente
 * Retorna un valor por defecto seguro para evitar hydration mismatch
 */
const getInitialMobileState = (): boolean => {
  // En SSR, retornar false para evitar hydration mismatch
  if (typeof window === "undefined") return false;
  return false; // Valor inicial consistente entre servidor y cliente
};

/**
 * Hook para detectar si el usuario está en un dispositivo móvil
 * Usa tanto el ancho de pantalla como el user agent para mejor precisión
 * 
 * @param breakpoint - Ancho máximo en píxeles para considerar "móvil" (default: 640px = Tailwind's 'sm')
 * @returns boolean indicando si es dispositivo móvil
 */
export function useIsMobile(breakpoint: number = 640): boolean {
  const [isMobile, setIsMobile] = useState(getInitialMobileState);

  const checkIsMobile = useCallback(() => {
    // Verificar por ancho de pantalla
    const isSmallScreen = window.innerWidth < breakpoint;
    
    // Verificar por user agent (para tablets que puedan tener pantallas más grandes)
    const isTouchDevice = 
      "ontouchstart" in window || 
      navigator.maxTouchPoints > 0;
    
    // Considerar móvil si es pantalla pequeña O si es dispositivo táctil con pantalla mediana
    setIsMobile(isSmallScreen || (isTouchDevice && window.innerWidth < 1024));
  }, [breakpoint]);

  useEffect(() => {
    // Verificar inicialmente
    checkIsMobile();

    // Escuchar cambios de tamaño de ventana
    window.addEventListener("resize", checkIsMobile);

    return () => {
      window.removeEventListener("resize", checkIsMobile);
    };
  }, [checkIsMobile]);

  return isMobile;
}
