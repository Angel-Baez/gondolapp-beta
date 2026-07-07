"use client";

import { obtenerCatalogoCompleto } from "@/services/catalogo";
import { useQuery } from "@tanstack/react-query";

export const CATALOGO_COMPLETO_KEY = ["catalogo", "completo"] as const;

/**
 * Todo el catálogo (bases + variantes + definiciones de atributos) en una
 * sola query, persistida en IndexedDB: es la fuente para lookup/búsqueda
 * offline (ver src/lib/catalogoLocal.ts). staleTime alto porque el
 * catálogo cambia con poca frecuencia comparado con las listas activas.
 */
export function useCatalogoCompleto() {
  return useQuery({
    queryKey: CATALOGO_COMPLETO_KEY,
    queryFn: obtenerCatalogoCompleto,
    staleTime: 30 * 60_000,
  });
}
