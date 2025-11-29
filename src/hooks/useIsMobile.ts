"use client";

import { useState, useEffect } from "react";

const MOBILE_BREAKPOINT = 640; // sm breakpoint in Tailwind

/**
 * Hook para detectar si estamos en un dispositivo móvil
 * Usa el breakpoint sm (640px) de Tailwind como referencia
 * 
 * @returns boolean - true si el ancho de pantalla es menor al breakpoint móvil
 */
export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Función para verificar el tamaño de pantalla
    const checkMobile = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };

    // Verificar al montar
    checkMobile();

    // Escuchar cambios de tamaño
    window.addEventListener("resize", checkMobile);

    return () => {
      window.removeEventListener("resize", checkMobile);
    };
  }, []);

  return isMobile;
}
