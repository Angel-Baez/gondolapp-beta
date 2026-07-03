"use client";

import { createPortal } from "react-dom";

/**
 * Monta sus hijos directamente en document.body, salteando el árbol de
 * ancestros del padre. Usado para elementos `fixed`/`absolute` que deben
 * posicionarse contra el viewport real, sin depender de que ningún
 * ancestro tenga un `transform` (rompe el containing block de `fixed`) o
 * un layout imprevisible (ej. un contenedor manipulado por una librería
 * de terceros).
 */
export function Portal({ children }: { children: React.ReactNode }) {
  if (typeof document === "undefined") return null;
  return createPortal(children, document.body);
}
