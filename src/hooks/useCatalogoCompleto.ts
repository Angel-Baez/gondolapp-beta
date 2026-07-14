"use client";

import { useAuth } from "@/components/AuthProvider";
import { catalogoCompletoKey, SIN_TIENDA } from "@/lib/queryKeys";
import { obtenerCatalogoCompleto } from "@/services/catalogo";
import { useQuery } from "@tanstack/react-query";

/**
 * Todo el catálogo (bases + variantes + definiciones de atributos) de la
 * tienda activa en una sola query, persistida en IndexedDB: es la fuente
 * para lookup/búsqueda offline (ver src/lib/catalogoLocal.ts). staleTime
 * alto porque el catálogo cambia con poca frecuencia comparado con las
 * listas activas.
 */
export function useCatalogoCompleto() {
  const { tiendaActiva } = useAuth();
  return useQuery({
    queryKey: catalogoCompletoKey(tiendaActiva ?? SIN_TIENDA),
    queryFn: () => obtenerCatalogoCompleto(tiendaActiva!),
    enabled: !!tiendaActiva,
    staleTime: 30 * 60_000,
  });
}
