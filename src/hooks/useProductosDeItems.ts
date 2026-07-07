"use client";

import { obtenerProductosPorVarianteIdsLocal } from "@/lib/catalogoLocal";
import { useMemo } from "react";
import { useCatalogoCompleto } from "./useCatalogoCompleto";

/**
 * Trae base+variante para un conjunto de varianteId, para renderizar listas
 * de items. Deriva del catálogo completo ya cacheado (useCatalogoCompleto):
 * sin round-trip propio, funciona offline apenas el catálogo sincronizó.
 */
export function useProductosDeItems(varianteIds: string[]) {
  const idsOrdenados = [...varianteIds].sort();
  const idsKey = idsOrdenados.join(",");
  const { data: catalogo, isLoading: catalogoIsLoading, isFetching } = useCatalogoCompleto();

  // Depende de idsKey (string estable), no de idsOrdenados (array nuevo en
  // cada render) — evita recalcular si el conjunto de ids es el mismo.
  const data = useMemo(() => {
    if (!catalogo || idsOrdenados.length === 0) return undefined;
    return obtenerProductosPorVarianteIdsLocal(catalogo, idsOrdenados);
  }, [catalogo, idsKey]);

  return {
    data,
    isLoading: catalogoIsLoading && idsOrdenados.length > 0,
    isFetching,
  };
}
