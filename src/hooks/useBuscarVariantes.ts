"use client";

import { buscarVariantes } from "@/services/catalogo";
import { useQuery } from "@tanstack/react-query";
import { useDebouncedValue } from "./useDebouncedValue";

/** Autocompletado de productos por nombre/marca, debounced y cacheado por término. */
export function useBuscarVariantes(termino: string) {
  const debounced = useDebouncedValue(termino.trim(), 250);

  return useQuery({
    queryKey: ["catalogo", "buscar", debounced],
    queryFn: () => buscarVariantes(debounced),
    enabled: debounced.length >= 2,
    staleTime: 5 * 60_000,
    placeholderData: (previous) => previous,
  });
}
