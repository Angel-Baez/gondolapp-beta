"use client";

import { buscarVariantesLocal } from "@/lib/catalogoLocal";
import { useMemo } from "react";
import { useCatalogoCompleto } from "./useCatalogoCompleto";
import { useDebouncedValue } from "./useDebouncedValue";

/**
 * Autocompletado de productos por nombre/marca, debounced. Filtra el
 * catálogo completo ya cacheado (useCatalogoCompleto): instantáneo, sin
 * round-trip propio, funciona offline.
 */
export function useBuscarVariantes(termino: string) {
  const debounced = useDebouncedValue(termino.trim(), 250);
  const { data: catalogo, isLoading, isFetching } = useCatalogoCompleto();

  const data = useMemo(() => {
    if (!catalogo || debounced.length < 2) return [];
    return buscarVariantesLocal(catalogo, debounced);
  }, [catalogo, debounced]);

  return { data, isLoading, isFetching: isFetching && debounced.length >= 2 };
}
