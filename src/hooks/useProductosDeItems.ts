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
  });
}
