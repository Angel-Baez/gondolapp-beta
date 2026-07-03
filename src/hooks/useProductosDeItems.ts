"use client";

import { obtenerProductosPorVarianteIds } from "@/services/catalogo";
import { useQuery } from "@tanstack/react-query";

/** Trae base+variante para un conjunto de varianteId, para renderizar listas de items. */
export function useProductosDeItems(varianteIds: string[]) {
  const idsOrdenados = [...varianteIds].sort();
  return useQuery({
    queryKey: ["catalogo", "por-variante-ids", idsOrdenados],
    queryFn: () => obtenerProductosPorVarianteIds(idsOrdenados),
    enabled: idsOrdenados.length > 0,
    // El catálogo (nombre/marca/tamaño de un producto) cambia muy rara vez
    // comparado con los items de las listas: evita refetch constante.
    staleTime: 10 * 60_000,
  });
}
